import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. ഫയർബേസ് കോൺഫിഗ്
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

// Splash Screen Removal
setTimeout(() => {
    const splash = document.getElementById('splash');
    if(splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 800);
    }
}, 2000);

// Menu Toggle
window.toggleMenu = () => {
    document.getElementById('sidebar').classList.toggle('active');
    const overlay = document.getElementById('overlay');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
};

// Navigation
window.showHome = () => {
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    document.getElementById('home-screen').classList.remove('hidden');
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
};

window.showAdminLogin = () => {
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    if (currentUser) {
        document.getElementById('admin-panel').classList.remove('hidden');
    } else {
        document.getElementById('admin-login-screen').classList.remove('hidden');
    }
    window.toggleMenu();
};

// Auth Functions
window.handleLogin = async () => {
    const inputNumber = document.getElementById('admin-email').value.trim(); 
    const fullEmail = inputNumber + "@sys.com"; 
    const pass = document.getElementById('admin-password').value;

    if(!inputNumber || !pass) {
        alert("നമ്പറും പാസ്‌വേഡും നൽകുക");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, fullEmail, pass);
        alert("ലോഗിൻ വിജയിച്ചു");
        showHome();
    } catch (e) { 
        alert("ലോഗിൻ പരാജയപ്പെട്ടു: " + e.message); 
    }
};

window.handleLogout = () => {
    signOut(auth);
    location.reload();
};

onAuthStateChanged(auth, (user) => { 
    currentUser = user; 
});

// ഡാറ്റ ലിസ്റ്റ് കാണിക്കാനുള്ള ഫംഗ്ഷൻ (Professional Look & Fix Undefined)
window.openCategory = async (catId, catName) => {
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    document.getElementById('list-screen').classList.remove('hidden');
    document.getElementById('current-cat-title').innerText = catName;
    
    const container = document.getElementById('list-container');
    container.innerHTML = "<p style='text-align:center; padding:20px;'>വിവരങ്ങൾ ശേഖരിക്കുന്നു...</p>";

    try {
        const q = query(collection(db, catId));
        const querySnapshot = await getDocs(q);
        container.innerHTML = "";
        
        if (querySnapshot.empty) {
            container.innerHTML = "<p style='text-align:center; padding:20px;'>വിവരങ്ങൾ ലഭ്യമല്ല</p>";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // "undefined" ഒഴിവാക്കാനുള്ള സുരക്ഷാ പരിശോധന
            const name = data.name || "പേര് ലഭ്യമല്ല";
            const place = data.place || "സ്ഥലം രേഖപ്പെടുത്തിയിട്ടില്ല";
            const type = data.type ? `<span class="category-tag" style="background: #e8f5e9; color: #006400; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; display: inline-block; margin-bottom: 6px;">${data.type}</span>` : "";

            container.innerHTML += `
                <div class="person-card" style="background:white; padding:16px; border-radius:15px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-left: 6px solid #006400;">
                    <div class="person-info">
                        ${type}<br>
                        <strong style="font-size:1.1rem; color:#1a1a1a;">${name}</strong><br>
                        <small style="color:#555;">📍 ${place}</small>
                        ${data.details ? `<br><small style="color:#777; font-style:italic;">ℹ️ ${data.details}</small>` : ''}
                    </div>
                    <div class="action-buttons" style="display:flex; align-items:center;">
                        <a href="tel:${data.phone}" class="call-btn" style="background:#006400; color:white !important; width:45px; height:45px; border-radius:50%; display:flex; align-items:center; justify-content:center; text-decoration:none;">📞</a>
                        ${currentUser ? `
                            <button onclick="deleteItem('${catId}', '${id}')" class="delete-btn" style="margin-left:15px; background:none; border:none; color:#ff4444; font-size:1.2rem; cursor:pointer;">🗑️</button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    } catch (e) {
        container.innerHTML = "<p style='color:red; text-align:center;'>ലോഡ് ചെയ്യുന്നതിൽ പിശക്: " + e.message + "</p>";
    }
};

// ഡിലീറ്റ് ചെയ്യാനുള്ള ഫംഗ്ഷൻ
window.deleteItem = async (catId, docId) => {
    if (confirm("ഈ വിവരം ഡിലീറ്റ് ചെയ്യട്ടെ?")) {
        try {
            await deleteDoc(doc(db, catId, docId));
            alert("വിവരം വിജയകരമായി നീക്കം ചെയ്തു");
            location.reload(); 
        } catch (e) {
            alert("Error: " + e.message);
        }
    }
};

// ഡാറ്റ സേവ് ചെയ്യാനുള്ള ഫംഗ്ഷൻ (പുതിയ ഫീൽഡുകൾ ഉൾപ്പെടുത്തിയത്)
window.handleSaveData = async () => {
    if(!currentUser) {
        alert("ലോഗിൻ ചെയ്തവർക്ക് മാത്രമേ ഡാറ്റ ചേർക്കാൻ കഴിയൂ");
        return;
    }

    const cat = document.getElementById('new-cat').value;
    const data = {
        name: document.getElementById('new-name').value,
        place: document.getElementById('new-place').value,
        phone: document.getElementById('new-phone').value,
        type: document.getElementById('new-type') ? document.getElementById('new-type').value : "",
        details: document.getElementById('new-details') ? document.getElementById('new-details').value : ""
    };

    if(!data.name || !data.phone) {
        alert("പേരും ഫോൺ നമ്പറും നിർബന്ധമാണ്");
        return;
    }

    try {
        await addDoc(collection(db, cat), data);
        alert("വിവരങ്ങൾ വിജയകരമായി ചേർത്തു!");
        
        // ബോക്സുകൾ ക്ലിയർ ചെയ്യാൻ
        document.getElementById('new-name').value = "";
        document.getElementById('new-place').value = "";
        document.getElementById('new-phone').value = "";
        if(document.getElementById('new-type')) document.getElementById('new-type').value = "";
        if(document.getElementById('new-details')) document.getElementById('new-details').value = "";
        
        showHome();
    } catch (e) { alert("Error: " + e.message); }
};
