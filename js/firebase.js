import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
// ★ 新增 deleteDoc, doc
import { getFirestore, collection, addDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7rVKcrDV8DBRuzJlxd4wD0QEGzJZnGhs",
  authDomain: "wedding-e-sign.firebaseapp.com",
  projectId: "wedding-e-sign",
  storageBucket: "wedding-e-sign.firebasestorage.app",
  messagingSenderId: "119317618164",
  appId: "1:119317618164:web:de97e40d34919b30fd6da1"
};

const app = initializeApp(firebaseConfig);

// 匯出 db 與 auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// 匯出刪除功能所需的 doc 與 deleteDoc
export { doc, deleteDoc };

async function initAuth() {
    try {
        await signInAnonymously(auth);
        console.log("🔥 Firebase: 匿名登入成功");
    } catch (error) {
        console.error("Firebase 登入失敗:", error);
    }
}
initAuth();

export async function saveToCloud(data) {
    if (!auth.currentUser) {
        await signInAnonymously(auth);
    }
    const collectionRef = collection(db, "guests");
    return addDoc(collectionRef, {
        ...data,
        timestamp: serverTimestamp(),
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    });
}
