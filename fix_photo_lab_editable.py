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

    # Update renderGallery JS logic in photo_lab.html so that tube labels only show if tube is NOT N/A
    old_tube_box_js = """            tubeBox.innerHTML = `
              <div style="background:#f4fbf7; border-left:4px solid #2e7d32; padding:8px 10px; border-radius:6px; margin-top:8px;">
                <strong style="color:#1b5e20; font-size:12px;">🧪 Physical Tube Label:</strong><br>
                <span style="font-size:11px;"><strong>Cap:</strong> ${p.cap_label || p.tube_gen}</span><br>
                <span style="font-size:11px;"><strong>Side:</strong> ${p.side_label || p.tube_soil}</span>
              </div>
            `;"""

    new_tube_box_js = """            if (p.cap_label && p.cap_label !== 'N/A' && p.tube_gen !== 'N/A') {
              tubeBox.innerHTML = `
                <div style="background:#f4fbf7; border-left:4px solid #2e7d32; padding:8px 10px; border-radius:6px; margin-top:8px;">
                  <strong style="color:#1b5e20; font-size:12px;">🧪 Physical Tube Label:</strong><br>
                  <span style="font-size:11px;"><strong>Cap:</strong> ${p.cap_label || p.tube_gen}</span><br>
                  <span style="font-size:11px;"><strong>Side:</strong> ${p.side_label || p.tube_soil}</span>
                </div>
              `;
            } else {
              tubeBox.innerHTML = `<div style="padding:6px 10px; background:#f9f9f9; border-radius:6px; margin-top:8px; font-size:11px; color:#666;">📷 Site / Overview Photo (No Tubes Collected)</div>`;
            }"""

    html = html.replace(old_tube_box_js, new_tube_box_js)

    old_tube_card = """            <div class="tube-label">
              <div style="background:#f4fbf7; border-left:4px solid #2e7d32; padding:8px 10px; border-radius:6px; margin-top:8px;">
                <strong style="color:#1b5e20; font-size:12px;">🧪 Physical Tube Label:</strong><br>
                <span style="font-size:11px;"><strong>Cap:</strong> ${p.cap_label || p.tube_gen}</span><br>
                <span style="font-size:11px;"><strong>Side:</strong> ${p.side_label || p.tube_soil}</span>
              </div>
            </div>"""

    new_tube_card = """            <div class="tube-label">
              ${(p.cap_label && p.cap_label !== 'N/A' && p.tube_gen !== 'N/A') ? `
                <div style="background:#f4fbf7; border-left:4px solid #2e7d32; padding:8px 10px; border-radius:6px; margin-top:8px;">
                  <strong style="color:#1b5e20; font-size:12px;">🧪 Physical Tube Label:</strong><br>
                  <span style="font-size:11px;"><strong>Cap:</strong> ${p.cap_label || p.tube_gen}</span><br>
                  <span style="font-size:11px;"><strong>Side:</strong> ${p.side_label || p.tube_soil}</span>
                </div>
              ` : `
                <div style="padding:6px 10px; background:#f9f9f9; border-radius:6px; margin-top:8px; font-size:11px; color:#666;">📷 Site / Overview Photo (No Tubes Collected)</div>
              `}
            </div>"""

    html = html.replace(old_tube_card, new_tube_card)

    with open('photo_lab.html', 'w') as f:
        f.write(html)

    print("Successfully updated photo_lab.html to hide tube labels for overview photos!")

if __name__ == '__main__':
    main()
