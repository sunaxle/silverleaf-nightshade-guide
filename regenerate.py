import json
import urllib.parse
import re
import os

with open('/Users/dr3/.gemini/antigravity/brain/b771bd0d-1eac-4520-b5ff-302e6ffd92d5/scratch/link_results.json') as f:
    links = json.load(f)

# Helper for BugGuide search link
def get_bg(sci):
    # Using BugGuide advanced search
    return f"https://bugguide.net/index.php?q=search&keys={urllib.parse.quote(sci)}"

def get_inat(sci, default_name=""):
    sci_key = sci
    if sci_key not in links:
        sci_key = default_name
    
    val = links.get(sci_key, {}).get('inat', '')
    if val:
        return val
    return ""

def generate_link_html(sci, inat_key=""):
    bg = get_bg(sci)
    inat = get_inat(sci, inat_key)
    
    html = f'<a href="{bg}" target="_blank">BugGuide</a>'
    if inat:
        html += f' | <a href="{inat}" target="_blank">iNat</a>'
    return html

# Scan photos
photo_map = {}
for root, dirs, files in os.walk('bugphoto'):
    for f in files:
        if f.endswith('.jpg') or f.endswith('.png'):
            folder = os.path.basename(root)
            if folder not in photo_map:
                photo_map[folder] = []
            photo_map[folder].append(os.path.join(root, f))

def get_photo_html(common_name, folder_name):
    photos = photo_map.get(f"photos_of_{folder_name}", [])
    if not photos:
        return common_name
    html = common_name + "<br>"
    for p in photos:
        html += f'<img src="{p}" alt="{common_name} Photo" style="max-width: 150px; max-height: 150px; display: inline-block; margin-top: 8px; margin-right: 5px; border-radius: 6px;">'
    return html

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Silverleaf Nightshade Insects - Field Cheat Sheet</title>
    <style>
        body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.4; margin: 0 auto; max-width: 800px; padding: 40px 20px; }}
        h1 {{ text-align: center; border-bottom: 2px solid #2c5e3b; padding-bottom: 10px; color: #2c5e3b; margin-bottom: 30px; }}
        h2 {{ color: #444; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.95rem; }}
        th, td {{ text-align: left; padding: 10px; border-bottom: 1px solid #eee; }}
        th {{ background-color: #f9f9f9; color: #555; font-weight: 600; }}
        .scientific {{ font-style: italic; color: #555; }}
        a {{ color: #0066cc; text-decoration: none; }}
        a:hover {{ text-decoration: underline; }}
        @media print {{ body {{ padding: 0; }} a {{ text-decoration: none; color: black; }} a[href^="http"]:after {{ content: ""; }} @page {{ margin: 1.5cm; }} }}
    </style>
</head>
<body>
    <h1>Silverleaf Nightshade Insects - Field Cheat Sheet</h1>
    
    <h2>Herbivores and Biocontrol Agents</h2>
    
    <h3>Beetles and Weevils (Coleoptera)</h3>
    <table>
        <tr><th>Common Name</th><th>Scientific Name</th><th>References</th></tr>
        <tr><td>{texana_false}</td><td class="scientific">Leptinotarsa texana</td><td>{texana_false_links}</td></tr>
        <tr><td>{defecta_false}</td><td class="scientific">Leptinotarsa defecta</td><td>{defecta_false_links}</td></tr>
        <tr><td>{stem_boring}</td><td class="scientific">Trichobaris texana</td><td>{stem_boring_links}</td></tr>
        <tr><td>{aeneolus}</td><td class="scientific">Anthonomus aeneolus</td><td>{aeneolus_links}</td></tr>
        <tr><td>{brevirostris}</td><td class="scientific">Anthonomus brevirostris</td><td>{brevirostris_links}</td></tr>
        <tr><td>{flea_beetle}</td><td class="scientific">Chaetocnema minuta</td><td>{flea_beetle_links}</td></tr>
        <tr><td>{flea_beetles}</td><td class="scientific">Epitrix sp.</td><td>{flea_beetles_links}</td></tr>
        <tr><td>{eggplant_tortoise}</td><td class="scientific">Gratiana pallidula</td><td>{eggplant_tortoise_links}</td></tr>
    </table>

    <h3>True Bugs (Hemiptera)</h3>
    <table>
        <tr><th>Common Name</th><th>Scientific Name</th><th>References</th></tr>
        <tr><td>{lace_bug_ariz}</td><td class="scientific">Gargaphia arizonica</td><td>{lace_bug_ariz_links}</td></tr>
        <tr><td>{lace_bug_opac}</td><td class="scientific">Gargaphia opacula</td><td>{lace_bug_opac_links}</td></tr>
        <tr><td>{say_stink}</td><td class="scientific">Chlorochroa sayi</td><td>{say_stink_links}</td></tr>
        <tr><td>{clover_leafhopper}</td><td class="scientific">Aceratagallia sanguinolenta</td><td>{clover_leafhopper_links}</td></tr>
    </table>

    <h3>Moths and Caterpillars (Lepidoptera)</h3>
    <table>
        <tr><th>Common Name</th><th>Scientific Name</th><th>References</th></tr>
        <tr><td>{eggplant_leafminer}</td><td class="scientific">Keiferia glochinella</td><td>{eggplant_leafminer_links}</td></tr>
        <tr><td>{tobacco_hornworm}</td><td class="scientific">Manduca sexta</td><td>{tobacco_hornworm_links}</td></tr>
        <tr><td>{salt_marsh}</td><td class="scientific">Estigmene acrea</td><td>{salt_marsh_links}</td></tr>
        <tr><td>{leaf_tying}</td><td class="scientific">Symmetrischema ardeola</td><td>{leaf_tying_links}</td></tr>
    </table>

    <h3>Flies (Diptera) & Grasshoppers (Orthoptera)</h3>
    <table>
        <tr><th>Common Name</th><th>Scientific Name</th><th>References</th></tr>
        <tr><td>{fruit_fly}</td><td class="scientific">Zonosemata vittigera</td><td>{fruit_fly_links}</td></tr>
        <tr><td>{vagrant_grasshopper}</td><td class="scientific">Schistocerca vaga</td><td>{vagrant_grasshopper_links}</td></tr>
    </table>

    <h2>Pollinators</h2>
    
    <h3>Bees & Other Pollinators</h3>
    <table>
        <tr><th>Common Name</th><th>Scientific Name</th><th>References</th></tr>
        <tr><td>{buff_tailed}</td><td class="scientific">Bombus terrestris</td><td>{buff_tailed_links}</td></tr>
        <tr><td>{violet_carpenter}</td><td class="scientific">Xylocopa violacea</td><td>{violet_carpenter_links}</td></tr>
        <tr><td>{carpenter_bee}</td><td class="scientific">Xylocopa iris</td><td>{carpenter_bee_links}</td></tr>
        <tr><td>{nomiine_bees}</td><td class="scientific">Pseudapis spp.</td><td>{nomiine_bees_links}</td></tr>
        <tr><td>{digger_bees}</td><td class="scientific">Amegilla spp.</td><td>{digger_bees_links}</td></tr>
        <tr><td>{sweat_bees}</td><td class="scientific">Halictidae family</td><td>{sweat_bees_links}</td></tr>
        <tr><td>{hoverflies}</td><td class="scientific">Syrphidae family</td><td>{hoverflies_links}</td></tr>
        <tr><td>{bee_beetles}</td><td class="scientific">Trichiinae subfamily</td><td>{bee_beetles_links}</td></tr>
    </table>
</body>
</html>"""

# Format HTML
html_content = html_template.format(
    texana_false=get_photo_html("Texas False Potato Beetle", "Texas_False_Potato_Beetle"),
    texana_false_links=generate_link_html("Leptinotarsa texana"),
    
    defecta_false=get_photo_html("Defecta False Potato Beetle", "Defecta_False_Potato_Beetle"),
    defecta_false_links=generate_link_html("Leptinotarsa defecta"),
    
    stem_boring=get_photo_html("Stem-boring Weevil", "Stem_boring_Weevil"),
    stem_boring_links=generate_link_html("Trichobaris texana"),
    
    aeneolus=get_photo_html("Aeneolus Weevil", "Aeneolus_Weevil"),
    aeneolus_links=generate_link_html("Anthonomus aeneolus"),
    
    brevirostris=get_photo_html("Brevirostris Weevil", "Brevirostris_Weevil"),
    brevirostris_links=generate_link_html("Anthonomus brevirostris"),
    
    flea_beetle=get_photo_html("Flea Beetle", "Flea_Beetle"),
    flea_beetle_links=generate_link_html("Chaetocnema minuta"),
    
    flea_beetles=get_photo_html("Flea Beetles", "Flea_Beetles_Epitrix"),
    flea_beetles_links=generate_link_html("Epitrix"),
    
    eggplant_tortoise=get_photo_html("Eggplant Tortoise Beetle", "Eggplant_Tortoise_Beetle"),
    eggplant_tortoise_links=generate_link_html("Gratiana pallidula"),
    
    lace_bug_ariz=get_photo_html("Lace Bug", "Lace_Bug_arizonica"),
    lace_bug_ariz_links=generate_link_html("Gargaphia arizonica"),
    
    lace_bug_opac=get_photo_html("Lace Bug", "Lace_Bug_opacula"),
    lace_bug_opac_links=generate_link_html("Gargaphia opacula"),
    
    say_stink=get_photo_html("Say Stink Bug", "Say_Stink_Bug"),
    say_stink_links=generate_link_html("Chlorochroa sayi"),
    
    clover_leafhopper=get_photo_html("Clover Leafhopper", "Clover_Leafhopper"),
    clover_leafhopper_links=generate_link_html("Aceratagallia sanguinolenta"),
    
    eggplant_leafminer=get_photo_html("Eggplant Leafminer", "Eggplant_Leafminer"),
    eggplant_leafminer_links=generate_link_html("Keiferia glochinella"),
    
    tobacco_hornworm=get_photo_html("Tobacco Hornworm", "Tobacco_Hornworm"),
    tobacco_hornworm_links=generate_link_html("Manduca sexta"),
    
    salt_marsh=get_photo_html("Salt-marsh Caterpillar", "Salt_marsh_Caterpillar"),
    salt_marsh_links=generate_link_html("Estigmene acrea"),
    
    leaf_tying=get_photo_html("Leaf-tying Moth", "Leaf_tying_Moth"),
    leaf_tying_links=generate_link_html("Symmetrischema ardeola"),
    
    fruit_fly=get_photo_html("Fruit Fly", "Fruit_Fly"),
    fruit_fly_links=generate_link_html("Zonosemata vittigera"),
    
    vagrant_grasshopper=get_photo_html("Vagrant Grasshopper", "Vagrant_Grasshopper"),
    vagrant_grasshopper_links=generate_link_html("Schistocerca vaga"),
    
    buff_tailed=get_photo_html("Buff-tailed Bumblebee", "Buff_tailed_Bumblebee"),
    buff_tailed_links=generate_link_html("Bombus terrestris"),
    
    violet_carpenter=get_photo_html("Violet Carpenter Bee", "Violet_Carpenter_Bee"),
    violet_carpenter_links=generate_link_html("Xylocopa violacea"),
    
    carpenter_bee=get_photo_html("Carpenter Bee", "Carpenter_Bee_iris"),
    carpenter_bee_links=generate_link_html("Xylocopa iris"),
    
    nomiine_bees=get_photo_html("Nomiine Bees", "Nomiine_Bees"),
    nomiine_bees_links=generate_link_html("Pseudapis"),
    
    digger_bees=get_photo_html("Digger Bees", "Digger_Bees"),
    digger_bees_links=generate_link_html("Amegilla"),
    
    sweat_bees=get_photo_html("Sweat Bees", "Sweat_Bees"),
    sweat_bees_links=generate_link_html("Halictidae"),
    
    hoverflies=get_photo_html("Hoverflies", "Hoverflies"),
    hoverflies_links=generate_link_html("Syrphidae"),
    
    bee_beetles=get_photo_html("Bee Beetles", "Bee_Beetles"),
    bee_beetles_links=generate_link_html("Trichiinae")
)

with open('cheat_sheet.html', 'w') as f:
    f.write(html_content)

print("Regenerated cheat_sheet.html successfully with correct links and new photos!")
