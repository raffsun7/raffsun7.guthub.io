const firebaseConfig = {
    apiKey: "AIzaSyBLvMHlpxy4z3GY4lOOiqXynrSKHdXyG4E",
    authDomain: "porasuna-1ea6b.firebaseapp.com",
    projectId: "porasuna-1ea6b",
    storageBucket: "porasuna-1ea6b.firebasestorage.app",
    messagingSenderId: "1020178746731",
    appId: "1:1020178746731:web:6807aad16ee42a602c502e",
    measurementId: "G-V6X59WFZ8Z"
};

// Initialize Firebase and Firestore
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("Firebase Connected. App is in Public Mode.");


// Wait for the entire HTML document to load
document.addEventListener('DOMContentLoaded', function() {

    // --- DOM Element Selectors for UI Control ---
    // Views
    const dashboardView = document.querySelector('#dashboard-view');
    const chaptersView = document.querySelector('#chapters-view');
    const routinesView = document.querySelector('#routines-view');
    
    // Navigation
    const navLinks = document.querySelectorAll('nav a');

    // Modal Triggers and Controls
    const newRoutineBtn = document.querySelector('#routines-view .primary-btn');
    const routineModal = document.querySelector('#routine-modal');
    const closeRoutineModalBtn = document.querySelector('#close-routine-modal');

    const openChaptersModalBtn = document.querySelector('#open-chapters-modal-btn');
    const chaptersModal = document.querySelector('#chapters-modal');
    const closeChaptersModalBtn = document.querySelector('#close-chapters-modal-btn');

    const notesModal = document.querySelector('#notes-modal');
    const closeNotesModalBtn = document.querySelector('#close-notes-modal-btn');

    console.log("App UI Initialized.");

    // --- VIEW SWITCHING LOGIC ---
    function switchView(viewName) {
        dashboardView.classList.add('hidden');
        chaptersView.classList.add('hidden');
        routinesView.classList.add('hidden');

        if (viewName === 'dashboard') {
            dashboardView.classList.remove('hidden');
        } else if (viewName === 'chapters') {
            chaptersView.classList.remove('hidden');
        } else if (viewName === 'routines') {
            routinesView.classList.remove('hidden');
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            const viewText = this.textContent.toLowerCase();
            if (viewText === 'all chapters') {
                switchView('chapters');
            } else if (viewText === 'routines') {
                switchView('routines');
            } else {
                switchView('dashboard');
            }
        });
    });

    // --- MODAL CONTROL LISTENERS ---
    
    // Routines Modal
    newRoutineBtn.addEventListener('click', () => {
        // This logic is now in firestore.js, but we keep the open action here
        routineModal.classList.remove('hidden');
    });
    closeRoutineModalBtn.addEventListener('click', () => routineModal.classList.add('hidden'));

    // Chapters Modal
    openChaptersModalBtn.addEventListener('click', () => chaptersModal.classList.remove('hidden'));
    closeChaptersModalBtn.addEventListener('click', () => chaptersModal.classList.add('hidden'));

    // Notes Modal (The open logic is in firestore.js, close is here)
    closeNotesModalBtn.addEventListener('click', () => notesModal.classList.add('hidden'));

});