// Enhanced Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBLvMHlpxy4z3GY4lOOiqXynrSKHdXyG4E",
    authDomain: "porasuna-1ea6b.firebaseapp.com",
    projectId: "porasuna-1ea6b",
    storageBucket: "porasuna-1ea6b.appspot.com",
    messagingSenderId: "1020178746731",
    appId: "1:1020178746731:web:6807aad16ee42a602c502e",
    measurementId: "G-V6X59WFZ8Z"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence().catch(err => {
    console.warn("Firebase persistence error:", err.code);
});

document.addEventListener('DOMContentLoaded', function () {
    const views = {
        dashboard: document.querySelector('#dashboard-view'),
        chapters: document.querySelector('#chapters-view'),
        routines: document.querySelector('#routines-view')
    };

    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const viewToShow = link.getAttribute('data-view');
            Object.entries(views).forEach(([key, el]) => {
                el.classList.toggle('hidden', key !== viewToShow);
            });

            // 🧠 Force re-render when switching to chapters or routines
            if (viewToShow === 'chapters') {
                renderChapterTables();
            } else if (viewToShow === 'routines') {
                renderRoutinesPage();
            } else if (viewToShow === 'dashboard') {
                renderDashboard();
            }
        });
    });


    // Show default view on load
    navLinks[0].click();

    // Add loading text under all loaders
    document.querySelectorAll('.loader').forEach(loader => {
        if (!loader.nextElementSibling) {
            const msg = document.createElement('p');
            msg.textContent = 'Loading data...';
            msg.classList.add('loading-text');
            loader.after(msg);
        }
    });
});
