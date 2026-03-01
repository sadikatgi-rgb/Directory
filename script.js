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
    updateOnlineStatus(); // സ്റ്റാറ്റസ് ചെക്ക്
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
    'auto': { 'name': 'ഡ്രൈവർ പേര്', 'ty': 'വാഹന ഇനം', 'category': 'വാഹന വിഭാഗം', 'place': 'സ്ഥലം', 'phone': 'മൊബൈൽ', 'time': 'സമയം', 'leave': 'അവധി', 'night': 'നൈറ്റ് വർക്ക്' },
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
    const screens = ['home-screen', 'home-screen-view', 'content-info-screen', 'admin-login-screen', 'admin-panel', 'list-screen', 'about-app-screen', 'leaders-screen'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.value = ""; 
}

window.showHome = () => {
    hideAll(); 
    const homeView = document.getElementById('home-screen-view');
    const homeLogic = document.getElementById('home-screen');
    if(homeView) homeView.classList.remove('hidden');
    if(homeLogic) homeLogic.classList.remove('hidden');
    document.getElementById('main-header-title').innerText = "വിഭവ ഡയറക്ടറി";
    const menuIcon = document.getElementById('main-menu-icon');
    const backBtn = document.getElementById('header-back-btn');
    if(menuIcon) menuIcon.classList.remove('hidden');
    if(backBtn) backBtn.classList.add('hidden');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if(sidebar) sidebar.classList.remove('active');
    if(overlay) overlay.style.display = 'none';
};

window.toggleMenu = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('active');
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
};

window.openCategory = async (catId, catName) => {
    hideAll();
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if(sidebar) sidebar.classList.remove('active');
    if(overlay) overlay.style.display = 'none';

    document.getElementById('list-screen').classList.remove('hidden');
    document.getElementById('main-header-title').innerText = catName;
    document.getElementById('main-menu-icon').classList.add('hidden');
    document.getElementById('header-back-btn').classList.remove('hidden');

    const container = document.getElementById('list-container');
    
    // 1. സെർച്ച് ബാർ ഡിസൈൻ
    container.innerHTML = `
        <div style="padding: 10px 15px; position: sticky; top: 0; background: #fff; z-index: 100;">
            <input type="text" id="live-search-box" placeholder="തിരയുക..." 
                style="width: 80%; display: block; margin: 0 auto; padding: 10px 20px; border: 2px solid #1b5e20; border-radius: 30px; font-size: 16px; outline: none; box-sizing: border-box;">
        </div>
        <div id="cards-inner-container"><p style='text-align:center; padding:20px;'>ശേഖരിക്കുന്നു...</p></div>`;

    const cardsInner = document.getElementById('cards-inner-container');
    const searchInput = document.getElementById('live-search-box');

    try {
        let q = (catId === 'announcements' || catId === 'admins') ? 
                query(collection(db, catId), orderBy('timestamp', 'desc')) : 
                query(collection(db, catId));
        
        const querySnapshot = await getDocs(q);
        cardsInner.innerHTML = ""; 

        if (catId === 'admins') {
            cardsInner.innerHTML += `<div class="blink-text">" പ്രധാന അറിയിപ്പുകൾ അറിയിക്കാൻ, വിവരങ്ങൾ ആഡ് ചെയ്യാൻ, മാറ്റങ്ങൾ വരുത്താൻ, അഡ്മിന്മാരുമായി ബന്ധപ്പെടുക "</div>`;
        }
        
        if (querySnapshot.empty) {
            cardsInner.innerHTML = "<p style='text-align:center; padding:20px;'>വിവരങ്ങൾ ലഭ്യമല്ല</p>";
        } else {
            querySnapshot.forEach(docSnap => {
                const d = docSnap.data();
                const id = docSnap.id;
                const dataStr = encodeURIComponent(JSON.stringify(d));
                let extraFieldsHTML = "";

                const isAnnouncement = (catId === 'announcements');
                const cardBorderColor = isAnnouncement ? "#c62828" : "#1b5e20";
                const themeColor = isAnnouncement ? "#c62828" : "#1b5e20";

                const nameValue = (catId === 'travels' ? d.oname : (d.name || d.vname)) || "ലഭ്യമല്ല";
                const titleIcon = isAnnouncement ? "fas fa-bullhorn" : "fas fa-user-circle";
                
                // പേര് സെക്ഷൻ
                extraFieldsHTML += `<div class="main-card-name" style="font-size:20px; font-weight:950; color:${themeColor}; margin-bottom:8px; border-bottom:1.5px solid #eee; padding-bottom:4px;"><i class="${titleIcon}"></i> ${nameValue}</div>`;

                const icons = { 'place': 'fas fa-map-marker-alt', 'time': 'fas fa-clock', 'leave': 'fas fa-calendar-times', 'off': 'fas fa-calendar-times' };
                const reserved = ['name', 'oname', 'vname', 'timestamp', 'phone'];

                // വിവരങ്ങൾ ലൂപ്പ് ചെയ്യുന്നു (Compact Design)
                for (let key in d) {
                    if (!reserved.includes(key) && d[key] && d[key].toString().trim() !== "") {
                        const label = categoryConfig[catId] && categoryConfig[catId][key] ? categoryConfig[catId][key] : key;
                        const iconClass = icons[key] || 'fas fa-chevron-right';
                        let labelColor = (key === 'place' || key === 'leave' || key === 'off') ? "#c62828" : (key === 'time' ? "#1565c0" : "#2e7d32");

                        extraFieldsHTML += `
                            <div class="info-inline-row" style="display:block; margin-bottom: 2px; line-height: 1.1;">
                                <div style="font-weight:900; font-size:17px; color:${labelColor}; margin-bottom: 0px; display:flex; align-items:center; gap:8px;">
                                    <i class="${iconClass}" style="width:18px;"></i> ${label}:
                                </div>
                                <div style="font-weight:800; font-size:18px; color:#000; padding-left:26px; margin-top: -2px;">
                                    ${d[key]}
                                </div>
                            </div>`;
                    }
                }

                // ബട്ടണുകൾ
                let buttonsHTML = "";
                if (currentUser) {
                    buttonsHTML = `
                        <div class="admin-btns" style="display:flex; gap:10px; margin-top:10px;">
                            <button onclick="editEntry('${catId}', '${id}', '${dataStr}')" style="flex:1; background:#2196F3; color:#fff; padding:10px; border-radius:30px; border:none; font-weight:900;">Edit</button>
                            <button onclick="deleteEntry('${catId}', '${id}')" style="flex:1; background:#f44336; color:#fff; padding:10px; border-radius:30px; border:none; font-weight:900;">Delete</button>
                        </div>`;
                } else if (!isAnnouncement) {
                    const whatsappCategories = ['shops', 'help_centers', 'catering', 'admins'];
                    if (whatsappCategories.includes(catId)) {
                        buttonsHTML = `
                            <div class="call-section" style="display:flex; gap:10px; margin-top:10px;">
                                <a href="tel:${d.phone}" class="call-btn-new" style="flex:1; background:#1b5e20; color:#fff; padding:10px; border-radius:30px; text-align:center; text-decoration:none; font-weight:900;"><i class="fas fa-phone"></i> കോൾ</a>
                                <a href="javascript:void(0)" onclick="goToWhatsApp('${d.phone}')" class="whatsapp-btn-new" style="flex:1; background:#25D366; color:#fff; padding:10px; border-radius:30px; text-align:center; text-decoration:none; font-weight:900;"><i class="fab fa-whatsapp"></i> Chat</a>
                            </div>`;
                    } else {
                        buttonsHTML = `
                            <div class="call-section" style="display:flex; gap:10px; margin-top:10px;">
                                <a href="tel:${d.phone}" class="call-btn-new" style="flex:1; background:#1b5e20; color:#fff; padding:10px; border-radius:30px; text-align:center; text-decoration:none; font-weight:900;"><i class="fas fa-phone"></i> വിളിക്കുക</a>
                            </div>`;
                    }
                }

                // ഫൈനൽ കാർഡ് നിർമ്മാണം
                const displayHTML = `
                    <div class="person-card" style="background: #fff; border-radius: 12px; padding: 6px 12px; margin-bottom: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border-left: 6px solid ${cardBorderColor}; display: block;">
                        <div class="person-info" style="margin-bottom: 2px;">${extraFieldsHTML}</div>
                        ${buttonsHTML}
                    </div>`;         
                cardsInner.innerHTML += displayHTML;
            });
        }

        // 2. സെർച്ച് ലിസണർ (Updated)
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase().trim();
        const cards = cardsInner.getElementsByClassName('person-card');
        let found = false;

        Array.from(cards).forEach(card => {
            // കാർഡിനുള്ളിലെ എല്ലാ ടെക്സ്റ്റും (പേര്, സ്ഥലം, ഫോൺ ഉൾപ്പെടെ) എടുക്കുന്നു
            const content = card.textContent || card.innerText;
            
            if (content.toLowerCase().indexOf(filter) > -1) {
                card.style.display = ""; // കാണിക്കുന്നു (block എന്നതിന് പകരം "" നൽകുന്നത് ലേഔട്ട് കൃത്യമാക്കും)
                found = true;
            } else {
                card.style.display = "none"; // മറയ്ക്കുന്നു
            }
        });

        // 'വിവരങ്ങൾ ലഭ്യമല്ല' എന്ന സന്ദേശം കൈകാര്യം ചെയ്യുന്നു
        let noMsg = document.getElementById('no-results-msg');
        if (!found && filter !== "") {
            if (!noMsg) {
                const msg = document.createElement('p');
                msg.id = 'no-results-msg';
                msg.style.cssText = "text-align:center; padding:20px; font-weight:bold; color:red; width:100%;";
                msg.innerText = "വിവരങ്ങൾ ലഭ്യമല്ല!";
                cardsInner.appendChild(msg);
            }
        } else if (noMsg) {
            noMsg.remove();
        }
    });
}

    } catch (e) { 
        console.error("Error:", e); 
        cardsInner.innerHTML = "<p style='text-align:center;'>പിശക് സംഭവിച്ചു!</p>";
    }
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

window.deleteEntry = async (catId, docId) => {
    if (confirm("ഈ വിവരം നീക്കം ചെയ്യട്ടെ?")) {
        try {
            await deleteDoc(doc(db, catId, docId));
            alert("നീക്കം ചെയ്തു!");
            openCategory(catId, document.getElementById('main-header-title').innerText);
        } catch (e) { alert("Error!"); }
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
    document.getElementById('main-header-title').innerText = "അഡ്മിൻ ലോഗിൻ";
    const menuIcon = document.getElementById('main-menu-icon');
    const backBtn = document.getElementById('header-back-btn');
    if(menuIcon) menuIcon.classList.add('hidden');
    if(backBtn) {
        backBtn.classList.remove('hidden');
        backBtn.style.display = 'flex';
    }
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

// --- ഉള്ളടക്കം (Content Page) ---
window.showContentPage = () => { 
    hideAll(); 
    // സൈഡ്ബാർ അടയ്ക്കാൻ താഴെ പറയുന്ന 2 വരികൾ സഹായിക്കും
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
    
    document.getElementById('content-info-screen').classList.remove('hidden'); 
    document.getElementById('main-header-title').innerText = "ഉള്ളടക്കം";
    document.getElementById('main-menu-icon').classList.add('hidden');
    document.getElementById('header-back-btn').classList.remove('hidden');
};

// --- ആപ്പ് വിവരം (About App) ---
window.showAboutApp = () => { 
    hideAll(); 
    // സൈഡ്ബാർ അടയ്ക്കാൻ
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
    
    document.getElementById('about-app-screen').classList.remove('hidden'); 
    document.getElementById('main-header-title').innerText = "ആപ്പ് വിവരം";
    document.getElementById('main-menu-icon').classList.add('hidden');
    document.getElementById('header-back-btn').classList.remove('hidden');
};

// --- Leaders ---
window.showLeaders = () => { 
    hideAll(); 
    // സൈഡ്ബാർ അടയ്ക്കാൻ
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
    
    document.getElementById('leaders-screen').classList.remove('hidden'); 
    document.getElementById('main-header-title').innerText = "Leaders";
    document.getElementById('main-menu-icon').classList.add('hidden');
    document.getElementById('header-back-btn').classList.remove('hidden');
};

// --- WhatsApp Link ---
window.goToWhatsApp = function(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    window.location.assign(`whatsapp://send?phone=91${cleanNumber}`);
};

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

      
// --- ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കാനുള്ള ഫംഗ്‌ഷൻ ---
function updateOnlineStatus() {
    const offlineScreen = document.getElementById('offline-screen');
    if (!offlineScreen) return; 

    if (navigator.onLine) {
        offlineScreen.style.display = 'none';
    } else {
        offlineScreen.style.display = 'flex'; 
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
document.addEventListener('DOMContentLoaded', updateOnlineStatus);
// അഡ്മിൻ ലിസ്റ്റ് കാണാൻ (സൈഡ് ബാറിൽ നിന്ന്)
window.openAdminCategory = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if(sidebar) sidebar.classList.remove('active');
    if(overlay) overlay.style.display = 'none';
    
    // അഡ്മിൻ കാറ്റഗറി തുറക്കുന്നു
    openCategory('admins', 'അഡ്മിൻസ്');
};
