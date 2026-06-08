import csv
import random
from datetime import datetime, timedelta

def generate_mock_data(output_path: str = '/Users/dr3/Documents/Antigravity Designs/work/Silverleaf NightShade/mock_master_database.csv', num_sites: int = 20, plants_per_site: int = 10):
    """
    Generate mock field and lab data for Silverleaf Nightshade study.
    
    This function simulates ecological, spatial, and biological data 
    across multiple sites and ecoregions, incorporating treatment effects 
    ("Disturbed" vs "Undisturbed") on plant and soil metrics.
    
    Args:
        output_path (str): The file path where the CSV will be saved.
        num_sites (int): Number of sites to generate data for.
        plants_per_site (int): Number of plants per site.
    """
    # Definitions
    sites = [f"S{str(i).zfill(2)}" for i in range(1, num_sites + 1)]
    ecoregions = ["Valley", "West_Texas", "Panhandle", "Central_Texas", "Coastal_Plains"]
    treatments = ["Disturbed", "Undisturbed"]
    
    # Distribution of sites to ecoregions (evenly distributed)
    sites_per_eco = max(1, num_sites // len(ecoregions))
    site_to_eco = {sites[i]: ecoregions[min(i // sites_per_eco, len(ecoregions) - 1)] for i in range(num_sites)}
    
    # Treatment per site
    site_to_treat = {sites[i]: random.choice(treatments) for i in range(num_sites)}
    
    # GPS base per ecoregion
    eco_gps = {
        "Valley": (26.2, -98.2),
        "West_Texas": (29.3, -100.9),
        "Panhandle": (33.5, -101.8),
        "Central_Texas": (30.2, -97.7),
        "Coastal_Plains": (27.8, -97.4)
    }
    
    # Base date for sampling
    start_date = datetime(2026, 5, 20)
    
    rows = []
    # CSV Headers
    headers = [
        "Bag_ID", "Date", "Site_ID", "Ecoregion", "Treatment", "Plant_Number", 
        "GPS_Lat", "GPS_Lon", "Field_Temp_C", "Field_Dist_From_Road_m",
        "Field_Soil_Compaction_PSI", "Field_Percent_Cover", "Field_Damage_Score_0_to_4", 
        "Field_Open_Flowers", "Field_Notes", 
        "Lab_Adult_Bugs", "Lab_Larvae_Count", "Lab_Egg_Count", 
        "Lab_Dry_Leaf_Biomass_g", "Lab_Dry_Root_Biomass_g", "Lab_Spine_Density_0_to_2", 
        "Lab_Leaf_CN_Ratio", "Lab_Root_AMF_Colonization_Pct",
        "Soil_pH_Site_Avg", "Soil_Nitrogen_ppm_Site_Avg", "Soil_Organic_Matter_Pct_Site_Avg", 
        "Soil_Nematode_Count_Site_Avg", "Soil_AMF_Spore_Count_Site_Avg",
        "Genetic_Sample_ID", "Dry_Ice_Stored", "FedEx_Tracking", "Proximity_Metrics", "Genetic_Expression_Notes"
    ]
    
    # Generate data entries
    for site_idx, site in enumerate(sites):
        eco = site_to_eco[site]
        treat = site_to_treat[site]
        
        # Site level variables
        date = start_date + timedelta(days=site_idx // sites_per_eco)
        date_str = date.strftime("%Y-%m-%d")
        date_code = date.strftime("%m%d")
        
        lat = eco_gps[eco][0] + random.uniform(-0.5, 0.5)
        lon = eco_gps[eco][1] + random.uniform(-0.5, 0.5)
        temp = round(random.uniform(28.0, 38.0), 1)
        
        soil_ph = round(random.uniform(6.5, 8.5), 1)
        soil_n = round(random.uniform(10.0, 40.0), 1)
        soil_om = round(random.uniform(0.5, 5.0), 1)
        soil_nem = random.randint(50, 600)
        
        # Treatment effects on soil metrics
        if treat == "Disturbed":
            soil_om = round(soil_om * 0.5, 1) # Less organic matter
            soil_nem = int(soil_nem * 1.5) # More nematodes
            dist_from_road = round(random.uniform(1.0, 5.0), 1)
            compaction = random.randint(200, 300) # Highly compacted
            amf_spores = random.randint(10, 50) # Disrupted fungal networks
        else:
            dist_from_road = round(random.uniform(10.0, 50.0), 1)
            compaction = random.randint(50, 150) # Loose soil
            amf_spores = random.randint(100, 300) # Healthy fungal networks
            
        for plant_num in range(1, plants_per_site + 1):
            bag_id = f"{date_code}-{site}-{treat[0]}-P{str(plant_num).zfill(2)}-COMP"
            genetic_id = f"KARIYAT-GEN-{site}-{plant_num}"
            dry_ice = "TRUE"
            fedex = f"774{random.randint(100000000, 999999999)}"
            
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
                proximity = random.choice(["Roadside", "Agricultural Field", "Residential"])
                genetic_notes = "Upregulated defense pathways (mowing/herbivory stress)"
                notes = random.choice(["", "Looks healthy", "Ants present", "Drought stressed", "Mowed recently"])
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
                proximity = random.choice(["Isolated", "Water Source"])
                genetic_notes = "Baseline expression, low stress markers"
                notes = random.choice(["", "Huge root", "Flowering heavily", "Very thorny"])
                
            row = [
                bag_id, date_str, site, eco, treat, plant_num,
                round(lat, 5), round(lon, 5), temp, dist_from_road,
                compaction, pct_cover, damage, open_flowers, notes,
                adults, larvae, eggs, leaf_bio, root_bio, spines, cn_ratio, amf_colonization,
                soil_ph, soil_n, soil_om, soil_nem, amf_spores,
                genetic_id, dry_ice, fedex, proximity, genetic_notes
            ]
            rows.append(row)
    
    # Write to CSV
    with open(output_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    
    print(f"Generated {len(rows)} rows of mock data successfully at {output_path}.")

if __name__ == '__main__':
    generate_mock_data()
