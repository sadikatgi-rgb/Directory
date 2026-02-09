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

const categoryConfig = {
    'auto': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'no': 'വാഹന ഇനം' },
    'shops': { 'name': 'കടയുടെ പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'item': 'പ്രധാന വിഭവം' },
    'workers': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'job': 'ജോലി' },
    'catering': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'specialty': 'പ്രത്യേകത' },
    'default': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ' }
};

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
    container.innerHTML = ""; 
    for (let key in fields) {
        container.innerHTML += `<input type="text" id="field-${key}" placeholder="${fields[key]}">`;
    }
};

function hideAll() {
    const screens = ['home-screen', 'content-info-screen', 'admin-login-screen', 'admin-panel', 'list-screen', 'about-app-screen', 'leaders-screen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
    const container = document.getElementById('main-container');
    if(container) container.scrollTop = 0;
}

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

window.deleteEntry = async (catId, docId) => {
    if (confirm("ഈ വിവരം നീക്കം ചെയ്യട്ടെ?")) {
        try {
            await deleteDoc(doc(db, catId, docId));
            alert("നീക്കം ചെയ്തു!");
            showHome(); 
        } catch (e) { alert("Error deleting!"); }
    }
};

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

// അപ്ഡേറ്റ് ചെയ്ത വിഭാഗം (Professional List View)
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
            
            // മറ്റ് വിവരങ്ങൾ വേർതിരിച്ചെടുക്കുന്നു
            let extraInfo = "";
            for (let key in d) {
                if (key !== 'name' && key !== 'phone' && key !== 'place' && key !== 'no') {
                    const label = categoryConfig[catId] && categoryConfig[catId][key] ? categoryConfig[catId][key] : key;
                    extraInfo += `<small style="display:block; color:#555;"><b>${label}:</b> ${d[key]}</small>`;
                }
            }

            // ഓട്ടോ സെക്ഷൻ ആണെങ്കിൽ വാഹന നമ്പർ പ്രത്യേകം കാണിക്കുന്നു
            let vehicleDisplay = d.ty ? `വാഹന ഇനം: ${d.ty}` : "";


            let adminButtons = '';
            if(currentUser) {
                adminButtons = `
                    <div class="admin-btns" style="margin-top:10px; display:flex; gap:10px;">
                        <button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')" style="flex:1; padding:5px; background:#ffc107; border:none; border-radius:5px;">Edit</button>
                        <button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')" style="flex:1; padding:5px; background:#dc3545; color:white; border:none; border-radius:5px;">Delete</button>
                    </div>`;
            }

            // script.js-ൽ openCategory ഫംഗ്ഷനുള്ളിലെ ലിസ്റ്റ് നിർമ്മിക്കുന്ന ഭാഗം
container.innerHTML += `
    <div class="person-card">
        <div class="person-info">
            <strong><i class="fas fa-user-circle"></i> ${d.name}</strong>
            <small><i class="fas fa-map-marker-alt" style="color: #e74c3c;"></i> ${d.place}</small>
            <small><i class="fas fa-taxi" style="color: #f1c40f;"></i> ${vehicleDisplay}</small>

            ${extraInfo}
        </div>

        <div class="call-section">
            <span class="phone-number"><i class="fas fa-phone-square-alt"></i> ${d.phone}</span>
            <a href="tel:${d.phone}" class="call-btn-new">
                <i class="fas fa-phone-alt"></i>
            </a>
        </div>
        
        ${adminButtons}
    </div>`;
        });
    } catch (e) { container.innerHTML = "Error!"; console.error(e); }
};

window.filterResults = () => {
    const input = document.getElementById('search-input');
    const filter = input.value.toLowerCase();
    const container = document.getElementById('list-container');
    const cards = container.getElementsByClassName('person-card');
    for (let i = 0; i < cards.length; i++) {
        const info = cards[i].getElementsByClassName('person-info')[0];
        const text = info.textContent || info.innerText;
        cards[i].style.display = text.toLowerCase().indexOf(filter) > -1 ? "" : "none";
    }
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
