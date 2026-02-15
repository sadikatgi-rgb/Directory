// 1. ഫയർബേസ് ഇംപോർട്ടുകൾ
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

// 2. ഫയർബേസ് കോൺഫിഗറേഷൻ
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
window.addEventListener('load', () => {
    setupNotifications();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('firebase-messaging-sw.js')
            .then(reg => console.log('SW Registered'))
            .catch(err => console.error('SW Failed', err));
    }

    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
                splash.classList.add('hidden');
                loadScrollingNews(); 
            }, 500);
        }
    }, 2000); 
});

// --- വാർത്തകൾ ലോഡ് ചെയ്യാൻ ---
function loadScrollingNews() {
    try {
        const tickerContainer = document.getElementById('latest-news');
        if (!tickerContainer) return;

        const newsRef = collection(db, 'announcements');
        onSnapshot(newsRef, (querySnapshot) => {
            if (!querySnapshot.empty) {
                let newsItems = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.name) {
                        newsItems.push(`
                            📢 <span style="color: #b71c1c; font-weight: 950; font-size: 18px;">അറിയിപ്പ്: ${data.name}</span> 
                            &nbsp;&nbsp;
                            <span style="color: #000; font-weight: 700; font-size: 16px;">${data.description || ""}</span>
                        `);
                    }
                });
                newsItems.reverse();
                const separator = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                const fullNewsText = newsItems.join(separator);
                tickerContainer.innerHTML = `
                    <div class="news-ticker-scroll" style="display: inline-block; white-space: nowrap;">
                        <span>${fullNewsText}</span>
                        ${separator}
                        <span>${fullNewsText}</span>
                    </div>
                `;
            } else {
                tickerContainer.innerHTML = "അറിയിപ്പുകൾ ലഭ്യമല്ല";
            }
        });
    } catch (e) { console.error("News Error:", e); }
}

// --- കാറ്റഗറി കോൺഫിഗറേഷൻ ---
const categoryConfig = {
    'auto': { 'name': 'ഡ്രൈവർ പേര്', 'ty': 'വാഹന ഇനം', 'category': 'വാഹന വിഭാഗം', 'place': 'സ്ഥലം', 'phone': 'മൊബൈൽ', 'time': 'സമയം', 'leave': 'അവധി' },
    'shops': { 'item': 'ഇനം', 'name': 'കടയുടെ പേര്', 'time': 'സമയം', 'place': 'സ്ഥലം', 'owner': 'ഓണർ പേര്', 'phone': 'മൊബൈൽ', 'off': 'അവധി' },
    'workers': { 'category': 'വിഭാഗം', 'name': 'പേര്', 'phone': 'മൊബൈൽ', 'place': 'സ്ഥലം', 'time': 'സമയം', 'off': 'അവധി' },
    'catering': { 'name': 'പണ്ടാരിയുടെ പേര്','place': 'സ്ഥലം','phone': 'ഫോൺ നമ്പർ','catering': 'കാറ്ററിങ്','party_order': 'പാർട്ടി ഓർഡർ' },
    'travels': { 'vname': 'വാഹനത്തിന്റെ പേര്', 'oname': 'ഓണറുടെ പേര്', 'phone': 'മൊബൈൽ', 'place': 'സ്ഥലം', 'vtype': 'വാഹന ഇനം', 'seat': 'സീറ്റ് നില' },
    'institutions': { 'name': 'സ്ഥാപനത്തിന്റെ പേര്', 'place': 'സ്ഥലം', 'type': 'ഇനം', 'manager': 'മേധാവി', 'phone': 'മൊബൈൽ' },
    'professionals': { 'category': 'വിഭാഗം', 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'മൊബൈൽ നമ്പർ', 'home': 'നാട്', 'work': 'ജോലിസ്ഥലം' },
    'representatives': { 'name': 'പേര്', 'ward': 'വാർഡ്', 'ward_no': 'വാർഡ് നമ്പർ', 'position': 'സ്ഥാനം', 'phone': 'മൊബൈൽ' },
    'help_centers': { 'type': 'ഇനം', 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'മൊബൈൽ നമ്പർ', 'time': 'സമയം', 'off': 'അവധി' },
    'announcements': { 'name': 'വിഷയം', 'description': 'വിവരണം' },
    'admins': { 'name': 'പേര്', 'phone': 'മൊബൈൽ', 'place': 'സ്ഥലം' },
    'default': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ' }
};

// --- നാവിഗേഷൻ ഫങ്ക്ഷനുകൾ ---
function hideAll() {
    ['home-screen', 'content-info-screen', 'admin-login-screen', 'admin-panel', 'list-screen', 'about-app-screen', 'leaders-screen'].forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
}

window.showHome = () => {
    hideAll();
    const home = document.getElementById('home-screen');
    if(home) home.classList.remove('hidden');
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.remove('active');
    const overlay = document.getElementById('overlay');
    if(overlay) overlay.style.display = 'none';
};

window.toggleMenu = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('active');
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
};

// --- കാറ്റഗറി തുറക്കാൻ ---
window.openCategory = async (catId, catName) => {
    hideAll();
    document.getElementById('list-screen').classList.remove('hidden');
    document.getElementById('current-cat-title').innerText = catName;
    const container = document.getElementById('list-container');
    container.innerHTML = "<p style='text-align:center;'>ശേഖരിക്കുന്നു...</p>";

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.style.display = (catId === 'admins' || catId === 'announcements') ? 'none' : 'block';
        searchInput.value = ""; 
    }

    try {
        let q = (catId === 'announcements' || catId === 'admins') ? query(collection(db, catId), orderBy('timestamp', 'desc')) : query(collection(db, catId));
        const querySnapshot = await getDocs(q);
        container.innerHTML = "";

        if (catId === 'admins') container.innerHTML += `<div class="blink-text">" അഡ്മിന്മാരുമായി ബന്ധപ്പെടുക "</div>`;
        if (querySnapshot.empty) { container.innerHTML += "<p style='text-align:center; padding:20px;'>ലഭ്യമല്ല</p>"; return; }

        querySnapshot.forEach(docSnap => {
            const d = docSnap.data();
            const id = docSnap.id;
            const dataStr = encodeURIComponent(JSON.stringify(d));
            let displayHTML = "";

            if (catId === 'announcements') {
                displayHTML = `<div class="announcement-card"><div class="announcement-title">📢 ${d.name}</div><div class="announcement-desc">${d.description}</div>${currentUser ? `<div class="admin-btns"><button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button><button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button></div>` : ""}</div>`;
            } else if (catId === 'admins') {
                displayHTML = `<div class="person-card"><div class="person-info"><strong><i class="fas fa-user-shield"></i> ${d.name}</strong><small>${d.phone}</small><small>${d.place || ""}</small></div><div class="call-section"><a href="tel:${d.phone}" class="call-btn-new">കോൾ</a></div></div>`;
            } else {
                let extraInfo = "";
                for (let key in d) {
                    if (!['name', 'phone', 'place', 'ty', 'no', 'timestamp', 'time', 'leave', 'off'].includes(key)) {
                        const label = categoryConfig[catId] && categoryConfig[catId][key] ? categoryConfig[catId][key] : key;
                        extraInfo += `<p style="margin:2px 0; font-size:15px; color:#555;"><b>${label}:</b> ${d[key]}</p>`;
                    }
                }
                displayHTML = `
                <div class="person-card">
                    <div class="person-info">
                        <strong style="font-size:19px; color:#004d00; display:block;"><i class="fas fa-user-circle"></i> ${d.name}</strong>
                        ${d.place ? `<p style="margin:3px 0; color:#333; font-weight:700;"><i class="fas fa-map-marker-alt" style="color:#d9534f;"></i> ${d.place}</p>` : ""}
                        ${d.time ? `<p style="margin:3px 0; color:#007bff; font-weight:800;"><i class="fas fa-clock"></i> സമയം: ${d.time}</p>` : ""}
                        ${(d.leave || d.off) ? `<p style="margin:3px 0; color:#b71c1c; font-weight:800;"><i class="fas fa-calendar-times"></i> അവധി: ${d.leave || d.off}</p>` : ""}
                        ${extraInfo}
                    </div>
                    <div class="call-section"><a href="tel:${d.phone}" class="call-btn-new">കോൾ</a></div>
                    ${currentUser ? `<div class="admin-btns"><button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button><button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button></div>` : ""}
                </div>`;
            }
            container.innerHTML += displayHTML;
        });
    } catch (e) { console.error("Error:", e); }
};

// --- അഡ്മിൻ ലോജിക് ---
window.handleLogin = async () => {
    const id = document.getElementById('admin-email').value.trim();
    const pass = document.getElementById('admin-password').value;
    try {
        await signInWithEmailAndPassword(auth, id + "@sys.com", pass);
        alert("Success!"); showHome();
    } catch (e) { alert("Error!"); }
};

window.handleLogout = () => { signOut(auth); location.reload(); };
onAuthStateChanged(auth, (user) => { currentUser = user; });

// --- മറ്റു ഫങ്ക്ഷനുകൾ ---
window.showAdminLogin = () => { hideAll(); currentUser ? document.getElementById('admin-panel').classList.remove('hidden') : document.getElementById('admin-login-screen').classList.remove('hidden'); toggleMenu(); };
window.showAboutApp = () => { hideAll(); document.getElementById('about-app-screen').classList.remove('hidden'); toggleMenu(); };
window.showLeaders = () => { hideAll(); document.getElementById('leaders-screen').classList.remove('hidden'); toggleMenu(); };
window.showContentPage = () => { hideAll(); document.getElementById('content-info-screen').classList.remove('hidden'); toggleMenu(); };

// --- വാട്‌സാപ്പ് ---
window.goToWhatsApp = (phone) => {
    const clean = phone.replace(/\D/g, '');
    window.location.assign(`whatsapp://send?phone=91${clean}`);
};

// --- നോട്ടിഫിക്കേഷൻ ---
async function setupNotifications() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const reg = await navigator.serviceWorker.ready;
            const token = await getToken(messaging, { vapidKey: "BCp8wEaJUWt0OnoLetXsGnRxmjd8RRE3_hT0B9p0l_0TUCmhnsj0fYA8YBRXE_GOjG-oxNOCetPvL9ittyALAls", serviceWorkerRegistration: reg });
            if (token) localStorage.setItem('fcm_token', token);
        }
    } catch (e) { console.error(e); }
}

// അവസാനമായി വാർത്തകൾ പ്രവർത്തിപ്പിക്കുന്നു
loadScrollingNews();
