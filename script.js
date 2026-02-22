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
                    if (data.name && data.name.trim() !== "") {
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
    } catch (e) { console.error("News Load Error:", e); }
}

// --- കാറ്റഗറി കോൺഫിഗറേഷൻ ---
const categoryConfig = {
    'auto': { 'name': 'ഡ്രൈവർ പേര്', 'ty': 'വാഹന ഇനം', 'category': 'വാഹന വിഭാഗം', 'place': 'സ്ഥലം', 'phone': 'മൊബൈൽ', 'time': 'സമയം', 'leave': 'അവധി' },
    'shops': { 'item': 'ഇനം', 'name': 'കടയുടെ പേര്', 'time': 'സമയം', 'place': 'സ്ഥലം', 'owner': 'ഓണർ പേര്', 'phone': 'മൊബൈൽ', 'off': 'അവധി' },
    'workers': { 'category': 'വിഭാഗം', 'name': 'പേര്', 'phone': 'മൊബൈൽ', 'place': 'സ്ഥലം', 'time': 'സമയം', 'off': 'അവധി' },
    'catering': { 'name': 'പണ്ടാриയുടെ പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ നമ്പർ', 'catering': 'കാറ്ററിങ്', 'party_order': 'പാർട്ടി ഓർഡർ' },
    'travels': { 'vname': 'വാഹനത്തിന്റെ പേര്', 'oname': 'ഓണറുടെ പേര്', 'phone': 'മൊബൈൽ', 'place': 'സ്ഥലം', 'vtype': 'വാഹന ഇനം', 'seat': 'സീറ്റ് നില' },
    'institutions': { 'name': 'സ്ഥാപനത്തിന്റെ പേര്', 'place': 'സ്ഥലം', 'type': 'ഇനം', 'manager': 'മേധാവി', 'phone': 'മൊബൈൽ' },
    'professionals': { 'category': 'വിഭാഗം', 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'മൊബൈൽ നമ്പർ', 'home': 'നാട്', 'work': 'ജോലിസ്ഥലം' },
    'representatives': { 'name': 'പേര്', 'ward': 'വാർഡ്', 'ward_no': 'വാർഡ് നമ്പർ', 'position': 'സ്ഥാനം', 'phone': 'മൊബൈൽ' },
    'help_centers': { 'type': 'ഇനം', 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'മൊബൈൽ നമ്പർ', 'time': 'സമയം', 'off': 'അവധി' },
    'announcements': { 'name': 'വിഷയം', 'description': 'വിവരണം' },
    'admins': { 'name': 'പേര്', 'phone': 'മൊബൈൽ', 'place': 'സ്ഥലം' },
    'default': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ' }
};

// --- നാവിഗേഷൻ ---
function hideAll() {
    const screens = ['home-screen', 'content-info-screen', 'admin-login-screen', 'admin-panel', 'list-screen', 'about-app-screen', 'leaders-screen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
}

Window.showHome = () => {
    hideAll(); 
    const home = document.getElementById('home-screen');
    if(home) home.classList.remove('hidden');
    
    // ഐക്കണുകൾ കൃത്യമായി നിയന്ത്രിക്കാൻ
    const backBtn = document.getElementById('header-back-btn');
    const menuIcon = document.getElementById('main-menu-icon');
    
    if(backBtn) backBtn.style.display = 'none'; // ഹോമിൽ അമ്പ് വേണ്ട
    if(menuIcon) menuIcon.style.display = 'flex'; // ഹോമിൽ മെനു വേണം
    
    document.getElementById('main-header-title').innerText = "വിഭവ ഡയറക്ടറി";

    // സൈഡ്ബാർ ക്ലോസ് ചെയ്യുന്നു
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

// --- കാറ്റഗറി ലിസ്റ്റ് കാണിക്കാൻ ---
window.openCategory = async (catId, catName) => {
    hideAll();
    document.getElementById('list-screen').classList.remove('hidden');
    
    // ഹെഡർ മാറ്റങ്ങൾ
    document.getElementById('main-menu-icon').style.display = 'none';  
    document.getElementById('header-back-btn').style.display = 'block'; 
    document.getElementById('main-header-title').innerText = catName;
    const container = document.getElementById('list-container');
    container.innerHTML = "<p style='text-align:center;'>ശേഖരിക്കുന്നു...</p>";
    
    try {
        let q = (catId === 'announcements' || catId === 'admins') ? query(collection(db, catId), orderBy('timestamp', 'desc')) : query(collection(db, catId));
        const querySnapshot = await getDocs(q);
        container.innerHTML = "";

        if (catId === 'admins') {
            container.innerHTML += `<div class="blink-text">" പ്രധാന അറിയിപ്പുകൾ അറിയിക്കാൻ, വിവരങ്ങൾ ആഡ് ചെയ്യാൻ, മാറ്റങ്ങൾ വരുത്താൻ, അഡ്മിന്മാരുമായി ബന്ധപ്പെടുക "</div>`;
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
                displayHTML = `<div class="announcement-card"><div class="announcement-title">📢 ${d.name}</div><div class="announcement-desc">${d.description}</div>${currentUser ? `<div class="admin-btns"><button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button><button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button></div>` : ""}</div>`;
            } else if (catId === 'admins') {
    displayHTML = `
    <div class="person-card">
        <div class="person-info">
            <strong><i class="fas fa-user-shield"></i> ${d.name}</strong>
            <p><i class="fas fa-phone-alt"></i> ${d.phone}</p>
            <p><i class="fas fa-map-marker-alt" style="color: #d32f2f;"></i> ${d.place || "സ്ഥലം ലഭ്യമല്ല"}</p>
        </div>
        <div class="call-section">
            <a href="tel:${d.phone}" class="call-btn-new"><i class="fas fa-phone"></i> കോൾ</a>
            <a href="javascript:void(0)" onclick="goToWhatsApp('${d.phone}')" class="whatsapp-btn-new"><i class="fab fa-whatsapp"></i> Chat</a>
        </div>
        ${currentUser ? `<div class="admin-btns"><button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button><button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button></div>` : ""}
    </div>`;
                
            } else {
                let extraInfo = "";
                for (let key in d) {
                    if (!['name', 'phone', 'place', 'ty', 'no', 'timestamp', 'time', 'leave', 'off'].includes(key)) { 
                        const label = categoryConfig[catId] && categoryConfig[catId][key] ? categoryConfig[catId][key] : key;
                        extraInfo += `<p style="margin: 5px 0; color: #444; font-size: 16px; font-weight: 700;"><b>${label}:</b> ${d[key]}</p>`;
                    }
                }
                displayHTML = `
                <div class="person-card">
                    <div class="person-info">
                        <strong style="font-size: 20px; color: #004d00; font-weight: 950; display: block; margin-bottom: 5px;"><i class="fas fa-user-circle"></i> ${(catId === 'travels' ? d.oname : d.name) || "പേര് ലഭ്യമല്ല"}</strong>   
                        ${d.place ? `<p style="margin: 5px 0; color: #333; font-size: 17px; font-weight: 700;"><i class="fas fa-map-marker-alt" style="color: #d9534f;"></i> ${d.place}</p>` : ""}
                        ${d.time ? `<p style="margin: 5px 0; color: #007bff; font-size: 16px; font-weight: 800;"><i class="fas fa-clock"></i> സമയം: ${d.time}</p>` : ""}
                        ${(d.leave || d.off) ? `<p style="margin: 5px 0; color: #b71c1c; font-size: 16px; font-weight: 800;"><i class="fas fa-calendar-times"></i> അവധി: ${d.leave || d.off}</p>` : ""}
                        <div style="margin-top: 5px;">${extraInfo}</div>
                    </div>
                    <div class="call-section"><a href="tel:${d.phone}" class="call-btn-new">കോൾ</a></div>
                    ${currentUser ? `<div class="admin-btns"><button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button><button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button></div>` : ""}
                </div>`;
            }
            container.innerHTML += displayHTML;
        });
    } catch (e) { console.error("Open Category Error:", e); }
};

// --- അഡ്മിൻ പാനൽ ഫീൽഡുകൾ ---
window.renderAdminFields = () => {
    const cat = document.getElementById('new-cat').value;
    const container = document.getElementById('dynamic-inputs');
    if (!container) return;
    const fields = categoryConfig[cat] || categoryConfig['default'];
    container.innerHTML = ""; 
    for (let key in fields) {
        if(key === 'description') {
            container.innerHTML += `<textarea id="field-${key}" placeholder="${fields[key]}" style="width:100%; height:80px; margin-bottom:10px; padding:8px; border-radius:5px; border:1px solid #ccc;"></textarea>`;
        } else {
            container.innerHTML += `<input type="text" id="field-${key}" placeholder="${fields[key]}" style="width:100%; margin-bottom:10px; padding:8px; border-radius:5px; border:1px solid #ccc; display:block;">`;
        }
    }
};

// --- ഡാറ്റ സേവ് ചെയ്യുക ---
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
        alert("വിജയകരമായി ചേർത്തു!");
        renderAdminFields();
    } catch (e) { alert("Error saving data!"); }
};

// --- തിരുത്തലുകൾ ---
window.editEntry = async (catId, docId, currentDataStr) => {
    const currentData = JSON.parse(decodeURIComponent(currentDataStr));
    const fields = categoryConfig[catId] || categoryConfig['default'];
    let newData = { timestamp: serverTimestamp() }; 
    for (let key in fields) {
        const val = prompt(`${fields[key]} തിരുത്തുക:`, currentData[key] || "");
        if (val === null) return; 
        newData[key] = val;
    }
    try {
        await updateDoc(doc(db, catId, docId), newData);
        alert("വിവരങ്ങൾ പുതുക്കി!");
        openCategory(catId, document.getElementById('main-header-title').innerText);
    } catch (e) { alert("Error updating!"); }
};

// --- നീക്കം ചെയ്യൽ ---
window.deleteEntry = async (catId, docId) => {
    if (confirm("ഈ വിവരം നീക്കം ചെയ്യട്ടെ?")) {
        try {
            await deleteDoc(doc(db, catId, docId));
            alert("നീക്കം ചെയ്തു!");
            openCategory(catId, document.getElementById('main-header-title').innerText);
        } catch (e) { alert("Error!"); }
    }
};

// --- ബാക്കി ഫങ്ക്ഷനുകൾ ---
window.filterResults = () => {
    const filter = document.getElementById('search-input').value.toLowerCase();
    const cards = document.getElementsByClassName('person-card');
    for (let card of cards) {
        card.style.display = card.innerText.toLowerCase().includes(filter) ? "" : "none";
    }
};

window.showAdminLogin = () => { 
    hideAll(); 
    if (currentUser) {
        document.getElementById('admin-panel').classList.remove('hidden');
        renderAdminFields(); 
    } else {
        document.getElementById('admin-login-screen').classList.remove('hidden');
    }
    
    // സൈഡ് ബാർ അടഞ്ഞുപോകാൻ താഴെ പറയുന്നവ ഉറപ്പാക്കുക
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if(sidebar) sidebar.classList.remove('active');
    if(overlay) overlay.style.display = 'none';
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

window.showContentPage = () => { 
    hideAll(); 
    document.getElementById('content-info-screen').classList.remove('hidden'); 
    
    // ഹെഡർ മാറ്റാൻ
    document.getElementById('main-menu-icon').style.display = 'none'; // മെനു ഒളിപ്പിക്കുന്നു
    document.getElementById('header-back-btn').style.display = 'block'; // ബാക്ക് ബട്ടൺ കാണിക്കുന്നു (ഇവിടെയാണ് മാറ്റം)
    document.getElementById('main-header-title').innerText = "ഉള്ളടക്കം";
    
    // സൈഡ് ബാർ ക്ലോസ് ചെയ്യാൻ
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
};

window.showAboutApp = () => { 
    hideAll(); 
    document.getElementById('about-app-screen').classList.remove('hidden'); 
    
    // ഹെഡർ മാറ്റാൻ (കൂടുതൽ വ്യക്തതയ്ക്ക് style.display ഉപയോഗിക്കുന്നു)
    document.getElementById('main-menu-icon').style.display = 'none';
    document.getElementById('header-back-btn').style.display = 'block'; // മാറ്റം ഇവിടെ
    document.getElementById('main-header-title').innerText = "ആപ്പ് വിവരം";

    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
};

window.showLeaders = () => { 
    hideAll(); 
    document.getElementById('leaders-screen').classList.remove('hidden'); 
    
    // ഹെഡർ മാറ്റാൻ
    document.getElementById('main-menu-icon').style.display = 'none';
    document.getElementById('header-back-btn').style.display = 'block'; // മാറ്റം ഇവിടെ
    document.getElementById('main-header-title').innerText = "Leaders";

    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
};


// --- വാട്‌സാപ്പ് ---
window.goToWhatsApp = function(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    window.location.assign(`whatsapp://send?phone=91${cleanNumber}`);
};

// --- നോട്ടിഫിക്കേഷൻ ---
async function setupNotifications() {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, { 
            vapidKey: "BCp8wEaJUWt0OnoLetXsGnRxmjd8RRE3_hT0B9p0l_0TUCmhnsj0fYA8YBRXE_GOjG-oxNOCetPvL9ittyALAls",
            serviceWorkerRegistration: registration 
        });
        if (token) localStorage.setItem('fcm_token', token);
    } catch (e) { console.error(e); }
}

loadScrollingNews();
