import json
import os
import re
import urllib.parse

# Load links
with open('/Users/dr3/.gemini/antigravity/brain/b771bd0d-1eac-4520-b5ff-302e6ffd92d5/scratch/link_results.json') as f:
    links = json.load(f)

# Load photos
photo_map = {}
for root, dirs, files in os.walk('bugphoto'):
    for f in files:
        if f.endswith('.jpg') or f.endswith('.png'):
            folder = os.path.basename(root)
            if folder not in photo_map:
                photo_map[folder] = []
            photo_map[folder].append(os.path.join(root, f))

# Read original data.js to preserve structure but update fields
with open('data.js', 'r') as f:
    data_content = f.read()

# We can find the JS object definition and replace URLs
# It's better to just extract the JSON-like structure, or write a fresh one.
# Since data.js has a specific structure: const insectData = [ ... ];
# Let's parse it manually or just build a new one.

# It's safer to build a new one since we have the data.
# I'll just hardcode the data structure and dump it to JS format.

insect_data = [
    {"name": "Texas False Potato Beetle", "scientific": "Leptinotarsa texana", "category": "Beetles and Weevils", "type": "Herbivores and Biocontrol Agents", "folder": "Texas_False_Potato_Beetle", "fallback": "images/beetles_weevils_1778696216573.png"},
    {"name": "Defecta False Potato Beetle", "scientific": "Leptinotarsa defecta", "category": "Beetles and Weevils", "type": "Herbivores and Biocontrol Agents", "folder": "Defecta_False_Potato_Beetle", "fallback": "images/beetles_weevils_1778696216573.png"},
    {"name": "Stem-boring Weevil", "scientific": "Trichobaris texana", "category": "Beetles and Weevils", "type": "Herbivores and Biocontrol Agents", "folder": "Stem_boring_Weevil", "fallback": "images/beetles_weevils_1778696216573.png"},
    {"name": "Aeneolus Weevil", "scientific": "Anthonomus aeneolus", "category": "Beetles and Weevils", "type": "Herbivores and Biocontrol Agents", "folder": "Aeneolus_Weevil", "fallback": "images/beetles_weevils_1778696216573.png"},
    {"name": "Brevirostris Weevil", "scientific": "Anthonomus brevirostris", "category": "Beetles and Weevils", "type": "Herbivores and Biocontrol Agents", "folder": "Brevirostris_Weevil", "fallback": "images/beetles_weevils_1778696216573.png"},
    {"name": "Flea Beetle", "scientific": "Chaetocnema minuta", "category": "Beetles and Weevils", "type": "Herbivores and Biocontrol Agents", "folder": "Flea_Beetle", "fallback": "images/beetles_weevils_1778696216573.png"},
    {"name": "Flea Beetles", "scientific": "Epitrix sp.", "category": "Beetles and Weevils", "type": "Herbivores and Biocontrol Agents", "folder": "Flea_Beetles_Epitrix", "fallback": "images/beetles_weevils_1778696216573.png", "inat_key": "Epitrix"},
    {"name": "Eggplant Tortoise Beetle", "scientific": "Gratiana pallidula", "category": "Beetles and Weevils", "type": "Herbivores and Biocontrol Agents", "folder": "Eggplant_Tortoise_Beetle", "fallback": "images/beetles_weevils_1778696216573.png"},
    
    {"name": "Lace Bug", "scientific": "Gargaphia arizonica", "category": "True Bugs", "type": "Herbivores and Biocontrol Agents", "folder": "Lace_Bug_arizonica", "fallback": "images/true_bugs_1778696234797.png"},
    {"name": "Lace Bug", "scientific": "Gargaphia opacula", "category": "True Bugs", "type": "Herbivores and Biocontrol Agents", "folder": "Lace_Bug_opacula", "fallback": "images/true_bugs_1778696234797.png"},
    {"name": "Say Stink Bug", "scientific": "Chlorochroa sayi", "category": "True Bugs", "type": "Herbivores and Biocontrol Agents", "folder": "Say_Stink_Bug", "fallback": "images/true_bugs_1778696234797.png"},
    {"name": "Clover Leafhopper", "scientific": "Aceratagallia sanguinolenta", "category": "True Bugs", "type": "Herbivores and Biocontrol Agents", "folder": "Clover_Leafhopper", "fallback": "images/true_bugs_1778696234797.png"},
    
    {"name": "Eggplant Leafminer", "scientific": "Keiferia glochinella", "category": "Moths and Caterpillars", "type": "Herbivores and Biocontrol Agents", "folder": "Eggplant_Leafminer", "fallback": "images/moths_caterpillars_1778696249394.png"},
    {"name": "Tobacco Hornworm", "scientific": "Manduca sexta", "category": "Moths and Caterpillars", "type": "Herbivores and Biocontrol Agents", "folder": "Tobacco_Hornworm", "fallback": "images/moths_caterpillars_1778696249394.png"},
    {"name": "Salt-marsh Caterpillar", "scientific": "Estigmene acrea", "category": "Moths and Caterpillars", "type": "Herbivores and Biocontrol Agents", "folder": "Salt_marsh_Caterpillar", "fallback": "images/moths_caterpillars_1778696249394.png"},
    {"name": "Leaf-tying Moth", "scientific": "Symmetrischema ardeola", "category": "Moths and Caterpillars", "type": "Herbivores and Biocontrol Agents", "folder": "Leaf_tying_Moth", "fallback": "images/moths_caterpillars_1778696249394.png"},
    
    {"name": "Fruit Fly", "scientific": "Zonosemata vittigera", "category": "Flies", "type": "Herbivores and Biocontrol Agents", "folder": "Fruit_Fly", "fallback": "images/flies_1778696315930.png"},
    
    {"name": "Vagrant Grasshopper", "scientific": "Schistocerca vaga", "category": "Grasshoppers", "type": "Herbivores and Biocontrol Agents", "folder": "Vagrant_Grasshopper", "fallback": "images/grasshoppers_1778696329716.png"},
    
    {"name": "Buff-tailed Bumblebee", "scientific": "Bombus terrestris", "category": "Bees", "type": "Pollinators", "folder": "Buff_tailed_Bumblebee", "fallback": "images/bees_1778696344167.png"},
    {"name": "Violet Carpenter Bee", "scientific": "Xylocopa violacea", "category": "Bees", "type": "Pollinators", "folder": "Violet_Carpenter_Bee", "fallback": "images/bees_1778696344167.png"},
    {"name": "Carpenter Bee", "scientific": "Xylocopa iris", "category": "Bees", "type": "Pollinators", "folder": "Carpenter_Bee_iris", "fallback": "images/bees_1778696344167.png"},
    {"name": "Nomiine Bees", "scientific": "Pseudapis spp.", "category": "Bees", "type": "Pollinators", "folder": "Nomiine_Bees", "fallback": "images/bees_1778696344167.png", "inat_key": "Pseudapis"},
    {"name": "Digger Bees", "scientific": "Amegilla spp.", "category": "Bees", "type": "Pollinators", "folder": "Digger_Bees", "fallback": "images/bees_1778696344167.png", "inat_key": "Amegilla"},
    {"name": "Sweat Bees", "scientific": "Halictidae family", "category": "Bees", "type": "Pollinators", "folder": "Sweat_Bees", "fallback": "images/bees_1778696344167.png", "inat_key": "Halictidae"},
    
    {"name": "Hoverflies", "scientific": "Syrphidae family", "category": "Other Pollinators", "type": "Pollinators", "folder": "Hoverflies", "fallback": "images/bees_1778696344167.png", "inat_key": "Syrphidae"},
    {"name": "Bee Beetles", "scientific": "Trichiinae subfamily", "category": "Other Pollinators", "type": "Pollinators", "folder": "Bee_Beetles", "fallback": "images/bees_1778696344167.png", "inat_key": "Trichiinae"},
]

out_data = []

for item in insect_data:
    sci = item["scientific"]
    inat_key = item.get("inat_key", sci)
    
    # Links
    bg = f"https://bugguide.net/index.php?q=search&keys={urllib.parse.quote(sci)}"
    inat = links.get(inat_key, {}).get('inat', '')
    
    # Image
    folder = f"photos_of_{item['folder']}"
    images = photo_map.get(folder, [])
    if images:
        img_path = images[0] # use the first uploaded photo
    else:
        img_path = item["fallback"]
        
    out_data.append({
        "name": item["name"],
        "scientific": sci,
        "category": item["category"],
        "type": item["type"],
        "inaturalist": inat if inat else None,
        "bugguide": bg,
        "image": img_path
    })

js_content = "const insectData = " + json.dumps(out_data, indent=2) + ";\n"

with open("data.js", "w") as f:
    f.write(js_content)

print("data.js updated!")
