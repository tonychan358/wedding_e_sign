// === 資產庫 (Assets Library) ===

export const brushColors = [
    { name: 'black',  hex: '#333333', label: '純黑' }, 
    { name: 'ink',    hex: '#5d4037', label: '墨咖' }, 
    { name: 'gold',   hex: '#d4af37', label: '香檳金' },
    { name: 'red',    hex: '#ef5350', label: '熱情紅' },
    { name: 'pink',   hex: '#f48fb1', label: '櫻花粉' },
    { name: 'blue',   hex: '#4fc3f7', label: '天空藍' },
    { name: 'green',  hex: '#81c784', label: '森林綠' },
];

export const assets = {
    // === A. 臉形 (Faces) - 互斥選項 ===
    'face_empty': { 
        type: 'face', icon: '😶', 
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280"></svg>` 
    },
    // ★ 回退：stroke-width 改回 3
    'face_smile': { 
        type: 'face', icon: '🙂', 
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280" fill="none" stroke="#5d4037" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="100" cy="130" r="8" fill="#5d4037"/><circle cx="180" cy="130" r="8" fill="#5d4037"/><path d="M90 180 Q140 220 190 180"/></svg>` 
    },
    'face_wink': { 
        type: 'face', icon: '😉', 
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280" fill="none" stroke="#5d4037" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M90 130 L110 130"/><circle cx="180" cy="130" r="8" fill="#5d4037"/><path d="M100 180 Q140 210 180 180"/></svg>` 
    },
    'face_laugh': { 
        type: 'face', icon: '😆', 
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280" fill="none" stroke="#5d4037" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M80 130 Q100 110 120 130"/><path d="M160 130 Q180 110 200 130"/><path d="M90 170 Q140 230 190 170 Z"/></svg>` 
    },
    'face_shy': { 
        type: 'face', icon: '😳', 
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280" fill="none" stroke="#5d4037" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="100" cy="130" r="6" fill="#5d4037"/><circle cx="180" cy="130" r="6" fill="#5d4037"/><line x1="80" y1="150" x2="100" y2="160" stroke="#f48fb1" opacity="0.6"/><line x1="90" y1="150" x2="110" y2="160" stroke="#f48fb1" opacity="0.6"/><line x1="180" y1="150" x2="200" y2="160" stroke="#f48fb1" opacity="0.6"/><line x1="170" y1="150" x2="190" y2="160" stroke="#f48fb1" opacity="0.6"/><path d="M120 180 H160"/></svg>` 
    },

    // === B. 配件 (Props) - 疊加選項 ===
    'glasses_round': { 
        type: 'prop', icon: '👓', 
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280"><circle cx="100" cy="125" r="25" fill="none" stroke="#5d4037" stroke-width="3"/><circle cx="180" cy="125" r="25" fill="none" stroke="#5d4037" stroke-width="3"/><line x1="125" y1="125" x2="155" y2="125" stroke="#5d4037" stroke-width="3"/></svg>` 
    },
    'glasses_sun': { 
        type: 'prop', icon: '😎', 
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280"><path d="M70 130 H130 V150 Q100 170 70 150 Z" fill="#333"/><path d="M150 130 H210 V150 Q180 170 150 150 Z" fill="#333"/><line x1="130" y1="130" x2="150" y2="130" stroke="#333" stroke-width="3"/></svg>` 
    },
    'blush': { 
        type: 'prop', icon: '💖', 
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280"><circle cx="70" cy="165" r="15" fill="#f48fb1" opacity="0.4"/><circle cx="210" cy="165" r="15" fill="#f48fb1" opacity="0.4"/></svg>` 
    },
    'mustache': { 
        type: 'prop', icon: '👨', 
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280"><path d="M140 170 Q160 150 190 160 Q180 170 140 175 Q100 170 90 160 Q120 150 140 170" fill="#5d4037"/></svg>` 
    },
    'cat_ears': { 
        type: 'prop', icon: '🐱', 
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280"><path d="M75 75 Q55 20 105 60 L115 75 Z" fill="#5d4037" /><path d="M80 70 Q65 35 100 60 Z" fill="#f48fb1" /><path d="M205 75 Q225 20 175 60 L165 75 Z" fill="#5d4037" /><path d="M200 70 Q215 35 180 60 Z" fill="#f48fb1" /></svg>` 
    },
    'crown': { 
        type: 'prop', icon: '👑', 
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280"><path d="M90 90 L70 50 L110 70 L140 30 L170 70 L210 50 L190 90 Z" fill="#d4af37" stroke="#bfa15f" stroke-width="3"/></svg>` 
    }
};

export const categoryColors = {
    'groom_friend': 'var(--c-groom-friend)',
    'bride_friend': 'var(--c-bride-friend)',
    'groom_family': 'var(--c-groom-family)',
    'bride_family': 'var(--c-bride-family)',
    'colleague':    'var(--c-colleague)',
    'classmate':    'var(--c-classmate)',
    'vip':          'var(--c-vip)'
};
