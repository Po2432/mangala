const APP_VERSION = "v1.5.0";

// --- PWA GÜNCELLEME KONTROLÜ (Update Checker) ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
        reg.onupdatefound = () => {
            const newWorker = reg.installing;
            newWorker.onstatechange = () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    document.getElementById('update-banner').style.display = 'block';
                }
            };
        };
    });
}
function applyUpdate() {
    if ('caches' in window) {
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => { location.reload(true); });
    } else { location.reload(true); }
}

// --- ÇEVİRİ ---
const dict = {
    tr: {
        title: "Mangala", subtitle: "Geleneksel Türk Strateji Oyunu",
        btn_local: "Yerel Çok Oyunculu", btn_bot: "Bilgisayara Karşı", btn_online: "Aynı Ağda Oyna (WiFi)", btn_tournament: "Turnuva Modu",
        bot_title: "Zorluk Seçin", bot_easy: "Kolay", bot_medium: "Orta", bot_hard: "Zor", bot_nightmare: "Kabus (Nightmare)", btn_back: "Geri",
        online_title: "Çevrimiçi / WiFi", waiting_conn: "Bağlantı bekleniyor...", btn_host: "Oda Kur", btn_join: "Odaya Katıl",
        tourney_title: "Turnuva Modu", btn_host_tourney: "Turnuva Kur (Admin)", btn_join_tourney: "Turnuvaya Katıl",
        tourney_lobby: "Turnuva Lobisi", btn_menu: "Menü / Çık",
        win_p1: "Oyuncu 1 Kazandı!", win_p2: "Oyuncu 2 Kazandı!", draw: "Berabere!",
        win_you: "Kazandın!", win_opp: "Rakip Kazandı!", win_bot: "Bot Kazandı!",
        turn_you: "Senin Sıran", turn_wait: "Sıra Bekleniyor...", turn_bot: "Bot Düşünüyor...",
        kicked: "Turnuvadan atıldınız.", chat_banned: "Sohbetten banlandınız.",
        tab_players: "Durum", tab_matches: "Maçlar", tab_bracket: "Ağaç", tab_settings: "Ayarlar", chat: "Sohbet",
        create_match: "Yeni Manuel Maç", btn_add: "Ekle", btn_end_tourney: "Turnuvayı Bitir", active_matches: "Aktif Maçlar",
        btn_undo: "Geri(Undo)", btn_redo: "İleri(Redo)", btn_restart: "Baştan", btn_end_match: "Bitir",
        spectator_mode: "İzleyici Modu", btn_close_room: "Odayı Kapat", blacklist: "Kara Liste",
        version_err: `Sürüm uyuşmazlığı! (Sunucu: ${APP_VERSION})`
    },
    en: {
        title: "Mangala", subtitle: "Traditional Strategy Game",
        btn_local: "Local Multiplayer", btn_bot: "Play vs Bot", btn_online: "Play on WiFi", btn_tournament: "Tournament Mode",
        bot_title: "Select Difficulty", bot_easy: "Easy", bot_medium: "Medium", bot_hard: "Hard", bot_nightmare: "Nightmare", btn_back: "Back",
        online_title: "Online / WiFi", waiting_conn: "Waiting...", btn_host: "Host Game", btn_join: "Join Game",
        tourney_title: "Tournament Mode", btn_host_tourney: "Host Tournament", btn_join_tourney: "Join Tournament",
        tourney_lobby: "Tournament Lobby", btn_menu: "Menu / Leave",
        win_p1: "P1 Wins!", win_p2: "P2 Wins!", draw: "Draw!",
        win_you: "You Win!", win_opp: "Opponent Wins!", win_bot: "Bot Wins!",
        turn_you: "Your Turn", turn_wait: "Waiting...", turn_bot: "Bot Thinking...",
        kicked: "You were kicked.", chat_banned: "You are banned from chat.",
        tab_players: "Rank", tab_matches: "Matches", tab_bracket: "Bracket", tab_settings: "Settings", chat: "Chat",
        create_match: "Manual Match", btn_add: "Add", btn_end_tourney: "End Tournament", active_matches: "Active Matches",
        btn_undo: "Undo", btn_redo: "Redo", btn_restart: "Restart", btn_end_match: "End Early",
        spectator_mode: "Spectator Mode", btn_close_room: "Close Room", blacklist: "Blacklist",
        version_err: `Version mismatch! (Host: ${APP_VERSION})`
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

let popupCallback = null;
function showPopup(title, message, btnText = "Tamam", callback = null, rankingsHtml = "") {
    document.getElementById('popup-title').innerText = title;
    document.getElementById('popup-message').innerText = message;
    document.getElementById('popup-btn').innerText = btnText;
    let rEl = document.getElementById('popup-rankings');
    if(rankingsHtml) { rEl.style.display = 'block'; rEl.innerHTML = rankingsHtml; } else { rEl.style.display = 'none'; rEl.innerHTML = ""; }
    document.getElementById('popup-overlay').classList.add('active'); popupCallback = callback;
}
function closePopup() { document.getElementById('popup-overlay').classList.remove('active'); if(popupCallback) popupCallback(); }

const _bws = ["ZnVjaw==", "c2hpdA==", "Yml0Y2g=", "YXNzaG9sZQ==", "Y3VudA==", "YW1r", "b8On", "b3Jvc3B1", "c2lrdGly", "cGnDpwo=", "eWFycmFr", "eWF2xZ9haw==", "cGV6ZXZlbms=", "YXE=", "c2c=", "bmlnZ2Vy", "bmVncm8=", "bmF6aQ==", "aGl0bGVy", "a2lsbA=="];
function getBadWords() { return _bws.map(w => decodeURIComponent(escape(atob(w.trim()))).replace(/\n/g, '')); }
function escapeHTML(str) { return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t)); }
function censorText(text) {
    let safeText = escapeHTML(text); let bw = getBadWords();
    let regex = new RegExp("\\b(" + bw.join("|") + ")\\b", "gi"); return safeText.replace(regex, "***");
}

const _tps = ["d2lsbCBraWxs", "ZmluZCB5b3U=", "d2hlcmUgeW91IGxpdmU=", "YmVhdCB5b3U=", "c2VuaSDDtmxkw7xy", "ZXZpbmkgYmlsaQ==", "YWRyZXNpbmkgdmVy", "Z2ViZXJ0", "ZMO2dmVyaW0=", "w7Zsw7xyZWM="];
function getThreatPatterns() { return _tps.map(w => decodeURIComponent(escape(atob(w.trim())))); }
function detectThreat(text) { let tp = getThreatPatterns(); let t = text.toLowerCase(); return tp.some(p => t.includes(p)); }

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}
function switchAdminTab(tabId) {
    document.querySelectorAll('#tourney-host-screen .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#tourney-host-screen .tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active'); document.getElementById(tabId).classList.add('active');
}
function switchClientTab(tabId) {
    document.querySelectorAll('#tourney-lobby-screen .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#tourney-lobby-screen .tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active'); document.getElementById(tabId).classList.add('active');
}

function showBotMenu() { showScreen('bot-menu-screen'); }
function showOnlineMenu() { showScreen('online-menu-screen'); }
function showTournamentMenu() { showScreen('tournament-menu-screen'); }

function goHome() { 
    isGameActive = false; isSpectating = false; adminWatchingId = null;
    if(conn) { conn.close(); conn = null; }
    if(peer) { peer.destroy(); peer = null; }
    Object.values(tourneyClients).forEach(c => { if(c.conn.close) c.conn.close(); });
    tourneyClients = {}; tourneyMatches = {}; bracketObj = {r8:[], r4:[], r2:[]}; tourneyState = 'LOBBY';
    showScreen('menu-screen'); 
}
function leaveMatchScreen() {
    if(gameMode === 'tourney') {
        if(isHost) {
            adminWatchingId = null; document.getElementById('admin-controls').style.display = 'none';
            document.getElementById('in-game-sidebar').style.display = 'none'; showScreen('tourney-host-screen');
        } else {
            if(isSpectating && conn) conn.send({type: 'T_UNWATCH', mId: myTourneyMatchId});
            isSpectating = false; document.getElementById('in-game-sidebar').style.display = 'none'; showScreen('tourney-lobby-screen');
        }
    } else { goHome(); }
}

let board = Array(14).fill(4); board[6] = 0; board[13] = 0;
let currentPlayer = 1; let gameMode = 'local'; let botDifficulty = 'easy'; let isGameActive = false;
let peer = null; let conn = null; let isHost = false; let myTurnInOnline = false;

function getNextIndex(curr, p) {
    if (p === 1) { if(curr === 5) return 6; if(curr === 6) return 7; if(curr === 12) return 0; }
    else { if(curr === 5) return 7; if(curr === 12) return 13; if(curr === 13) return 0; }
    return curr + 1;
}
function executeMove(tb, p, idx) {
    let s = tb[idx]; if (s === 0) return { board: tb, extraTurn: false };
    tb[idx] = 0; let c = idx;
    if (s === 1) { c = getNextIndex(c, p); tb[c]++; } 
    else { tb[idx] = 1; s--; while (s > 0) { c = getNextIndex(c, p); tb[c]++; s--; } }

    let ex = false;
    if ((p===1 && c===6) || (p===2 && c===13)) ex = true;
    else if ((p===1 && c>=7 && c<=12) || (p===2 && c>=0 && c<=5)) { if (tb[c]%2 === 0) { if(p===1) tb[6]+=tb[c]; else tb[13]+=tb[c]; tb[c]=0; } }
    else if ((p===1 && c>=0 && c<=5) || (p===2 && c>=7 && c<=12)) {
        if (tb[c] === 1) { let o = 12 - c; if (tb[o] > 0) { let t = tb[c]+tb[o]; if(p===1) tb[6]+=t; else tb[13]+=t; tb[c]=0; tb[o]=0; } }
    }
    let s1=0, s2=0; for(let i=0;i<=5;i++) s1+=tb[i]; for(let i=7;i<=12;i++) s2+=tb[i];
    if (s1===0 && s2>0) { tb[6]+=s2; for(let i=7;i<=12;i++) tb[i]=0; } 
    else if (s2===0 && s1>0) { tb[13]+=s1; for(let i=0;i<=5;i++) tb[i]=0; }
    return { board: tb, extraTurn: ex };
}

let isSpectating = false;
function startGame(mode, difficulty = 'easy') {
    gameMode = mode; botDifficulty = difficulty; isGameActive = true; currentPlayer = 1; isSpectating = false;
    board = Array(14).fill(4); board[6] = 0; board[13] = 0;
    
    let d = dict[currentLang];
    let p1N = d.turn_you.split(' ')[0], p2N = "Opponent";
    if(mode === 'local') { p1N = "P1"; p2N = "P2"; }
    else if(mode === 'bot') { p1N = "You"; p2N = "Bot"; }
    else if(mode === 'online') { p1N = isHost?"You":"Opp"; p2N = isHost?"Opp":"You"; myTurnInOnline = isHost; }
    
    document.getElementById('p1-name').innerText = p1N; document.getElementById('p2-name').innerText = p2N;
    document.getElementById('btn-close-room').style.display = (mode === 'online' && isHost) ? 'inline-block' : 'none';
    document.getElementById('spectator-label').style.display = 'none';
    
    renderBoard(); updateStatus(); showScreen('game-screen');
}

function renderBoard() {
    const r1 = document.getElementById('row-p1'), r2 = document.getElementById('row-p2');
    r1.innerHTML = ''; r2.innerHTML = '';
    for (let i = 12; i >= 7; i--) r2.appendChild(createPit(i, 2));
    for (let i = 0; i <= 5; i++) r1.appendChild(createPit(i, 1));
    document.getElementById('store-p1').innerText = board[6]; document.getElementById('store-p2').innerText = board[13];
}

function createPit(idx, owner) {
    const div = document.createElement('div'); div.classList.add('pit'); div.innerText = board[idx];
    if (isGameActive && board[idx] > 0 && !isSpectating) {
        let canPlay = false;
        if (gameMode === 'local' && currentPlayer === owner) canPlay = true;
        if (gameMode === 'bot' && currentPlayer === 1 && owner === 1) canPlay = true;
        if (gameMode === 'online' && myTurnInOnline && owner === (isHost ? 1 : 2)) canPlay = true;
        if (gameMode === 'tourney' && myTurnInOnline && owner === (amIPlayer1 ? 1 : 2) && adminWatchingId === null) canPlay = true;

        if(canPlay) {
            div.classList.add('playable');
            div.onclick = () => {
                if(gameMode === 'tourney') sendTourneyMove(idx);
                else if(gameMode === 'online') { handleMove(idx); sendMove(idx); } 
                else handleMove(idx);
            };
        }
    } else { div.classList.add('disabled'); }
    return div;
}

function handleMove(idx) {
    if (!isGameActive) return;
    let res = executeMove(board, currentPlayer, idx); board = res.board; renderBoard();
    if (checkGameOver()) return;
    if (!res.extraTurn) { currentPlayer = currentPlayer === 1 ? 2 : 1; if (gameMode === 'online') myTurnInOnline = (currentPlayer === (isHost ? 1 : 2)); }
    updateStatus();
    
    // Tek oyunculuda bot hamlesi tetikleme
    if (gameMode === 'bot' && currentPlayer === 2 && isGameActive) {
        document.getElementById('status-text').innerText = dict[currentLang].turn_bot;
        setTimeout(() => {
            let cr = applyCheats(board, 2, botDifficulty);
            board = cr.board;
            if(cr.cheated) renderBoard(); // Hile yapıldıysa anında göster
            
            setTimeout(() => {
                let m = getBestMove(board, 2, botDifficulty, cr.disabled);
                if(m !== -1) handleMove(m);
            }, cr.cheated ? 600 : 0); // Hile varsa oyuncu görsün diye az bekle
        }, 800);
    }
}

function checkGameOver() {
    let s1 = 0, s2 = 0; for(let i=0;i<6;i++) s1+=board[i]; for(let i=7;i<13;i++) s2+=board[i];
    if (s1 === 0 && s2 === 0) {
        isGameActive = false; let p1 = board[6], p2 = board[13]; let d = dict[currentLang];
        let msg = p1 > p2 ? d.win_p1 : (p2 > p1 ? d.win_p2 : d.draw);
        if(gameMode === 'bot') msg = p1 > p2 ? d.win_you : (p2 > p1 ? d.win_bot : d.draw);
        if(gameMode === 'online' || (gameMode === 'tourney' && !isSpectating && !adminWatchingId)) {
            let a = (gameMode === 'online') ? isHost : amIPlayer1;
            let mS = a ? p1 : p2, oS = a ? p2 : p1;
            msg = mS > oS ? d.win_you : (oS > mS ? d.win_opp : d.draw);
        }
        renderBoard(); showPopup("Oyun Bitti", `${msg}\n( ${p1} - ${p2} )`, "Tamam", () => leaveMatchScreen());
        return true;
    }
    return false;
}

function updateStatus() {
    if (!isGameActive) return;
    const st = document.getElementById('status-text'); let d = dict[currentLang];
    if(isSpectating || adminWatchingId) st.innerText = d.spectator_mode;
    else if (gameMode === 'local') st.innerText = currentPlayer === 1 ? "P1" : "P2";
    else if (gameMode === 'bot') st.innerText = currentPlayer === 1 ? d.turn_you : d.turn_bot;
    else if (gameMode === 'online' || gameMode === 'tourney') st.innerText = myTurnInOnline ? d.turn_you : d.turn_wait;
    renderBoard();
}

// ==========================================
// --- GELİŞMİŞ YAPAY ZEKA (BOT & HİLELER) ---
// ==========================================
function applyCheats(b, pNum, diff) {
    let oppStore = pNum === 1 ? 13 : 6;
    let myStore = pNum === 1 ? 6 : 13;
    let cheated = false;
    let disabled = false;

    // Ultra 3 Özel Kuralı: Herhangi bir kuyuda 10 taş varsa hileler iptal!
    let pits = b.slice(0,6).concat(b.slice(7,13));
    if(pits.some(s => s >= 10)) disabled = true;

    if (diff === 'ultra1') {
        if (Math.random() < 0.2) { b[myStore]++; cheated = true; }
    } else if (diff === 'ultra2') {
        if (Math.random() < 0.35 && b[oppStore] > 0) { b[oppStore]--; b[myStore]++; cheated = true; }
        if (Math.random() < 0.15) { b[myStore] += 2; cheated = true; }
    } else if (diff === 'ultra3' && !disabled) {
        // En yüksek taşı bul ve çal
        let start = pNum === 1 ? 7 : 0; let end = pNum === 1 ? 12 : 5;
        let maxIdx = start, maxVal = -1;
        for(let i=start; i<=end; i++) { if(b[i] > maxVal) { maxVal=b[i]; maxIdx=i; } }
        if(maxVal >= 2) { b[maxIdx]-=2; b[myStore]+=2; cheated = true; }
        else if(b[oppStore] > 0) { b[oppStore]--; b[myStore]++; cheated = true; }
    }
    return { board: b, cheated: cheated, disabled: disabled };
}

function getBestMove(b, pNum, diff, disableUltra3Cheat = false) {
    let validMoves = [];
    let start = pNum === 1 ? 0 : 7; let end = pNum === 1 ? 5 : 12;
    for(let i=start; i<=end; i++) { if(b[i] > 0) validMoves.push(i); }
    if(validMoves.length === 0) return -1;

    // Büyü bozulduysa veya Kolay ise Rastgele
    if (diff === 'easy' || (diff === 'ultra3' && disableUltra3Cheat)) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    let depth = 4;
    // Performans (Lag) olmaması için Nightmare/Ultra derinliği 6 olarak sınırlandırıldı. (Milyonlarca ihtimal)
    if(['nightmare', 'ultra1', 'ultra2', 'ultra3'].includes(diff)) depth = 6; 
    
    if(diff === 'medium') {
        let found = false; let bestM = validMoves[0];
        for (let m of validMoves) {
            let res = executeMove([...b], pNum, m);
            let myStore = pNum === 1 ? 6 : 13;
            if (res.extraTurn || res.board[myStore] > b[myStore] + 1) { bestM = m; found = true; break; }
        }
        if(!found) return validMoves[Math.floor(Math.random() * validMoves.length)];
        return bestM;
    }
    
    let bestVal = -Infinity; let bestMove = validMoves[0];
    for(let m of validMoves) {
        let res = executeMove([...b], pNum, m);
        let val = genericMinimax(res.board, depth, -Infinity, Infinity, !res.extraTurn, pNum, res.extraTurn ? pNum : (pNum===1?2:1));
        if(val > bestVal) { bestVal = val; bestMove = m; }
    }
    return bestMove;
}

function genericMinimax(tb, depth, alpha, beta, isMaximizing, rootPNum, currTurn) {
    let s1=0, s2=0; for(let i=0;i<6;i++)s1+=tb[i]; for(let i=7;i<13;i++)s2+=tb[i];
    let rS = rootPNum === 1 ? 6 : 13; let oS = rootPNum === 1 ? 13 : 6;
    if(depth === 0 || (s1===0 && s2===0)) return tb[rS] - tb[oS];

    let st = currTurn === 1 ? 0 : 7; let en = currTurn === 1 ? 5 : 12;
    if(isMaximizing) {
        let maxEv = -Infinity;
        for(let i=st; i<=en; i++) {
            if(tb[i]===0) continue;
            let r = executeMove([...tb], currTurn, i);
            let ev = genericMinimax(r.board, depth-1, alpha, beta, r.extraTurn, rootPNum, r.extraTurn ? currTurn : (currTurn===1?2:1));
            maxEv = Math.max(maxEv, ev); alpha = Math.max(alpha, ev);
            if(beta <= alpha) break;
        }
        return maxEv === -Infinity ? (tb[rS]-tb[oS]) : maxEv;
    } else {
        let minEv = Infinity;
        for(let i=st; i<=en; i++) {
            if(tb[i]===0) continue;
            let r = executeMove([...tb], currTurn, i);
            let ev = genericMinimax(r.board, depth-1, alpha, beta, !r.extraTurn, rootPNum, r.extraTurn ? currTurn : (currTurn===1?2:1));
            minEv = Math.min(minEv, ev); beta = Math.min(beta, ev);
            if(beta <= alpha) break;
        }
        return minEv === Infinity ? (tb[rS]-tb[oS]) : minEv;
    }
}

// --- 1V1 ONLINE ---
function generateCode() { return Math.floor(10000 + Math.random() * 90000).toString(); }

function hostGame() {
    let c = generateCode(); peer = new Peer("mngltrk-" + c);
    peer.on('open', () => { document.getElementById('online-status').innerText = `Oda: ${c}\nBekleniyor...`; isHost = true; });
    peer.on('connection', (cn) => { 
        conn = cn; 
        conn.on('data', (d) => {
            if(d.type === 'WIFI_JOIN') {
                if(d.version !== APP_VERSION) {
                    conn.send({type: 'WIFI_ERROR', msg: dict[currentLang].version_err});
                    setTimeout(() => { conn.close(); conn=null; }, 500);
                } else {
                    conn.send({type: 'WIFI_OK'}); showPopup("Başarılı", "Oyun başlıyor.");
                    setTimeout(() => startGame('online'), 1000);
                }
            } else if(d.type === 'MOVE') handleMove(d.index);
            else if(d.type === 'ROOM_CLOSED') showPopup("Uyarı", dict[currentLang].room_closed, "Tamam", ()=>goHome());
        });
    });
}

function joinGame() {
    let c = document.getElementById('join-id').value.trim(); if (c.length < 5) return showPopup("Hata", "Kod girin.");
    document.getElementById('online-status').innerText = "Bağlanılıyor...";
    peer = new Peer();
    peer.on('open', () => { 
        isHost = false; conn = peer.connect("mngltrk-" + c); 
        conn.on('open', () => { conn.send({ type: 'WIFI_JOIN', version: APP_VERSION }); }); 
        conn.on('data', (d) => {
            if(d.type === 'WIFI_ERROR') showPopup("Hata", d.msg, "Tamam", () => goHome());
            else if(d.type === 'WIFI_OK') { document.getElementById('online-status').innerText = "Bağlandı!"; setTimeout(() => startGame('online'), 1000); } 
            else if(d.type === 'MOVE') handleMove(d.index);
            else if(d.type === 'ROOM_CLOSED') showPopup("Uyarı", dict[currentLang].room_closed, "Tamam", () => goHome());
        });
        conn.on('error', () => showPopup("Hata", "Bulunamadı.")); 
    });
}
function sendMove(idx) { if (conn && conn.open) conn.send({ type: 'MOVE', index: idx }); }
function closeWiFiRoom() { if(conn && conn.open) conn.send({type:'ROOM_CLOSED'}); goHome(); }

// ==========================================
// --- TURNUVA SİSTEMİ (HOST / ADMIN) ---
// ==========================================
let tourneyClients = {}; let tourneyMatches = {}; let tourneyCode = ""; let matchCounter = 0;
let chatLocked = false; let repEnabled = true; let adminWatchingId = null;
let bannedUsernames = []; 
let tourneyState = 'LOBBY'; 
let bracketObj = { r8: [], r4: [], r2: [] };

function toggleChatLock() { chatLocked = document.getElementById('chat-lock-toggle').checked; }
function toggleReport() { repEnabled = document.getElementById('report-toggle').checked; }
function updateTourneySystem() {
    let sys = document.getElementById('tourney-system').value;
    document.getElementById('btn-generate-bracket').style.display = (sys === 'knockout') ? 'inline-block' : 'none';
    renderAdminMatches(); renderBracketUI();
}

function addBlacklist() {
    let val = document.getElementById('blacklist-input').value.trim().toLowerCase();
    if(val && !bannedUsernames.includes(val)) { bannedUsernames.push(val); document.getElementById('blacklist-input').value = ""; renderBlacklist(); }
}
function removeBlacklist(name) { bannedUsernames = bannedUsernames.filter(n => n !== name); renderBlacklist(); }
function renderBlacklist() {
    document.getElementById('blacklist-container').innerHTML = bannedUsernames.map(n => 
        `<span style="background:#e74c3c; padding:4px 10px; border-radius:12px; font-size:0.85rem; display:flex; align-items:center; gap:6px; color:white;">
            ${n} <b style="cursor:pointer; font-size:1.1rem; line-height:1;" onclick="removeBlacklist('${n}')">×</b></span>`
    ).join('');
}

function hostTournament() {
    tourneyCode = generateCode(); peer = new Peer("trmng-" + tourneyCode);
    peer.on('open', () => { document.getElementById('tourney-host-code').innerText = "Kod: " + tourneyCode; showScreen('tourney-host-screen'); isHost = true; tourneyState = 'GROUP'; });
    peer.on('connection', c => { c.on('data', d => handleTourneyDataHost(c.peer, c, d)); });
}

// Turnuvaya Bot Ekleme Fonksiyonu
function tAddBot() {
    let diff = document.getElementById('tourney-bot-diff').value;
    let bId = 'bot_' + Math.random().toString(36).substr(2,9);
    let count = Object.values(tourneyClients).filter(c => c.isBot && c.difficulty === diff).length + 1;
    tourneyClients[bId] = {
        name: `Bot (${diff.toUpperCase()}) ${count}`,
        score: 0, banned: false, isBot: true, difficulty: diff,
        conn: { send: ()=>{} } // Sahte bağlantı nesnesi hata vermesini engeller
    };
    broadcastTourneyState(); updateSelects();
    showPopup("Bilgi", "Bot turnuvaya başarıyla eklendi.");
}

function handleTourneyDataHost(pId, c, data) {
    if(data.type === 'T_JOIN') {
        if(data.version !== APP_VERSION) { c.send({ type: 'T_ERROR', msg: dict[currentLang].version_err }); setTimeout(()=>c.close(), 500); return; }
        let reqName = data.name.trim().toLowerCase();
        if(bannedUsernames.includes(reqName)) { c.send({ type: 'T_ERROR', msg: "Bu isim admin tarafından engellenmiştir." }); setTimeout(()=>c.close(), 500); return; }
        if(Object.values(tourneyClients).some(cl => cl.name.toLowerCase() === reqName)) { c.send({ type: 'T_ERROR', msg: "Bu isim kullanımda." }); setTimeout(()=>c.close(), 500); return; }
        
        tourneyClients[pId] = { name: escapeHTML(data.name), score: 0, banned: false, isBot: false, conn: c };
        c.send({ type: 'T_JOIN_OK' }); broadcastTourneyState(); updateSelects();
    }
    else if(data.type === 'T_CHAT') {
        if(tourneyClients[pId].banned) { c.send({ type: 'T_BANNED_WARN' }); return; }
        if(chatLocked && !data.mId) { c.send({ type: 'T_ERROR', msg: "Sohbet admin tarafından kilitlendi." }); return; }
        broadcastTourneyChat(pId, tourneyClients[pId].name, data.msg, data.mId);
    }
    else if(data.type === 'T_REPORT') {
        if(!repEnabled) return; showPopup("Rapor", `${tourneyClients[pId].name}, bildirdi: ${data.sender}`);
        let el = document.getElementById(`admin-${data.msgId}`); if(el) el.classList.add('reported-msg');
    }
    else if(data.type === 'T_MOVE') { handleHostTourneyMove(data.mId, pId, data.index); }
    else if(data.type === 'T_WATCH') { 
        if(tourneyMatches[data.mId]) tourneyMatches[data.mId].spectators.push(pId);
        c.send({ type: 'T_BOARD_SYNC', board: tourneyMatches[data.mId].board, turn: tourneyMatches[data.mId].turn });
    }
    else if(data.type === 'T_UNWATCH') {
        let m = tourneyMatches[data.mId]; if(m) m.spectators = m.spectators.filter(id => id !== pId);
    }
}

// --- AĞAÇ (BRACKET) OLUŞTURMA ---
function generateBracket() {
    let sys = document.getElementById('tourney-system').value;
    if(sys !== 'knockout') return showPopup("Uyarı", "Ağaç sistemi sadece Eleme Usulünde çalışır.");
    
    let sorted = Object.keys(tourneyClients).map(id => ({id, score: tourneyClients[id].score})).sort((a,b) => b.score - a.score);
    if(sorted.length < 4) return showPopup("Hata", "Eleme ağacı için en az 4 oyuncu gerekir.");

    let isTop8 = sorted.length >= 8;
    let players = isTop8 ? sorted.slice(0, 8) : sorted.slice(0, 4);
    bracketObj = { r8: [], r4: [], r2: [] };

    if(isTop8) {
        let seeds = [0, 7, 3, 4, 2, 5, 1, 6];
        for(let i=0; i<4; i++) {
            let p1 = players[seeds[i*2]].id, p2 = players[seeds[i*2+1]].id; let mId = "M" + (++matchCounter);
            tourneyMatches[mId] = { p1, p2, status: 'pending', board: [4,4,4,4,4,4,0,4,4,4,4,4,4,0], turn: 1, history: [], redo: [], spectators: [], isBracket: true, round: 'r8', slot: i };
            bracketObj.r8.push({mId, p1, p2, winner: null});
        }
        for(let i=0;i<2;i++) bracketObj.r4.push({mId: null, p1: null, p2: null, winner: null});
        bracketObj.r2.push({mId: null, p1: null, p2: null, winner: null});
    } else {
        let seeds = [0, 3, 1, 2];
        for(let i=0; i<2; i++) {
            let p1 = players[seeds[i*2]].id, p2 = players[seeds[i*2+1]].id; let mId = "M" + (++matchCounter);
            tourneyMatches[mId] = { p1, p2, status: 'pending', board: [4,4,4,4,4,4,0,4,4,4,4,4,4,0], turn: 1, history: [], redo: [], spectators: [], isBracket: true, round: 'r4', slot: i };
            bracketObj.r4.push({mId, p1, p2, winner: null});
        }
        bracketObj.r2.push({mId: null, p1: null, p2: null, winner: null});
    }
    tourneyState = 'BRACKET';
    renderAdminMatches(); renderBracketUI(); broadcastTourneyState();
    showPopup("Başarılı", "Eleme Ağacı oluşturuldu! Ağaç sekmesinden takip edebilirsiniz.");
}

function updateSelects() {
    let opts = Object.keys(tourneyClients).map(id => `<option value="${id}">${tourneyClients[id].name}</option>`).join('');
    document.getElementById('sel-p1').innerHTML = opts; document.getElementById('sel-p2').innerHTML = opts;
}
function adminCreateMatch() {
    let p1 = document.getElementById('sel-p1').value, p2 = document.getElementById('sel-p2').value;
    if(p1 === p2 || !p1 || !p2) return showPopup("Hata", "Geçerli iki farklı oyuncu seçin.");
    let mId = "M" + (++matchCounter);
    tourneyMatches[mId] = { p1: p1, p2: p2, status: 'pending', board: [4,4,4,4,4,4,0,4,4,4,4,4,4,0], turn: 1, history: [], redo: [], spectators: [], isBracket: false };
    renderAdminMatches(); broadcastTourneyState();
}
function aStartMatch(mId) {
    let m = tourneyMatches[mId]; if(!m || !tourneyClients[m.p1] || !tourneyClients[m.p2]) return;
    m.status = 'active'; m.board = [4,4,4,4,4,4,0,4,4,4,4,4,4,0]; m.turn = 1; m.history = []; m.redo = [];
    tourneyClients[m.p1].conn.send({ type: 'T_START_GAME', mId: mId, isP1: true, oppName: tourneyClients[m.p2].name });
    tourneyClients[m.p2].conn.send({ type: 'T_START_GAME', mId: mId, isP1: false, oppName: tourneyClients[m.p1].name });
    renderAdminMatches(); broadcastTourneyState();
    
    // Maç başladığında eğer ilk sıra bir botunsa tetikle
    triggerTourneyBot(mId);
}
function aCancelMatch(mId) { delete tourneyMatches[mId]; renderAdminMatches(); broadcastTourneyState(); }
function aForceWin(mId, winnerNum) {
    let m = tourneyMatches[mId]; 
    if(document.getElementById('tourney-system').value === 'points') return; 
    m.board[6] = winnerNum === 1 ? 25 : 0; m.board[13] = winnerNum === 2 ? 25 : 0;
    processMatchFinish(mId);
}

// Admin Board Logic
function handleHostTourneyMove(mId, pId, idx) {
    let m = tourneyMatches[mId]; if(!m || m.status !== 'active') return;
    let isP1 = (m.p1 === pId); let pN = isP1 ? 1 : 2; if(m.turn !== pN) return; 

    m.history.push({ board: [...m.board], turn: m.turn }); m.redo = [];
    let res = executeMove(m.board, pN, idx); m.board = res.board;
    let over = checkTourneyGameOver(m.board);
    if(!res.extraTurn && !over) m.turn = m.turn === 1 ? 2 : 1;

    broadcastMatchSync(mId); 
    
    if(over) {
        processMatchFinish(mId);
    } else {
        triggerTourneyBot(mId); // Yeni tur bota geçtiyse oynat
    }
}

// Turnuva Maçlarında Bot Motorunu Tetikleme
function triggerTourneyBot(mId) {
    let m = tourneyMatches[mId];
    if(!m || m.status !== 'active') return;
    
    let activeId = m.turn === 1 ? m.p1 : m.p2;
    let pData = tourneyClients[activeId];
    
    if(pData && pData.isBot) {
        setTimeout(() => {
            // Hile kontrolü
            let cr = applyCheats(m.board, m.turn, pData.difficulty);
            m.board = cr.board;
            if(cr.cheated) broadcastMatchSync(mId); // Çalınan taşları izleyicilere göster
            
            setTimeout(() => {
                let move = getBestMove(m.board, m.turn, pData.difficulty, cr.disabled);
                if(move !== -1) handleHostTourneyMove(mId, activeId, move);
            }, cr.cheated ? 600 : 0);
        }, 1000);
    }
}

function broadcastMatchSync(mId) {
    let m = tourneyMatches[mId]; let pkt = { type: 'T_BOARD_SYNC', board: m.board, turn: m.turn };
    if(tourneyClients[m.p1] && !tourneyClients[m.p1].isBot) tourneyClients[m.p1].conn.send(pkt);
    if(tourneyClients[m.p2] && !tourneyClients[m.p2].isBot) tourneyClients[m.p2].conn.send(pkt);
    m.spectators.forEach(sId => { if(tourneyClients[sId]) tourneyClients[sId].conn.send(pkt); });
    if(adminWatchingId === mId) { board = m.board; myTurnInOnline = false; updateStatus(); }
}
function checkTourneyGameOver(b) { let s1=0, s2=0; for(let i=0;i<6;i++)s1+=b[i]; for(let i=7;i<13;i++)s2+=b[i]; return (s1===0&&s2===0); }

function processMatchFinish(mId) {
    let m = tourneyMatches[mId]; m.status = 'finished'; 
    let s1 = m.board[6], s2 = m.board[13];
    let sys = document.getElementById('tourney-system').value;
    
    let winnerId = (s1 > s2) ? m.p1 : ((s2 > s1) ? m.p2 : m.p1);

    if(sys === 'points') {
        if(tourneyClients[m.p1]) tourneyClients[m.p1].score += s1;
        if(tourneyClients[m.p2]) tourneyClients[m.p2].score += s2;
    } else {
        if(tourneyClients[winnerId]) tourneyClients[winnerId].score += 3;
        if(m.isBracket) {
            let bMatch = bracketObj[m.round][m.slot];
            bMatch.winner = winnerId;
            if(m.round === 'r8') {
                let nSlot = Math.floor(m.slot / 2); let isP1 = (m.slot % 2 === 0); let nB = bracketObj.r4[nSlot];
                if(!nB.mId) {
                    nB.mId = "M" + (++matchCounter);
                    tourneyMatches[nB.mId] = { p1: null, p2: null, status: 'pending', board: [4,4,4,4,4,4,0,4,4,4,4,4,4,0], turn: 1, history: [], redo: [], spectators: [], isBracket: true, round: 'r4', slot: nSlot };
                }
                if(isP1) { tourneyMatches[nB.mId].p1 = winnerId; nB.p1 = winnerId; } else { tourneyMatches[nB.mId].p2 = winnerId; nB.p2 = winnerId; }
            }
            else if(m.round === 'r4') {
                let nSlot = 0; let isP1 = (m.slot % 2 === 0); let nB = bracketObj.r2[nSlot];
                if(!nB.mId) {
                    nB.mId = "M" + (++matchCounter);
                    tourneyMatches[nB.mId] = { p1: null, p2: null, status: 'pending', board: [4,4,4,4,4,4,0,4,4,4,4,4,4,0], turn: 1, history: [], redo: [], spectators: [], isBracket: true, round: 'r2', slot: nSlot };
                }
                if(isP1) { tourneyMatches[nB.mId].p1 = winnerId; nB.p1 = winnerId; } else { tourneyMatches[nB.mId].p2 = winnerId; nB.p2 = winnerId; }
            }
            else if(m.round === 'r2') {
                setTimeout(()=>adminEndTournament(winnerId), 2000);
            }
        }
    }
    renderAdminMatches(); renderBracketUI(); broadcastTourneyState();
}

function aWatchMatch(mId) {
    let m = tourneyMatches[mId]; adminWatchingId = mId; gameMode = 'tourney'; isGameActive = true;
    board = m.board; currentPlayer = m.turn; isSpectating = false; myTurnInOnline = false;
    document.getElementById('p1-name').innerText = tourneyClients[m.p1] ? tourneyClients[m.p1].name : "P1";
    document.getElementById('p2-name').innerText = tourneyClients[m.p2] ? tourneyClients[m.p2].name : "P2";
    document.getElementById('admin-controls').style.display = 'flex';
    document.getElementById('in-game-sidebar').style.display = 'flex';
    document.getElementById('spectator-label').style.display = 'block';
    document.getElementById('ig-chat-msgs').innerHTML = ""; 
    showScreen('game-screen'); updateStatus();
}
function aUndo() {
    let m = tourneyMatches[adminWatchingId]; if(!m || m.history.length === 0) return;
    let last = m.history.pop(); m.redo.push({board: [...m.board], turn: m.turn});
    m.board = last.board; m.turn = last.turn; broadcastMatchSync(adminWatchingId);
}
function aRedo() {
    let m = tourneyMatches[adminWatchingId]; if(!m || m.redo.length === 0) return;
    let nxt = m.redo.pop(); m.history.push({board: [...m.board], turn: m.turn});
    m.board = nxt.board; m.turn = nxt.turn; broadcastMatchSync(adminWatchingId);
}
function aRestart() {
    let m = tourneyMatches[adminWatchingId]; if(!m) return;
    m.board = [4,4,4,4,4,4,0,4,4,4,4,4,4,0]; m.turn = 1; m.history = []; m.redo = [];
    broadcastMatchSync(adminWatchingId);
}
function aEndEarly() {
    let m = tourneyMatches[adminWatchingId]; if(!m) return;
    m.board[6] += m.board.slice(0,6).reduce((a,b)=>a+b,0);
    m.board[13] += m.board.slice(7,13).reduce((a,b)=>a+b,0);
    for(let i=0;i<=5;i++) m.board[i]=0; for(let i=7;i<=12;i++) m.board[i]=0;
    broadcastMatchSync(adminWatchingId); processMatchFinish(adminWatchingId); leaveMatchScreen();
}

function adminEndTournament(champId = null) {
    let list = Object.keys(tourneyClients).map(id => ({ name: tourneyClients[id].name, score: tourneyClients[id].score })).sort((a,b)=>b.score - a.score);
    Object.values(tourneyClients).forEach(c => c.conn.send({ type: 'T_TOURNEY_END', list: list, champ: champId ? tourneyClients[champId]?.name : null }));
    
    let champText = champId ? `<div style="font-size:1.2rem; color:#2ecc71; margin-bottom:10px;">Şampiyon: ${tourneyClients[champId]?.name}</div>` : "";
    let html = champText + list.map((p,i)=>`<div style="margin-bottom:5px;"><b>${i+1}.</b> ${p.name} - <span style="color:var(--accent);">${p.score} Puan</span></div>`).join('');
    showPopup("Turnuva Bitti", "Sonuçlar:", "Ana Menü", ()=>goHome(), html);
}

function broadcastTourneyState() {
    let list = Object.keys(tourneyClients).map(id => ({ id: id, name: tourneyClients[id].name, score: tourneyClients[id].score, banned: tourneyClients[id].banned, isBot: tourneyClients[id].isBot })).sort((a,b)=>b.score - a.score);
    let ml = Object.keys(tourneyMatches).map(mId => {
        let m = tourneyMatches[mId]; return { id: mId, p1N: tourneyClients[m.p1]?.name, p2N: tourneyClients[m.p2]?.name, status: m.status };
    });

    let hList = document.getElementById('tourney-player-list');
    hList.innerHTML = list.map(p => `<div class="match-item" style="display:flex; justify-content:space-between; align-items:center;">
        <span>${p.name} ${p.isBot ? "🤖" : ""} <b style="color:var(--accent);">(${p.score})</b></span>
        <div><span class="chat-action-btn warn" onclick="tBan('${p.id}')">${p.banned?'Unban':'Ban'}</span><span class="chat-action-btn del" onclick="tKick('${p.id}')">Kick</span></div>
    </div>`).join('');
    
    Object.values(tourneyClients).forEach(c => c.conn.send({ type: 'T_STATE', list: list, matches: ml, state: tourneyState, bracketObj: bracketObj, sys: document.getElementById('tourney-system').value }));
}

function renderAdminMatches() {
    let sys = document.getElementById('tourney-system').value;
    let html = Object.keys(tourneyMatches).map(mId => {
        let m = tourneyMatches[mId]; let n1 = tourneyClients[m.p1]?.name || "?"; let n2 = tourneyClients[m.p2]?.name || "?";
        if(m.p1 === null && m.p2 === null) return ''; 
        let acts = "";
        if(m.status === 'pending') {
            if(m.p1 && m.p2) {
                acts += `<button class="chat-action-btn green" onclick="aStartMatch('${mId}')">Başlat</button>`;
                if(sys === 'knockout') acts += `<button class="chat-action-btn" onclick="aForceWin('${mId}', 1)">P1 Win</button><button class="chat-action-btn" onclick="aForceWin('${mId}', 2)">P2 Win</button>`;
            }
            if(!m.isBracket) acts += `<button class="chat-action-btn del" onclick="aCancelMatch('${mId}')">İptal</button>`;
        } else if(m.status === 'active') acts += `<button class="chat-action-btn" onclick="aWatchMatch('${mId}')">Yönet / İzle</button>`;
        else acts += `<span style="color:#aaa;">(Bitti)</span>`;
        
        let label = m.isBracket ? `<span class="match-label">Ağaç (${m.round})</span>` : '';
        return `<div class="match-item">${label}<div style="margin-bottom:8px;"><b>${n1}</b> vs <b>${n2}</b> - <i>${m.status}</i></div><div style="display:flex; gap:5px;">${acts}</div></div>`;
    }).join('');
    document.getElementById('tourney-matches-admin').innerHTML = html;
}

function renderBracketUI() {
    let sys = document.getElementById('tourney-system').value;
    let bAdmin = document.getElementById('bracket-container-admin');
    let bClient = document.getElementById('bracket-container-client');
    if(sys !== 'knockout' || tourneyState !== 'BRACKET') {
        let msg = sys !== 'knockout' ? "Puan modundasınız, ağaç oluşturulamaz." : "Ağaç henüz oluşturulmadı (Grup aşaması).";
        bAdmin.innerHTML = `<div style="opacity:0.6; text-align:center; padding-top:20px; width:100%;">${msg}</div>`;
        if(bClient) bClient.innerHTML = `<div style="opacity:0.6; text-align:center; padding-top:20px; width:100%;">${msg}</div>`;
        return;
    }

    let buildCol = (arr, title) => {
        if(!arr || arr.length === 0) return '';
        let html = `<div class="bracket-col"><div style="text-align:center; font-weight:bold; color:var(--accent); margin-bottom:10px;">${title}</div>`;
        arr.forEach(m => {
            let n1 = m.p1 ? (tourneyClients[m.p1]?.name || "?") : "Bekleniyor";
            let n2 = m.p2 ? (tourneyClients[m.p2]?.name || "?") : "Bekleniyor";
            let c1 = m.winner === m.p1 ? "winner" : ""; let c2 = m.winner === m.p2 ? "winner" : "";
            html += `<div class="bracket-box"><div class="${c1}">${n1}</div><hr style="border:0; border-top:1px solid var(--border); margin:4px 0;"><div class="${c2}">${n2}</div></div>`;
        });
        html += `</div>`; return html;
    };

    let fullHtml = buildCol(bracketObj.r8, "Çeyrek Final") + buildCol(bracketObj.r4, "Yarı Final") + buildCol(bracketObj.r2, "Final");
    bAdmin.innerHTML = fullHtml; if(bClient) bClient.innerHTML = fullHtml;
}

function tKick(id) { 
    if(!tourneyClients[id]) return;
    Object.keys(tourneyMatches).forEach(mId => {
        let m = tourneyMatches[mId];
        if((m.p1 === id || m.p2 === id) && m.status !== 'finished') {
            let oId = m.p1 === id ? m.p2 : m.p1;
            if(document.getElementById('tourney-system').value === 'points') { if(tourneyClients[oId]) tourneyClients[oId].score += 25; m.status = 'finished'; }
            else { m.board[6] = oId===m.p1?25:0; m.board[13] = oId===m.p2?25:0; processMatchFinish(mId); }
        }
    });
    tourneyClients[id].conn.send({ type: 'T_KICKED' }); tourneyClients[id].conn.close(); delete tourneyClients[id]; 
    broadcastTourneyState(); renderAdminMatches(); updateSelects();
}
function tBan(id) { if(!tourneyClients[id]) return; tourneyClients[id].banned = !tourneyClients[id].banned; broadcastTourneyState(); }
function tDeleteMsg(msgId) { let el = document.getElementById(`admin-${msgId}`); if(el) el.innerHTML = `<span class="deleted-msg">Silindi.</span>`; Object.values(tourneyClients).forEach(c => c.conn.send({ type: 'T_DEL_MSG', msgId: msgId })); }

// ==========================================
// --- TURNUVA SİSTEMİ (CLIENT) ---
// ==========================================
let myTourneyMatchId = null; let amIPlayer1 = false; let myTourneyName = "";

function joinTournament() {
    let c = document.getElementById('tourney-join-id').value.trim();
    myTourneyName = document.getElementById('tourney-player-name').value.trim() || "Misafir";
    if (c.length < 5) return showPopup("Hata", "Kod girin.");
    
    peer = new Peer();
    peer.on('open', () => {
        conn = peer.connect("trmng-" + c);
        conn.on('open', () => { conn.send({ type: 'T_JOIN', name: myTourneyName, version: APP_VERSION }); });
        conn.on('data', handleTourneyDataClient);
        conn.on('error', () => showPopup("Hata", "Bulunamadı."));
    });
}

function handleTourneyDataClient(d) {
    if(d.type === 'T_ERROR') { showPopup("Hata", d.msg, "Tamam", ()=>goHome()); }
    else if(d.type === 'T_JOIN_OK') { showScreen('tourney-lobby-screen'); document.getElementById('tourney-client-status').innerText = "Bağlanıldı."; }
    else if(d.type === 'T_STATE') {
        tourneyState = d.state; bracketObj = d.bracketObj;
        document.getElementById('tourney-standings').innerHTML = d.list.map(p => `<div class="match-item" style="display:flex; justify-content:space-between;"><span>${p.name} ${p.isBot ? "🤖" : ""}</span><b style="color:var(--accent);">${p.score} P.</b></div>`).join('');
        document.getElementById('tourney-matches-client').innerHTML = d.matches.map(m => {
            let act = m.status === 'active' ? `<button class="chat-action-btn green" onclick="cWatch('${m.id}')">İzle</button>` : '';
            return `<div class="match-item"><div style="margin-bottom:6px;">${m.p1N} vs ${m.p2N} <i>(${m.status})</i></div>${act}</div>`;
        }).join('');
        
        let sysSelect = document.getElementById('tourney-system');
        if(sysSelect && sysSelect.value !== d.sys) { sysSelect.value = d.sys; }
        if(d.sys === 'knockout' && tourneyState === 'BRACKET') renderClientBracket(d.bracketObj, d.list);
    }
    else if(d.type === 'T_CHAT') appendChatToClient(d);
    else if(d.type === 'T_BANNED_WARN') showPopup("Uyarı", dict[currentLang].chat_banned);
    else if(d.type === 'T_DEL_MSG') { let el = document.getElementById(`client-${d.msgId}`); if(el) el.innerHTML = `<span class="deleted-msg">Silindi.</span>`; }
    else if(d.type === 'T_KICKED') showPopup("Uyarı", dict[currentLang].kicked, "Tamam", () => goHome());
    else if(d.type === 'T_TOURNEY_END') {
        let champText = d.champ ? `<div style="font-size:1.2rem; color:#2ecc71; margin-bottom:10px;">Şampiyon: ${d.champ}</div>` : "";
        let html = champText + d.list.map((p,i)=>`<div style="margin-bottom:5px;"><b>${i+1}.</b> ${p.name} - <span style="color:var(--accent);">${p.score} Puan</span></div>`).join('');
        showPopup("Turnuva Bitti", "Sonuçlar:", "Ana Menü", ()=>goHome(), html);
    }
    else if(d.type === 'T_START_GAME') {
        gameMode = 'tourney'; myTourneyMatchId = d.mId; amIPlayer1 = d.isP1;
        board = [4,4,4,4,4,4,0,4,4,4,4,4,4,0]; isGameActive = true; myTurnInOnline = amIPlayer1; isSpectating = false;
        document.getElementById('p1-name').innerText = amIPlayer1 ? myTourneyName : d.oppName;
        document.getElementById('p2-name').innerText = amIPlayer1 ? d.oppName : myTourneyName;
        document.getElementById('spectator-label').style.display = 'none';
        document.getElementById('in-game-sidebar').style.display = 'flex';
        document.getElementById('ig-chat-msgs').innerHTML = ""; 
        showScreen('game-screen'); updateStatus();
    }
    else if(d.type === 'T_BOARD_SYNC') {
        board = d.board; myTurnInOnline = (d.turn === (amIPlayer1 ? 1 : 2));
        updateStatus(); if(!isSpectating) checkGameOver();
    }
}

function renderClientBracket(bObj, pList) {
    let bClient = document.getElementById('bracket-container-client');
    let getPName = (id) => { let p = pList.find(x=>x.id===id); return p ? p.name : (id ? "?" : "Bekleniyor"); };
    let buildCol = (arr, title) => {
        if(!arr || arr.length === 0) return '';
        let html = `<div class="bracket-col"><div style="text-align:center; font-weight:bold; color:var(--accent); margin-bottom:10px;">${title}</div>`;
        arr.forEach(m => {
            let c1 = m.winner === m.p1 ? "winner" : ""; let c2 = m.winner === m.p2 ? "winner" : "";
            html += `<div class="bracket-box"><div class="${c1}">${getPName(m.p1)}</div><hr style="border:0; border-top:1px solid var(--border); margin:4px 0;"><div class="${c2}">${getPName(m.p2)}</div></div>`;
        });
        html += `</div>`; return html;
    };
    bClient.innerHTML = buildCol(bObj.r8, "Çeyrek Final") + buildCol(bObj.r4, "Yarı Final") + buildCol(bObj.r2, "Final");
}

function sendTourneyMove(idx) { if(conn) conn.send({ type: 'T_MOVE', mId: myTourneyMatchId, index: idx }); }
function cReportMsg(id, s) { if(conn) conn.send({ type: 'T_REPORT', msgId: id, sender: s }); showPopup("Bilgi", "Bildirildi."); }
function cWatch(mId) {
    if(conn) conn.send({ type: 'T_WATCH', mId: mId });
    gameMode = 'tourney'; isGameActive = true; isSpectating = true; myTurnInOnline = false; myTourneyMatchId = mId;
    document.getElementById('p1-name').innerText = "P1"; document.getElementById('p2-name').innerText = "P2";
    document.getElementById('spectator-label').style.display = 'block';
    document.getElementById('in-game-sidebar').style.display = 'flex';
    document.getElementById('ig-chat-msgs').innerHTML = ""; 
    showScreen('game-screen');
}

// Sohbet İşlemleri
function broadcastTourneyChat(pId, s, msg, mId = null) {
    let isThreat = detectThreat(msg);
    let msgId = 'msg_' + Math.random().toString(36).substr(2, 9);
    let mO = { type: 'T_CHAT', id: msgId, peerId: pId, sender: s, msg: censorText(msg), isThreat: isThreat, mId: mId };
    
    appendChatToAdmin(mO); Object.values(tourneyClients).forEach(c => { if(!c.isBot) c.conn.send(mO); });
}
function sendTourneyChat(role) {
    let i = document.getElementById(role + '-chat-input'); if(!i.value) return;
    if(role === 'admin') broadcastTourneyChat("admin", "Admin", i.value); else conn.send({ type: 'T_CHAT', msg: i.value });
    i.value = "";
}
function sendIGChat() {
    let i = document.getElementById('ig-chat-input'); if(!i.value) return;
    let actMatchId = isHost ? adminWatchingId : myTourneyMatchId;
    if(isHost) broadcastTourneyChat("admin", "Admin", i.value, actMatchId); else conn.send({ type: 'T_CHAT', msg: i.value, mId: actMatchId });
    i.value = "";
}

function appendChatToAdmin(mO) {
    let ab = document.getElementById('tourney-chat-admin');
    let ig = document.getElementById('ig-chat-msgs');
    let act = mO.peerId !== 'admin' ? `<button class="chat-action-btn del" onclick="tDeleteMsg('${mO.id}')">Sil</button><button class="chat-action-btn warn" onclick="tBan('${mO.peerId}')">Ban</button>` : '';
    let threatWarning = mO.isThreat ? `<div style="color:#e74c3c; font-size:0.75rem; margin-bottom:4px; font-weight:bold;">⚠️ Sistem (AI) Tehdit Algıladı</div>` : '';
    let reportClass = mO.isThreat ? 'reported-msg' : '';
    let tag = mO.mId ? `<b style="color:var(--accent);">@${mO.mId}</b> ` : '';

    let html = `<div class="chat-msg ${reportClass}" id="admin-${mO.id}">${threatWarning}<b>${mO.sender}:</b> ${tag}${mO.msg}<div class="chat-actions">${act}</div></div>`;
    ab.innerHTML += html; ab.scrollTop = ab.scrollHeight;
    
    if(adminWatchingId && mO.mId === adminWatchingId) {
        ig.innerHTML += `<div class="chat-msg"><b>${mO.sender}:</b> ${mO.msg}</div>`;
        ig.scrollTop = ig.scrollHeight;
    }
}
function appendChatToClient(mO) {
    let cb = document.getElementById('tourney-chat-client');
    let ig = document.getElementById('ig-chat-msgs');
    let act = (mO.peerId !== 'admin' && mO.sender !== myTourneyName) ? `<div class="chat-actions"><button class="chat-action-btn warn" onclick="cReportMsg('${mO.id}', '${mO.sender}')">Bildir</button></div>` : '';
    let tag = mO.mId ? `<b style="color:var(--accent);">@${mO.mId}</b> ` : '';

    cb.innerHTML += `<div class="chat-msg" id="client-${mO.id}"><b>${mO.sender}:</b> ${tag}${mO.msg}${act}</div>`;
    cb.scrollTop = cb.scrollHeight;

    if((myTourneyMatchId === mO.mId) && document.getElementById('in-game-sidebar').style.display !== 'none') {
        ig.innerHTML += `<div class="chat-msg"><b>${mO.sender}:</b> ${mO.msg}</div>`;
        ig.scrollTop = ig.scrollHeight;
    }
}

toggleLanguage();
