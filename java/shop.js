// Nawigacja
function openShopCategory(cat) {
    if (!cat) return;
    
    currentShopCategory = cat;
    
    const landing = document.getElementById('shop-landing');
    const itemsView = document.getElementById('shop-items-view');
    const catTitle = document.getElementById('shop-cat-title');

    if (landing) landing.classList.add('hidden');
    if (itemsView) itemsView.classList.remove('hidden');

    let title = '';
    const titles = {
        'clothes': 'Dla Pandy 🐼',
        'furniture': 'Do Pokoju 🛋️',
        'rare': 'Rzadkie Skarby ✨'
    };

    title = titles[cat] || 'Kategoria';

    if (catTitle) {
        catTitle.innerText = title;
    }

    if (typeof renderShopItems === 'function') {
        renderShopItems();
    }
}
function closeShopCategory() {
    const itemsView = document.getElementById('shop-items-view');
    const landing = document.getElementById('shop-landing');

    if (itemsView) {
        itemsView.classList.add('hidden');
    }

    if (landing) {
        landing.classList.remove('hidden');
    }
}

// DLA PANDY
const shopClothes = [
    { id: 'sunglasses', name: 'Okulary', price: 50, icon: '😎', type: 'glasses' },
    { id: 'party_hat', name: 'Czapeczka', price: 30, icon: '🥳', type: 'hat' },
    { id: 'crown', name: 'Korona', price: 150, icon: '👑', type: 'hat' },
    { id: 'scarf_blue', name: 'Koszulka', price: 45, icon: '👕', type: 'neck' }, 
    { id: 'flower', name: 'Kwiatek', price: 20, icon: '🌸', type: 'ears' },
    { id: 'beanie', name: 'Czapka zimowa', price: 60, icon: '🧢', type: 'hat' },
    { id: 'top_hat', name: 'Cylinder', price: 180, icon: '🎩', type: 'hat' },
    { id: 'heart_glasses', name: 'Okulary w serca', price: 90, icon: '💖', type: 'glasses' },
    { id: 'bow_tie', name: 'Mucha', price: 70, icon: '🎀', type: 'neck' },
    { id: 'star_clip', name: 'Gwiazdka', price: 40, icon: '⭐', type: 'ears' }
];

// DO POKOJU
const shopFurniture = [
    { id: 'rug', name: 'Dywan', price: 100, icon: '🧶', cssClass: 'decor-rug', isEmoji: false },
    { id: 'window', name: 'Okno', price: 150, icon: '🪟', cssClass: 'decor-window', isEmoji: false },
    { id: 'shelf', name: 'Półka (Klasyk)', price: 90, icon: '📚', cssClass: 'decor-shelf', isEmoji: false },
    { id: 'shelf_v2', name: 'Półka (Morska)', price: 90, icon: '📚', cssClass: 'decor-shelf-v2', isEmoji: false },
    { id: 'poster', name: 'Plakat (Ramka)', price: 50, icon: '🖼️', cssClass: 'decor-poster', isEmoji: false },
    { id: 'lamp', name: 'Lampa', price: 80, icon: '💡', cssClass: 'decor-lamp', isEmoji: false },
    { id: 'desk', name: 'Biurko', price: 120, icon: '✍️', cssClass: 'decor-desk', isEmoji: false },
    { id: 'teddy', name: 'Miś', price: 60, icon: '🧸', cssClass: 'decor-emoji pos-teddy', isEmoji: true },
    { id: 'monster_plant', name: 'Kwiatek', price: 120, icon: '🪴', cssClass: 'decor-emoji pos-plant', isEmoji: true },
    { id: 'guitar', name: 'Gitara', price: 200, icon: '🎸', cssClass: 'decor-emoji pos-guitar', isEmoji: true },
    { id: 'lights', name: 'Girlanda', price: 120, icon: '✨', cssClass: 'decor-lights', isEmoji: false },
    { id: 'clock', name: 'Zegar', price: 90, icon: '🕰️', cssClass: 'decor-clock', isEmoji: false },
    { id: 'cactus', name: 'Kaktus', price: 80, icon: '🌵', cssClass: 'decor-emoji pos-cactus', isEmoji: true },
    { id: 'books', name: 'Stos książek', price: 70, icon: '📚', cssClass: 'decor-emoji pos-books', isEmoji: true },
    { id: 'cat', name: 'Kot', price: 140, icon: '🐈', cssClass: 'decor-emoji pos-cat', isEmoji: true }
];

// RARE ITEMS
const shopRare = [
    { id: 'dragon', name: 'Smok', price: 1000, icon: '🐉', cssClass: 'decor-emoji pos-dragon', isEmoji: true, category: 'furniture' },
    { id: 'leds', name: 'LEDy RGB', price: 500, icon: '🌈', cssClass: 'decor-leds', isEmoji: false, category: 'furniture' },
    { id: 'computer', name: 'Komputer', price: 800, icon: '💻', cssClass: 'decor-computer', isEmoji: false, category: 'furniture' },
    { id: 'aquarium_stand', name: 'Szafka', price: 300, icon: '🪑', cssClass: 'decor-aquarium-stand', isEmoji: false, category: 'furniture' },
    { id: 'aquarium', name: 'Axolotl', price: 700, icon: '🦎', cssClass: 'decor-aquarium', isEmoji: false, category: 'furniture' },
    { id: 'speakers', name: 'Głośniki Pro', price: 600, icon: '🔊', cssClass: 'decor-speakers', isEmoji: false, category: 'furniture' },
    { id: 'disco', name: 'Kula disco', price: 450, icon: '🪩', cssClass: 'decor-emoji pos-disco', isEmoji: true, category: 'furniture' },
    { id: 'neon', name: 'Neon STUDY', price: 550, icon: '🔆', cssClass: 'decor-neon', isEmoji: false, category: 'furniture' },
    { id: 'crystal', name: 'Kryształ magii', price: 650, icon: '🔮', cssClass: 'decor-emoji pos-crystal', isEmoji: true, category: 'furniture' },
    { id: 'trophy', name: 'Puchar', price: 600, icon: '🏆', cssClass: 'decor-emoji pos-trophy', isEmoji: true, category: 'furniture' },
    { id: 'piano', name: 'Pianino', price: 900, icon: '🎹', cssClass: 'decor-emoji pos-piano', isEmoji: true, category: 'furniture' }
];

// redner itemów
function renderShopItems() { 
    const grid = document.getElementById('shop-grid'); 
    if (!grid) return; 
    if (typeof appData === 'undefined' || !appData) return;
    grid.innerHTML = ''; 
    
    let items = [];
    let isRare = false;

    if (currentShopCategory === 'clothes') items = shopClothes;
    else if (currentShopCategory === 'furniture') items = shopFurniture;
    else if (currentShopCategory === 'rare') {
        items = shopRare;
        isRare = true;
    }

    const owned = appData.inventory || []; 

    items.forEach(item => { 
        const isOwned = owned.includes(item.id); 
        const div = document.createElement('div'); 
        div.className = 'card'; 
        
        const itemType = item.type || null; 

        if(isRare) div.style.border = "2px solid #fbbf24";

        let btn = ''; 
        if (isOwned) { 
            const equippedList = appData.equipped || {};
            const isEquipped = itemType ? (equippedList[itemType] === item.id) : false; 
            const isPlaced = (appData.activeFurniture || []).includes(item.id);

            if (itemType) { 
                if (isEquipped) {
                    btn = `<button onclick="equipItem('${item.id}', '${itemType}')" class="item-buy-btn" style="background:#ff8a80">Zdejmij</button>`; 
                } else {
                    btn = `<button onclick="equipItem('${item.id}', '${itemType}')" class="item-buy-btn">Załóż</button>`; 
                }
            } else { 
                if (isPlaced) {
                    btn = `<button onclick="toggleFurniture('${item.id}')" class="item-buy-btn" style="background:#ff8a80">Schowaj</button>`;
                } else {
                    btn = `<button onclick="toggleFurniture('${item.id}')" class="item-buy-btn">Postaw</button>`;
                }
            } 
        } else { 
            btn = `<button onclick="buyItem('${item.id}', ${item.price})" class="item-buy-btn">Kup ${item.price} 💎</button>`; 
        } 
        
        div.innerHTML = `<div style="font-size:50px">${item.icon}</div><strong>${item.name}</strong>${btn}`; 
        grid.appendChild(div); 
    }); 
}

// Kupowanie itmu
function buyItem(id, price) {
    if (typeof appData === 'undefined' || !appData) return;

    const allPossibleItems = [...shopFurniture, ...shopClothes, ...shopRare];
    const item = allPossibleItems.find(i => i.id === id);

    if (!item) return;

    const actualPrice = Number(item.price) || 0;

    if (!appData.inventory) appData.inventory = [];
    if (appData.inventory.includes(id)) {
        if (typeof showToast === 'function') showToast("Masz już ten przedmiot!", "info");
        return;
    }

    if ((appData.coins || 0) < actualPrice) {
        if (typeof showToast === 'function') showToast("Za mało diamentów!", "error");
        return;
    }

    appData.coins -= actualPrice;
    appData.inventory.push(id); 

    const isFurniture = item.category === 'furniture' || shopFurniture.some(f => f.id === id);
    
    if (isFurniture) {
        if (!appData.activeFurniture) appData.activeFurniture = [];
        if (!appData.activeFurniture.includes(id)) appData.activeFurniture.push(id);
    }

    if (typeof addXp === 'function') addXp(actualPrice);
    if (typeof updateQuestProgress === 'function') updateQuestProgress('buy', 1);
    
    saveData(); 
    updateUI(); 
    renderShopItems(); 
    
    if (isFurniture) renderRoom();
    
    showToast("Kupiono przedmiot!", 'coin');
}

// Zakładanie itemu
function equipItem(id, type) { 
    if (!appData.equipped) appData.equipped = {};
    
    if (appData.equipped[type] === id) {
        appData.equipped[type] = null;
    } else {
        appData.equipped[type] = id;
    } 
    
    saveData(); 
    updateUI(); 
    renderShopItems(); 

    const slotId = `panda-${type}`;
    if (typeof renderAccessory === 'function') {
        renderAccessory(slotId, appData.equipped[type]);
    }
}