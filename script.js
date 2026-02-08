import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

// Auth Functions (നമ്പർ മാത്രം നൽകിയാൽ മതിയാകുന്ന രീതിയിൽ മാറ്റിയത്)
window.handleLogin = async () => {
    const inputNumber = document.getElementById('admin-email').value.trim(); 
    const fullEmail = inputNumber + "@sys.com"; // കോഡ് തന്നെ @sys.com ചേർക്കുന്നു
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
    // ലോഗിൻ ചെയ്തിട്ടുണ്ടെങ്കിൽ അഡ്മിൻ ബട്ടൺ ഹൈലൈറ്റ് ചെയ്യാം
});

// Data Functions
window.openCategory = async (catId, catName) => {
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    document.getElementById('list-screen').classList.remove('hidden');
    document.getElementById('current-cat-title').innerText = catName;
    
    const container = document.getElementById('list-container');
    container.innerHTML = "<p style='text-align:center'>ശേഖരിക്കുന്നു...</p>";

    try {
        const q = query(collection(db, catId));
        const querySnapshot = await getDocs(q);
        container.innerHTML = "";
        
        if (querySnapshot.empty) {
            container.innerHTML = "<p style='text-align:center'>വിവരങ്ങൾ ലഭ്യമല്ല</p>";
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            container.innerHTML += `
                <div class="person-card">
                    <div>
                        <strong>${data.name}</strong><br>
                        <small>${data.place || ''}</small>
                    </div>
                    <a href="tel:${data.phone}" class="call-btn">📞 വിളിക്കുക</a>
                </div>
            `;
        });
    } catch (e) {
        container.innerHTML = "<p style='color:red'>ഡാറ്റ ലോഡ് ചെയ്യുന്നതിൽ പിശക് സംഭവിച്ചു.</p>";
    }
};

window.handleSaveData = async () => {
    if(!currentUser) {
        alert("ലോഗിൻ ചെയ്തവർക്ക് മാത്രമേ ഡാറ്റ ചേർക്കാൻ കഴിയൂ");
        return;
    }

    const cat = document.getElementById('new-cat').value;
    const data = {
        name: document.getElementById('new-name').value,
        place: document.getElementById('new-place').value,
        phone: document.getElementById('new-phone').value
    };

    if(!data.name || !data.phone) {
        alert("പേരും ഫോൺ നമ്പറും നിർബന്ധമാണ്");
        return;
    }

    try {
        await addDoc(collection(db, cat), data);
        alert("വിവരങ്ങൾ വിജയകരമായി ചേർത്തു!");
        // ഫോം ക്ലിയർ ചെയ്യാൻ
        document.getElementById('new-name').value = "";
        document.getElementById('new-place').value = "";
        document.getElementById('new-phone').value = "";
        showHome();
    } catch (e) { alert("Error: " + e.message); }
};
