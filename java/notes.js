// Przewijanie kart, widok
let currentSubjectId = null;
let currentTopicId = null;
let currentSetId = null;
let currentNotePage = 0;
let currentCardIndex = 0;
let editingSubjectId = null;
let editingSetId = null;

// Bezpieczne wstawianie tekstu użytkownika do HTML
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function switchWorkTab(type) {
    const notesPanel = document.getElementById('work-content-notes');
    const materialsPanel = document.getElementById('work-content-materials');
    const tabNotes = document.getElementById('tab-notes');
    const tabFlash = document.getElementById('tab-flashcards');

    if (!notesPanel || !materialsPanel) return;

    if (type === 'notes') {
        notesPanel.classList.remove('hidden');
        materialsPanel.classList.add('hidden');
        if (tabNotes) tabNotes.classList.add('active');
        if (tabFlash) tabFlash.classList.remove('active');
    } else {
        notesPanel.classList.add('hidden');
        materialsPanel.classList.remove('hidden');
        if (tabNotes) tabNotes.classList.remove('active');
        if (tabFlash) tabFlash.classList.add('active');
        
        renderMaterials();
    }
}


function saveModal() {
    const nameInput = document.getElementById('modal-input-name');
    const iconInput = document.getElementById('modal-input-icon');
    const colorInput = document.getElementById('modal-input-color');
    const modal = document.getElementById('custom-modal');

    if (!nameInput || !modal) return;

    const name = nameInput.value.trim();
    const modalType = modal.getAttribute('data-mode');

    const icon = iconInput ? iconInput.value : '📚';
    const color = colorInput ? colorInput.value : '#ec4899';

    if (!name) {
        if (typeof showToast === 'function') {
            showToast("Podaj nazwę!", "error");
        }
        return;
    }

    if (typeof appData === 'undefined' || !appData) {
        window.appData = { subjects: [], coins: 0, level: 1, xp: 0 };
    }
    if (!appData.subjects) {
        appData.subjects = [];
    }

    if (modalType === 'createSubject') {
        appData.subjects.push({
            id: Date.now(),
            name: name,
            icon: icon,
            color: color,
            topics: []
        });
        if (typeof updateQuestProgress === 'function') updateQuestProgress('create_content', 1);
        renderSubjects();

    } else if (modalType === 'editSubject') {
        const subject = appData.subjects.find(s => s.id === editingSubjectId);
        if (subject) {
            subject.name = name;
            subject.icon = icon;
            subject.color = color;
            renderSubjects();
        }
        editingSubjectId = null;

    } else if (modalType === 'createTopic') {
        const sub = appData.subjects.find(s => s.id === currentSubjectId);
        if (sub) {
            if (!sub.topics) sub.topics = [];
            sub.topics.push({
                id: Date.now(),
                name: name,
                icon: icon,
                color: color,
                noteData: { pages: [{ content: "", style: "lined", theme: "white" }] },
                flashcardSets: [],
                materials: []
            });
            if (typeof updateQuestProgress === 'function') updateQuestProgress('create_content', 1);
            renderTopics();
        }

    } else if (modalType === 'editTopic') {
        const sub = appData.subjects.find(s => s.id === currentSubjectId);
        const topic = sub ? sub.topics.find(t => t.id === editingTopicId) : null;
        if (topic) {
            topic.name = name;
            topic.icon = icon;
            topic.color = color;
            if (editingTopicId === currentTopicId) {
                const currentTopicName = document.getElementById('current-topic-name');
                if (currentTopicName) currentTopicName.innerText = name;
                if (typeof setDynamicTheme === 'function') setDynamicTheme(color);
                if (typeof renderMaterials === 'function') renderMaterials();
            }
            editingTopicId = null;
            renderTopics();
        }

    } else if (modalType === 'createSet') {
        const sub = appData.subjects.find(s => s.id === currentSubjectId);
        const t = sub ? sub.topics.find(top => top.id === currentTopicId) : null;
        if (t) {
            if (!t.flashcardSets) t.flashcardSets = [];
            t.flashcardSets.push({
                id: Date.now(),
                name: name,
                icon: icon,
                color: color,
                cards: []
            });
            if (typeof updateQuestProgress === 'function') updateQuestProgress('create_content', 1);
            renderMaterials();
        }
    } else if (modalType === 'editSet') {
        const sub = appData.subjects.find(s => s.id === currentSubjectId);
        const t = sub ? sub.topics.find(top => top.id === currentTopicId) : null;
        const set = t && t.flashcardSets ? t.flashcardSets.find(s => s.id === editingSetId) : null;
        if (set) {
            set.name = name;
            set.icon = icon;
            set.color = color;
            renderMaterials();
        }
        editingSetId = null;
    }

    if (typeof saveData === 'function') saveData();
    closeModal();
    nameInput.value = '';
}

function openModal(mode, id = null) {
    const modal = document.getElementById('custom-modal');
    const title = document.getElementById('modal-title');
    if (!modal) return;

    const sub = appData && appData.subjects ? appData.subjects.find(s => s.id === currentSubjectId) : null;
    const topic = sub && sub.topics ? sub.topics.find(t => t.id === currentTopicId) : null;

    if (topic && topic.color) {
        setDynamicTheme(topic.color);
    }

    modal.setAttribute('data-mode', mode);
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    if (id != null) {
        if (mode === 'editSubject') editingSubjectId = id;
        if (mode === 'editTopic') editingTopicId = id;
        if (mode === 'editSet') editingSetId = id;
    }

    const nameInput = document.getElementById('modal-input-name');
    const iconInput = document.getElementById('modal-input-icon');
    const colorInput = document.getElementById('modal-input-color');

    if (nameInput) nameInput.value = '';
    if (iconInput) iconInput.value = '📝';
    if (colorInput) colorInput.value = '#ec4899';

    document.querySelectorAll('#modal-emoji-picker span').forEach(span => span.classList.remove('active'));
    document.querySelectorAll('#modal-color-picker .color-dot').forEach(dot => {
        dot.classList.toggle('active', dot.style.background === 'rgb(236, 72, 153)' || dot.style.backgroundColor === 'rgb(236, 72, 153)');
    });

    if (title) {
        const titles = {
            createSubject: "Nowy Zeszyt",
            editSubject: "Edytuj Zeszyt",
            createTopic: "Nowy Temat",
            editTopic: "Edytuj Temat",
            createSet: "Nowy Zestaw Fiszek",
            editSet: "Edytuj Zestaw Fiszek"
        };
        title.innerText = titles[mode] || "Tworzenie";
    }
}

function showCreationModal() {
    let modal = document.getElementById('creation-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'creation-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';

    modal.innerHTML = `
        <div class="modal-content" style="border-radius: 30px; padding: 40px; text-align: center;">
            <h2 style="color: #db2777; font-weight: 800; margin-bottom: 5px;">Co chcesz stworzyć?</h2>
            <p style="color: #64748b; margin-bottom: 25px; font-weight: 500;">Wybierz format nauki:</p>
            
            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px;">
                <div class="creation-card" onclick="openCreateSetModal();" style="cursor: pointer;">
                    <div class="creation-icon-wrapper" style="background: #fdf2f8; padding: 20px; border-radius: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/3593/3593512.png" alt="Fiszki" style="width: 60px;">
                    </div>
                    <strong style="color: #475569; font-size: 16px; display: block; margin-top: 10px;">Zestaw Fiszek</strong>
                </div>

                <div class="creation-card" onclick="openCreateQuizModal();" style="cursor: pointer;">
                    <div class="creation-icon-wrapper" style="background: #f5f3ff; padding: 20px; border-radius: 20px;">
                        <img src="https://cdn-icons-png.flaticon.com/512/4344/4344855.png" alt="Quiz" style="width: 60px;">
                    </div>
                    <strong style="color: #475569; font-size: 16px; display: block; margin-top: 10px;">Nowy Quiz</strong>
                </div>
            </div>

            <button onclick="closeModal()" style="
                all: unset !important;
                background-color: #f1f5f9 !important;
                color: #64748b !important;
                padding: 12px 40px !important;
                border-radius: 16px !important;
                font-weight: 700 !important;
                font-size: 14px !important;
                cursor: pointer !important;
                text-transform: uppercase !important;
                letter-spacing: 1px !important;
                display: inline-block !important;
                border: none !important;
                font-family: sans-serif !important;
            ">Anuluj</button>
        </div>
    `;
}

// Funkcja pomocnicza do zamykania
function closeModal() {
    // Ukrywamy główny modal tworzenia (custom-modal)
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none'; // Na wszelki wypadek, jeśli nie używasz tylko klas
    }
    
    // Jeśli używasz też modalu material-type-modal, jego też zamknij
    const typeModal = document.getElementById('material-type-modal');
    if (typeModal) {
        typeModal.classList.add('hidden');
        typeModal.style.display = 'none';
    }

    // Modal wyboru typu materiału (tworzony dynamicznie)
    const creationModal = document.getElementById('creation-modal');
    if (creationModal) {
        creationModal.style.display = 'none';
    }
}

// wygląd
function renderMaterials() {
    const grid = document.getElementById('sets-list'); 
    if (!grid) return; 
    if (typeof appData === 'undefined' || !appData || !appData.subjects) return;

    const sub = appData.subjects.find(s => s.id === currentSubjectId);
    const t = sub ? sub.topics.find(top => top.id === currentTopicId) : null;

    grid.innerHTML = '';
    if (!t) return;

    const currentThemeColor = t.color || '#ec4899';

    const createCard = (item, type) => {
        const div = document.createElement('div');
        div.className = 'card card-overlapping';
        
        const icon = item.icon || (type === 'set' ? '📇' : '📝');
        const count = type === 'set' ? (item.cards ? item.cards.length : 0) : (item.questions ? item.questions.length : 0);
        const typeLabel = type === 'set' ? 'FISZEK' : 'PYTAŃ';
        
        div.innerHTML = `
            <div class="mat-card-top" style="background-color: ${currentThemeColor} !important;">
                <div style="display: flex; align-items: center; gap: 12px; pointer-events: none;">
                    <span style="font-size: 38px; line-height: 1;">${icon}</span>
                    <strong style="color: white !important; font-size: 22px !important; text-transform: uppercase !important; font-weight: 800 !important; letter-spacing: 1px !important; white-space: nowrap;">
                        ${escapeHtml(item.name)}
                    </strong>
                    <span style="font-size: 38px; line-height: 1;">${icon}</span>
                </div>
                <div class="card-actions-internal">
                    <button class="action-btn-white" onclick="event.stopPropagation(); deleteItem('${type}', ${item.id})">✕</button>
                </div>
            </div>
            <div class="mat-card-bottom" style="background: white !important; border-radius: 0 0 28px 28px;">
                <span style="font-size: 42px; font-weight: 900; color: ${currentThemeColor}; line-height: 1;">${count}</span>
                <span style="font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px;">
                    ${typeLabel}
                </span>
            </div>
        `;
        
        div.onclick = () => {
            if (type === 'set') {
                openFlashcardPlayer(item.id);
            } else {
                startQuiz(item.id);
            }
        };
        
        grid.appendChild(div);
    };

    if (t.flashcardSets) {
        t.flashcardSets.forEach(set => createCard(set, 'set'));
    }
    
    if (t.materials) {
        t.materials.forEach(q => { 
            if (q.type === 'quiz') createCard(q, 'quiz'); 
        });
    }
}

function selectEmoji(el, emoji) {

    const emojiPicker = document.getElementById('modal-emoji-picker');
    if (emojiPicker) {
        emojiPicker.querySelectorAll('span').forEach(span => {
            span.classList.remove('active');
        });
    }

    el.classList.add('active');
    const iconInput = document.getElementById('modal-input-icon');
    if (iconInput) {
        iconInput.value = emoji;
    }
    
    if (typeof playSound === 'function') playSound('click');
}
function selectColor(el, color) {
    const dots = document.querySelectorAll('.color-dot');
    if (dots) {
        dots.forEach(d => {
            d.classList.remove('active');
        });
    }

    if (el) {
        el.classList.add('active');
    }

    const colorInput = document.getElementById('modal-input-color');
    if (colorInput) {
        colorInput.value = color;
    }
}
function selectQuizEmoji(el, emoji) {
    const options = document.querySelectorAll('#quiz-emoji-picker .emoji-opt');
    if (options) {
        options.forEach(opt => {
            opt.classList.remove('active');
        });
    }
    
    if (el) {
        el.classList.add('active');
    }
    
    const iconInput = document.getElementById('quiz-icon-input');
    if (iconInput) {
        iconInput.value = emoji;
    }
}
function selectQuizColor(el, color) {
    const dots = document.querySelectorAll('#quiz-color-picker .color-dot');
    if (dots) {
        dots.forEach(d => {
            d.classList.remove('active');
        });
    }
    
    if (el) {
        el.classList.add('active');
    }
    
    const colorInput = document.getElementById('quiz-color-input');
    if (colorInput) {
        colorInput.value = color;
    }

    if (typeof playSound === 'function') {
        playSound('click');
    }
}

// pisanie w notesie
function formatNote(cmd, val = null) {
    document.execCommand(cmd, false, val);
    saveCurrentPage();
}

// wybranie quiz/fiszki
function openMaterialTypeModal() {
    const modal = document.getElementById('material-type-modal');
    if (!modal) return;

    // Resetujemy stan wyświetlania i usuwamy ewentualne blokady
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.zIndex = '9999'; // Upewniamy się, że jest na samym wierzchu
}
function closeMaterialTypeModal() {
    const modal = document.getElementById('material-type-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}
function confirmMaterialType(type) {
    closeMaterialTypeModal();

    if (type === 'flashcard') {
        openModal('createSet'); 
    } else if (type === 'quiz') {
        if (typeof openQuizCreator === 'function') openQuizCreator();
    }
}

//=================== FISZKI ========================
function toggleFlashcardFullscreen(enable) {
    const body = document.body;
    
    if (enable) {
        body.classList.add('flashcards-fs-mode');
    } else {
        body.classList.remove('flashcards-fs-mode');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('flashcards-fs-mode')) {
        toggleFlashcardFullscreen(false);
    }
});

// sprawdzenie aktualnych fiszek
function getAllDueCards() {
    let due = [];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const todayTimestamp = todayDate.getTime();

    if (!appData || !Array.isArray(appData.subjects)) return due;

    appData.subjects.forEach(sub => {
        (sub.topics || []).forEach(top => {
            (top.flashcardSets || []).forEach(set => {
                (set.cards || []).forEach(card => {
                    const reviewDate = card.nextReview ? new Date(card.nextReview) : new Date();
                    reviewDate.setHours(0, 0, 0, 0);

                    if (reviewDate.getTime() <= todayTimestamp) {
                        due.push({ 
                            ...card, 
                            _refSetId: set.id, 
                            _refTopicId: top.id, 
                            _refSubId: sub.id 
                        });
                    }
                });
            });
        });
    });
    return due;
}

// inteligenta powótrka
function startDailyReview() {
    if (!appData) return;
    
    const dueCards = typeof getAllDueCards === 'function' ? getAllDueCards() : [];
    appData.reviewQueue = dueCards;

    if (appData.reviewQueue.length === 0) {
        if (typeof showToast === 'function') showToast("Wszystko powtórzone! 🎉", "success");
        return;
    }

    isReviewMode = true;
    currentCardIndex = 0;

    const player = document.getElementById('view-flashcard-player');
    const setName = document.getElementById('current-set-name');

    if (!player || !setName) {
        isReviewMode = false;
        return;
    }

    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    player.classList.remove('hidden');
    player.classList.add('active');
    
    setName.innerText = "🧠 Dzienna Powtórka";
    document.body.classList.add('review-active');

    if (typeof updateCardDisplay === 'function') {
        updateCardDisplay();
    }
}
function rateCard(difficulty) {
    if (!appData || !Array.isArray(appData.reviewQueue)) return;
    const reviewCard = appData.reviewQueue[currentCardIndex];
    if (!reviewCard) return;

    let daysToAdd = 1;
    if (difficulty === 'medium') daysToAdd = 3;
    if (difficulty === 'easy') daysToAdd = 7;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);

    const sub = appData.subjects.find(s => s.id === reviewCard._refSubId);
    const top = sub && sub.topics ? sub.topics.find(t => t.id === reviewCard._refTopicId) : null;
    const set = top && top.flashcardSets ? top.flashcardSets.find(s => s.id === reviewCard._refSetId) : null;
    const originalCard = set && set.cards ? set.cards.find(c => c.id === reviewCard.id) : null;

    if (originalCard) {
        originalCard.nextReview = nextDate.toDateString();
    }

    if (typeof updateQuestProgress === 'function') {
        updateQuestProgress('smart_review', 1);
    }
    
    if (typeof addXp === 'function') {
        addXp(5);
    }
    
    if (typeof playSound === 'function') {
        playSound('success');
    }

    currentCardIndex++;

    if (currentCardIndex >= appData.reviewQueue.length) {
        if (typeof finishDailyReview === 'function') {
            finishDailyReview();
        }
    } else {
        if (typeof updateCardDisplay === 'function') {
            updateCardDisplay();
        }
    }

    if (typeof saveData === 'function') {
        saveData();
    }
}
function finishDailyReview() {
    isReviewMode = false;
    document.body.classList.remove('review-active');

    const player = document.getElementById('view-flashcard-player');
    if (player) {
        player.classList.add('hidden');
    }

    if (typeof showToast === 'function') {
        showToast("Sesja zakończona! Jesteś super! 🧠", "levelUp");
    }

    if (typeof triggerConfetti === 'function') {
        triggerConfetti();
    }

    if (typeof switchTab === 'function') {
        switchTab('quests');
    }
}

// dodawanie fiszek
async function addCardToSetInline() {
    const qInput = document.getElementById('new-card-q');
    const aInput = document.getElementById('new-card-a');
    const imgQ = document.getElementById('preview-q-img');
    const imgA = document.getElementById('preview-a-img');
    
    if (!qInput || !aInput || !appData || !appData.subjects) return;

    const sub = appData.subjects.find(s => s.id == currentSubjectId);
    const t = sub && sub.topics ? sub.topics.find(top => top.id == currentTopicId) : null;
    const set = t && t.flashcardSets ? t.flashcardSets.find(s => s.id == currentSetId) : null;

    if (!set) {
        if (typeof showToast === 'function') showToast("Nie znaleziono zestawu fiszek!", "error");
        return;
    }
    if (!set.cards) set.cards = [];

    const hasImgQ = !!(imgQ && imgQ.src && imgQ.src.startsWith('data:image'));
    const hasImgA = !!(imgA && imgA.src && imgA.src.startsWith('data:image'));

    if (!qInput.value.trim() && !aInput.value.trim() && !hasImgQ && !hasImgA) {
        if (typeof showToast === 'function') showToast("Uzupełnij pytanie lub odpowiedź!", "error");
        return;
    }

    const resize = (typeof resizeImage === 'function') ? resizeImage : async (src) => src;
    const finalImgQ = hasImgQ ? await resize(imgQ.src) : null;
    const finalImgA = hasImgA ? await resize(imgA.src) : null;

    set.cards.push({
        id: Date.now(),
        q: qInput.value,
        a: aInput.value,
        imgQ: finalImgQ,
        imgA: finalImgA,
        nextReview: new Date().toDateString()
    });

    qInput.value = '';
    aInput.value = '';
    
    clearPastedImg('q');
    clearPastedImg('a');
    
    saveData();
    updateCardDisplay();
    showToast("Fiszka dodana!", "success");
}

function handleImageUpload(file, side = 'q') {
    if (!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
        if (typeof showToast === 'function') {
            showToast("Możesz wgrać tylko pliki graficzne!", "error");
        }
        return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
        if (typeof showToast === 'function') {
            showToast("Błąd podczas wczytywania pliku.", "error");
        }
    };

    reader.onload = function(e) {
        const previewImg = document.getElementById('preview-' + side + '-img');
        const previewCont = document.getElementById('preview-' + side + '-cont');

        if (previewImg) previewImg.src = e.target.result;
        if (previewCont) previewCont.classList.remove('hidden');
    };

    reader.readAsDataURL(file);
}

function clearPastedImg(side = 'q') {
    const previewImg = document.getElementById('preview-' + side + '-img');
    const previewCont = document.getElementById('preview-' + side + '-cont');
    const fileInput = document.getElementById('new-card-img-' + side);

    if (previewImg) {
        previewImg.src = "";
    }
    
    if (previewCont) {
        previewCont.classList.add('hidden');
    }
    
    if (fileInput) {
        fileInput.value = "";
    }
}

// inne
function renderFlashcardSets() {
    if (!appData || !appData.subjects) return;

    const sub = appData.subjects.find(s => s.id === currentSubjectId);
    if (!sub || !sub.topics) return;

    const t = sub.topics.find(top => top.id === currentTopicId);
    if (!t) return;

    const grid = document.getElementById('sets-list');
    if (!grid) return;

    grid.innerHTML = '';

    const sets = t.flashcardSets || [];

    sets.forEach(set => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.borderTopColor = set.color || '#ec4899';
        
        const cardCount = set.cards ? set.cards.length : 0;

        div.innerHTML = `
            <div class="card-actions">
                <button class="action-btn" onclick="event.stopPropagation(); openModal('editSet', ${set.id})">✎</button>
                <button class="action-btn" onclick="event.stopPropagation(); deleteItem('set', ${set.id})">✕</button>
            </div>
            <div style="font-size:40px;">${set.icon || '🎓'}</div>
            <strong>${escapeHtml(set.name)}</strong>
            <br>
            <span style="font-size:12px; color:#aaa">${cardCount} fiszek</span>
        `;
        
        div.onclick = () => {
            if (typeof openFlashcardPlayer === 'function') {
                openFlashcardPlayer(set.id);
            }
        };
        
        grid.appendChild(div);
    });
}

// Otwieranie i zamykanie fiszek 
function openFlashcardPlayer(setId) {
    const numericSetId = Number(setId);
    currentSetId = numericSetId;
    currentCardIndex = 0;

    if (!appData || !appData.subjects) return;

    const sub = appData.subjects.find(s => s.id == currentSubjectId);
    const t = sub ? sub.topics.find(top => top.id == currentTopicId) : null;
    
    if (!t || !t.flashcardSets) {
        if (typeof showToast === 'function') {
            showToast("Błąd struktury danych!", "error");
        }
        return;
    }

    const set = t.flashcardSets.find(s => s.id == numericSetId);

    if (!set) {
        if (typeof showToast === 'function') {
            showToast("Nie znaleziono zestawu fiszek!", "error");
        }
        return;
    }

    if (set.color && typeof setDynamicTheme === 'function') {
        setDynamicTheme(set.color);
    }

    const sections = document.querySelectorAll('.view-section');
    if (sections) {
        sections.forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });
    }

    const player = document.getElementById('view-flashcard-player');
    if (player) {
        player.classList.remove('hidden');
        player.classList.add('active');
    }

    const setNameDisplay = document.getElementById('current-set-name');
    if (setNameDisplay) {
        setNameDisplay.innerText = set.name;
    }
    
    document.body.classList.remove('review-active');
    
    if (typeof updateCardDisplay === 'function') {
        updateCardDisplay();
    }
}
function closeFlashcardPlayer() {
    const player = document.getElementById('view-flashcard-player');
    const workspace = document.getElementById('view-workspace');
    const viewSubs = document.getElementById('view-subjects');
    const viewTops = document.getElementById('view-topics');

    if (typeof isReviewMode !== 'undefined' && isReviewMode) {
        isReviewMode = false;
        document.body.classList.remove('review-active');
        if (player) player.classList.add('hidden');
        if (typeof switchTab === 'function') switchTab('quests');
        return;
    }

    if (player) {
        player.classList.add('hidden');
        player.classList.remove('active');
    }

    if (typeof switchTab === 'function') {
        switchTab('library');
    }

    if (viewSubs) viewSubs.classList.add('hidden');
    if (viewTops) viewTops.classList.add('hidden');

    if (workspace) {
        workspace.classList.remove('hidden');
        workspace.classList.add('active');
    }

    if (typeof switchWorkTab === 'function') {
        switchWorkTab('materials');
    }

    const sub = appData.subjects.find(s => s.id === currentSubjectId);
    const topic = sub ? sub.topics.find(t => t.id === currentTopicId) : null;

    if (topic && typeof setDynamicTheme === 'function') {
        setDynamicTheme(topic.color);
    }

    if (typeof renderMaterials === 'function') {
        renderMaterials();
    }
}

// interakcja fiszek
function updateCardDisplay() {
    if (!appData) return;

    let card, total, setCards;

    if (typeof isReviewMode !== 'undefined' && isReviewMode) {
        setCards = Array.isArray(appData.reviewQueue) ? appData.reviewQueue : [];
        card = setCards[currentCardIndex];
        total = setCards.length;
    } else {
        if (!appData.subjects) return;
        const sub = appData.subjects.find(s => s.id == currentSubjectId);
        const t = sub ? sub.topics.find(top => top.id == currentTopicId) : null;
        const set = t ? (t.flashcardSets ? t.flashcardSets.find(s => s.id == currentSetId) : null) : null;
        
        if (!set) return;
        setCards = set.cards || [];
        card = setCards[currentCardIndex];
        total = setCards.length;
    }

    const cardInner = document.getElementById('active-card');
    if (cardInner && cardInner.parentElement) {
        cardInner.parentElement.classList.remove('flipped');
    }

    const frontCont = document.getElementById('card-front-content');
    const backCont = document.getElementById('card-back-content');
    const counter = document.getElementById('card-counter');

    if (!card || total === 0) {
        if (frontCont) frontCont.innerHTML = "<h3>Brak fiszek w tym zestawie</h3><p>Dodaj pierwszą poniżej!</p>";
        if (backCont) backCont.innerHTML = "<h3>Odpowiedź pojawi się tutaj</h3>";
        if (counter) counter.innerText = "0/0";
        return;
    }

    let frontHtml = card.imgQ ? `<img src="${escapeHtml(card.imgQ)}" class="flashcard-img">` : "";
    frontHtml += `<h1>${escapeHtml(card.q)}</h1>`;
    if (frontCont) frontCont.innerHTML = frontHtml;

    let backHtml = card.imgA ? `<img src="${escapeHtml(card.imgA)}" class="flashcard-img">` : "";
    backHtml += `<h1>${escapeHtml(card.a)}</h1>`;
    
    if (typeof isReviewMode !== 'undefined' && isReviewMode) {
        backHtml += `
            <div class="rating-buttons-container" style="display:flex;">
                <button class="rating-btn btn-hard" onclick="event.stopPropagation(); rateCard('hard')">Trudne</button>
                <button class="rating-btn btn-medium" onclick="event.stopPropagation(); rateCard('medium')">Średnie</button>
                <button class="rating-btn btn-easy" onclick="event.stopPropagation(); rateCard('easy')">Łatwe</button>
            </div>`;
    }
    
    if (backCont) backCont.innerHTML = backHtml;
    if (counter) counter.innerText = `${currentCardIndex + 1}/${total}`;
}

function flipCard() {
    const card = document.querySelector('.flip-card');
    if (card) {
        card.classList.toggle('flipped');
        if (typeof playSound === 'function') {
            playSound('cardFlip');
        }
    }
}

function nextCard() {
    if (typeof isReviewMode !== 'undefined' && isReviewMode) return;
    if (!appData || !appData.subjects) return;

    const sub = appData.subjects.find(s => s.id == currentSubjectId);
    const t = sub ? sub.topics.find(top => top.id == currentTopicId) : null;
    const set = t && t.flashcardSets ? t.flashcardSets.find(s => s.id == currentSetId) : null;

    if (set && set.cards && set.cards.length > 0) {
        currentCardIndex = (currentCardIndex + 1) % set.cards.length;
        if (typeof updateCardDisplay === 'function') {
            updateCardDisplay();
        }
    }
}

function prevCard() {
    if (typeof isReviewMode !== 'undefined' && isReviewMode) return;
    if (!appData || !appData.subjects) return;

    const sub = appData.subjects.find(s => s.id == currentSubjectId);
    const t = sub ? sub.topics.find(top => top.id == currentTopicId) : null;
    const set = t && t.flashcardSets ? t.flashcardSets.find(s => s.id == currentSetId) : null;

    if (set && set.cards && set.cards.length > 0) {
        currentCardIndex = (currentCardIndex - 1 + set.cards.length) % set.cards.length;
        if (typeof updateCardDisplay === 'function') {
            updateCardDisplay();
        }
    }
}

// =============================== QUIZ =======================
let creatorQuestions = [];
let currentQuiz = null;
let currentQuizIdx = 0;
let quizScore = 0;
let quizResults = [];

// kreator
function openQuizCreator() {
    creatorQuestions = [];
    
    const modal = document.getElementById('quiz-creator-modal');
    if (!modal) return;

    // 1. Pokaż modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // 2. Dane do wyboru
    const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    const emojis = ['🐼', '🧠', '🧪', '🎀',  '📚', '🧬', '🌍', '🖌', '🍓', '❗️'];

    // 3. Znajdź kontenery
    const colorPicker = document.getElementById('quiz-color-picker');
    const emojiPicker = document.getElementById('quiz-emoji-picker');

    // 4. Generuj zawartość TYLKO jeśli kontenery istnieją
    if (colorPicker) {
        colorPicker.innerHTML = colors.map(c => 
            `<div class="color-dot" style="background:${c}; width:30px; height:30px; border-radius:50%; cursor:pointer; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.2);" 
            onclick="selectQuizColor(this, '${c}')"></div>`
        ).join('');
    }

    if (emojiPicker) {
        emojiPicker.innerHTML = emojis.map(e => 
            `<div class="emoji-opt" style="font-size:25px; cursor:pointer; padding:5px;" 
            onclick="selectQuizEmoji(this, '${e}')">${e}</div>`
        ).join('');
    }

    // 5. Dodaj pierwsze pytanie
    addQuestionToCreator('closed'); 
}
function openCreateSetModal() {
    const creation = document.getElementById('creation-modal');
    if (creation) creation.style.display = 'none';
    openModal('createSet');
}
function openCreateQuizModal() {
    const creation = document.getElementById('creation-modal');
    if (creation) creation.style.display = 'none';
    openQuizCreator();
}
function closeQuizCreator() {
    const modal = document.getElementById('quiz-creator-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    
    creatorQuestions = [];
    const list = document.getElementById('quiz-questions-list-creator');
    const nameInput = document.getElementById('quiz-name-input');
    if (list) list.innerHTML = '';
    if (nameInput) nameInput.value = '';
}
function renderCreatorQuestions() {
    const list = document.getElementById('quiz-questions-list-creator');
    if (!list) return;
    list.innerHTML = '';
    
    creatorQuestions.forEach((q, idx) => {
        const div = document.createElement('div');
        div.className = 'quiz-creator-item';
        
        let content = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <span style="background:${q.type === 'closed' ? '#ec4899' : '#3b82f6'}; color:white; padding: 6px 15px; border-radius: 50px; font-weight:800; font-size:13px;">
                    ${q.type === 'closed' ? 'ZAMKNIĘTE' : 'OTWARTE'}
                </span>
                <button onclick="removeCreatorQ(${idx})" style="color: #ef4444; border:none; background:none; font-weight:bold; cursor:pointer;">Usuń pytanie</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display:block; font-size: 12px; font-weight: 800; color: #64748b; margin-bottom: 8px;">TREŚĆ PYTANIA</label>
                <input type="text" class="quiz-input-styled" style="background:white;" placeholder="Wpisz treść pytania" 
                       oninput="updateCreatorQ(${idx}, 'question', this.value)" value="${escapeHtml(q.question)}">
            </div>`;

        if (q.type === 'closed') {
            content += `
                <label style="display:block; font-size: 12px; font-weight: 800; color: #64748b; margin-bottom: 5px;">ODPOWIEDZI (Zaznacz kropkę obok poprawnej)</label>
                <div class="quiz-opt-grid">
                    ${(q.options || []).map((opt, optIdx) => `
                        <div class="opt-container">
                            <input type="radio" name="correct-${idx}" ${q.correctIdx === optIdx ? 'checked' : ''} 
                                   onchange="setCorrectAnswer(${idx}, ${optIdx})" style="width:22px; height:22px; cursor:pointer; accent-color:#ec4899;">
                            <input type="text" class="quiz-option-text" placeholder="Odpowiedź ${optIdx + 1}"
                                   oninput="updateCreatorOption(${idx}, ${optIdx}, this.value)" value="${escapeHtml(opt)}"
                                   style="border:none; background:transparent; width:100%; font-size:16px; margin-left:10px; outline:none;">
                        </div>
                    `).join('')}
                </div>`;
        } else {
            content += `
                <div class="open-question-box">
                    <label style="display:block; font-size: 12px; font-weight: 800; color: #3b82f6; margin-bottom: 8px;">POPRAWNA ODPOWIEDŹ (SŁOWO KLUCZ)</label>
                    <input type="text" class="quiz-input-styled" style="background:white; border: 2px solid #3b82f6;" 
                           placeholder="Odpowiedź" 
                           oninput="updateCreatorQ(${idx}, 'answer', this.value)" value="${escapeHtml(q.answer)}">
                </div>`;
        }

        div.innerHTML = content;
        list.appendChild(div);
    });
}
function setCorrectAnswer(qIdx, optIdx) {
    if (creatorQuestions[qIdx]) {
        creatorQuestions[qIdx].correctIdx = optIdx;
        renderCreatorQuestions();
    }
}
function updateCreatorQ(idx, field, val) {
    if (creatorQuestions && creatorQuestions[idx]) {
        creatorQuestions[idx][field] = val;
    }
}
function updateCreatorOption(qIdx, optIdx, val) {
    if (creatorQuestions && creatorQuestions[qIdx] && creatorQuestions[qIdx].options) {
        creatorQuestions[qIdx].options[optIdx] = val;
    }
}
function removeCreatorQ(idx) {
    if (creatorQuestions && idx >= 0 && idx < creatorQuestions.length) {
        creatorQuestions.splice(idx, 1);
        if (typeof renderCreatorQuestions === 'function') {
            renderCreatorQuestions();
        }
    }
}
function saveCreatedQuiz() {
    const nameInput = document.getElementById('quiz-name-input');
    const iconInput = document.getElementById('quiz-icon-input');
    const colorInput = document.getElementById('quiz-color-input');
    const modeInput = document.getElementById('quiz-setting-mode');

    const name = nameInput ? nameInput.value.trim() : "";
    const icon = iconInput ? iconInput.value : '📝';
    const color = colorInput ? colorInput.value : '#ec4899';
    const mode = modeInput ? modeInput.value : 'immediate';

    if (!name) {
        if (typeof showToast === 'function') showToast("Podaj nazwę quizu!", "error");
        return;
    }

    if (!creatorQuestions || creatorQuestions.length === 0) {
        if (typeof showToast === 'function') showToast("Dodaj przynajmniej jedno pytanie!", "error");
        return;
    }

    if (typeof getCurrentTopic !== 'function') return;
    const topic = getCurrentTopic();
    if (!topic) {
        if (typeof showToast === 'function') showToast("Błąd: Nie znaleziono tematu!", "error");
        return;
    }

    const finalQuestions = creatorQuestions.map(q => {
        const qCopy = JSON.parse(JSON.stringify(q));
        if (q.type === 'closed' && q.options) {
            qCopy.answer = q.options[q.correctIdx];
        }
        return qCopy;
    });

    const newQuiz = {
        id: Date.now(),
        type: 'quiz',
        name: name,
        icon: icon,
        color: color,
        mode: mode,
        questions: finalQuestions,
        lastRewardTime: 0
    };

    if (!topic.materials) topic.materials = [];
    topic.materials.push(newQuiz);

    creatorQuestions = [];
    
    if (nameInput) nameInput.value = '';
    if (modeInput) modeInput.value = 'immediate';
    if (iconInput) iconInput.value = '📝';
    if (colorInput) colorInput.value = '#ec4899';

    const list = document.getElementById('quiz-questions-list-creator');
    if (list) list.innerHTML = '';

    if (typeof saveData === 'function') saveData();
    if (typeof closeQuizCreator === 'function') closeQuizCreator();
    if (typeof renderMaterials === 'function') renderMaterials();
    
    if (typeof showToast === 'function') {
        showToast("Quiz stworzony! Formularz został wyczyszczony. ✨", "success");
    }
}

// Rozwiązywanie quizu
function startQuiz(quizId) {
    if (typeof appData === 'undefined' || !appData.subjects) return;

    let foundQuiz = null;
    appData.subjects.forEach(subject => {
        (subject.topics || []).forEach(topic => {
            if (topic.materials) {
                const quiz = topic.materials.find(m => m.id === quizId && m.type === 'quiz');
                if (quiz) foundQuiz = quiz;
            }
        });
    });

    if (!foundQuiz || !foundQuiz.questions || foundQuiz.questions.length === 0) {
        if (typeof showToast === 'function') {
            showToast("Nie znaleziono quizu lub brak w nim pytań!", "error");
        }
        return;
    }

    // RESET DANYCH SESJI
    currentQuiz = foundQuiz;
    currentQuizIdx = 0;
    quizScore = 0;
    quizResults = [];

    // ODBUDOWA STRUKTURY KARTY (Naprawia błąd drugiego uruchomienia)
    const questionBox = document.getElementById('quiz-question-box');
    if (questionBox) {
        questionBox.innerHTML = `
            <div class="q-badge">Pytanie <span id="q-current-idx">1</span> z <span id="q-total-count">?</span></div>
            <h2 id="quiz-question-text" class="q-text">Wczytywanie...</h2>
            <div id="quiz-options-container" class="quiz-options-grid"></div>
            <div id="quiz-open-container" class="open-input-box hidden">
                <input type="text" id="quiz-open-input" class="panda-input" placeholder="Wpisz odpowiedź...">
                <button id="btn-submit-open" onclick="submitOpenAnswer()" class="panda-btn-confirm">Zatwierdź</button>
            </div>
            <div id="quiz-controls" class="hidden" style="margin-top: 25px; width: 100%; display: flex; justify-content: center;"></div>
        `;
    }

    // PRZEŁĄCZANIE WIDOKÓW
    const sections = document.querySelectorAll('.view-section');
    if (sections) {
        sections.forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('active');
        });
    }

    const player = document.getElementById('view-quiz-player');
    if (player) {
        player.classList.remove('hidden');
        player.classList.add('active');
    }

    const nameDisplay = document.getElementById('quiz-player-name');
    if (nameDisplay) nameDisplay.innerText = currentQuiz.name || "Quiz";
    
    showQuizQuestion();
}

function showQuizQuestion() {
    if (!currentQuiz || !currentQuiz.questions[currentQuizIdx]) return;
    
    const q = currentQuiz.questions[currentQuizIdx];
    const totalQuestions = currentQuiz.questions.length;
    
    const questionText = document.getElementById('quiz-question-box');
    if (questionText) {
        const qTextEl = document.getElementById('quiz-question-text');
        if (qTextEl) qTextEl.innerText = q.question;
    }

    const currentIdxEl = document.getElementById('q-current-idx');
    const totalCountEl = document.getElementById('q-total-count');
    if (currentIdxEl) currentIdxEl.innerText = currentQuizIdx + 1;
    if (totalCountEl) totalCountEl.innerText = totalQuestions;
    
    const progressBar = document.getElementById('quiz-progress-bar');
    if (progressBar) {
        const progress = ((currentQuizIdx + 1) / totalQuestions) * 100;
        progressBar.style.width = progress + '%';
    }

    const optionsContainer = document.getElementById('quiz-options-container');
    const openContainer = document.getElementById('quiz-open-container');
    const controls = document.getElementById('quiz-controls');
    
    if (optionsContainer) {
        optionsContainer.innerHTML = ''; 
        optionsContainer.classList.add('hidden');
    }
    if (openContainer) {
        openContainer.classList.add('hidden');
    }
    if (controls) {
        controls.classList.add('hidden');
        controls.innerHTML = '';
    }

    if (q.type === 'closed') {
        if (optionsContainer) {
            optionsContainer.classList.remove('hidden');
        }
        (q.options || []).forEach(opt => {
            if (opt && opt.trim() !== "" && optionsContainer) {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = opt;
                btn.onclick = () => checkQuizAnswer(opt, btn);
                optionsContainer.appendChild(btn);
            }
        });
    } else {
        if (openContainer) openContainer.classList.remove('hidden');
        const input = document.getElementById('quiz-open-input');
        const submitBtn = document.getElementById('btn-submit-open');
        if (submitBtn) submitBtn.classList.remove('hidden');
        if (input) {
            input.value = '';
            input.disabled = false;
            input.style.backgroundColor = "";
            input.style.borderColor = "";
            
            // DODANO: Obsługa klawisza Enter
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    submitOpenAnswer();
                }
            };

            setTimeout(() => input.focus(), 100);
        }
    }
}

function renderQuizOptions(q) {
    const container = document.getElementById('quiz-options-container');
    const openCont = document.getElementById('quiz-open-container');
    if (!container || !openCont || !q) return;
    
    container.innerHTML = '';

    if (q.type === 'closed') {
        container.classList.remove('hidden');
        openCont.classList.add('hidden');

        (q.options || []).forEach(opt => {
            if (opt && opt.trim() !== "") { 
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = opt;
                btn.onclick = () => checkQuizAnswer(opt, btn);
                container.appendChild(btn);
            }
        });
    } else {
        container.classList.add('hidden');
        openCont.classList.remove('hidden');
        const input = document.getElementById('quiz-open-input');
        if (input) input.value = '';
    }
}


function formatTimeLeft(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
}
function getQuizStatusHtml(item) {
    if (item.type !== 'quiz') return '';

    const now = Date.now();
    const threeHoursInMs = 3 * 60 * 60 * 1000; // ZMIANA NA 3H
    const lastReward = item.lastRewardTime || 0;
    const diff = now - lastReward;

    if (diff >= threeHoursInMs) {
        return `<div class="reward-badge status-ready">✨ ROZWIĄŻ NA PUNKTY</div>`;
    } else {
        const timeLeft = threeHoursInMs - diff;
        // Dodajemy klasę quiz-timer i data-end, żeby JS wiedział co odliczać
        return `<div class="reward-badge status-wait quiz-timer" data-end="${lastReward + threeHoursInMs}">
            ⏳ ${formatTimeLeft(timeLeft)}
        </div>`;
    }
}
function showQuizResults() {
    const box = document.getElementById('quiz-question-box');
    if (!box || !currentQuiz || !currentQuiz.questions) return;

    const now = Date.now();
    const threeHoursInMs = 3 * 60 * 60 * 1000;
    
    let quizInDb = null;
    if (appData && appData.subjects) {
        appData.subjects.forEach(sub => {
            (sub.topics || []).forEach(top => {
                if (top.materials) {
                    const found = top.materials.find(m => m.id === currentQuiz.id);
                    if (found) quizInDb = found;
                }
            });
        });
    }

    if (!quizInDb) quizInDb = currentQuiz; 

    const lastReward = quizInDb.lastRewardTime || 0;
    const canReceiveReward = (now - lastReward) >= threeHoursInMs;

    const xpPerPoint = 20;
    const coinsPerPoint = 1;
    const totalXpWon = quizScore * xpPerPoint;
    const totalCoinsWon = quizScore * coinsPerPoint;

    let html = `
        <div style="text-align: center; width: 100%; margin-bottom: 30px;">
            <h2 style="font-size: 32px; color: #db2777; margin-bottom: 10px; font-weight: 800;">Koniec Quizu!</h2>
            <div style="font-size: 56px; font-weight: 900; color: #1e293b; margin-bottom: 10px; letter-spacing: -1px;">
                ${quizScore} / ${currentQuiz.questions.length}
            </div>
    `;

    if (canReceiveReward && quizScore > 0) {
        html += `
            <div style="background: #fff9db; padding: 15px 25px; border-radius: 20px; display: inline-block; margin-bottom: 20px; border: 2px dashed #fcc419;">
                <p style="color: #856404; font-size: 16px; font-weight: 800; margin: 0;">
                    Nagroda odebrana: <span style="color: #eab308;">+${totalXpWon} XP </span> i <span style="color: #22c55e;">+${totalCoinsWon} 💎</span>
                </p>
            </div>
        `;
        
        if (typeof addXp === 'function') addXp(totalXpWon);
        appData.coins += totalCoinsWon;
        quizInDb.lastRewardTime = now;
        
    } else if (quizScore > 0) {
        const timeLeft = threeHoursInMs - (now - lastReward);
        const h = Math.floor(timeLeft / 3600000);
        const m = Math.floor((timeLeft % 3600000) / 60000);
        
        html += `
            <div style="background: #f1f5f9; padding: 15px 25px; border-radius: 20px; display: inline-block; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; font-weight: 700; margin: 0;">
                    Kolejna nagroda za: ${h}h ${m}min
                </p>
                <small style="color: #94a3b8; display: block; margin-top: 5px;">Możesz rozwiązywać quiz dla nauki, ale bez bonusów.</small>
            </div>
        `;
    } else {
        html += `<p style="color: #ef4444; font-weight: 800; margin-bottom: 20px;">Spróbuj ponownie, aby zdobyć punkty! ❌</p>`;
    }

    html += `</div>
        <div class="quiz-results-list" style="display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 850px; margin: 0 auto; padding: 10px;">
    `;

    quizResults.forEach((res, i) => {
        const isCorrect = res.correct;
        html += `
            <div style="background: ${isCorrect ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}; padding: 20px; border-radius: 20px; text-align: left; display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 12px; color: ${isCorrect ? '#166534' : '#991b1b'};">
                    <span>PYTANIE ${i + 1}</span>
                    <span>${isCorrect ? '✅' : '❌'}</span>
                </div>
                <div style="font-size: 17px; font-weight: 700; color: #1e293b;">${escapeHtml(res.q)}</div>
                <div style="margin-top: 5px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 12px; font-size: 14px;">
                    <span style="color: #64748b;">Twoja:</span> <b style="color: ${isCorrect ? '#166534' : '#ef4444'};">${escapeHtml(res.userAns)}</b> 
                    <span style="color: #cbd5e1; margin: 0 10px;">|</span>
                    <span style="color: #64748b;">Poprawna:</span> <b style="color: #166534;">${escapeHtml(res.correctAns)}</b>
                </div>
            </div>
        `;
    });

    html += `</div>
        <div style="width: 100%; display: flex; justify-content: center; margin-top: 30px; padding-bottom: 40px;">
            <button onclick="closeQuizPlayer()" class="panda-btn-confirm" style="width: 100%; max-width: 400px; padding: 20px; font-size: 18px;">
                Wróć do nauki
            </button>
        </div>
    `;

    box.innerHTML = html;
    
    box.style.height = 'auto';
    box.style.maxHeight = 'none';
    box.style.overflow = 'visible';
    
    const playerSection = document.getElementById('view-quiz-player');
    if (playerSection) {
        playerSection.style.overflowY = 'auto';
        playerSection.style.height = 'auto';
        playerSection.style.display = 'block';
    }

    if (typeof saveData === 'function') saveData();
    if (typeof renderMaterials === 'function') renderMaterials();
    if (typeof updateUI === 'function') updateUI();
}
setInterval(() => {
    const timers = document.querySelectorAll('.quiz-timer');
    timers.forEach(timer => {
        const endTime = parseInt(timer.getAttribute('data-end'));
        const now = Date.now();
        const diff = endTime - now;

        if (diff <= 0) {
            // Jeśli czas minął, zamień timer na przycisk "na punkty"
            timer.classList.remove('status-wait', 'quiz-timer');
            timer.classList.add('status-ready');
            timer.innerHTML = "✨ ROZWIĄŻ NA PUNKTY";
        } else {
            timer.innerHTML = "⏳ " + formatTimeLeft(diff);
        }
    });
}, 1000);


//  logika sprawdzania odpowiedzi
function checkQuizAnswer(userAns, btnElement = null) {
    if (!currentQuiz || !currentQuiz.questions[currentQuizIdx]) return;
    
    const q = currentQuiz.questions[currentQuizIdx];
    const isCorrect = userAns.toString().trim().toLowerCase() === q.answer.toString().trim().toLowerCase();
    
    quizResults.push({ q: q.question, correct: isCorrect, userAns, correctAns: q.answer });
    if (isCorrect) quizScore++;

    if (currentQuiz.mode === 'immediate') {
        if (q.type === 'closed') {
            document.querySelectorAll('.option-btn').forEach(btn => {
                btn.disabled = true;
                const text = btn.innerText.trim().toLowerCase();
                const correct = q.answer.toString().trim().toLowerCase();
                
                // Kolorowanie poprawnej odpowiedzi na zielono
                if (text === correct) {
                    btn.style.backgroundColor = "#10b981"; 
                    btn.style.color = "white";
                    btn.classList.add('correct');
                }
                // Kolorowanie Twojej błędnej odpowiedzi na czerwono
                if (btn === btnElement && !isCorrect) {
                    btn.style.backgroundColor = "#ef4444";
                    btn.style.color = "white";
                    btn.classList.add('wrong');
                }
            });
        } else {
            const input = document.getElementById('quiz-open-input');
            const btnSubmit = document.getElementById('btn-submit-open');
            if (input) {
                input.disabled = true;
                // Wyraźne kolory tła dla pytań otwartych
                input.style.backgroundColor = isCorrect ? "#dcfce7" : "#fee2e2";
                input.style.borderColor = isCorrect ? "#22c55e" : "#ef4444";
            }
            if (btnSubmit) btnSubmit.classList.add('hidden');
        }

        const controls = document.getElementById('quiz-controls');
        if (controls) {
            controls.classList.remove('hidden');
            controls.style.display = "flex";
            controls.innerHTML = `<button onclick="nextQuizQuestion()" class="panda-btn-next">Dalej ➔</button>`;
        }
    } else {
        // Tryb testu - tylko zaznaczamy wybór i idziemy dalej
        if (btnElement) btnElement.style.border = "3px solid #ec4899";
        document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        setTimeout(nextQuizQuestion, 500);
    }
}

function addQuestionToCreator(type) {
    const id = Date.now() + Math.random();
    const newQ = { 
        id, 
        type, 
        question: '', 
        answer: '', 
        options: type === 'closed' ? ['', '', '', ''] : null, 
        correctIdx: 0 
    };
    creatorQuestions.push(newQ);
    renderCreatorQuestions();
}
function submitOpenAnswer() {
    const input = document.getElementById('quiz-open-input');
    if (!input || input.disabled) return;
    
    const val = input.value.trim();
    if (!val) return;
    
    checkQuizAnswer(val);
}
function nextQuizQuestion() {
    if (typeof currentQuizIdx === 'undefined' || !currentQuiz) return;
    
    currentQuizIdx++;
    if (currentQuizIdx < currentQuiz.questions.length) {
        if (typeof showQuizQuestion === 'function') showQuizQuestion();
    } else {
        showQuizResults();
    }
}
function closeQuizPlayer() {
    // 1. Ukrywamy główny widok odtwarzacza quizu
    const playerView = document.getElementById('view-quiz-player');
    if (playerView) {
        playerView.classList.add('hidden');
    }

    // 2. Przełączamy zakładkę na bibliotekę
    if (typeof switchTab === 'function') {
        switchTab('library');
    }

    // 3. Zarządzanie widocznością sekcji biblioteki
    const subjects = document.getElementById('view-subjects');
    const topics = document.getElementById('view-topics');
    const workspace = document.getElementById('view-workspace');
    const qBox = document.getElementById('quiz-question-box');

    if (subjects) subjects.classList.add('hidden');
    if (topics) topics.classList.add('hidden');
    
    if (workspace) {
        workspace.classList.remove('hidden');
        workspace.classList.add('active');
    }

    // 4. Resetujemy strukturę qBox do stanu początkowego (bez wyników i śmieci)
    if (qBox) {
        // Resetujemy style, które mogły zostać dodane przy wynikach
        qBox.style.height = '';
        qBox.style.maxHeight = '';
        qBox.style.overflow = '';
        
        qBox.innerHTML = `
            <div class="q-badge">Pytanie <span id="q-current-idx">1</span> z <span id="q-total-count">?</span></div>
            <h2 id="quiz-question-text" class="q-text">Wczytywanie...</h2>
            <div id="quiz-options-container" class="quiz-options-grid"></div>
            <div id="quiz-open-container" class="open-input-box hidden">
                <input type="text" id="quiz-open-input" class="panda-input" placeholder="Wpisz odpowiedź...">
                <button id="btn-submit-open" onclick="submitOpenAnswer()" class="panda-btn-confirm">Zatwierdź</button>
            </div>
            <div id="quiz-controls" class="hidden" style="margin-top: 25px; width: 100%; display: flex; justify-content: center;"></div>
        `;
    }

    const progressBar = document.getElementById('quiz-progress-bar');
    if (progressBar) progressBar.style.width = '0%';

    // 5. Odświeżamy materiały (żeby pokazały się timery na kartach)
    if (typeof renderMaterials === 'function') {
        renderMaterials();
    }
}

//===================== NOTATKI =================
function deleteNotePage() {
    if (typeof getCurrentTopic !== 'function') return;
    const topic = getCurrentTopic();
    
    if (!topic || !topic.noteData || !Array.isArray(topic.noteData.pages)) return;

    if (topic.noteData.pages.length <= 1) {
        if (typeof showToast === 'function') {
            showToast("Nie możesz usunąć ostatniej strony!", "error");
        }
        return;
    }

    if (typeof customConfirm !== 'function') return;
    
    customConfirm("Czy na pewno chcesz usunąć TĘ stronę? Wszystkie zapisane na niej notatki znikną.", () => {
        if (typeof currentNotePage === 'undefined') return;
        
        topic.noteData.pages.splice(currentNotePage, 1);

        if (currentNotePage >= topic.noteData.pages.length) {
            currentNotePage = Math.max(0, topic.noteData.pages.length - 1);
        }

        if (typeof renderPage === 'function') renderPage();
        if (typeof saveData === 'function') saveData();
        
        if (typeof showToast === 'function') {
            showToast("Strona została usunięta", "info");
        }
    });
}

// logika
function renderPage() {
    if (typeof getCurrentTopic !== 'function') return;
    const topic = getCurrentTopic();
    const editor = document.getElementById('note-editor');
    const paper = document.getElementById('note-paper');
    const pageInfo = document.getElementById('note-page-info');
    const themeSelect = document.getElementById('theme-select');

    if (!topic || !topic.noteData) return;
    if (!editor || !paper) return;

    if (!Array.isArray(topic.noteData.pages) || topic.noteData.pages.length === 0) {
        topic.noteData.pages = [{ content: "", style: "lined", theme: "white" }];
        currentNotePage = 0;
    }

    if (typeof currentNotePage === 'undefined' || !topic.noteData.pages[currentNotePage]) {
        currentNotePage = 0;
    }

    const pageData = topic.noteData.pages[currentNotePage];
    editor.innerHTML = pageData.content || "";
    const currentTheme = pageData.theme || 'white';
    const currentStyle = pageData.style || 'lined';
    paper.className = `paper-${currentStyle} theme-${currentTheme}`;
    if (themeSelect) themeSelect.value = currentTheme;

    if (pageInfo) {
        pageInfo.innerText = `Strona ${currentNotePage + 1}`;
    }
}
function setNoteTheme(themeName) {
    if (typeof getCurrentTopic !== 'function') return;
    const topic = getCurrentTopic();
    if (!topic || !topic.noteData || !Array.isArray(topic.noteData.pages) || !topic.noteData.pages[currentNotePage]) return;

    topic.noteData.pages[currentNotePage].theme = themeName;
    
    if (typeof renderPage === 'function') renderPage();
    if (typeof saveData === 'function') saveData();
}
function saveCurrentPage() {
    if (typeof getCurrentTopic !== 'function') return;
    const topic = getCurrentTopic();
    const editor = document.getElementById('note-editor');
    
    if (topic && topic.noteData && Array.isArray(topic.noteData.pages) && topic.noteData.pages[currentNotePage] && editor) {
        topic.noteData.pages[currentNotePage].content = editor.innerHTML;
        if (typeof saveData === 'function') saveData();
    }
}
function addNewNotePage() {
    if (typeof getCurrentTopic !== 'function') return;
    const topic = getCurrentTopic();
    if (!topic || !topic.noteData) return;
    if (!Array.isArray(topic.noteData.pages)) topic.noteData.pages = [];

    if (typeof saveCurrentPage === 'function') saveCurrentPage();
    
    topic.noteData.pages.push({ content: "", style: "lined", theme: "white" });
    currentNotePage = topic.noteData.pages.length - 1;
    
    if (typeof renderPage === 'function') renderPage();
    if (typeof saveData === 'function') saveData();
    if (typeof showToast === 'function') showToast("Nowa strona dodana! ✨", "success");
}
function changeNotePage(direction) {
    if (typeof getCurrentTopic !== 'function') return;
    const topic = getCurrentTopic();
    if (!topic || !topic.noteData) return;
    if (!Array.isArray(topic.noteData.pages)) return;

    if (typeof saveCurrentPage === 'function') saveCurrentPage();
    
    let newPage = currentNotePage + direction;

    if (newPage >= 0 && newPage < topic.noteData.pages.length) {
        currentNotePage = newPage;
        if (typeof renderPage === 'function') renderPage();
    }
}
function setPaperStyle(styleName) {
    if (typeof getCurrentTopic !== 'function') return;
    const topic = getCurrentTopic();
    if (!topic || !topic.noteData || !Array.isArray(topic.noteData.pages) || !topic.noteData.pages[currentNotePage]) return;

    topic.noteData.pages[currentNotePage].style = styleName;
    
    if (typeof renderPage === 'function') renderPage();
    if (typeof saveData === 'function') saveData();
}
function getCurrentTopic() {
    if (typeof currentSubjectId === 'undefined' || typeof currentTopicId === 'undefined') return null;
    if (typeof appData === 'undefined' || !appData.subjects) return null;
    
    const sub = appData.subjects.find(s => s.id == currentSubjectId);
    if (!sub || !sub.topics) return null;
    
    return sub.topics.find(t => t.id == currentTopicId);
}

// ================================ tworzenie tematmow i zeszytów
let editingTopicId = null;

function editSubject(id) {
    const subject = appData.subjects.find(s => s.id === id);
    if (!subject) return;

    openModal('editSubject', id);

    const nameInput = document.getElementById('modal-input-name');
    const iconInput = document.getElementById('modal-input-icon');
    const colorInput = document.getElementById('modal-input-color');

    if (nameInput) nameInput.value = subject.name || '';
    if (iconInput) iconInput.value = subject.icon || '📚';
    if (colorInput) colorInput.value = subject.color || '#ec4899';

    document.querySelectorAll('#modal-emoji-picker span').forEach(span => {
        span.classList.toggle('active', span.innerText === subject.icon);
    });

    document.querySelectorAll('#modal-color-picker .color-dot').forEach(dot => {
        const style = dot.getAttribute('style') || '';
        dot.classList.toggle('active', style.includes(subject.color));
    });
}

function renderSubjects() {
    const grid = document.getElementById('subjects-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (!appData || !appData.subjects || appData.subjects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 40px; border: 2px dashed #ec4899; border-radius: 20px;">
                <p style="font-size: 50px; margin-bottom: 10px;">📚</p>
                <p style="font-weight: 700; color: #64748b;">Nie masz jeszcze żadnych zeszytów.</p>
                <button onclick="openModal('createSubject')" class="btn-confirm" style="margin-top: 20px; cursor: pointer;">+ Stwórz pierwszy zeszyt</button>
            </div>`;
        return;
    }

    appData.subjects.forEach(sub => {
        const div = document.createElement('div');
        div.className = 'card';
        
        const subColor = sub.color || '#ec4899';
        div.style.borderTop = `10px solid ${subColor}`;
        div.style.background = `linear-gradient(to bottom, ${subColor}11, white)`;
        
        div.innerHTML = `
            <div class="card-actions">
                <button class="action-btn" onclick="event.stopPropagation(); editSubject(${sub.id})">✎</button>
                <button class="action-btn" onclick="event.stopPropagation(); deleteItem('subject', ${sub.id})">✕</button>
            </div>
            <div style="font-size:50px; margin-bottom:10px;">${sub.icon || '📚'}</div>
            <strong style="font-size: 18px; color: #475569;">${escapeHtml(sub.name)}</strong>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 5px;">${sub.topics ? sub.topics.length : 0} tematów</div>
        `;

        div.onclick = () => openSubject(sub.id);
        grid.appendChild(div);
    });
}
function editTopic(id) {
    const sub = appData && appData.subjects ? appData.subjects.find(s => s.id === currentSubjectId) : null;
    const topic = sub && sub.topics ? sub.topics.find(t => t.id === id) : null;
    
    if (!topic) return;

    openModal('editTopic', id);

    const nameInput = document.getElementById('modal-input-name');
    const iconInput = document.getElementById('modal-input-icon');
    const colorInput = document.getElementById('modal-input-color');

    if (nameInput) nameInput.value = topic.name || '';
    if (iconInput) iconInput.value = topic.icon || '📌';
    if (colorInput) colorInput.value = topic.color || '#ec4899';

    document.querySelectorAll('#modal-emoji-picker span').forEach(span => {
        span.classList.toggle('active', span.innerText === topic.icon);
    });

    document.querySelectorAll('#modal-color-picker .color-dot').forEach(dot => {
        const style = dot.getAttribute('style') || '';
        dot.classList.toggle('active', !!topic.color && style.includes(topic.color));
    });
}
function renderTopics() {
    if (!appData || !appData.subjects) return;

    const subId = Number(currentSubjectId);
    const sub = appData.subjects.find(s => s.id === subId);
    const list = document.getElementById('topics-list');
    
    if (!sub || !list) return;

    list.innerHTML = '';
    
    const topics = sub.topics || [];

    if (topics.length === 0) {
        list.innerHTML = '<div class="empty-state">Ten zeszyt jest pusty. Dodaj temat! 📌</div>';
        return;
    }

    topics.forEach(t => {
        const div = document.createElement('div');
        div.className = 'topic-item';
        div.style.borderLeftColor = t.color || '#ec4899';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-size:24px">${t.icon || '📌'}</span> 
                <span>${escapeHtml(t.name)}</span>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="action-btn" onclick="event.stopPropagation(); editTopic(${t.id})">✎</button>
                <button class="action-btn" onclick="event.stopPropagation(); deleteItem('topic', ${t.id})">✕</button>
            </div>
        `;
        div.onclick = () => {
            if (typeof openWorkspace === 'function') {
                openWorkspace(t.id);
            }
        };
        list.appendChild(div);
    });
}

// wyjście
function goBackToSubjects() {
    const viewTopics = document.getElementById('view-topics');
    const viewSubjects = document.getElementById('view-subjects');

    if (viewTopics) {
        viewTopics.classList.add('hidden');
    }

    if (viewSubjects) {
        viewSubjects.classList.remove('hidden');
    }

    if (typeof renderSubjects === 'function') {
        renderSubjects();
    }

    if (typeof setDynamicTheme === 'function') {
        setDynamicTheme(null);
    }
}
function goBackToTopics() {
    const workspaceView = document.getElementById('view-workspace');
    const topicsView = document.getElementById('view-topics');

    if (workspaceView) {
        workspaceView.classList.add('hidden');
        workspaceView.classList.remove('active');
    }
    
    if (topicsView) {
        topicsView.classList.remove('hidden');
        topicsView.classList.add('active');
    }
    
    if (typeof saveCurrentPage === 'function') {
        saveCurrentPage();
    }
    
    if (typeof renderTopics === 'function') {
        renderTopics();
    }

    if (typeof setDynamicTheme === 'function' && appData && appData.subjects) {
        const sub = appData.subjects.find(s => s.id === currentSubjectId);
        if (sub) setDynamicTheme(sub.color || '#ec4899');
    }
}

function openWorkspace(topicId) {
    currentTopicId = Number(topicId);
    if (!appData || !appData.subjects) return;
    const sub = appData.subjects.find(s => s.id === currentSubjectId);
    const topic = sub ? sub.topics.find(t => t.id === currentTopicId) : null;

    if (!topic) return;

    if (!topic.noteData) {
        topic.noteData = {};
    }
    if (!Array.isArray(topic.noteData.pages) || topic.noteData.pages.length === 0) {
        topic.noteData.pages = [{ content: "", style: "lined", theme: "white" }];
        currentNotePage = 0;
    }

    /* Zmieniamy kolor tylko dla treści tematu i graczy */
    if (typeof setDynamicTheme === 'function') setDynamicTheme(topic.color);

    const topicsView = document.getElementById('view-topics');
    const workspace = document.getElementById('view-workspace');
    if (topicsView) topicsView.classList.add('hidden');
    if (workspace) {
        workspace.classList.remove('hidden');
        workspace.classList.add('active');
    }

    const topicName = document.getElementById('current-topic-name');
    if (topicName) topicName.innerText = topic.name;

    switchWorkTab('notes');
    renderPage();
}
// KOLORY TEMAT
function setDynamicTheme(color) {
    const themedElements = [
        document.getElementById('view-workspace'),
        document.getElementById('view-flashcard-player'),
        document.getElementById('view-quiz-player'),
        document.getElementById('quiz-creator-modal'),
        document.getElementById('custom-modal'),
        document.getElementById('material-type-modal')
    ];

    themedElements.forEach(el => {
        if (el) {
            if (color) {
                el.style.setProperty('--primary', color);
            } else {
                el.style.removeProperty('--primary');
            }
        }
    });
}
