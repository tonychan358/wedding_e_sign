import { db, doc, deleteDoc } from './firebase.js'; 
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// ★ 設定後台密碼 (請自行修改)
const ADMIN_PASSCODE = "20260214";

// DOM
const loginOverlay = document.getElementById('loginOverlay');
const passcodeInput = document.getElementById('passcodeInput');
const loginBtn = document.getElementById('loginBtn');
const guestList = document.getElementById('guestList');
const countSpan = document.getElementById('count');

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
        startListening();
    } else {
        alert("密碼錯誤！");
        passcodeInput.value = '';
    }
}

// 自動登入檢查 (如果之前登入過)
if (localStorage.getItem('admin_logged_in') === 'true') {
    loginOverlay.style.display = 'none';
    startListening();
}

loginBtn.addEventListener('click', checkLogin);
// 讓 Input 按 Enter 也能登入
passcodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkLogin();
});


// 2. 監聽資料
function startListening() {
    console.log("開始載入後台資料...");
    // 依時間倒序 (最新的在最上面)
    const q = query(collection(db, "guests"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        const guests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderList(guests);
        countSpan.textContent = guests.length;
    }, (error) => {
        console.error("讀取失敗:", error);
        guestList.innerHTML = '<div style="text-align:center; color:red;">讀取失敗，請檢查網路或權限</div>';
    });
}

// 3. 渲染列表
function renderList(guests) {
    if (guests.length === 0) {
        guestList.innerHTML = '<div style="text-align:center; color:#999; margin-top:50px;">目前還沒有任何留言</div>';
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
            timeStr = `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
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

        // 綁定刪除事件
        const delBtn = card.querySelector('.btn-del');
        delBtn.addEventListener('click', () => handleDelete(guest.id, guest.name));

        guestList.appendChild(card);
    });
}

// 4. 刪除邏輯
async function handleDelete(id, name) {
    if (confirm(`確定要刪除「${name}」的留言嗎？此動作無法復原！`)) {
        const card = document.getElementById(`card-${id}`);
        if (card) card.classList.add('deleting'); // UI 回饋

        try {
            await deleteDoc(doc(db, "guests", id));
            console.log("刪除成功:", id);
            // onSnapshot 會自動更新畫面，所以這裡不用手動 removeChild
        } catch (error) {
            console.error("刪除失敗:", error);
            alert("刪除失敗，請檢查網路。");
            if (card) card.classList.remove('deleting');
        }
    }
}
