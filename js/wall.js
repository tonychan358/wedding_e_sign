import { db } from './firebase.js'; 
import { collection, query, orderBy, onSnapshot, limit, startAfter, getDocs } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// DOM 元素
const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('loading');
const filterButtons = document.getElementById('filterButtons');
const filterSelect = document.getElementById('filterSelect');
const modalOverlay = document.getElementById('modalOverlay');
const modalImg = document.getElementById('modalImg');
const modalName = document.getElementById('modalName');
const modalMsg = document.getElementById('modalMsg');

// 效能設定：限制 DPR 最大為 2
const dpr = Math.min(window.devicePixelRatio || 1, 2);

// 裝置判斷與參數設定
function isMobile() {
    return window.innerWidth < 600;
}

function getMaxStars() {
    return isMobile() ? 15 : 30;
}

function getBottomMargin() {
    return isMobile() ? 100 : 140;
}

// 資料管理
let realtimeGuests = []; // 最新的 50 筆
let historyGuests = [];  // 歷史資料
let allGuests = [];      // 總名單

// 分批載入控制
let lastHistoryDoc = null; 
let isFetchingHistory = false; 
let hasMoreHistory = true; 

// 動畫控制
let filteredGuests = [];
let activeStars = [];
let playbackQueue = [];
let currentCategoryFilter = 'all';

// 顏色對照表
const colorMap = {
    'groom_friend': '144, 202, 249',
    'bride_friend': '255, 128, 171',
    'groom_family': '129, 212, 250',
    'bride_family': '244, 143, 177',
    'colleague':    '165, 214, 167',
    'classmate':    '206, 147, 216',
    'vip':          '255, 202, 40',
    'default':      '212, 175, 55'
};

const filterOptions = [
    { id: 'all', label: '全部顯示' },
    { id: 'groom_friend', label: '🤵 新郎朋友' },
    { id: 'bride_friend', label: '👰 新娘朋友' },
    { id: 'groom_family', label: '🏡 新郎親戚' },
    { id: 'bride_family', label: '💕 新娘親戚' },
    { id: 'colleague', label: '💼 同事' },
    { id: 'classmate', label: '🎓 同學' },
    { id: 'vip', label: '🌟 貴賓' }
];

// 初始化與視窗縮放
function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
resize();

// 點擊偵測
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    for (let i = activeStars.length - 1; i >= 0; i--) {
        const bubble = activeStars[i];
        const dist = Math.hypot(clickX - bubble.x, clickY - bubble.y);
        // 手機版判定範圍稍微加大 (1.5倍)
        if (dist < bubble.size * 1.5) {
            openModal(bubble.data);
            break;
        }
    }
});

function openModal(data) {
    modalImg.src = data.imageData;
    modalName.textContent = data.name;
    modalMsg.textContent = data.message || "（沒有留下訊息）";
    modalOverlay.style.display = 'flex';
    requestAnimationFrame(() => modalOverlay.classList.add('show'));
}

// 氣泡類別
class Bubble {
    constructor(data, mode) {
        this.data = data;
        this.mode = mode; 
        this.size = isMobile() ? 22 : 35;
        this.cacheCanvas = null;
        
        this.image = new Image();
        this.image.src = data.imageData;
        this.loaded = false;
        
        this.image.onload = () => { 
            this.loaded = true;
            this.createCache(); 
        };
        // 錯誤處理：避免圖片損壞卡住
        this.image.onerror = () => {
            console.warn("圖片載入失敗:", data.name);
        };
        
        this.scale = 0; 
        this.targetScale = 1;
        this.floatOffset = Math.random() * 100;
        this.initPosition();
    }

    createCache() {
        const padding = 20; 
        const diameter = this.size * 2;
        const canvasSize = diameter + padding * 2; 
        
        const c = document.createElement('canvas');
        c.width = canvasSize * dpr; 
        c.height = (canvasSize + 30) * dpr; 
        const cx = c.getContext('2d');
        cx.scale(dpr, dpr); 
        
        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        cx.translate(centerX, centerY);
        
        const rgb = colorMap[this.data.category] || colorMap['default'];

        // 1. 陰影
        cx.shadowColor = `rgba(${rgb}, 0.5)`;
        cx.shadowBlur = 10;
        cx.shadowOffsetY = 2;

        // 2. 背景
        cx.beginPath();
        cx.arc(0, 0, this.size, 0, Math.PI * 2);
        cx.fillStyle = "#FFFFFF"; 
        cx.fill();
        
        cx.lineWidth = 2;
        cx.strokeStyle = `rgba(${rgb}, 0.9)`;
        cx.stroke();

        // 3. 頭像 (裁切與疊加)
        cx.shadowBlur = 0;
        cx.save();
        cx.beginPath();
        cx.arc(0, 0, this.size - 2, 0, Math.PI * 2);
        cx.closePath();
        cx.clip();
        
        cx.imageSmoothingEnabled = true; 
        
        const s = this.size * 2;
        const offset = -this.size;
        
        // 8次疊加：增強 3px 線條的清晰度
        for(let k=0; k<8; k++) {
            cx.drawImage(this.image, offset, offset, s, s);
        }
        
        cx.restore();

        // 4. 文字
        cx.font = "bold 11px 'Noto Sans TC', sans-serif";
        cx.textAlign = "center";
        
        const name = this.data.name;
        const textWidth = cx.measureText(name).width;
        
        cx.fillStyle = "rgba(255, 255, 255, 0.9)";
        if (cx.roundRect) {
            cx.beginPath();
            cx.roundRect(-textWidth/2 - 4, this.size + 5, textWidth + 8, 14, 7);
            cx.fill();
        } else {
            cx.fillRect(-textWidth/2 - 4, this.size + 5, textWidth + 8, 14);
        }
        
        cx.fillStyle = "#5d4037";
        cx.fillText(name, 0, this.size + 16);
        
        this.cacheCanvas = c;
        this.cacheOffsetX = -centerX;
        this.cacheOffsetY = -centerY;
        this.cacheLogicalW = c.width / dpr;
        this.cacheLogicalH = c.height / dpr;
    }

    initPosition() {
        // ★ 調整速度：手機版加快一點 (Bounce: 0.8 -> 1.3, Flow: 1.5 -> 2.2)
        // 電腦版保持原速
        let speed;
        const isMob = isMobile();

        if (this.mode === 'flow') {
            speed = isMob ? 2.2 : 1.5; 
        } else {
            speed = isMob ? 1.3 : 0.8;
        }
        
        let attempts = 0;
        let valid = false;
        
        while (!valid && attempts < 10) {
            this.vx = (Math.random() - 0.5) * speed;
            this.vy = (Math.random() - 0.5) * speed;
            
            // 確保手機版不會有「龜速」氣泡，提升最小速度門檻
            const minSpeed = isMob ? 0.25 : 0.15;
            if (Math.abs(this.vx) > minSpeed && Math.abs(this.vy) > minSpeed) valid = true;
            attempts++;
        }
        if (!valid) { 
            // 如果隨機生成失敗，給一個預設的較快速度
            const defaultSpeed = isMob ? 0.5 : 0.3;
            this.vx = defaultSpeed; 
            this.vy = defaultSpeed; 
        }

        const logicalWidth = canvas.width / dpr;
        const logicalHeight = canvas.height / dpr;
        const validHeight = logicalHeight - getBottomMargin() - this.size * 2;

        if (this.mode === 'bounce') {
            this.x = Math.random() * (logicalWidth - this.size * 2) + this.size;
            this.y = Math.random() * Math.max(validHeight, 50) + this.size; 
        } else {
            if (Math.abs(this.vx) > Math.abs(this.vy)) {
                this.x = this.vx > 0 ? -this.size * 2 : logicalWidth + this.size * 2;
                this.y = Math.random() * Math.max(validHeight, 50) + this.size;
            } else {
                this.x = Math.random() * logicalWidth;
                this.y = this.vy > 0 ? -this.size * 2 : validHeight; 
            }
        }
    }

    update(time) {
        this.x += this.vx;
        this.y += this.vy;
        this.y += Math.sin(time * 0.002 + this.floatOffset) * 0.2;
        
        if (this.scale < this.targetScale) this.scale += 0.02;

        const logicalWidth = canvas.width / dpr;
        const logicalHeight = canvas.height / dpr;

        if (this.mode === 'bounce') {
            const padding = this.size;
            const bottomLimit = logicalHeight - getBottomMargin() - padding;

            if (this.x < padding) { this.x = padding; this.vx *= -1; } 
            else if (this.x > logicalWidth - padding) { this.x = logicalWidth - padding; this.vx *= -1; }

            if (this.y < padding) { this.y = padding; this.vy *= -1; } 
            else if (this.y > bottomLimit) { this.y = bottomLimit; this.vy = -Math.abs(this.vy); }
        } else {
            const margin = 150;
            if ((this.vx > 0 && this.x > logicalWidth + margin) || 
                (this.vx < 0 && this.x < -margin) || 
                (this.vy > 0 && this.y > logicalHeight + margin) || 
                (this.vy < 0 && this.y < -margin)) {
                this.isDead = true;
            }
        }
    }

    draw() {
        if (this.cacheCanvas) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.scale, this.scale);
            
            ctx.drawImage(
                this.cacheCanvas, 
                this.cacheOffsetX, 
                this.cacheOffsetY, 
                this.cacheLogicalW, 
                this.cacheLogicalH
            );
            
            ctx.restore();
        }
    }

    cleanup() {
        this.cacheCanvas = null;
        this.image = null;
        this.data = null;
    }
}

// 資料更新邏輯
function updateAllGuests() {
    // 去重複合併
    const uniqueMap = new Map();
    [...realtimeGuests, ...historyGuests].forEach(g => uniqueMap.set(g.id, g));
    allGuests = Array.from(uniqueMap.values());
    
    // 每次資料更新都觸發篩選，確保新資料能進入輪播
    updateGuestFilter();
}

async function loadMoreHistory() {
    if (isFetchingHistory || !hasMoreHistory || !lastHistoryDoc) return;
    
    console.log("📥 正在背景載入更多歷史資料...");
    isFetchingHistory = true;

    try {
        const q = query(
            collection(db, "guests"), 
            orderBy("timestamp", "desc"), 
            startAfter(lastHistoryDoc), 
            limit(50) 
        );

        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            console.log("✅ 已載入所有歷史資料");
            hasMoreHistory = false;
        } else {
            const newBatch = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            historyGuests = [...historyGuests, ...newBatch];
            lastHistoryDoc = snapshot.docs[snapshot.docs.length - 1]; 
            console.log(`📥 成功載入 ${newBatch.length} 筆歷史資料`);
            
            updateAllGuests(); 
        }
    } catch (error) {
        console.error("載入歷史失敗:", error);
    } finally {
        isFetchingHistory = false;
    }
}

function updateGuestFilter() {
    let baseList = allGuests;
    if (currentCategoryFilter !== 'all') {
        baseList = allGuests.filter(g => g.category === currentCategoryFilter);
    }
    
    filteredGuests = baseList;
    
    // 如果播放清單空了，就補滿
    if (playbackQueue.length === 0 && filteredGuests.length > 0) {
        playbackQueue = shuffleArray(filteredGuests);
    }

    const isCrowded = filteredGuests.length > getMaxStars();
    if (!isCrowded) { activeStars.forEach(star => star.mode = 'bounce'); }
}

function spawnStars() {
    const targetCount = Math.min(filteredGuests.length, getMaxStars());
    const isCrowded = filteredGuests.length > getMaxStars();
    const mode = isCrowded ? 'flow' : 'bounce';
    
    // 自動補貨機制
    if (playbackQueue.length < 10 && hasMoreHistory) {
        loadMoreHistory();
    }

    while (activeStars.length < targetCount) {
        if (playbackQueue.length === 0) {
            if (filteredGuests.length === 0) break;
            playbackQueue = shuffleArray(filteredGuests);
        }
        
        let candidate = null;
        let attempts = 0;
        const maxAttempts = playbackQueue.length;
        
        while (attempts < maxAttempts) {
            const potentialGuest = playbackQueue.pop();
            const isAlreadyOnScreen = activeStars.some(s => s.data.id === potentialGuest.id);
            if (isAlreadyOnScreen) { playbackQueue.unshift(potentialGuest); attempts++; } 
            else { candidate = potentialGuest; break; }
        }
        
        if (candidate) { activeStars.push(new Bubble(candidate, mode)); } else { break; }
    }
}

function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// UI 渲染
function renderFilterUI() {
    filterButtons.innerHTML = '';
    filterOptions.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = opt.label;
        if (opt.id === currentCategoryFilter) btn.classList.add('active');
        btn.onclick = () => applyFilter(opt.id);
        filterButtons.appendChild(btn);
    });
    filterSelect.innerHTML = '';
    filterOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.id;
        option.textContent = opt.label;
        filterSelect.appendChild(option);
    });
    filterSelect.onchange = (e) => applyFilter(e.target.value);
}

function applyFilter(filterId) {
    if (currentCategoryFilter === filterId) return;
    currentCategoryFilter = filterId;
    
    // 清空播放清單，避免舊類別氣泡殘留
    playbackQueue = []; 
    
    updateGuestFilter(); 
    activeStars = []; 
    spawnStars();
    document.querySelectorAll('.filter-btn').forEach((btn, index) => {
        if (filterOptions[index].id === filterId) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    filterSelect.value = filterId;
}

// 啟動 Firebase 監聽
function startListening() {
    console.log("開始連結 Firebase...");
    
    // 預設監聽最新的 50 筆
    const q = query(collection(db, "guests"), orderBy("timestamp", "desc"), limit(50));

    onSnapshot(q, (snapshot) => {
        loading.style.display = 'none';
        
        realtimeGuests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 設定歷史資料游標
        if (!lastHistoryDoc && snapshot.docs.length > 0) {
            lastHistoryDoc = snapshot.docs[snapshot.docs.length - 1];
        }

        console.log(`🔥 即時更新: 目前最新 ${realtimeGuests.length} 筆`);
        updateAllGuests(); 
        spawnStars();
    }, (error) => { 
        console.error("Firebase 連線錯誤:", error); 
        loading.textContent = "連線失敗 (請檢查 Console)"; 
    });
}

// 動畫迴圈
function animate(time) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    for (let i = activeStars.length - 1; i >= 0; i--) {
        const bubble = activeStars[i];
        bubble.update(time);
        bubble.draw(); 
        if (bubble.isDead) {
            bubble.cleanup(); 
            activeStars.splice(i, 1);
        }
    }
    spawnStars();
    requestAnimationFrame(animate);
}

renderFilterUI();
startListening();
requestAnimationFrame(animate);
