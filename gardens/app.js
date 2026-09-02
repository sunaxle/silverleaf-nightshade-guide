// RGV Garden Map & Directory - Main Application Logic
document.addEventListener("DOMContentLoaded", () => {
  let gardens = [];
  let map = null;
  let markers = [];
  let userLocation = null;
  let activeCategory = "all";
  let activeCity = "all";
  let searchTerm = "";
  let currentActiveTab = "map-view";

  // Category Colors and Icons
  const categoryConfig = {
    community_garden: {
      color: "#2e7d32",
      icon: "🌱",
      name: "Community Garden"
    },
    upick_farm: {
      color: "#d97706",
      icon: "🍓",
      name: "U-Pick Farm & Orchard"
    },
    demonstration_garden: {
      color: "#0284c7",
      icon: "🎓",
      name: "Demonstration & Teaching"
    },
    botanical_sanctuary: {
      color: "#00796b",
      icon: "🌻",
      name: "Botanical Sanctuary"
    },
    historic_herbal: {
      color: "#6a1b9a",
      icon: "🌸",
      name: "Historic & Healing Garden"
    }
  };

  // 1. Initialize Map
  function initMap() {
    if (map) return;
    
    // Base tile layers (100% Free, NO API key required, NO watermarks)
    const osmStreet = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    });

    const esriTopo = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, METI, swisstopo, MapmyIndia',
      maxZoom: 18
    });

    const esriSatellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 18
    });

    // Centered on Rio Grande Valley
    map = L.map("map", {
      center: [26.18, -97.90],
      zoom: 10,
      zoomControl: false,
      layers: [osmStreet] // Default clean layer
    });

    // Layer control for switching Map style
    const baseMaps = {
      "🗺️ Street Map": osmStreet,
      "⛰️ Topo & Terrain": esriTopo,
      "🛰️ Satellite Imagery": esriSatellite
    };
    L.control.layers(baseMaps, null, { position: "topright" }).addTo(map);

    // Zoom control in top right for mobile thumb convenience
    L.control.zoom({ position: "topright" }).addTo(map);
  }

  // 2. Custom Icon Factory
  function createCustomIcon(category) {
    const config = categoryConfig[category] || { color: "#2e7d32", icon: "🌱" };
    return L.divIcon({
      className: "custom-leaflet-pin",
      html: `
        <div class="custom-pin" style="background-color: ${config.color};">
          <span>${config.icon}</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -32]
    });
  }

  // 3. Distance calculation (Haversine formula in miles)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  }

  // 4. Fetch Garden Data
  async function loadGardenData() {
    try {
      const res = await fetch("gardens.json");
      if (!res.ok) throw new Error("Fetch failed");
      gardens = await res.json();
    } catch (e) {
      console.warn("Using embedded fallback dataset:", e);
      gardens = getEmbeddedGardens();
    }

    renderAllViews();
    populateCityDropdown();
  }

  // 5. Filter Logic
  function getFilteredGardens() {
    return gardens.filter(garden => {
      // Category filter
      const matchesCategory = (activeCategory === "all" || garden.category === activeCategory);
      // City filter
      const matchesCity = (activeCity === "all" || garden.city.toLowerCase() === activeCity.toLowerCase());
      // Search term
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query || (
        garden.name.toLowerCase().includes(query) ||
        garden.city.toLowerCase().includes(query) ||
        garden.county.toLowerCase().includes(query) ||
        garden.description.toLowerCase().includes(query) ||
        garden.crops.some(c => c.toLowerCase().includes(query)) ||
        garden.features.some(f => f.toLowerCase().includes(query))
      );

      return matchesCategory && matchesCity && matchesSearch;
    }).map(garden => {
      if (userLocation) {
        garden.distance = calculateDistance(userLocation.lat, userLocation.lng, garden.lat, garden.lng);
      } else {
        garden.distance = null;
      }
      return garden;
    }).sort((a, b) => {
      if (userLocation && a.distance && b.distance) {
        return parseFloat(a.distance) - parseFloat(b.distance);
      }
      return a.name.localeCompare(b.name);
    });
  }

  // 6. Populate City Dropdown
  function populateCityDropdown() {
    const cities = Array.from(new Set(gardens.map(g => g.city))).sort();
    const selects = document.querySelectorAll(".city-select");
    selects.forEach(select => {
      select.innerHTML = `<option value="all">All Cities (${cities.length})</option>`;
      cities.forEach(city => {
        const count = gardens.filter(g => g.city === city).length;
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = `${city} (${count})`;
        select.appendChild(opt);
      });
    });
  }

  // 7. Render Markers on Map
  function renderMapMarkers(filtered) {
    if (!map) return;

    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const bounds = L.latLngBounds();

    filtered.forEach(garden => {
      const config = categoryConfig[garden.category] || { name: "Garden", color: "#2e7d32" };
      const icon = createCustomIcon(garden.category);
      const marker = L.marker([garden.lat, garden.lng], { icon }).addTo(map);

      const distanceHtml = garden.distance ? `<span style="font-size: 0.72rem; color: #1e7046; font-weight: 700;">📍 ${garden.distance} mi away</span>` : "";

      const popupHtml = `
        <div class="popup-card">
          <img src="${garden.imageUrl}" alt="${garden.name}" class="popup-img" />
          <div class="popup-body">
            <span class="popup-tag" style="color:${config.color};">${config.name}</span>
            <h4 class="popup-title">${garden.name}</h4>
            <div class="popup-address">📍 ${garden.address}</div>
            ${distanceHtml}
            <div class="popup-actions">
              <button class="popup-btn popup-btn-primary btn-open-modal" data-id="${garden.id}">View Details</button>
              <a href="${garden.directionsUrl}" target="_blank" class="popup-btn popup-btn-secondary">Directions ↗</a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });
      bounds.extend([garden.lat, garden.lng]);
      markers.push(marker);

      marker.on("click", () => {
        highlightCardInList(garden.id);
      });
    });

    if (userLocation) {
      bounds.extend([userLocation.lat, userLocation.lng]);
    }

    if (filtered.length > 0 && !userLocation) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }

  // 8. Render Cards in Drawer, Desktop Sidebar, and Directory View
  function renderAllViews() {
    const filtered = getFilteredGardens();

    // Update counts in UI
    document.querySelectorAll(".garden-count-badge").forEach(el => {
      el.textContent = `${filtered.length} Gardens`;
    });
    document.querySelectorAll(".badge-count-all").forEach(el => {
      el.textContent = filtered.length;
    });

    // 1. Render Map Markers
    renderMapMarkers(filtered);

    // 2. Render Bottom Drawer & Sidebar Cards
    renderListCards(filtered, "drawer-cards-list");
    renderListCards(filtered, "sidebar-cards-list");

    // 3. Render Grid Directory
    renderDirectoryGrid(filtered);
  }

  function renderListCards(list, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--text-muted);">
          <p style="font-size: 1.5rem; margin-bottom: 6px;">🔍</p>
          <p style="font-weight: 600;">No gardens match your search or filter.</p>
          <p style="font-size: 0.8rem; margin-top: 4px;">Try clearing filters or search terms.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(garden => {
      const config = categoryConfig[garden.category] || { color: "#2e7d32", name: "Garden" };
      const distBadge = garden.distance ? `<span class="card-distance">⚡ ${garden.distance} mi</span>` : "";

      return `
        <div class="garden-card" id="card-${garden.id}" data-id="${garden.id}">
          <div class="card-image-wrap">
            <img src="${garden.imageUrl}" alt="${garden.name}" class="card-image" loading="lazy" />
            <span class="card-badge" style="background-color: ${config.color};">${config.name}</span>
            ${distBadge}
          </div>
          <div class="card-body">
            <div class="card-title-row">
              <h3 class="card-title">${garden.name}</h3>
            </div>
            <div class="card-location">📍 ${garden.address}</div>
            <p class="card-desc">${garden.description}</p>
            
            <div class="card-features-pills">
              ${garden.features.slice(0, 3).map(f => `<span class="feature-pill">${f}</span>`).join("")}
            </div>

            <div class="card-footer-actions">
              <button class="card-btn card-btn-primary btn-open-modal" data-id="${garden.id}">
                ℹ️ Full Details & Links
              </button>
              <a href="${garden.directionsUrl}" target="_blank" class="card-btn card-btn-outline">
                🗺️ Directions
              </a>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderDirectoryGrid(list) {
    const grid = document.getElementById("directory-grid");
    if (!grid) return;

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); background: #fff; border-radius: 12px;">
          <h3>No gardens found matching your criteria</h3>
          <p>Please try adjusting your city or category selection.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(garden => {
      const config = categoryConfig[garden.category] || { color: "#2e7d32", name: "Garden" };
      const distBadge = garden.distance ? `<span class="card-distance">⚡ ${garden.distance} mi</span>` : "";

      return `
        <div class="garden-card">
          <div class="card-image-wrap">
            <img src="${garden.imageUrl}" alt="${garden.name}" class="card-image" loading="lazy" />
            <span class="card-badge" style="background-color: ${config.color};">${config.name}</span>
            ${distBadge}
          </div>
          <div class="card-body">
            <h3 class="card-title">${garden.name}</h3>
            <div class="card-location">📍 ${garden.address}</div>
            
            <p class="card-desc">${garden.description}</p>

            <div class="card-meta-list">
              <div class="card-meta-item">
                <strong>🕒 Hours:</strong> <span>${garden.hours}</span>
              </div>
              <div class="card-meta-item">
                <strong>🌱 Crops:</strong> <span>${garden.crops.slice(0, 4).join(", ")}</span>
              </div>
              <div class="card-meta-item">
                <strong>📞 Phone:</strong> <span>${garden.phone || "N/A"}</span>
              </div>
            </div>

            <div class="card-features-pills">
              ${garden.features.map(f => `<span class="feature-pill">${f}</span>`).join("")}
            </div>

            <div class="card-footer-actions">
              <button class="card-btn card-btn-primary btn-open-modal" data-id="${garden.id}">
                ℹ️ View Full Info & Links
              </button>
              <a href="${garden.directionsUrl}" target="_blank" class="card-btn card-btn-outline">
                🗺️ Directions
              </a>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // 9. Highlight card when marker is clicked
  function highlightCardInList(id) {
    const card = document.getElementById(`card-${id}`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      card.style.outline = "2px solid var(--primary)";
      setTimeout(() => {
        card.style.outline = "none";
      }, 2000);
    }
  }

  // 10. Open Detail Modal
  function openGardenModal(id) {
    const garden = gardens.find(g => g.id === id);
    if (!garden) return;

    const modal = document.getElementById("garden-detail-modal");
    const config = categoryConfig[garden.category] || { color: "#2e7d32", name: "Garden" };

    document.getElementById("modal-img").src = garden.imageUrl;
    document.getElementById("modal-category-badge").textContent = config.name;
    document.getElementById("modal-category-badge").style.backgroundColor = config.color;
    document.getElementById("modal-title").textContent = garden.name;
    document.getElementById("modal-address").textContent = garden.address;
    document.getElementById("modal-desc").textContent = garden.description;
    document.getElementById("modal-hours").textContent = garden.hours;
    document.getElementById("modal-volunteer").textContent = garden.volunteerHours || "Contact garden coordinator";
    document.getElementById("modal-howto").textContent = garden.howToJoin;
    document.getElementById("modal-crops").textContent = garden.crops.join(", ");
    document.getElementById("modal-features").innerHTML = garden.features.map(f => `<span class="feature-pill">${f}</span>`).join("");

    // Setup action buttons
    const phoneBtn = document.getElementById("modal-call-btn");
    if (garden.phone) {
      phoneBtn.href = `tel:${garden.phone.replace(/[^0-9]/g, "")}`;
      phoneBtn.style.display = "inline-flex";
      phoneBtn.innerHTML = `📞 Call: ${garden.phone}`;
    } else {
      phoneBtn.style.display = "none";
    }

    const websiteBtn = document.getElementById("modal-web-btn");
    if (garden.website) {
      websiteBtn.href = garden.website;
      websiteBtn.style.display = "inline-flex";
    } else {
      websiteBtn.style.display = "none";
    }

    const socialBtn = document.getElementById("modal-social-btn");
    if (garden.social) {
      socialBtn.href = garden.social;
      socialBtn.style.display = "inline-flex";
    } else {
      socialBtn.style.display = "none";
    }

    const dirBtn = document.getElementById("modal-directions-btn");
    dirBtn.href = garden.directionsUrl;

    modal.classList.add("active");
  }

  function closeModal() {
    const modal = document.getElementById("garden-detail-modal");
    modal.classList.remove("active");
  }

  // 11. Geolocation Setup
  function locateUser() {
    const btn = document.getElementById("btn-locate-user");
    btn.innerHTML = `⏳ Locating...`;

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      btn.innerHTML = `🎯 Near Me`;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        btn.innerHTML = `📍 My Location`;
        btn.style.background = "var(--primary)";
        btn.style.color = "#fff";

        if (map) {
          L.circleMarker([userLocation.lat, userLocation.lng], {
            radius: 9,
            color: "#ffffff",
            weight: 3,
            fillColor: "#0284c7",
            fillOpacity: 1
          }).addTo(map).bindPopup("<b>📍 You are here</b>").openPopup();

          map.setView([userLocation.lat, userLocation.lng], 12);
        }

        renderAllViews();
      },
      (err) => {
        console.warn("Geolocation error:", err);
        alert("Unable to retrieve your location. Showing full Rio Grande Valley map.");
        btn.innerHTML = `🎯 Near Me`;
      }
    );
  }

  // 12. Setup Event Listeners
  function setupEventListeners() {
    // Geolocation
    document.getElementById("btn-locate-user")?.addEventListener("click", locateUser);

    // Tab Navigation
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));

        btn.classList.add("active");
        const targetViewId = btn.dataset.tab;
        const targetView = document.getElementById(targetViewId);
        if (targetView) targetView.classList.add("active");
        currentActiveTab = targetViewId;

        if (targetViewId === "map-view" && map) {
          setTimeout(() => map.invalidateSize(), 200);
        }
      });
    });

    // Filter Chips
    document.querySelectorAll(".chip-btn").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".chip-btn").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        activeCategory = chip.dataset.category;
        renderAllViews();
      });
    });

    // Search Input
    const searchInputs = document.querySelectorAll(".search-input");
    searchInputs.forEach(input => {
      input.addEventListener("input", (e) => {
        searchTerm = e.target.value;
        // Sync other search inputs
        searchInputs.forEach(other => {
          if (other !== input) other.value = searchTerm;
        });

        // Toggle clear buttons
        document.querySelectorAll(".clear-search-btn").forEach(btn => {
          btn.style.display = searchTerm ? "block" : "none";
        });

        renderAllViews();
      });
    });

    // Clear Search Buttons
    document.querySelectorAll(".clear-search-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        searchTerm = "";
        searchInputs.forEach(i => i.value = "");
        btn.style.display = "none";
        renderAllViews();
      });
    });

    // City Dropdown Filter
    document.querySelectorAll(".city-select").forEach(select => {
      select.addEventListener("change", (e) => {
        activeCity = e.target.value;
        document.querySelectorAll(".city-select").forEach(s => s.value = activeCity);
        renderAllViews();
      });
    });

    // Bottom Sheet Drawer Toggle (Mobile)
    const drawerHeader = document.getElementById("drawer-toggle-bar");
    const drawer = document.getElementById("mobile-bottom-drawer");
    if (drawerHeader && drawer) {
      drawerHeader.addEventListener("click", () => {
        drawer.classList.toggle("collapsed");
        drawer.classList.toggle("expanded");
      });
    }

    // Modal Close
    document.getElementById("modal-close-btn")?.addEventListener("click", closeModal);
    document.getElementById("garden-detail-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "garden-detail-modal") closeModal();
    });

    // Global Delegated click for Modal Open Buttons
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-open-modal");
      if (btn) {
        const id = btn.dataset.id;
        openGardenModal(id);
      }
    });

    // Quick category jump links from Guide page
    document.querySelectorAll(".guide-category-jump").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const cat = link.dataset.category;
        activeCategory = cat;
        
        // Select corresponding chip
        document.querySelectorAll(".chip-btn").forEach(c => {
          c.classList.toggle("active", c.dataset.category === cat);
        });

        // Switch to Map or Directory
        const mapTabBtn = document.querySelector('.tab-btn[data-tab="map-view"]');
        if (mapTabBtn) mapTabBtn.click();
        renderAllViews();
      });
    });
  }

  // 13. Embedded fallback dataset
  function getEmbeddedGardens() {
    return [
      {
        "id": "penitas-little-pebbles",
        "name": "Peñitas 'Little Pebbles' Community Garden (TAMU Colonias CRC)",
        "category": "community_garden",
        "categoryLabel": "Texas A&M Colonias CRC Garden",
        "city": "Peñitas",
        "county": "Hidalgo County",
        "address": "1624 Military Rd (Hub at 414 Liberty Blvd), Peñitas, TX 78576",
        "lat": 26.2315,
        "lng": -98.4412,
        "phone": "(956) 581-3345",
        "email": "colonias@arch.tamu.edu",
        "website": "https://colonias.arch.tamu.edu",
        "social": "https://www.facebook.com/foodbankrgv/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2315,-98.4412",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM; Community workdays on Saturdays",
        "volunteerHours": "Saturday community mornings and weekly Promotora nutrition workshops",
        "description": "Community food security garden established in partnership between the Texas A&M Colonias Program, Food Bank of the RGV, and City of Peñitas. Features raised timber vegetable beds, localized drip irrigation, and Promotora-led healthy cooking demonstrations serving families along the Military Highway corridor.",
        "features": ["Texas A&M Colonias CRC", "Food Bank RGV Partnership", "Raised Timber Beds", "Drip Irrigation", "Promotora Nutrition Demos", "Free Seedling Distribution"],
        "crops": ["Jalapeños", "Serranos", "Tomatoes", "Calabacita", "Cilantro", "Collard Greens", "Swiss Chard"],
        "howToJoin": "Open to all Peñitas and western Hidalgo County residents. Register at the Peñitas Community Resource Center or attend the weekly gardening classes.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "mercedes-heb-park-garden",
        "name": "Mercedes Community Garden at H-E-B Park",
        "category": "community_garden",
        "categoryLabel": "Municipal Community Garden",
        "city": "Mercedes",
        "county": "Hidalgo County",
        "address": "520 E 2nd St (H-E-B Park), Mercedes, TX 78570",
        "lat": 26.1492,
        "lng": -97.9085,
        "phone": "(956) 565-3114",
        "email": "parks@cityofmercedes.com",
        "website": "https://cityofmercedes.com",
        "social": "https://www.facebook.com/cityofmercedestx/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1492,-97.9085",
        "hours": "Park Hours: 6:00 AM - 10:00 PM daily",
        "volunteerHours": "First and Third Saturday community garden workdays",
        "description": "Municipal community garden created by the City of Mercedes and Keep Mercedes Beautiful inside H-E-B Park. Features 12 raised organic garden beds, rich compost soil, shared irrigation, and community workshops that empower local Mid-Valley residents to grow fresh vegetables.",
        "features": ["12 Raised Garden Beds", "Park Amenities & Walking Trail", "Shared Water Spigots", "Keep Mercedes Beautiful Project", "Compost Stations"],
        "crops": ["Heirloom Tomatoes", "Bell Peppers", "Spinach", "Radishes", "Zucchini", "Culinary Herbs"],
        "howToJoin": "Mercedes residents can reserve garden beds through the City of Mercedes Parks & Recreation department or volunteer during monthly cleanups.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "tamu-agrilife-weslaco",
        "name": "Texas A&M AgriLife Research & Extension Center at Weslaco (District 12 HQ)",
        "category": "demonstration_garden",
        "categoryLabel": "AgriLife District 12 HQ & Demo Plots",
        "city": "Weslaco",
        "county": "Hidalgo County",
        "address": "2415 E Business 83, Weslaco, TX 78596",
        "lat": 26.1595,
        "lng": -97.9625,
        "phone": "(956) 968-5585",
        "email": "weslaco-center@ag.tamu.edu",
        "website": "https://weslaco.tamu.edu",
        "social": "https://www.facebook.com/AgriLifeExtensionDistrict12/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1595,-97.9625",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "Master Gardener and agricultural field trial days by appointment",
        "description": "District 12 Headquarters for Texas A&M AgriLife Extension and Research serving all of South Texas. Features extensive agricultural research acreage, subtropical vegetable trial beds, citrus greening research groves, micro-drip irrigation demonstrations, and regional training facilities.",
        "features": ["AgriLife District 12 Headquarters", "Subtropical Vegetable Trials", "Citrus Greening Research Grove", "Micro-Drip Irrigation Demos", "Master Gardener Training Center"],
        "crops": ["South Texas Onions", "Rio Red Grapefruit", "Watermelons", "Chili Peppers", "Cover Crops", "Leafy Greens"],
        "howToJoin": "Open for scheduled extension clinics, Master Gardener training, producer seminars, and educational field days.",
        "badgeColor": "#1565c0",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "hcmga-san-juan-crc",
        "name": "Hidalgo County Master Gardener Educational Garden at San Juan CRC",
        "category": "demonstration_garden",
        "categoryLabel": "Master Gardener Demonstration & CRC",
        "city": "San Juan",
        "county": "Hidalgo County",
        "address": "509 E Earling Rd (Behind San Juan CRC), San Juan, TX 78589",
        "lat": 26.1772,
        "lng": -98.1495,
        "phone": "(956) 383-1026",
        "email": "hcmga.mail@gmail.com",
        "website": "https://txmg.org/hidalgo/",
        "social": "https://www.facebook.com/HidalgoCountyMasterGardeners/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1772,-98.1495",
        "hours": "Park Open Daily; Master Gardener Demos: Tuesdays & Thursdays 8:00 AM - 12:00 PM",
        "volunteerHours": "Tuesdays & Thursdays: 8:00 AM - 12:00 PM",
        "description": "Premier public educational demonstration garden in Hidalgo County located behind the San Juan Community Resource Center. Features 12+ raised vegetable beds, certified Monarch butterfly habitat, native thornforest xeriscape, fruit tree orchard trials, rainwater catchment, and compost bays.",
        "features": ["12+ Raised Vegetable Beds", "Certified Monarch Butterfly Habitat", "Xeriscape & Native Plants", "Citrus & Fruit Tree Trials", "Composting Demo Bays", "Rainwater Harvesting"],
        "crops": ["Subtropical Vegetables", "Culinary Herbs", "Citrus", "Monarch Nectar Flora", "Native Edibles"],
        "howToJoin": "Workshops and demonstrations are free and open to the public on Tuesday and Thursday mornings. Master Gardener certification classes offered annually.",
        "badgeColor": "#1565c0",
        "imageUrl": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "south-tower-crc-garden",
        "name": "South Tower Community Resource Center Nutrition Garden (Alamo CRC)",
        "category": "community_garden",
        "categoryLabel": "Texas A&M Colonias CRC Garden",
        "city": "Alamo",
        "county": "Hidalgo County",
        "address": "1429 S Tower Rd, Alamo, TX 78516",
        "lat": 26.1685,
        "lng": -98.1182,
        "phone": "(956) 787-8947",
        "email": "colonias@arch.tamu.edu",
        "website": "https://colonias.arch.tamu.edu",
        "social": "https://www.facebook.com/HidalgoCountyPct2/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1685,-98.1182",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "Weekly health promotora classes & gardening clinics",
        "description": "Active colonia resource center garden operated by the Texas A&M Colonias Program and Hidalgo County Precinct 2. Houses container and raised-bed teaching gardens used for the 'Growing and Nourishing Healthy Communities' curriculum and diabetes-prevention cooking demos.",
        "features": ["Texas A&M Colonias Program", "Promotora Health Hub", "Raised & Container Beds", "Nutrition & Cooking Classes", "Community Seed Sharing"],
        "crops": ["Tomatoes", "Chile Piquin", "Serranos", "Nopales", "Kale", "Swiss Chard", "Cilantro"],
        "howToJoin": "Colonia families can sign up for gardening sessions and health workshops directly at the South Tower CRC office.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "progreso-weslaco-crc-garden",
        "name": "Progreso / Weslaco Community Resource Center Garden (Precinct 1)",
        "category": "community_garden",
        "categoryLabel": "Texas A&M Colonias CRC Garden",
        "city": "Progreso",
        "county": "Hidalgo County",
        "address": "510 N FM 1015, Weslaco / Progreso, TX 78596",
        "lat": 26.1265,
        "lng": -97.9638,
        "phone": "(956) 968-8733",
        "email": "colonias@arch.tamu.edu",
        "website": "https://colonias.arch.tamu.edu",
        "social": "https://www.facebook.com/hidalgocountypct1/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1265,-97.9638",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "Weekly AgriLife Better Living for Texans (BLT) classes",
        "description": "Multi-service precinct center supporting southern Hidalgo County rural colonias. Showcases raised bed and water-wise container gardening, fresh herbs for healthy cooking, and coordinates with the mobile food distributions.",
        "features": ["Colonia Outreach Hub", "Water-Wise Container Demos", "AgriLife BLT Nutrition Classes", "Family Garden Starter Kits"],
        "crops": ["Peppers", "Tomatillos", "Cilantro", "Green Beans", "Spinach", "Herbal Teas"],
        "howToJoin": "Residents can enroll in free gardening and nutrition classes at the Precinct 1 Community Center.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "alton-crc-youth-garden",
        "name": "Alton Community Resource Center & Youth Teaching Garden",
        "category": "community_garden",
        "categoryLabel": "Municipal & Colonias CRC Garden",
        "city": "Alton",
        "county": "Hidalgo County",
        "address": "349 Dawes Ave (and 3502 E Main Ave), Alton, TX 78573",
        "lat": 26.2892,
        "lng": -98.3090,
        "phone": "(956) 432-0760",
        "email": "parks@alton-tx.gov",
        "website": "https://alton-tx.gov",
        "social": "https://www.facebook.com/CityofAltonTX/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2892,-98.3090",
        "hours": "Monday - Friday 8:00 AM - 6:00 PM; Saturdays 9:00 AM - 1:00 PM",
        "volunteerHours": "Youth 4-H meetings & Senior Wellness garden hours",
        "description": "Community center and recreation complex in Alton featuring raised garden boxes, 4-H Junior Master Gardener modules, and youth summer gardening camps that teach seed starting and vegetable cultivation.",
        "features": ["Junior Master Gardener Modules", "Youth Summer Camps", "Raised Planter Boxes", "Senior Wellness Garden", "Park Amenities"],
        "crops": ["Sweet Peppers", "Cherry Tomatoes", "Radishes", "Carrots", "Squash", "Basil"],
        "howToJoin": "Contact Alton Parks & Recreation to participate in youth gardening workshops or community garden events.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "sullivan-city-crc-garden",
        "name": "Sullivan City Community Resource Center Garden",
        "category": "community_garden",
        "categoryLabel": "Texas A&M Colonias CRC Garden",
        "city": "Sullivan City",
        "county": "Hidalgo County",
        "address": "500 S Cenizo Dr (US Hwy 83), Sullivan City, TX 78595",
        "lat": 26.2785,
        "lng": -98.5630,
        "phone": "(956) 485-2828",
        "email": "colonias@arch.tamu.edu",
        "website": "https://colonias.arch.tamu.edu",
        "social": "https://www.facebook.com/sullivancitytx/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2785,-98.5630",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "Promotora gardening and health clinics monthly",
        "description": "Serving western Hidalgo colonias (Sullivan City, Cuevitas, Los Ebanos, Pueblo de Palmas). Features Promotora-led container gardening and nutrition demonstrations, micro-irrigation training, and family garden starter distributions.",
        "features": ["Western Hidalgo Colonias Hub", "Low-Water Container Demos", "Promotora Cooking Classes", "Home Garden Starter Kits"],
        "crops": ["Chili Peppers", "Squash", "Beans", "Tomatoes", "Onions", "Cilantro"],
        "howToJoin": "Sign up at the Sullivan City Community Resource Center desk.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "san-carlos-endowment-center",
        "name": "Precinct 4 Endowment Center Community Plots (San Carlos)",
        "category": "community_garden",
        "categoryLabel": "County Precinct CRC Garden",
        "city": "Edinburg",
        "county": "Hidalgo County",
        "address": "107 N Sunflower Rd, Edinburg (San Carlos), TX 78542",
        "lat": 26.2982,
        "lng": -98.0875,
        "phone": "(956) 289-7429",
        "email": "pct4@co.hidalgo.tx.us",
        "website": "https://www.hidalgocounty.us/pct4",
        "social": "https://www.facebook.com/HCPCT4/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2982,-98.0875",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM; Park open daily",
        "volunteerHours": "Youth 4-H & community gardening workshops",
        "description": "Located in the historic San Carlos colonia, this county precinct resource center features community agricultural beds, walking trails, native shade trees, and hands-on 4-H gardening activities for rural families.",
        "features": ["San Carlos Colonia Hub", "4-H Youth Agriculture", "Raised Planting Beds", "Walking Trail Landscaping", "Educational Pavilion"],
        "crops": ["Cabbage", "Collards", "Tomatoes", "Peppers", "Watermelons"],
        "howToJoin": "Contact the Endowment Center coordinator to participate in community planting workshops.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "gem-valley-food-bank-farm",
        "name": "Gem Valley Farm & Community Garden (Food Bank of the RGV)",
        "category": "community_garden",
        "categoryLabel": "Food Bank Teaching Farm & Garden",
        "city": "Pharr",
        "county": "Hidalgo County",
        "address": "724 N Cage Blvd, Pharr, TX 78577",
        "lat": 26.2023,
        "lng": -98.1837,
        "phone": "(956) 682-8101",
        "email": "volunteer@foodbankrgv.com",
        "website": "https://www.foodbankrgv.com",
        "social": "https://www.facebook.com/foodbankrgv/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2023,-98.1837",
        "hours": "Monday - Friday 8:00 AM - 4:00 PM; Volunteer workdays Mon-Fri 8:00 AM - 12:00 PM",
        "volunteerHours": "Monday - Friday: 8:00 AM - 12:00 PM (Individuals & Groups Welcome)",
        "description": "Multi-acre urban education farm and community garden on the historic grounds of Valley Fruit Company in Pharr. Features 20+ raised garden beds, high-yield row crops, greenhouse transplant tables, and drip irrigation. Harvested produce directly supplements emergency food boxes for local families.",
        "features": ["Multi-Acre Urban Farm", "20+ Raised Garden Beds", "Greenhouse & Propagation Nursery", "Emergency Food Bank Support", "Active Volunteer Shifts Daily", "Composting Facility"],
        "crops": ["Heirloom Tomatoes", "Peppers", "Squash", "Carrots", "Beets", "Eggplant", "Broccoli", "Greens"],
        "howToJoin": "Volunteer registration is free online at serve.foodbankrgv.com. School groups, civic organizations, and individuals are welcome year-round.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "jones-box-park-garden",
        "name": "Jones Box Park Community Garden",
        "category": "community_garden",
        "categoryLabel": "Municipal & AgriLife Community Garden",
        "city": "Pharr",
        "county": "Hidalgo County",
        "address": "1201 W Rosa Ln, Pharr, TX 78577",
        "lat": 26.1838,
        "lng": -98.1963,
        "phone": "(956) 402-4550",
        "email": "parks@pharr-tx.gov",
        "website": "https://pharr-tx.gov",
        "social": "https://www.facebook.com/cityofpharr/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1838,-98.1963",
        "hours": "Park Hours: 6:00 AM - 10:00 PM daily",
        "volunteerHours": "Monthly community garden workdays and AgriLife nutrition clinics",
        "description": "Municipal park community garden in Pharr with 22 raised organic garden beds, dedicated water hookups, and shade pavilions. Built in collaboration with Texas A&M AgriLife Extension to give neighborhood families space to grow organic produce.",
        "features": ["22 Raised Organic Beds", "Municipal Park Amenities", "Dedicated Water Lines", "AgriLife Nutrition Programs", "Shaded Benches"],
        "crops": ["Jalapeños", "Serranos", "Calabacita", "Onions", "Swiss Chard", "Coriander", "Tomatoes"],
        "howToJoin": "Free for Pharr residents. Inquire with Pharr Parks & Recreation or attend monthly planting events.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "speer-memorial-library-garden",
        "name": "Speer Memorial Library Community & Butterfly Garden",
        "category": "community_garden",
        "categoryLabel": "Civic & Pollinator Garden",
        "city": "Mission",
        "county": "Hidalgo County",
        "address": "801 E 12th St, Mission, TX 78572",
        "lat": 26.2205,
        "lng": -98.3188,
        "phone": "(956) 580-8750",
        "email": "library@missiontexas.us",
        "website": "https://missiontexas.us/departments/speer-memorial-library/",
        "social": "https://www.facebook.com/SpeerMemorialLibrary/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2205,-98.3188",
        "hours": "Monday - Thursday 8:00 AM - 9:00 PM; Friday & Saturday 8:00 AM - 5:00 PM",
        "volunteerHours": "Weekly garden club maintenance and youth reading/gardening sessions",
        "description": "Civic community garden outside Speer Memorial Library featuring raised vegetable and herb beds, a certified Monarch Butterfly Waystation, native Tamaulipan plants, and regular youth gardening story-hours.",
        "features": ["Civic Library Grounds", "Monarch Butterfly Waystation", "Raised Herb & Veggie Beds", "Youth Story & Garden Time", "Native Plant Signage"],
        "crops": ["Culinary Herbs", "Cherry Tomatoes", "Peppers", "Milkweeds", "Turk's Cap", "Lantana"],
        "howToJoin": "Free public access. Join the Mission Garden Club or participate in library volunteer garden care.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "san-juan-organic-destiny",
        "name": "San Juan Organic Community Garden (Valley's Destiny Church)",
        "category": "community_garden",
        "categoryLabel": "Faith & Community Garden",
        "city": "San Juan",
        "county": "Hidalgo County",
        "address": "701 W Eldora Rd, San Juan, TX 78589",
        "lat": 26.1668,
        "lng": -98.1630,
        "phone": "(956) 787-8328",
        "email": "info@valleysdestiny.org",
        "website": "https://www.facebook.com/ValleysDestinyChurch",
        "social": "https://www.facebook.com/ValleysDestinyChurch",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1668,-98.1630",
        "hours": "Accessible during daylight hours for participating families",
        "volunteerHours": "Saturday morning community work parties",
        "description": "Faith-based community garden offering 12+ raised organic planting beds in partnership with Texas A&M AgriLife and local health coalitions. Promotes fresh produce consumption and healthy lifestyles for south San Juan families.",
        "features": ["12+ Raised Organic Beds", "Faith-Community Partnership", "Drip Irrigation", "Nutrition & Cooking Classes"],
        "crops": ["Peppers", "Tomatoes", "Greens", "Calabacita", "Carrots", "Herbs"],
        "howToJoin": "Open to local community members. Sign up through the church office or after Sunday services.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "donna-faith-garden",
        "name": "Donna Faith-Based Community Garden (Iglesia Pueblo de Dios)",
        "category": "community_garden",
        "categoryLabel": "Faith & Community Garden",
        "city": "Donna",
        "county": "Hidalgo County",
        "address": "525 N 11th St (and 3211 N Victoria Rd area), Donna, TX 78537",
        "lat": 26.1745,
        "lng": -98.0532,
        "phone": "(956) 464-3351",
        "email": "info@cityofdonna.org",
        "website": "https://cityofdonna.org",
        "social": "https://www.facebook.com/cityofdonna/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1745,-98.0532",
        "hours": "Daylight hours for plot holders",
        "volunteerHours": "Seasonal planting and harvest workdays",
        "description": "Church-community partnership garden providing raised garden boxes, drip watering, and fresh organic vegetable harvesting to support local families and community food distributions in Donna.",
        "features": ["Raised Garden Boxes", "Community Food Support", "Drip Irrigation", "Family Gardening Plots"],
        "crops": ["Tomatoes", "Peppers", "Onions", "Cabbage", "Squash"],
        "howToJoin": "Contact the church coordinator or visit during community workdays.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "weslaco-seed-sprout",
        "name": "Weslaco Seed & Sprout Community Garden",
        "category": "community_garden",
        "categoryLabel": "Municipal Community Garden",
        "city": "Weslaco",
        "county": "Hidalgo County",
        "address": "301 S Border Ave (Adjacent to Valley Nature Center), Weslaco, TX 78596",
        "lat": 26.1558,
        "lng": -97.9892,
        "phone": "(956) 969-2475",
        "email": "info@valleynaturecenter.org",
        "website": "https://www.facebook.com/WeslacoSeedAndSprout",
        "social": "https://www.facebook.com/WeslacoSeedAndSprout",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1558,-97.9892",
        "hours": "Park Hours: 8:00 AM - Sunset daily",
        "volunteerHours": "Second Saturday community gardening mornings",
        "description": "Community agricultural project featuring 15 raised planting beds, compost demo areas, and educational signage providing hands-on vegetable cultivation workshops in central Weslaco.",
        "features": ["15 Raised Planting Beds", "Adjacent to Nature Reserve", "Compost Demo Unit", "Water Access", "Educational Clinics"],
        "crops": ["Warm-Season Greens", "Tomatoes", "Peppers", "Herbs", "Calabacita"],
        "howToJoin": "Volunteers and plot holders can register at the Valley Nature Center front office.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "stjda-weslaco-garden",
        "name": "First Presbyterian Church & STJDA Diabetes Wellness Garden",
        "category": "community_garden",
        "categoryLabel": "Health & Community Garden",
        "city": "Weslaco",
        "county": "Hidalgo County",
        "address": "255 N Kansas Ave, Weslaco, TX 78596",
        "lat": 26.1608,
        "lng": -97.9904,
        "phone": "(956) 627-5594",
        "email": "info@stjda.org",
        "website": "https://stjda.org",
        "social": "https://www.facebook.com/STJDA/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1608,-97.9904",
        "hours": "By appointment & scheduled class times",
        "volunteerHours": "Monthly youth diabetes empowerment gardening sessions",
        "description": "Therapeutic and educational garden operated with the South Texas Juvenile Diabetes Association. Features 10+ raised beds designed to teach youth living with diabetes and their families how to cultivate low-glycemic, nutrient-dense fresh produce.",
        "features": ["Therapeutic Diabetes Garden", "10+ Raised Beds", "Nutrition & Cooking Classes", "Youth Health Empowerment"],
        "crops": ["Kale", "Spinach", "Bell Peppers", "Tomatoes", "Cucumbers", "Fresh Herbs"],
        "howToJoin": "Families living with diabetes can enroll in STJDA wellness cohorts and gardening sessions.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "south-tex-organics",
        "name": "South Tex Organics (Historic Citrus Grove)",
        "category": "upick_farm",
        "categoryLabel": "Organic Citrus Grove & Farm",
        "city": "Mission",
        "county": "Hidalgo County",
        "address": "6700 N Doffing Rd, Mission, TX 78574",
        "lat": 26.2625,
        "lng": -98.3585,
        "phone": "(956) 585-1040",
        "email": "info@southtexorganics.com",
        "website": "https://southtexorganics.com",
        "social": "https://www.facebook.com/SouthTexOrganics/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2625,-98.3585",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM (Citrus Harvest Season: Oct - Apr)",
        "volunteerHours": "Seasonal citrus packing and educational farm walks (Call ahead)",
        "description": "Pioneering organic citrus operation founded in 1984 by Dennis Holbrook in Mission. Celebrated for growing world-class organic Rio Red grapefruit, Meyer lemons, Valencia oranges, and Texas Red sweet grapefruit without synthetic pesticides or chemicals.",
        "features": ["Pioneer Organic Citrus Farm", "Rio Red Grapefruit Grove", "Meyer Lemons & Navel Oranges", "Farm Gate Sales & Gift Shipping", "Educational Tours by Appointment"],
        "crops": ["Organic Rio Red Grapefruit", "Meyer Lemons", "Valencia Oranges", "Navel Oranges", "Texas Sweet Citrus"],
        "howToJoin": "Call (956) 585-1040 to purchase fresh harvest fruit at the farm gate or arrange seasonal group educational visits.",
        "badgeColor": "#e65100",
        "imageUrl": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "the-hour-farm",
        "name": "The Hour Farm & Permaculture Heritage Seed Bank",
        "category": "community_garden",
        "categoryLabel": "Permaculture Farm & Seed Bank",
        "city": "Weslaco",
        "county": "Hidalgo County",
        "address": "822 W Mile 14 N, Weslaco, TX 78599",
        "lat": 26.2110,
        "lng": -97.9980,
        "phone": "(956) 472-7436",
        "email": "info@sentli.org",
        "website": "https://thehour.farm",
        "social": "https://www.facebook.com/sentlicenter/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2110,-97.9980",
        "hours": "By appointment & scheduled seed workshops",
        "volunteerHours": "Permaculture work/study days and seed-saving sessions",
        "description": "Open-source agroecology research farm and heritage seed bank operated by Thomas Padilla. Specializes in non-GMO open-pollinated seed varieties, raw wildflower honey from on-site apiaries, and heirloom vegetables adapted to South Texas heat.",
        "features": ["Heritage Seed Bank", "Permaculture Polyculture", "On-Site Bee Apiaries", "Sentli Food Hub Partner"],
        "crops": ["Heirloom Romaine", "Spinach", "Heritage Carrots", "Native Herbs", "Wildflower Honey"],
        "howToJoin": "Participate in seed-saving workshops or purchase produce through the Sentli Center food hub.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "thompsons-rio-pride",
        "name": "Thompson's Rio Pride Orchards (Citrus U-Pick)",
        "category": "upick_farm",
        "categoryLabel": "Citrus U-Pick & Legacy Grove",
        "city": "Weslaco",
        "county": "Hidalgo County",
        "address": "2823 S Pleasantview Dr, Weslaco, TX 78596",
        "lat": 26.1385,
        "lng": -97.9890,
        "phone": "(956) 968-2644",
        "email": "info@riopridecitrus.com",
        "website": "https://weslaco.com",
        "social": "https://www.facebook.com/WeslacoChamber/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1385,-97.9890",
        "hours": "November - March (Citrus Harvest Season): Monday - Saturday 9:00 AM - 4:00 PM (Call Ahead)",
        "volunteerHours": "Harvest orchard tours and fruit picking days",
        "description": "Family-operated legacy citrus grove in Weslaco offering self-picking experiences and educational orchard walking tours highlighting historical Valley citrus cultivars.",
        "features": ["Citrus U-Pick Experience", "Rio Red Grapefruit", "Marrs & Navel Oranges", "Meyer Lemons & Kumquats", "Heritage Grove Tours"],
        "crops": ["Rio Red Grapefruit", "Marrs Oranges", "Navel Oranges", "Meyer Lemons", "Kumquats"],
        "howToJoin": "Call ahead at (956) 968-2644 to confirm picking availability during the winter citrus season.",
        "badgeColor": "#e65100",
        "imageUrl": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "grown-growers-market-hub",
        "name": "Grow'n Growers Farmers Market & Farm Incubator",
        "category": "community_garden",
        "categoryLabel": "Growers Market & Urban Ag Hub",
        "city": "McAllen",
        "county": "Hidalgo County",
        "address": "Firemen's Park, 201-210 N 1st St, McAllen, TX 78501",
        "lat": 26.2050,
        "lng": -98.2370,
        "phone": "(956) 681-3333",
        "email": "parks@mcallen.net",
        "website": "https://visitmcallen.com",
        "social": "https://www.facebook.com/GrownGrowersMcAllen/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2050,-98.2370",
        "hours": "Every Saturday 9:00 AM - 12:00 PM year-round",
        "volunteerHours": "Weekly market setup and grower education clinics",
        "description": "Regional farmer-owned cooperative market and micro-farm aggregation hub at Firemen's Park next to Town Lake. Central gathering point where local small growers and backyard farmers sell certified organic produce, dragon fruit, and raw honey directly to families.",
        "features": ["Every Saturday Year-Round", "Direct Farm-to-Consumer", "Local Small Grower Incubator", "Educational Clinics", "Park & Lake Setting"],
        "crops": ["Organic Greens", "Citrus", "Dragon Fruit", "Root Crops", "Local Honey", "Pastured Meats"],
        "howToJoin": "Open to all visitors every Saturday morning. Prospective growers can apply for a vendor space through the market board.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "arise-south-tower",
        "name": "ARISE Adelante South Tower Community Garden",
        "category": "community_garden",
        "categoryLabel": "Colonia Community Garden",
        "city": "Alamo",
        "county": "Hidalgo County",
        "address": "212 W San Bernardino Dr, Alamo, TX 78516",
        "lat": 26.1680,
        "lng": -98.1215,
        "phone": "(956) 783-6959",
        "email": "info@ariseadelante.org",
        "website": "https://ariseadelante.org",
        "social": "https://www.facebook.com/ARISEAdelante/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1680,-98.1215",
        "hours": "Monday - Friday 9:00 AM - 4:00 PM",
        "volunteerHours": "Weekly community health and gardening workdays",
        "description": "Colonia empowerment garden maintained by local women leaders and families of ARISE Adelante in the South Tower neighborhood. Provides seeds, raised garden boxes, and organic growing knowledge to foster family food sovereignty.",
        "features": ["Women-Led Community Garden", "Colonia Food Sovereignty", "Seed & Starter Distributions", "Environmental Justice Education"],
        "crops": ["Chili Peppers", "Cilantro", "Tomatoes", "Calabacita", "Papayas", "Medicinal Herbs"],
        "howToJoin": "Colonia residents can join ARISE weekly community meetings and gardening workshops.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "arise-las-milpas",
        "name": "ARISE Adelante Las Milpas Community Garden",
        "category": "community_garden",
        "categoryLabel": "Colonia Community Garden",
        "city": "Pharr",
        "county": "Hidalgo County",
        "address": "125 E Denny Dr, Pharr, TX 78577",
        "lat": 26.1425,
        "lng": -98.1812,
        "phone": "(956) 782-7041",
        "email": "info@ariseadelante.org",
        "website": "https://ariseadelante.org",
        "social": "https://www.facebook.com/ARISEAdelante/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1425,-98.1812",
        "hours": "Monday - Friday 9:00 AM - 4:00 PM",
        "volunteerHours": "Community garden maintenance mornings on Wednesdays & Saturdays",
        "description": "Community nutrition and vegetable plot situated at the ARISE Las Milpas center in South Pharr. Offers raised beds and container boxes to provide fresh greens and traditional vegetables for colonia families.",
        "features": ["Las Milpas Colonia Hub", "Raised Vegetable Beds", "Family Health Classes", "Youth After-School Garden Club"],
        "crops": ["Tomatillos", "Serranos", "Poblano Peppers", "Nopales", "Swiss Chard", "Cilantro"],
        "howToJoin": "Open to all Las Milpas residents. Register at the ARISE Denny Drive community center.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "arise-muniz",
        "name": "ARISE Adelante Muñiz Community Garden",
        "category": "community_garden",
        "categoryLabel": "Colonia Community Garden",
        "city": "Edinburg",
        "county": "Hidalgo County",
        "address": "3917 Jam Square, Edinburg, TX 78539",
        "lat": 26.2750,
        "lng": -98.1120,
        "phone": "(956) 783-8517",
        "email": "info@ariseadelante.org",
        "website": "https://ariseadelante.org",
        "social": "https://www.facebook.com/ARISEAdelante/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2750,-98.1120",
        "hours": "Monday - Friday 9:00 AM - 4:00 PM",
        "volunteerHours": "Weekly community plot tending and workshops",
        "description": "Colonia community garden at the Muñiz community center east of Edinburg. Focuses on family-scale organic food production, water harvesting, and home garden starter distribution.",
        "features": ["Muñiz Colonia Center", "Raised Planter Boxes", "Water Catchment", "Herbal Medicine Demos"],
        "crops": ["Peppers", "Squash", "Beans", "Tomatoes", "Epazote", "Hierbabuena"],
        "howToJoin": "Muñiz colonia neighbors can participate in free weekly gardening sessions.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "hub-of-prosperity",
        "name": "The Hub of Prosperity Farm & Community Garden",
        "category": "community_garden",
        "categoryLabel": "Community Garden & Urban Farm",
        "city": "Edinburg",
        "county": "Hidalgo County",
        "address": "3707 W University Dr, Edinburg, TX 78539",
        "lat": 26.3023,
        "lng": -98.2045,
        "phone": "(956) 665-7915",
        "email": "agroecology@utrgv.edu",
        "website": "https://www.rgvagroecology.com/locations",
        "social": "https://www.facebook.com/utrgvagroecology/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.3023,-98.2045",
        "hours": "Saturdays 8:00 AM - 12:00 PM (Volunteer & Farm Stand); Weekdays by appointment",
        "volunteerHours": "Saturdays: 8:00 AM - 12:00 PM",
        "description": "A 5-acre cooperative urban farm and community garden operated in partnership between UTRGV Agroecology and First United Methodist Church. Features 20+ community raised beds, research plots, drip irrigation, a 3,000-gallon rainwater harvester, and a weekly farm stand offering affordable hyper-local organic produce.",
        "features": ["Community Garden Beds", "Weekly Farm Stand", "Rainwater Harvesting", "Workshops & Training", "Organic Soil Trials", "Composting Demo"],
        "crops": ["Tomatoes", "Peppers", "Herbs", "Kale", "Collards", "Eggplant", "Native Pollinator Flora"],
        "howToJoin": "Quarter-acre plots and raised beds available for community members and students. Contact UTRGV Agroecology or attend Saturday morning workdays.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "utrgv-agroecology-garden",
        "name": "UTRGV Agroecology Research & Community Garden",
        "category": "community_garden",
        "categoryLabel": "University & Community Garden",
        "city": "Edinburg",
        "county": "Hidalgo County",
        "address": "1201 W University Dr, Edinburg, TX 78539",
        "lat": 26.3078,
        "lng": -98.1725,
        "phone": "(956) 665-3656",
        "email": "agroecology@utrgv.edu",
        "website": "https://www.rgvagroecology.com",
        "social": "https://www.instagram.com/utrgvagroecology/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.3078,-98.1725",
        "hours": "Mon & Wed: 8:00 - 10:00 AM; Tue & Fri: 6:30 - 8:30 PM",
        "volunteerHours": "Mon & Thu: 6:00 - 8:00 PM (Spring/Fall student & community sessions)",
        "description": "7,500 sq. ft certified organic garden and greenhouse located right on the UTRGV Edinburg campus. Features 18 raised beds, greenhouse propagation, and the semesterly 'Adopt-a-Bed' program where campus organizations and community groups adopt and cultivate their own produce.",
        "features": ["USDA Certified Organic", "Adopt-a-Bed Program", "Greenhouse", "Campus Food Pantry Donations", "Flora Walking Trail", "Youth Tours"],
        "crops": ["Seasonal Greens", "Heirloom Tomatoes", "Peppers", "Carrots", "Beets", "Bananas", "Native Pollinators"],
        "howToJoin": "Adopt-a-Bed Day occurs at the beginning of each semester. Student and community organizations are invited to adopt a raised bed with seeds, tools, and guidance provided.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "mcallen-community-garden",
        "name": "McAllen Community Garden",
        "category": "community_garden",
        "categoryLabel": "Community Garden",
        "city": "McAllen",
        "county": "Hidalgo County",
        "address": "1600 Harvey Ave (Main St & Harvey Ave), McAllen, TX 78501",
        "lat": 26.2165,
        "lng": -98.2301,
        "phone": "(956) 681-1000",
        "email": "info@mcallenparks.net",
        "website": "https://www.mcallen.net",
        "social": "https://www.facebook.com/McAllenCommunityGarden/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2165,-98.2301",
        "hours": "Sunrise to Sunset daily (Members & Plot Holders)",
        "volunteerHours": "Second Saturday monthly clean-ups & community work days",
        "description": "One of the longest-running and most celebrated community gardens in the Rio Grande Valley (operating since the 1980s). Located next to Fire Station #2, it provides 50+ dedicated gardening plots where local families, retirees, and hobbyists grow high-yield vegetables and flowers with shared water access and compost facilities.",
        "features": ["50+ Individual Rental Plots", "Shared Water Access", "On-site Composting", "Shaded Pavilion", "Fenced Security", "Tool Lending"],
        "crops": ["Cilantro", "Jalapeños", "Serranos", "Zucchini", "Cabbage", "Swiss Chard", "Okra"],
        "howToJoin": "Plots are leased on an annual basis (~$25-$35/yr) covering water, compost, and maintenance. Inquire with city parks coordinator or garden board.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "obst-family-farm",
        "name": "Obst Family Farm (U-Pick & Seasonal Orchard)",
        "category": "upick_farm",
        "categoryLabel": "U-Pick Farm & Citrus Orchard",
        "city": "Alamo",
        "county": "Hidalgo County",
        "address": "1213 Earling Rd, Alamo, TX 78516",
        "lat": 26.1712,
        "lng": -98.1189,
        "phone": "(956) 787-6917",
        "email": "info@obstfamilyfarm.com",
        "website": "https://www.obstfamilyfarm.com",
        "social": "https://www.facebook.com/ObstFamilyFarm/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1712,-98.1189",
        "hours": "Seasonal Harvest Hours: Saturdays 9:00 AM - 3:00 PM or by appointment (Call Ahead!)",
        "volunteerHours": "Special seasonal field harvest events announced online",
        "description": "A premier multi-generational family farm in Alamo operating for over 100 years. Specializes in South Texas produce and famous Rio Red citrus. Offers seasonal U-pick vegetable harvesting, citrus grove events, sweet onions, bell peppers, and watermelons.",
        "features": ["Seasonal U-Pick Vegetables", "Rio Red Grapefruit Grove", "Sweet Texas Onions", "Farm Gate Sales", "Family Friendly Tours"],
        "crops": ["Rio Red Grapefruit", "Navel Oranges", "Bell Peppers", "Sweet Onions", "Cantaloupe", "Watermelon", "Squash"],
        "howToJoin": "U-pick events are open to the public on designated seasonal weekends. Always call (956) 787-6917 or check their Facebook page before driving out to confirm crop ripeness.",
        "badgeColor": "#e65100",
        "imageUrl": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "terra-preta-farms",
        "name": "Terra Preta Organic Farm & Sentli Center",
        "category": "community_garden",
        "categoryLabel": "Organic Market Farm & CSA",
        "city": "Edinburg",
        "county": "Hidalgo County",
        "address": "2806 E Rogers Rd, Edinburg, TX 78542",
        "lat": 26.3150,
        "lng": -98.1420,
        "phone": "(956) 472-7436",
        "email": "info@terrapretafarm.com",
        "website": "https://terrapretafarm.com",
        "social": "https://www.facebook.com/terrapretafarm/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.3150,-98.1420",
        "hours": "Volunteer workdays and farm store by appointment / seasonal schedule",
        "volunteerHours": "Weekly volunteer shifts (weeding, composting, biochar, harvest)",
        "description": "A pioneering certified organic farm in Edinburg focused on building biological soil health (Terra Preta / Biochar) in collaboration with the Sentli Center for Regenerative Agriculture. Offers community CSA produce shares, farm-gate pickup, and hands-on apprenticeships.",
        "features": ["Biochar & Compost Enriched Soil", "Community Supported Agriculture (CSA)", "Sentli Regenerative Center", "Hands-on Apprenticeships", "Certified Organic Produce"],
        "crops": ["Arugula", "Heirloom Carrots", "Radishes", "Salad Mixes", "Winter Squash", "Beets", "Culinary Herbs"],
        "howToJoin": "Join their seasonal CSA box subscription online or email to join community volunteer work mornings.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "quinta-mazatlan",
        "name": "Quinta Mazatlan World Birding Center & Urban Sanctuary",
        "category": "botanical_sanctuary",
        "categoryLabel": "Urban Sanctuary & Botanical Gardens",
        "city": "McAllen",
        "county": "Hidalgo County",
        "address": "600 Sunset Dr, McAllen, TX 78503",
        "lat": 26.1822,
        "lng": -98.2255,
        "phone": "(956) 681-3370",
        "email": "quintamazatlan@mcallen.net",
        "website": "https://www.quintamazatlan.com",
        "social": "https://www.facebook.com/mcquinta/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1822,-98.2255",
        "hours": "Tuesday - Saturday 8:00 AM - 5:00 PM; Thursdays open until 7:30 PM",
        "volunteerHours": "Weekly nature stewardship, gardening, and docent programs",
        "description": "A 20-acre urban sanctuary and historic 1930s Spanish Revival estate in McAllen. Features extensive native thornforest botanical gardens, ethnobotanical trails, pollinator habitats, educational demonstration areas, and the Center for Urban Ecology.",
        "features": ["Ethnobotanical Native Gardens", "Historic Adobe Mansion", "Pollinator Sanctuary", "Center for Urban Ecology", "Native Plant Demos"],
        "crops": ["Native Ebony", "Anacahuita", "Turk's Cap", "Lantana", "Crucita"],
        "howToJoin": "Admission $3 adults, $2 seniors/children. Volunteers can assist with native plant propagation and trail maintenance.",
        "badgeColor": "#00796b",
        "imageUrl": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "national-butterfly-center",
        "name": "National Butterfly Center Botanical & Pollinator Gardens",
        "category": "botanical_sanctuary",
        "categoryLabel": "Botanical Preserve & Butterfly Habitat",
        "city": "Mission",
        "county": "Hidalgo County",
        "address": "3333 Butterfly Park Dr, Mission, TX 78572",
        "lat": 26.1770,
        "lng": -98.3755,
        "phone": "(956) 583-5400",
        "email": "naba@nationalbutterflycenter.org",
        "website": "https://www.nationalbutterflycenter.org",
        "social": "https://www.facebook.com/natbutterflies/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1770,-98.3755",
        "hours": "Open daily 8:00 AM - 5:00 PM",
        "volunteerHours": "Gardening workdays Tuesdays & Saturdays",
        "description": "A magnificent 100-acre botanical preserve on the banks of the Rio Grande in Mission. Home to over 200 native plant species planted specifically as larval hosts and nectar sources for wild butterflies.",
        "features": ["100-Acre Native Botanical Habitat", "Over 200 Native Nectar & Host Species", "Demonstration Gardens", "Native Plant Nursery"],
        "crops": ["Native Milkweeds", "Gregg's Mistflower", "Betony", "Guayacan", "Wild Olive"],
        "howToJoin": "Open daily with day admission. Volunteers help with native plant nursery potting and garden care.",
        "badgeColor": "#00796b",
        "imageUrl": "https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "valley-nature-center",
        "name": "Valley Nature Center & Secret Botanical Garden",
        "category": "botanical_sanctuary",
        "categoryLabel": "Botanical Sanctuary & Nature Reserve",
        "city": "Weslaco",
        "county": "Hidalgo County",
        "address": "301 S Border Ave, Weslaco, TX 78596",
        "lat": 26.1558,
        "lng": -97.9892,
        "phone": "(956) 969-2475",
        "email": "info@valleynaturecenter.org",
        "website": "https://www.valleynaturecenter.org",
        "social": "https://www.facebook.com/ValleyNatureCenter/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1558,-97.9892",
        "hours": "Tuesday - Saturday 9:00 AM - 5:00 PM; Sunday 1:00 PM - 5:00 PM",
        "volunteerHours": "Weekly garden maintenance & propagation",
        "description": "A 6-acre historic botanical oasis inside Gibson Park in Weslaco, celebrated as the oldest nature center in the Rio Grande Valley. Features lush native plant collections, cactus gardens, shaded sabal palm walkways, and a certified native plant nursery.",
        "features": ["Historic 6-Acre Botanical Garden", "Native Plant Nursery Sales", "Cactus Rockery", "Butterfly Stations", "Discovery Center"],
        "crops": ["Texas Kidneywood", "Snake Eyes", "Pigeonberry", "Coral Bean", "Prickly Pear"],
        "howToJoin": "Admission is $5 ($3 seniors/children). Homeowners can buy native RGV plants at regular plant sales.",
        "badgeColor": "#00796b",
        "imageUrl": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "salinas-family-farm",
        "name": "Salinas Family Farm (Premier Strawberry U-Pick)",
        "category": "upick_farm",
        "categoryLabel": "Strawberry U-Pick Farm",
        "city": "Lyford",
        "county": "Willacy County",
        "address": "7233 Simon Gomez Rd, Lyford, TX 78569",
        "lat": 26.4182,
        "lng": -97.7850,
        "phone": "(956) 347-0000",
        "email": "salinasfarmslyford@gmail.com",
        "website": "https://www.facebook.com/SalinasFamilyFarm/",
        "social": "https://www.facebook.com/SalinasFamilyFarm/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.4182,-97.7850",
        "hours": "January - April (Strawberry Peak Season): Designated picking days booked online",
        "volunteerHours": "Community strawberry harvesting events",
        "description": "The premier strawberry U-pick destination in the Rio Grande Valley. Cultivates sweet South Texas Chandler, Festival, and Albion strawberry varieties. Families and visitors pick fresh berries right off the vine.",
        "features": ["Valley Premier Strawberry U-Pick", "Chandler & Festival Strawberries", "Picking Buckets Provided", "Family-Owned Heritage Farm"],
        "crops": ["Fresh Strawberries", "Seasonal Greens", "Spring Vegetables"],
        "howToJoin": "Due to immense popularity, picking sessions are booked via time-slot reservations on their official Facebook page.",
        "badgeColor": "#e65100",
        "imageUrl": "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "gracia-farms-upick",
        "name": "Gracia Farms (Fresh Vegetable U-Pick & Farm Stand)",
        "category": "upick_farm",
        "categoryLabel": "Vegetable U-Pick & Family Farm",
        "city": "San Benito",
        "county": "Cameron County",
        "address": "Los Ranchos Rd (off FM 732), San Benito, TX 78586",
        "lat": 26.1310,
        "lng": -97.6350,
        "phone": "(956) 970-4628",
        "email": "graciafarms@gmail.com",
        "website": "https://localharvest.org",
        "social": "https://www.facebook.com/GraciaFarms/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1310,-97.6350",
        "hours": "November - May: Tuesday - Saturday 9:00 AM - 4:00 PM (Call to Confirm)",
        "volunteerHours": "Field harvest days and farm gate sales",
        "description": "Chemical-free small family farm in San Benito offering direct farm-gate sales and seasonal field-picking U-pick opportunities for over 20 varieties of vegetables, pasture eggs, and artisan goat dairy.",
        "features": ["Chemical-Free Vegetable Rows", "Field U-Pick Options", "Pasture Eggs & Goat Dairy", "Direct Farm Stand"],
        "crops": ["Tomatoes", "Peppers", "Cabbage", "Broccoli", "Cauliflower", "Sweet Corn", "Zucchini"],
        "howToJoin": "Call ahead at (956) 970-4628 to confirm daily picking rows and crop availability.",
        "badgeColor": "#e65100",
        "imageUrl": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "bonita-flats-vineyard",
        "name": "Bonita Flats Farm & Vineyard",
        "category": "community_garden",
        "categoryLabel": "Micro-Vineyard & Organic Produce",
        "city": "Los Fresnos",
        "county": "Cameron County",
        "address": "32071 FM 3069, Los Fresnos, TX 78566",
        "lat": 26.0685,
        "lng": -97.4810,
        "phone": "(956) 233-1200",
        "email": "info@bonita-flats.com",
        "website": "https://bonita-flats.com",
        "social": "https://www.facebook.com/BonitaFlats/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.0685,-97.4810",
        "hours": "Weekends by appointment / seasonal tasting hours",
        "volunteerHours": "July/August grape harvest and crush volunteer days",
        "description": "Estate micro-vineyard and chemical-free produce farm cultivating Blanc du Bois wine grapes adapted to the South Texas climate, alongside seasonal organic row vegetables.",
        "features": ["Estate Micro-Vineyard", "Blanc du Bois Grapes", "Pesticide-Free Vegetables", "Summer Crush Volunteer Days"],
        "crops": ["Wine Grapes", "Sweet & Hot Peppers", "Eggplants", "Squash", "Culinary Herbs"],
        "howToJoin": "Visit during weekend tasting hours or volunteer for the summer grape crush.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "resaca-grove-farm",
        "name": "Resaca Grove Farm & Heritage Pecan Orchard",
        "category": "upick_farm",
        "categoryLabel": "Citrus & Pecan Farm",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "4050 Salida del Sol, Brownsville, TX 78526",
        "lat": 25.9860,
        "lng": -97.5255,
        "phone": "(956) 551-5900",
        "email": "info@lonestargrapefruit.com",
        "website": "https://lonestargrapefruit.com",
        "social": "https://www.facebook.com/ResacaGroveFarm/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9860,-97.5255",
        "hours": "October - March: Monday - Saturday 9:00 AM - 5:00 PM",
        "volunteerHours": "Orchard walks and pecan harvest season visits",
        "description": "Picturesque multi-generational citrus grove and heritage pecan orchard situated along the Resaca del Rancho Viejo. Farm shop offers fresh Rio Red grapefruit, Meyer lemons, and Texas pecans.",
        "features": ["Resaca Waterfront Grove", "Rio Red Grapefruit", "Shelled & Roasted Pecans", "Seasonal Farm Shop"],
        "crops": ["Rio Red Grapefruit", "Sweet Oranges", "Meyer Lemons", "Texas Pecans"],
        "howToJoin": "Farm shop is open during the winter harvest season. Call (956) 551-5900 for visits.",
        "badgeColor": "#e65100",
        "imageUrl": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "cameron-master-gardener-arboretum",
        "name": "Cameron County Master Gardeners Arboretum & Demonstration Garden",
        "category": "demonstration_garden",
        "categoryLabel": "Demonstration Garden & Arboretum",
        "city": "San Benito",
        "county": "Cameron County",
        "address": "1390 W Expressway 83, San Benito, TX 78586",
        "lat": 26.1382,
        "lng": -97.6480,
        "phone": "(956) 361-8236",
        "email": "cameronmg@ag.tamu.edu",
        "website": "https://txmg.org/cameron/",
        "social": "https://www.facebook.com/CameronCountyMasterGardeners/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1382,-97.6480",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM; Guided educational walks on designated Saturdays",
        "volunteerHours": "Weekly volunteer maintenance and propagation mornings",
        "description": "Maintained by the Texas A&M AgriLife Cameron County Master Gardeners, this expansive educational arboretum and demonstration space features native thornforest flora, advanced composting systems, raised bed vegetable trials, and butterfly host plants.",
        "features": ["Native Thornforest Arboretum", "Compost Demonstration Facility", "Subtropical Vegetable Trials", "Master Gardener Plant Sales", "Certified Wildlife Habitat"],
        "crops": ["Native South Texas Trees", "Medicinal Plants", "Subtropical Vegetables", "Butterfly Host Vines"],
        "howToJoin": "Community members can attend free monthly gardening seminars, seasonal plant sales, or apply to join the Master Gardener Intern class.",
        "badgeColor": "#1565c0",
        "imageUrl": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "bob-clark-social-services-garden",
        "name": "Bob Clark Social Services Center Community Garden",
        "category": "community_garden",
        "categoryLabel": "County Community Resource Center",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "9901 California Rd, Brownsville, TX 78521",
        "lat": 25.9680,
        "lng": -97.4320,
        "phone": "(956) 831-1506",
        "email": "socialservices@cameroncountytx.gov",
        "website": "https://www.cameroncountytx.gov",
        "social": "https://www.facebook.com/cameroncountytx/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9680,-97.4320",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "Weekly health and nutrition workshops in partnership with UTRGV AHEC",
        "description": "Multipurpose county facility serving eastern Brownsville colonias (Cameron Park, Southmost, El Rancho Grande). Features raised vegetable planting boxes and container gardens used in tandem with UTRGV AHEC and AgriLife BLT courses.",
        "features": ["County Social Services Center", "UTRGV AHEC Partnership", "Raised Vegetable Planting Boxes", "Nutrition & Cooking Demonstrations"],
        "crops": ["Peppers", "Squash", "Onions", "Leafy Greens", "Culinary & Medicinal Herbs"],
        "howToJoin": "Open to East Brownsville and colonia residents through county social service programs.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "cameron-park-cultural-center",
        "name": "Cameron Park Community Center (El Centro Cultural) CRC",
        "category": "community_garden",
        "categoryLabel": "Texas A&M Colonias CRC Garden",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "2100 Avenida Gregory, Brownsville, TX 78526",
        "lat": 25.9610,
        "lng": -97.4912,
        "phone": "(956) 548-6930",
        "email": "colonias@arch.tamu.edu",
        "website": "https://colonias.arch.tamu.edu",
        "social": "https://www.facebook.com/cameroncountytx/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9610,-97.4912",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM; Park open daily",
        "volunteerHours": "Promotora-led container gardening and health workshops",
        "description": "The birthplace of the Texas A&M Colonias Program Community Resource Center model (established 1994). Located at La Esperanza Park, promotoras conduct community nutrition workshops, container gardening tutorials, and distribute seedling starter packs.",
        "features": ["Historic First TAMU Colonias CRC (1994)", "La Esperanza Park Integration", "Promotora Nutrition Demos", "Seedling Distributions"],
        "crops": ["Tomatoes", "Chiles", "Calabacitas", "Nopales", "Cilantro", "Herbs"],
        "howToJoin": "Cameron Park residents can register for programs at El Centro Cultural.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "proyecto-juan-diego",
        "name": "Proyecto Juan Diego Community Garden",
        "category": "community_garden",
        "categoryLabel": "Nonprofit Colonia Community Garden",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "3910 Paredes Line Rd, Brownsville, TX 78526",
        "lat": 25.9620,
        "lng": -97.4785,
        "phone": "(956) 542-2488",
        "email": "info@proyecto-jd.org",
        "website": "https://www.proyecto-jd.org",
        "social": "https://www.facebook.com/proyectojuandiego/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9620,-97.4785",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "Weekly community plot tending and health workshops",
        "description": "Community empowerment garden founded by Daughters of Charity serving Cameron Park families. Features organic vegetable beds, promotora-led cooking classes, and family wellness plots integrated into preventive health programs.",
        "features": ["Multi-Bed Community Garden", "Promotora Health Integration", "Family Wellness Plots", "Youth Gardening Workshops"],
        "crops": ["Chiles", "Tomatoes", "Nopales", "Squash", "Cilantro", "Spinach", "Swiss Chard"],
        "howToJoin": "Open to local Cameron Park and Brownsville families. Contact Proyecto Juan Diego to enroll.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "santa-rosa-crc-garden",
        "name": "Santa Rosa Community Park & Resource Center Garden",
        "category": "community_garden",
        "categoryLabel": "County Community Resource Center",
        "city": "Santa Rosa",
        "county": "Cameron County",
        "address": "101 E Santa Rosa Ave, Santa Rosa, TX 78593",
        "lat": 26.2575,
        "lng": -97.8285,
        "phone": "(956) 427-8069",
        "email": "cameron-tx@tamu.edu",
        "website": "https://cameroncountytx.gov",
        "social": "https://www.facebook.com/cameroncountytx/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.2575,-97.8285",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM; Park open daily",
        "volunteerHours": "Seasonal gardening workshops & 4-H youth nutrition",
        "description": "Community center and park in western Cameron County serving rural agricultural colonias. Features covered outdoor learning pavilion, community raised beds, native butterfly garden, and seasonal vegetable cultivation.",
        "features": ["Rural Colonia Hub", "Covered Outdoor Classroom", "Community Garden Beds", "Native Butterfly Garden"],
        "crops": ["Peppers", "Melons", "Greens", "Squash", "Tomatoes"],
        "howToJoin": "Contact Cameron County Precinct 4 or AgriLife extension to participate.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "harlingen-housing-lemoyne",
        "name": "Harlingen Housing Authority – Le Moyne Gardens Community Garden",
        "category": "community_garden",
        "categoryLabel": "Public Housing Community Garden",
        "city": "Harlingen",
        "county": "Cameron County",
        "address": "3220 Wilson Rd (and 1900 S M St), Harlingen, TX 78550",
        "lat": 26.1675,
        "lng": -97.6830,
        "phone": "(956) 423-2521",
        "email": "info@harlingenha.org",
        "website": "https://www.harlingenha.org",
        "social": "https://www.facebook.com/HarlingenHousingAuthority/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1675,-97.6830",
        "hours": "Accessible daily for housing residents and registered volunteers",
        "volunteerHours": "Weekly community plot maintenance and senior harvest hours",
        "description": "Public housing community garden featuring 14+ raised organic vegetable beds, citrus trees, and irrigation lines. Empowers public housing residents with direct access to self-grown organic vegetables.",
        "features": ["14+ Raised Organic Beds", "Public Housing Integration", "Citrus Trees", "Direct Food Sovereignty"],
        "crops": ["Collard Greens", "Tomatoes", "Peppers", "Squash", "Carrots", "Onions"],
        "howToJoin": "Free for Le Moyne Gardens and Harlingen Housing Authority residents.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "hope-small-farm-sustainability",
        "name": "HOPE for Small Farm Sustainability & Yahweh's Farm",
        "category": "upick_farm",
        "categoryLabel": "Organic Farm, U-Pick & Community Plots",
        "city": "Harlingen",
        "county": "Cameron County",
        "address": "19833 Morris Rd, Harlingen, TX 78552",
        "lat": 26.1534,
        "lng": -97.6631,
        "phone": "(956) 412-4916",
        "email": "yahwehs.farmgarden@gmail.com",
        "website": "https://www.hopeforsfs.org",
        "social": "https://www.facebook.com/YahwehsAllNaturalFarmAndGarden/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1534,-97.6631",
        "hours": "Farm Store: Mon, Thu, Fri, Sat 10:00 AM - 6:00 PM; Sun 9:00 AM - 5:00 PM",
        "volunteerHours": "Volunteer shifts and community garden plots available weekly",
        "description": "Nonprofit sustainable farm and educational hub offering 20x20 ft community garden plots, USDA Certified Organic produce, famous Pick-Your-Own Carrot Days, Moringa wellness products, farm tours, and farmer training.",
        "features": ["20x20 ft Community Plots", "Pick-Your-Own Carrot Days", "USDA Certified Organic", "CSA Veggie & Moringa Boxes", "Farmer Training Workshops"],
        "crops": ["Rainbow Carrots", "Moringa", "Beets", "Kale", "Heirloom Tomatoes", "Broccoli", "Cauliflower"],
        "howToJoin": "Community garden plots are available for a small seasonal fee or 100% free in exchange for 4 hours of monthly volunteer service.",
        "badgeColor": "#e65100",
        "imageUrl": "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "loaves-and-fishes-garden",
        "name": "Loaves & Fishes of the RGV Community Pantry Garden",
        "category": "community_garden",
        "categoryLabel": "Pantry Food Security Garden",
        "city": "Harlingen",
        "county": "Cameron County",
        "address": "514 S E St, Harlingen, TX 78550",
        "lat": 26.1878,
        "lng": -97.6932,
        "phone": "(956) 423-1014",
        "email": "info@lfrgv.org",
        "website": "https://www.lfrgv.org",
        "social": "https://www.facebook.com/lfrgv/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1878,-97.6932",
        "hours": "Monday - Friday 8:00 AM - 4:00 PM",
        "volunteerHours": "Weekly pantry garden volunteer shifts",
        "description": "Community food pantry and emergency shelter garden where volunteers grow fresh vegetables to directly supply the Open Arms Dining Hall and Bread of Life food pantry.",
        "features": ["Pantry Direct Garden", "Dining Hall Support", "Community Volunteer Workdays"],
        "crops": ["Greens", "Tomatoes", "Onions", "Squash", "Carrots"],
        "howToJoin": "Volunteer opportunities are open year-round by contacting the Loaves & Fishes volunteer coordinator.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "heavin-memorial-park-garden",
        "name": "Heavin Memorial Park Community Garden",
        "category": "community_garden",
        "categoryLabel": "Municipal Trail Community Garden",
        "city": "San Benito",
        "county": "Cameron County",
        "address": "705 N Bowie St, San Benito, TX 78586",
        "lat": 26.1362,
        "lng": -97.6322,
        "phone": "(956) 361-3800",
        "email": "parks@cityofsanbenito.com",
        "website": "https://cityofsanbenito.com",
        "social": "https://www.facebook.com/CityofSanBenito/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1362,-97.6322",
        "hours": "Park Hours: 6:00 AM - 10:00 PM daily",
        "volunteerHours": "Seasonal community planting days and youth civic workdays",
        "description": "Park-based community garden beds situated along the historic Resaca trail in San Benito, utilized for community planting days, youth civic engagement, and pollinator plantings.",
        "features": ["Resaca Trail Setting", "Community Garden Beds", "Pollinator Plantings", "Public Walking Trails"],
        "crops": ["Seasonal Veggies", "Tomatoes", "Peppers", "Nectar Flowers"],
        "howToJoin": "Free public access. Inquire with San Benito Parks & Recreation.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "tres-angeles-brownsville",
        "name": "Tres Angeles Community Garden (BWC)",
        "category": "community_garden",
        "categoryLabel": "Community Garden",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "805 E Tyler St (at E 8th St), Brownsville, TX 78520",
        "lat": 25.9085,
        "lng": -97.4932,
        "phone": "(956) 541-0180",
        "email": "info@brownsvillewellnesscoalition.com",
        "website": "https://www.btxwc.org",
        "social": "https://www.facebook.com/BrownsvilleWellnessCoalition/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9085,-97.4932",
        "hours": "Open daily for members; Community classes 1st & 3rd Thursday at 6:00 PM",
        "volunteerHours": "Weekly volunteer hours announced on BWC social media",
        "description": "The flagship community garden managed by the Brownsville Wellness Coalition (established 2013). Serves as an active downtown hub providing 14 raised garden beds, organic soil preparation, tool kits, and practical gardening workshops.",
        "features": ["14 Raised Garden Beds", "Organic Soil & Tools Provided", "Bilingual Gardening Classes", "Tool Shed", "Drip Irrigation"],
        "crops": ["Tomatoes", "Peppers", "Coriander", "Onions", "Radishes", "Eggplant", "Spinach"],
        "howToJoin": "Residents can register for a bed through Brownsville Wellness Coalition. Plots are free or low-cost with participation in community workshops.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "esperanza-community-garden",
        "name": "Esperanza Community Garden (BWC)",
        "category": "community_garden",
        "categoryLabel": "Community Garden",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "2115 Roosevelt St, Brownsville, TX 78521",
        "lat": 25.9184,
        "lng": -97.4725,
        "phone": "(956) 541-0180",
        "email": "gardens@brownsvillewellnesscoalition.com",
        "website": "https://www.btxwc.org",
        "social": "https://www.facebook.com/BrownsvilleWellnessCoalition/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9184,-97.4725",
        "hours": "Dawn to Dusk daily for plot holders",
        "volunteerHours": "Saturday community mornings (call to confirm)",
        "description": "Established in 2014 by BWC to bring fresh food production into East Brownsville neighborhoods. Focuses heavily on youth education, 20+ multigenerational family plots, and teaching regenerative urban farming techniques.",
        "features": ["20+ Family Garden Plots", "Youth Programs", "Compost Station", "Organic Production", "Shade Structure"],
        "crops": ["Green Beans", "Squash", "Chili Peppers", "Mustard Greens", "Beets", "Culinary Herbs"],
        "howToJoin": "East Brownsville neighbors can sign up with BWC coordinators for an assigned raised bed each planting cycle.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "lemon-grass-community-garden",
        "name": "Lemon Grass Community Garden (BWC)",
        "category": "community_garden",
        "categoryLabel": "Community Garden",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "E 25th St & Taylor St, Brownsville, TX 78521",
        "lat": 25.9142,
        "lng": -97.4795,
        "phone": "(956) 541-0180",
        "email": "gardens@brownsvillewellnesscoalition.com",
        "website": "https://www.btxwc.org",
        "social": "https://www.facebook.com/BrownsvilleWellnessCoalition/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9142,-97.4795",
        "hours": "Open daylight hours for local members",
        "volunteerHours": "Community workdays announced seasonally",
        "description": "A vibrant neighborhood sanctuary in Brownsville named after its lush fragrant herb perimeter. Provides 12 dedicated beds for surrounding residents with an emphasis on herbal remedies, pollinator friendly flowers, and kitchen vegetables.",
        "features": ["12 Raised Vegetable Beds", "Medicinal & Culinary Herbs", "Pollinator Sanctuary", "Tool Access", "Rain Barrels"],
        "crops": ["Lemongrass", "Basil", "Mint", "Cilantro", "Tomatoes", "Peppers", "Marigolds"],
        "howToJoin": "Contact Brownsville Wellness Coalition or stop by during community work sessions.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "zulema-reyes-belden-garden",
        "name": "Zulema Reyes - Belden Community Garden (BWC)",
        "category": "community_garden",
        "categoryLabel": "Community Garden",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "25 W Fronton St, Brownsville, TX 78520",
        "lat": 25.9030,
        "lng": -97.5022,
        "phone": "(956) 541-0180",
        "email": "gardens@brownsvillewellnesscoalition.com",
        "website": "https://www.btxwc.org",
        "social": "https://www.facebook.com/BrownsvilleWellnessCoalition/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9030,-97.5022",
        "hours": "Accessible daylight hours for members",
        "volunteerHours": "Monthly community garden maintenance days",
        "description": "Historic neighborhood garden in the Belden community along the Belden Trail corridor. Named in honor of community leader Zulema Reyes, empowering historic West Brownsville families to grow their own fresh produce in 10 raised beds.",
        "features": ["10 Raised Beds", "Historic Rail-to-Trail Setting", "Compost Hub", "Community Gathering Space"],
        "crops": ["Calabacita", "Onions", "Garlic", "Tomatillos", "Peppers", "Herbs"],
        "howToJoin": "Belden neighborhood residents receive priority plot allocations via BWC.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "ruth-genes-community-garden",
        "name": "Ruth & Gene's Community Garden (BWC)",
        "category": "community_garden",
        "categoryLabel": "Community Garden",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "326 W Fronton St, Brownsville, TX 78520",
        "lat": 25.9025,
        "lng": -97.5065,
        "phone": "(956) 541-0180",
        "email": "gardens@brownsvillewellnesscoalition.com",
        "website": "https://www.btxwc.org",
        "social": "https://www.facebook.com/BrownsvilleWellnessCoalition/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9025,-97.5065",
        "hours": "Dawn to dusk for plot holders",
        "volunteerHours": "Organized volunteer drives each spring and autumn",
        "description": "A close-knit community garden on Fronton Street offering 10 fertile raised beds and fruit trees to surrounding residents. Strong focus on organic pest deterrence, companion planting, and La Cocina Alegre cooking workshops.",
        "features": ["10 Raised Beds", "Fruit Trees", "Organic Soil", "Companion Planting Demos", "Rain Catchment"],
        "crops": ["Citrus", "Papaya", "Kale", "Radishes", "Carrots", "Peppers"],
        "howToJoin": "Apply with BWC online or via the downtown office at 1018 E Washington St.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "rosemary-community-garden",
        "name": "Rosemary Community Garden at Portway Acres",
        "category": "community_garden",
        "categoryLabel": "Community Garden & Park",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "Austin Rd & Crockett St (Portway Acres Park), Brownsville, TX 78521",
        "lat": 25.9298,
        "lng": -97.4682,
        "phone": "(956) 541-0180",
        "email": "gardens@brownsvillewellnesscoalition.com",
        "website": "https://www.btxwc.org",
        "social": "https://www.facebook.com/BrownsvilleWellnessCoalition/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9298,-97.4682",
        "hours": "Park Hours: 6:00 AM - 10:00 PM",
        "volunteerHours": "Seasonal park beautification & garden maintenance days",
        "description": "Nestled inside Portway Acres Park in northeast Brownsville, this park-based community garden features 12 raised planter boxes, integrating recreation, walking trails, and fresh food gardening for local neighborhood families.",
        "features": ["12 Raised Planter Boxes", "Park Integration", "Children's Play Area", "Water Source", "Walking Paths"],
        "crops": ["Tomatoes", "Cucumbers", "Summer Squash", "Beans", "Fresh Herbs"],
        "howToJoin": "Free participation for neighborhood families through BWC and Brownsville Parks & Rec.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "tsc-community-garden",
        "name": "Texas Southmost College (TSC) Community Garden & Greenhouse",
        "category": "community_garden",
        "categoryLabel": "Campus & Community Garden",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "80 Fort Brown St, Brownsville, TX 78520",
        "lat": 25.8988,
        "lng": -97.4925,
        "phone": "(956) 295-3600",
        "email": "studentlife@tsc.edu",
        "website": "https://www.tsc.edu",
        "social": "https://www.facebook.com/TexasSouthmostCollege/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.8988,-97.4925",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "Weekly student and volunteer gardening hours",
        "description": "Campus agricultural facility featuring a large-scale commercial greenhouse and outdoor raised planter beds in partnership with BWC. Harvested produce directly stocks the TSC Student Food Pantry to alleviate student food insecurity.",
        "features": ["Commercial Greenhouse", "Raised Planter Beds", "TSC Food Pantry Support", "Student Horticulture Training"],
        "crops": ["Hydroponic Greens", "Tomatoes", "Peppers", "Herbs", "Nursery Starts"],
        "howToJoin": "Open to TSC students, faculty, staff, and community volunteers.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "utrgv-brownsville-cueto",
        "name": "UTRGV Brownsville Community Garden (Historic Cueto Building)",
        "category": "community_garden",
        "categoryLabel": "University & Urban Garden",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "1307 E Adams St (Cueto Building Grounds), Brownsville, TX 78520",
        "lat": 25.9038,
        "lng": -97.4939,
        "phone": "(956) 882-8200",
        "email": "sustainability@utrgv.edu",
        "website": "https://www.utrgv.edu/sustainability",
        "social": "https://www.facebook.com/utrgvsustainability/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9038,-97.4939",
        "hours": "Open during university hours and scheduled work sessions",
        "volunteerHours": "Tuesday and Thursday agroecology volunteer mornings",
        "description": "Urban community garden in historic downtown Brownsville. Connects university agroecology students and downtown neighbors through 12 raised beds, container gardening demonstrations, and organic composting workshops.",
        "features": ["12 Raised Garden Beds", "Historic Downtown Setting", "Composting Workshops", "Student-Community Learning"],
        "crops": ["Heirloom Tomatoes", "Peppers", "Greens", "Herbs", "Radishes"],
        "howToJoin": "Free community and student access. Register with UTRGV Office of Sustainability.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "laguna-vista-church-garden",
        "name": "Laguna Vista Community Garden (Christ's Harbor Church)",
        "category": "community_garden",
        "categoryLabel": "Coastal Community Garden",
        "city": "Laguna Vista",
        "county": "Cameron County",
        "address": "1441 Santa Isabel Blvd (Hwy 100), Laguna Vista, TX 78578",
        "lat": 26.1042,
        "lng": -97.2882,
        "phone": "(956) 943-4422",
        "email": "info@christsharbor.church",
        "website": "https://christsharbor.church",
        "social": "https://www.facebook.com/christsharborchurch/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1042,-97.2882",
        "hours": "Open daytime hours for community participants",
        "volunteerHours": "Saturday morning community garden workdays",
        "description": "The Laguna Madre region's dedicated coastal community garden. Features raised vegetable boxes, a children's garden, compost demonstration area, salt-tolerant herbs, peppers, tomatoes, and coastal fruit trees.",
        "features": ["Coastal Community Garden", "Children's Dedicated Garden", "Raised Beds", "Composting Demo", "Salt-Tolerant Varieties"],
        "crops": ["Peppers", "Tomatoes", "Squash", "Coastal Herbs", "Citrus"],
        "howToJoin": "Open to Laguna Vista, Port Isabel, and South Padre Island residents. Contact Christ's Harbor Church.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "port-isabel-youth-garden",
        "name": "Port Isabel Community Garden (SurfVive & BGC)",
        "category": "community_garden",
        "categoryLabel": "Youth & Community Garden",
        "city": "Port Isabel",
        "county": "Cameron County",
        "address": "190 Port Rd, Port Isabel, TX 78578",
        "lat": 26.0725,
        "lng": -97.2085,
        "phone": "(956) 943-6310",
        "email": "cameron-tx@tamu.edu",
        "website": "https://www.portisabelsouthpadre.com",
        "social": "https://www.facebook.com/surfvive/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.0725,-97.2085",
        "hours": "After-school & Saturday workshops",
        "volunteerHours": "Weekly youth garden and healthy food workshops",
        "description": "Coastal raised garden boxes operated in partnership with Texas A&M AgriLife Extension, SurfVive, and Boys & Girls Club of Laguna Madre. Provides youth gardening, nutrition education, and fresh harvest distributions.",
        "features": ["Coastal Raised Boxes", "Youth Gardening Education", "AgriLife BLT Partner", "Community Harvest Sharing"],
        "crops": ["Tomatoes", "Peppers", "Basil", "Oregano", "Cilantro", "Greens"],
        "howToJoin": "Open to local Laguna Madre youth and community volunteers.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "starr-agrilife-demo-beds",
        "name": "Starr County Texas A&M AgriLife Demonstration Beds",
        "category": "demonstration_garden",
        "categoryLabel": "AgriLife County Demonstration Garden",
        "city": "Rio Grande City",
        "county": "Starr County",
        "address": "500 N Britton Ave, Rio Grande City, TX 78582",
        "lat": 26.3855,
        "lng": -98.8193,
        "phone": "(956) 487-2306",
        "email": "starr-tx@ag.tamu.edu",
        "website": "https://starr.agrilife.org",
        "social": "https://www.facebook.com/AgriLifeStarrCounty/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.3855,-98.8193",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "Weekly 4-H and community nutrition demonstration workshops",
        "description": "Specialized demonstration garden designed for the semi-arid, high-heat climate of Starr County. Showcases drought-tolerant vegetable varieties, low-pressure gravity drip irrigation, organic composting, and native pollinators.",
        "features": ["Drought-Tolerant Vegetable Trials", "Low-Pressure Drip Irrigation", "4-H Youth Programs", "Growing & Nourishing Communities Classes"],
        "crops": ["Chiles", "Drought-Hardy Tomatoes", "Squash", "Onions", "Herbs"],
        "howToJoin": "Free public access and educational clinics. Contact Starr County Extension Office.",
        "badgeColor": "#1565c0",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "rancho-lomitas-garden",
        "name": "Rancho Lomitas Ethnobotanical Demonstration Garden",
        "category": "historic_herbal",
        "categoryLabel": "Ethnobotanical & Native Nursery",
        "city": "Rio Grande City",
        "county": "Starr County",
        "address": "621 W La Sagunada Rd, Rio Grande City, TX 78582",
        "lat": 26.4385,
        "lng": -98.7845,
        "phone": "(956) 486-2576",
        "email": "benito@rancholomitas.com",
        "website": "http://www.rancholomitas.com",
        "social": "https://www.facebook.com/RanchoLomitasNursery/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.4385,-98.7845",
        "hours": "By appointment & scheduled botanical tours",
        "volunteerHours": "Native plant propagation & ethnobotanical workdays",
        "description": "A 2-acre ethnobotanical demonstration garden and native plant sanctuary directed by renowned botanist Benito Treviño. Features living collections of native Tamaulipan thornforest medicinal, edible, and utilitarian plants, butterfly nectar gardens, and rainwater harvesting.",
        "features": ["Ethnobotanical Living Collection", "Native Edible & Medicinal Plants", "Certified Native Nursery", "Rainwater Harvesting", "Guided Botanical Walks"],
        "crops": ["Peyote & Cactus Flora", "Anacahuita", "Guayacan", "Native Oregano", "Chile Piquin", "Mesquite"],
        "howToJoin": "Call ahead at (956) 486-2576 to schedule educational tours or purchase native RGV habitat plants.",
        "badgeColor": "#6a1b9a",
        "imageUrl": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "san-isidro-community-garden",
        "name": "San Isidro Community Nutrition Garden (Gonzalez Center)",
        "category": "community_garden",
        "categoryLabel": "Texas A&M Colonias CRC Garden",
        "city": "San Isidro",
        "county": "Starr County",
        "address": "1501 FM 1017 (Abel N Gonzalez Center), San Isidro, TX 78582",
        "lat": 26.7196,
        "lng": -98.4489,
        "phone": "(956) 487-2306",
        "email": "starr-tx@ag.tamu.edu",
        "website": "https://starr.agrilife.org",
        "social": "https://www.facebook.com/AgriLifeStarrCounty/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.7196,-98.4489",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "AgriLife GNHC community gardening sessions",
        "description": "Rural community vegetable garden at the Abel N. Gonzalez Community Center in northern Starr County. Features raised planter boxes and seasonal harvest distributions for rural colonia elders and low-income families.",
        "features": ["Rural Starr County CRC", "Raised Planter Boxes", "Well-Water Testing Demos", "Colonia Elder Support"],
        "crops": ["Sweet Peppers", "Chiles", "Tomatoes", "Cilantro", "Greens", "Squash"],
        "howToJoin": "San Isidro and northern Starr County residents can join through the Precinct 4 community center.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "colonias-unidas-roma-garden",
        "name": "Colonias Unidas Precinct #2 Community Garden",
        "category": "community_garden",
        "categoryLabel": "Colonia Community Nutrition Plot",
        "city": "Roma",
        "county": "Starr County",
        "address": "20 FM 650 (Fronton/Escobares Corridor), Roma, TX 78584",
        "lat": 26.4082,
        "lng": -99.0435,
        "phone": "(956) 849-2166",
        "email": "info@southtexasfoodbank.org",
        "website": "https://www.southtexasfoodbank.org",
        "social": "https://www.facebook.com/SouthTexasFoodBank/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.4082,-99.0435",
        "hours": "Monday - Friday 8:00 AM - 4:00 PM",
        "volunteerHours": "Weekly Promotora nutrition workshops and garden tending",
        "description": "Colonia community nutrition demonstration plots operated with Colonias Unidas and the South Texas Food Bank in western Starr County. Showcases drought-hardy seasonal vegetables and healthy cooking workshops.",
        "features": ["Western Starr Colonias Hub", "Raised Garden Boxes", "Promotora-Led Cooking Demos", "Food Bank Distribution Partner"],
        "crops": ["Chiles", "Onions", "Cabbage", "Tomatoes", "Squash", "Culinary Herbs"],
        "howToJoin": "Residents along the Roma/Escobares/Fronton corridor can register through Colonias Unidas.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "la-casita-self-help-center",
        "name": "La Casita Self Help Center Agriculture Plots",
        "category": "community_garden",
        "categoryLabel": "Colonia Self Help Center Garden",
        "city": "Rio Grande City",
        "county": "Starr County",
        "address": "6163 FM 1430, Rio Grande City (La Casita), TX 78582",
        "lat": 26.3268,
        "lng": -98.7055,
        "phone": "(956) 487-7300",
        "email": "starr-tx@ag.tamu.edu",
        "website": "https://co.starr.tx.us",
        "social": "https://www.facebook.com/starrcojudge/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.3268,-98.7055",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "Monthly container gardening clinics",
        "description": "Rural colonia self-help center agriculture demonstration beds providing container planting workshops, family gardening starter kits, and fresh vegetable beds.",
        "features": ["Colonia Self-Help Center", "Container Planting Demos", "Family Starter Kits", "Nutrition Education"],
        "crops": ["Peppers", "Tomatoes", "Squash", "Cilantro", "Beans"],
        "howToJoin": "Open to La Casita-Garciasville colonia families at the Self Help Center.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "raymondville-community-garden",
        "name": "Raymondville Community Garden",
        "category": "community_garden",
        "categoryLabel": "Municipal & AgriLife Community Garden",
        "city": "Raymondville",
        "county": "Willacy County",
        "address": "Corner of Monroe Ave & 12th St, Raymondville, TX 78580",
        "lat": 26.4831,
        "lng": -97.7779,
        "phone": "(956) 689-2412",
        "email": "willacy-tx@tamu.edu",
        "website": "https://willacy.agrilife.org",
        "social": "https://www.facebook.com/WillacyCountyExtension/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.4831,-97.7779",
        "hours": "Open daylight hours for plot holders",
        "volunteerHours": "First and Third Saturday monthly workdays",
        "description": "18+ raised vegetable beds and community-leased plots created by the Healthy People of Willacy County Coalition and Texas A&M AgriLife Extension on land donated by Dr. Albert Smith. Features drip irrigation and supplies the Raymondville Farmers Market.",
        "features": ["18+ Raised Vegetable Beds", "Drip Irrigation", "Leased Individual Plots", "Farmers Market Partner", "Compost Facilities"],
        "crops": ["Tomatoes", "Peppers", "Okra", "Squash", "Watermelons", "Leafy Greens"],
        "howToJoin": "Plots are leased for a nominal fee to Willacy County residents through AgriLife Extension.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "willacy-agrilife-demo-hub",
        "name": "Willacy County Texas A&M AgriLife Extension 4-H Demo Hub",
        "category": "demonstration_garden",
        "categoryLabel": "AgriLife Demonstration & 4-H Garden",
        "city": "Raymondville",
        "county": "Willacy County",
        "address": "471 W Hidalgo Ave, Raymondville, TX 78580",
        "lat": 26.4816,
        "lng": -97.7818,
        "phone": "(956) 689-2412",
        "email": "willacy-tx@tamu.edu",
        "website": "https://willacy.agrilife.org",
        "social": "https://www.facebook.com/WillacyCountyExtension/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.4816,-97.7818",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "Weekly youth 4-H and Master Gardener sessions",
        "description": "County-wide youth 4-H horticulture center and Master Gardener extension hub in Raymondville. Features hoop-house specialty crop demonstrations, small-scale container garden setups, and soil/water testing facilities.",
        "features": ["Hoop-House Specialty Crops", "4-H Youth Horticulture", "Container Gardening Demos", "Soil & Well-Water Testing Hub"],
        "crops": ["Subtropical Vegetables", "Culinary Herbs", "Container Fruits", "Pollinator Flora"],
        "howToJoin": "Contact the Willacy County AgriLife Extension office to register for 4-H or Master Gardener programs.",
        "badgeColor": "#1565c0",
        "imageUrl": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "bethel-community-garden",
        "name": "Bethel Community Garden (Bethel Lutheran Church)",
        "category": "community_garden",
        "categoryLabel": "Rural Community Garden",
        "city": "Lyford",
        "county": "Willacy County",
        "address": "8243 Park Ave (and 8233 I-69E), Lyford, TX 78569",
        "lat": 26.4116,
        "lng": -97.7944,
        "phone": "(956) 347-3327",
        "email": "office@bethellyford.org",
        "website": "http://bethellutheranlyfordtx.org",
        "social": "https://www.facebook.com/BethelLyford/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.4116,-97.7944",
        "hours": "Accessible daily during daytime hours",
        "volunteerHours": "Saturday morning community work parties",
        "description": "A 0.32-acre dedicated community garden with 18 raised boxes (4x12 ft), two 24-foot in-ground rows, and integrated drip irrigation funded in part by ELCA World Hunger grants. Yields over 1,000 lbs of fresh vegetables annually donated to local food pantries and colonia families in Willacy County.",
        "features": ["18 Raised Boxes (4x12 ft)", "0.32-Acre Dedicated Site", "Over 1,000 lbs Donated Annually", "Integrated Drip Irrigation", "Recycled Organic Compost Soil"],
        "crops": ["Tomatoes", "Squash", "Onions", "Green Beans", "Jalapeños", "Collards", "Cabbage"],
        "howToJoin": "Open to all Willacy County residents. Contact Bethel Lutheran Church administrative office or visit on Saturday mornings.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "lasara-sebastian-crc-plots",
        "name": "Lasara & Sebastian CRC Community Nutrition Plots",
        "category": "community_garden",
        "categoryLabel": "Texas A&M Colonias CRC Garden",
        "city": "Lasara",
        "county": "Willacy County",
        "address": "11932 Jones St, Lasara, TX 78561",
        "lat": 26.4950,
        "lng": -97.9050,
        "phone": "(956) 689-2412",
        "email": "willacy-tx@tamu.edu",
        "website": "https://willacy.agrilife.org",
        "social": "https://www.facebook.com/WillacyCountyExtension/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.4950,-97.9050",
        "hours": "Monday - Friday 8:00 AM - 5:00 PM",
        "volunteerHours": "AgriLife Extension GNHC classes and container garden starter distributions",
        "description": "Community nutrition and container agriculture outreach center in rural Willacy County. Promotes bucket/container gardening and culinary herb production for rural households with limited space or saline soil.",
        "features": ["Rural Colonias CRC", "Bucket & Container Garden Kits", "WIC & Health Fair Demos", "Saline Soil Adaptations"],
        "crops": ["Chili Peppers", "Cilantro", "Tomatoes", "Greens", "Medicinal Herbs"],
        "howToJoin": "Sign up through the Lasara Community Resource Center or Willacy County AgriLife Extension.",
        "badgeColor": "#2e7d32",
        "imageUrl": "https://images.unsplash.com/photo-1592417817098-8f3d6eb2251a?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "heeps-native-nursery",
        "name": "Heep's Native Plant Demonstration Nursery & Botanical Gardens",
        "category": "historic_herbal",
        "categoryLabel": "Native Botanical Nursery",
        "city": "Harlingen",
        "county": "Cameron County",
        "address": "1714 S Palm Court Dr, Harlingen, TX 78552",
        "lat": 26.1750,
        "lng": -97.7120,
        "phone": "(956) 457-6834",
        "email": "heepsnursery@gmail.com",
        "website": "https://www.facebook.com/HeepsNursery/",
        "social": "https://www.facebook.com/HeepsNursery/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.1750,-97.7120",
        "hours": "By appointment only (Always Call Ahead!)",
        "volunteerHours": "Native habitat stewardship and seed harvesting days",
        "description": "Legendary native plant demonstration nursery founded by Mike Heep in Harlingen. Showcases centuries-old thornforest botany, rare endemic South Texas trees, butterfly host flora, and native fruit species.",
        "features": ["Rare Endemic South Texas Flora", "Historic Citrus & Palm Grounds", "Butterfly Host & Nectar Plants", "By Appointment Only"],
        "crops": ["Native Citrus Starts", "Texas Ebony", "Guayacan", "Anacahuita", "Crucita", "Chile Piquin"],
        "howToJoin": "Private property; call (956) 457-6834 ahead of time to schedule an appointment or native plant consultation.",
        "badgeColor": "#6a1b9a",
        "imageUrl": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "sabal-palm-sanctuary",
        "name": "Sabal Palm Sanctuary & Historic Gardens",
        "category": "botanical_sanctuary",
        "categoryLabel": "Old-Growth Botanical Sanctuary",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "8435 Sabal Palm Rd, Brownsville, TX 78521",
        "lat": 25.8568,
        "lng": -97.4190,
        "phone": "(956) 541-8034",
        "email": "info@sabalpalmsanctuary.org",
        "website": "https://www.sabalpalmsanctuary.org",
        "social": "https://www.facebook.com/sabalpalmsanctuary/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.8568,-97.4190",
        "hours": "Thursday - Tuesday 7:00 AM - 5:00 PM (Closed Wednesdays)",
        "volunteerHours": "Trail & native garden volunteer sessions (contact sanctuary)",
        "description": "A 527-acre sanctuary managed by the Gorgas Science Foundation preserving one of the last remaining primeval Sabal Palm forests in the United States. Features historic 1892 plantation grounds, lush native butterfly gardens, resaca overlooks, and heritage palm groves.",
        "features": ["Old-Growth Sabal Palm Forest", "1892 Historic Rabb Plantation House", "Resaca Wetland Overlooks", "Butterfly & Hummingbird Gardens", "Nature Trails"],
        "crops": ["Sabal mexicana (Mexican Palmetto)", "Wild Petunia", "Strangler Fig", "Texas Ebony", "Anacua"],
        "howToJoin": "Day passes are $5. Annual passes and volunteer conservation days available.",
        "badgeColor": "#00796b",
        "imageUrl": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "gladys-porter-zoo-botanical",
        "name": "Gladys Porter Zoo Botanical Gardens",
        "category": "botanical_sanctuary",
        "categoryLabel": "Tropical Botanical Gardens",
        "city": "Brownsville",
        "county": "Cameron County",
        "address": "500 E Ringgold St, Brownsville, TX 78520",
        "lat": 25.9145,
        "lng": -97.4985,
        "phone": "(956) 546-7187",
        "email": "zoo@gpz.org",
        "website": "https://gpz.org",
        "social": "https://www.facebook.com/gladysporterzoo/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=25.9145,-97.4985",
        "hours": "Open daily 9:00 AM - 5:00 PM",
        "volunteerHours": "Horticultural volunteer positions available via zoo volunteer coordinator",
        "description": "A 31-acre lush tropical oasis housing over 250 species of exotic, subtropical, and native plants woven throughout resaca waterways and animal habitats. Features extensive collections of orchids, palms, cycads, and bamboo.",
        "features": ["250+ Botanical Species", "Natural Resaca Waterways", "Rare Cycads & Palms", "Orchid Displays", "Walkable Botanical Pathways"],
        "crops": ["Cycads", "Tropical Palms", "Bamboo Groves", "Water Lilies", "Bougainvillea", "Heliconias"],
        "howToJoin": "General zoo admission applies. Horticultural internships and volunteer garden docents welcomed through application.",
        "badgeColor": "#00796b",
        "imageUrl": "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80"
      },
      {
        "id": "south-texas-ecotourism-center",
        "name": "South Texas Ecotourism Center Gardens",
        "category": "demonstration_garden",
        "categoryLabel": "Coastal Native Gardens & Eco-Center",
        "city": "Laguna Vista",
        "county": "Cameron County",
        "address": "501 W State Hwy 100, Laguna Vista, TX 78578",
        "lat": 26.0965,
        "lng": -97.2885,
        "phone": "(956) 772-0210",
        "email": "info@stec-tx.org",
        "website": "https://www.cameroncountyparks.com/south-texas-ecotourism-center",
        "social": "https://www.facebook.com/SouthTexasEcotourismCenter/",
        "directionsUrl": "https://www.google.com/maps/dir/?api=1&destination=26.0965,-97.2885",
        "hours": "Open daily 8:00 AM - 5:00 PM",
        "volunteerHours": "Inquire with park naturalist for garden volunteer days",
        "description": "A state-of-the-art 10-acre ecotourism complex overlooking coastal prairies. Highlights five distinctive ecological zones of the Rio Grande Valley with demonstration gardens, rain catchment arroyos, and native butterfly plantings.",
        "features": ["5 Ecological Zone Gardens", "Rainwater Harvesting Arroyos", "Coastal Prairie Habitat", "Interactive Nature Exhibits", "Boardwalks"],
        "crops": ["Coastal Native Grasses", "Beach Morning Glory", "Sea Oxeye Daisy", "Texas Lantana", "Fiddlewood"],
        "howToJoin": "Free admission to outdoor grounds and interpretive center. Educational tours can be scheduled with park naturalists.",
        "badgeColor": "#1565c0",
        "imageUrl": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80"
      }
    ];
  }

  // Initialize
  initMap();
  setupEventListeners();
  loadGardenData();
});
