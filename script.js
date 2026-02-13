import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

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
const messaging = getMessaging(app);

let currentUser = null;

// --- വിൻഡോ ലോഡ് ചെയ്യുമ്പോൾ ---
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.classList.add('hidden'), 800);
        }
    }, 2000);

    loadScrollingNews();
    setupNotifications(); 
});

// --- നോട്ടിഫിക്കേഷൻ സെറ്റപ്പ് ---
async function setupNotifications() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            const token = await getToken(messaging, { 
                vapidKey: "BCp8wEaJUWt0OnoLetXsGnRxmjd8RRE3_hT0B9p0l_0TUCmhnsj0fYA8YBRXE_GOjG-oxNOCetPvL9ittyALAls",
                serviceWorkerRegistration: registration 
            });

            if (token) {
                // ടോക്കൺ ഉണ്ടെങ്കിൽ അത് ഡാറ്റാബേസിലേക്ക് ആഡ് ചെയ്യുന്നു/അപ്‌ഡേറ്റ് ചെയ്യുന്നു
                const tokenRef = doc(db, "fcm_tokens", token); 
                await setDoc(tokenRef, {
                    token: token,
                    timestamp: serverTimestamp(),
                    deviceInfo: navigator.userAgent
                }, { merge: true });
            }
        }
    } catch (error) {
        console.error("Notification Setup Error: ", error);
    }
}

// --- പുഷ് നോട്ടിഫിക്കേഷൻ അയക്കാൻ ---
async function sendPushNotification(title, body) {
    try {
        const tokensSnapshot = await getDocs(collection(db, "fcm_tokens"));
        const tokens = [];
        tokensSnapshot.forEach(docSnap => {
            if(docSnap.data().token) tokens.push(docSnap.data().token);
        });

        if (tokens.length === 0) return;

        await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Authorization': 'key=AIzaSyAwJCSwpj9EOd40IJrmI7drsURumljWRo8',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                registration_ids: tokens,
                notification: {
                    title: title,
                    body: body,
                    icon: "icon.png",
                    click_action: "https://sadikatgi-rgb.github.io/Directory/" 
                }
            })
        });
        console.log("Notification sent successfully");
    } catch (error) {
        console.error("Error sending notification:", error);
    }
}

// --- കാറ്റഗറി കോൺഫിഗറേഷൻ ---
const categoryConfig = {
    'auto': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'ty': 'വാഹന ഇനം' },
    'shops': { 'name': 'കടയുടെ പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'item': 'പ്രധാന വിഭവം' },
    'workers': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'job': 'ജോലി' },
    'catering': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ', 'specialty': 'പ്രത്യേകത' },
    'admins': { 'name': 'അഡ്മിൻ പേര്', 'phone': 'ഫോൺ നമ്പർ' }, 
    'announcements': { 'name': 'വിഷയം (Heading)', 'description': 'വിവരണം (Details)' },
    'default': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ' }
};

async function loadScrollingNews() {
    try {
        const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        const ticker = document.getElementById('latest-news');
        if (!querySnapshot.empty) {
            const lastDoc = querySnapshot.docs[0].data();
            if(ticker) ticker.innerText = `${lastDoc.name}: ${lastDoc.description}`;
        }
    } catch (e) { console.error("News Load Error:", e); }
}

function hideAll() {
    const screens = ['home-screen', 'content-info-screen', 'admin-login-screen', 'admin-panel', 'list-screen', 'about-app-screen', 'leaders-screen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
}

window.showHome = () => {
    hideAll();
    document.getElementById('home-screen').classList.remove('hidden');
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.remove('active');
    const overlay = document.getElementById('overlay');
    if(overlay) overlay.style.display = 'none';
};

window.toggleMenu = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if(sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.style.display = 'none';
    } else {
        sidebar.classList.add('active');
        overlay.style.display = 'block';
    }
};

window.openCategory = async (catId, catName) => {
    hideAll();
    document.getElementById('list-screen').classList.remove('hidden');
    document.getElementById('current-cat-title').innerText = catName;
    const container = document.getElementById('list-container');
    container.innerHTML = "<p style='text-align:center;'>ശേഖരിക്കുന്നു...</p>";

    try {
        let q;
        if(catId === 'announcements' || catId === 'admins') {
            q = query(collection(db, catId), orderBy('timestamp', 'desc'));
        } else {
            q = query(collection(db, catId));
        }

        const querySnapshot = await getDocs(q);
        container.innerHTML = "";

        if (catId === 'admins') {
            container.innerHTML += `<div class="blink-text">" പ്രധാന അറിയിപ്പുകൾ അറിയിക്കാൻ അഡ്മിന്മാരുമായി ബന്ധപ്പെടുക "</div>`;
        }
        
        if (querySnapshot.empty) {
            container.innerHTML += "<p style='text-align:center; padding:20px;'>വിവരങ്ങൾ ലഭ്യമല്ല</p>";
            return;
        }

        querySnapshot.forEach(docSnap => {
            const d = docSnap.data();
            const id = docSnap.id;
            const dataStr = encodeURIComponent(JSON.stringify(d));
            let displayHTML = "";

            if (catId === 'announcements') {
                displayHTML = `<div class="person-card" style="border-left: 5px solid #ffeb33;"><div class="person-info"><strong>${d.name}</strong><p>${d.description}</p></div>${currentUser ? `<button onclick="deleteEntry('${catId}', '${id}')">Delete</button>` : ""}</div>`;
            } else {
                displayHTML = `<div class="person-card"><div><strong>${d.name}</strong><p>${d.place || ''}</p></div><a href="tel:${d.phone}" class="call-btn-new">കോൾ</a></div>`;
            }
            container.innerHTML += displayHTML;
        });
    } catch (e) { container.innerHTML = "<p>Error loading data.</p>"; }
};

window.renderAdminFields = () => {
    const cat = document.getElementById('new-cat').value;
    const container = document.getElementById('dynamic-inputs');
    const fields = categoryConfig[cat] || categoryConfig['default'];
    container.innerHTML = ""; 
    for (let key in fields) {
        container.innerHTML += `<input type="text" id="field-${key}" placeholder="${fields[key]}">`;
    }
};

window.handleSaveData = async () => {
    const cat = document.getElementById('new-cat').value;
    const fields = categoryConfig[cat] || categoryConfig['default'];
    let dataToSave = { timestamp: serverTimestamp() }; 
    
    for (let key in fields) {
        const val = document.getElementById(`field-${key}`).value;
        if (!val) { alert("എല്ലാ കോളങ്ങളും പൂരിപ്പിക്കുക!"); return; }
        dataToSave[key] = val;
    }

    try {
        await addDoc(collection(db, cat), dataToSave);
        if (cat === 'announcements') {
            await sendPushNotification(dataToSave.name, dataToSave.description);
            loadScrollingNews();
        }
        alert("വിജയകരമായി ചേർത്തു!");
        renderAdminFields(); 
    } catch (e) { alert("Error saving data!"); }
};

window.showAdminLogin = () => { 
    hideAll(); 
    if (currentUser) {
        document.getElementById('admin-panel').classList.remove('hidden');
        renderAdminFields(); 
    }
    else document.getElementById('admin-login-screen').classList.remove('hidden');
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

window.showContentPage = () => { hideAll(); document.getElementById('content-info-screen').classList.remove('hidden'); toggleMenu(); };
window.showAboutApp = () => { hideAll(); document.getElementById('about-app-screen').classList.remove('hidden'); toggleMenu(); };
window.showLeaders = () => { hideAll(); document.getElementById('leaders-screen').classList.remove('hidden'); toggleMenu(); };

// --- സർവീസ് വർക്കർ രജിസ്ട്രേഷൻ ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('firebase-messaging-sw.js')
            .then(reg => {
                console.log('Service Worker registered', reg);
            })
            .catch(err => {
                console.error('Service Worker registration failed', err);
            });
    });
}
