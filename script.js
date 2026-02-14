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
window.addEventListener('load', () => {
    // വാർത്തകളും നോട്ടിഫിക്കേഷനും ലോഡ് ചെയ്യാൻ
    loadScrollingNews();
    setupNotifications();

    // സർവീസ് വർക്കർ രജിസ്ട്രേഷൻ
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('firebase-messaging-sw.js')
            .then(reg => console.log('SW Registered'))
            .catch(err => console.log('SW Failed', err));
    }
    
    // സ്പ്ലാഷ് സ്ക്രീൻ (ലോഡിംഗ് സ്ക്രീൻ) നിർബന്ധമായും മാറ്റാൻ
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.classList.add('hidden');
            }, 500);
        }
    }, 3000); // 3 സെക്കൻഡ് കഴിഞ്ഞ് സ്ക്രീൻ മാറും
});

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
                // ടോക്കൺ ഐഡി തന്നെ ഡോക്യുമെന്റ് ഐഡി ആയി ഉപയോഗിക്കുന്നു
                // ഇത് കാരണം ഒരേ ടോക്കൺ വീണ്ടും വന്നാൽ പഴയത് മാറി പുതിയത് വരില്ല, പകരം അപ്ഡേറ്റ് ആകുകയേ ഉള്ളൂ
                const tokenRef = doc(db, "fcm_tokens", token); 
                
                await setDoc(tokenRef, {
                    token: token,
                    timestamp: serverTimestamp(),
                    deviceInfo: navigator.userAgent
                }, { merge: true }); // merge: true നൽകുന്നത് കൊണ്ട് ഡാറ്റ ആവർത്തിക്കില്ല
            }
        }
    } catch (error) {
        console.error("Notification Setup Error:", error);
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

// --- വാർത്തകൾ ലോഡ് ചെയ്യാൻ ---
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
    loadScrollingNews();
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
        searchInput.style.display = (catId === 'admins') ? 'none' : 'block';
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
            container.innerHTML += `
            <div class="blink-text">
                " പ്രധാന അറിയിപ്പുകൾ അറിയിക്കാൻ, വിവരങ്ങൾ ആഡ് ചെയ്യാൻ, മാറ്റങ്ങൾ വരുത്താൻ, അഡ്മിന്മാരുമായി ബന്ധപ്പെടുക "
            </div>`;
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
                <div class="person-card" style="border-left: 5px solid #ffeb33;">
                    <div class="person-info" style="width: 100%;">
                        <strong style="font-size: 18px; color: #006400;"><i class="fas fa-bullhorn"></i> ${d.name}</strong>
                        <p style="margin-top: 10px; color: #333; line-height: 1.5;">${d.description}</p>
                    </div>
                    ${currentUser ? `<div class="admin-btns">
                        <button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button>
                        <button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button>
                    </div>` : ""}
                </div>`;
            } else if (catId === 'admins') {
                displayHTML = `
                <div class="person-card" style="border-left: 5px solid #006400;">
                    <div class="person-info">
                        <strong style="font-size: 18px !important; font-weight: 800;"><i class="fas fa-user-shield"></i> ${d.name}</strong>
                        <small style="display:block; margin-top:5px; font-weight: bold; font-size: 14px;"><i class="fas fa-phone-alt"></i> ${d.phone}</small>
                    </div>
                    <div class="call-section" style="display: flex; gap: 8px;">
                        <a href="tel:${d.phone}" class="call-btn-new">
                           <i class="fas fa-phone-alt"></i> കോൾ
                        </a>
                        <a href="https://wa.me/91${d.phone.replace(/\s+/g, '')}" class="whatsapp-btn-new" target="_blank" style="background: #25D366; color: white; padding: 8px 12px; border-radius: 20px; text-decoration: none; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                           <i class="fab fa-whatsapp"></i> Chat
                        </a>
                    </div>
                    ${currentUser ? `<div class="admin-btns" style="width:100%; margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                        <button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button>
                        <button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button>
                    </div>` : ""}
                </div>`;
            } else {
                let extraInfo = "";
                for (let key in d) {
                    if (!['name', 'phone', 'place', 'ty', 'no', 'timestamp'].includes(key)) { 
                        const label = categoryConfig[catId] && categoryConfig[catId][key] ? categoryConfig[catId][key] : key;
                        extraInfo += `<small style="display:block; color:#555;"><b>${label}:</b> ${d[key]}</small>`;
                    }
                        }
        displayHTML += `
<div class="person-card">
  <div class="person-info">
    <strong style="font-size: 20px; color: #004d00; font-weight: 950; display: block; margin-bottom: 5px;">
        <i class="fas fa-user-circle"></i> ${d.name}
    </strong>   
        <p style="margin: 5px 0; color: #333; font-size: 17px; font-weight: 700;">
            <i class="fas fa-map-marker-alt" style="color: #d9534f;"></i> ${d.place}
        </p>

        ${catId === 'auto' ? `<p style="margin: 5px 0; color: #111; font-size: 16px; font-weight: 700;"><i class="fas fa-taxi" style="color: #f1c40f;"></i> വാഹന ഇനം: ${d.ty || d.no || ""}</p>` : ""}
        
        <div style="font-size: 16px; font-weight: 600; color: #444; margin-top:5px;">${extraInfo}</div>
    </div>

    <div class="call-section">
        <a href="tel:${d.phone}" class="call-btn-new">
           <i class="fas fa-phone-alt"></i> കോൾ
        </a>
    </div>
    ${currentUser ? `<div class="admin-btns">
        <button class="edit-btn" onclick="editEntry('${catId}', '${id}', '${dataStr}')">Edit</button>
        <button class="delete-btn" onclick="deleteEntry('${catId}', '${id}')">Delete</button>
    </div>` : ""}
</div>`
       }

            container.innerHTML += displayHTML;
        });
    } catch (e) { 
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
        // 1. ഡാറ്റ സേവ് ചെയ്യുന്നു
        await addDoc(collection(db, cat), dataToSave);

        if (cat === 'announcements') {
            loadScrollingNews();
            
            // 2. ടോക്കണുകൾ ശേഖരിക്കുന്നു
            const tokensSnapshot = await getDocs(collection(db, "fcm_tokens"));
            const tokens = [];
            
            tokensSnapshot.forEach(docSnap => {
                const tokenData = docSnap.data();
                if (tokenData && tokenData.token) {
                    tokens.push(tokenData.token);
                }
            });

            if (tokens.length > 0) {
                // 3. നോട്ടിഫിക്കേഷൻ അയക്കുന്നു
                await sendPushNotification(dataToSave.name, dataToSave.description, tokens);
                alert("അറിയിപ്പ് പ്രസിദ്ധീകരിച്ചു, എല്ലാവർക്കും നോട്ടിഫിക്കേഷൻ അയച്ചു!");
            } else {
                alert("അറിയിപ്പ് സേവ് ചെയ്തു!");
            }
        } else {
            alert("വിജയകരമായി ചേർത്തു!");
        }
        
        renderAdminFields();
    } catch (e) {
        console.error("Error saving data: ", e);
        alert("Error saving data!");
    }
}; // handleSaveData ഇവിടെ അവസാനിക്കുന്നു

window.deleteEntry = async (catId, docId) => {
    if (confirm("ഈ വിവരം നീക്കം ചെയ്യട്ടെ?")) {
        try {
            await deleteDoc(doc(db, catId, docId));
            alert("നീക്കം ചെയ്തു!");
            const title = document.getElementById('current-cat-title').innerText;
            openCategory(catId, title); 
        } catch (e) { 
            console.error("Error deleting:", e);
            alert("Error deleting!"); 
        }
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
    } catch (e) { 
        console.error("Error updating:", e);
        alert("Error updating!"); 
    }
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
    
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.remove('active');
    const overlay = document.getElementById('overlay');
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

window.showContentPage = () => { hideAll(); document.getElementById('content-info-screen').classList.remove('hidden'); toggleMenu(); };
window.showAboutApp = () => { hideAll(); document.getElementById('about-app-screen').classList.remove('hidden'); toggleMenu(); };
window.showLeaders = () => { hideAll(); document.getElementById('leaders-screen').classList.remove('hidden'); toggleMenu(); };

// സർവീസ് വർക്കർ രജിസ്റ്റർ ചെയ്യുന്ന ഭാഗം
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('firebase-messaging-sw.js')
            .then(reg => {
                console.log('Service Worker registered', reg);
            })
            .catch(err => {
                console.log('Service Worker registration failed', err);
            });
    });
}

// പഴയതിന് പകരം ഇത് ചേർക്കുക
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
                // ഡോക്യുമെന്റ് ഐഡി ഉണ്ടാക്കുമ്പോൾ അതിൽ സ്പെഷ്യൽ ക്യാരക്ടർ വരുന്നത് ഒഴിവാക്കാൻ
                // ടോക്കണിനെ ഒരു സ്ട്രിംഗ് ആയി തന്നെ എടുക്കുന്നു എന്ന് ഉറപ്പാക്കുക.
                const cleanTokenId = token.replace(/[:\/.]/g, '_'); 
                const tokenRef = doc(db, "fcm_tokens", cleanTokenId); 
                
                await setDoc(tokenRef, {
                    token: token,
                    timestamp: serverTimestamp(),
                    deviceInfo: navigator.userAgent,
                    lastSeen: new Date().toLocaleString() // അവസാനമായി ആപ്പ് തുറന്ന സമയം
                }, { merge: true });

                console.log("Token saved/updated successfully");
            }
        }
    } catch (error) {
        console.error("Notification Setup Error:", error);
    }
}
