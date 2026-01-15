import { db } from './firebase.js'; 
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// DOM
const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('loading');
const filterButtons = document.getElementById('filterButtons');
const filterSelect = document.getElementById('filterSelect');
const modalOverlay = document.getElementById('modalOverlay');
const modalImg = document.getElementById('modalImg');
const modalName = document.getElementById('modalName');
const modalMsg = document.getElementById('modalMsg');

// 限制 dpr 最大為 2，保證效能同時維持清晰度
const dpr = Math.min(window.devicePixelRatio || 1, 2);

// ★ 1. 響應式判斷
function isMobile() {
    return window.innerWidth < 600;
}

// 手機版顯示少一點 (15顆)，電腦版 (30顆)
function getMaxStars() {
    return isMobile() ? 15 : 30;
}

// 底部保留高度 (手機版留少一點，增加可視範圍)
function getBottomMargin() {
    return isMobile() ? 100 : 140;
}

let allGuests = [];
let filteredGuests = [];
let activeStars = [];
let playbackQueue = [];
let currentCategoryFilter = 'all';

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

function resize() {
    // 設定高解析度畫布
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
resize();

// Click Detection
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    for (let i = activeStars.length - 1; i >= 0; i--) {
        const bubble = activeStars[i];
        const dist = Math.hypot(clickX - bubble.x, clickY - bubble.y);
        // 手機版點擊範圍稍微加大，比較好點
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

class Bubble {
    constructor(data, mode) {
        this.data = data;
        this.mode = mode; 
        
        // ★ 2. 氣泡大小調整
        // 手機版：半徑 22px (直徑 44px) -> 解決臉太大的問題
        // 電腦版：半徑 35px (直徑 70px)
        this.size = isMobile() ? 22 : 35;
        
        this.cacheCanvas = null;
        
        this.image = new Image();
        this.image.src = data.imageData;
        this.loaded = false;
        this.image.onload = () => { 
            this.loaded = true;
            this.createCache(); 
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

        // 2. 氣泡背景
        cx.beginPath();
        cx.arc(0, 0, this.size, 0, Math.PI * 2);
        cx.fillStyle = "#FFFFFF"; 
        cx.fill();
        
        cx.lineWidth = 2;
        cx.strokeStyle = `rgba(${rgb}, 0.9)`;
        cx.stroke();

        // 3. 畫頭像
        cx.shadowBlur = 0;
        cx.save();
        cx.beginPath();
        cx.arc(0, 0, this.size - 2, 0, Math.PI * 2);
        cx.closePath();
        cx.clip();
        
        // ★ 3. 移除濾鏡，確保顏色準確 ★
        // cx.filter = "contrast(1.5) saturate(1.2)"; // 移除這行
        
        // 保持平滑開啟 (預設)，避免線條鋸齒，靠疊加來增加濃度
        cx.imageSmoothingEnabled = true; 
        
        const s = this.size * 2;
        const offset = -this.size;
        
        // ★ 4. 保持多重疊加 (Stacking) ★
        // 即使沒有濾鏡，疊加 8 次也能讓半透明的 3px 線條變得紮實
        for(let k=0; k<8; k++) {
            cx.drawImage(this.image, offset, offset, s, s);
        }
        
        cx.restore();

        // 4. 名字標籤
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
        const speed = this.mode === 'flow' ? 1.5 : 0.8;
        let attempts = 0;
        let valid = false;
        
        while (!valid && attempts < 10) {
            this.vx = (Math.random() - 0.5) * speed;
            this.vy = (Math.random() - 0.5) * speed;
            if (Math.abs(this.vx) > 0.15 && Math.abs(this.vy) > 0.15) valid = true;
            attempts++;
        }
        if (!valid) { this.vx = 0.3; this.vy = 0.3; }

        const logicalWidth = canvas.width / dpr;
        const logicalHeight = canvas.height / dpr;
        
        // ★ 5. 安全邊界計算
        // 確保氣泡不會生成在底部 Filter Bar 的位置
        const validHeight = logicalHeight - getBottomMargin() - this.size * 2;

        if (this.mode === 'bounce') {
            this.x = Math.random() * (logicalWidth - this.size * 2) + this.size;
            // Math.max 確保不會因為邊界太小而算出負數
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
            // ★ 6. 嚴格邊界檢查
            const bottomLimit = logicalHeight - getBottomMargin() - padding;

            // X 軸
            if (this.x < padding) { 
                this.x = padding; 
                this.vx *= -1; 
            } else if (this.x > logicalWidth - padding) { 
                this.x = logicalWidth - padding; 
                this.vx *= -1; 
            }

            // Y 軸
            if (this.y < padding) { 
                this.y = padding; 
                this.vy *= -1; 
            } else if (this.y > bottomLimit) { 
                this.y = bottomLimit; 
                this.vy = -Math.abs(this.vy); // 確保向上反彈
            }
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
}

function updateGuestFilter() {
    if (currentCategoryFilter === 'all') { filteredGuests = [...allGuests]; } 
    else { filteredGuests = allGuests.filter(g => g.category === currentCategoryFilter); }
    playbackQueue = []; 
    // ★ 7. 使用動態數量限制
    const isCrowded = filteredGuests.length > getMaxStars();
    if (!isCrowded) { activeStars.forEach(star => star.mode = 'bounce'); }
}

function spawnStars() {
    // ★ 7. 使用動態數量限制
    const targetCount = Math.min(filteredGuests.length, getMaxStars());
    const isCrowded = filteredGuests.length > getMaxStars();
    const mode = isCrowded ? 'flow' : 'bounce';
    
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
    updateGuestFilter();
    activeStars = []; 
    spawnStars();
    document.querySelectorAll('.filter-btn').forEach((btn, index) => {
        if (filterOptions[index].id === filterId) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    filterSelect.value = filterId;
}

function startListening() {
    console.log("開始連結 Firebase...");
    const q = query(collection(db, "guests"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snapshot) => {
        loading.style.display = 'none';
        allGuests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`收到 ${allGuests.length} 筆資料`);
        updateGuestFilter();
        spawnStars();
    }, (error) => { 
        console.error("Firebase 連線錯誤:", error); 
        loading.textContent = "連線失敗 (請檢查 Console)"; 
    });
}

function animate(time) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置為物理像素
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    for (let i = activeStars.length - 1; i >= 0; i--) {
        const bubble = activeStars[i];
        bubble.update(time);
        bubble.draw(); 
        if (bubble.isDead) activeStars.splice(i, 1);
    }
    spawnStars();
    requestAnimationFrame(animate);
}

renderFilterUI();
startListening();
requestAnimationFrame(animate);
