# Technical Requirements Specification: Backend

**Target:** Claude Code (or any coding agent) should be able to build the entire FastAPI backend from this document alone, paired with the PRD.
**Stack:** Python 3.11+, FastAPI, SQLAlchemy ORM, SQLite, Pydantic v2
**Run command:** `uvicorn app.main:app --reload --port 8000`

---

## 1. Project Structure

```
backend/
  app/
    __init__.py
    main.py              # FastAPI app, CORS, lifespan, static mount
    config.py            # Settings via pydantic-settings (env vars)
    database.py          # SQLAlchemy engine, session, Base
    auth.py              # JWT creation, password hashing, dependency
    models/
      __init__.py
      user.py            # User ORM model
      post.py            # DevLogPost, PostLike ORM models
      professor.py       # Professor ORM model
      message.py         # Message ORM model
      notification.py    # Notification ORM model
    schemas/
      __init__.py
      user.py            # Pydantic request/response schemas for users
      post.py            # Pydantic schemas for posts
      professor.py       # Pydantic schemas for professors
      message.py         # Pydantic schemas for messages
      notification.py    # Pydantic schemas for notifications
      auth.py            # Pydantic schemas for auth (login, signup, token)
    routers/
      __init__.py
      auth.py            # /api/auth/* endpoints
      posts.py           # /api/posts/* endpoints
      professors.py      # /api/professors/* endpoints
      messages.py        # /api/messages/* endpoints
      notifications.py   # /api/notifications/* endpoints
      users.py           # /api/users/* endpoints
    services/
      __init__.py
      watcard.py         # WATCARD verification logic (vision API or stub)
      csv_import.py      # Professor CSV import script
    uploads/             # Static file directory for uploaded images
  .env                   # Environment variables
  requirements.txt
  import_professors.py   # CLI script: python import_professors.py professors.csv
```

## 2. Environment Variables (.env)

```
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
WATCARD_VERIFICATION_ENABLED=false
VISION_API_KEY=
VISION_API_PROVIDER=claude
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
UPLOAD_DIR=./uploads
```

`WATCARD_VERIFICATION_ENABLED`: when `false`, the verify endpoint always returns `is_engineering: true`. When `true`, it calls the vision API specified by `VISION_API_PROVIDER`.

## 3. Database Models (SQLAlchemy ORM)

All models use UUID as primary key (stored as string in SQLite). All timestamps are UTC.

### 3.1 User

```python
class User(Base):
    __tablename__ = "users"

    id: str              # UUID4 as string, primary key, default=uuid4()
    email: str           # unique, indexed, must end with @uwaterloo.ca
    password_hash: str   # bcrypt hashed
    name: str            # display name
    department: str      # e.g. "Electrical and Computer Engineering"
    year: str            # "1", "2", "3", "4", "5", "grad"
    bio: str             # optional, max 500 chars, default=""
    profile_picture: str # optional, URL/path to image, default=""
    is_verified: bool    # default=False, set to True after WATCARD check
    is_professor: bool   # default=False
    created_at: datetime # default=utcnow
```

### 3.2 DevLogPost

```python
class DevLogPost(Base):
    __tablename__ = "posts"

    id: str              # UUID4 as string, primary key
    author_id: str       # FK to users.id, indexed
    title: str           # max 100 chars
    body: str            # max 2000 chars
    media: str           # JSON array of image URL strings, default="[]"
    project_stage: str   # enum: "idea", "early_prototype", "working_prototype", "polished", "shipped"
    category: str        # enum: "hardware", "software", "both"
    tech_stack: str      # JSON array of strings, max 5 items, default="[]"
    field: str           # JSON array of enum strings, default="[]"
                         # allowed values: "sustainability", "ai_ml", "healthcare", "robotics",
                         # "fintech", "embedded", "web", "mobile", "data", "security", "other"
    view_count: int      # default=0
    prof_view_count: int # default=0
    created_at: datetime # default=utcnow

    # relationships
    author: User         # relationship to User
    likes: list[PostLike] # relationship to PostLike
```

Note: `media`, `tech_stack`, and `field` are stored as JSON strings in SQLite. Parse with `json.loads()` on read, `json.dumps()` on write.

### 3.3 PostLike

```python
class PostLike(Base):
    __tablename__ = "post_likes"

    id: str              # UUID4 as string, primary key
    post_id: str         # FK to posts.id, indexed
    user_id: str         # FK to users.id, indexed
    created_at: datetime # default=utcnow

    # unique constraint on (post_id, user_id) to prevent double likes
```

### 3.4 Professor

```python
class Professor(Base):
    __tablename__ = "professors"

    id: str                  # UUID4 as string, primary key
    name: str                # full name
    department: str          # e.g. "Mechanical and Mechatronics Engineering"
    faculty: str             # e.g. "Engineering", "Math", "Science"
    research_interests: str  # JSON array of strings, default="[]"
    email: str               # unique, indexed
    profile_url: str         # link to their UW faculty page, default=""
    claimed: bool            # default=False (has a real user account linked?)
    claimed_user_id: str     # optional FK to users.id, null until claimed
    scraped_at: datetime     # default=utcnow
```

### 3.5 Message

```python
class Message(Base):
    __tablename__ = "messages"

    id: str              # UUID4 as string, primary key
    sender_id: str       # FK to users.id, indexed
    receiver_id: str     # FK to users.id, indexed
    body: str            # max 5000 chars
    is_read: bool        # default=False
    created_at: datetime # default=utcnow
```

### 3.6 Notification

```python
class Notification(Base):
    __tablename__ = "notifications"

    id: str              # UUID4 as string, primary key
    user_id: str         # FK to users.id, indexed (the recipient)
    type: str            # enum: "like", "message", "view_summary"
    title: str           # e.g. "Sarah Chen checked out your project"
    body: str            # e.g. "Your post 'Motor Controller v2' was noticed"
    reference_id: str    # optional, the post_id or message_id this relates to
    is_read: bool        # default=False
    created_at: datetime # default=utcnow
```

## 4. Pydantic Schemas (Request/Response)

All response schemas use `model_config = ConfigDict(from_attributes=True)` for ORM compatibility.

### 4.1 Auth Schemas

```python
class SignupRequest(BaseModel):
    email: str           # must match *@uwaterloo.ca regex
    password: str        # min 6 chars
    name: str
    department: str
    year: str            # "1" through "5" or "grad"

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic      # return user data with the token

class WatcardVerifyResponse(BaseModel):
    is_engineering: bool
    confidence: float
    extracted_text: str
```

### 4.2 User Schemas

```python
class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    department: str
    year: str
    bio: str
    profile_picture: str
    is_verified: bool
    is_professor: bool
    created_at: datetime

class UserUpdate(BaseModel):
    name: str | None = None
    department: str | None = None
    year: str | None = None
    bio: str | None = None
```

### 4.3 Post Schemas

```python
class PostCreate(BaseModel):
    title: str           # max 100
    body: str            # max 2000
    project_stage: str   # must be valid enum value
    category: str        # must be valid enum value
    tech_stack: list[str] = []   # max 5 items
    field: list[str] = []        # each must be valid enum value

# Note: media is handled via multipart form upload, not JSON body

class PostPublic(BaseModel):
    """What any user sees when browsing the feed."""
    id: str
    author: UserPublic
    title: str
    body: str
    media: list[str]
    project_stage: str
    category: str
    tech_stack: list[str]
    field: list[str]
    created_at: datetime
    # NO like count, NO view count in public response

class PostAuthorView(PostPublic):
    """What the post author sees. Extends PostPublic with private stats."""
    view_count: int
    prof_view_count: int
    likes: list[UserPublic]     # full list of users who liked

class PostListResponse(BaseModel):
    posts: list[PostPublic]
    total: int
    page: int
    page_size: int
```

### 4.4 Professor Schemas

```python
class ProfessorPublic(BaseModel):
    id: str
    name: str
    department: str
    faculty: str
    research_interests: list[str]
    email: str
    profile_url: str
    claimed: bool

class ProfessorListResponse(BaseModel):
    professors: list[ProfessorPublic]
    total: int
    page: int
    page_size: int
```

### 4.5 Message Schemas

```python
class MessageSend(BaseModel):
    body: str            # max 5000 chars

class MessagePublic(BaseModel):
    id: str
    sender: UserPublic
    receiver: UserPublic
    body: str
    is_read: bool
    created_at: datetime

class ThreadPreview(BaseModel):
    """One entry in the DM inbox list."""
    other_user: UserPublic
    last_message: MessagePublic
    unread_count: int
```

### 4.6 Notification Schemas

```python
class NotificationPublic(BaseModel):
    id: str
    type: str
    title: str
    body: str
    reference_id: str
    is_read: bool
    created_at: datetime

class NotificationListResponse(BaseModel):
    notifications: list[NotificationPublic]
    unread_count: int
```

## 5. API Endpoints (Full Specification)

All endpoints are prefixed with `/api`. All protected endpoints require `Authorization: Bearer <jwt_token>` header. Use a FastAPI dependency `get_current_user` that decodes the JWT and returns the User ORM object. Return 401 if token is missing/invalid. Return 403 if user is not verified (for endpoints that require verification).

### 5.1 Auth Router (`/api/auth`)

**POST `/api/auth/signup`**
Request body: `SignupRequest`
Behavior:
  1. Validate email ends with `@uwaterloo.ca`. Return 400 if not.
  2. Check email is not already registered. Return 409 if exists.
  3. Hash password with bcrypt.
  4. Create User with `is_verified=False`.
  5. Return `TokenResponse` with JWT and user data.

**POST `/api/auth/login`**
Request body: `LoginRequest`
Behavior:
  1. Find user by email. Return 401 if not found.
  2. Verify password against hash. Return 401 if wrong.
  3. Return `TokenResponse`.

**POST `/api/auth/verify-watcard`**
Auth: required (must be logged in)
Request: multipart/form-data with `file` field (image)
Behavior:
  1. Save uploaded image to `UPLOAD_DIR/watcards/{user_id}.jpg`
  2. If `WATCARD_VERIFICATION_ENABLED` is false: return `WatcardVerifyResponse(is_engineering=True, confidence=1.0, extracted_text="STUB MODE")`
  3. If enabled: send image to vision API with prompt (see section 7.1), parse response.
  4. If `is_engineering` is true: update `user.is_verified = True` in database.
  5. Return `WatcardVerifyResponse`.

### 5.2 Posts Router (`/api/posts`)

**GET `/api/posts`**
Auth: none (public feed)
Query params:
  `page`: int, default=1
  `page_size`: int, default=20, max=50
  `stage`: optional string (filter by project_stage)
  `category`: optional string (filter by category)
  `tech`: optional string (filter posts where tech_stack JSON contains this string, case insensitive)
  `field`: optional string (filter posts where field JSON contains this value)
  `search`: optional string (full text search on title and body, case insensitive LIKE query)
  `author_id`: optional string (filter by author)
Response: `PostListResponse`
Behavior:
  1. Build SQLAlchemy query with filters applied.
  2. Order by `created_at` descending.
  3. Paginate.
  4. Return posts with author data joined. NEVER include like count or view count in this response.

**POST `/api/posts`**
Auth: required, must be verified
Request: multipart/form-data with fields:
  `title`: string
  `body`: string
  `project_stage`: string
  `category`: string
  `tech_stack`: JSON string (e.g. `'["Python","Arduino"]'`)
  `field`: JSON string (e.g. `'["ai_ml","robotics"]'`)
  `images`: optional, up to 3 image files
Behavior:
  1. Validate all enum fields against allowed values. Return 422 if invalid.
  2. Save uploaded images to `UPLOAD_DIR/posts/{post_id}/` with sequential names.
  3. Store image paths as JSON array in `media` column.
  4. Create post, return `PostPublic`.

**GET `/api/posts/{post_id}`**
Auth: optional
Behavior:
  1. Fetch post by ID. Return 404 if not found.
  2. If the requester is the post author: return `PostAuthorView` (includes view_count, prof_view_count, likes list).
  3. If the requester is any other authenticated user: increment `view_count` by 1. If the user `is_professor`, also increment `prof_view_count`. Return `PostPublic`.
  4. If no auth: return `PostPublic`.

**DELETE `/api/posts/{post_id}`**
Auth: required
Behavior:
  1. Fetch post. Return 404 if not found.
  2. If `post.author_id != current_user.id`: return 403.
  3. Delete post and associated likes. Return 204.

### 5.3 Likes Router (nested under posts)

**POST `/api/posts/{post_id}/like`**
Auth: required, must be verified
Response: `{ "liked": true }` or `{ "liked": false }`
Behavior:
  1. Fetch post. Return 404 if not found.
  2. Check if a PostLike already exists for this user + post.
  3. If exists: delete it (unlike), return `{ "liked": false }`.
  4. If not exists: create PostLike, create a Notification for the post author with type="like", title="{current_user.name} checked out your project", body="Your post '{post.title}' was noticed", reference_id=post.id. Return `{ "liked": true }`.
  5. A user should NOT be able to like their own post. Return 400 if attempted.

**GET `/api/posts/{post_id}/likes`**
Auth: required
Behavior:
  1. Fetch post. Return 404 if not found.
  2. If `post.author_id != current_user.id`: return 403 (only author can see likes).
  3. Return list of `UserPublic` for all users who liked.

### 5.4 Users Router (`/api/users`)

**GET `/api/users/{user_id}`**
Auth: none (public)
Response: `UserPublic`
Behavior: fetch user, return 404 if not found.

**GET `/api/users/{user_id}/posts`**
Auth: none (public)
Query params: `page`, `page_size`
Response: `PostListResponse`
Behavior: return all posts by this user, paginated, reverse chronological.

**PATCH `/api/users/me`**
Auth: required
Request body: `UserUpdate`
Behavior: update only the fields that are not None. Return updated `UserPublic`.

### 5.5 Professors Router (`/api/professors`)

**GET `/api/professors`**
Auth: none (public)
Query params:
  `page`: int, default=1
  `page_size`: int, default=20, max=50
  `department`: optional string (exact match)
  `faculty`: optional string (exact match)
  `search`: optional string (case insensitive LIKE on name and research_interests JSON)
Response: `ProfessorListResponse`

**GET `/api/professors/{professor_id}`**
Auth: none (public)
Response: `ProfessorPublic`

### 5.6 Messages Router (`/api/messages`)

**GET `/api/messages`**
Auth: required, must be verified
Response: `list[ThreadPreview]`
Behavior:
  1. Find all distinct users the current user has exchanged messages with.
  2. For each, get the latest message and count of unread messages from that user.
  3. Sort by most recent message first.

**GET `/api/messages/{user_id}`**
Auth: required, must be verified
Query params: `page`, `page_size` (default 50)
Response: `list[MessagePublic]`
Behavior:
  1. Fetch all messages between current_user and user_id, ordered by created_at ascending.
  2. Mark all messages FROM user_id TO current_user as `is_read=True`.
  3. Paginate.

**POST `/api/messages/{user_id}`**
Auth: required, must be verified
Request body: `MessageSend`
Response: `MessagePublic`
Behavior:
  1. Validate receiver exists. Return 404 if not.
  2. Create message.
  3. Create Notification for receiver: type="message", title="{current_user.name} sent you a message", reference_id=message.id.
  4. Return the created message.

### 5.7 Notifications Router (`/api/notifications`)

**GET `/api/notifications`**
Auth: required
Query params:
  `unread`: optional bool (if true, only return unread)
  `page`: int, default=1
  `page_size`: int, default=20
Response: `NotificationListResponse`
Behavior: return notifications for current_user, ordered by created_at descending.

**POST `/api/notifications/read`**
Auth: required
Request body: `{ "notification_ids": list[str] }` or `{ "all": true }`
Behavior:
  If `all` is true: mark all of current user's notifications as read.
  Otherwise: mark only the specified notification_ids as read (verify they belong to current_user).
  Return `{ "success": true }`.

## 6. Auth Implementation Details

**Password hashing:** Use `passlib[bcrypt]` with `CryptContext(schemes=["bcrypt"])`.

**JWT tokens:** Use `python-jose[cryptography]`.
Payload: `{ "sub": user.id, "exp": datetime_expiry }`
Expiry: 1440 minutes (24 hours) by default, configurable via env.
Sign with HS256 and SECRET_KEY.

**`get_current_user` dependency:**
  1. Extract token from `Authorization: Bearer <token>` header.
  2. Decode JWT payload.
  3. Fetch user by ID from database.
  4. Return User ORM object.
  5. If any step fails, raise `HTTPException(401)`.

**`require_verified` dependency:**
  1. Call `get_current_user`.
  2. If `user.is_verified` is False, raise `HTTPException(403, detail="WATCARD verification required")`.
  3. Return user.

**Optional auth dependency (`get_optional_user`):**
  1. Try to extract and decode token.
  2. If present and valid, return User.
  3. If missing or invalid, return None (do not raise).
  Used for endpoints like GET `/api/posts/{post_id}` where auth is optional but changes the response.

## 7. WATCARD Verification Service

### 7.1 Vision API Prompt

When `WATCARD_VERIFICATION_ENABLED=true`, send the uploaded image to the vision API with this system prompt:

```
You are analyzing a student ID card image. Determine if this is a University of Waterloo WATCARD belonging to a Faculty of Engineering student.

Look for:
1. The text "University of Waterloo" or the UW logo
2. The word "Engineering" anywhere on the card (this indicates Faculty of Engineering)

Return ONLY a JSON object with no other text:
{
  "is_engineering": true or false,
  "confidence": 0.0 to 1.0,
  "extracted_text": "all readable text from the card"
}
```

### 7.2 API Call (Claude)

```python
import anthropic

client = anthropic.Anthropic(api_key=settings.VISION_API_KEY)
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=256,
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": base64_image}},
            {"type": "text", "text": system_prompt}
        ]
    }]
)
# Parse JSON from message.content[0].text
```

### 7.3 Stub Mode

When `WATCARD_VERIFICATION_ENABLED=false`:
```python
return WatcardVerifyResponse(is_engineering=True, confidence=1.0, extracted_text="STUB_MODE_ENABLED")
```

## 8. Professor CSV Import

### 8.1 CSV Format (Bella must match this exactly)

```csv
name,department,faculty,research_interests,email,profile_url
"Pearl Sullivan","Mechanical and Mechatronics Engineering","Engineering","robotics;control systems;mechatronics","p3sulliv@uwaterloo.ca","https://uwaterloo.ca/mechanical-mechatronics-engineering/profile/p3sulliv"
"Catherine Rosenberg","Electrical and Computer Engineering","Engineering","network optimization;wireless networks","cath@uwaterloo.ca","https://uwaterloo.ca/electrical-computer-engineering/profile/cath"
"Mark Giesbrecht","Computer Science","Math","computer algebra;symbolic computation","mwg@uwaterloo.ca","https://cs.uwaterloo.ca/~mwg/"
```

Rules:
  `research_interests` uses semicolons as delimiters within the field.
  `faculty` should be "Engineering", "Math", "Science", or "Health" depending on where the prof's department sits.
  All fields are required. If `profile_url` is unknown, use empty string.

### 8.2 Import Script (`import_professors.py`)

```
Usage: python import_professors.py professors.csv

Behavior:
  1. Read CSV with csv.DictReader.
  2. For each row:
     a. Split research_interests by ";" into a list.
     b. Check if a professor with this email already exists. If yes, update. If no, insert.
     c. Store research_interests as JSON array string.
  3. Print summary: "Imported X new professors, updated Y existing."
```

## 9. Static File Serving

Mount the uploads directory as a static path so the frontend can reference images directly.

```python
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

Image URLs stored in the database will be relative paths like `/uploads/posts/{post_id}/0.jpg`. The frontend prepends the backend base URL.

Directory structure:
```
uploads/
  watcards/
    {user_id}.jpg
  posts/
    {post_id}/
      0.jpg
      1.jpg
      2.jpg
  profiles/
    {user_id}.jpg
```

## 10. CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 11. Database Initialization

On app startup (use FastAPI lifespan):
  1. Create all tables with `Base.metadata.create_all(bind=engine)`.
  2. Create upload directories if they don't exist.

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    os.makedirs("uploads/watcards", exist_ok=True)
    os.makedirs("uploads/posts", exist_ok=True)
    os.makedirs("uploads/profiles", exist_ok=True)
    yield
```

Use synchronous SQLAlchemy engine with SQLite (no need for async with SQLite in a hackathon):
```python
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

Database session dependency:
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## 12. requirements.txt

```
fastapi==0.115.0
uvicorn==0.30.0
sqlalchemy==2.0.35
pydantic==2.9.0
pydantic-settings==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.12
anthropic==0.39.0
```

## 13. Frontend Integration Contract

This section tells Reanna (and her coding agent) exactly how to talk to the backend.

**Base URL:** `http://localhost:8000` (dev)

**Auth pattern:**
Store the JWT from login/signup in localStorage.
Send on every request: `headers: { "Authorization": "Bearer " + token }`

**Image upload pattern (post creation):**
```javascript
const formData = new FormData();
formData.append("title", title);
formData.append("body", body);
formData.append("project_stage", stage);
formData.append("category", category);
formData.append("tech_stack", JSON.stringify(techStack));
formData.append("field", JSON.stringify(fields));
images.forEach(img => formData.append("images", img));

fetch("/api/posts", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
```

**Image display pattern:**
```javascript
// media array from post response contains paths like "/uploads/posts/{id}/0.jpg"
<img src={`http://localhost:8000${mediaPath}`} />
```

**Pagination pattern:**
All list endpoints return `{ items: [...], total: int, page: int, page_size: int }`.
Request next page: `?page=2&page_size=20`

**Error response format (consistent across all endpoints):**
```json
{
  "detail": "Human readable error message"
}
```
HTTP status codes: 400 (bad request), 401 (not authenticated), 403 (not authorized/not verified), 404 (not found), 409 (conflict, e.g. email taken), 422 (validation error).
