import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
let allCategoryData = []; // സെർച്ചിനായി ഡാറ്റ സൂക്ഷിക്കാൻ

// Splash Screen
setTimeout(() => {
    const splash = document.getElementById('splash');
    if(splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 800);
    }
}, 2000);

window.toggleMenu = () => {
    document.getElementById('sidebar').classList.toggle('active');
    const overlay = document.getElementById('overlay');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
};

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

window.showAboutApp = () => {
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    document.getElementById('about-app-screen').classList.remove('hidden');
    if(document.getElementById('sidebar').classList.contains('active')) window.toggleMenu();
};

window.showLeaders = () => {
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    document.getElementById('leaders-screen').classList.remove('hidden');
    if(document.getElementById('sidebar').classList.contains('active')) window.toggleMenu();
};

// ലോഗിൻ ഫംഗ്ഷൻ
window.handleLogin = async () => {
    const inputNumber = document.getElementById('admin-email').value.trim(); 
    const fullEmail = inputNumber + "@sys.com"; 
    const pass = document.getElementById('admin-password').value;

    if(!inputNumber || !pass) {
        alert("അഡ്മിൻ ID-യും പാസ്‌വേഡും നൽകുക");
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, fullEmail, pass);
        alert("ലോഗിൻ വിജയിച്ചു");
        showHome();
    } catch (e) { alert("ലോഗിൻ പരാജയപ്പെട്ടു"); }
};

window.handleLogout = () => { signOut(auth); location.reload(); };

onAuthStateChanged(auth, (user) => { 
    currentUser = user; 
    const userDisplay = document.getElementById('user-display-id');
    if (user && userDisplay) {
        const adminId = user.email.split('@')[0];
        userDisplay.innerText = "Admin ID: " + adminId;
    }
});

// സെർച്ച് ഫംഗ്ഷൻ
window.filterResults = () => {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const container = document.getElementById('list-container');
    const filtered = allCategoryData.filter(item => 
        item.data.name.toLowerCase().includes(searchTerm) || 
        item.data.place.toLowerCase().includes(searchTerm)
    );
    renderList(filtered, container, currentCatID);
};

// ഡാറ്റ ലിസ്റ്റ് കാണിക്കാൻ
let currentCatID = "";
window.openCategory = async (catId, catName) => {
    currentCatID = catId;
    document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
    document.getElementById('list-screen').classList.remove('hidden');
    document.getElementById('current-cat-title').innerText = catName;
    
    const container = document.getElementById('list-container');
    container.innerHTML = "<p style='text-align:center;'>വിവരങ്ങൾ ശേഖരിക്കുന്നു...</p>";

    try {
        const q = query(collection(db, catId));
        const querySnapshot = await getDocs(q);
        allCategoryData = [];
        querySnapshot.forEach(docSnap => {
            allCategoryData.push({ id: docSnap.id, data: docSnap.data() });
        });
        renderList(allCategoryData, container, catId);
    } catch (e) { container.innerHTML = "<p>Error: " + e.message + "</p>"; }
};

// ലിസ്റ്റ് റെൻഡർ ചെയ്യാൻ (Search-നും കൂടി ഉപയോഗിക്കാം)
function renderList(items, container, catId) {
    container.innerHTML = "";
    if (items.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>വിവരങ്ങൾ ലഭ്യമല്ല</p>";
        return;
    }
    items.forEach(item => {
        const data = item.data;
        const id = item.id;
        const type = data.type ? `<span class="category-tag">${data.type}</span>` : "";
        const safeData = JSON.stringify(data).replace(/'/g, "\\'");

        container.innerHTML += `
            <div class="person-card">
                <div class="person-info">
                    ${type}<br>
                    <strong style="font-size:1.25rem; font-weight:800;">${data.name}</strong>
                    <small style="font-size:1rem; display:block; margin-top:4px;"><b>📍 ${data.place}</b></small>
                    ${data.details ? `<small style="font-size:0.95rem; display:block; margin-top:4px;"><b>ℹ️ ${data.details}</b></small>` : ''}
                </div>
                <div class="action-buttons">
                    <a href="tel:${data.phone}" class="call-btn">📞</a>
                    ${currentUser ? `
                        <div class="admin-controls">
                            <button onclick='openEdit("${catId}", "${id}", ${safeData})' class="edit-btn">✏️</button>
                            <button onclick="deleteItem('${catId}', '${id}')" class="delete-btn">🗑️</button>
                        </div>
                    ` : ''}
                </div>
            </div>`;
    });
}

// എഡിറ്റ് ഫംഗ്ഷനുകൾ
window.openEdit = (catId, docId, currentData) => {
    document.getElementById('edit-modal').classList.remove('hidden');
    document.getElementById('edit-name').value = currentData.name || "";
    document.getElementById('edit-place').value = currentData.place || "";
    document.getElementById('edit-phone').value = currentData.phone || "";
    document.getElementById('edit-type').value = currentData.type || "";
    document.getElementById('edit-details').value = currentData.details || "";

    document.getElementById('update-save-btn').onclick = async () => {
        const updatedData = {
            name: document.getElementById('edit-name').value,
            place: document.getElementById('edit-place').value,
            phone: document.getElementById('edit-phone').value,
            type: document.getElementById('edit-type').value,
            details: document.getElementById('edit-details').value
        };
        const docRef = doc(db, catId, docId);
        await updateDoc(docRef, updatedData);
        alert("പുതുക്കി!");
        location.reload();
    };
};

window.closeEditModal = () => document.getElementById('edit-modal').classList.add('hidden');

window.deleteItem = async (catId, docId) => {
    if (confirm("ഡിലീറ്റ് ചെയ്യട്ടെ?")) {
        await deleteDoc(doc(db, catId, docId));
        location.reload(); 
    }
};

window.handleSaveData = async () => {
    if(!currentUser) return;
    const cat = document.getElementById('new-cat').value;
    const data = {
        name: document.getElementById('new-name').value,
        place: document.getElementById('new-place').value,
        phone: document.getElementById('new-phone').value,
        type: document.getElementById('new-type').value || "",
        details: document.getElementById('new-details').value || ""
    };
    if(data.name && data.phone) {
        await addDoc(collection(db, cat), data);
        alert("സേവ് ചെയ്തു!");
        showHome();
    }
};
