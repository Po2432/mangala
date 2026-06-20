// OYUN DURUMU VE DEĞİŞKENLER
let board = Array(14).fill(4); // 0-5 P1 kuyuları, 6 P1 Hazine, 7-12 P2 kuyuları, 13 P2 Hazine
board[6] = 0;
board[13] = 0;

let currentPlayer = 1; 
let gameMode = 'local'; // 'local', 'bot', 'online'
let botDifficulty = 'easy'; // 'easy', 'medium', 'hard'
let isGameActive = false;

// WebRTC (PeerJS) Değişkenleri
let peer = null;
let conn = null;
let isHost = false;
let myTurnInOnline = false;

// EKRAN YÖNETİMİ
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showBotMenu() { showScreen('bot-menu-screen'); }
function showOnlineMenu() { showScreen('online-menu-screen'); }
function goHome() { 
    isGameActive = false;
    if(conn) { conn.close(); conn = null; }
    if(peer) { peer.destroy(); peer = null; }
    showScreen('menu-screen'); 
}

// OYUNU BAŞLATMA
function startGame(mode, difficulty = 'easy') {
    gameMode = mode;
    botDifficulty = difficulty;
    isGameActive = true;
    currentPlayer = 1;
    board = Array(14).fill(4);
    board[6] = 0; board[13] = 0;
    
    document.getElementById('p1-name').innerText = (mode === 'online' && !isHost) ? 'Rakip' : 'Oyuncu 1';
    let p2Name = 'Oyuncu 2';
    if(mode === 'bot') p2Name = `Bot (${difficulty.toUpperCase()})`;
    if(mode === 'online') p2Name = isHost ? 'Rakip' : 'Sen';
    document.getElementById('p2-name').innerText = p2Name;

    if(mode === 'online') {
        myTurnInOnline = isHost; // Host olan P1'dir ve başlar
    }

    renderBoard();
    updateStatus();
    showScreen('game-screen');
}

// TAHTAYI ÇİZME
function renderBoard() {
    const rowP1 = document.getElementById('row-p1');
    const rowP2 = document.getElementById('row-p2');
    rowP1.innerHTML = ''; rowP2.innerHTML = '';

    // P2 Kuyuları (Ters sıralama 12'den 7'ye)
    for (let i = 12; i >= 7; i--) {
        rowP2.appendChild(createPit(i, 2));
    }
    // P1 Kuyuları (0'dan 5'e)
    for (let i = 0; i <= 5; i++) {
        rowP1.appendChild(createPit(i, 1));
    }

    document.getElementById('store-p1').innerText = board[6];
    document.getElementById('store-p2').innerText = board[13];
}

function createPit(index, owner) {
    const div = document.createElement('div');
    div.classList.add('pit');
    div.innerText = board[index];
    div.id = `pit-${index}`;
    
    if (isGameActive && board[index] > 0) {
        if (gameMode === 'local' && currentPlayer === owner) {
            div.classList.add('playable');
            div.onclick = () => handleMove(index);
        } else if (gameMode === 'bot' && currentPlayer === 1 && owner === 1) {
            div.classList.add('playable');
            div.onclick = () => handleMove(index);
        } else if (gameMode === 'online' && myTurnInOnline && owner === (isHost ? 1 : 2)) {
            div.classList.add('playable');
            div.onclick = () => { handleMove(index); sendMove(index); };
        }
    } else {
        div.classList.add('disabled');
    }
    return div;
}

// OYUN MANTIĞI VE KURALLAR
function getNextIndex(curr, player) {
    if (player === 1) {
        if (curr === 5) return 6; // P1 Hazine
        if (curr === 6) return 7; // P2'ye geç
        if (curr === 12) return 0; // P2'den çık, P1'e geç
    } else {
        if (curr === 5) return 7; // P1'den çık, P2'ye geç
        if (curr === 12) return 13; // P2 Hazine
        if (curr === 13) return 0; // P1'e dön
    }
    return curr + 1;
}

function executeMove(tempBoard, player, pitIndex) {
    let stones = tempBoard[pitIndex];
    if (stones === 0) return { board: tempBoard, extraTurn: false };

    tempBoard[pitIndex] = 0;
    let curr = pitIndex;

    if (stones === 1) {
        curr = getNextIndex(curr, player);
        tempBoard[curr]++;
    } else {
        tempBoard[pitIndex] = 1;
        stones--;
        while (stones > 0) {
            curr = getNextIndex(curr, player);
            tempBoard[curr]++;
            stones--;
        }
    }

    let extraTurn = false;

    // Kural 1: Son taş hazineye düşerse ekstra hamle
    if ((player === 1 && curr === 6) || (player === 2 && curr === 13)) {
        extraTurn = true;
    } 
    // Kural 2: Rakibin kuyusunu çift yapma
    else if ((player === 1 && curr >= 7 && curr <= 12) || (player === 2 && curr >= 0 && curr <= 5)) {
        if (tempBoard[curr] % 2 === 0) {
            if (player === 1) tempBoard[6] += tempBoard[curr];
            else tempBoard[13] += tempBoard[curr];
            tempBoard[curr] = 0;
        }
    } 
    // Kural 3: Kendi boş kuyuna düşme
    else if ((player === 1 && curr >= 0 && curr <= 5) || (player === 2 && curr >= 7 && curr <= 12)) {
        if (tempBoard[curr] === 1) { 
            let opp = 12 - curr; 
            if (tempBoard[opp] > 0) { 
                let total = tempBoard[curr] + tempBoard[opp];
                if (player === 1) tempBoard[6] += total;
                else tempBoard[13] += total;
                tempBoard[curr] = 0;
                tempBoard[opp] = 0;
            }
        }
    }

    // Oyun Sonu Kontrolü
    let p1Sum = 0, p2Sum = 0;
    for (let i = 0; i <= 5; i++) p1Sum += tempBoard[i];
    for (let i = 7; i <= 12; i++) p2Sum += tempBoard[i];

    if (p1Sum === 0 && p2Sum > 0) {
        tempBoard[6] += p2Sum; 
        for (let i = 7; i <= 12; i++) tempBoard[i] = 0;
    } else if (p2Sum === 0 && p1Sum > 0) {
        tempBoard[13] += p1Sum; 
        for (let i = 0; i <= 5; i++) tempBoard[i] = 0;
    }

    return { board: tempBoard, extraTurn: extraTurn };
}

function handleMove(index) {
    if (!isGameActive) return;

    let result = executeMove(board, currentPlayer, index);
    board = result.board;

    renderBoard();

    if (checkGameOver()) return;

    if (!result.extraTurn) {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
    }

    if (gameMode === 'online') {
        myTurnInOnline = (currentPlayer === (isHost ? 1 : 2));
    }

    updateStatus();

    if (gameMode === 'bot' && currentPlayer === 2 && isGameActive) {
        setTimeout(playBotMove, 800);
    }
}

function checkGameOver() {
    let p1Sum = 0; for(let i=0;i<6;i++) p1Sum += board[i];
    let p2Sum = 0; for(let i=7;i<13;i++) p2Sum += board[i];

    if (p1Sum === 0 && p2Sum === 0) {
        isGameActive = false;
        let p1Score = board[6];
        let p2Score = board[13];
        let msg = p1Score > p2Score ? "Oyuncu 1 Kazandı!" : (p2Score > p1Score ? "Oyuncu 2 Kazandı!" : "Oyun Berabere!");
        if(gameMode === 'bot' && p2Score > p1Score) msg = "Bot Kazandı!";
        if(gameMode === 'online') {
            let myScore = isHost ? p1Score : p2Score;
            let oppScore = isHost ? p2Score : p1Score;
            msg = myScore > oppScore ? "Sen Kazandın!" : (oppScore > myScore ? "Rakip Kazandı!" : "Berabere!");
        }
        document.getElementById('status-text').innerText = `Oyun Bitti - ${msg} (${p1Score} - ${p2Score})`;
        renderBoard();
        return true;
    }
    return false;
}

function updateStatus() {
    if (!isGameActive) return;
    const st = document.getElementById('status-text');
    if (gameMode === 'local') {
        st.innerText = currentPlayer === 1 ? "Oyuncu 1'in Sırası (Alt)" : "Oyuncu 2'nin Sırası (Üst)";
    } else if (gameMode === 'bot') {
        st.innerText = currentPlayer === 1 ? "Senin Sıran" : "Bot Düşünüyor...";
    } else if (gameMode === 'online') {
        st.innerText = myTurnInOnline ? "Senin Sıran" : "Rakibin Sırası Bekleniyor...";
    }
    renderBoard();
}

// YAPAY ZEKA (BOT)
function playBotMove() {
    let validMoves = [];
    for (let i = 7; i <= 12; i++) { if (board[i] > 0) validMoves.push(i); }
    if (validMoves.length === 0) return;

    let bestMove = validMoves[0];

    if (botDifficulty === 'easy') {
        bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    } 
    else if (botDifficulty === 'medium') {
        let found = false;
        for (let move of validMoves) {
            let res = executeMove([...board], 2, move);
            if (res.extraTurn || res.board[13] > board[13] + 1) { bestMove = move; found = true; break; }
        }
        if(!found) bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    } 
    else if (botDifficulty === 'hard') {
        let bestVal = -Infinity;
        for (let move of validMoves) {
            let res = executeMove([...board], 2, move);
            let val = minimax(res.board, 5, -Infinity, Infinity, !res.extraTurn, res.extraTurn ? 2 : 1);
            if (val > bestVal) { bestVal = val; bestMove = move; }
        }
    }

    handleMove(bestMove);
}

function minimax(tempBoard, depth, alpha, beta, isMaximizing, playerTurn) {
    let p1Sum = 0, p2Sum = 0;
    for(let i=0;i<6;i++) p1Sum += tempBoard[i];
    for(let i=7;i<13;i++) p2Sum += tempBoard[i];
    
    if (depth === 0 || (p1Sum === 0 && p2Sum === 0)) {
        return tempBoard[13] - tempBoard[6]; 
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 7; i <= 12; i++) {
            if (tempBoard[i] === 0) continue;
            let res = executeMove([...tempBoard], 2, i);
            let ev = minimax(res.board, depth - 1, alpha, beta, res.extraTurn, res.extraTurn ? 2 : 1);
            maxEval = Math.max(maxEval, ev);
            alpha = Math.max(alpha, ev);
            if (beta <= alpha) break;
        }
        return maxEval === -Infinity ? (tempBoard[13] - tempBoard[6]) : maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i <= 5; i++) {
            if (tempBoard[i] === 0) continue;
            let res = executeMove([...tempBoard], 1, i);
            let ev = minimax(res.board, depth - 1, alpha, beta, !res.extraTurn, res.extraTurn ? 1 : 2);
            minEval = Math.min(minEval, ev);
            beta = Math.min(beta, ev);
            if (beta <= alpha) break;
        }
        return minEval === Infinity ? (tempBoard[13] - tempBoard[6]) : minEval;
    }
}

// ÇEVRİMİÇİ MULTIPLAYER (PEERJS)
function generateRoomCode() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

function hostGame() {
    document.getElementById('online-status').innerText = "Oda oluşturuluyor...";
    let roomCode = generateRoomCode();
    let fullId = "mngltrk-" + roomCode;
    
    peer = new Peer(fullId);
    peer.on('open', (id) => {
        document.getElementById('online-status').innerText = `Oda Kodunuz: ${roomCode}\nRakip bekleniyor...`;
        isHost = true;
    });

    peer.on('connection', (connection) => {
        conn = connection;
        setupConnection();
    });
}

function joinGame() {
    let code = document.getElementById('join-id').value.trim();
    if (code.length < 5) return alert("Geçerli bir kod girin.");
    
    document.getElementById('online-status').innerText = "Bağlanılıyor...";
    peer = new Peer();
    
    peer.on('open', (id) => {
        isHost = false;
        conn = peer.connect("mngltrk-" + code);
        conn.on('open', () => {
            setupConnection();
        });
        conn.on('error', () => {
            document.getElementById('online-status').innerText = "Bağlantı hatası!";
        });
    });
}

function setupConnection() {
    document.getElementById('online-status').innerText = "Bağlandı! Oyun başlıyor...";
    
    conn.on('data', (data) => {
        if (data.type === 'MOVE') {
            handleMove(data.index);
        }
    });

    setTimeout(() => {
        startGame('online');
    }, 1000);
}

function sendMove(index) {
    if (conn && conn.open) {
        conn.send({ type: 'MOVE', index: index });
    }
}

// PWA Servis Çalışanı Kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('SW Başarıyla kaydedildi.', reg.scope);
        }).catch(err => console.log('SW Kayıt hatası:', err));
    });
}
