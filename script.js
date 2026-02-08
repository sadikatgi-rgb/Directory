import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. ഫയർബേസ് കോൺഫിഗ് നൽകുക
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

// Splash Screen Removal
setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    setTimeout(() => document.getElementById('splash').style.display = 'none', 800);
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
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        alert("ലോഗിൻ വിജയിച്ചു");
        showHome();
    } catch (e) { alert("Error: " + e.message); }
};

window.handleLogout = () => {
    signOut(auth);
    location.reload();
};

onAuthStateChanged(auth, (user) => { currentUser = user; });

// Data Functions
window.openCategory = async (catId, catName) => {
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    document.getElementById('list-screen').classList.remove('hidden');
    document.getElementById('current-cat-title').innerText = catName;
    
    const container = document.getElementById('list-container');
    container.innerHTML = "ശേഖരിക്കുന്നു...";

    const q = query(collection(db, catId));
    const querySnapshot = await getDocs(q);
    container.innerHTML = "";
    
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        container.innerHTML += `
            <div class="person-card">
                <div>
                    <strong>${data.name}</strong><br>
                    <small>${data.place}</small>
                </div>
                <a href="tel:${data.phone}" class="call-btn">📞 വിളിക്കുക</a>
            </div>
        `;
    });
};

window.handleSaveData = async () => {
    const cat = document.getElementById('new-cat').value;
    const data = {
        name: document.getElementById('new-name').value,
        place: document.getElementById('new-place').value,
        phone: document.getElementById('new-phone').value
    };
    try {
        await addDoc(collection(db, cat), data);
        alert("വിവരങ്ങൾ ചേർത്തു!");
        showHome();
    } catch (e) { alert("Error: " + e.message); }
};
