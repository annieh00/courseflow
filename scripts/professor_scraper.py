import requests
from bs4 import BeautifulSoup
import csv
import re

def format_name(name):
    # Convert 'LAST, FIRST MIDDLE' to 'First Middle Last'
    if ',' in name:
        last, first = name.split(',', 1)
        last = last.strip().title()
        first = first.strip().title()
        return f"{first} {last}"
    return name.title()

def scrape():
    url = 'https://catalog.iastate.edu/faculty/'
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')

    faculty_names = soup.find_all('h4')
    data = []

    for h4 in faculty_names:
        raw_name = h4.get_text(strip=True)

        # skip alpahbet separators
        if len(raw_name) == 1 and raw_name.isalpha():
            continue

        name = format_name(raw_name)

        # The <p> immediately after <h4> contains description with all info
        p = h4.find_next_sibling('p')
        if not p:
            continue

        details = p.get_text(strip=True)

        # Extract department from <p> description
        department = ''
        if 'Professor of' in details:
            after = details.split('Professor of', 1)[1]
            department = after.split('.')[0].strip()
            # Crop anything after ';' or ' and ' to get just the department
            department = re.split(r';| and ', department)[0].strip()

        if department:
            data.append({'Name': name, 'Department': department})

    # Save results
    with open('professors.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['Name', 'Department'])
        writer.writeheader()
        writer.writerows(data)

    print(f"Scapred {len(data)} faculty info and created a 'professors.csv'.")

if __name__ == '__main__':
    scrape()
