// Global variables
let currentPokemon = null;

// Execute after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize application
function initializeApp() {
    // Set active navigation link
    setActiveNavLink();
    
    // Initialize Pokemon card click events
    initializePokemonCards();
    
    // Initialize stats charts
    initializeStatsCharts();
    
    // Initialize type effectiveness chart
    initializeTypeChart();
}

// Set active navigation link
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

// Initialize Pokemon cards
function initializePokemonCards() {
    const pokemonCards = document.querySelectorAll('.pokemon-card');
    
    pokemonCards.forEach(card => {
        card.addEventListener('click', function(event) {
            // Check if the clicked target is a button or element within a button
            if (event.target.closest('button') || event.target.closest('a.btn') || event.target.classList.contains('btn-release') || event.target.classList.contains('btn-detail')) {
                return; // If it's a button, don't execute card click event
            }
            
            const pokemonId = this.dataset.pokemonId;
            if (pokemonId) {
                showPokemonDetail(pokemonId);
            }
        });
        
        // Add hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Show Pokemon details
function showPokemonDetail(pokemonId) {
    // Here you can get detailed information via AJAX, or redirect directly
    window.location.href = `/pokemon/${pokemonId}`;
}

// Initialize stats charts
function initializeStatsCharts() {
    const statBars = document.querySelectorAll('.stat-fill');
    
    statBars.forEach(bar => {
        const value = parseInt(bar.dataset.value) || 0;
        const maxValue = 255; // Pokemon stat maximum value
        const percentage = Math.min((value / maxValue) * 100, 100);
        
        // Animation effect
        setTimeout(() => {
            bar.style.width = percentage + '%';
        }, 100);
        
        // Set color based on value
        if (percentage >= 80) {
            bar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        } else if (percentage >= 60) {
            bar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        } else if (percentage >= 40) {
            bar.style.background = 'linear-gradient(90deg, #eab308, #ca8a04)';
        } else {
            bar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        }
    });
}

// Pokemon type effectiveness chart
const typeChart = {
    'normal': {
        weakTo: ['fighting'],
        resistantTo: [],
        immuneTo: ['ghost']
    },
    'fire': {
        weakTo: ['water', 'ground', 'rock'],
        resistantTo: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
        immuneTo: []
    },
    'water': {
        weakTo: ['electric', 'grass'],
        resistantTo: ['fire', 'water', 'ice', 'steel'],
        immuneTo: []
    },
    'electric': {
        weakTo: ['ground'],
        resistantTo: ['electric', 'flying', 'steel'],
        immuneTo: []
    },
    'grass': {
        weakTo: ['fire', 'ice', 'poison', 'flying', 'bug'],
        resistantTo: ['water', 'electric', 'grass', 'ground'],
        immuneTo: []
    },
    'ice': {
        weakTo: ['fire', 'fighting', 'rock', 'steel'],
        resistantTo: ['ice'],
        immuneTo: []
    },
    'fighting': {
        weakTo: ['flying', 'psychic', 'fairy'],
        resistantTo: ['bug', 'rock', 'dark'],
        immuneTo: []
    },
    'poison': {
        weakTo: ['ground', 'psychic'],
        resistantTo: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
        immuneTo: []
    },
    'ground': {
        weakTo: ['water', 'grass', 'ice'],
        resistantTo: ['poison', 'rock'],
        immuneTo: ['electric']
    },
    'flying': {
        weakTo: ['electric', 'ice', 'rock'],
        resistantTo: ['grass', 'fighting', 'bug'],
        immuneTo: ['ground']
    },
    'psychic': {
        weakTo: ['bug', 'ghost', 'dark'],
        resistantTo: ['fighting', 'psychic'],
        immuneTo: []
    },
    'bug': {
        weakTo: ['fire', 'flying', 'rock'],
        resistantTo: ['grass', 'fighting', 'ground'],
        immuneTo: []
    },
    'rock': {
        weakTo: ['water', 'grass', 'fighting', 'ground', 'steel'],
        resistantTo: ['normal', 'fire', 'poison', 'flying'],
        immuneTo: []
    },
    'ghost': {
        weakTo: ['ghost', 'dark'],
        resistantTo: ['poison', 'bug'],
        immuneTo: ['normal', 'fighting']
    },
    'dragon': {
        weakTo: ['ice', 'dragon', 'fairy'],
        resistantTo: ['fire', 'water', 'electric', 'grass'],
        immuneTo: []
    },
    'dark': {
        weakTo: ['fighting', 'bug', 'fairy'],
        resistantTo: ['ghost', 'dark'],
        immuneTo: ['psychic']
    },
    'steel': {
        weakTo: ['fire', 'fighting', 'ground'],
        resistantTo: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
        immuneTo: ['poison']
    },
    'fairy': {
        weakTo: ['poison', 'steel'],
        resistantTo: ['fighting', 'bug', 'dark'],
        immuneTo: ['dragon']
    }
};

// Initialize type effectiveness chart
function initializeTypeChart() {
    const typeChartContainer = document.getElementById('type-chart');
    if (!typeChartContainer) return;
    
    const pokemonTypes = typeChartContainer.dataset.types;
    if (!pokemonTypes) return;
    
    const types = pokemonTypes.split(',');
    displayTypeEffectiveness(types, typeChartContainer);
}

// Display type effectiveness
function displayTypeEffectiveness(types, container) {
    let weaknesses = new Set();
    let resistances = new Set();
    let immunities = new Set();
    
    types.forEach(type => {
        const typeData = typeChart[type.toLowerCase()];
        if (typeData) {
            typeData.weakTo.forEach(weakness => weaknesses.add(weakness));
            typeData.resistantTo.forEach(resistance => resistances.add(resistance));
            typeData.immuneTo.forEach(immunity => immunities.add(immunity));
        }
    });
    
    // Remove duplicate effects
    resistances.forEach(resistance => weaknesses.delete(resistance));
    immunities.forEach(immunity => {
        weaknesses.delete(immunity);
        resistances.delete(immunity);
    });
    
    // Create HTML
    let html = '<div class="type-effectiveness">';
    
    if (weaknesses.size > 0) {
        html += '<div class="effectiveness-section">';
        html += '<h4 style="color: #ef4444;">Weaknesses (2x damage)</h4>';
        html += '<div class="type-list">';
        weaknesses.forEach(type => {
            html += `<span class="pokemon-type type-${type}">${type}</span>`;
        });
        html += '</div></div>';
    }
    
    if (resistances.size > 0) {
        html += '<div class="effectiveness-section">';
        html += '<h4 style="color: #10b981;">Resistances (0.5x damage)</h4>';
        html += '<div class="type-list">';
        resistances.forEach(type => {
            html += `<span class="pokemon-type type-${type}">${type}</span>`;
        });
        html += '</div></div>';
    }
    
    if (immunities.size > 0) {
        html += '<div class="effectiveness-section">';
        html += '<h4 style="color: #6b7280;">Immunities (0x damage)</h4>';
        html += '<div class="type-list">';
        immunities.forEach(type => {
            html += `<span class="pokemon-type type-${type}">${type}</span>`;
        });
        html += '</div></div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Search functionality
function searchPokemon() {
    const searchInput = document.getElementById('pokemon-search');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const pokemonCards = document.querySelectorAll('.pokemon-card');
    
    pokemonCards.forEach(card => {
        const pokemonName = card.querySelector('.pokemon-name').textContent.toLowerCase();
        const pokemonTypes = card.querySelectorAll('.pokemon-type');
        let typeMatch = false;
        
        pokemonTypes.forEach(typeElement => {
            if (typeElement.textContent.toLowerCase().includes(searchTerm)) {
                typeMatch = true;
            }
        });
        
        if (pokemonName.includes(searchTerm) || typeMatch) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Type filter functionality
function filterByType(type) {
    const pokemonCards = document.querySelectorAll('.pokemon-card');
    
    pokemonCards.forEach(card => {
        if (type === 'all') {
            card.style.display = 'block';
        } else {
            const pokemonTypes = card.querySelectorAll('.pokemon-type');
            let hasType = false;
            
            pokemonTypes.forEach(typeElement => {
                if (typeElement.textContent.toLowerCase() === type.toLowerCase()) {
                    hasType = true;
                }
            });
            
            card.style.display = hasType ? 'block' : 'none';
        }
    });
}

// Utility function: Get Pokemon image path
function getPokemonImagePath(pokemonName) {
    // Convert Pokemon name to filename format
    const fileName = pokemonName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    return `/static/images/${fileName}.png`;
}

// Image loading error handling
function handleImageError(img) {
    img.src = '/static/images/placeholder.png';
    img.alt = 'Image loading failed';
}

// Smooth scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add back to top button
function addBackToTopButton() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'back-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #4f46e5;
        color: white;
        border: none;
        font-size: 20px;
        cursor: pointer;
        display: none;
        z-index: 1000;
        transition: all 0.3s ease;
    `;
    
    button.addEventListener('click', scrollToTop);
    document.body.appendChild(button);
    
    // Show/hide button when scrolling
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    });
}

// Add back to top button after page load
window.addEventListener('load', addBackToTopButton);