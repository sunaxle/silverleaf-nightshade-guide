import re
import csv
import json
from collections import Counter

raw_text = """
Media	Name	User	Observed	Place	Added
3
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 erik_aguillonwtx	
Jul 16, 2026
5:39 PM CDT
 Benedict Dr, San Angelo, TX, US	
Jul 16, 2026
5:40 PM CDT
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 zbox80	
Jul 6, 2026
5:00 PM CDT
 Middle Concho W, San Angelo, TX, US	
Jul 6, 2026
5:02 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 zbox80	
Jul 6, 2026
4:55 PM CDT
 Middle Concho W, San Angelo, TX, US	
Jul 6, 2026
4:57 PM CDT
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 charlieellison	
Jun 13, 2026
10:28 AM CDT
 Tom Green County, US-TX, US	
Jun 21, 2026
2:12 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 brooksy	
May 29, 2026
5:43 PM CDT
 Old Ballinger Hwy, San Angelo, TX, US	
May 29, 2026
6:00 PM CDT
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 opticswiz	
May 28, 2026
10:57 AM CDT
 Grape Creek, TX 76901, USA	
May 28, 2026
10:58 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
4
 l_gonzalez	
May 25, 2026
10:27 AM CDT
 San Angelo, TX, USA	
May 26, 2026
8:25 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 lostwithinadream	
May 16, 2026
10:25 AM CDT
 San Angelo	
May 16, 2026
10:25 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 napoleon1799	
May 9, 2026
2:46 PM CDT
 San Angelo State Park, San Angelo, TX, US	
May 9, 2026
5:58 PM CDT
3
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 brownie_batter	
May 2, 2026
11:45 AM CDT
 Chaparral Trail, San Angelo, TX, US	
May 2, 2026
11:18 PM CDT
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 brownie_batter	
May 2, 2026
12:28 PM CDT
 Winding Snake Trail, San Angelo, TX, US	
May 2, 2026
11:15 PM CDT
3
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 brownie_batter	
Apr 24, 2026
5:46 PM CDT
 Ft Lancaster Ave, San Angelo, TX, US	
Apr 24, 2026
6:46 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 marvelliott	
Apr 19, 2026
10:23 AM CDT
 San Angelo State Park, San Angelo, TX, US	
Apr 19, 2026
10:31 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 ahernandez232	
Apr 17, 2026
1:41 PM CDT
 San Angelo, TX, USA	
Apr 17, 2026
2:20 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 marvelliott	
Apr 14, 2026
2:53 PM CDT
 San Angelo State Park, San Angelo, TX, US	
Apr 14, 2026
2:53 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 susanelliott	
Apr 13, 2026
4:45 PM CDT
 San Angelo State Park, San Angelo, TX, US	
Apr 13, 2026
4:45 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 l_gonzalez	
Apr 9, 2026
1:39 PM CDT
 Grape Creek, TX 76901, USA	
Apr 9, 2026
6:38 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
1
 glerbster	
Apr 9, 2026
2:57 PM CDT
 Grape Creek, TX 76901, USA	
Apr 9, 2026
2:57 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 rogerkallen	
Apr 7, 2026
11:25 AM CDT
 San Angelo State Park, San Angelo, TX, US	
Apr 7, 2026
11:26 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 mptrull	
Apr 18, 2025
1:13 PM CDT
 San Angelo, TX 76904, USA	
Mar 26, 2026
2:02 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 tisha11293	
Feb 19, 2026
2:04 PM CST
 San Angelo, TX 76903, USA	
Feb 19, 2026
2:04 PM CST
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
4
 lauracarb	
Dec 27, 2025
3:48 PM CST
 N Main St, San Angelo, TX, US	
Dec 27, 2025
7:19 PM CST
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 maymurphy	
Aug 6, 2021
9:23 AM CDT
 San Angelo State Park, 362 FM 2288, San Angelo, TX 76901, USA	
Oct 18, 2025
10:05 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 inhat83	
Oct 17, 2025
8:45 AM CDT
 Sherwood Way, San Angelo, TX, US	
Oct 17, 2025
8:46 AM CDT
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 bouteloua_curtipendula	
Sep 20, 2025
5:49 PM CDT
 San Angelo, TX, USA	
Sep 20, 2025
5:49 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 brooksy	
Aug 31, 2025
1:37 PM CDT
 San Angelo, TX, USA	
Aug 31, 2025
1:37 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 rexia	
Feb 18, 2017
4:41 PM CST
 San Angelo State Park, South Entrance, San Angelo, TX 76901, USA	
Aug 27, 2025
11:56 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 chulasrider	
Aug 2, 2025
9:08 AM CDT
 Grape Creek, TX 76901, USA	
Aug 2, 2025
2:17 PM CDT
3
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 hbcoulon	
Jul 11, 2025
10:36 AM CDT
 Inglewood Dr, San Angelo, TX, US	
Jul 11, 2025
11:06 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 paige186-gwmn	
Jun 30, 2025
9:08 AM CDT
 Dinosaur Horse Trail, San Angelo, TX, US	
Jun 30, 2025
3:24 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 paige186-gwmn	
Jun 28, 2025
6:40 PM CDT
 San Angelo, TX, US	
Jun 28, 2025
8:08 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 cgdwn	
Jun 7, 2025
2:33 PM CDT
 W Houston Harte Frontage Rd, San Angelo, TX, US	
Jun 9, 2025
6:14 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 robynleigh626	
Jun 4, 2025
10:19 AM CDT
 San Angelo	
Jun 4, 2025
10:19 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 madsnamiogr	
May 17, 2025
3:00 PM CDT
 Hillside Dr, San Angelo, TX, US	
May 17, 2025
3:09 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 tisha11293	
May 14, 2025
8:52 AM CDT
 San Angelo, TX 76903, USA	
May 14, 2025
8:52 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 glerbster	
May 10, 2025
6:46 PM CDT
 San Angelo, TX 76904, USA	
May 10, 2025
6:47 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 glerbster	
May 9, 2025
1:39 PM CDT
 San Angelo, TX, USA	
May 9, 2025
1:40 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 larissa_sneed	
May 7, 2025
1:08 PM CDT
 San Angelo, TX, US	
May 7, 2025
1:09 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 brooksy	
May 4, 2025
8:26 AM CDT
 Tom Green County, TX, USA	
May 4, 2025
10:59 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 brooksy	
May 3, 2025
10:02 AM CDT
 Grape Creek, TX 76901, USA	
May 3, 2025
10:10 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 beckiperkins	
May 3, 2025
8:22 AM CDT
 W Old Sterling City Hwy, San Angelo, TX, US	
May 3, 2025
8:26 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 kenniemerbach	
Apr 27, 2025
11:53 AM CDT
 South Slick Rock Trail, San Angelo, TX, US	
Apr 27, 2025
3:09 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 glerbster	
Apr 27, 2025
2:47 PM CDT
 San Angelo, TX, USA	
Apr 27, 2025
2:49 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 glerbster	
Apr 27, 2025
2:22 PM CDT
 San Angelo, TX, USA	
Apr 27, 2025
2:22 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 chulasrider	
Apr 26, 2025
9:46 AM CDT
 Grape Creek, TX 76901, USA	
Apr 26, 2025
2:44 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 glerbster	
Apr 26, 2025
1:39 PM CDT
 San Angelo, TX, USA	
Apr 26, 2025
1:40 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 glerbster	
Apr 26, 2025
1:33 PM CDT
 San Angelo, TX, USA	
Apr 26, 2025
1:34 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 kenniemerbach	
Apr 25, 2025
6:13 PM CDT
 San Angelo, TX, US	
Apr 26, 2025
7:30 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
4
 zstanfield	
Apr 25, 2025
6:52 PM CDT
 Civic League Park, San Angelo, TX, US	
Apr 25, 2025
8:53 PM CDT
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 zstanfield	
Apr 25, 2025
7:08 PM CDT
 Civic League Park, San Angelo, TX, US	
Apr 25, 2025
8:35 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 glerbster	
Apr 25, 2025
7:56 PM CDT
 San Angelo, TX, USA	
Apr 25, 2025
7:57 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 glerbster	
Apr 25, 2025
7:50 PM CDT
 San Angelo, TX, USA	
Apr 25, 2025
7:51 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 lauriejd	
Apr 25, 2025
3:35 PM CDT
 San Angelo	
Apr 25, 2025
3:36 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 kenniemerbach	
Apr 25, 2025
9:03 AM CDT
 Red Dam Loop, San Angelo, TX, US	
Apr 25, 2025
3:22 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 novamater	
Apr 23, 2025
2:47 PM CDT
 San Angelo, TX, US	
Apr 25, 2025
2:45 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
1
 glerbster	
Apr 23, 2025
10:36 AM CDT
 San Angelo, TX, USA	
Apr 23, 2025
10:38 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 darla5	
Apr 18, 2025
4:32 PM CDT
 San Angelo, TX 76905, USA	
Apr 18, 2025
4:32 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
4
 kenniemerbach	
Apr 3, 2025
6:25 PM CDT
 San Angelo Dog Park, San Angelo, TX, US	
Apr 4, 2025
11:31 PM CDT
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 shearwaters	
Apr 2, 2025
6:24 PM CDT
 Tom Green County, US-TX, US	
Apr 2, 2025
6:31 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 ginger70650	
Dec 3, 2024
2:36 PM CST
 San Angelo, TX, USA	
Dec 3, 2024
9:41 PM CST
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 glerbster	
Nov 20, 2024
3:20 PM CST
 San Angelo, TX 76904, USA	
Nov 20, 2024
3:20 PM CST
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 glerbster	
Nov 20, 2024
2:54 PM CST
 San Angelo, TX 76904, USA	
Nov 20, 2024
2:54 PM CST
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 mmendoza40	
Nov 19, 2024
3:29 PM CST
 San Angelo, TX, US	
Nov 19, 2024
3:30 PM CST
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
3
 gtellez1	
Nov 19, 2024
3:29 PM CST
 San Angelo, TX, US	
Nov 19, 2024
3:29 PM CST
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 zzhaire	
Oct 27, 2024
10:13 AM CDT
 Northwest Dr, San Angelo, TX, US	
Oct 27, 2024
10:22 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 kvotx	
Oct 13, 2024
7:41 AM CDT
 San Angelo, TX 76903, USA	
Oct 13, 2024
9:02 AM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 justin_olthoff	
Sep 24, 2024
9:59 AM CDT
 San Angelo State Park, 362 FM 2288, San Angelo, TX 76901, USA	
Sep 27, 2024
10:02 AM CDT
4
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 cynodon	
Jun 12, 2024
8:22 PM CDT
 San Angelo, TX, USA	
Jun 17, 2024
3:16 PM CDT
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 takkycat	
Jun 6, 2024
12:21 PM CDT
 Rio Concho Community Park, San Angelo, TX, US	
Jun 6, 2024
12:22 PM CDT
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 harrier	
May 5, 2024
9:36 AM CDT
 San Angelo, TX, USA	
May 21, 2024
10:13 PM CDT
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 harrier	
May 5, 2024
9:49 AM CDT
 San Angelo, TX, USA	
May 21, 2024
10:13 PM CDT
2
Silverleaf Nightshade
Solanum elaeagnifolium
Research Grade
2
 cypselurus	
May 5, 2024
9:36 AM CDT
 W Houston Harte Frontage Rd, San Angelo, TX, US	
May 21, 2024
4:48 PM CDT
"""

# Parsing logic
lines = [l.strip() for l in raw_text.strip().split('\n') if l.strip()]

# Remove header line if present
if "Media" in lines[0]:
    lines = lines[1:]

observations = []
idx = 0

while idx < len(lines):
    # Detect start of entry
    media_count = 1
    if lines[idx].isdigit():
        media_count = int(lines[idx])
        idx += 1
    
    if idx >= len(lines):
        break
        
    common_name = lines[idx]
    idx += 1
    if idx >= len(lines): break
    
    scientific_name = lines[idx]
    idx += 1
    if idx >= len(lines): break
    
    quality_grade = "Needs ID"
    if lines[idx] == "Research Grade":
        quality_grade = "Research Grade"
        idx += 1
    elif lines[idx] == "Needs ID":
        quality_grade = "Needs ID"
        idx += 1
    
    if idx >= len(lines): break
    
    id_count = 1
    faves_count = 0
    if lines[idx].isdigit():
        id_count = int(lines[idx])
        idx += 1
        # Check if next token is also digit (e.g., faves count like 1)
        if idx < len(lines) and lines[idx].isdigit():
            faves_count = int(lines[idx])
            idx += 1

    if idx >= len(lines): break

    user = lines[idx]
    idx += 1
    if idx >= len(lines): break

    observed_date = lines[idx]
    idx += 1
    if idx < len(lines) and ("AM" in lines[idx] or "PM" in lines[idx]):
        observed_date += " " + lines[idx]
        idx += 1
        
    if idx >= len(lines): break
    place = lines[idx]
    idx += 1

    if idx >= len(lines): break
    added_date = lines[idx]
    idx += 1
    if idx < len(lines) and ("AM" in lines[idx] or "PM" in lines[idx]):
        added_date += " " + lines[idx]
        idx += 1

    observations.append({
        "obs_num": len(observations) + 1,
        "common_name": common_name,
        "scientific_name": scientific_name,
        "quality_grade": quality_grade,
        "media_count": media_count,
        "identifications_count": id_count,
        "user": user,
        "observed_date": observed_date,
        "place": place,
        "added_date": added_date
    })

print(f"Successfully parsed {len(observations)} observations!")

# Save to CSV
csv_file = "/Users/dr3/Documents/Antigravity Designs/work/Silverleaf NightShade/san_angelo_inaturalist_obs.csv"
fieldnames = ["obs_num", "common_name", "scientific_name", "quality_grade", "media_count", "identifications_count", "user", "observed_date", "place", "added_date"]

with open(csv_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(observations)

# Save to JSON
json_file = "/Users/dr3/Documents/Antigravity Designs/work/Silverleaf NightShade/san_angelo_inaturalist_obs.json"
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(observations, f, indent=2)

print("Saved CSV and JSON files.")
