import csv
import random
from datetime import datetime, timedelta

# Definitions
sites = [f"S{str(i).zfill(2)}" for i in range(1, 21)]  # S01 to S20
ecoregions = ["Valley", "West_Texas", "Panhandle", "Central_Texas", "Coastal_Plains"]
treatments = ["Disturbed", "Undisturbed"]

# Distribution of sites to ecoregions (roughly 4 sites per ecoregion)
site_to_eco = {sites[i]: ecoregions[i // 4] for i in range(20)}
# Treatmenet per site
site_to_treat = {sites[i]: random.choice(treatments) for i in range(20)}
# GPS base per ecoregion
eco_gps = {
    "Valley": (26.2, -98.2),
    "West_Texas": (29.3, -100.9),
    "Panhandle": (33.5, -101.8),
    "Central_Texas": (30.2, -97.7),
    "Coastal_Plains": (27.8, -97.4)
}

# Base date
start_date = datetime(2026, 5, 20)

rows = []
# Headers
headers = [
    "Bag_ID", "Date", "Site_ID", "Ecoregion", "Treatment", "Plant_Number", 
    "GPS_Lat", "GPS_Lon", "Field_Temp_C", "Field_Dist_From_Road_m",
    "Field_Soil_Compaction_PSI", "Field_Percent_Cover", "Field_Damage_Score_0_to_4", 
    "Field_Open_Flowers", "Field_Notes", 
    "Lab_Adult_Bugs", "Lab_Larvae_Count", "Lab_Egg_Count", 
    "Lab_Dry_Leaf_Biomass_g", "Lab_Dry_Root_Biomass_g", "Lab_Spine_Density_0_to_2", 
    "Lab_Leaf_CN_Ratio", "Lab_Root_AMF_Colonization_Pct",
    "Soil_pH_Site_Avg", "Soil_Nitrogen_ppm_Site_Avg", "Soil_Organic_Matter_Pct_Site_Avg", 
    "Soil_Nematode_Count_Site_Avg", "Soil_AMF_Spore_Count_Site_Avg"
]

# Generate 200 entries (20 sites * 10 plants per site)
for site_idx, site in enumerate(sites):
    eco = site_to_eco[site]
    treat = site_to_treat[site]
    
    # Site level variables
    date = start_date + timedelta(days=site_idx // 4)
    date_str = date.strftime("%Y-%m-%d")
    date_code = date.strftime("%m%d")
    
    lat = eco_gps[eco][0] + random.uniform(-0.5, 0.5)
    lon = eco_gps[eco][1] + random.uniform(-0.5, 0.5)
    temp = round(random.uniform(28.0, 38.0), 1)
    
    soil_ph = round(random.uniform(6.5, 8.5), 1)
    soil_n = round(random.uniform(10.0, 40.0), 1)
    soil_om = round(random.uniform(0.5, 5.0), 1)
    soil_nem = random.randint(50, 600)
    
    # Treatment effects on soil
    if treat == "Disturbed":
        soil_om = round(soil_om * 0.5, 1) # Less organic matter
        soil_nem = int(soil_nem * 1.5) # More nematodes maybe
        dist_from_road = round(random.uniform(1.0, 5.0), 1)
        compaction = random.randint(200, 300) # Highly compacted
        amf_spores = random.randint(10, 50) # Disrupted fungal networks
    else:
        dist_from_road = round(random.uniform(10.0, 50.0), 1)
        compaction = random.randint(50, 150) # Loose soil
        amf_spores = random.randint(100, 300) # Healthy fungal networks
        
    for plant_num in range(1, 11):
        bag_id = f"{date_code}-{site}-{treat[0]}-P{str(plant_num).zfill(2)}-COMP"
        
        # Plant level variables influenced by treatment
        if treat == "Disturbed":
            damage = random.randint(2, 4)
            spines = random.randint(0, 1)
            adults = random.randint(5, 20)
            larvae = random.randint(20, 100)
            eggs = random.randint(50, 250)
            leaf_bio = round(random.uniform(10.0, 25.0), 1)
            root_bio = round(random.uniform(15.0, 40.0), 1)
            pct_cover = random.randint(0, 30) # Mowed, less competition
            open_flowers = random.randint(0, 2) # Heavy damage, aborted flowers
            cn_ratio = round(random.uniform(10.0, 15.0), 1) # High N uptake
            amf_colonization = random.randint(0, 15) # Very low root colonization
        else:
            damage = random.randint(0, 2)
            spines = random.randint(1, 2)
            adults = random.randint(0, 5)
            larvae = random.randint(0, 20)
            eggs = random.randint(0, 50)
            leaf_bio = round(random.uniform(25.0, 50.0), 1)
            root_bio = round(random.uniform(50.0, 100.0), 1)
            pct_cover = random.randint(60, 100) # Tall grasses, high competition
            open_flowers = random.randint(5, 15) # Healthy
            cn_ratio = round(random.uniform(20.0, 30.0), 1) # Low N uptake
            amf_colonization = random.randint(40, 80) # High root colonization
            
        notes = random.choice(["", "Looks healthy", "Ants present", "Drought stressed", "Mowed recently"]) if treat == "Disturbed" else random.choice(["", "Huge root", "Flowering heavily", "Very thorny"])

        row = [
            bag_id, date_str, site, eco, treat, plant_num,
            round(lat, 5), round(lon, 5), temp, dist_from_road,
            compaction, pct_cover, damage, open_flowers, notes,
            adults, larvae, eggs, leaf_bio, root_bio, spines, cn_ratio, amf_colonization,
            soil_ph, soil_n, soil_om, soil_nem, amf_spores
        ]
        rows.append(row)

# Write to CSV
with open('/Users/dr3/Documents/Antigravity Designs/work/Silverleaf NightShade/mock_master_database.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    writer.writerows(rows)

print("Generated 200 rows of mock data with new ecological metrics successfully.")
