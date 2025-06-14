document.addEventListener('DOMContentLoaded', function () {

    const FIXED_SUBJECTS = [
    { id: "phy1", name: "Physics 1st Paper" },
    { id: "phy2", name: "Physics 2nd Paper" },
    { id: "chem1", name: "Chemistry 1st Paper" },
    { id: "chem2", name: "Chemistry 2nd Paper" },
    { id: "math1", name: "Math 1st Paper" },
    { id: "math2", name: "Math 2nd Paper" },
    { id: "bio1", name: "Biology 1st Paper" },
    { id: "bio2", name: "Biology 2nd Paper" },
    { id: "gk", name: "General Knowledge" },
    { id: "eng", name: "English" }
    ];

    // 🔁 Add fixed subjects if Firestore has none yet
    db.collection('subjects').get().then(snapshot => {
        if (snapshot.empty) {
            FIXED_SUBJECTS.forEach(sub => {
                db.collection('subjects').doc(sub.id).set({ name: sub.name });
            });
        }
    });


    let currentEditId = null;
    let currentNotesChapterId = null;
    let allSubjects = [];
    let allChapters = [];
    let allRoutines = [];

    const routinesGrid = document.querySelector('#routines-view .dashboard-grid');
    const routineForm = document.querySelector('#routine-form');
    const modalTitle = document.querySelector('#modal-title');
    const modalSubmitBtn = document.querySelector('#modal-submit-btn');
    const routineModal = document.querySelector('#routine-modal');
    const routineChaptersChecklist = document.querySelector('#routine-chapters-checklist');
    const routineSubjectFilter = document.querySelector('#routine-subject-filter');
    const chaptersDisplayArea = document.querySelector('#chapters-display-area');
    const addSubjectForm = document.querySelector('#add-subject-form');
    const addChapterForm = document.querySelector('#add-chapter-form');
    const subjectSelectForNewChapter = document.querySelector('#chapter-subject');
    const notesForm = document.querySelector('#notes-form');
    const notesTextarea = document.querySelector('#chapter-notes-textarea');
    const upcomingRoutinesGrid = document.querySelector('#upcoming-routines-grid');
    const weakChaptersBox = document.querySelector('#weak-chapters-box');
    const missedRoutinesBox = document.querySelector('#missed-routines-box');
    const newRoutineBtn = document.querySelector('#open-routine-modal-btn');
    document.querySelectorAll('.date-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const input = icon.parentElement.querySelector('input[type="date"]');
            input.showPicker?.(); // Chrome
            input.focus(); // fallback
        });
    });

    document.querySelector('#add-subject-form')?.closest('.card')?.remove();

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal-backdrop').classList.add('hidden');
        });
    });

    document.querySelector('#open-chapters-modal-btn').addEventListener('click', () => {
        document.querySelector('#chapters-modal').classList.remove('hidden');
    });
    document.querySelector('#close-chapters-modal-btn').addEventListener('click', () => {
        document.querySelector('#chapters-modal').classList.add('hidden');
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-backdrop').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });




    db.collection('subjects').onSnapshot(snapshot => {
        // Force use of FIXED_SUBJECTS only
        allSubjects = FIXED_SUBJECTS;
        populateSubjectDropdowns();
        renderAllContent();
    });
    function getPreviousRoutineChapters(dateString) {
        const prevRoutines = allRoutines
            .filter(r => r.date < dateString)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (prevRoutines.length === 0) return [];

        return prevRoutines[0].chapterNames || [];
    }



    db.collection('chapters').orderBy('subjectId').orderBy('number', 'asc').onSnapshot(snapshot => {
        allChapters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort manually: first by subjectId, then by `number` if exists, else fallback to name
        allChapters.sort((a, b) => {
            if (a.subjectId !== b.subjectId) {
                return a.subjectId.localeCompare(b.subjectId);
            }

            const aNum = typeof a.number === 'number' ? a.number : Infinity;
            const bNum = typeof b.number === 'number' ? b.number : Infinity;

            if (aNum !== bNum) return aNum - bNum;

            return a.name.localeCompare(b.name);
        });

        renderAllContent();
    });


    db.collection('routines').orderBy('date', 'asc').onSnapshot(snapshot => {
        allRoutines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAllContent();
    });

    function handleError(error) {
        console.error("Firestore Error:", error);
        alert("A Firestore error occurred.");
    }

    function renderAllContent() {
        renderChapterTables();
        renderRoutinesPage();
        renderDashboard();
    }

    function populateSubjectDropdowns() {
        subjectSelectForNewChapter.innerHTML = '<option value="">-- Select a Subject --</option>';
        routineSubjectFilter.innerHTML = '<option value="">-- All Subjects --</option>';
        allSubjects.forEach(subject => {
            const opt1 = new Option(subject.name, subject.id);
            const opt2 = new Option(subject.name, subject.id);
            subjectSelectForNewChapter.appendChild(opt1);
            routineSubjectFilter.appendChild(opt2);
        });
    }

    function renderChapterTables() {
//        if (!chaptersDisplayArea.offsetParent) return;
        document.querySelector('#chapters-display-area .loader')?.remove();

        const chaptersBySubject = {};
        allChapters.forEach(c => {
            if (!chaptersBySubject[c.subjectId]) chaptersBySubject[c.subjectId] = [];
            chaptersBySubject[c.subjectId].push(c);
        });

        chaptersDisplayArea.innerHTML = '';
        allSubjects.forEach(subject => {
            const subjectChapters = chaptersBySubject[subject.id] || [];
            const container = document.createElement('div');
            container.innerHTML = `<h3>${subject.name}</h3>`;

            const table = document.createElement('table');
            table.classList.add('subject-table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th class="col-chapter">Chapter</th>
                        <th class="col-status">Status</th>
                        <th class="col-proficiency">Proficiency</th>
                        <th class="col-exams">Exams</th>
                        <th class="col-notes">Notes</th>
                    </tr>
                </thead>
            `;

            const tbody = document.createElement('tbody');
            subjectChapters.forEach(c => {
                const row = tbody.insertRow();
                row.dataset.id = c.id;
                row.innerHTML = `
                    <td class="col-chapter">${c.name}</td>
                    <td class="col-status">
                        <select class="table-select status-select">
                            <option value="Not Started" ${c.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                            <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Done" ${c.status === 'Done' ? 'selected' : ''}>Done</option>
                        </select>
                    </td>
                    <td class="col-proficiency">
                        <select class="table-select proficiency-select">
                            <option value="N/A" ${c.proficiency === 'N/A' ? 'selected' : ''}>N/A</option>
                            <option value="Weak" ${c.proficiency === 'Weak' ? 'selected' : ''}>Weak</option>
                            <option value="Intermediate" ${c.proficiency === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                            <option value="Strong" ${c.proficiency === 'Strong' ? 'selected' : ''}>Strong</option>
                        </select>
                    </td>
                    <td class="col-exams">
                        <button class="decrement-exam-btn">-</button>
                        <span>${c.examCount}</span>
                        <button class="increment-exam-btn">+</button>
                    </td>
                    <td class="col-notes">
                        <button class="notes-btn"><i class="fa-regular fa-note-sticky"></i></button>
                    </td>
                `;
            });

            table.appendChild(tbody);
            container.appendChild(table);
            chaptersDisplayArea.appendChild(container);
        });
    }

    function renderRoutinesPage() {
//        if (!routinesGrid.offsetParent) return;
        document.querySelector('#routines-view .loader')?.remove();
        routinesGrid.innerHTML = '';

        if (allRoutines.length === 0) {
            routinesGrid.innerHTML = '<p style="color: var(--text-secondary);">No routines found. Add one!</p>';
            return;
        }

        const groupedByDate = {};
        allRoutines.forEach(r => {
            if (!groupedByDate[r.date]) groupedByDate[r.date] = [];
            groupedByDate[r.date].push(r);
        });

        Object.entries(groupedByDate).forEach(([date, routines]) => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.date = date;

            const formattedDate = new Date(date).toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            let chaptersList = routines.flatMap(r => r.chapterNames || []);
            let examTopicsList = routines.map(r => r.exam_topics || '').filter(Boolean);

            chaptersList = [...new Set(chaptersList)];
            examTopicsList = [...new Set(examTopicsList)];

            const chaptersHTML = chaptersList.length
                ? `<ul>${chaptersList.map(c => `<li>${c}</li>`).join('')}</ul>`
                : `<p>None</p>`;

            const examsHTML = examTopicsList.length
                ? `<ul>${examTopicsList.map(e => `<li>${e}</li>`).join('')}</ul>`
                : `<p>None</p>`;

            card.innerHTML = `
                <div class="card-header">
                    <h3>${formattedDate}</h3>
                    <div class="card-buttons">
                        <button class="edit-btn" data-date="${date}"><i class="fa-solid fa-pen"></i></button>
                        <button class="delete-btn" data-date="${date}"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <h4>Class Topics:</h4>${chaptersHTML}
                <h4>Exam:</h4>${examsHTML}
                <div class="missed-routine-tracker">
                    ${routines.map(r => `
                        <div style="display:flex;align-items:center;gap:8px;">
                            <input type="checkbox" class="missed-routine-checkbox" id="missed-${r.id}" data-id="${r.id}" ${r.isMissed ? 'checked' : ''}>
                            <label for="missed-${r.id}">Missed</label>
                        </div>
                    `).join('')}
                </div>

            `;

            routinesGrid.appendChild(card);
        });
    }

        function renderDashboard() {
        if (!document.querySelector('#dashboard-view').offsetParent) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split('T')[0];

        // === Upcoming Routines ===
        const upcomingRoutines = allRoutines.filter(r => r.date >= todayString);
        document.querySelector('#upcoming-routines-grid .loader')?.remove();
        upcomingRoutinesGrid.innerHTML = '';

        if (upcomingRoutines.length === 0) {
            upcomingRoutinesGrid.innerHTML = '<p style="color: var(--text-secondary);">No upcoming routines.</p>';
        } else {
            upcomingRoutines.slice(0, 2).forEach(routine => {
                const card = document.createElement('div');
                card.classList.add('card');

                const routineDate = new Date(routine.date);
                let dateLabel = routineDate.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                });

                if (routine.date === todayString) {
                    dateLabel = `Today, ${dateLabel}`;
                    card.classList.add('today');
                }

                const classTopicsHTML = routine.chapterNames?.length
                    ? `<ul>${routine.chapterNames.map(name => `<li>${name}</li>`).join('')}</ul>`
                    : `<p>None</p>`;

                card.innerHTML = `
                    <h3>${dateLabel}</h3>
                    <h4>Class Topics:</h4>${classTopicsHTML}
                    <h4>Exam:</h4><p>${
                        routine.exam_topics && routine.exam_topics.trim()
                            ? routine.exam_topics
                            : getPreviousRoutineChapters(routine.date).join(', ') + ' <small style="color:var(--text-secondary);">(from previous class)</small>' || 'None'
                    }</p>

                `;

                upcomingRoutinesGrid.appendChild(card);
            });
        }

        // === Missed Routines ===
        const missedRoutines = allRoutines.filter(r => r.isMissed && r.date < todayString);
        document.querySelector('#missed-routines-box .loader')?.remove();
        missedRoutinesBox.innerHTML = '';

        if (missedRoutines.length > 0) {
            const card = document.createElement('div');
            card.classList.add('card');

            missedRoutines.forEach(routine => {
                const item = document.createElement('div');
                item.classList.add('missed-routine-item');
                item.innerHTML = `<p><strong>${new Date(routine.date).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric'
                })}:</strong> ${routine.class_topics || 'General Study'}</p>`;
                card.appendChild(item);
            });

            missedRoutinesBox.appendChild(card);
        } else {
            missedRoutinesBox.innerHTML = '<p>You\'re all caught up!</p>';
        }

        // === Weak Chapters (last 7 days + Weak + Done) ===
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        db.collection('chapters')
            .where('status', '==', 'Done')
            .where('proficiency', '==', 'Weak')
            .where('completionDate', '>=', sevenDaysAgo)
            .onSnapshot(snapshot => {
                document.querySelector('#weak-chapters-box .loader')?.remove();
                weakChaptersBox.innerHTML = '';

                if (snapshot.empty) {
                    weakChaptersBox.innerHTML = '<p>No weak chapters to review. Great work!</p>';
                    return;
                }

                const card = document.createElement('div');
                card.classList.add('card');

                snapshot.forEach(doc => {
                    const chapter = doc.data();
                    const subject = allSubjects.find(s => s.id === chapter.subjectId);
                    const subjectName = subject ? subject.name : '...';

                    const item = document.createElement('p');
                    item.classList.add('weak-chapter-item');
                    item.innerHTML = `<strong>${subjectName}:</strong> ${chapter.name}`;
                    card.appendChild(item);
                });

                weakChaptersBox.appendChild(card);
            }, err => {
                weakChaptersBox.innerHTML = `<p style="color: var(--high-priority);">Error loading weak chapters.</p>`;
            });
    }

    // === Event Listeners ===
    addSubjectForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = addSubjectForm['subject-name'].value.trim();
        if (!name) return;
        db.collection('subjects').add({ name }).then(() => addSubjectForm.reset()).catch(handleError);
    });

    // 🔥 DISABLED because we use auto-numbered version in enhancements.js
    // addChapterForm.addEventListener('submit', e => {
    //     e.preventDefault();
    //     const name = addChapterForm['chapter-name'].value.trim();
    //     const subjectId = subjectSelectForNewChapter.value;
    //     if (!subjectId || !name) return alert("Please fill out both fields.");
    //     db.collection('chapters').add({
    //         name, subjectId,
    //         status: 'Not Started',
    //         proficiency: 'N/A',
    //         examCount: 0,
    //         notes: '',
    //         completionDate: null
    //     }).then(() => addChapterForm.reset()).catch(handleError);
    // });


    chaptersDisplayArea.addEventListener('change', e => {
        if (!e.target.classList.contains('table-select')) return;
        const id = e.target.closest('tr')?.dataset.id;
        if (!id) return;
        const data = {};

        if (e.target.classList.contains('status-select')) {
            const newStatus = e.target.value;
            data.status = newStatus;
            data.completionDate = newStatus === 'Done'
                ? firebase.firestore.FieldValue.serverTimestamp()
                : firebase.firestore.FieldValue.delete();
        } else if (e.target.classList.contains('proficiency-select')) {
            data.proficiency = e.target.value;
        }

        db.collection('chapters').doc(id).update(data).catch(handleError);
    });

    chaptersDisplayArea.addEventListener('click', e => {
        const id = e.target.closest('tr')?.dataset.id;
        if (!id) return;

        if (e.target.classList.contains('increment-exam-btn')) {
            db.collection('chapters').doc(id).update({
                examCount: firebase.firestore.FieldValue.increment(1)
            });
        }

        if (e.target.classList.contains('decrement-exam-btn')) {
            const count = parseInt(e.target.parentElement.querySelector('span').textContent);
            if (count > 0) {
                db.collection('chapters').doc(id).update({
                    examCount: firebase.firestore.FieldValue.increment(-1)
                });
            }
        }

        if (e.target.classList.contains('notes-btn')) {
            currentNotesChapterId = id;
            db.collection('chapters').doc(id).get().then(doc => {
                if (doc.exists) {
                    notesTextarea.value = doc.data().notes || '';
                    document.querySelector('#notes-modal').classList.remove('hidden');
                }
            });
        }
    });

    notesForm.addEventListener('submit', e => {
        e.preventDefault();
        if (!currentNotesChapterId) return;
        db.collection('chapters').doc(currentNotesChapterId).update({
            notes: notesTextarea.value
        }).then(() => {
            document.querySelector('#notes-modal').classList.add('hidden');
        }).catch(handleError);
    });

    routinesGrid.addEventListener('click', e => {
        const card = e.target.closest('.card');
        if (!card) return;

        const date = e.target.dataset.date;

        // Delete all routines for this date
        if (e.target.classList.contains('delete-btn')) {
            if (confirm("Delete ALL routines for this date?")) {
                allRoutines.filter(r => r.date === date).forEach(r => {
                    db.collection('routines').doc(r.id).delete().catch(handleError);
                });
            }
        }

        // Edit routines on this date
        if (e.target.classList.contains('edit-btn')) {
            const matchedRoutines = allRoutines.filter(r => r.date === date);
            if (matchedRoutines.length === 0) return;

            currentEditId = matchedRoutines.map(r => r.id); // Store all matching IDs

            const allChapters = matchedRoutines.flatMap(r => r.chapterIds || []);
            const allChapterNames = matchedRoutines.flatMap(r => r.chapterNames || []);
            const examTopics = matchedRoutines.map(r => r.exam_topics).filter(Boolean).join('\n');

            routineForm['routine-date'].value = date;
            routineForm['exam-topics'].value = examTopics;
            modalTitle.textContent = "Edit Routine";
            modalSubmitBtn.textContent = "Update";

            populateChapterChecklist('', allChapters);
            routineModal.classList.remove('hidden');
        }
    });


    routinesGrid.addEventListener('change', e => {
        if (e.target.classList.contains('missed-routine-checkbox')) {
            const id = e.target.dataset.id;
            db.collection('routines').doc(id).update({
                isMissed: e.target.checked
            }).catch(handleError);
        }
    });


    newRoutineBtn.addEventListener('click', () => {
        routineForm['routine-date'].addEventListener('change', () => {
            const selectedDate = routineForm['routine-date'].value;
            if (!selectedDate || currentEditId) return;

            const previousTopics = getPreviousRoutineChapters(selectedDate);
            if (previousTopics.length > 0) {
                routineForm['exam-topics'].value = previousTopics.join('\n');
            }
        });
        currentEditId = null;
        routineForm.reset();
        modalTitle.textContent = "Add Routine";
        modalSubmitBtn.textContent = "Save";
        routineSubjectFilter.value = '';

        const today = new Date().toISOString().split('T')[0];
        const previousTopics = getPreviousRoutineChapters(today);

        // Show previous chapters as default exam topic (editable)
        if (previousTopics.length > 0) {
            routineForm['exam-topics'].value = previousTopics.join('\n');
        }

        populateChapterChecklist();
        routineModal.classList.remove('hidden');
    });


    routineSubjectFilter.addEventListener('change', () => {
        const checked = Array.from(routineChaptersChecklist.querySelectorAll('input:checked')).map(cb => cb.value);
        populateChapterChecklist(routineSubjectFilter.value, checked);
    });

    function populateChapterChecklist(subjectId = '', checkedIds = []) {
        routineChaptersChecklist.innerHTML = '';
        const filtered = allChapters.filter(c => !subjectId || c.subjectId === subjectId);
        if (filtered.length === 0) {
            routineChaptersChecklist.innerHTML = `<p class="checklist-placeholder">No chapters for this subject.</p>`;
            return;
        }

        filtered.forEach(c => {
            const isChecked = checkedIds.includes(c.id);
            const subject = allSubjects.find(s => s.id === c.subjectId);
            const label = subject ? subject.name : '...';
            const div = document.createElement('div');
            div.className = 'checklist-item';
            div.innerHTML = `
                <input type="checkbox" id="ch-${c.id}" value="${c.id}" data-name="${c.name}" ${isChecked ? 'checked' : ''}>
                <label for="ch-${c.id}">${c.name} <small>(${label})</small></label>
            `;
            routineChaptersChecklist.appendChild(div);
        });
    }

    routineForm.addEventListener('submit', e => {
        e.preventDefault();
        const date = routineForm['routine-date'].value;
        const examTopics = routineForm['exam-topics'].value;
        const selected = Array.from(routineChaptersChecklist.querySelectorAll('input:checked'));

        if (!date || selected.length === 0) {
            alert("Please select a date and at least one chapter.");
            return;
        }

        const chapterIds = selected.map(cb => cb.value);
        const chapterNames = selected.map(cb => cb.dataset.name);

        const data = {
            date,
            exam_topics: examTopics,
            chapterIds,
            chapterNames,
            class_topics: chapterNames.join(', '),
            isMissed: false
        };

        let promise;
        if (currentEditId) {
            // Delete old entries
            promise = Promise.all(
                currentEditId.map(id => db.collection('routines').doc(id).delete())
            ).then(() => {
                return db.collection('routines').add({
                    ...data,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
        } else {
            promise = db.collection('routines').add({
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }



        promise.then(() => {
            routineModal.classList.add('hidden');
            routineForm.reset();
        }).catch(handleError);
    });
});
