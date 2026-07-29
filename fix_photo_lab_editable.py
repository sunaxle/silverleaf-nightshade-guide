import json
import re

def main():
    # Load metadata
    with open('images/07282026/photo_metadata.json', 'r') as f:
        photos = json.load(f)

    # Read original HTML
    with open('photo_lab.html', 'r') as f:
        html = f.read()

    # Inline photoData JS
    js_data = json.dumps(photos, indent=2)
    new_script = f"const photoData = {js_data};"

    # Replace existing photoData assignment
    html = re.sub(
        r'const photoData = \[.*?\];',
        new_script,
        html,
        flags=re.DOTALL
    )

    with open('photo_lab.html', 'w') as f:
        f.write(html)

    print("Successfully generated photo_lab.html with exact physical tube labels!")

if __name__ == '__main__':
    main()
