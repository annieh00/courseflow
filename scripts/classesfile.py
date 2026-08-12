import json
import pandas as pd

# Load JSON data from a file or directly from a variable
# If your JSON is in a file:
with open("courses.json", "r", encoding="utf-8") as f:
    courses = json.load(f)

# OR if you already have it as a Python list called `courses`, skip the above

# Convert to DataFrame
df = pd.DataFrame(courses)

# Optional: reorder columns
columns_order = [
    "subject",
    "course_number",
    "title",
    "description",
    "level",
    "section_number",
    "instructors",
    "meeting_patterns",
    "locations",
    "open_seats"
]
df = df[columns_order]

# Export to Excel
df.to_excel("courses.xlsx", index=False, engine='openpyxl')

print(f"Excel file created with {len(df)} courses: courses.xlsx")
