"""
CLI script to import professors from a CSV file into the database.

Usage:
    python import_professors.py professors.csv

CSV format (header row required):
    name,department,faculty,research_interests,email,profile_url

research_interests uses semicolons as delimiters, e.g.:
    "robotics;control systems;mechatronics"
"""
import sys

from app.database import Base, SessionLocal, engine
from app.services.csv_import import import_professors_from_csv

# Register all models
import app.models  # noqa: F401


def main():
    if len(sys.argv) != 2:
        print("Usage: python import_professors.py professors.csv")
        sys.exit(1)

    csv_path = sys.argv[1]
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        new_count, updated_count = import_professors_from_csv(csv_path, db)
        print(f"Imported {new_count} new professors, updated {updated_count} existing.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
