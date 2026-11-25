
let pomoState = {
    isRunning: false,
    mode: 'work', 
    session: 1,
    timeLeft: 25 * 60,
    interval: null
};

let confirmCallback = null;

function customConfirm(msg, callback) {
    const modal = document.getElementById('confirm-modal');
    const msgElement = document.getElementById('confirm-msg');

    if (!modal || !msgElement) return;

    msgElement.innerText = msg;
    modal.classList.remove('hidden');
    confirmCallback = callback;
}

function closeConfirm(result) {
    const modal = document.getElementById('confirm-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    if (result && typeof confirmCallback === 'function') {
        confirmCallback();
    }
    confirmCallback = null;
}

function setModalIcon(icon) {
    const input = document.getElementById('modal-input-icon');
    if (input) {
        input.value = icon;
    }
}

function setModalColor(color) {
    const input = document.getElementById('modal-input-color');
    if (input) {
        input.value = color;
    }
}

// usuwanie elementów
function deleteItem(type, id) {
    if (!appData || !appData.subjects) return;
    customConfirm("Czy na pewno usunąć?", () => {
        const itemId = Number(id);

        if (type === 'subject') {
            appData.subjects = appData.subjects.filter(s => s.id !== itemId);
            if (typeof renderSubjects === 'function') renderSubjects();
        } 
        else if (type === 'topic') {
            const sub = appData.subjects.find(s => s.id === currentSubjectId);
            if (sub && sub.topics) {
                sub.topics = sub.topics.filter(t => t.id !== itemId);
                if (typeof renderTopics === 'function') renderTopics();
            }
        } 
        else if (type === 'set') {
            const sub = appData.subjects.find(s => s.id === currentSubjectId);
            const t = sub ? sub.topics.find(top => top.id === currentTopicId) : null;
            if (t && t.flashcardSets) {
                t.flashcardSets = t.flashcardSets.filter(s => s.id !== itemId);
                if (typeof renderMaterials === 'function') renderMaterials();
            }
        } 
        else if (type === 'quiz') {
            const sub = appData.subjects.find(s => s.id === currentSubjectId);
            const t = sub ? sub.topics.find(top => top.id === currentTopicId) : null;
            if (t && t.materials) {
                t.materials = t.materials.filter(m => m.id !== itemId);
                if (typeof renderMaterials === 'function') renderMaterials();
            }
        }
        
        if (typeof saveData === 'function') saveData();
        if (typeof showToast === 'function') {
            showToast("Usunięto pomyślnie!", "info");
        }
    });
}

// klikanie w zakladki
function openSubject(id) {
    if (!appData || !appData.subjects) return;

    const subjectId = Number(id);
    currentSubjectId = subjectId;

    const sub = appData.subjects.find(s => s.id === subjectId);
    if (!sub) return;

    if (typeof setDynamicTheme === 'function') {
        setDynamicTheme(sub.color || '#ec4899');
    }

    const viewSubjects = document.getElementById('view-subjects');
    const viewTopics = document.getElementById('view-topics');
    const subjectNameDisplay = document.getElementById('current-subject-name');

    if (viewSubjects) {
        viewSubjects.classList.add('hidden');
    }

    if (viewTopics) {
        viewTopics.classList.remove('hidden');
    }

    if (subjectNameDisplay) {
        subjectNameDisplay.innerText = sub.name;
    }

    if (typeof renderTopics === 'function') {
        renderTopics();
    }
}

// KALENDARZ
const daysMap = { 
    monday: 'Poniedziałek', 
    tuesday: 'Wtorek', 
    wednesday: 'Środa', 
    thursday: 'Czwartek', 
    friday: 'Piątek', 
    saturday: 'Sobota', 
    sunday: 'Niedziela' 
};
function renderSchedule() {
    if (typeof daysMap === 'undefined' || !appData || !appData.schedule) return;

    const container = document.getElementById('planner-week-view');
    if (!container) return;

    container.innerHTML = '';

    for (const [key, name] of Object.entries(daysMap)) {
        const col = document.createElement('div');
        col.className = 'planner-day-col';

        const dayEvents = appData.schedule[key] || [];
        const events = [...dayEvents].sort((a, b) => {
            if (!a.time || !b.time) return 0;
            return a.time.localeCompare(b.time);
        });

        let eventsHtml = '';
        events.forEach(ev => {
            eventsHtml += `
                <div class="event-item">
                    <span class="event-time">${escapeHtml(ev.time || '00:00')}</span>
                    <span class="event-title">${escapeHtml(ev.title || '')}</span>
                    <button class="event-delete" onclick="deleteEvent('${key}', ${Number(ev.id) || 0})">✕</button>
                </div>`;
        });

        col.innerHTML = `
            <div class="day-header">${name}</div>
            <div class="events-list">${eventsHtml}</div>
            <div class="event-input-group">
                <input type="time" class="time-input" id="time-${key}">
                <input type="text" class="text-input" id="title-${key}" placeholder="Zadanie...">
                <button class="btn-add-event" onclick="addEvent('${key}')">Dodaj</button>
            </div>
        `;
        container.appendChild(col);
    }
}
function addEvent(key) {
    if (!appData) return;

    const timeEl = document.getElementById(`time-${key}`);
    const titleEl = document.getElementById(`title-${key}`);

    if (!timeEl || !titleEl) return;

    const time = timeEl.value;
    const title = titleEl.value.trim();

    if (!time || !title) {
        if (typeof showToast === 'function') {
            showToast("Wypełnij czas i tytuł!", "error");
        }
        return;
    }

    if (!appData.schedule) {
        appData.schedule = {};
    }
    if (!appData.schedule[key]) {
        appData.schedule[key] = [];
    }

    appData.schedule[key].push({
        id: Date.now(),
        time: time,
        title: title,
        completed: false
    });

    if (typeof updateQuestProgress === 'function') {
        updateQuestProgress('add_event', 1);
    }

    if (typeof saveData === 'function') saveData();
    if (typeof renderSchedule === 'function') renderSchedule();
    
    if (typeof showToast === 'function') {
        showToast("Dodano do planu! 📅", "success");
    }

    timeEl.value = "";
    titleEl.value = "";
}
function deleteEvent(key, id) {
    if (!appData || !appData.schedule || !appData.schedule[key]) return;

    const eventId = Number(id);

    appData.schedule[key] = appData.schedule[key].filter(e => e.id !== eventId);

    if (typeof saveData === 'function') {
        saveData();
    }

    if (typeof renderSchedule === 'function') {
        renderSchedule();
    }
}

// QUESTY NAGRODY XP
const QUEST_TEMPLATES = [
    { type: 'focus', target: 15, text: "Chwila skupienia (15 min)", xp: 30, coins: 10 },
    { type: 'focus', target: 45, text: "Głęboka praca (45 min)", xp: 100, coins: 30 },
    { type: 'pomo_session', target: 1, text: "Ukończ sesję Pomodoro", xp: 60, coins: 20 },
    { type: 'pomo_session', target: 3, text: "Mistrz Pomodoro (3 sesje)", xp: 150, coins: 50 },
    { type: 'note', target: 1, text: "Zrób notatki w zeszycie", xp: 20, coins: 5 },
    { type: 'create_flashcard', target: 5, text: "Stwórz 5 nowych fiszek", xp: 40, coins: 15 },
    { type: 'create_content', target: 1, text: "Nowy zeszyt, temat lub zestaw", xp: 30, coins: 10 },
    { type: 'solve_quiz', target: 1, text: "Rozwiąż dowolny quiz", xp: 50, coins: 20 },
    { type: 'solve_quiz', target: 2, text: "Zrób dwa różne quizy", xp: 120, coins: 40 },
    { type: 'buy', target: 1, text: "Kup coś ładnego w sklepie", xp: 30, coins: 15 },
    { type: 'add_event', target: 1, text: "Dodaj wpis do Grafiku", xp: 20, coins: 5 }
];

function checkDailyQuests() {
    if (!appData) return; 

    const today = new Date().toDateString();
    
    if (!appData.lastQuestDate || appData.lastQuestDate !== today) {
        if (typeof generateDailyQuests === 'function') {
            generateDailyQuests();
        }
        appData.lastQuestDate = today;
        saveData();
    }
    
    if (typeof renderQuests === 'function') {
        renderQuests();
    }
}
function generateDailyQuests() {
    let selected = [];
    const dueCards = (typeof getAllDueCards === 'function') ? getAllDueCards() : [];
 
    if (dueCards.length > 0) {
        selected.push({
            type: 'smart_review',
            target: Math.min(dueCards.length, 10),
            progress: 0,
            text: `🧠 Powtórka fiszek (${Math.min(dueCards.length, 10)})`,
            xp: 50,
            coins: 20,
            done: false,
            claimed: false
        });
    }

    let available = [...QUEST_TEMPLATES];
    const totalQuestsNeeded = 5;
    
    while (selected.length < totalQuestsNeeded && available.length > 0) {
        const randomIndex = Math.floor(Math.random() * available.length);
        const quest = available[randomIndex];
        selected.push({ ...quest, progress: 0, done: false, claimed: false });
        available.splice(randomIndex, 1);
    }

    appData.dailyQuests = selected;
}
function updateQuestProgress(type, amount) {
    if (!appData || !Array.isArray(appData.dailyQuests)) return;
    let changed = false;
    
    appData.dailyQuests.forEach(q => {
        if (q.type === type && !q.done && !q.claimed) {
            q.progress += amount;
            
            if (q.progress >= q.target) {
                q.progress = q.target;
                q.done = true; 
            }
            changed = true;
        }
    });

    if (changed) {
        saveData();
        renderQuests();

    }
}
function renderQuests() {
    const container = document.getElementById('quests-list');
    if (!container) return;
    if (!appData || !Array.isArray(appData.dailyQuests)) return;

    container.innerHTML = '';
    
    appData.dailyQuests.forEach((q, index) => {
        const isReady = q.progress >= q.target;
        const div = document.createElement('div');
        div.className = `quest-item ${q.claimed ? 'completed' : ''}`;
        
        let buttonHtml;
        if (q.claimed) {
            buttonHtml = '<span class="quest-done-icon">✅</span>';
        } else if (q.type === 'smart_review' && !isReady) {
            buttonHtml = `<button class="btn-claim" onclick="startDailyReview()" style="background:#ec4899;">START ▶</button>`;
        } else if (isReady) {
            buttonHtml = `<button class="btn-claim" onclick="claimQuest(${index})">Odbierz</button>`;
        } else {
            buttonHtml = `<button class="btn-claim" disabled>Odbierz</button>`;
        }

        div.innerHTML = `
            <div class="quest-info">
                <h4>${q.text}</h4>
                <div class="quest-reward">
                    <span class="quest-progress-txt">${q.progress} / ${q.target}</span>
                    <span>+${q.xp} XP, +${q.coins} 💎</span>
                </div>
            </div>
            ${buttonHtml}
        `;
        container.appendChild(div);
    });
}
function claimQuest(index) {
    const q = appData.dailyQuests[index];
    
    if (!q || q.claimed || q.progress < q.target) return;

    q.claimed = true;
    q.done = true;
    appData.coins += q.coins;
    
    if (typeof addXp === 'function') {
        addXp(q.xp);
    }
    
    saveData();
    renderQuests();
    updateUI();
    
    if (typeof showToast === 'function') {
        showToast(`Odebrano: +${q.coins} 💎`, 'coin');
    }
    
    if (typeof triggerConfetti === 'function') {
        triggerConfetti();
    }
}
function addXp(amount) {
    if (!appData) return;

    appData.xp = (appData.xp || 0) + Number(amount);
    appData.level = appData.level || 1;
    appData.maxXp = Math.max(1, appData.maxXp || 100);

    while (appData.xp >= appData.maxXp) {
        appData.xp -= appData.maxXp;
        appData.level++;
        
        appData.maxXp = Math.floor(appData.maxXp * 1.5);

        if (typeof showToast === 'function') {
            showToast(`Level UP! Poziom ${appData.level}!`, 'levelUp');
        }
        
        if (typeof playSound === 'function') {
            playSound('levelUp');
        }
        
        if (typeof triggerConfetti === 'function') {
            triggerConfetti();
        }
    }

    if (typeof updateXpBar === 'function') {
        updateXpBar();
    }
    
    if (typeof saveData === 'function') {
        saveData();
    }
}
function updateXpBar() {
    if (!appData) return;

    const levelDisplay = document.getElementById('level-display');
    const xpText = document.getElementById('xp-text');
    const xpBarFill = document.getElementById('xp-bar-fill');

    if (levelDisplay) {
        levelDisplay.innerText = appData.level || 1;
    }

    const currentXp = appData.xp || 0;
    const maxXp = appData.maxXp || 100;

    if (xpText) {
        xpText.innerText = `${currentXp} / ${maxXp} XP`;
    }

    if (xpBarFill) {
        const percent = Math.min(100, Math.max(0, (currentXp / maxXp) * 100));
        xpBarFill.style.width = `${percent.toFixed(2)}%`;
    }
}

// Zmienne globalne
let timerInterval;
let isReviewMode = false;
let currentShopCategory = null;
let isMusicPlaying = false; 


//============================= BAZA DANYCH ================================
// Baza Danych - zapis danych
const DB_NAME = 'StudyPetDB';
const DB_VERSION = 1;
let db;

// Połączenie z Bazą Danych
function initDB() {
    return new Promise((resolve) => {
        try {
            if (!window.indexedDB) {
                console.warn("IndexedDB niedostępne - używam localStorage.");
                resolve(null);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Database error", event);
                resolve(null);
            };

            request.onupgradeneeded = (event) => {
                db = event.target.result;
                if (!db.objectStoreNames.contains('store')) {
                    db.createObjectStore('store');
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };
        } catch (e) {
            console.error("Nie można otworzyć bazy danych:", e);
            resolve(null);
        }
    });
}

// Zapis w Bazie Danych
function dbSave(key, value) {
    if (!db) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error("Nie udało się zapisać w localStorage:", e);
        }
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction('store', 'readwrite');
            const store = tx.objectStore('store');
            store.put(value, key);

            tx.oncomplete = () => resolve();
            tx.onerror = (event) => reject(event.target.error);
        } catch (e) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (err) {
                console.error("Nie udało się zapisać danych:", err);
            }
            resolve();
        }
    });
}

// Pobieranie danych z Bazy Danych
function dbGet(key) {
    if (!db) {
        try {
            const raw = localStorage.getItem(key);
            return Promise.resolve(raw ? JSON.parse(raw) : null);
        } catch (e) {
            return Promise.resolve(null);
        }
    }

    return new Promise((resolve) => {
        try {
            const tx = db.transaction('store', 'readonly');
            const store = tx.objectStore('store');
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        } catch (e) {
            resolve(null);
        }
    });
}

// Usuwanie danych z Baz Danych
function dbDelete(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error("Nie udało się usunąć danych z localStorage:", e);
    }

    if (!db) return Promise.resolve();

    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction('store', 'readwrite');
            const store = tx.objectStore('store');
            store.delete(key);
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e);
        } catch (e) {
            resolve();
        }
    });
}

// Zapis postępu
async function saveData() {
    if (typeof updateUI === 'function') updateUI();
    try {
        await dbSave('studyPetRPG_Final', appData);
    } catch (e) {
        console.error("Błąd zapisu danych:", e);
    }
}

// wczytanie zapisu
async function loadData() {
    const saved = await dbGet('studyPetRPG_Final');
    if (saved) {
        appData = saved;

        appData.dailyQuests = appData.dailyQuests || [];
        appData.subjects = appData.subjects || [];
        appData.history = appData.history || [];
        appData.reviewQueue = appData.reviewQueue || [];
        appData.activeFurniture = appData.activeFurniture || [];
        appData.inventory = appData.inventory || [];

        // Uzupełniamy brakujące pola w danych ze starszych wersji aplikacji
        appData.subjects.forEach(sub => {
            sub.topics = sub.topics || [];
            sub.topics.forEach(topic => {
                topic.flashcardSets = topic.flashcardSets || [];
                topic.materials = topic.materials || [];
                if (!topic.noteData || !Array.isArray(topic.noteData.pages) || topic.noteData.pages.length === 0) {
                    topic.noteData = { pages: [{ content: "", style: "lined", theme: "white" }] };
                }
            });
        });

        if (!appData.equipped) appData.equipped = {};
        if (appData.equipped.ears === undefined) appData.equipped.ears = null;
        if (appData.furniture && appData.furniture.length > 0) {
            appData.furniture.forEach(id => {
                if (!appData.inventory.includes(id)) appData.inventory.push(id);
            });
            appData.furniture = [];
        }
    }
}

//============================= AUDIO ================================================
// Główne Audio
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
try {
    audioCtx = AudioContextClass ? new AudioContextClass() : null;
} catch (e) {
    console.warn("AudioContext niedostępny:", e);
    audioCtx = null;
}

function playTone(freq, type, duration) {
    if (!audioCtx) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        // Dźwięk jest dodatkiem - błąd audio nie może psuć aplikacji.
    }
}

function playSound(type) {
    switch (type) {
        case 'coin': playTone(1200, 'sine', 0.1); setTimeout(() => playTone(1600, 'sine', 0.2), 100); break;
        case 'levelUp': playTone(400, 'triangle', 0.1); setTimeout(() => playTone(600, 'triangle', 0.1), 100); setTimeout(() => playTone(800, 'triangle', 0.4), 200); break;
        case 'click': playTone(300, 'sine', 0.05); break;
        case 'success': playTone(600, 'sine', 0.3); break;
        case 'cardFlip': playTone(200, 'sine', 0.05); break;
        case 'giggle': 
            playTone(600, 'sine', 0.1); 
            setTimeout(() => playTone(800, 'sine', 0.1), 80); 
            setTimeout(() => playTone(1000, 'sine', 0.2), 160); 
            break;
    }
}

//=========================== Histroia ===================================================
// Przycisk reset 
async function hardReset() {
    if (confirm("To usunie WSZYSTKIE postępy. Jesteś pewien?")) {
        await dbDelete('studyPetRPG_Final');
        location.reload();
    }
}
function renderHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;

    list.innerHTML = '';

    if (!appData || !appData.history || appData.history.length === 0) {
        list.innerHTML = '<div class="empty-state">Brak historii. Poucz się trochę! 🎓</div>';
        return;
    }

    appData.history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-info">
                <span class="h-topic">${escapeHtml(item.topic || 'Sesja skupienia')}</span>
                <span class="h-date">${escapeHtml(item.date || '')}</span>
            </div>
            <div class="h-stats">
                <span>⏱️ ${item.duration || 0}m</span>
                <span>💎 ${item.reward || 0}</span>
            </div>
        `;
        list.appendChild(div);
    });
}
function clearHistory() {
    if (typeof customConfirm === 'function') {
        customConfirm("Czy na pewno chcesz wyczyścić całą historię?", () => {
            if (appData) {
                appData.history = [];
                if (typeof saveData === 'function') saveData();
                renderHistory();
                if (typeof showToast === 'function') {
                    showToast("Historia została wyczyszczona", "info");
                }
            }
        });
    } else {
        if (appData) {
            appData.history = [];
            if (typeof saveData === 'function') saveData();
            renderHistory();
        }
    }
}

// =================================== Skupienie ===============================
function finishTimer(fromBackground) {
    if (typeof timerInterval !== 'undefined') {
        clearInterval(timerInterval);
    }
    
    if (!appData.timerState) return;

    appData.timerState.isRunning = false;
    appData.timerState.isPaused = false;

    const minutes = Math.floor((appData.timerState.totalTime || 0) / 60000);
    const reward = Math.max(1, Math.floor(minutes / 5));

    if (!appData.history) {
        appData.history = [];
    }

    appData.history.unshift({
        date: new Date().toLocaleString(),
        topic: appData.timerState.topic || 'Bez tematu',
        duration: minutes,
        reward: reward
    });

    appData.coins += reward;

    if (typeof updateQuestProgress === 'function') {
        updateQuestProgress('focus', minutes);
    }

    appData.timerState.endTime = null;
    appData.timerState.remaining = 0;

    saveData();
    updateUI();
    
    if (typeof showToast === 'function') {
        showToast(`Ukończono! Nagroda: ${reward} 💎`, 'coin');
    }
    
    if (typeof playSound === 'function') {
        playSound('success');
    }
    
    if (typeof resetTimerUI === 'function') {
        resetTimerUI();
    }
}
function checkTimerState() {
    if (!appData || !appData.timerState) return;

    const timer = appData.timerState;

    if (timer.isRunning) {
        const now = Date.now();
        if (timer.endTime && now >= timer.endTime) {
            if (typeof finishTimer === 'function') finishTimer(true);
        } else {
            if (typeof resumeTimerUI === 'function') resumeTimerUI();
            if (typeof startInterval === 'function') startInterval();
        }
    } else if (timer.isPaused) {
        if (typeof resumeTimerUI === 'function') resumeTimerUI();
        
        const display = document.getElementById('timer-real-display');
        if (display && typeof formatTime === 'function') {
            display.innerText = formatTime(Math.floor((timer.remaining || 0) / 1000));
        }

        if (typeof updateProgressBar === 'function') {
            updateProgressBar(timer.remaining || 0, timer.totalTime || 1);
        }

        const btnStart = document.getElementById('btn-start');
        const btnPause = document.getElementById('btn-pause');
        const btnResume = document.getElementById('btn-resume');

        if (btnStart) btnStart.classList.add('hidden');
        if (btnPause) btnPause.classList.add('hidden');
        if (btnResume) btnResume.classList.remove('hidden');
    }
}
function startTimer() {
    const inputEl = document.getElementById('focus-input-minutes');
    const topicEl = document.getElementById('focus-topic-input');
    
    if (!inputEl || !topicEl) return;

    const inputVal = inputEl.value;
    const topicVal = topicEl.value;

    if (!inputVal || inputVal <= 0) {
        if (typeof showToast === 'function') showToast("Wpisz czas!");
        return;
    }
    if (!topicVal.trim()) {
        if (typeof showToast === 'function') showToast("Wpisz temat!");
        return;
    }

    const ms = parseInt(inputVal) * 60 * 1000;
    
    if (!appData.timerState) appData.timerState = {};
    
    appData.timerState.totalTime = ms;
    appData.timerState.endTime = Date.now() + ms;
    appData.timerState.isRunning = true;
    appData.timerState.isPaused = false;
    appData.timerState.remaining = ms;
    appData.timerState.topic = topicVal;

    if (typeof saveData === 'function') saveData();
    if (typeof resumeTimerUI === 'function') resumeTimerUI();
    if (typeof startInterval === 'function') startInterval();
}
function pauseTimer() {
    if (!appData.timerState || !appData.timerState.isRunning) return;

    if (typeof timerInterval !== 'undefined') {
        clearInterval(timerInterval);
    }

    appData.timerState.remaining = appData.timerState.endTime - Date.now();
    appData.timerState.isRunning = false;
    appData.timerState.isPaused = true;
    appData.timerState.endTime = null;

    if (typeof saveData === 'function') saveData();

    const btnPause = document.getElementById('btn-pause');
    const btnResume = document.getElementById('btn-resume');

    if (btnPause) btnPause.classList.add('hidden');
    if (btnResume) btnResume.classList.remove('hidden');
}
function resumeTimer() {
    if (!appData.timerState || !appData.timerState.isPaused) return;

    appData.timerState.endTime = Date.now() + (appData.timerState.remaining || 0);
    appData.timerState.isRunning = true;
    appData.timerState.isPaused = false;

    if (typeof saveData === 'function') saveData();

    const btnResume = document.getElementById('btn-resume');
    const btnPause = document.getElementById('btn-pause');

    if (btnResume) btnResume.classList.add('hidden');
    if (btnPause) btnPause.classList.remove('hidden');

    if (typeof startInterval === 'function') startInterval();
}
function startInterval() {
    if (typeof timerInterval !== 'undefined' && timerInterval !== null) {
        clearInterval(timerInterval);
    }

    if (typeof updateTick === 'function') {
        updateTick();
        timerInterval = setInterval(updateTick, 1000);
    }
}
function updateTick() {
    if (!appData || !appData.timerState || !appData.timerState.endTime) return;
    
    const distance = appData.timerState.endTime - Date.now();
    
    if (distance < 0) {
        if (typeof finishTimer === 'function') finishTimer(false);
    } else {
        const display = document.getElementById('timer-real-display');
        if (display && typeof formatTime === 'function') {
            display.innerText = formatTime(Math.floor(distance / 1000));
        }
        if (typeof updateProgressBar === 'function') {
            updateProgressBar(distance, appData.timerState.totalTime);
        }
    }
}
function stopTimer() {
    if (typeof timerInterval !== 'undefined') clearInterval(timerInterval);
    
    appData.timerState = { 
        isRunning: false, 
        isPaused: false, 
        endTime: null, 
        remaining: 0, 
        totalTime: 0, 
        topic: "" 
    };
    
    if (typeof saveData === 'function') saveData();
    if (typeof resetTimerUI === 'function') resetTimerUI();
}
function resumeTimerUI() {
    const inputMode = document.getElementById('timer-input-mode');
    const displayMode = document.getElementById('timer-display-mode');
    const topicDisplay = document.getElementById('timer-topic-display');
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnStop = document.getElementById('btn-stop');

    if (inputMode) inputMode.style.display = 'none';
    if (displayMode) displayMode.style.display = 'block';
    
    if (topicDisplay && appData.timerState) {
        topicDisplay.innerText = appData.timerState.topic || "Brak tematu";
    }

    if (btnStart) btnStart.classList.add('hidden');
    if (btnPause) btnPause.classList.remove('hidden');
    if (btnStop) btnStop.disabled = false;
}
function resetTimerUI() {
    const inputMode = document.getElementById('timer-input-mode');
    const displayMode = document.getElementById('timer-display-mode');
    const progressBar = document.getElementById('focus-progress-bar');
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnResume = document.getElementById('btn-resume');
    const btnStop = document.getElementById('btn-stop');
    const topicInput = document.getElementById('focus-topic-input');

    if (inputMode) inputMode.style.display = 'block';
    if (displayMode) displayMode.style.display = 'none';
    if (progressBar) progressBar.style.height = '0%';
    
    if (btnStart) btnStart.classList.remove('hidden');
    if (btnPause) btnPause.classList.add('hidden');
    if (btnResume) btnResume.classList.add('hidden');
    if (btnStop) btnStop.disabled = true;
    if (topicInput) topicInput.value = "";
}
function updateProgressBar(remaining, total) {
    if (!total || total <= 0) return;
    
    const percentage = Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
    const bar = document.getElementById('focus-progress-bar');
    if (bar) bar.style.height = `${percentage}%`;
    
    const rewardDisplay = document.getElementById('focus-reward-preview');
    if (rewardDisplay) {
        const minutes = Math.floor(total / 60000);
        const reward = Math.max(1, Math.floor(minutes / 5));
        rewardDisplay.innerText = `💎 x${reward}`;
    }
}
function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

// wybranie i powrót
function selectFocusMode(mode) {
    const selection = document.getElementById('focus-selection');
    const classic = document.getElementById('container-timer-classic');
    const pomodoro = document.getElementById('container-timer-pomodoro');

    if (selection) selection.classList.add('hidden');

    if (mode === 'classic') {
        if (classic) classic.classList.remove('hidden');
    } else {
        if (pomodoro) pomodoro.classList.remove('hidden');
        if (typeof resetPomodoroUI === 'function') resetPomodoroUI();
    }
}
function backToFocusSelection() {
    const isTimerRunning = typeof appData !== 'undefined' && appData.timerState && appData.timerState.isRunning;
    const isPomoRunning = typeof pomoState !== 'undefined' && pomoState.isRunning;

    const classic = document.getElementById('container-timer-classic');
    const pomodoro = document.getElementById('container-timer-pomodoro');
    const selection = document.getElementById('focus-selection');

    const executeBack = () => {
        if (typeof stopTimer === 'function') stopTimer();
        if (typeof stopPomodoro === 'function') stopPomodoro();
        if (classic) classic.classList.add('hidden');
        if (pomodoro) pomodoro.classList.add('hidden');
        if (selection) selection.classList.remove('hidden');
    };

    if (isTimerRunning || isPomoRunning) {
        if (typeof customConfirm === 'function') {
            customConfirm("Przerwać naukę i wrócić do wyboru?", executeBack);
        } else {
            executeBack();
        }
    } else {
        executeBack();
    }
}

// pomodoro
function resetPomodoroUI() {
    pomoState.mode = 'work';
    pomoState.session = 1;
    pomoState.timeLeft = 25 * 60;
    
    if (typeof updatePomoDisplay === 'function') updatePomoDisplay();
    
    const startBtn = document.getElementById('btn-pomo-start');
    const stopBtn = document.getElementById('btn-pomo-stop');
    const statusText = document.getElementById('pomo-status-text');
    const pomoBox = document.getElementById('pomo-box');

    if (startBtn) startBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (statusText) statusText.innerText = "Czas na Naukę! 📚";
    if (pomoBox) pomoBox.style.borderColor = "#fbcfe8";
}
function startPomodoro() {
    if (pomoState.isRunning) return;
    
    const startBtn = document.getElementById('btn-pomo-start');
    const stopBtn = document.getElementById('btn-pomo-stop');

    pomoState.isRunning = true;
    if (startBtn) startBtn.classList.add('hidden');
    if (stopBtn) stopBtn.classList.remove('hidden');
    
    pomoState.interval = setInterval(() => {
        pomoState.timeLeft--;
        if (typeof updatePomoDisplay === 'function') updatePomoDisplay();
        
        if (pomoState.timeLeft <= 0) {
            if (typeof handlePomoEnd === 'function') handlePomoEnd();
        }
    }, 1000);
}
function stopPomodoro() {
    if (pomoState.interval) clearInterval(pomoState.interval);
    pomoState.isRunning = false;
    resetPomodoroUI();
}
function updatePomoDisplay() {
    const display = document.getElementById('pomo-display');
    const sessionCount = document.getElementById('pomo-session-count');
    const progressBar = document.getElementById('pomo-progress-bar');

    const mins = Math.floor(pomoState.timeLeft / 60);
    const secs = pomoState.timeLeft % 60;
    
    if (display) {
        display.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    if (sessionCount) {
        sessionCount.innerText = `Sesja ${pomoState.session}/4`;
    }
    
    if (progressBar) {
        const total = pomoState.mode === 'work' ? 25 * 60 : 5 * 60;
        const percent = ((total - pomoState.timeLeft) / total) * 100;
        progressBar.style.height = `${percent}%`;
    }
}
function handlePomoEnd() {
    if (pomoState.interval) clearInterval(pomoState.interval);
    pomoState.isRunning = false;

    if (pomoState.mode === 'work') {
        const sessionDuration = 25;
        const reward = 5;
        
        if (typeof appData !== 'undefined') {
            appData.coins += reward;
            if (!appData.history) appData.history = [];
            appData.history.unshift({
                date: new Date().toLocaleString(),
                topic: `Pomodoro: Sesja ${pomoState.session}`,
                duration: sessionDuration,
                reward: reward
            });
        }

        if (typeof addXp === 'function') addXp(20);
        if (typeof updateQuestProgress === 'function') {
            updateQuestProgress('pomo_session', 1);
            updateQuestProgress('focus', sessionDuration);
        }

        if (typeof saveData === 'function') saveData();
        if (typeof updateUI === 'function') updateUI();
        
        if (typeof showToast === 'function') {
            showToast(`Sesja ukończona! +5 💎 i +25 min skupienia`, "success");
        }
        if (typeof playSound === 'function') {
            playSound('success');
            playSound('levelUp');
        }
        if (typeof triggerConfetti === 'function') triggerConfetti();

        pomoState.mode = 'break';
        pomoState.timeLeft = 5 * 60;
        
        const statusText = document.getElementById('pomo-status-text');
        const pomoBox = document.getElementById('pomo-box');
        if (statusText) statusText.innerText = "Czas na przerwę! ☕";
        if (pomoBox) pomoBox.style.borderColor = "#10b981";

    } else {
        if (typeof showToast === 'function') {
            showToast("Przerwa zakończona! Wracamy do pracy?", "info");
        }
        pomoState.mode = 'work';
        pomoState.timeLeft = 25 * 60;
        pomoState.session++;
        if (pomoState.session > 4) pomoState.session = 1;

        const statusText = document.getElementById('pomo-status-text');
        const pomoBox = document.getElementById('pomo-box');
        if (statusText) statusText.innerText = "Czas na Naukę! 📚";
        if (pomoBox) pomoBox.style.borderColor = "#fbcfe8";
        
        if (typeof playSound === 'function') playSound('levelUp');
    }

    // Po zakończeniu sesji/przerwy timer stoi - pokazujemy przycisk START
    const startBtn = document.getElementById('btn-pomo-start');
    const stopBtn = document.getElementById('btn-pomo-stop');
    if (startBtn) startBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');

    updatePomoDisplay();
}

//skalowanie zdjec
function resizeImage(base64Str, maxWidth = 800, maxHeight = 800) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.src = base64Str;
        
        img.onerror = () => {
            resolve(base64Str); 
        };

        img.onload = () => {
            let canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            try {
                let ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Brak kontekstu canvas');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            } catch (err) {
                resolve(base64Str);
            }
        };
    });
}

