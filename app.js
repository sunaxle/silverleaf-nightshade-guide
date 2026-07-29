document.addEventListener('DOMContentLoaded', () => {
  const insectGrid = document.getElementById('insectGrid');
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Function to create a card element
  const createCard = (insect) => {
    const card = document.createElement('div');
    card.className = 'card';
    
    const iNaturalistLink = insect.inaturalist 
      ? `<a href="${insect.inaturalist}" target="_blank" class="link-btn link-inaturalist">iNaturalist</a>` 
      : '';
      
    let bugGuideClass = 'link-bugguide';
    let bugGuideLabel = 'BugGuide';
    if (insect.bugguide && insect.bugguide.includes('landcareresearch')) {
      bugGuideClass = 'link-biocontrol';
      bugGuideLabel = '🌿 Biocontrol Guide';
    }

    const bugGuideLink = insect.bugguide 
      ? `<a href="${insect.bugguide}" target="_blank" class="link-btn ${bugGuideClass}">${bugGuideLabel}</a>` 
      : '';

    card.innerHTML = `
      <div class="card-image" style="background-image: url('${insect.image}')">
        <span class="card-category-badge">${insect.category}</span>
      </div>
      <div class="card-content">
        <h3>${insect.name}</h3>
        <p class="scientific-name">${insect.scientific}</p>
        <span class="card-type">${insect.type}</span>
        <div class="card-links">
          ${iNaturalistLink}
          ${bugGuideLink}
        </div>
      </div>
    `;
    return card;
  };

  // Function to render cards based on data
  const renderCards = (data) => {
    insectGrid.innerHTML = '';
    if (data.length === 0) {
      insectGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--color-text-muted);">No insects found matching your search.</p>';
      return;
    }
    data.forEach(insect => {
      insectGrid.appendChild(createCard(insect));
    });
  };

  // Filter and search logic
  let currentFilter = 'all';
  let searchQuery = '';

  const applyFilters = () => {
    let filteredData = insectData;

    // Apply type filter
    if (currentFilter !== 'all') {
      filteredData = filteredData.filter(insect => insect.type === currentFilter);
    }

    // Apply search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filteredData = filteredData.filter(insect => 
        insect.name.toLowerCase().includes(lowerQuery) || 
        insect.scientific.toLowerCase().includes(lowerQuery)
      );
    }

    renderCards(filteredData);
  };

  // Search input event
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    applyFilters();
  });

  // Filter buttons event
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update active class
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Apply filter
      currentFilter = e.target.dataset.filter;
      applyFilters();
    });
  });

  // Initial render
  renderCards(insectData);
});
