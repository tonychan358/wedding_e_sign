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
const ITEMS_PER_PAGE = 20; // 每頁 20 筆
let currentPage = 1;
let pageCursors = []; // 儲存每一頁的「最後一筆資料」作為下一頁的起點
let unsubscribe = null;

// 類別名稱對照
const categoryNames = {
    'groom_friend': '🤵 新郎朋友',
    'bride_friend': '👰 新娘朋友',
    'groom_family': '🏡 新郎親戚',
    'bride_family': '💕 新娘親戚',
    'colleague':    '💼 同事',
    'classmate':    '🎓 同學',
    'vip':          '🌟 貴賓'
};

// 1. 登入邏輯
function checkLogin() {
    const input = passcodeInput.value;
    if (input === ADMIN_PASSCODE) {
        loginOverlay.style.display = 'none';
        localStorage.setItem('admin_logged_in', 'true');
        startListening(1); // 登入後載入第 1 頁
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


// 2. 監聽資料 (分頁核心)
function startListening(page) {
    if (unsubscribe) unsubscribe();

    // 更新頁碼
    currentPage = page;
    console.log(`載入第 ${page} 頁...`);
    
    // 準備查詢條件
    let qConstraints = [
        orderBy("timestamp", "desc"),
        limit(ITEMS_PER_PAGE)
    ];

    // 如果不是第 1 頁，需要加上 startAfter 游標
    if (page > 1) {
        const previousPageCursor = pageCursors[page - 1];
        if (previousPageCursor) {
            qConstraints.splice(1, 0, startAfter(previousPageCursor)); // 插入到 orderBy 之後
        } else {
            // 如果沒有游標 (例如直接重新整理在第 2 頁)，強制回第 1 頁
            console.warn("遺失分頁游標，重置回第 1 頁");
            startListening(1);
            return;
        }
    }

    const q = query(collection(db, "guests"), ...qConstraints);

    unsubscribe = onSnapshot(q, (snapshot) => {
        const guests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // ★ 關鍵：隨時更新「本頁最後一筆」，這將是「下一頁」的起點
        // 這樣即使在目前頁面刪除了資料，翻頁也能保持正確
        if (snapshot.docs.length > 0) {
            pageCursors[page] = snapshot.docs[snapshot.docs.length - 1];
        }

        renderList(guests);
        renderPagination(guests.length); // 重新渲染分頁按鈕
        countSpan.textContent = `第 ${currentPage} 頁 (本頁 ${guests.length} 筆)`;
    }, (error) => {
        console.error("讀取失敗:", error);
        guestList.innerHTML = '<div style="text-align:center; color:red;">讀取失敗，請檢查網路或權限</div>';
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
        
        // 時間格式化
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

// 4. 渲染分頁按鈕 (UI)
function renderPagination(currentCount) {
    // 檢查舊的按鈕區塊是否存在，存在就移除
    const oldNav = document.querySelector('.pagination-nav');
    if (oldNav) oldNav.remove();

    const nav = document.createElement('div');
    nav.className = 'pagination-nav';
    nav.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding: 20px 0; margin-top: 10px; border-top: 1px solid #eee;
    `;

    // 上一頁按鈕
    const prevBtn = document.createElement('button');
    prevBtn.textContent = "⬅️ 上一頁";
    prevBtn.style.cssText = `padding: 10px 20px; border-radius: 8px; border: none; background: #eee; cursor: pointer; color: #333;`;
    if (currentPage === 1) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = "0.5";
    }
    prevBtn.onclick = () => startListening(currentPage - 1);

    // 頁碼顯示
    const pageLabel = document.createElement('span');
    pageLabel.textContent = `第 ${currentPage} 頁`;
    pageLabel.style.fontWeight = "bold";

    // 下一頁按鈕
    const nextBtn = document.createElement('button');
    nextBtn.textContent = "下一頁 ➡️";
    nextBtn.style.cssText = `padding: 10px 20px; border-radius: 8px; border: none; background: #d4af37; cursor: pointer; color: #fff;`;
    
    // 如果抓回來的資料少於每頁上限，代表是最後一頁了
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
            // 刪除後，onSnapshot 會自動補上下一筆資料 (如果有)，保持該頁面滿 20 筆
        } catch (error) {
            console.error("刪除失敗:", error);
            alert("刪除失敗，請檢查網路。");
            if (card) {
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
            }
        }
    }
}
