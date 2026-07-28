import json

with open('images/07282026/photo_metadata.json') as f:
    photo_data = json.load(f)

json_js = json.dumps(photo_data, indent=2)

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Photo Lab & Field Map | Silverleaf Nightshade</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    .lab-container {{
      max-width: 1400px;
      margin: 40px auto;
      padding: 0 20px;
    }}
    .header-actions {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 15px;
    }}
    .btn-edit {{
      background: #2e7d32;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }}
    .btn-edit:hover {{
      background: #1b5e20;
    }}
    .btn-export {{
      background: #1565c0;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      cursor: pointer;
    }}
    .btn-export:hover {{
      background: #0d47a1;
    }}
    .map-section {{
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      margin-bottom: 40px;
    }}
    #fieldMap {{
      height: 520px;
      width: 100%;
      border-radius: 10px;
      border: 1px solid #ddd;
      z-index: 1;
    }}
    .custom-marker {{
      background: #2e7d32;
      color: white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }}
    .custom-marker.app-log {{
      background: #1565c0;
    }}
    .gallery-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 25px;
    }}
    .photo-card {{
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid #eee;
    }}
    .photo-card:hover {{
      transform: translateY(-5px);
      box-shadow: 0 12px 25px rgba(0,0,0,0.1);
    }}
    .photo-img {{
      width: 100%;
      height: 220px;
      object-fit: cover;
      background: #f4f4f4;
      cursor: pointer;
    }}
    .photo-info {{
      padding: 15px;
    }}
    .photo-badge {{
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      background: #e8f5e9;
      color: #2e7d32;
      margin-bottom: 8px;
    }}
    .photo-badge.app-log {{
      background: #e3f2fd;
      color: #1565c0;
    }}
    .edit-controls {{
      display: none;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #ccc;
    }}
    .edit-controls.active {{
      display: block;
    }}
    .edit-input {{
      width: 100%;
      padding: 6px;
      margin-top: 4px;
      margin-bottom: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 0.85rem;
      font-family: inherit;
    }}
    .edit-label {{
      font-size: 0.75rem;
      font-weight: bold;
      color: #555;
      display: block;
    }}
    .tube-label {{
      margin-top: 10px;
      background: #f8f9fa;
      padding: 8px;
      border-radius: 6px;
      border-left: 3px solid #2e7d32;
      font-family: monospace;
      font-size: 0.8rem;
      color: #333;
    }}
    .sticky-bar {{
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(33, 33, 33, 0.95);
      color: white;
      padding: 15px 25px;
      border-radius: 30px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      display: flex;
      gap: 15px;
      z-index: 999;
      backdrop-filter: blur(8px);
    }}
  </style>
</head>
<body>
  <nav class="global-nav">
    <div class="nav-container">
      <div class="nav-logo">🌿 SLN Project</div>
      <ul class="nav-links">
        <li><a href="index.html">Bug Guide</a></li>
        <li><a href="journal.html">Field Journal</a></li>
        <li><a href="dashboard.html">Data Dashboard</a></li>
        <li><a href="photo_lab.html" class="active">Photo Lab</a></li>
        <li><a href="bibliography.html">Bibliography</a></li>
        <li><a href="data_collection.html" class="nav-cta">Log Data</a></li>
      </ul>
    </div>
  </nav>

  <header class="hero" style="padding: 40px 20px; text-align: center;">
    <div class="hero-content">
      <h1>Field Photo Geolocation & Sequence Lab</h1>
      <p class="subtitle">July 28, 2026 Collection — San Angelo Site S01 (Red Prairie Ecoregion)</p>
    </div>
  </header>

  <main class="lab-container">
    <div class="header-actions">
      <div>
        <button class="btn-edit" id="toggleEditBtn" onclick="toggleEditMode()">✏️ Enable Interactive Tube Assignment</button>
      </div>
      <div>
        <button class="btn-export" onclick="exportCSV()">📊 Export Tube Mapping CSV</button>
        <button class="btn-export" style="background:#43a047;" onclick="exportJSON()">📥 Save Updated JSON</button>
      </div>
    </div>

    <section class="map-section">
      <h2>
        <span>🗺️ Sequential Field Micro-Grid Map (Points 1 – 38)</span>
        <span style="font-size: 0.9rem; font-weight: normal; color: #666;">San Angelo, TX | 31.4297° N, -100.4762° W</span>
      </h2>
      <div id="fieldMap"></div>
    </section>

    <section class="gallery-section">
      <h2 style="font-family: 'Outfit', sans-serif; margin-bottom: 20px;">📷 Photo & Tube Replicate Sequence</h2>
      <div class="gallery-grid" id="galleryGrid">
        <!-- Rendered via JS -->
      </div>
    </section>
  </main>

  <script>
    // Saved in local storage or fallback to inlined photoData
    const defaultData = {json_js};
    let photoData = JSON.parse(localStorage.getItem('sln_photo_data')) || defaultData;
    let editMode = false;
    let map, mapMarkers = [];

    function toggleEditMode() {{
      editMode = !editMode;
      const btn = document.getElementById('toggleEditBtn');
      btn.style.background = editMode ? '#d32f2f' : '#2e7d32';
      btn.innerHTML = editMode ? '❌ Exit Edit Mode' : '✏️ Enable Interactive Tube Assignment';
      renderGallery();
    }}

    function updatePhotoField(seq_id, field, value) {{
      const p = photoData.find(item => item.seq_id === seq_id);
      if (p) {{
        p[field] = value;
        localStorage.setItem('sln_photo_data', JSON.stringify(photoData));
        renderMap();
        // Update display labels live
        const card = document.getElementById(`card-${{seq_id}}`);
        if (card) {{
          const tubeBox = card.querySelector('.tube-label');
          if (tubeBox) {{
            tubeBox.innerHTML = `
              <strong>Tube Tags:</strong><br>
              GEN: ${{p.tube_gen}}<br>
              BUG: ${{p.tube_bug}}<br>
              SOIL: ${{p.tube_soil}}
            `;
          }}
        }}
      }}
    }}

    function renderMap() {{
      const validPoints = photoData.filter(p => p.lat !== null && p.lon !== null);
      if (validPoints.length === 0) return;

      if (!map) {{
        map = L.map('fieldMap').setView([31.4297, -100.4762], 18);
        L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }}).addTo(map);
      }}

      // Clear existing markers
      mapMarkers.forEach(m => map.removeLayer(m));
      mapMarkers = [];

      const latLons = validPoints.map(p => [p.lat, p.lon]);
      const polyline = L.polyline(latLons, {{color: '#2e7d32', weight: 3, opacity: 0.8, dashArray: '5, 8'}}).addTo(map);
      mapMarkers.push(polyline);

      validPoints.forEach(p => {{
        const markerHtml = `<div class="custom-marker ${{p.seq_id >= 33 ? 'app-log' : ''}}">${{p.seq_id}}</div>`;
        const icon = L.divIcon({{
          html: markerHtml,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        }});

        const popupContent = `
          <div style="width: 210px;">
            <img src="${{p.jpg_path}}" style="width:100%; height:130px; object-fit:cover; border-radius:6px; margin-bottom:6px; cursor:pointer;" onclick="window.open('${{p.jpg_path}}', '_blank')">
            <strong>#${{p.seq_id}}: ${{p.filename}}</strong><br>
            <small>📍 ${{p.plant_replicate}}</small><br>
            <small>🕒 Time: ${{p.timestamp.split(' ')[1] || p.timestamp}}</small><br>
            <small>🧪 Tube: ${{p.tube_gen}}</small>
          </div>
        `;

        const m = L.marker([p.lat, p.lon], {{icon: icon}})
          .addTo(map)
          .bindPopup(popupContent);
        mapMarkers.push(m);
      }});

      map.fitBounds(polyline.getBounds(), {{padding: [30, 30]}});
    }}

    function renderGallery() {{
      const grid = document.getElementById('galleryGrid');
      grid.innerHTML = '';

      photoData.forEach(p => {{
        const isAppLog = p.seq_id >= 33;
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.id = `card-${{p.seq_id}}`;
        card.innerHTML = `
          <img src="${{p.jpg_path}}" class="photo-img" alt="${{p.filename}}" loading="lazy" onclick="window.open('${{p.jpg_path}}', '_blank')">
          <div class="photo-info">
            <span class="photo-badge ${{isAppLog ? 'app-log' : ''}}">#${{p.seq_id}} • ${{p.plant_replicate}}</span>
            <div class="photo-title">${{p.filename}}</div>
            <div class="photo-meta">
              <strong>Category:</strong> ${{p.category}}<br>
              <strong>GPS:</strong> ${{p.lat ? p.lat.toFixed(5) + ', ' + p.lon.toFixed(5) : 'App Screenshot'}}<br>
              <strong>Dist from prev:</strong> ${{p.dist_m !== null ? p.dist_m + 'm' : 'N/A'}}
            </div>

            <div class="edit-controls ${{editMode ? 'active' : ''}}">
              <label class="edit-label">Plant Replicate:</label>
              <select class="edit-input" onchange="updatePhotoField(${{p.seq_id}}, 'plant_replicate', this.value)">
                <option value="Plant 1 (P01)" ${{p.plant_replicate === 'Plant 1 (P01)' ? 'selected' : ''}}>Plant 1 (P01)</option>
                <option value="Plant 2 (P02)" ${{p.plant_replicate === 'Plant 2 (P02)' ? 'selected' : ''}}>Plant 2 (P02)</option>
                <option value="Plant 3 (P03)" ${{p.plant_replicate === 'Plant 3 (P03)' ? 'selected' : ''}}>Plant 3 (P03)</option>
                <option value="Plant 4 (P04)" ${{p.plant_replicate === 'Plant 4 (P04)' ? 'selected' : ''}}>Plant 4 (P04)</option>
                <option value="Plant 5 (P05)" ${{p.plant_replicate === 'Plant 5 (P05)' ? 'selected' : ''}}>Plant 5 (P05)</option>
                <option value="Extra / Control" ${{p.plant_replicate === 'Extra / Control' ? 'selected' : ''}}>Extra / Control</option>
                <option value="Site Overview & App Logs" ${{p.plant_replicate === 'Site Overview & App Logs' ? 'selected' : ''}}>Site Overview & App Logs</option>
              </select>

              <label class="edit-label">GEN Tube Tag:</label>
              <input type="text" class="edit-input" value="${{p.tube_gen}}" onchange="updatePhotoField(${{p.seq_id}}, 'tube_gen', this.value)">

              <label class="edit-label">BUG Tube Tag:</label>
              <input type="text" class="edit-input" value="${{p.tube_bug}}" onchange="updatePhotoField(${{p.seq_id}}, 'tube_bug', this.value)">

              <label class="edit-label">SOIL Bag Tag:</label>
              <input type="text" class="edit-input" value="${{p.tube_soil}}" onchange="updatePhotoField(${{p.seq_id}}, 'tube_soil', this.value)">
            </div>

            <div class="tube-label">
              <strong>Tube Tags:</strong><br>
              GEN: ${{p.tube_gen}}<br>
              BUG: ${{p.tube_bug}}<br>
              SOIL: ${{p.tube_soil}}
            </div>
          </div>
        `;
        grid.appendChild(card);
      }});
    }}

    function exportCSV() {{
      let csv = "Seq_ID,Filename,Timestamp,GPS_Lat,GPS_Lon,Dist_M,Plant_Replicate,Category,Tube_GEN,Tube_BUG,Tube_SOIL\\n";
      photoData.forEach(p => {{
        csv += `"${{p.seq_id}}","${{p.filename}}","${{p.timestamp}}","${{p.lat || ''}}","${{p.lon || ''}}","${{p.dist_m || ''}}","${{p.plant_replicate}}","${{p.category}}","${{p.tube_gen}}","${{p.tube_bug}}","${{p.tube_soil}}"\\n`;
      }});
      const blob = new Blob([csv], {{ type: 'text/csv;charset=utf-8;' }});
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "sln_photo_tube_mapping.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }}

    function exportJSON() {{
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(photoData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "photo_metadata.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }}

    document.addEventListener('DOMContentLoaded', () => {{
      renderMap();
      renderGallery();
    }});
  </script>
</body>
</html>"""

with open('photo_lab.html', 'w') as out_f:
    out_f.write(html_content)

print('Successfully generated photo_lab.html with interactive editing!')
