# import httpx
# import csv
# import asyncio
# from bs4 import BeautifulSoup

# # Corrected URLs based on Waterloo's routing
# DEPARTMENT_URLS = [
#     "https://uwaterloo.ca/architecture/contacts",
#     "https://uwaterloo.ca/biomedical-engineering/profiles",
#     "https://uwaterloo.ca/chemical-engineering/profiles",
#     "https://uwaterloo.ca/civil-environmental-engineering/profiles",
#     "https://uwaterloo.ca/electrical-computer-engineering/profiles",
#     "https://uwaterloo.ca/management-science-engineering/profiles",
#     "https://uwaterloo.ca/mechanical-mechatronics-engineering/contacts",
#     "https://uwaterloo.ca/nanotechnology-engineering/contacts", # Fixed URL
#     "https://uwaterloo.ca/software-engineering/contacts",
#     "https://uwaterloo.ca/systems-design-engineering/contacts"
# ]

# async def scrape_department(client: httpx.AsyncClient, base_url: str) -> dict:
#     page = 0
#     department_profiles = {}
#     previous_page_emails = set() # Memory for our circuit breaker
    
#     while True:
#         url = f"{base_url}?page={page}"
#         try:
#             response = await client.get(url)
#             if response.status_code == 404:
#                 break 
#             response.raise_for_status()
#         except httpx.HTTPError:
#             break
            
#         soup = BeautifulSoup(response.text, 'html.parser')
        
#         # STRATEGY 1: Look for modern Profile Cards
#         profile_cards = soup.find_all('article', class_=lambda c: c and 'card' in c)
        
#         if profile_cards:
#             current_page_emails = set()
            
#             for card in profile_cards:
#                 name_tag = card.find(['h2', 'h3'], class_='card__title')
#                 name = name_tag.get_text(strip=True) if name_tag else "N/A"

#                 role_tag = card.find('div', class_='card__position')
#                 role = role_tag.get_text(strip=True) if role_tag else "N/A"

#                 email = "N/A"
#                 mailto_link = card.find('a', href=lambda href: href and "mailto:" in href)
#                 if mailto_link:
#                     email = mailto_link.get_text(strip=True)

#                 if name != "N/A":
#                     key = email if email != "N/A" else name
#                     current_page_emails.add(key) # Add to current page memory
                    
#                     if key not in department_profiles:
#                         department_profiles[key] = [name, email, role]
            
#             # THE CIRCUIT BREAKER
#             # If the exact same group of people loaded again, we are in an infinite loop
#             if current_page_emails == previous_page_emails:
#                 break
                
#             previous_page_emails = current_page_emails
#             page += 1
            
#         else:
#             # STRATEGY 2: Fallback for Bulleted Lists / Tables
#             if page == 0:
#                 elements = soup.find_all(['li', 'tr', 'p'])
#                 for element in elements:
#                     mailto_link = element.find('a', href=lambda href: href and "mailto:" in href)
#                     if mailto_link:
#                         email = mailto_link.get_text(strip=True).replace('mailto:', '')
                        
#                         raw_text = element.get_text(separator=" | ", strip=True)
#                         parts = raw_text.split(" | ")
                        
#                         name = parts[0] if parts else "N/A"
#                         if "@" in name:
#                             name = "Unknown Name"
                            
#                         role = parts[1] if len(parts) > 1 and "@" not in parts[1] else "N/A"
                        
#                         if email not in department_profiles:
#                             department_profiles[email] = [name, email, role]
            
#             break
        
#     print(f"Finished: {base_url} (Scraped {page if page > 0 else 1} pages)")
#     return department_profiles

# async def scrape_all_departments():
#     unique_profiles = {}
#     async with httpx.AsyncClient(timeout=20.0) as client:
#         tasks = [scrape_department(client, url) for url in DEPARTMENT_URLS]
#         results = await asyncio.gather(*tasks)
        
#         for dept_profiles in results:
#             for key, profile_data in dept_profiles.items():
#                 if key not in unique_profiles:
#                     unique_profiles[key] = profile_data
                    
#     return list(unique_profiles.values())

# def save_to_csv(data: list, filename: str):
#     with open(filename, mode='w', newline='', encoding='utf-8') as file:
#         writer = csv.writer(file)
#         writer.writerow(['Name', 'Email', 'Role'])
#         writer.writerows(data)

# if __name__ == "__main__":
#     print("Beginning concurrent multi-department scrape with fallback strategies...")
#     all_profiles = asyncio.run(scrape_all_departments())
    
#     if all_profiles:
#         csv_filename = "engineering_profiles.csv"
#         save_to_csv(all_profiles, csv_filename)
#         print(f"\nSuccess! Extracted {len(all_profiles)} unique profiles and saved them to '{csv_filename}'.")
#     else:
#         print("\nNo profiles could be found.")

import httpx
import csv
import asyncio
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE_URL = "https://experts.uwaterloo.ca"
DIRECTORY_URL = f"{BASE_URL}/faculties/Faculty%20of%20Engineering"

async def fetch_profile_links(client: httpx.AsyncClient) -> list:
    """
    Step 1: Scrape the main directory to find all the 'View Profile' links.
    """
    print(f"Scanning directory: {DIRECTORY_URL}")
    profile_links = set()
    page = 1
    
    while True:
        url = f"{DIRECTORY_URL}?page={page}"
        try:
            response = await client.get(url)
            if response.status_code == 404:
                break
        except httpx.HTTPError:
            break
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Count how many links we find on the current page to prevent infinite loops
        found_links = 0
        
        # Look for all anchor tags
        for a in soup.find_all('a', href=True):
            text = a.get_text(strip=True).lower()
            
            # Target the buttons that say "View Profile"
            if "view profile" in text:
                full_url = urljoin(BASE_URL, a['href'])
                if full_url not in profile_links:
                    profile_links.add(full_url)
                    found_links += 1
                    
        # Circuit breaker: if we hit a page with no new profile links, we are done!
        if found_links == 0:
            break
            
        page += 1
        
    print(f"Found {len(profile_links)} expert profiles to scrape.")
    return list(profile_links)

async def scrape_expert_profile(client: httpx.AsyncClient, profile_url: str) -> dict:
    """
    Step 2: Visit the individual profile to grab Name, Email, and Expertise.
    """
    try:
        response = await client.get(profile_url)
        if response.status_code != 200:
            return None
    except httpx.HTTPError:
        return None
        
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # 1. Extract Name (Usually found in the page title like "Name - UW Experts")
    name = "N/A"
    if soup.title:
        name = soup.title.get_text(strip=True).split('-')[0].split('•')[0].strip()
        
    # 2. Extract Email (Using Regex to be 100% sure we catch it wherever it is)
    email = "N/A"
    mailto = soup.find('a', href=re.compile(r"^mailto:", re.IGNORECASE))
    if mailto:
        email = mailto.get_text(strip=True).replace('mailto:', '')
    else:
        # Fallback: scan the raw text for a uwaterloo.ca email format
        match = re.search(r"[a-zA-Z0-9_.+-]+@uwaterloo\.ca", soup.get_text())
        if match:
            email = match.group(0)
            
    # 3. Extract Expertise
    expertise = "N/A"
    # Find the tag that explicitly says "Expert In"
    expert_tag = soup.find(string=re.compile(r"Expert In", re.IGNORECASE))
    if expert_tag:
        parent = expert_tag.parent
        # The actual expertise list is usually the very next element
        sibling = parent.find_next_sibling(['ul', 'div', 'p'])
        if sibling:
            list_items = sibling.find_all('li')
            if list_items:
                # If it's a bulleted list, join them with commas
                expertise = ", ".join([li.get_text(strip=True) for li in list_items])
            else:
                # If it's just a paragraph, extract the text
                expertise = sibling.get_text(separator=", ", strip=True)
                
    return {"Name": name, "Email": email, "Expertise": expertise, "URL": profile_url}
    
async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1
        links = await fetch_profile_links(client)
        
        if not links:
            print("No links found. The site might be using heavier JavaScript protections.")
            return
            
        # Step 2
        print("Visiting individual profiles for Name, Email, and Expertise...")
        tasks = [scrape_expert_profile(client, url) for url in links]
        
        # Run all profile visits concurrently
        results = await asyncio.gather(*tasks)
        
        # Step 3: Clean up and save
        valid_results = [r for r in results if r is not None]
        
        csv_filename = "expert_profiles.csv"
        with open(csv_filename, "w", newline="", encoding="utf-8") as f:
            # We use DictWriter since we returned dictionaries from the scraper
            writer = csv.DictWriter(f, fieldnames=["Name", "Email", "Expertise", "URL"])
            writer.writeheader()
            writer.writerows(valid_results)
            
        print(f"\nSuccess! Saved {len(valid_results)} experts to '{csv_filename}'.")

if __name__ == "__main__":
    asyncio.run(main())