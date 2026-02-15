// 1. ഫയർബേസ് ഇംപോർട്ടുകൾ (onSnapshot ഉൾപ്പെടുത്തി)
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

    // സ്പ്ലാഷ് സ്ക്രീൻ മാറ്റാൻ
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
                splash.classList.add('hidden');
                
                // സ്ക്രീൻ മാറിയാൽ ഉടൻ വാർത്തകൾ ലോഡ് ചെയ്യാൻ തുടങ്ങും
                loadScrollingNews(); 
                
            }, 500);
        }
    }, 2000); 
}); // <--- ഇവിടെയാണ് നേരത്തെ ബ്രാക്കറ്റ് വിട്ടുപോയത്

// --- വാർത്തകൾ ലോഡ് ചെയ്യാൻ (ഒന്നിലധികം വാർത്തകൾ വിടവില്ലാതെ) ---
function loadScrollingNews() {
    try {
        const tickerContainer = document.getElementById('latest-news');
        if (!tickerContainer) return;

        const newsRef = collection(db, 'announcements');

        // തത്സമയം മാറാൻ onSnapshot ഉപയോഗിക്കുന്നു
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

                // പുതിയ വാർത്തകൾ ആദ്യം വരാൻ
                newsItems.reverse();

                const separator = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                const fullNewsText = newsItems.join(separator);

                // വിടവില്ലാതെ ലൂപ്പ് ചെയ്യാൻ വാർത്തകൾ രണ്ടുതവണ നൽകുന്നു
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
    } catch (e) { 
        console.error("News Load Error:", e); 
    }
}

// --- കാറ്റഗറി കോൺഫിഗറേഷൻ ---
const categoryConfig = {
    'auto': { 'name': 'ഡ്രൈവർ പേര്', 'ty': 'വാഹന ഇനം', 'category': 'വാഹന വിഭാഗം', 'place': 'സ്ഥലം', 'phone': 'മൊബൈൽ', 'time': 'സമയം', 'leave': 'അവധി' },
    'shops': { 'item': 'ഇനം', 'name': 'കടയുടെ പേര്', 'time': 'സമയം', 'place': 'സ്ഥലം', 'owner': 'ഓണർ പേര്', 'phone': 'മൊബൈൽ', 'off': 'അവധി' },
    'workers': { 'category': 'വിഭാഗം', 'name': 'പേര്', 'phone': 'മൊബൈൽ', 'place': 'സ്ഥലം', 'time': 'സമയം', 'off': 'അവധി' },
    'catering': { 'name': 'പണ്ടാരിയുടെ പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ നമ്പർ', 'self': 'സ്വന്തം ഉണ്ടാക്കൽ', 'group': 'മറ്റുള്ളവരുടെ കൂടെ' },
    'travels': { 'vname': 'വാഹനത്തിന്റെ പേര്', 'oname': 'ഓണറുടെ പേര്', 'phone': 'മൊബൈൽ', 'place': 'സ്ഥലം', 'vtype': 'വാഹന ഇനം', 'seat': 'സീറ്റ് നില' },
    'institutions': { 'name': 'സ്ഥാപനത്തിന്റെ പേര്', 'place': 'സ്ഥലം', 'type': 'ഇനം', 'manager': 'മേധാവി/മാനേജർ', 'phone': 'മൊബൈൽ' },
    'professionals': { 'category': 'വിഭാഗം', 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'മൊബൈൽ നമ്പർ', 'home': 'നാട്', 'work': 'ജോലിസ്ഥലം' },
    'representatives': { 'name': 'പേര്', 'ward': 'വാർഡ്', 'ward_no': 'വാർഡ് നമ്പർ', 'position': 'സ്ഥാനം', 'phone': 'മൊബൈൽ' },
    'help_centers': { 'type': 'ഇനം', 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'മൊബൈൽ നമ്പർ', 'time': 'സമയം', 'off': 'അവധി' },
    'announcements': { 'name': 'വിഷയം', 'description': 'വിവരണം' },
    'admins': { 'name': 'പേര്', 'phone': 'മൊബൈൽ', 'place': 'സ്ഥലം' },
    'default': { 'name': 'പേര്', 'place': 'സ്ഥലം', 'phone': 'ഫോൺ' }
};

function hideAll() {
    const screens = ['home-screen', 'content-info-screen', 'admin-login-screen', 'admin-panel', 'list-screen', 'about-app-screen', 'leaders-screen'];
    screens.forEach(s => {
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

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.style.display = (catId === 'admins' || catId === 'announcements') ? 'none' : 'block';
        searchInput.value = ""; 
    }

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
                displayHTML = `
                <div class="announcement-card">
                    <div class="announcement-title">
                        <i class="fas fa-bullhorn"></i> ${d.name}
                    </div>
                    <div class="announcement-desc">${d.description}</div>
                    ${currentUser ? `<div class="admin-btns" style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
                        <button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button>
                        <button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button>
                    </div>` : ""}
                </div>`;
} else if (catId === 'admins') {
    displayHTML = `
    <div class="person-card">
        <div class="person-info">
            <strong style="font-size: 18px !important; font-weight: 900; color: #000;"><i class="fas fa-user-shield"></i> ${d.name}</strong>
            <small style="display:block; margin-top:5px; font-weight: 800; font-size: 15px; color: #333;"><i class="fas fa-phone-alt"></i> ${d.phone}</small>
            
            <small style="display:block; margin-top:5px; font-weight: 800; font-size: 15px; color: #666;"><i class="fas fa-map-marker-alt"></i> ${d.place || ""}</small>
        </div>
        <div class="call-section">
            <a href="tel:${d.phone}" class="call-btn-new"><i class="fas fa-phone-alt"></i> കോൾ</a>
            <a href="javascript:void(0)" onclick="goToWhatsApp('${d.phone}')" class="whatsapp-btn-new">
                <i class="fab fa-whatsapp"></i> Chat
            </a>
        </div>
        ${currentUser ? `<div class="admin-btns">
            <button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button>
            <button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button>
        </div>` : ""}
    </div>`;
                
         } else {
    // ആവർത്തനം ഒഴിവാക്കാൻ extraInfo ലൂപ്പിൽ നിന്ന് സമയം, അവധി എന്നിവ കൂടി ഒഴിവാക്കുക
    let extraInfo = "";
    for (let key in d) {
        if (!['name', 'phone', 'place', 'ty', 'no', 'timestamp', 'time', 'leave'].includes(key)) { 
            const label = categoryConfig[catId] && categoryConfig[catId][key] ? categoryConfig[catId][key] : key;
            extraInfo += `<small style="display:block; color:#555;"><b>${label}:</b> ${d[key]}</small>`;
        }
    }

    displayHTML = `
    <div class="person-card">
        <div class="person-info">
            <strong style="font-size: 20px; color: #004d00; font-weight: 950; display: block; margin-bottom: 5px;">
                <i class="fas fa-user-circle"></i> ${d.name || "പേര് ലഭ്യമല്ല"}
            </strong>   
            
            ${d.place ? `<p style="margin: 5px 0; color: #333; font-size: 17px; font-weight: 700;"><i class="fas fa-map-marker-alt" style="color: #d9534f;"></i> ${d.place}</p>` : ""}

            ${d.time ? `<p style="margin: 5px 0; color: #007bff; font-size: 16px; font-weight: 800;"><i class="fas fa-clock"></i> സമയം: ${d.time}</p>` : ""}

            ${d.leave ? `<p style="margin: 5px 0; color: #b71c1c; font-size: 16px; font-weight: 800;"><i class="fas fa-calendar-times"></i> അവധി: ${d.leave}</p>` : ""}

            ${catId === 'auto' && (d.ty || d.no) ? `<p style="margin: 5px 0; color: #111; font-size: 16px; font-weight: 700;"><i class="fas fa-taxi" style="color: #f1c40f;"></i> വാഹന ഇനം: ${d.ty || d.no}</p>` : ""}

            <div style="margin-top: 5px;">${extraInfo}</div>
        </div>

        <div class="call-section">
            <a href="tel:${d.phone}" class="call-btn-new"><i class="fas fa-phone-alt"></i> കോൾ</a>
        </div>

        ${currentUser ? `
            <div class="admin-btns">
                <button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button>
                <button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button>
            </div>` : ""
        }
    </div>`;
}
           container.innerHTML += displayHTML;
        });
    } catch (e) { 
        console.error("Open Category Error:", e);
        container.innerHTML = "<p style='text-align:center;'>വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു.</p>";
    }
};

window.renderAdminFields = () => {
    const cat = document.getElementById('new-cat').value;
    const container = document.getElementById('dynamic-inputs');
    const fields = categoryConfig[cat] || categoryConfig['default'];
    container.innerHTML = ""; 
    for (let key in fields) {
        if(key === 'description') {
            container.innerHTML += `<textarea id="field-${key}" placeholder="${fields[key]}" style="width:100%; height:80px; margin-bottom:10px; padding:8px; border-radius:5px; border:1px solid #ccc;"></textarea>`;
        } else {
            container.innerHTML += `<input type="text" id="field-${key}" placeholder="${fields[key]}">`;
        }
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
        alert("വിജയകരമായി ചേർത്തു!");
        if (cat === 'announcements') loadScrollingNews();
        renderAdminFields();
    } catch (e) { alert("Error saving data!"); }
};

window.deleteEntry = async (catId, docId) => {
    if (confirm("ഈ വിവരം നീക്കം ചെയ്യട്ടെ?")) {
        try {
            await deleteDoc(doc(db, catId, docId));
            alert("നീക്കം ചെയ്തു!");
            const title = document.getElementById('current-cat-title').innerText;
            openCategory(catId, title); 
        } catch (e) { alert("Error deleting!"); }
    }
};

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
        const title = document.getElementById('current-cat-title').innerText;
        openCategory(catId, title);
    } catch (e) { alert("Error updating!"); }
};

window.filterResults = () => {
    const filter = document.getElementById('search-input').value.toLowerCase();
    const cards = document.getElementsByClassName('person-card');
    for (let i = 0; i < cards.length; i++) {
        const text = cards[i].innerText.toLowerCase();
        cards[i].style.display = text.includes(filter) ? "" : "none";
    }
};

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

window.showContentPage = () => { hideAll(); document.getElementById('content-info-screen').classList.remove('hidden'); toggleMenu(); };
window.showAboutApp = () => { hideAll(); document.getElementById('about-app-screen').classList.remove('hidden'); toggleMenu(); };
window.showLeaders = () => { hideAll(); document.getElementById('leaders-screen').classList.remove('hidden'); toggleMenu(); };

// --- നോട്ടിഫിക്കേഷൻ സെറ്റപ്പ് ---
async function setupNotifications() {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, { 
            vapidKey: "BCp8wEaJUWt0OnoLetXsGnRxmjd8RRE3_hT0B9p0l_0TUCmhnsj0fYA8YBRXE_GOjG-oxNOCetPvL9ittyALAls",
            serviceWorkerRegistration: registration 
        });

        if (token) {
            const savedToken = localStorage.getItem('fcm_token');
            if (savedToken !== token) {
                const deviceId = btoa(navigator.userAgent).substring(0, 20).replace(/[/+=]/g, '');
                const tokenRef = doc(db, "fcm_tokens", deviceId); 
                await setDoc(tokenRef, {
                    token: token,
                    timestamp: serverTimestamp(),
                    lastSeen: new Date().toLocaleString()
                }, { merge: true });
                localStorage.setItem('fcm_token', token);
            }
        }
    } catch (error) { 
        console.error("Notification Setup Error:", error); 
    }
}

// --- വാട്‌സാപ്പ് ഫംഗ്‌ഷൻ (മാറ്റം വരുത്തിയത്) ---
window.goToWhatsApp = function(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // നേരിട്ട് ആപ്പ് തുറക്കാൻ ശ്രമിക്കുന്നു
    window.location.assign(`whatsapp://send?phone=91${cleanNumber}`);
    // ആപ്പ് തുറന്നില്ലെങ്കിൽ മാത്രം സൈറ്റിലേക്ക് പോകാൻ
    setTimeout(function() {
        if (document.hasFocus()) {
            window.open(`https://wa.me/91${cleanNumber}`, '_blank');
        }
    }, 1000);
};
loadScrollingNews();


// loadCategories(); 
