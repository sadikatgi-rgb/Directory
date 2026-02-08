import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

// ഓരോ വിഭാഗത്തിനും ആവശ്യമായ ഫീൽഡുകൾ
const categoryConfig = {
    'auto': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'no': 'വാഹന നമ്പർ' },
    'shops': { 'name': 'കടയുടെ പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'item': 'പ്രധാന വിഭവം' },
    'workers': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'job': 'ജോലി' },
    'catering': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'specialty': 'പ്രത്യേകത' },
    'default': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ' }
};

// Splash Screen നിയന്ത്രണം
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.classList.add('hidden'), 800);
        }
    }, 2500);
});

// അഡ്മിൻ പാനലിൽ ഫീൽഡുകൾ മാറ്റാൻ
window.renderAdminFields = () => {
    const cat = document.getElementById('new-cat').value;
    const container = document.getElementById('dynamic-inputs');
    const fields = categoryConfig[cat] || categoryConfig['default'];
    container.innerHTML = ""; 
    for (let key in fields) {
        container.innerHTML += `<input type="text" id="field-${key}" placeholder="${fields[key]}">`;
    }
};

// സ്ക്രീനുകൾ ഒളിപ്പിക്കാൻ
function hideAll() {
    const screens = ['home-screen', 'content-info-screen', 'admin-login-screen', 'admin-panel', 'list-screen', 'about-app-screen', 'leaders-screen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
    const container = document.getElementById('main-container');
    if(container) container.scrollTop = 0;
}

// ഡാറ്റ സേവ് ചെയ്യാൻ
window.handleSaveData = async () => {
    const cat = document.getElementById('new-cat').value;
    const fields = categoryConfig[cat] || categoryConfig['default'];
    let dataToSave = {};

    for (let key in fields) {
        const val = document.getElementById(`field-${key}`).value;
        if (!val) { alert("എല്ലാ കോളങ്ങളും പൂരിപ്പിക്കുക!"); return; }
        dataToSave[key] = val;
    }

    try {
        await addDoc(collection(db, cat), dataToSave);
        alert("വിജയകരമായി ചേർത്തു!");
        renderAdminFields(); 
    } catch (e) { alert("Error saving data!"); }
};

// ഡിലീറ്റ് ചെയ്യാൻ
window.deleteEntry = async (catId, docId) => {
    if (confirm("ഈ വിവരം നീക്കം ചെയ്യട്ടെ?")) {
        try {
            await deleteDoc(doc(db, catId, docId));
            alert("നീക്കം ചെയ്തു!");
            showHome(); 
        } catch (e) { alert("Error deleting!"); }
    }
};

// എഡിറ്റ് ചെയ്യാൻ
window.editEntry = async (catId, docId, currentDataStr) => {
    const currentData = JSON.parse(decodeURIComponent(currentDataStr));
    const fields = categoryConfig[catId] || categoryConfig['default'];
    let newData = {};
    
    for (let key in fields) {
        const val = prompt(`${fields[key]} തിരുത്തുക:`, currentData[key] || "");
        if (val === null) return; 
        newData[key] = val;
    }

    try {
        await updateDoc(doc(db, catId, docId), newData);
        alert("വിവരങ്ങൾ പുതുക്കി!");
        showHome();
    } catch (e) { alert("Error updating!"); }
};

// കാറ്റഗറി ലിസ്റ്റ് കാണിക്കാൻ (പ്രൊഫഷണൽ ലുക്ക്)
window.openCategory = async (catId, catName) => {
    hideAll();
    const listScreen = document.getElementById('list-screen');
    listScreen.classList.remove('hidden');
    document.getElementById('current-cat-title').innerText = catName;
    const container = document.getElementById('list-container');
    container.innerHTML = "<p style='text-align:center;'>ശേഖരിക്കുന്നു...</p>";

    try {
        const querySnapshot = await getDocs(collection(db, catId));
        container.innerHTML = "";
        
        if (querySnapshot.empty) {
            container.innerHTML = "<p style='text-align:center; padding:20px;'>വിവരങ്ങൾ ലഭ്യമല്ല</p>";
            return;
        }

        querySnapshot.forEach(docSnap => {
            const d = docSnap.data();
            const id = docSnap.id;
            const dataStr = encodeURIComponent(JSON.stringify(d));
            
            // അധിക വിവരങ്ങൾ ഓട്ടോമാറ്റിക്കായി കാണിക്കുന്നു
            let extraInfo = "";
            for (let key in d) {
                if (key !== 'name' && key !== 'phone' && key !== 'place') {
                    const label = categoryConfig[catId] && categoryConfig[catId][key] ? categoryConfig[catId][key] : key;
                    extraInfo += `<small style="display:block; color:#555;"><b>${label}:</b> ${d[key]}</small>`;
                }
            }

            let adminSection = '';
            if(currentUser) {
                adminSection = `
                    <div class="admin-btns">
                        <button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button>
                        <button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button>
                    </div>`;
            }

            container.innerHTML += `
                <div class="person-card">
                    <div class="person-info">
                        <strong>${d.name}</strong>
                        <small style="display:block; margin-bottom:2px;">📍 ${d.place}</small>
                        <small style="display:block; margin-bottom:5px;">📞 ${d.phone}</small>
                        ${extraInfo}
                    </div>
                    <div class="action-buttons">
                        <a href="tel:${d.phone}" class="call-btn">📞</a>
                    </div>
                    ${adminSection}
                </div>`;
        });
    } catch (e) { container.innerHTML = "Error!"; }
};

// തിരച്ചിൽ (Search) ഫംഗ്ഷൻ
window.filterResults = () => {
    const input = document.getElementById('search-input');
    const filter = input.value.toLowerCase();
    const container = document.getElementById('list-container');
    const cards = container.getElementsByClassName('person-card');

    for (let i = 0; i < cards.length; i++) {
        const info = cards[i].getElementsByClassName('person-info')[0];
        const text = info.textContent || info.innerText;
        
        if (text.toLowerCase().indexOf(filter) > -1) {
            cards[i].style.display = ""; 
        } else {
            cards[i].style.display = "none"; 
        }
    }
};

// നാവിഗേഷൻ ഫംഗ്ഷനുകൾ
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
    if (currentUser) {
        document.getElementById('admin-panel').classList.remove('hidden');
        renderAdminFields(); 
    }
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
