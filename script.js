import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAwJCSwpj9EOd40IJrmI7drsURumljWRo8",
    authDomain: "directory-f4474.firebaseapp.com",
    projectId: "directory-f4474",
    storageBucket: "directory-f4474.firebasestorage.app",
    messagingSenderId: "681119733857",
    appId: "1:681119733857:web:e77d5ab9571a35aff1f220"
};
// ഓരോ വിഭാഗത്തിനും ആവശ്യമായ ഫീൽഡുകൾ ഇവിടെ നൽകാം
const categoryConfig = {
    'auto': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'no': 'വാഹന നമ്പർ' },
    'shops': { 'name': 'കടയുടെ പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'item': 'പ്രധാന വിഭവം' },
    'workers': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'job': 'ജോലി' },
    'default': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ' } // മറ്റുള്ളവയ്ക്ക്
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

// Splash Screen
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.classList.add('hidden'), 800);
        }
    }, 2500);
});
window.renderAdminFields = () => {
    const cat = document.getElementById('new-cat').value;
    const container = document.getElementById('dynamic-inputs');
    const fields = categoryConfig[cat] || categoryConfig['default'];
    
    container.innerHTML = ""; // പഴയവ ക്ലിയർ ചെയ്യുന്നു
    
    for (let key in fields) {
        container.innerHTML += `<input type="text" id="field-${key}" placeholder="${fields[key]}">`;
    }
};

// എല്ലാ സ്ക്രീനുകളും ഒളിപ്പിക്കാനും സ്ക്രോൾ ടോപ്പിലേക്ക് മാറ്റാനുമുള്ള ഫംഗ്‌ഷൻ
function hideAll() {
    const screens = ['home-screen', 'content-info-screen', 'admin-login-screen', 'admin-panel', 'list-screen', 'about-app-screen', 'leaders-screen'];
    
    screens.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
    
    // പേജ് മാറുമ്പോൾ സ്ക്രോൾ ഏറ്റവും മുകളിലേക്ക് പോകാൻ ഇത് സഹായിക്കും
    const container = document.getElementById('main-container');
    if(container) {
        container.scrollTop = 0;
    }
}

window.editEntry = async (catId, docId, currentData) => {
    const fields = categoryConfig[catId] || categoryConfig['default'];
    let newData = {};
    
    for (let key in fields) {
        // പഴയ വിവരം കാണിച്ചുകൊണ്ട് പുതിയത് ചോദിക്കുന്നു
        const val = prompt(`${fields[key]} തിരുത്തുക:`, currentData[key] || "");
        if (val === null) return; // Cancel ചെയ്താൽ നിർത്തും
        newData[key] = val;
    }

    try {
        await updateDoc(doc(db, catId, docId), newData);
        alert("വിവരങ്ങൾ പുതുക്കി!");
        openCategory(catId, document.getElementById('current-cat-title').innerText);
    } catch (e) { alert("Error updating!"); }
};


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

window.showContentPage = () => { hideAll(); document.getElementById('content-info-screen').classList.remove('hidden'); toggleMenu(); };
window.showAboutApp = () => { hideAll(); document.getElementById('about-app-screen').classList.remove('hidden'); toggleMenu(); };
window.showLeaders = () => { hideAll(); document.getElementById('leaders-screen').classList.remove('hidden'); toggleMenu(); };
window.showAdminLogin = () => { 
    hideAll(); 
    if (currentUser) document.getElementById('admin-panel').classList.remove('hidden');
    else document.getElementById('admin-login-screen').classList.remove('hidden');
    toggleMenu(); 
};

window.handleLogin = async () => {
    const id = document.getElementById('admin-email').value.trim();
    const pass = document.getElementById('admin-password').value;
    try {
        await signInWithEmailAndPassword(auth, id + "@sys.com", pass);
        alert("ലോഗിൻ വിജയിച്ചു!");
        showHome();
    } catch (e) { alert("തെറ്റായ വിവരം!"); }
};

window.handleLogout = () => { signOut(auth); location.reload(); };

onAuthStateChanged(auth, (user) => { currentUser = user; });

window.openCategory = async (catId, catName) => {
    hideAll();
    const listScreen = document.getElementById('list-screen');
    listScreen.classList.remove('hidden');
    document.getElementById('current-cat-title').innerText = catName;
    const container = document.getElementById('list-container');
    container.innerHTML = "ശേഖരിക്കുന്നു...";

    try {
        const querySnapshot = await getDocs(collection(db, catId));
        container.innerHTML = "";
        if (querySnapshot.empty) container.innerHTML = "വിവരങ്ങളില്ല";
        querySnapshot.forEach(docSnap => {
            const d = docSnap.data();
            container.innerHTML += `
                <div class="person-card">
                    <div class="person-info">
                        <strong>${d.name}</strong><br><small>${d.place}</small>
                    </div>
                    <div class="action-buttons">
                        <a href="tel:${d.phone}" class="call-btn">📞</a>
                    </div>
                </div>`;
        });
    } catch (e) { container.innerHTML = "Error!"; }
};
