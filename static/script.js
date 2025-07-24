// 全局变量
let currentPokemon = null;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    // 设置导航栏活跃状态
    setActiveNavLink();
    
    // 初始化宝可梦卡片点击事件
    initializePokemonCards();
    
    // 初始化统计图表
    initializeStatsCharts();
    
    // 初始化类型匹配图表
    initializeTypeChart();
}

// 设置导航栏活跃状态
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

// 初始化宝可梦卡片
function initializePokemonCards() {
    const pokemonCards = document.querySelectorAll('.pokemon-card');
    
    pokemonCards.forEach(card => {
        card.addEventListener('click', function(event) {
            // 检查点击的目标是否是按钮或按钮内的元素
            if (event.target.closest('button') || event.target.closest('a.btn') || event.target.classList.contains('btn-release') || event.target.classList.contains('btn-detail')) {
                return; // 如果是按钮，不执行卡片点击事件
            }
            
            const pokemonId = this.dataset.pokemonId;
            if (pokemonId) {
                showPokemonDetail(pokemonId);
            }
        });
        
        // 添加悬停效果
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// 显示宝可梦详情
function showPokemonDetail(pokemonId) {
    // 这里可以通过AJAX获取详细信息，或者直接跳转
    window.location.href = `/pokemon/${pokemonId}`;
}

// 初始化统计图表
function initializeStatsCharts() {
    const statBars = document.querySelectorAll('.stat-fill');
    
    statBars.forEach(bar => {
        const value = parseInt(bar.dataset.value) || 0;
        const maxValue = 255; // 宝可梦属性最大值
        const percentage = Math.min((value / maxValue) * 100, 100);
        
        // 动画效果
        setTimeout(() => {
            bar.style.width = percentage + '%';
        }, 100);
        
        // 根据数值设置颜色
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

// 宝可梦类型效果表
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

// 初始化类型匹配图表
function initializeTypeChart() {
    const typeChartContainer = document.getElementById('type-chart');
    if (!typeChartContainer) return;
    
    const pokemonTypes = typeChartContainer.dataset.types;
    if (!pokemonTypes) return;
    
    const types = pokemonTypes.split(',');
    displayTypeEffectiveness(types, typeChartContainer);
}

// 显示类型效果
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
    
    // 移除重复的效果
    resistances.forEach(resistance => weaknesses.delete(resistance));
    immunities.forEach(immunity => {
        weaknesses.delete(immunity);
        resistances.delete(immunity);
    });
    
    // 创建HTML
    let html = '<div class="type-effectiveness">';
    
    if (weaknesses.size > 0) {
        html += '<div class="effectiveness-section">';
        html += '<h4 style="color: #ef4444;">弱点 (2x伤害)</h4>';
        html += '<div class="type-list">';
        weaknesses.forEach(type => {
            html += `<span class="pokemon-type type-${type}">${type}</span>`;
        });
        html += '</div></div>';
    }
    
    if (resistances.size > 0) {
        html += '<div class="effectiveness-section">';
        html += '<h4 style="color: #10b981;">抗性 (0.5x伤害)</h4>';
        html += '<div class="type-list">';
        resistances.forEach(type => {
            html += `<span class="pokemon-type type-${type}">${type}</span>`;
        });
        html += '</div></div>';
    }
    
    if (immunities.size > 0) {
        html += '<div class="effectiveness-section">';
        html += '<h4 style="color: #6b7280;">免疫 (0x伤害)</h4>';
        html += '<div class="type-list">';
        immunities.forEach(type => {
            html += `<span class="pokemon-type type-${type}">${type}</span>`;
        });
        html += '</div></div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// 搜索功能
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

// 类型过滤功能
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

// 工具函数：获取宝可梦图片路径
function getPokemonImagePath(pokemonName) {
    // 将宝可梦名称转换为文件名格式
    const fileName = pokemonName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    return `/static/images/${fileName}.png`;
}

// 图片加载错误处理
function handleImageError(img) {
    img.src = '/static/images/placeholder.png';
    img.alt = '图片加载失败';
}

// 平滑滚动到顶部
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 添加返回顶部按钮
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
    
    // 滚动时显示/隐藏按钮
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    });
}

// 页面加载完成后添加返回顶部按钮
window.addEventListener('load', addBackToTopButton);