// --- ÇEVİRİ (i18n) ---
const dict = {
    tr: {
        title: "Mangala", subtitle: "Geleneksel Türk Strateji Oyunu",
        btn_local: "Yerel Çok Oyunculu", btn_bot: "Bilgisayara Karşı", btn_online: "Aynı Ağda Oyna (WiFi)", btn_tournament: "Turnuva Modu",
        bot_title: "Zorluk Seçin", bot_easy: "Kolay", bot_medium: "Orta", bot_hard: "Zor", btn_back: "Geri",
        online_title: "Çevrimiçi / WiFi", network_warn: "Uyarı: Sabit bir WiFi ağına bağlı olun (Mobil Hotspot önermiyoruz).",
        waiting_conn: "Bağlantı bekleniyor...", btn_host: "Oda Kur", btn_join: "Odaya Katıl",
        tourney_title: "Turnuva Modu", btn_host_tourney: "Turnuva Kur (Admin)", btn_join_tourney: "Turnuvaya Katıl",
        opt_points: "Puan Sistemi", opt_knockout: "Eleme Usulü", tourney_lobby: "Turnuva Lobisi",
        btn_menu: "Menü", win_p1: "Oyuncu 1 Kazandı!", win_p2: "Oyuncu 2 Kazandı!", draw: "Berabere!",
        win_you: "Tebrikler, Kazandın!", win_opp: "Rakip Kazandı!", win_bot: "Bot Kazandı!",
        turn_you: "Senin Sıran", turn_wait: "Sıra Bekleniyor...", turn_bot: "Bot Düşünüyor...",
        kicked: "Turnuvadan atıldınız.", chat_banned: "Sohbetten banlandınız."
    },
    en: {
        title: "Mangala", subtitle: "Traditional Strategy Game",
        btn_local: "Local Multiplayer", btn_bot: "Play vs Bot", btn_online: "Play on WiFi", btn_tournament: "Tournament Mode",
        bot_title: "Select Difficulty", bot_easy: "Easy", bot_medium: "Medium", bot_hard: "Hard", btn_back: "Back",
        online_title: "Online / WiFi", network_warn: "Warning: Ensure you are on a stable WiFi (Mobile Hotspots not recommended).",
        waiting_conn: "Waiting for connection...", btn_host: "Host Game", btn_join: "Join Game",
        tourney_title: "Tournament Mode", btn_host_tourney: "Host Tournament", btn_join_tourney: "Join Tournament",
        opt_points: "Points System", opt_knockout: "Knockout System", tourney_lobby: "Tournament Lobby",
        btn_menu: "Menu", win_p1: "Player 1 Wins!", win_p2: "Player 2 Wins!", draw: "It's a Draw!",
        win_you: "Congratulations, You Win!", win_opp: "Opponent Wins!", win_bot: "Bot Wins!",
        turn_you: "Your Turn", turn_wait: "Waiting for Turn...", turn_bot: "Bot is Thinking...",
        kicked: "You were kicked.", chat_banned: "You are banned from chat."
    }
};

let currentLang = 'tr';
function toggleLanguage() {
    currentLang = currentLang === 'tr' ? 'en' : 'tr';
    document.querySelectorAll('[data-i18n]').forEach(el => {
        let key = el.getAttribute('data-i18n');
        if(dict[currentLang][key]) el.innerText = dict[currentLang][key];
    });
}

// --- POPUP SİSTEMİ ---
let popupCallback = null;
function showPopup(title, message, btnText = "Tamam", callback = null) {
    document.getElementById('popup-title').innerText = title;
    document.getElementById('popup-message').innerText = message;
    document.getElementById('popup-btn').innerText = btnText;
    document.getElementById('popup-overlay').classList.add('active');
    popupCallback = callback;
}
function closePopup() {
    document.getElementById('popup-overlay').classList.remove('active');
    if(popupCallback) popupCallback();
}

// --- GÜVENLİK (XSS ve KÜFÜR FİLTRESİ) ---
const badWords = ["fuck", "shit", "bitch", "asshole", "cunt", "amk", "oç", "orospu", "siktir", "piç", "yarrak", "yavşak", "pezevenk", "aq", "sg"];
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}
function censorText(text) {
    let safeText = escapeHTML(text);
    let regex = new RegExp("\\b(" + badWords.join("|") + ")\\b", "gi");
    return safeText.replace(regex, "***");
}

// --- OYUN DEĞİŞKENLERİ ---
let board = Array(14).fill(4); 
board[6] = 0; board[13] = 0;
let currentPlayer = 1; 
let gameMode = 'local'; // local, bot, online, tourney
let botDifficulty = 'easy'; 
let isGameActive = false;

// --- AĞ (PeerJS) DEĞİŞKENLERİ ---
let peer = null;
let conn = null; // 1v1
let isHost = false;
let myTurnInOnline = false;

// --- EKRAN YÖNETİMİ ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}
function showBotMenu() { showScreen('bot-menu-screen'); }
function showOnlineMenu() { showScreen('online-menu-screen'); }
function showTournamentMenu() { showScreen('tournament-menu-screen'); }
function goHome() { 
    isGameActive = false;
    if(conn) { conn.close(); conn = null; }
    if(peer) { peer.destroy(); peer = null; }
    Object.values(tourneyClients).forEach(c => c.conn.close());
    tourneyClients = {};
    showScreen('menu-screen'); 
}

// --- CORE MANGALA MANTIĞI ---
function getNextIndex(curr, player) {
    if (player === 1) {
        if (curr === 5) return 6; 
        if (curr === 6) return 7; 
        if (curr === 12) return 0; 
    } else {
        if (curr === 5) return 7; 
        if (curr === 12) return 13; 
        if (curr === 13) return 0; 
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
    if ((player === 1 && curr === 6) || (player === 2 && curr === 13)) {
        extraTurn = true;
    } else if ((player === 1 && curr >= 7 && curr <= 12) || (player === 2 && curr >= 0 && curr <= 5)) {
        if (tempBoard[curr] % 2 === 0) {
            if (player === 1) tempBoard[6] += tempBoard[curr];
            else tempBoard[13] += tempBoard[curr];
            tempBoard[curr] = 0;
        }
    } else if ((player === 1 && curr >= 0 && curr <= 5) || (player === 2 && curr >= 7 && curr <= 12)) {
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

// --- OYUN ARAYÜZÜ (GÖRSEL) ---
function startGame(mode, difficulty = 'easy') {
    gameMode = mode; botDifficulty = difficulty; isGameActive = true; currentPlayer = 1;
    board = Array(14).fill(4); board[6] = 0; board[13] = 0;
    
    let p1N = dict[currentLang].turn_you.split(' ')[0]; // "Sen" vs "You"
    let p2N = "Opponent";
    if(mode === 'local') { p1N = "P1"; p2N = "P2"; }
    else if(mode === 'bot') { p1N = "You"; p2N = "Bot"; }
    else if(mode === 'online') { p1N = isHost?"You":"Opp"; p2N = isHost?"Opp":"You"; myTurnInOnline = isHost; }
    
    document.getElementById('p1-name').innerText = p1N;
    document.getElementById('p2-name').innerText = p2N;
    
    renderBoard(); updateStatus(); showScreen('game-screen');
}

function renderBoard() {
    const rowP1 = document.getElementById('row-p1'), rowP2 = document.getElementById('row-p2');
    rowP1.innerHTML = ''; rowP2.innerHTML = '';

    for (let i = 12; i >= 7; i--) rowP2.appendChild(createPit(i, 2));
    for (let i = 0; i <= 5; i++) rowP1.appendChild(createPit(i, 1));

    document.getElementById('store-p1').innerText = board[6];
    document.getElementById('store-p2').innerText = board[13];
}

function createPit(index, owner) {
    const div = document.createElement('div');
    div.classList.add('pit'); div.innerText = board[index];
    
    if (isGameActive && board[index] > 0) {
        let canPlay = false;
        if (gameMode === 'local' && currentPlayer === owner) canPlay = true;
        if (gameMode === 'bot' && currentPlayer === 1 && owner === 1) canPlay = true;
        if (gameMode === 'online' && myTurnInOnline && owner === (isHost ? 1 : 2)) canPlay = true;
        if (gameMode === 'tourney' && myTurnInOnline && owner === (amIPlayer1 ? 1 : 2)) canPlay = true;

        if(canPlay) {
            div.classList.add('playable');
            div.onclick = () => {
                if(gameMode === 'tourney') {
                    sendTourneyMove(index);
                } else if(gameMode === 'online') {
                    handleMove(index); sendMove(index);
                } else {
                    handleMove(index);
                }
            };
        }
    } else { div.classList.add('disabled'); }
    return div;
}

function handleMove(index) {
    if (!isGameActive) return;
    let result = executeMove(board, currentPlayer, index);
    board = result.board;
    renderBoard();

    if (checkGameOver()) return;
    if (!result.extraTurn) {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        if (gameMode === 'online') myTurnInOnline = (currentPlayer === (isHost ? 1 : 2));
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
        let p1Score = board[6], p2Score = board[13];
        let d = dict[currentLang];
        let msg = p1Score > p2Score ? d.win_p1 : (p2Score > p1Score ? d.win_p2 : d.draw);
        
        if(gameMode === 'bot') msg = p1Score > p2Score ? d.win_you : (p2Score > p1Score ? d.win_bot : d.draw);
        if(gameMode === 'online' || gameMode === 'tourney') {
            let amIP1 = (gameMode === 'online') ? isHost : amIPlayer1;
            let myScore = amIP1 ? p1Score : p2Score;
            let oppScore = amIP1 ? p2Score : p1Score;
            msg = myScore > oppScore ? d.win_you : (oppScore > myScore ? d.win_opp : d.draw);
        }
        
        renderBoard();
        showPopup("Oyun Bitti", `${msg}\n( ${p1Score} - ${p2Score} )`, "Tamam", () => {
            if(gameMode === 'tourney') showScreen('tourney-lobby-screen');
            else goHome();
        });
        return true;
    }
    return false;
}

function updateStatus() {
    if (!isGameActive) return;
    const st = document.getElementById('status-text');
    let d = dict[currentLang];
    if (gameMode === 'local') st.innerText = currentPlayer === 1 ? "P1 Sırası" : "P2 Sırası";
    else if (gameMode === 'bot') st.innerText = currentPlayer === 1 ? d.turn_you : d.turn_bot;
    else if (gameMode === 'online' || gameMode === 'tourney') st.innerText = myTurnInOnline ? d.turn_you : d.turn_wait;
    renderBoard();
}

// --- BOT ---
function playBotMove() {
    let validMoves = [];
    for (let i = 7; i <= 12; i++) { if (board[i] > 0) validMoves.push(i); }
    if (validMoves.length === 0) return;

    let bestMove = validMoves[0];
    if (botDifficulty === 'easy') {
        bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    } else {
        let found = false;
        for (let move of validMoves) {
            let res = executeMove([...board], 2, move);
            if (res.extraTurn || res.board[13] > board[13] + 1) { bestMove = move; found = true; break; }
        }
        if(!found) bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    handleMove(bestMove);
}

// --- 1V1 ONLINE (PeerJS) ---
function generateCode() { return Math.floor(10000 + Math.random() * 90000).toString(); }

function hostGame() {
    let code = generateCode();
    peer = new Peer("mngltrk-" + code);
    peer.on('open', () => {
        document.getElementById('online-status').innerText = `Oda: ${code}\nBekleniyor...`;
        isHost = true;
    });
    peer.on('connection', (c) => {
        conn = c;
        setupConnection();
    });
}

function joinGame() {
    let code = document.getElementById('join-id').value.trim();
    if (code.length < 5) return showPopup("Hata", "Geçerli kod girin.");
    
    document.getElementById('online-status').innerText = "Bağlanılıyor...";
    peer = new Peer();
    peer.on('open', () => {
        isHost = false;
        conn = peer.connect("mngltrk-" + code);
        conn.on('open', setupConnection);
        conn.on('error', () => showPopup("Hata", "Bağlantı kurulamadı."));
    });
}

function setupConnection() {
    showPopup("Başarılı", "Bağlantı kuruldu, oyun başlıyor.");
    conn.on('data', (data) => {
        if (data.type === 'MOVE') {
            handleMove(data.index);
        }
    });
    setTimeout(() => startGame('online'), 1000);
}
function sendMove(index) { if (conn && conn.open) conn.send({ type: 'MOVE', index: index }); }


// --- TURNUVA SİSTEMİ (HOST / ADMIN LOGIC) ---
let tourneyClients = {}; // { peerId: { name, score, matches, banned, conn } }
let tourneyMatches = {}; // { matchId: { p1, p2, board, turn, active } }
let tourneyCode = "";
let matchCounter = 0;

// YENİ EKLENEN: Kod üreterek turnuvayı hostlama
function hostTournament() {
    tourneyCode = generateCode();
    peer = new Peer("trmng-" + tourneyCode);
    peer.on('open', () => {
        document.getElementById('tourney-host-code').innerText = "Kod: " + tourneyCode;
        showScreen('tourney-host-screen');
        isHost = true;
    });
    peer.on('connection', c => {
        c.on('data', data => handleTourneyDataHost(c.peer, c, data));
    });
}

function startTournament() {
    let pIds = Object.keys(tourneyClients);
    if(pIds.length < 2) return showPopup("Hata", "En az 2 oyuncu gerekli.");
    
    // Basit rastgele eşleştirme (Şimdilik ilk 2'yi eşleştir)
    let p1 = pIds[0]; let p2 = pIds[1];
    let mId = "M" + (++matchCounter);
    
    tourneyMatches[mId] = {
        p1: p1, p2: p2, turn: 1, active: true,
        board: [4,4,4,4,4,4, 0, 4,4,4,4,4,4, 0]
    };
    
    tourneyClients[p1].conn.send({ type: 'T_START_GAME', mId: mId, isP1: true, oppName: tourneyClients[p2].name });
    tourneyClients[p2].conn.send({ type: 'T_START_GAME', mId: mId, isP1: false, oppName: tourneyClients[p1].name });
    
    showPopup("Bilgi", "Müsabaka başlatıldı.");
    broadcastTourneyState();
}

function handleHostTourneyMove(mId, peerId, index) {
    let match = tourneyMatches[mId];
    if(!match || !match.active) return;
    
    let isP1 = (match.p1 === peerId);
    let playerNum = isP1 ? 1 : 2;
    if(match.turn !== playerNum) return; 

    let res = executeMove(match.board, playerNum, index);
    match.board = res.board;
    let gameOver = checkTourneyGameOver(match.board);
    
    if(!res.extraTurn && !gameOver) {
        match.turn = match.turn === 1 ? 2 : 1;
    }

    let statePacket = { type: 'T_BOARD_SYNC', board: match.board, turn: match.turn };
    tourneyClients[match.p1].conn.send(statePacket);
    tourneyClients[match.p2].conn.send(statePacket);

    if(gameOver) {
        match.active = false;
        let p1Score = match.board[6]; let p2Score = match.board[13];
        if(p1Score > p2Score) tourneyClients[match.p1].score += 3;
        else if(p2Score > p1Score) tourneyClients[match.p2].score += 3;
        else { tourneyClients[match.p1].score += 1; tourneyClients[match.p2].score += 1; }
        broadcastTourneyState();
    }
}

function checkTourneyGameOver(b) {
    let s1 = 0, s2 = 0;
    for(let i=0;i<6;i++) s1+=b[i];
    for(let i=7;i<13;i++) s2+=b[i];
    return (s1===0 && s2===0);
}

function broadcastTourneyState() {
    let list = Object.keys(tourneyClients).map(id => ({
        id: id, name: tourneyClients[id].name, score: tourneyClients[id].score, banned: tourneyClients[id].banned
    }));
    
    let hList = document.getElementById('tourney-player-list');
    hList.innerHTML = list.map(p => `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>${p.name} (Puan: ${p.score})</span>
            <div>
                <span class="admin-action" onclick="tBan('${p.id}')">${p.banned?'Unban':'Ban'}</span>
                <span class="admin-action" onclick="tKick('${p.id}')">At</span>
            </div>
        </div>
    `).join('');

    Object.values(tourneyClients).forEach(c => c.conn.send({ type: 'T_STATE', list: list }));
}

function tKick(id) { 
    if(!tourneyClients[id]) return;
    tourneyClients[id].conn.send({ type: 'T_KICKED' }); 
    tourneyClients[id].conn.close(); 
    delete tourneyClients[id]; 
    broadcastTourneyState(); 
}
function tBan(id) { 
    if(!tourneyClients[id]) return;
    tourneyClients[id].banned = !tourneyClients[id].banned; 
    broadcastTourneyState(); 
}

// --- MODERASYON (Silme & Bildirme) ---
function tDeleteMsg(msgId) {
    let el = document.getElementById(`admin-${msgId}`);
    if(el) el.innerHTML = `<span class="deleted-msg">Bu mesaj admin tarafından silindi.</span>`;
    Object.values(tourneyClients).forEach(c => c.conn.send({ type: 'T_DEL_MSG', msgId: msgId }));
}

function handleTourneyDataHost(peerId, c, data) {
    if(data.type === 'T_JOIN') {
        tourneyClients[peerId] = { name: escapeHTML(data.name), score: 0, banned: false, conn: c };
        broadcastTourneyState();
    }
    if(data.type === 'T_CHAT') {
        if(tourneyClients[peerId].banned) {
            c.send({ type: 'T_BANNED_WARN' });
            return;
        }
        broadcastTourneyChat(peerId, tourneyClients[peerId].name, data.msg);
    }
    if(data.type === 'T_MOVE') {
        handleHostTourneyMove(data.mId, peerId, data.index);
    }
    if(data.type === 'T_REPORT') {
        showPopup("Rapor Edildi", `${tourneyClients[peerId].name}, şu kişiyi şikayet etti: ${data.sender}`);
        let el = document.getElementById(`admin-${data.msgId}`);
        if(el) el.classList.add('reported-msg');
    }
}

// --- TURNUVA SİSTEMİ (CLIENT LOGIC) ---
let myTourneyMatchId = null;
let amIPlayer1 = false;
let myTourneyName = "";

function joinTournament() {
    let code = document.getElementById('tourney-join-id').value.trim();
    myTourneyName = document.getElementById('tourney-player-name').value.trim() || "Misafir";
    
    if (code.length < 5) return showPopup("Hata", "Geçerli bir Turnuva Kodu girin.");
    
    peer = new Peer();
    peer.on('open', () => {
        conn = peer.connect("trmng-" + code);
        conn.on('open', () => {
            conn.send({ type: 'T_JOIN', name: myTourneyName });
            showScreen('tourney-lobby-screen');
            document.getElementById('tourney-client-status').innerText = "Bağlanıldı.";
        });
        conn.on('data', handleTourneyDataClient);
        conn.on('error', () => showPopup("Hata", "Sunucu bulunamadı."));
    });
}

function cReportMsg(msgId, senderName) {
    if(conn) conn.send({ type: 'T_REPORT', msgId: msgId, sender: senderName });
    showPopup("Bilgi", "Mesaj moderatöre bildirildi.");
}

function handleTourneyDataClient(data) {
    if(data.type === 'T_STATE') {
        let html = data.list.map(p => `<div>${p.name} - Puan: ${p.score}</div>`).join('');
        document.getElementById('tourney-standings').innerHTML = html;
    }
    else if(data.type === 'T_CHAT') {
        appendChatToClient(data);
    }
    else if(data.type === 'T_BANNED_WARN') {
        showPopup("Uyarı", dict[currentLang].chat_banned);
    }
    else if(data.type === 'T_DEL_MSG') {
        let el = document.getElementById(`client-${data.msgId}`);
        if(el) el.innerHTML = `<span class="deleted-msg">Bu mesaj admin tarafından silindi.</span>`;
    }
    else if(data.type === 'T_KICKED') {
        showPopup("Bilgi", dict[currentLang].kicked, "Tamam", () => goHome());
    }
    else if(data.type === 'T_START_GAME') {
        gameMode = 'tourney';
        myTourneyMatchId = data.mId;
        amIPlayer1 = data.isP1;
        
        board = [4,4,4,4,4,4,0,4,4,4,4,4,4,0];
        isGameActive = true;
        myTurnInOnline = amIPlayer1;
        
        document.getElementById('p1-name').innerText = amIPlayer1 ? myTourneyName : data.oppName;
        document.getElementById('p2-name').innerText = amIPlayer1 ? data.oppName : myTourneyName;
        
        showScreen('game-screen');
        updateStatus();
    }
    else if(data.type === 'T_BOARD_SYNC') {
        board = data.board;
        myTurnInOnline = (data.turn === (amIPlayer1 ? 1 : 2));
        updateStatus();
        checkGameOver();
    }
}

function sendTourneyMove(index) {
    if(conn) conn.send({ type: 'T_MOVE', mId: myTourneyMatchId, index: index });
}

// --- TURNUVA SOHBET İŞLEMLERİ (YENİLENMİŞ) ---
function broadcastTourneyChat(peerId, sender, msg) {
    let safeMsg = censorText(msg);
    let msgId = 'msg_' + Math.random().toString(36).substr(2, 9);
    let msgObj = { type: 'T_CHAT', id: msgId, peerId: peerId, sender: sender, msg: safeMsg };
    
    // Host UI Ekle
    appendChatToAdmin(msgObj);
    // Clientlere Gönder
    Object.values(tourneyClients).forEach(c => c.conn.send(msgObj));
}

function sendTourneyChat(role) {
    let inp = document.getElementById(role + '-chat-input');
    if(!inp.value) return;
    if(role === 'admin') broadcastTourneyChat("admin", "Admin", inp.value);
    else conn.send({ type: 'T_CHAT', msg: inp.value });
    inp.value = "";
}

function appendChatToAdmin(msgObj) {
    let ab = document.getElementById('tourney-chat-admin');
    let html = `<div class="chat-msg" id="admin-${msgObj.id}">
        <b>${msgObj.sender}:</b> ${msgObj.msg}
        <div class="chat-actions">`;
    if(msgObj.peerId !== 'admin') {
        html += `<button class="chat-action-btn del" onclick="tDeleteMsg('${msgObj.id}')">Sil</button>
                 <button class="chat-action-btn warn" onclick="tBan('${msgObj.peerId}')">Banla</button>
                 <button class="chat-action-btn del" onclick="tKick('${msgObj.peerId}')">At (Kick)</button>`;
    }
    html += `</div></div>`;
    ab.innerHTML += html;
    ab.scrollTop = ab.scrollHeight;
}

function appendChatToClient(msgObj) {
    let cb = document.getElementById('tourney-chat-client');
    let html = `<div class="chat-msg" id="client-${msgObj.id}">
        <b>${msgObj.sender}:</b> ${msgObj.msg}`;
    if(msgObj.peerId !== 'admin' && msgObj.sender !== myTourneyName) {
        html += `<div class="chat-actions"><button class="chat-action-btn warn" onclick="cReportMsg('${msgObj.id}', '${msgObj.sender}')">Bildir</button></div>`;
    }
    html += `</div>`;
    cb.innerHTML += html;
    cb.scrollTop = cb.scrollHeight;
}

// Başlangıç Ayarları
toggleLanguage();
