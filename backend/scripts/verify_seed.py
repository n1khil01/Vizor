import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.client import get_supabase

sb = get_supabase()

pk = {"students": "profile_id", "course_prereqs": "course_code"}

for table in ["profiles", "students", "dars_reports", "dars_requirements", "dars_courses", "course_prereqs"]:
    count = sb.table(table).select(pk.get(table, "id"), count="exact").execute().count
    print(f"{table}: {count}")
