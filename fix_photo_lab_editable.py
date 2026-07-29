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
    new_script = f"const defaultData = {js_data};"

    # Replace existing defaultData assignment
    html = re.sub(
        r'const defaultData = \[.*?\];',
        new_script,
        html,
        flags=re.DOTALL
    )

    # Replace tube-label display rendering to show physical cap and side labels cleanly
    old_tube_box_js = """            tubeBox.innerHTML = `
              <strong>Tube Tags:</strong><br>
              GEN: ${p.tube_gen}<br>
              BUG: ${p.tube_bug}<br>
              SOIL: ${p.tube_soil}
            `;"""

    new_tube_box_js = """            tubeBox.innerHTML = `
              <div style="background:#f4fbf7; border-left:4px solid #2e7d32; padding:8px 10px; border-radius:6px; margin-top:8px;">
                <strong style="color:#1b5e20; font-size:12px;">🧪 Physical Tube Label:</strong><br>
                <span style="font-size:11px;"><strong>Cap:</strong> ${p.cap_label || p.tube_gen}</span><br>
                <span style="font-size:11px;"><strong>Side:</strong> ${p.side_label || p.tube_soil}</span>
              </div>
            `;"""

    html = html.replace(old_tube_box_js, new_tube_box_js)

    old_tube_card = """            <div class="tube-label">
              <strong>Tube Tags:</strong><br>
              GEN: ${p.tube_gen}<br>
              BUG: ${p.tube_bug}<br>
              SOIL: ${p.tube_soil}
            </div>"""

    new_tube_card = """            <div class="tube-label">
              <div style="background:#f4fbf7; border-left:4px solid #2e7d32; padding:8px 10px; border-radius:6px; margin-top:8px;">
                <strong style="color:#1b5e20; font-size:12px;">🧪 Physical Tube Label:</strong><br>
                <span style="font-size:11px;"><strong>Cap:</strong> ${p.cap_label || p.tube_gen}</span><br>
                <span style="font-size:11px;"><strong>Side:</strong> ${p.side_label || p.tube_soil}</span>
              </div>
            </div>"""

    html = html.replace(old_tube_card, new_tube_card)

    with open('photo_lab.html', 'w') as f:
        f.write(html)

    print("Successfully updated photo_lab.html with clean physical cap & side label display!")

if __name__ == '__main__':
    main()
