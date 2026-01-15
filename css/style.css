@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@400;600&family=Noto+Sans+TC:wght@300;400;500&display=swap');

:root {
    --bg-gradient-start: #fffbf0;
    --bg-gradient-end: #fff0f5;
    --primary-color: #d4af37;     /* 香檳金 */
    --secondary-color: #ffb7c5;   /* 櫻花粉 */
    --ink-color: #5d4037;         /* 深褐 */
    
    --glass-bg: rgba(255, 255, 255, 0.9);
    --glass-border: 1px solid rgba(212, 175, 55, 0.3);
    --shadow-holy: 0 10px 40px rgba(212, 175, 55, 0.15);
    
    /* 賓客顏色 */
    --c-groom-friend: #b3e5fc;
    --c-bride-friend: #ffcdd2;
    --c-groom-family: #b2dfdb;
    --c-bride-family: #f8bbd0;
    --c-colleague:    #dcedc8;
    --c-classmate:    #e1bee7;
    --c-vip:          #fff9c4;
}

body {
    font-family: 'Noto Sans TC', sans-serif;
    background: linear-gradient(180deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
    color: var(--ink-color);
    margin: 0;
    padding: 20px 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    overflow-x: hidden;
}

body::before {
    content: ''; position: fixed; top: -10%; left: -10%; width: 60%; height: 60%;
    background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%);
    filter: blur(40px); z-index: -1; animation: glow 8s infinite alternate;
}

.hidden { display: none !important; }

h1 {
    font-family: 'Great Vibes', cursive;
    font-weight: 400; font-size: 3.5rem !important; color: var(--primary-color);
    text-shadow: 1px 1px 0px #fff, 0 0 10px rgba(212, 175, 55, 0.2); margin: 10px 0;
}

.subtitle {
    font-family: 'Cinzel', serif; font-size: 0.8rem; color: #8d6e63;
    letter-spacing: 3px; text-transform: uppercase;
}

/* Landing Page */
.landing-container {
    height: 90vh; display: flex; flex-direction: column; justify-content: center;
    align-items: center; text-align: center; width: 100%; animation: fadeIn 1s ease;
}

.date {
    font-family: 'Cinzel', serif; color: #8d6e63; margin-bottom: 40px; letter-spacing: 4px;
    border-top: 1px solid var(--primary-color); border-bottom: 1px solid var(--primary-color); padding: 8px 30px;
}

.intro { line-height: 1.6; color: #666; margin-bottom: 40px; }

.landing-buttons {
    display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 280px;
    margin: 0 auto; align-items: center;
}

.btn {
    padding: 16px 28px; border-radius: 30px; border: none; cursor: pointer; width: 100%;
    font-size: 1rem; font-weight: 600; letter-spacing: 1px; font-family: 'Cinzel', serif;
    transition: all 0.3s; position: relative; overflow: hidden;
}
.btn:active { transform: scale(0.98); }
.btn.primary { background: linear-gradient(135deg, #e6c873 0%, #d4af37 100%); color: #fff; box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3); }
.btn.secondary { background: rgba(255, 255, 255, 0.8); border: 1px solid var(--primary-color); color: var(--primary-color); }

/* Drawing Page */
.drawing-container { width: 100%; max-width: 400px; display: flex; flex-direction: column; align-items: center; animation: slideUp 0.8s ease; }
.header { width: 100%; display: flex; justify-content: center; align-items: center; margin-bottom: 20px; position: relative; }
.header h1 { font-size: 2rem !important; }
.icon-btn { position: absolute; left: 0; background: none; border: none; color: var(--ink-color); cursor: pointer; font-family: 'Cinzel', serif; }

.canvas-wrapper {
    width: 280px; height: 280px; background: #fff;
    border-radius: 140px 140px 20px 20px; border: 4px solid transparent; 
    box-shadow: 0 0 0 1px var(--primary-color), var(--shadow-holy);
    margin-bottom: 30px; overflow: hidden; position: relative; transition: all 0.3s;
}
.canvas-wrapper canvas { cursor: crosshair; touch-action: none; }

.toolbar, .form-section {
    width: 100%; margin-bottom: 25px; background: var(--glass-bg);
    border-radius: 20px; padding: 24px; box-shadow: var(--shadow-holy); border: 1px solid #fff;
}

.section-label {
    display: block; color: var(--primary-color); margin-bottom: 15px;
    text-align: center; font-size: 0.9rem; font-family: 'Cinzel', serif;
}
.section-label::before { content: '✦ '; } .section-label::after { content: ' ✦'; }

.color-palette { display: flex; justify-content: center; gap: 12px; margin-bottom: 20px; }
.color-btn {
    width: 32px; height: 32px; border-radius: 50%; border: 2px solid #fff;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer;
}
.color-btn.active { transform: scale(1.2); box-shadow: 0 0 0 2px var(--primary-color); }

.template-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
.tpl-btn {
    aspect-ratio: 1; background: #fff; border-radius: 50% 50% 10px 10px;
    border: 1px solid #eee; display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem; cursor: pointer;
}

/* 模板標題 */
.template-header {
    grid-column: 1 / -1; text-align: center; font-size: 0.95rem; color: #8d6e63;
    margin-top: 15px; margin-bottom: 5px; font-weight: bold; font-family: 'Cinzel', serif; letter-spacing: 1px;
}
.template-header:first-child { margin-top: 0; }

.input-group label { display: block; margin-bottom: 8px; color: var(--primary-color); font-family: 'Cinzel', serif; font-weight: 600;}
input, select, textarea {
    width: 100%; padding: 12px; border: 1px solid #e0e0e0; border-radius: 10px;
    background: #fff; outline: none; font-family: 'Noto Sans TC'; box-sizing: border-box;
}
input:focus, select:focus, textarea:focus { border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1); }
.action-buttons { display: flex; gap: 10px; }

/* Intro Overlay */
.intro-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: #fffbf0; z-index: 9999; display: flex; justify-content: center; align-items: center;
    transition: opacity 1s ease-out;
}
.intro-svg { width: 90%; max-width: 600px; }
.draw-text {
    font-family: 'Great Vibes', cursive; font-size: 80px; fill: transparent; stroke: var(--primary-color);
    stroke-width: 1.5; stroke-dasharray: 800; stroke-dashoffset: 800;
    animation: dash 3s cubic-bezier(0.37, 0, 0.63, 1) forwards 0.5s, fillIn 1s ease forwards 3.0s;
}
@keyframes dash { to { stroke-dashoffset: 0; } } @keyframes fillIn { to { fill: var(--primary-color); stroke: transparent; } }
@keyframes glow { from { opacity: 0.5; } to { opacity: 1; } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.fade-out { opacity: 0; pointer-events: none; }
.canvas-wrapper[style*="box-shadow"] { border: 4px solid transparent !important; }
