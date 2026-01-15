import { assets, categoryColors, brushColors } from './assets.js';
import { saveToCloud } from './firebase.js';

// DOM
const landingPage = document.getElementById('landingPage');
const drawingPage = document.getElementById('drawingPage');
const introOverlay = document.getElementById('introOverlay');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const submitBtn = document.getElementById('submitBtn');
const templateGrid = document.getElementById('templateGrid');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const categorySelect = document.getElementById('guestCategory');
const canvasWrapper = document.getElementById('canvasWrapper');
const colorPalette = document.getElementById('colorPalette');
const btnGoDraw = document.getElementById('btnGoDraw');
const btnGoWall = document.getElementById('btnGoWall');
const btnBackHome = document.getElementById('btnBackHome');
const btnGoWallFromDraw = document.getElementById('btnGoWallFromDraw');

let isDrawing = false;
let historyStack = [];
let currentColor = '#333333'; 
const MAX_HISTORY = 10;
// ★ 優化：限制 dpr 最大為 2，避免部分手機記憶體不足
const dpr = Math.min(window.devicePixelRatio || 1, 2);

function init() {
    initCanvas();
    renderColorPalette();
    renderTemplates();
    bindEvents();
    updateCategoryColor();
    handleIntroAnimation();
}

function handleIntroAnimation() {
    setTimeout(() => {
        introOverlay.classList.add('fade-out');
        setTimeout(() => { introOverlay.style.display = 'none'; }, 800); 
    }, 4500); 
}

function initCanvas() {
    // 1. 設定畫布的「物理像素」大小
    canvas.width = 280 * dpr;
    canvas.height = 280 * dpr;
    
    // 2. 透過 CSS 強制設定顯示大小
    canvas.style.width = '280px';
    canvas.style.height = '280px';
    
    // 3. 縮放繪圖內容以符合邏輯座標
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = currentColor;
    // 保持 3px 細緻線條
    ctx.lineWidth = 3; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    drawBaseFace();
    saveState();
}

function drawBaseFace() {
    ctx.save();
    // ★ 修改：顏色改為 #5d4037 (墨咖)，與五官/外框顏色一致
    ctx.strokeStyle = '#5d4037'; 
    ctx.lineWidth = 2; 
    ctx.beginPath();
    ctx.arc(140, 140, 90, 0, Math.PI * 2); 
    ctx.stroke();
    ctx.restore();
}

function clearCanvas(saveToHistory = true) {
    ctx.clearRect(0, 0, 280, 280);
    drawBaseFace();
    
    // 重置畫筆
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 3; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (saveToHistory) saveState();
}

function renderTemplates() {
    templateGrid.innerHTML = '';
    
    const faceHeader = document.createElement('div');
    faceHeader.className = 'template-header';
    faceHeader.textContent = '- 選擇臉形模版 -';
    templateGrid.appendChild(faceHeader);
    Object.keys(assets).filter(k => assets[k].type === 'face').forEach(key => createTemplateBtn(key));
    
    const propHeader = document.createElement('div');
    propHeader.className = 'template-header';
    propHeader.textContent = '- 加入裝飾配件 -';
    templateGrid.appendChild(propHeader);
    Object.keys(assets).filter(k => assets[k].type === 'prop').forEach(key => createTemplateBtn(key));
}

function createTemplateBtn(key) {
    const btn = document.createElement('div');
    btn.className = 'tpl-btn';
    btn.innerHTML = assets[key].icon;
    if (assets[key].type === 'face') btn.style.borderColor = '#d4af37'; 
    btn.addEventListener('click', (e) => { e.preventDefault(); applyTemplate(key); });
    templateGrid.appendChild(btn);
}

function applyTemplate(key) {
    const asset = assets[key];
    const svgString = asset.svg;
    const type = asset.type; 

    const img = new Image();
    const blob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    
    img.onload = function() {
        if (type === 'face') {
            ctx.clearRect(0, 0, 280, 280);
            drawBaseFace();
        }
        ctx.drawImage(img, 0, 0, 280, 280);
        URL.revokeObjectURL(url);
        saveState();
    };
    img.src = url;
}

function renderColorPalette() {
    colorPalette.innerHTML = '';
    brushColors.forEach((color, index) => {
        const btn = document.createElement('div');
        btn.className = 'color-btn';
        btn.style.backgroundColor = color.hex;
        if (index === 0) btn.classList.add('active');
        btn.addEventListener('click', () => changeColor(color.hex, btn));
        colorPalette.appendChild(btn);
    });
}

function changeColor(hex, btn) {
    currentColor = hex;
    ctx.strokeStyle = hex;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function updateCategoryColor() {
    const colorVar = categoryColors[categorySelect.value] || '#5d4037';
    canvasWrapper.style.boxShadow = `0 0 0 4px #fff, 0 0 20px ${colorVar}`;
    categorySelect.style.borderLeft = `5px solid ${colorVar}`;
}

async function handleSubmit() {
    const name = document.getElementById('guestName').value.trim();
    const category = categorySelect.value;
    const message = document.getElementById('guestMessage').value.trim();
    if (!name) { alert('請留下您的尊姓大名 😉'); return; }
    submitBtn.disabled = true;
    submitBtn.textContent = '🚀 正在傳送...';
    try {
        const imageData = canvas.toDataURL('image/png');
        await saveToCloud({ name, category, message, imageData });
        alert('發送成功！快去星空牆找找你的作品吧！');
        submitBtn.classList.add('hidden');
        btnGoWallFromDraw.classList.remove('hidden');
    } catch (error) {
        console.error("Upload Error:", error);
        alert('傳送失敗，請再試一次');
        submitBtn.disabled = false;
        submitBtn.textContent = '✨ 簽到並傳送 ✨';
    }
}

function showDrawing() { landingPage.classList.add('hidden'); drawingPage.classList.remove('hidden'); }
function showLanding() { drawingPage.classList.add('hidden'); landingPage.classList.remove('hidden'); }
function goToWall() { window.location.href = 'wall.html'; }

function getPos(evt) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (evt.touches && evt.touches.length > 0) { clientX = evt.touches[0].clientX; clientY = evt.touches[0].clientY; }
    else { clientX = evt.clientX; clientY = evt.clientY; }
    
    return { 
        x: (clientX - rect.left), 
        y: (clientY - rect.top) 
    };
}

function startDraw(e) { if (e.type === 'mousedown' && e.button !== 0) return; isDrawing = true; const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); if(e.cancelable) e.preventDefault(); }
function draw(e) { if (!isDrawing) return; const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); if(e.cancelable) e.preventDefault(); }
function endDraw(e) { if (isDrawing) { isDrawing = false; ctx.closePath(); saveState(); } }

function saveState() { 
    if (historyStack.length >= MAX_HISTORY) historyStack.shift(); 
    historyStack.push(canvas.toDataURL()); 
}

function undo() { 
    if (historyStack.length <= 1) { clearCanvas(false); return; } 
    historyStack.pop(); 
    const prevState = historyStack[historyStack.length - 1]; 
    const img = new Image(); 
    img.src = prevState; 
    img.onload = () => { 
        ctx.clearRect(0, 0, 280, 280); 
        ctx.drawImage(img, 0, 0, 280, 280);
    }; 
}

function bindEvents() {
    btnGoDraw.addEventListener('click', showDrawing);
    btnGoWall.addEventListener('click', goToWall);
    btnBackHome.addEventListener('click', showLanding);
    btnGoWallFromDraw.addEventListener('click', goToWall);
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseout', endDraw);
    canvas.addEventListener('touchstart', startDraw, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    canvas.addEventListener('touchend', endDraw);
    undoBtn.addEventListener('click', undo);
    clearBtn.addEventListener('click', () => clearCanvas(true));
    submitBtn.addEventListener('click', handleSubmit);
    categorySelect.addEventListener('change', updateCategoryColor);
}
init();
