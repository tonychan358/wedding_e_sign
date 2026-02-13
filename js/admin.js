import { db, doc, deleteDoc } from './firebase.js'; 
import { collection, query, orderBy, onSnapshot, limit, startAfter } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// ★ 設定後台密碼
const ADMIN_PASSCODE = "8888";

// DOM
const loginOverlay = document.getElementById('loginOverlay');
const passcodeInput = document.getElementById('passcodeInput');
const loginBtn = document.getElementById('loginBtn');
const guestList = document.getElementById('guestList');
const countSpan = document.getElementById('count');

// ★ 分頁設定
const ITEMS_PER_PAGE = 20; 
let currentPage = 1;
let pageCursors = []; 
let unsubscribe = null;

// ★ 更新類別名稱
const categoryNames = {
    'groom_family': '🏡 新郎親戚',
    'bride_family': '💕 新娘親戚',
    'groom_friend': '🤵 新郎朋友',
    'bride_friend': '👰 新娘朋友',
    'groom_colleague': '🎓 新郎同事學生',
    'bride_parents_friend': '🌟 新娘雙親好友'
};

// 1. 登入邏輯
function checkLogin() {
    const input = passcodeInput.value;
    if (input === ADMIN_PASSCODE) {
        loginOverlay.style.display = 'none';
        localStorage.setItem('admin_logged_in', 'true');
        startListening(1); 
    } else {
        alert("密碼錯誤！");
        passcodeInput.value = '';
    }
}

if (localStorage.getItem('admin_logged_in') === 'true') {
    loginOverlay.style.display = 'none';
    startListening(1);
}

loginBtn.addEventListener('click', checkLogin);
passcodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkLogin();
});


// 2. 監聽資料
function startListening(page) {
    if (unsubscribe) unsubscribe();

    currentPage = page;
    console.log(`載入第 ${page} 頁...`);
    
    let qConstraints = [
        orderBy("timestamp", "desc"),
        limit(ITEMS_PER_PAGE)
    ];

    if (page > 1) {
        const previousPageCursor = pageCursors[page - 1];
        if (previousPageCursor) {
            qConstraints.splice(1, 0, startAfter(previousPageCursor)); 
        } else {
            console.warn("遺失分頁游標，重置回第 1 頁");
            startListening(1);
            return;
        }
    }

    const q = query(collection(db, "guests"), ...qConstraints);

    unsubscribe = onSnapshot(q, (snapshot) => {
        const guests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (snapshot.docs.length > 0) {
            pageCursors[page] = snapshot.docs[snapshot.docs.length - 1];
        }

        renderList(guests);
        renderPagination(guests.length); 
        countSpan.textContent = `第 ${currentPage} 頁 (本頁 ${guests.length} 筆)`;
    }, (error) => {
        console.error("讀取失敗:", error);
        // ★ 顯示具體錯誤訊息
        guestList.innerHTML = `<div style="text-align:center; color:red;">讀取失敗：${error.message}</div>`;
    });
}

// 3. 渲染列表
function renderList(guests) {
    if (guests.length === 0) {
        guestList.innerHTML = '<div style="text-align:center; color:#999; margin-top:50px;">本頁沒有資料</div>';
        return;
    }

    guestList.innerHTML = '';
    guests.forEach(guest => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${guest.id}`;
        
        let timeStr = '剛剛';
        if (guest.timestamp) {
            const date = guest.timestamp.toDate();
            const pad = (n) => n.toString().padStart(2, '0');
            timeStr = `${date.getMonth()+1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }

        const categoryLabel = categoryNames[guest.category] || '未分類';

        card.innerHTML = `
            <img src="${guest.imageData}" class="thumb" loading="lazy">
            <div class="info">
                <div class="category">${categoryLabel}</div>
                <div class="name">${guest.name}</div>
                <div class="message">${guest.message || '(無留言)'}</div>
                <span class="time">${timeStr}</span>
            </div>
            <div class="actions">
                <button class="btn-del" data-id="${guest.id}" data-name="${guest.name}">刪除</button>
            </div>
        `;

        const delBtn = card.querySelector('.btn-del');
        delBtn.addEventListener('click', () => handleDelete(guest.id, guest.name));

        guestList.appendChild(card);
    });
}

// 4. 渲染分頁按鈕
function renderPagination(currentCount) {
    const oldNav = document.querySelector('.pagination-nav');
    if (oldNav) oldNav.remove();

    const nav = document.createElement('div');
    nav.className = 'pagination-nav';
    nav.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding: 20px 0; margin-top: 10px; border-top: 1px solid #eee;
    `;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = "⬅️ 上一頁";
    prevBtn.style.cssText = `padding: 10px 20px; border-radius: 8px; border: none; background: #eee; cursor: pointer; color: #333;`;
    if (currentPage === 1) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = "0.5";
    }
    prevBtn.onclick = () => startListening(currentPage - 1);

    const pageLabel = document.createElement('span');
    pageLabel.textContent = `第 ${currentPage} 頁`;
    pageLabel.style.fontWeight = "bold";

    const nextBtn = document.createElement('button');
    nextBtn.textContent = "下一頁 ➡️";
    nextBtn.style.cssText = `padding: 10px 20px; border-radius: 8px; border: none; background: #d4af37; cursor: pointer; color: #fff;`;
    
    if (currentCount < ITEMS_PER_PAGE) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = "0.5";
        nextBtn.style.background = "#eee";
        nextBtn.style.color = "#999";
    }
    nextBtn.onclick = () => startListening(currentPage + 1);

    nav.appendChild(prevBtn);
    nav.appendChild(pageLabel);
    nav.appendChild(nextBtn);

    guestList.appendChild(nav);
}

// 5. 刪除邏輯
async function handleDelete(id, name) {
    if (confirm(`確定要刪除「${name}」的留言嗎？\n此動作無法復原！`)) {
        const card = document.getElementById(`card-${id}`);
        if (card) {
            card.style.opacity = '0.3';
            card.style.pointerEvents = 'none';
        }

        try {
            await deleteDoc(doc(db, "guests", id));
            console.log("刪除成功:", id);
        } catch (error) {
            console.error("刪除失敗:", error);
            // ★ 顯示具體錯誤，幫助判斷是權限不足還是程式錯誤
            alert("刪除失敗: " + error.message);
            
            if (card) {
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
            }
        }
    }
}
