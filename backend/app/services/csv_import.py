import csv
import json

from sqlalchemy.orm import Session

from app.models.professor import Professor


def import_professors_from_csv(csv_path: str, db: Session) -> tuple[int, int]:
    """Read a professors CSV and upsert rows. Returns (new_count, updated_count)."""
    new_count = 0
    updated_count = 0

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            research_list = [
                r.strip()
                for r in row["research_interests"].split(";")
                if r.strip()
            ]

            existing = (
                db.query(Professor).filter(Professor.email == row["email"]).first()
            )
            if existing:
                existing.name = row["name"]
                existing.department = row["department"]
                existing.faculty = row["faculty"]
                existing.research_interests = json.dumps(research_list)
                existing.profile_url = row.get("profile_url", "")
                updated_count += 1
            else:
                prof = Professor(
                    name=row["name"],
                    department=row["department"],
                    faculty=row["faculty"],
                    research_interests=json.dumps(research_list),
                    email=row["email"],
                    profile_url=row.get("profile_url", ""),
                )
                db.add(prof)
                new_count += 1

    db.commit()
    return new_count, updated_count
