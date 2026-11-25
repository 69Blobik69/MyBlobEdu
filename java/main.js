// główne dane
let appData = {
    coins: 8000,
    xp: 0, maxXp: 100, level: 1,
    inventory: [], 
    activeFurniture: [], 
    furniture: [], 
    equipped: { hat: null, glasses: null, neck: null, ears: null },
    schedule: { 
    monday: [], tuesday: [], wednesday: [], 
    thursday: [], friday: [], saturday: [], sunday: [] 
},
    dailyQuests: [], 
    lastQuestDate: null,
    history: [],
    timerState: { isRunning: false, isPaused: false, endTime: null, remaining: 0, totalTime: 0, topic: "" },
    subjects: [],
    reviewQueue: [],
    posterImage: null,
    lampLit: false
};

// Widok główny
window.onload = async function() {
    try {
        await initDB(); 
        await loadData(); 
    } catch (e) {
        console.error("Nie udało się wczytać zapisu:", e);
    }
    
    updateUI();
    renderRoom();
    renderSubjects();
    renderSchedule();
    checkTimerState();
    checkDailyQuests();
    updateXpBar();

    const mobileMenu = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (mobileMenu && sidebar) {
        mobileMenu.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    const belly = document.getElementById('panda-belly');
    if (belly) {
        belly.addEventListener('click', makePandaSmile);
    }

    const ledPicker = document.getElementById('led-color-picker');
    if (ledPicker) {
        ledPicker.addEventListener('input', function(e) {
            const color = e.target.value;
            document.documentElement.style.setProperty('--led-color', color);
            document.documentElement.style.setProperty('--led-shadow', `0 0 20px ${color}`);
            const leds = document.querySelector('.decor-leds');
            if (leds) leds.setAttribute('data-static', 'true');
        });
    }

    const posterInput = document.getElementById('poster-upload-input');
    if (posterInput) {
        posterInput.addEventListener('change', async function() {
            if (this.files && this.files[0]) {
                const base64 = await resizeImage(URL.createObjectURL(this.files[0]), 800, 800); 
                appData.posterImage = base64;
                saveData();
                renderRoom();
                if (typeof showToast === 'function') showToast("Plakat ustawiony!", "success");
            }
        });
    }

    document.addEventListener('paste', function(e) {
        const flashcardView = document.getElementById('view-flashcard-player');
        if (!flashcardView || flashcardView.classList.contains('hidden')) return;

        const data = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData);
        if (!data || !data.items) return;
        const items = data.items;
        const side = document.activeElement && document.activeElement.id === 'new-card-a' ? 'a' : 'q';
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') { 
                handleImageUpload(items[i].getAsFile(), side); 
            }
        }
    });
};

// nawigacja
function switchTab(tabId, buttonEl) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active');
    });

    const targetSection = document.getElementById('section-' + tabId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('active');
    }

    // Motyw kasyna obowiązuje tylko w zakładce Kasyno
    document.body.classList.toggle('casino-mode', tabId === 'casino');

    if (buttonEl) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        buttonEl.classList.add('active');
    }

    if (tabId === 'library') {
        const viewSubs = document.getElementById('view-subjects');
        const viewTops = document.getElementById('view-topics');
        const viewWork = document.getElementById('view-workspace');

        if (viewSubs) viewSubs.classList.remove('hidden');
        if (viewTops) viewTops.classList.add('hidden');
        if (viewWork) viewWork.classList.add('hidden');
        
        if (typeof renderSubjects === 'function') renderSubjects();
    }

    if (tabId === 'planner') {
        if (typeof renderSchedule === 'function') renderSchedule();
    }

    if (tabId === 'history') {
        if (typeof renderHistory === 'function') renderHistory();
    }
}

// Konfetti i Uśmiech
function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const colors = ['#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
    for (let i = 0; i < 50; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        const duration = (Math.random() * 2 + 1) + 's';
        el.style.animation = `fall ${duration} linear forwards`;
        
        container.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }
}

function makePandaSmile() {
    const mouth = document.getElementById('panda-mouth');
    const panda = document.getElementById('panda-svg-el');

    if (!mouth || !panda) return;

    mouth.setAttribute('d', 'M 85 110 Q 100 130 115 110');
    panda.classList.add('panda-jump');
    
    playSound('giggle');
    triggerConfetti();

    setTimeout(() => {
        mouth.setAttribute('d', 'M 92 110 Q 100 115 108 110');
        panda.classList.remove('panda-jump');
    }, 1000);
}

// Animacje Itemów z sklepu
function toggleMusic() {
    const audio = document.getElementById('bg-music');
    if (!audio) return;

    const speakers = document.querySelector('.decor-speakers');
    
    if (isMusicPlaying) {
        audio.pause();
        isMusicPlaying = false;
        if(speakers) speakers.classList.remove('playing');
        showToast("Muzyka: Stop 🔇");
    } else {
        audio.play().then(() => {
            isMusicPlaying = true;
            if(speakers) speakers.classList.add('playing');
            showToast("Muzyka: Start 🎵");
        }).catch(e => {
            console.error("Autoplay blocked or error:", e);
            showToast("Kliknij stronę, by odtworzyć! ⚠️");
        });
    }
}

function animateBubbles() {
    const aquarium = document.querySelector('.decor-aquarium');
    if (!aquarium) return;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const size = Math.random() * 10 + 5;
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = (50 + (Math.random() * 20 - 10)) + '%'; 
    aquarium.appendChild(bubble);
    playSound('click'); 
    setTimeout(() => {
        bubble.remove();
    }, 2000);
}

function toggleCabinet() {
    const cabinet = document.querySelector('.decor-aquarium-stand');
    if(cabinet) {
        cabinet.classList.toggle('open');
        playSound('click');
    }
}

function openLedPicker() {
    const picker = document.getElementById('led-color-picker');
    if(picker) picker.click();
}
function toggleLamp(el) {
    el.classList.toggle('light-on');
    playSound('click');
    
    appData.lampLit = el.classList.contains('light-on');
    saveData(); 
}

// Wizualizacja Pokoju
function renderRoom() {
    const layer = document.getElementById('room-decor-layer');
    if (!layer) return;
    if (!appData || !Array.isArray(appData.activeFurniture)) return;

    layer.innerHTML = '';
    
    const allFurniture = [...shopFurniture, ...shopRare.filter(i => i.category === 'furniture')];

    appData.activeFurniture.forEach(itemId => {
        const item = allFurniture.find(i => i.id === itemId);
        
        if (item) {
            const el = document.createElement('div');
            el.className = `decor-item ${item.cssClass}`;
            
            if (item.isEmoji) {
                el.innerText = item.icon;
            }
            
            if (item.id === 'speakers') el.onclick = toggleMusic;
            if (item.id === 'aquarium') el.onclick = animateBubbles;
            if (item.id === 'leds') el.onclick = openLedPicker;
            if (item.id === 'aquarium_stand') el.onclick = toggleCabinet;
            
            if (item.id === 'poster') {
                el.onclick = () => {
                    const input = document.getElementById('poster-upload-input');
                    if (input) input.click();
                };
                if (appData.posterImage) {
                    el.style.backgroundImage = `url(${appData.posterImage})`;
                    el.innerText = '';
                } else {
                    el.innerText = 'Dodaj +';
                }
            }

            if (item.id === 'lamp') {
                if (appData.lampLit) el.classList.add('light-on');
                el.onclick = function() { 
                    if (typeof toggleLamp === 'function') toggleLamp(this); 
                };
            }
            
            if (item.id === 'shelf' || item.id === 'shelf_v2') {
                el.onclick = function() { 
                    if (typeof switchTab === 'function') switchTab('library'); 
                    playSound('click');
                };
            }

            layer.appendChild(el);
        }
    });
}

// Ubranie Pandy
function renderAccessory(elId, itemId) { 
    const el = document.getElementById(elId); 
    if (!el) return;

    const allClothes = [...shopClothes, ...shopRare.filter(i => i.category === 'clothes')];
    const item = allClothes.find(i => i.id === itemId);

    if (item) {
        el.setAttribute('data-item', itemId); 
        // Ubrania są rysowane w CSS (kształty), a nie wstawiane jako emotka.
        el.textContent = '';
        el.setAttribute('aria-label', item.name || '');
    } else {
        el.removeAttribute('data-item');
        el.removeAttribute('aria-label');
        el.textContent = ''; 
    }
}

// Inne
function showToast(message, type = "info") {
    message = String(message == null ? '' : message);
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = 'ℹ️';
    if (message.includes('💎')) icon = '💎';
    if (message.includes('Level')) icon = '🎉';
    if (message.includes('error') || type === 'error') icon = '❌';
    
    const safeMessage = typeof escapeHtml === 'function' ? escapeHtml(message) : String(message);
    toast.innerHTML = `<span>${icon}</span> <span>${safeMessage}</span>`;
    container.appendChild(toast);
    
    if (type === 'error') {
        playSound('click');
    } else {
        playSound(type === 'coin' ? 'coin' : 'click');
    }

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
function toggleFurniture(id) {
    const index = appData.activeFurniture.indexOf(id);
    if (index > -1) {
        appData.activeFurniture.splice(index, 1);
        showToast("Schowano mebel", "click");
    } else {
        appData.activeFurniture.push(id);
        showToast("Postawiono mebel", "click");
    }
    saveData();
    renderRoom();
    renderShopItems();
}
function updateUI() {
    if (!appData) return;

    const coinElements = ['coin-display', 'shop-coin-display', 'casino-coin-display'];
    coinElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = appData.coins;
    });

    if (!appData.equipped) appData.equipped = {};

    if (typeof renderAccessory === 'function') {
        renderAccessory('panda-hat', appData.equipped.hat);
        renderAccessory('panda-glasses', appData.equipped.glasses);
        renderAccessory('panda-neck', appData.equipped.neck);
        renderAccessory('panda-ears', appData.equipped.ears);
    }
    
    if (typeof updateXpBar === 'function') {
        updateXpBar();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const nextBtn = document.querySelector('.panda-btn-next');
       
        if (nextBtn && !nextBtn.parentElement.classList.contains('hidden')) {
            nextBtn.click();
        }
    }
});