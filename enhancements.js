// enhancements.js
// 🧠 Add Chapter Numbering, Previous Class Topics & Chapter Delete Functionality

document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();

    // === 1. Auto-number Chapters on Add ===
    const addChapterForm = document.getElementById('add-chapter-form');
    if (addChapterForm) {
        addChapterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameInput = addChapterForm['chapter-name'];
            const subjectId = addChapterForm['chapter-subject'].value;
            const name = nameInput.value.trim();
            if (!subjectId || !name) return;

            try {
                const snapshot = await db.collection('chapters')
                    .where('subjectId', '==', subjectId).get();

                const chapterNumber = snapshot.size + 1;
                const numberedName = `${chapterNumber}. ${name}`;

                await db.collection('chapters').add({
                    name: numberedName,
                    subjectId,
                    status: 'Not Started',
                    number: chapterNumber,
                    proficiency: 'N/A',
                    examCount: 0,
                    notes: '',
                    completionDate: null
                });

                nameInput.value = '';
            } catch (err) {
                console.error("Enhanced Chapter Error:", err);
                alert("Couldn't number chapter correctly.");
            }
        });
    }

    // === 2. Show Previous Class Topics in Routines ===
    const routinesGrid = document.getElementById('routines-grid');
    if (routinesGrid) {
        const observer = new MutationObserver(async () => {
            const cards = routinesGrid.querySelectorAll('.card');
            if (cards.length < 2) return;

            const sortedCards = Array.from(cards).sort((a, b) => {
                return new Date(a.dataset.date) - new Date(b.dataset.date);
            });

            for (let i = 1; i < sortedCards.length; i++) {
                const prevCard = sortedCards[i - 1];
                const currentCard = sortedCards[i];

                const classTopicHTML = prevCard.querySelector('h4 + ul')?.outerHTML || '<p>None</p>';

                if (!currentCard.querySelector('.previous-topic')) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'previous-topic';
                    wrapper.innerHTML = `
                        <h4>Previous Class Topic:</h4>
                        ${classTopicHTML}
                    `;
                    currentCard.insertBefore(wrapper, currentCard.querySelector('.missed-routine-tracker'));
                }
            }
        });

        observer.observe(routinesGrid, { childList: true, subtree: true });
    }

    // === 3. Add ❌ Delete Button to Each Chapter Row ===
    const chaptersDisplayArea = document.getElementById('chapters-display-area');
    const addDeleteButtons = () => {
        if (!chaptersDisplayArea) return;

        chaptersDisplayArea.querySelectorAll('tbody tr').forEach(row => {
            if (row.querySelector('.delete-chapter-btn')) return; // Already added

            const deleteTd = document.createElement('td');
            const btn = document.createElement('button');
            btn.textContent = '❌';
            btn.className = 'delete-chapter-btn';
            btn.style.color = 'var(--high-priority)';
            btn.style.cursor = 'pointer';
            btn.style.border = 'none';
            btn.style.background = 'transparent';
            btn.style.fontSize = '1.1rem';

            btn.addEventListener('click', () => {
                const chapterId = row.dataset.id;
                if (!chapterId) return;
                if (confirm('Are you sure you want to delete this chapter?')) {
                    db.collection('chapters').doc(chapterId).delete().catch(err => {
                        console.error('Delete error:', err);
                        alert('Could not delete chapter.');
                    });
                }
            });

            deleteTd.appendChild(btn);
            row.appendChild(deleteTd);
        });

        // Add header if not already added
        const headers = chaptersDisplayArea.querySelectorAll('thead tr');
        headers.forEach(header => {
            if (!header.querySelector('.col-delete')) {
                const th = document.createElement('th');
                th.className = 'col-delete';
                th.textContent = 'Delete';
                header.appendChild(th);
            }
        });
    };

    const observer = new MutationObserver(addDeleteButtons);
    if (chaptersDisplayArea) {
        observer.observe(chaptersDisplayArea, { childList: true, subtree: true });
    }
});
