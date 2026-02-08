import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAwJCSwpj9EOd40IJrmI7drsURumljWRo8",
    authDomain: "directory-f4474.firebaseapp.com",
    projectId: "directory-f4474",
    storageBucket: "directory-f4474.firebasestorage.app",
    messagingSenderId: "681119733857",
    appId: "1:681119733857:web:e77d5ab9571a35aff1f220"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let allCategoryData = []; 

// സ്പ്ലാഷ് സ്ക്രീൻ മാറ്റാൻ
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.classList.add('hidden'), 800);
        }
    }, 2500);
});

// സ്ക്രീനുകൾ മാറ്റാനുള്ള ഫംഗ്ഷൻ
function hideAll() {
    const screens = ['home-screen', 'content-info-screen', 'admin-login-screen', 'admin-panel', 'list-screen', 'about-app-screen', 'leaders-screen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
}

window.toggleMenu = () => {
    document.getElementById('sidebar').classList.toggle('active');
    const overlay = document.getElementById('overlay');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
};

window.showHome = () => {
    hideAll();
    document.getElementById('home-screen').classList.remove('hidden');
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
};

window.showContentPage = () => {
    hideAll();
    document.getElementById('content-info-screen').classList.remove('hidden');
    window.toggleMenu();
};

window.showAdminLogin = () => {
    hideAll();
    if (currentUser) {
        document.getElementById('admin-panel').classList.remove('hidden');
    } else {
        document.getElementById('admin-login-screen').classList.remove('hidden');
    }
    window.toggleMenu();
};

window.showAboutApp = () => {
    hideAll();
    document.getElementById('about-app-screen').classList.remove('hidden');
    window.toggleMenu();
};

window.showLeaders = () => {
    hideAll();
    document.getElementById('leaders-screen').classList.remove('hidden');
    window.toggleMenu();
};

// ലോഗിൻ
window.handleLogin = async () => {
    const id = document.getElementById('admin-email').value.trim();
    const pass = document.getElementById('admin-password').value;
    try {
        await signInWithEmailAndPassword(auth, id + "@sys.com", pass);
        alert("വിജയിച്ചു!");
        window.showHome();
    } catch (e) { alert("തെറ്റായ വിവരം!"); }
};

window.handleLogout = () => { signOut(auth); location.reload(); };

onAuthStateChanged(auth, (user) => { 
    currentUser = user; 
    if(user) document.getElementById('user-display-id').innerText = "Admin: " + user.email.split('@')[0];
});

// കാറ്റഗറി ലിസ്റ്റ് ലോഡിംഗ്
let currentCatID = "";
window.openCategory = async (catId, catName) => {
    currentCatID = catId;
    hideAll();
    document.getElementById('list-screen').classList.remove('hidden');
    document.getElementById('current-cat-title').innerText = catName;
    const container = document.getElementById('list-container');
    container.innerHTML = "ശേഖരിക്കുന്നു...";

    try {
        const querySnapshot = await getDocs(collection(db, catId));
        allCategoryData = [];
        querySnapshot.forEach(docSnap => allCategoryData.push({ id: docSnap.id, data: docSnap.data() }));
        renderList(allCategoryData, container, catId);
    } catch (e) { container.innerHTML = "Error!"; }
};

function renderList(items, container, catId) {
    container.innerHTML = items.length === 0 ? "വിവരങ്ങളില്ല" : "";
    items.forEach(item => {
        const d = item.data;
        container.innerHTML += `
            <div class="person-card">
                <div class="person-info">
                    <strong>${d.name}</strong><br><small>${d.place}</small>
                </div>
                <div class="action-buttons">
                    <a href="tel:${d.phone}" class="call-btn">📞</a>
                    ${currentUser ? `<button onclick="deleteItem('${catId}', '${item.id}')">🗑️</button>` : ''}
                </div>
            </div>`;
    });
}

window.closeEditModal = () => document.getElementById('edit-modal').classList.add('hidden');

window.handleSaveData = async () => {
    const cat = document.getElementById('new-cat').value;
    const data = {
        name: document.getElementById('new-name').value,
        place: document.getElementById('new-place').value,
        phone: document.getElementById('new-phone').value,
        type: document.getElementById('new-type').value,
        details: document.getElementById('new-details').value
    };
    await addDoc(collection(db, cat), data);
    alert("സേവ് ചെയ്തു!");
    window.showHome();
};
