// nawigacja
function openGame(gameId) {
    const lobby = document.getElementById('casino-lobby');
    if (lobby) lobby.classList.add('hidden');

    const rouletteGame = document.getElementById('game-roulette');
    const blackjackGame = document.getElementById('game-blackjack');
    if (rouletteGame) rouletteGame.classList.add('hidden');
    if (blackjackGame) blackjackGame.classList.add('hidden');

    if (gameId === 'roulette') {
        const roulette = document.getElementById('game-roulette');
        if (roulette) roulette.classList.remove('hidden');

        const rMsg = document.getElementById('roulette-msg');
        if (rMsg) {
            rMsg.innerText = "Postaw zakład i zakręć kołem!";
            rMsg.style.color = "#fbbf24";
        }
        const rCenter = document.getElementById('roulette-result-number');
        if (rCenter) {
            rCenter.innerText = '?';
            rCenter.style.color = '#fff';
        }
    } else if (gameId === 'blackjack') {
        const bj = document.getElementById('game-blackjack');
        if (bj) bj.classList.remove('hidden');

        bjGameActive = false;
        bjDealerTurn = false;
        bjBet = 0;
        playerHand = [];
        dealerHand = [];

        const msg = document.getElementById('bj-message');
        if (msg) {
            msg.innerText = "Postaw zakład!";
            msg.style.color = "#fbbf24";
        }

        const playerSlot = document.getElementById('player-cards');
        const dealerSlot = document.getElementById('dealer-cards');
        if (playerSlot) playerSlot.innerHTML = '';
        if (dealerSlot) dealerSlot.innerHTML = '';

        const pScore = document.getElementById('player-score');
        const dScore = document.getElementById('dealer-score');
        if (pScore) pScore.innerText = '0';
        if (dScore) dScore.innerText = '0';

        if (typeof toggleBjControls === 'function') {
            toggleBjControls(false);
        }
    }
}
function backToLobby() {
    const roulette = document.getElementById('game-roulette');
    const blackjack = document.getElementById('game-blackjack');
    const lobby = document.getElementById('casino-lobby');

    if (roulette) roulette.classList.add('hidden');
    if (blackjack) blackjack.classList.add('hidden');
    if (lobby) lobby.classList.remove('hidden');
    
    if (typeof bjGameActive !== 'undefined' && bjGameActive) {
        bjGameActive = false;
        bjDealerTurn = false;
        bjBet = 0;
        
        if (typeof playerHand !== 'undefined') playerHand = [];
        if (typeof dealerHand !== 'undefined') dealerHand = [];
        
        const msg = document.getElementById('bj-message');
        if (msg) msg.innerText = "Postaw zakład!";

        if (typeof toggleBjControls === 'function') {
            toggleBjControls(false);
        }
    }
}

// ================== RULETKA ========================
let isSpinning = false;
let currentRotation = 0;
let numberAnimationInterval;
function spinRoulette(betType) {
    if (isSpinning) return;

    const betInput = document.getElementById('roulette-bet-amount');
    if (!betInput) return;

    const betAmount = parseInt(betInput.value);
    
    if (isNaN(betAmount) || betAmount <= 0) { 
        if (typeof showToast === 'function') showToast("Podaj poprawną stawkę!", "error");
        return; 
    }
    
    if (!appData || betAmount > (appData.coins || 0)) { 
        if (typeof showToast === 'function') showToast("Nie masz tyle diamentów!", "error");
        return; 
    }

    let chosenNumber = -1;
    if (betType === 'number') {
        const numInput = document.getElementById('roulette-bet-number');
        if (!numInput) return;
        chosenNumber = parseInt(numInput.value);
        if (isNaN(chosenNumber) || chosenNumber < 0 || chosenNumber > 36) { 
            if (typeof showToast === 'function') showToast("Wybierz liczbę od 0 do 36!", "error");
            return; 
        }
    }

    appData.coins -= betAmount;
    if (typeof saveData === 'function') saveData();
    if (typeof updateUI === 'function') updateUI(); 
    
    isSpinning = true;
    if (typeof playSound === 'function') playSound('coin');
    
    const msgEl = document.getElementById('roulette-msg');
    if (msgEl) {
        msgEl.innerText = "Koło się kręci... 🤞";
        msgEl.style.color = "#fbbf24";
    }

    const wheel = document.getElementById('roulette-wheel');
    const centerText = document.getElementById('roulette-result-number');
    
    if (typeof numberAnimationInterval !== 'undefined') {
        clearInterval(numberAnimationInterval);
    }

    if (centerText) {
        numberAnimationInterval = setInterval(() => {
            centerText.innerText = Math.floor(Math.random() * 37);
            centerText.style.color = '#ccc'; 
        }, 100);
    }

    const resultNumber = Math.floor(Math.random() * 37); 
    let resultColor;
    if (resultNumber === 0) resultColor = 'green';
    else if ([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(resultNumber)) resultColor = 'red';
    else resultColor = 'black';

    const segmentAngle = 360 / 37;
    // Środek segmentu wylosowanej liczby musi trafić pod wskazówkę (u góry koła).
    const randomOffset = (Math.random() * 4) - 2; 
    const targetAngle = 360 - ((resultNumber + 0.5) * segmentAngle);
    const extraSpins = 5 * 360; 
    const currentBase = Math.ceil(currentRotation / 360) * 360;
    currentRotation = currentBase + extraSpins + targetAngle + randomOffset;
    
    if (wheel) {
        wheel.style.transform = `rotate(${currentRotation}deg)`;
    }
    
    if (typeof playSound === 'function') playSound('click'); 

    setTimeout(() => {
        isSpinning = false;
        clearInterval(numberAnimationInterval);

        if (centerText) {
            centerText.innerText = resultNumber;
            if (resultColor === 'red') centerText.style.color = '#ef4444';
            else if (resultColor === 'green') centerText.style.color = '#22c55e';
            else centerText.style.color = '#1f2937';
        }

        let won = false;
        let winnings = 0;

        if (betType === 'red' && resultColor === 'red') { won = true; winnings = betAmount * 2; }
        else if (betType === 'black' && resultColor === 'black') { won = true; winnings = betAmount * 2; }
        else if (betType === 'green' && resultColor === 'green') { won = true; winnings = betAmount * 14; }
        else if (betType === 'number' && chosenNumber === resultNumber) { won = true; winnings = betAmount * 35; }

        if (won) {
            appData.coins += winnings;
            if (msgEl) {
                msgEl.innerHTML = `🎉 WYGRANA! <span style="color:#fbbf24; font-size:1.2em;">+${winnings} 💎</span>`;
                msgEl.style.color = "#22c55e";
            }
            if (typeof playSound === 'function') playSound('success');
            if (typeof triggerConfetti === 'function') triggerConfetti();
        } else {
            let colorName = resultColor === 'red' ? 'Czerwone' : (resultColor === 'black' ? 'Czarne' : 'Zero');
            if (msgEl) {
                msgEl.innerText = `Przegrana... Wynik: ${resultNumber} (${colorName})`;
                msgEl.style.color = "#ef4444";
            }
            if (typeof playSound === 'function') playSound('click'); 
        }

        if (typeof saveData === 'function') saveData();
        if (typeof updateUI === 'function') updateUI();
    }, 5000); 
}

// ==================== BLACKJACK ==========================
let bjDeck = [];
let playerHand = [];
let dealerHand = [];
let bjGameActive = false;
let bjBet = 0;
let bjDealerTurn = false;

const bjSuits = ['♠', '♥', '♣', '♦'];
const bjValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
    let deck = [];
    if (typeof bjSuits === 'undefined' || typeof bjValues === 'undefined') return [];
    for (let suit of bjSuits) {
        for (let value of bjValues) {
            let weight = parseInt(value);
            if (value === 'J' || value === 'Q' || value === 'K') weight = 10;
            if (value === 'A') weight = 11;
            deck.push({ value, suit, weight });
        }
    }
    return deck;
}
function shuffleDeck(deck) {
    if (!deck) return;
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}
function drawCard() {
    if (typeof bjDeck === 'undefined') return null;
    if (bjDeck.length === 0) {
        bjDeck = createDeck();
        shuffleDeck(bjDeck);
    }
    return bjDeck.pop();
}
function startBlackjackRound() {
    if (typeof bjGameActive !== 'undefined' && bjGameActive) return;

    const betInput = document.getElementById('bj-bet-amount');
    if (!betInput || !appData) return;

    const amount = parseInt(betInput.value);

    if (isNaN(amount) || amount <= 0) {
        if (typeof showToast === 'function') showToast("Podaj poprawną stawkę!", "error");
        return;
    }
    if (amount > (appData.coins || 0)) {
        if (typeof showToast === 'function') showToast("Nie masz tyle diamentów!", "error");
        return;
    }

    appData.coins -= amount;
    bjBet = amount;
    if (typeof saveData === 'function') saveData();
    
    if (typeof updateUI === 'function') updateUI();
    if (typeof playSound === 'function') playSound('coin');

    bjGameActive = true;
    bjDealerTurn = false;
    playerHand = [];
    dealerHand = [];
    
    if (bjDeck.length < 10) {
        bjDeck = createDeck();
        shuffleDeck(bjDeck);
    }

    playerHand.push(drawCard());
    dealerHand.push(drawCard());
    playerHand.push(drawCard());

    if (typeof updateBlackjackUI === 'function') updateBlackjackUI();
    if (typeof toggleBjControls === 'function') toggleBjControls(true);
    
    const msg = document.getElementById('bj-message');
    if (msg) {
        msg.innerText = "Twój ruch...";
        msg.style.color = "#fbbf24";
    }

    if (typeof calculateHand === 'function') {
        const pScore = calculateHand(playerHand);
        if (pScore === 21) standBlackjack();
    }
}
function hitBlackjack() {
    if (typeof bjGameActive === 'undefined' || !bjGameActive || bjDealerTurn) return;
    
    playerHand.push(drawCard());
    if (typeof playSound === 'function') playSound('cardFlip');
    if (typeof updateBlackjackUI === 'function') updateBlackjackUI();

    if (typeof calculateHand === 'function') {
        const score = calculateHand(playerHand);
        if (score > 21) {
            if (typeof endBlackjackRound === 'function') endBlackjackRound('bust');
        } else if (score === 21) {
            standBlackjack();
        }
    }
}
function endBlackjackRound(reason) {
    if (!bjGameActive) return;

    bjGameActive = false;
    bjDealerTurn = false;

    const pScore = calculateHand(playerHand);
    const msgEl = document.getElementById('bj-message');
    if (msgEl) {
        if (reason === 'bust') {
            msgEl.innerText = `Fura! Masz ${pScore}. Przegrywasz ${bjBet} 💎.`;
        } else {
            msgEl.innerText = 'Koniec rundy.';
        }
        msgEl.style.color = "#ef4444";
    }

    if (typeof playSound === 'function') playSound('click');
    if (typeof saveData === 'function') saveData();
    if (typeof updateUI === 'function') updateUI();
    if (typeof toggleBjControls === 'function') toggleBjControls(false);
}
function standBlackjack() {
    if (typeof bjGameActive === 'undefined' || !bjGameActive || bjDealerTurn) return;

    bjDealerTurn = true;
    if (typeof toggleBjControls === 'function') toggleBjControls(true);

    const hitBtn = document.getElementById('btn-bj-hit');
    const standBtn = document.getElementById('btn-bj-stand');
    if (hitBtn) hitBtn.classList.add('hidden');
    if (standBtn) standBtn.classList.add('hidden');

    const dealerPlay = setInterval(() => {
        if (typeof bjGameActive === 'undefined' || !bjGameActive) {
            clearInterval(dealerPlay);
            return;
        }

        let dScore = (typeof calculateHand === 'function') ? calculateHand(dealerHand) : 0;
        
        if (dScore < 17) {
            dealerHand.push(drawCard());
            if (typeof playSound === 'function') playSound('cardFlip');
            if (typeof updateBlackjackUI === 'function') updateBlackjackUI();
        } else {
            clearInterval(dealerPlay);
            if (typeof determineWinner === 'function') determineWinner();
        }
    }, 800);
}
function calculateHand(hand) {
    if (!hand || !Array.isArray(hand)) return 0;
    let score = 0;
    let aces = 0;

    for (let card of hand) {
        score += (card.weight || 0);
        if (card.value === 'A') aces++;
    }

    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
}
function determineWinner() {
    if (typeof playerHand === 'undefined' || typeof dealerHand === 'undefined') return;
    if (!bjGameActive) return;

    const pScore = calculateHand(playerHand);
    const dScore = calculateHand(dealerHand);
    let msg = "";
    let color = "#fff";
    let winAmount = 0;

    if (dScore > 21) {
        msg = "Krupier ma Furę! Wygrywasz!";
        color = "#22c55e";
        winAmount = (typeof bjBet !== 'undefined' ? bjBet * 2 : 0);
    } else if (pScore > dScore) {
        msg = `Masz ${pScore}, Krupier ${dScore}. Wygrywasz!`;
        color = "#22c55e";
        winAmount = (typeof bjBet !== 'undefined' ? bjBet * 2 : 0);
    } else if (pScore === dScore) {
        msg = "Remis! Zwrot stawki.";
        color = "#fbbf24";
        winAmount = (typeof bjBet !== 'undefined' ? bjBet : 0);
    } else {
        msg = `Masz ${pScore}, Krupier ${dScore}. Przegrywasz.`;
        color = "#ef4444";
        winAmount = 0;
    }

    const msgEl = document.getElementById('bj-message');
    if (msgEl) {
        msgEl.innerText = msg;
        msgEl.style.color = color;
    }

    if (winAmount > 0) {
        if (typeof appData !== 'undefined') appData.coins += winAmount;
        
        if (typeof playSound === 'function') {
            winAmount > (bjBet || 0) ? playSound('success') : playSound('coin');
        }
        if (winAmount > (bjBet || 0) && typeof triggerConfetti === 'function') {
            triggerConfetti();
        }
    } else {
        if (typeof playSound === 'function') playSound('click');
    }

    bjGameActive = false;
    bjDealerTurn = false;

    if (typeof saveData === 'function') saveData();
    if (typeof updateUI === 'function') updateUI();
    if (typeof toggleBjControls === 'function') toggleBjControls(false);
}
function updateBlackjackUI() {
    renderHand('player-cards', playerHand);
    renderHand('dealer-cards', dealerHand);
    
    const pScoreEl = document.getElementById('player-score');
    const dScoreEl = document.getElementById('dealer-score');
    
    if (pScoreEl) pScoreEl.innerText = calculateHand(playerHand);
    if (dScoreEl) dScoreEl.innerText = calculateHand(dealerHand);
}
function renderHand(elementId, hand) {
    const container = document.getElementById(elementId);
    if (!container || !hand) return;
    
    container.innerHTML = '';
    
    hand.forEach(card => {
        const el = document.createElement('div');
        const isRed = card.suit === '♥' || card.suit === '♦';
        el.className = `bj-card ${isRed ? 'red' : 'black'}`;
        el.innerHTML = `
            <div class="card-top-left">${card.value}<br>${card.suit}</div>
            <div class="card-center-symbol">${card.suit}</div>
            <div class="card-bottom-right">${card.value}<br>${card.suit}</div>
        `;
        container.appendChild(el);
    });
}
function toggleBjControls(isPlaying) {
    const actionsCont = document.getElementById('bj-actions');
    const dealBtn = document.getElementById('btn-bj-deal');
    const hitBtn = document.getElementById('btn-bj-hit');
    const standBtn = document.getElementById('btn-bj-stand');
    const betBox = document.getElementById('bj-bet-box');
    const betInput = document.getElementById('bj-bet-amount');

    if (isPlaying) {
        if (actionsCont) actionsCont.classList.remove('hidden');
        if (dealBtn) dealBtn.classList.add('hidden');
        if (hitBtn) hitBtn.classList.remove('hidden');
        if (standBtn) standBtn.classList.remove('hidden');
        if (betBox) betBox.classList.add('disabled'); 
        if (betInput) betInput.disabled = true;
    } else {
        if (actionsCont) actionsCont.classList.add('hidden');
        if (dealBtn) dealBtn.classList.remove('hidden');
        if (hitBtn) hitBtn.classList.add('hidden');
        if (standBtn) standBtn.classList.add('hidden');
        if (betBox) betBox.classList.remove('disabled');
        if (betInput) betInput.disabled = false;
    }
}