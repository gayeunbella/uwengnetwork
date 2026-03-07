# Product Requirements Document (PRD)

**Project:** UW Engineering Community Platform (Name TBD)
**Date:** March 7, 2026
**Team:** 3 people, 10 hour hackathon
**Stack:** FastAPI (Python backend), React + Tailwind CSS (frontend), Python web scraper (prof data)

---

## 1. Problem Statement

UW Engineering has world class talent fragmented across departments, co-op terms, and social circles. Students build impressive projects that nobody sees. Professors don't know what students are working on. Existing platforms fail this community: LinkedIn is performative and corporate, Discord is chaotic and ephemeral, Reddit is anonymous and unstructured. There is no dedicated space where UW engineers can share what they're building and connect with the people (students and profs) who care about the same problems.

## 2. Product Vision

A platform where UW engineers share what they're building and connect with the profs and students who care about the same things. The culture is: celebrate small wins, stay nerdy, no performative posting.

**Core principles:**
1. No public metrics. No visible like counts, no follower counts, no leaderboards.
2. Small wins > polished showcases. Dev logs, not seasonal LinkedIn announcements.
3. Nerd culture first. Dense with info, no fluff, no corporate energy.
4. Connection through work. People find each other by what they build and research, not by clout.

## 3. Target Users

**Primary: UW Engineering students**
Verified via WATCARD photo upload. A vision model (LLM with image input) reads the WATCARD and confirms "Engineering" text is present. No edge case handling for photoshop/fraud in MVP.

**Secondary: UW Professors**
Scraped from public UW department websites. Invited via email. Prof profiles are pre populated from scraped data (name, department, research interests, email). Profs can optionally claim and edit their profiles.

**Access model:**
Only verified UW Engineering students and invited professors can post, like, and DM. The platform is viewable by the public (recruiters, other students, etc.) but interaction requires verification.

## 4. MVP Features

### 4.1 Dev Log Feed (Main Screen)

**What it is:** A chronological feed of short project updates from UW Engineering students. Not polished project pages. Raw, real updates like "got my motor controller working today" or "week 2 of my ML pipeline, here's what broke."

**Post structure (database schema):**
```
DevLogPost {
  id: UUID
  author_id: UUID (FK to User)
  title: string (max 100 chars)
  body: text (max 2000 chars)
  media: array of image URLs (max 3 images, optional)
  tags: {
    project_stage: enum ["idea", "early_prototype", "working_prototype", "polished", "shipped"]
    category: enum ["hardware", "software", "both"]
    tech_stack: array of strings (freeform, max 5, e.g. ["Python", "Arduino", "TensorFlow"])
    field: array of enum ["sustainability", "ai_ml", "healthcare", "robotics", "fintech", "embedded", "web", "mobile", "data", "security", "other"]
  }
  created_at: datetime
  discrete_likes: array of user_ids (NOT public, only visible to post author)
  view_count: integer (NOT public, only visible to post author)
  prof_view_count: integer (NOT public, only visible to post author)
}
```

**Feed behavior:**
Default sort: reverse chronological (newest first).
Filters (sidebar or top bar): by project_stage, category, tech_stack, field.
Search: full text search on title and body.
Each post card shows: author name, department/year, title, body preview (first 200 chars), tags as pills, media thumbnails, time ago. NO like count. NO comment count.

**Frontend implementation notes:**
Use Tailwind for all styling. Feed layout is a single column, max-w-2xl centered. Post cards have a clean border (border border-gray-200 rounded-lg p-4). Tags rendered as small pills (text-xs px-2 py-1 rounded-full bg-gray-100). Keep it dense and information rich, not spacious and airy. Think GitHub issues list, not Instagram.

### 4.2 Discrete Likes

**What it is:** A user can "like" a post. The like is completely private. No public count is ever shown anywhere.

**Behavior:**
When a user likes a post, the post author receives a notification: "[User Name] checked out your project: [Post Title]".
The post author can see a list of everyone who liked their post (accessible from their own dashboard/post detail view).
The post author also sees aggregate stats on their own posts: "X people viewed this, Y are professors."
Nobody else can see who liked what or how many likes a post has.

**Purpose:** This is a warm intro mechanism. The like is a signal that says "I noticed you." The poster can then choose to DM that person.

**Frontend notes:**
Like button is subtle. Could be a small eye icon or a bookmark icon. Not a heart. Not a thumbs up. Keep the nerdy vibe. On hover, tooltip: "Let them know you noticed." On click, icon fills in. No animation, no count displayed.

### 4.3 Direct Messages (DMs)

**What it is:** One to one messaging between any two verified users on the platform.

**Behavior:**
Any verified user can DM any other verified user. No "connect" request needed.
DM thread is a simple chat interface. Text only for MVP (no media, no reactions).
Notification when you receive a new DM.

**Schema:**
```
Message {
  id: UUID
  sender_id: UUID (FK to User)
  receiver_id: UUID (FK to User)
  body: text (max 5000 chars)
  created_at: datetime
  read: boolean
}
```

**Frontend notes:**
Simple chat UI. Messages list on the left (like any messaging app), conversation on the right. Use Tailwind. Nothing fancy. If time is tight, DMs can be deprioritized to a "coming soon" stub with just the ability to see someone's email so you can reach out externally.

### 4.4 Professor Directory

**What it is:** A searchable, filterable list of UW Engineering professors. Data is pre populated from Bella's web scraper.

**Prof profile schema:**
```
Professor {
  id: UUID
  name: string
  department: string (e.g. "Electrical and Computer Engineering", "Mechanical and Mechatronics Engineering")
  faculty: string (e.g. "Engineering", "Math", "Science")
  research_interests: array of strings
  email: string
  profile_url: string (link to their UW page)
  scraped_at: datetime
  claimed: boolean (has the prof logged in and claimed their profile?)
}
```

**Behavior:**
Students can browse and search professors by name, department, or research interest keywords.
Clicking a prof shows their full profile with research interests and a "Send Message" button (DM or mailto link for MVP).
Profs who have been emailed and joined the platform can see student dev logs in their feed and like/DM students.

**Frontend notes:**
Grid or list layout. Search bar at top. Filter chips for department. Each prof card shows: name, department, 2 to 3 research interest tags. Clean, dense. Think of it like a faculty directory but actually usable.

### 4.5 WATCARD Verification

**What it is:** Onboarding gate. New users upload a photo of their WATCARD. A vision model analyzes the image and checks for the word "Engineering" on the card.

**Flow:**
1. User signs up with @uwaterloo.ca email.
2. User is prompted to upload a WATCARD photo.
3. Backend sends image to a vision capable LLM (e.g. Claude, GPT-4V, or a lightweight model).
4. Model returns a simple JSON: `{ "is_engineering": true/false, "confidence": 0.95, "extracted_text": "..." }`
5. If true, user is verified and can access the platform.
6. If false, user sees "We couldn't verify your Engineering status. Please try again with a clearer photo."

**Backend implementation notes (FastAPI):**
Create an endpoint `POST /api/verify-watcard` that accepts an image upload (multipart/form-data).
Send the image to the vision API with a system prompt like: "Analyze this student ID card image. Determine if this is a University of Waterloo WATCARD belonging to a Faculty of Engineering student. Return JSON with fields: is_engineering (boolean), confidence (float 0 to 1), extracted_text (string of all readable text)."
Store verification status on the User model.

**Edge cases to ignore for MVP:** Photoshopped cards, expired cards, graduate students vs undergrad, co-op students with different card formats.

### 4.6 User Profiles

**Schema:**
```
User {
  id: UUID
  email: string (must be @uwaterloo.ca)
  name: string
  department: string
  year: integer (1 to 5, or "grad")
  bio: text (max 500 chars, optional)
  profile_picture: URL (optional, from WATCARD or uploaded)
  is_verified: boolean
  is_professor: boolean
  created_at: datetime
}
```

**Profile page shows:** Name, department, year, bio, and a list of their dev log posts (reverse chronological).

### 4.7 Notifications Dashboard

**What it is:** A simple notification feed visible to the post author only.

**Notification types:**
"[Name] checked out your project: [Post Title]" (from discrete likes)
"[Name] sent you a message" (from DMs)
Aggregate: "Your post [Title] was viewed by X people (Y professors) this week"

**Frontend notes:**
Bell icon in the nav bar with a red dot for unread. Dropdown panel or separate page showing notification list. Simple, no over engineering.

## 5. Information Architecture and Page Map

```
/ (Landing page if logged out, Feed if logged in)
/signup (email + WATCARD upload)
/login
/feed (Dev Log Feed with filters)
/post/new (Create a new dev log post)
/post/:id (Single post detail view)
/profile/:id (User or Prof profile)
/professors (Professor directory with search/filter)
/messages (DM inbox)
/messages/:userId (DM thread with a specific user)
/notifications (Notification feed)
/settings (Basic account settings)
```

## 6. API Endpoints (FastAPI)

```
AUTH:
POST   /api/auth/signup          (email, password, name, department, year)
POST   /api/auth/login           (email, password) -> JWT token
POST   /api/auth/verify-watcard  (image upload) -> verification result

POSTS:
GET    /api/posts                (query params: stage, category, tech, field, search, page)
POST   /api/posts                (title, body, media, tags) -> new post
GET    /api/posts/:id            (single post with like details if you are the author)
DELETE /api/posts/:id            (only your own posts)

LIKES:
POST   /api/posts/:id/like       (toggle like on a post)
GET    /api/posts/:id/likes      (only accessible by post author, returns list of users who liked)

USERS:
GET    /api/users/:id            (public profile)
GET    /api/users/:id/posts      (all posts by a user)

PROFESSORS:
GET    /api/professors           (query params: department, search, page)
GET    /api/professors/:id       (single prof profile)

MESSAGES:
GET    /api/messages             (list of DM threads)
GET    /api/messages/:userId     (messages in a thread)
POST   /api/messages/:userId     (send a message)

NOTIFICATIONS:
GET    /api/notifications        (list, query param: unread)
POST   /api/notifications/read   (mark as read)
```

## 7. Tech Stack Details

**Backend (you):**
FastAPI (Python). SQLite for MVP (no need for Postgres in a hackathon). SQLAlchemy or raw SQL. Pydantic models for request/response validation. JWT for auth (python-jose or similar). CORS middleware enabled for frontend dev.

**Frontend (Reanna):**
React (Vite for scaffolding). Tailwind CSS for all styling. React Router for navigation. Fetch or axios for API calls. No state management library needed for MVP, just useState/useContext.

**Web Scraper (Bella):**
Python (requests + BeautifulSoup or Scrapy). Target: public UW faculty directory pages across all engineering departments. Output: CSV or direct database insert with prof name, department, research interests, email, profile URL. Also scrape relevant profs from Math/Science faculties who teach engineering courses.

**WATCARD Verification:**
Any vision capable LLM API. Send image, get back structured JSON. If API costs are a concern, this can be a manual verification step for MVP (upload photo, admin reviews). But automated is more impressive for the pitch.

## 8. Design System (for Frontend Agent / Reanna)

**Philosophy:** Dense, information rich, nerdy. NOT spacious, NOT airy, NOT corporate. Think GitHub/Hacker News energy, not LinkedIn/Dribbble.

**Color palette:**
Primary: slate-900 (near black text), white background.
Accent: emerald-500 or teal-500 (for interactive elements, links, buttons). Pick one and stay consistent.
Secondary: gray-100 for card backgrounds, gray-200 for borders, gray-500 for secondary text.
No gradients. No shadows except subtle shadow-sm on cards.

**Typography:**
Use a monospace or semi-monospace font for headings to reinforce the nerdy/dev vibe. Body text in a clean sans-serif (Inter or system default).
Tailwind classes: font-mono for headings, text-sm as default body size, text-xs for metadata.

**Components:**
Post cards: `border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition`. Dense layout, no extra whitespace.
Tag pills: `text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700`. For field specific tags, use colored variants (e.g. `bg-emerald-100 text-emerald-700` for sustainability).
Buttons: Primary is `bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700`. Secondary is `border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50`.
Nav bar: Fixed top, `bg-white border-b border-gray-200`. Logo left, nav links center, notification bell + profile right.
Like button: Small, subtle. An eye icon (Lucide "eye" icon) that fills on click. No count displayed next to it.

**Responsive:**
Mobile responsive. Feed is full width on mobile with p-3. Prof directory switches from grid to stacked list on mobile. DMs go full screen on mobile (no split panel).

## 9. Pitch Notes (for Dean Presentation at 1:00 PM)

**One liner:** "We're building the platform where UW engineers share what they're building and connect with the profs and students who care about the same things."

**Key talking points:**
1. UW Engineering talent is fragmented. Students build amazing things in isolation. This platform makes that work visible.
2. Unlike LinkedIn, there are no public metrics. No likes, no follower counts. The culture is celebrating small wins, not performing for clout.
3. The professor connection feature bridges the gap between students and faculty. Students can discover profs by research interest. Profs can discover student talent organically.
4. Verification via WATCARD keeps it exclusive to Engineering. This isn't another generic social network.
5. If the Dean integrates this, it becomes a living showcase of what UW Engineering students are building, useful for prospective students, recruiters, and university marketing.

**What to demo:**
The dev log feed with a few sample posts.
The filter system (show filtering by "hardware" + "robotics").
A professor profile page.
The discrete like notification ("3 people viewed your project, 1 is a professor").

**What to have ready as answers:**
"How do you prevent it from becoming LinkedIn?" > No public metrics. Discrete likes only. Dev log format encourages raw updates, not polished announcements.
"How do you get students to use it?" > Professor access is the hook. Students sign up to connect with profs. The project feed is what keeps them.
"What about other faculties?" > Start with Engineering, expand later. The WATCARD verification system can be adapted for other faculties.

## 10. Task Breakdown (10 hours, 3 people)

**You (Backend, FastAPI):**
Hours 1 to 2: Project setup. FastAPI scaffold, SQLite database, User and Post models, auth endpoints (signup, login, JWT).
Hours 3 to 4: Post CRUD endpoints, filter/search logic, like toggle endpoint.
Hours 5 to 6: Professor model, bulk import from Bella's CSV, professor search/filter endpoints.
Hours 7 to 8: DM endpoints, notification logic.
Hours 9 to 10: WATCARD verification endpoint (vision API integration), bug fixes, deploy.

**Reanna (Frontend, React + Tailwind):**
Hours 1 to 2: Vite + React + Tailwind setup, routing, layout scaffold (nav bar, page shells), auth pages (signup/login forms).
Hours 3 to 4: Dev log feed page (post cards, filter sidebar, search bar). Use mock data initially.
Hours 5 to 6: Post creation form, single post detail page, professor directory page.
Hours 7 to 8: User profile page, DM interface (basic chat UI), notification dropdown.
Hours 9 to 10: WATCARD upload flow in signup, connect to real API endpoints, polish, mobile responsive pass.

**Bella (Scraper + Prof Outreach):**
Hours 1 to 3: Build scraper for UW Engineering faculty pages. Target all engineering departments + key profs from Math/Science. Output to CSV.
Hours 3 to 4: Draft and send email to scraped professors. Short, respectful, 3 sentences.
Hours 4 to 6: Help with frontend or backend integration. Import CSV into database.
Hours 6 to 10: QA, help prepare demo data (seed realistic dev log posts), help prepare pitch deck/talking points.

## 11. Out of Scope (Explicitly Not Building)

No public like counts or follower counts, ever.
No comments on posts.
No leaderboards or rankings.
No Leetcode integration.
No team projects or team leagues.
No alumni section.
No recruiter portal.
No future student Q&A.
No image/media in DMs.
No email notifications (in app only).
No password reset flow (manual for MVP).
No admin panel (seed data via scripts).
