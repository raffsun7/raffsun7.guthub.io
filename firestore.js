// This file handles all interactions with the Firestore database.
document.addEventListener('DOMContentLoaded', function() {

    // --- STATE & SELECTORS for data interaction ---
    let currentEditId = null; 
    let currentNotesChapterId = null;
    let subjects = [];
    let chapters = [];

    const dashboardGrid = document.querySelector('#routines-view .dashboard-grid');
    const routineForm = document.querySelector('#routine-form');
    const modalTitle = document.querySelector('#modal-title');
    const modalSubmitBtn = document.querySelector('#modal-submit-btn');
    const routineModal = document.querySelector('#routine-modal');
    const routineChaptersChecklist = document.querySelector('#routine-chapters-checklist');
    
    const chaptersDisplayArea = document.querySelector('#chapters-display-area');
    const addSubjectForm = document.querySelector('#add-subject-form');
    const addChapterForm = document.querySelector('#add-chapter-form');
    
    const notesForm = document.querySelector('#notes-form');
    const notesTextarea = document.querySelector('#chapter-notes-textarea');
    
    const upcomingRoutinesGrid = document.querySelector('#upcoming-routines-grid');
    const weakChaptersBox = document.querySelector('#weak-chapters-box');
    const missedRoutinesBox = document.querySelector('#missed-routines-box');

    // --- SMART DASHBOARD LOGIC ---
    function initializeDashboard() {
        const today = new Date(); today.setHours(0, 0, 0, 0); const todayString = today.toISOString().split('T')[0];
        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        db.collection('routines').where('date', '>=', todayString).orderBy('date', 'asc').limit(2).onSnapshot(snapshot => {
            if(upcomingRoutinesGrid) upcomingRoutinesGrid.innerHTML = '';
            if (snapshot.empty) { upcomingRoutinesGrid.innerHTML = '<p style="color: var(--text-secondary);">No upcoming routines.</p>'; return; }
            snapshot.forEach(doc => { const routine = doc.data(); const card = document.createElement('div'); card.classList.add('card'); const routineDate = new Date(routine.date); const formattedDate = routineDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }); let dateLabel = formattedDate; if (routine.date === todayString) { dateLabel = `Today, ${formattedDate}`; card.classList.add('today'); } card.innerHTML = `<div class="card-header"><h3>${dateLabel}</h3></div><h4>Class Topics:</h4><p>${routine.class_topics || 'None'}</p><br><h4>Exam Topics:</h4><p>${routine.exam_topics || 'None'}</p>`; upcomingRoutinesGrid.appendChild(card); });
        });
        db.collection('chapters').where('status', '==', 'Done').where('proficiency', '==', 'Weak').where('completionDate', '>=', sevenDaysAgo).onSnapshot(snapshot => {
            if(weakChaptersBox) weakChaptersBox.innerHTML = '';
            if (snapshot.empty) { weakChaptersBox.innerHTML = '<p>No weak chapters to review.</p>'; return; }
            const containerCard = document.createElement('div'); containerCard.classList.add('card');
            snapshot.forEach(doc => { const chapter = doc.data(); const subject = subjects.find(s => s.id === chapter.subjectId); const subjectName = subject ? subject.name : '...'; const item = document.createElement('p'); item.classList.add('weak-chapter-item'); item.innerHTML = `<strong>${subjectName}:</strong> ${chapter.name}`; containerCard.appendChild(item); });
            weakChaptersBox.appendChild(containerCard);
        });
        db.collection('routines').where('isMissed', '==', true).where('date', '<', todayString).orderBy('date', 'desc').onSnapshot(snapshot => {
            if(missedRoutinesBox) missedRoutinesBox.innerHTML = '';
            if (snapshot.empty) { missedRoutinesBox.innerHTML = '<p>You\'re all caught up!</p>'; return; }
            const containerCard = document.createElement('div'); containerCard.classList.add('card');
            snapshot.forEach(doc => { const routine = doc.data(); const formattedDate = new Date(routine.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }); const item = document.createElement('div'); item.classList.add('missed-routine-item'); item.innerHTML = `<p><strong>${formattedDate}:</strong> ${routine.class_topics || 'General Study'}</p>`; containerCard.appendChild(item); });
            missedRoutinesBox.appendChild(containerCard);
        }, error => { if(missedRoutinesBox) missedRoutinesBox.innerHTML = `<p style="color: var(--high-priority);">Error. A database index is required. Check console (F12) for a link to create it.</p>`; });
    }

    // --- CHAPTERS PAGE LOGIC ---
    db.collection('subjects').orderBy('name', 'asc').onSnapshot(snapshot => {
        subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const subjectSelect = document.querySelector('#chapter-subject');
        subjectSelect.innerHTML = '<option value="">-- Select a Subject --</option>'; 
        subjects.forEach(subject => { const option = document.createElement('option'); option.value = subject.id; option.textContent = subject.name; subjectSelect.appendChild(option); });
        renderChapterTables(); initializeDashboard();
    });
    db.collection('chapters').orderBy('name', 'asc').onSnapshot(snapshot => { chapters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderChapterTables(); });
    
    function renderChapterTables() {
        document.querySelector('#chapters-display-area .loader')?.remove();
        const chaptersBySubject = {}; chapters.forEach(c => { if (!chaptersBySubject[c.subjectId]) chaptersBySubject[c.subjectId] = []; chaptersBySubject[c.subjectId].push(c); });
        chaptersDisplayArea.innerHTML = '';
        subjects.forEach(subject => {
            const subjectChapters = chaptersBySubject[subject.id] || [];
            const container = document.createElement('div');
            container.innerHTML = `<h3 style="margin-bottom: 15px; margin-top: 30px; border-bottom: 1px solid var(--accent-cyan); padding-bottom: 10px;">${subject.name}</h3>`;
            const table = document.createElement('table'); table.classList.add('subject-table');
            table.innerHTML = `<thead><tr><th class="col-chapter">Chapter</th><th class="col-status">Status</th><th class="col-proficiency">Proficiency</th><th class="col-exams">Exams</th><th class="col-notes">Notes</th></tr></thead>`;
            const tbody = document.createElement('tbody');
            subjectChapters.forEach(c => { const row = tbody.insertRow(); row.dataset.id = c.id; row.innerHTML = `<td class="col-chapter">${c.name}</td><td class="col-status"><select class="table-select status-select"><option ${c.status==='Not Started'?'selected':''} value="Not Started">Not Started</option><option ${c.status==='In Progress'?'selected':''} value="In Progress">In Progress</option><option ${c.status==='Done'?'selected':''} value="Done">Done</option></select></td><td class="col-proficiency"><select class="table-select proficiency-select"><option ${c.proficiency==='N/A'?'selected':''} value="N/A">N/A</option><option ${c.proficiency==='Weak'?'selected':''} value="Weak">Weak</option><option ${c.proficiency==='Intermediate'?'selected':''} value="Intermediate">Intermediate</option><option ${c.proficiency==='Strong'?'selected':''} value="Strong">Strong</option></select></td><td class="col-exams"><button class="decrement-exam-btn">-</button><span>${c.examCount}</span><button class="increment-exam-btn">+</button></td><td class="col-notes"><button class="notes-btn">📝</button></td>`; });
            table.appendChild(tbody); container.appendChild(table); chaptersDisplayArea.appendChild(container);
        });
    }
    
    // --- ROUTINES PAGE LOGIC ---
    db.collection('routines').orderBy('date', 'asc').onSnapshot(snapshot => {
        document.querySelector('#routines-view .loader')?.remove();
        dashboardGrid.innerHTML = '';
        snapshot.forEach(doc => { const routine = doc.data(); const docId = doc.id; const card = document.createElement('div'); card.classList.add('card'); card.dataset.id = docId; const formattedDate = new Date(routine.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }); const classTopicsHTML = (routine.chapterNames && routine.chapterNames.length) ? `<ul>${routine.chapterNames.map(name => `<li>${name}</li>`).join('')}</ul>` : `<p>${routine.class_topics || 'None'}</p>`; card.innerHTML = `<div class="card-header"><h3>${formattedDate}</h3><div class="card-buttons"><button class="edit-btn">✏️</button><button class="delete-btn">&times;</button></div></div><h4>Class Topics:</h4>${classTopicsHTML}<br><h4>Exam Topics:</h4><p>${routine.exam_topics || 'None'}</p><div class="missed-routine-tracker"><input type="checkbox" class="missed-routine-checkbox" id="missed-${docId}" ${routine.isMissed ? 'checked' : ''}><label for="missed-${docId}">Mark as Missed</label></div>`; dashboardGrid.appendChild(card); });
    });

    // --- EVENT LISTENERS ---
    addSubjectForm.addEventListener('submit', (e) => { e.preventDefault(); const name = addSubjectForm['subject-name'].value; if(name) db.collection('subjects').add({name}).then(()=>addSubjectForm.reset()); });
    addChapterForm.addEventListener('submit', (e) => { e.preventDefault(); const name = addChapterForm['chapter-name'].value; const subjectId = addChapterForm['chapter-subject'].value; if (!subjectId || !name) return; db.collection('chapters').add({name, subjectId, status: 'Not Started', proficiency: 'N/A', examCount: 0, notes: '', completionDate: null}).then(()=>addChapterForm.reset()); });
    chaptersDisplayArea.addEventListener('change', (e) => { if (e.target.classList.contains('table-select')) { const id = e.target.closest('tr').dataset.id; const data = {}; if (e.target.classList.contains('status-select')) { const newStatus = e.target.value; data.status = newStatus; if (newStatus === 'Done') data.completionDate = firebase.firestore.FieldValue.serverTimestamp(); else data.completionDate = firebase.firestore.FieldValue.delete(); } else if (e.target.classList.contains('proficiency-select')) data.proficiency = e.target.value; db.collection('chapters').doc(id).update(data); } });
    chaptersDisplayArea.addEventListener('click', (e) => { const id = e.target.closest('tr')?.dataset.id; if (!id) return; if (e.target.classList.contains('increment-exam-btn')) { db.collection('chapters').doc(id).update({examCount: firebase.firestore.FieldValue.increment(1)}); } if (e.target.classList.contains('decrement-exam-btn')) { const count = parseInt(e.target.parentElement.querySelector('span').textContent); if (count > 0) db.collection('chapters').doc(id).update({examCount: firebase.firestore.FieldValue.increment(-1)}); } if (e.target.classList.contains('notes-btn')) { currentNotesChapterId = id; const notesModal = document.querySelector('#notes-modal'); db.collection('chapters').doc(id).get().then(doc => { if(doc.exists) { notesTextarea.value = doc.data().notes || ''; notesModal.classList.remove('hidden'); } }); } });
    notesForm.addEventListener('submit', (e) => { e.preventDefault(); const notesModal = document.querySelector('#notes-modal'); if (currentNotesChapterId) db.collection('chapters').doc(currentNotesChapterId).update({notes: notesTextarea.value}).then(()=>notesModal.classList.add('hidden')); });
    dashboardGrid.addEventListener('click', (e) => { const card = e.target.closest('.card'); if (!card) return; const id = card.dataset.id; if (e.target.classList.contains('delete-btn')) { if (confirm("Are you sure?")) db.collection('routines').doc(id).delete(); } if (e.target.classList.contains('edit-btn')) { currentEditId = id; db.collection('routines').doc(id).get().then(doc => { if (doc.exists) { populateChapterChecklist(doc.data().chapterIds || []); routineForm['routine-date'].value = doc.data().date; routineForm['exam-topics'].value = doc.data().exam_topics || ''; modalTitle.textContent = "Edit"; modalSubmitBtn.textContent = "Update"; routineModal.classList.remove('hidden'); } }); } });
    dashboardGrid.addEventListener('change', (e) => { if (e.target.classList.contains('missed-routine-checkbox')) { const id = e.target.closest('.card').dataset.id; db.collection('routines').doc(id).update({ isMissed: e.target.checked }); } });
    document.querySelector('#routines-view .primary-btn').addEventListener('click', () => { currentEditId = null; routineForm.reset(); modalTitle.textContent = "Add"; modalSubmitBtn.textContent = "Save"; populateChapterChecklist([]); });
    routineForm.addEventListener('submit', (e) => { e.preventDefault(); const selected = routineChaptersChecklist.querySelectorAll('input:checked'); const chapterIds = Array.from(selected).map(cb => cb.value); const chapterNames = Array.from(selected).map(cb => cb.dataset.name); const data = { date: routineForm['routine-date'].value, exam_topics: routineForm['exam-topics'].value, chapterIds, chapterNames }; const promise = currentEditId ? db.collection('routines').doc(currentEditId).update(data) : db.collection('routines').add({ ...data, created_at: firebase.firestore.FieldValue.serverTimestamp(), isMissed: false }); promise.then(() => { routineModal.classList.add('hidden'); routineForm.reset(); }); });
});