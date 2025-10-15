const CARD_POOL = [
    '🐶', '🐱', '🦊', '🐻', '🐼', '🐸', '🦁', '🦄',
    '🐷', '🐨', '🐰', '🐯', '🐙', '🐢', '🐞', '🦋',
    '🐝', '🐬', '🐳', '🦉', '🦓', '🐴', '🦕', '🐲'
];

const DIFFICULTIES = {
    easy: { pairs: 6, columns: 4, label: '쉬움 (4×3)' },
    normal: { pairs: 8, columns: 4, label: '보통 (4×4)' },
    hard: { pairs: 12, columns: 6, label: '어려움 (6×4)' }
};

const FLIP_DELAY = 800;
const ANIMATION_DELAY = 450;
const BEST_RECORD_KEY_PREFIX = 'memory-match-best-';

const gameGrid = document.getElementById('game-grid');
const moveCountEl = document.getElementById('move-count');
const matchCountEl = document.getElementById('match-count');
const timeElapsedEl = document.getElementById('time-elapsed');
const restartBtn = document.getElementById('restart-btn');
const messageEl = document.getElementById('game-message');
const difficultyLabelEl = document.getElementById('difficulty-label');
const bestRecordEl = document.getElementById('best-record');
const difficultyButtons = Array.from(document.querySelectorAll('.difficulty-btn'));

let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timerId = null;
let secondsElapsed = 0;
let isBoardLocked = false;
let hasGameStarted = false;
let currentDifficultyKey = 'normal';
let totalPairs = DIFFICULTIES[currentDifficultyKey].pairs;

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => {
        secondsElapsed += 1;
        timeElapsedEl.textContent = formatTime(secondsElapsed);
    }, 1000);
}

function stopTimer() {
    if (!timerId) return;
    clearInterval(timerId);
    timerId = null;
}

function resetTimer() {
    stopTimer();
    secondsElapsed = 0;
    timeElapsedEl.textContent = formatTime(0);
}

function showMessage(text) {
    messageEl.textContent = text;
    messageEl.hidden = false;
    messageEl.classList.add('visible');
}

function hideMessage() {
    messageEl.hidden = true;
    messageEl.classList.remove('visible');
    messageEl.textContent = '';
}

function createCard(symbol, index) {
    const card = document.createElement('button');
    card.className = 'card';
    card.type = 'button';
    card.setAttribute('role', 'gridcell');
    card.setAttribute('aria-label', '카드 뒤집기');
    card.setAttribute('aria-pressed', 'false');
    card.dataset.symbol = symbol;
    card.dataset.index = String(index);

    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';

    const cardBack = document.createElement('span');
    cardBack.className = 'card-face card-back';
    cardBack.textContent = '?';
    cardBack.setAttribute('aria-hidden', 'true');

    const cardFront = document.createElement('span');
    cardFront.className = 'card-face card-front';
    cardFront.textContent = symbol;
    cardFront.setAttribute('aria-hidden', 'true');

    cardInner.append(cardBack, cardFront);
    card.append(cardInner);

    card.addEventListener('click', () => handleCardFlip(card));
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleCardFlip(card);
        }
    });

    return card;
}

function renderBoard() {
    const { columns, pairs } = DIFFICULTIES[currentDifficultyKey];
    totalPairs = pairs;
    const doubledSymbols = getSymbolsForPairs(pairs);
    gameGrid.style.setProperty('--columns', String(columns));
    const rowCount = Math.ceil(doubledSymbols.length / columns);
    gameGrid.setAttribute('aria-colcount', String(columns));
    gameGrid.setAttribute('aria-rowcount', String(rowCount));
    gameGrid.innerHTML = '';
    doubledSymbols.forEach((symbol, index) => {
        const card = createCard(symbol, index);
        const rowIndex = Math.floor(index / columns) + 1;
        const colIndex = (index % columns) + 1;
        card.setAttribute('aria-rowindex', String(rowIndex));
        card.setAttribute('aria-colindex', String(colIndex));
        gameGrid.append(card);
    });
}

function updateScoreboard() {
    moveCountEl.textContent = moves;
    matchCountEl.textContent = `${matchedPairs}/${totalPairs}`;
}

function lockBoardTemporarily() {
    isBoardLocked = true;
    setTimeout(() => {
        isBoardLocked = false;
    }, FLIP_DELAY);
}

function unflipCards(cardA, cardB) {
    setTimeout(() => {
        cardA.classList.remove('flipped');
        cardB.classList.remove('flipped');
        cardA.classList.add('shaking');
        cardB.classList.add('shaking');
        cardA.setAttribute('aria-pressed', 'false');
        cardB.setAttribute('aria-pressed', 'false');

        setTimeout(() => {
            cardA.classList.remove('shaking');
            cardB.classList.remove('shaking');
        }, ANIMATION_DELAY);
    }, FLIP_DELAY);
}

function markAsMatched(cardA, cardB) {
    cardA.classList.add('matched');
    cardB.classList.add('matched');
    cardA.disabled = true;
    cardB.disabled = true;
    cardA.setAttribute('aria-pressed', 'true');
    cardB.setAttribute('aria-pressed', 'true');
    cardA.setAttribute('aria-disabled', 'true');
    cardB.setAttribute('aria-disabled', 'true');
}

function checkForWin() {
    if (matchedPairs === totalPairs) {
        stopTimer();
        const timeText = formatTime(secondsElapsed);
        const { updated, best } = updateBestRecord(secondsElapsed, moves);
        const baseMessage = `🎉 축하합니다!\n${moves}번의 시도와 ${timeText} 만에 모든 카드를 맞췄어요.`;
        const extraMessage = best
            ? updated
                ? '\n✨ 새 최고 기록을 세웠어요!'
                : `\n최고 기록: ${formatTime(best.time)} / ${best.moves}번 이동`
            : '';
        showMessage(`${baseMessage}${extraMessage}`);
        updateBestRecordDisplay();
    }
}

function handleCardFlip(card) {
    if (isBoardLocked || card.classList.contains('flipped') || card.classList.contains('matched')) {
        return;
    }

    if (!hasGameStarted) {
        hasGameStarted = true;
        startTimer();
    }

    card.classList.add('flipped');
    card.setAttribute('aria-pressed', 'true');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        lockBoardTemporarily();
        moves += 1;
        updateScoreboard();

        const [firstCard, secondCard] = flippedCards;
        const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

        if (isMatch) {
            markAsMatched(firstCard, secondCard);
            matchedPairs += 1;
            updateScoreboard();
            flippedCards = [];
            setTimeout(checkForWin, 200);
        } else {
            unflipCards(firstCard, secondCard);
            setTimeout(() => {
                flippedCards = [];
            }, FLIP_DELAY + ANIMATION_DELAY);
        }
    }
}

function startNewGame(selectedDifficultyKey = currentDifficultyKey) {
    currentDifficultyKey = selectedDifficultyKey;
    totalPairs = DIFFICULTIES[currentDifficultyKey].pairs;
    updateDifficultyUI();
    resetBoardState();
    renderBoard();
    updateScoreboard();
    updateDifficultyLabel();
    updateBestRecordDisplay();
}

restartBtn.addEventListener('click', startNewGame);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopTimer();
    } else if (hasGameStarted && matchedPairs < totalPairs) {
        startTimer();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setupDifficultyControls();
    startNewGame();
});

function getSymbolsForPairs(pairCount) {
    if (pairCount > CARD_POOL.length) {
        throw new Error('Not enough card symbols to build the requested board.');
    }
    const available = shuffle([...CARD_POOL]);
    const selection = available.slice(0, pairCount);
    const doubled = [...selection, ...selection];
    return shuffle(doubled);
}

function setupDifficultyControls() {
    difficultyButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const difficulty = button.dataset.difficulty;
            if (difficulty && DIFFICULTIES[difficulty]) {
                startNewGame(difficulty);
            }
        });
    });
}

function updateDifficultyUI() {
    difficultyButtons.forEach((button) => {
        const isActive = button.dataset.difficulty === currentDifficultyKey;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function updateDifficultyLabel() {
    const { label, pairs } = DIFFICULTIES[currentDifficultyKey];
    difficultyLabelEl.textContent = label;
    matchCountEl.textContent = `${matchedPairs}/${pairs}`;
}

function getBestRecordKey() {
    return `${BEST_RECORD_KEY_PREFIX}${currentDifficultyKey}`;
}

function readBestRecord() {
    try {
        const stored = localStorage.getItem(getBestRecordKey());
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        return null;
    }
}

function writeBestRecord(record) {
    try {
        localStorage.setItem(getBestRecordKey(), JSON.stringify(record));
    } catch (error) {
        // 저장에 실패해도 게임 진행에는 영향이 없도록 조용히 무시합니다.
    }
}

function updateBestRecord(timeSeconds, moveCount) {
    const currentBest = readBestRecord();
    if (!currentBest || timeSeconds < currentBest.time || (timeSeconds === currentBest.time && moveCount < currentBest.moves)) {
        const nextBest = { time: timeSeconds, moves: moveCount };
        writeBestRecord(nextBest);
        return { updated: true, best: nextBest };
    }
    return { updated: false, best: currentBest };
}

function updateBestRecordDisplay() {
    const best = readBestRecord();
    if (best) {
        bestRecordEl.textContent = `${formatTime(best.time)} / ${best.moves}회`;
    } else {
        bestRecordEl.textContent = '--';
    }
}

function resetBoardState() {
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    hasGameStarted = false;
    isBoardLocked = false;
    moveCountEl.textContent = moves;
    matchCountEl.textContent = `${matchedPairs}/${totalPairs}`;
    resetTimer();
    hideMessage();
}
