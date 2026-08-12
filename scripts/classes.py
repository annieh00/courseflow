

import requests
import json
import pandas as pd

url = "https://api.classes.iastate.edu/api/courses/search"

subjects = [
    "ABE - Agricultural and Biosystems Engineering",
    "SE - Software Engineering",
    "CPRE - Computer Engineering",
    "CYBE - Cyber Security Engineering",
    "EE - Electrical Engineering"
]

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://classes.iastate.edu",
    "Referer": "https://classes.iastate.edu/",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive"
}

all_courses = []

for subject in subjects:
    payload = {
        "academicPeriodId": "ACADEMIC_PERIOD-2025Fall",
        "allowedGradingBases": [],
        "courseNumber": "",
        "courseSubject": subject,
        "credits": None,
        "daysOfTheWeek": [],
        "deliveryMode": None,
        "instructor": "",
        "level": None,
        "openSeats": False,
        "requirement": None,
        "sectionEndDate": None,
        "sectionStartDate": None,
        "semesterTag": None,
        "title": ""
    }

    # DEBUG
    print(f"Fetching courses for subject: {subject}")
    
    response = requests.post(url, json=payload, headers=headers)
    print("Status Code:", response.status_code)

    if response.status_code != 200:
        print(f"Failed to fetch {subject}")
        continue

    data = response.json()
    
    for course in data.get("data", []):
        course_info = {
            "subject": course.get("courseSubject"),
            "course_number": course.get("courseNumber"),
            "title": course.get("title"),
            "description": course.get("description"),
            "level": course.get("level"),
        }

        sections = course.get("sections", [])
        for section in sections:
            section_info = course_info.copy()
            section_info.update({
                "section_number": section.get("number"),
                "instructors": section.get("instructors"),
                "meeting_patterns": section.get("meetingPatterns"),
                "locations": section.get("locations"),
                "open_seats": section.get("openSeats")
            })
            all_courses.append(section_info)

# Save to JSON
with open("courses.json", "w", encoding="utf-8") as f:
    json.dump(all_courses, f, ensure_ascii=False, indent=4)

# Convert to DataFrame
df = pd.DataFrame(all_courses)
print(df.head())
print(f"Total courses fetched: {len(df)}")

