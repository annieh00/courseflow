import requests
import json
import pandas as pd
import time
import os

#### COnfig
BASE_URL = "https://api.classes.iastate.edu/api"
script_dir = os.path.dirname(os.path.abspath(__file__))
repo_root = os.path.dirname(script_dir)
output_folder = os.path.join(repo_root, "Documents")
os.makedirs(output_folder, exist_ok=True)

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://classes.iastate.edu",
    "Referer": "https://classes.iastate.edu/",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
}

# delay to not overwhelm API
DELAY = 0.2

# Fetch all academic periods
periods_url = f"{BASE_URL}/academic-periods"
try:
    periods_response = requests.get(periods_url, headers=HEADERS, timeout=10)
    periods_response.raise_for_status()  # Raises an exception for bad status codes
except requests.exceptions.RequestException as e:
    print(f"Failed to fetch academic periods: {e}")
    exit()

periods_data = periods_response.json().get("data", [])
if not periods_data:
    print("No academic periods found.")
    exit()

period_id_to_name = {p["id"]: p["name"] for p in periods_data}
academic_periods = list(period_id_to_name.keys())

# Parse period to make it look better
def parse_period_name(full_name):
    parts = full_name.split()
    if len(parts) >= 2:
        return f"{parts[1]} {parts[0]}"
    return full_name

print(f"Found {len(academic_periods)} academic periods: {[parse_period_name(period_id_to_name[p]) for p in academic_periods]}")


############ Grab courses for each period and subject

all_courses = []
SEARCH_URL = f"{BASE_URL}/courses/search"

for period_idx, period_id in enumerate(academic_periods, start=1):
    readable_period = parse_period_name(period_id_to_name[period_id])
    print(f"\n[{period_idx}/{len(academic_periods)}] Academic period: {readable_period}")

    # Fetch subjects
    subjects_url = f"{BASE_URL}/course-subjects?academicPeriod={period_id}"
    try:
        subjects_response = requests.get(subjects_url, headers=HEADERS, timeout=10)
        subjects_response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"  Failed to fetch subjects for {readable_period}: {e}")
        continue

    subjects_data = subjects_response.json().get("data", [])
    if not subjects_data:
        print(f"  No subjects found for {readable_period}")
        continue

    subjects = subjects_data
    print(f"  Found {len(subjects)} subjects for period {readable_period}")


    for subj_idx, subject in enumerate(subjects, start=1):
        payload = {
            "academicPeriodId": period_id,
            "courseSubject": subject,
            "courseNumber": "",
            "level": None,
            "requirement": None,
            "instructor": "",
            "semesterTag": None,
            "credits": None,
            "openSeats": False,
            "daysOfTheWeek": [],
            "sectionStartDate": None,
            "sectionEndDate": None,
            "title": "",
            "deliveryMode": None,
            "allowedGradingBases": []
        }

        print(f"    [{subj_idx}/{len(subjects)}] Fetching courses for subject: {subject}")
        try:
            response = requests.post(SEARCH_URL, json=payload, headers=HEADERS, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"      Failed to fetch courses for {subject}: {e}")
            continue

        courses_data = response.json().get("data", [])

        for course in courses_data:
            title = course.get("title", "")
            level = course.get("level")

            # Extract prerequisites
            prereqs = set()

            # 1. From each section (if any)
            for section in course.get("sections", []):
                if section.get("prereq"):
                    prereqs.add(section["prereq"])

            # 2. From courseBubbleInfo (if present)
            info = course.get("courseBubbleInfo", "")
            if "Prereq" in info:
                line = [l for l in info.splitlines() if "Prereq" in l]
                if line:
                    prereqs.add(line[0].replace("Prereq:", "").strip())

            prereq_str = "; ".join(sorted(prereqs)) if prereqs else None

            course_info = {
                "academic_period": readable_period,
                "subject": course.get("courseSubject"),
                "course_number": course.get("courseNumber"),
                "title": title,
                "description": course.get("description"),
                "level": level,
                "prerequisites": prereq_str,   # PREREQS!!!
            }

            sections = course.get("sections", [])
            if not sections:
                all_courses.append(course_info)
            else:
                for section in sections:
                    section_info = course_info.copy()
                    section_info.update({
                        "section_number": section.get("number"),
                        "instructors": section.get("instructors"),
                        "meeting_patterns": section.get("meetingPatterns"),
                        "locations": section.get("locations"),
                        "open_seats": section.get("openSeats"),
                        "credits": section.get("credits")
                    })
                    all_courses.append(section_info)


        time.sleep(DELAY)



########### Save results here
os.makedirs(output_folder, exist_ok=True)

# JSON
json_path = os.path.join(output_folder, "all_courses.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(all_courses, f, ensure_ascii=False, indent=4)
print(f"JSON saved to {json_path}")

# Pandas DataFrame
df = pd.DataFrame(all_courses)
print("\nSample Data:")
print(df.head())
print(f"Total courses fetched: {len(df)}")

# CSV
csv_path = os.path.join(output_folder, "all_courses.csv")
df.to_csv(csv_path, index=False, encoding="utf-8")
print(f"CSV saved to {csv_path}")

print(f"\nAll files saved to: {output_folder}")