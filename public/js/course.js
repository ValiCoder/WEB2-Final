document.addEventListener('DOMContentLoaded', async function() {
    const titleEl = document.getElementById('courseTitle');
    const topicEl = document.getElementById('courseTopic');
    const ownerEl = document.getElementById('courseOwner');
    const lessonsList = document.getElementById('lessonsList');
    const lessonCount = document.getElementById('lessonCount');
    const emptyState = document.getElementById('emptyState');
    const startLearning = document.getElementById('startLearning');
    const enrollBtn = document.getElementById('enrollBtn');

    const params = new URLSearchParams(window.location.search);
    const courseId = params.get('id');

    if (!courseId) {
        titleEl.textContent = 'Course not found';
        topicEl.textContent = 'Missing course id';
        return;
    }

    startLearning.setAttribute('href', `lectures.html?course=${courseId}`);

    // Get current user info
    let currentUser = null;
    try {
        const userRes = await fetch('/api/me');
        if (userRes.ok) {
            currentUser = await userRes.json();
        }
    } catch (err) {
        console.log('Not logged in');
    }

    fetch(`/api/catalog/courses/${courseId}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load course');
            return response.json();
        })
        .then(course => {
            titleEl.textContent = course.name || 'Untitled Course';
            topicEl.textContent = course.topic || 'Course';

            if (course.owner && course.owner.name) {
                ownerEl.textContent = `Instructor: ${course.owner.name}`;
            } else {
                ownerEl.textContent = 'Could not load instructor information';
            }

            // Check if current user is owner or admin
            const isOwner = currentUser && course.owner && 
                (String(currentUser.id) === String(course.owner._id) || currentUser.role === 'admin');

            // Show appropriate button based on enrollment status
            if (currentUser && currentUser.role === 'learner') {
                if (course.isEnrolled) {
                    startLearning.classList.remove('d-none');
                } else {
                    enrollBtn.classList.remove('d-none');
                }
            } else if (isOwner) {
                startLearning.classList.remove('d-none');
            }

            renderLessons(course.lessons || [], isOwner);
        })
        .catch(() => {
            titleEl.textContent = 'Unable to load course';
            topicEl.textContent = 'Please try again later';
            renderLessons([], false);
        });
    
    // Handle enrollment
    enrollBtn.addEventListener('click', async function() {
        try {
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error('Failed to enroll in course');
            }
            
            // Reload page to show updated status
            window.location.reload();
        } catch (error) {
            alert('Error enrolling in course: ' + error.message);
            console.error(error);
        }
    });

    function renderLessons(lessons, isOwner) {
        lessonsList.innerHTML = '';
        lessonCount.textContent = `${lessons.length} lesson${lessons.length !== 1 ? 's' : ''}`;

        if (!lessons.length) {
            emptyState.classList.remove('d-none');
            return;
        }

        emptyState.classList.add('d-none');

        lessons.forEach(lesson => {
            const item = document.createElement('div');
            item.className = 'list-group-item';
            
            // Show published status badge if lesson is draft
            const statusBadge = lesson.isPublished === false 
                ? '<span class="badge bg-warning text-dark ms-2">Draft</span>' 
                : '<span class="badge bg-success ms-2">Published</span>';
            
            // Show publish button for owners if lesson is not published
            const publishBtn = (isOwner && lesson.isPublished === false)
                ? `<button class="btn btn-sm btn-success" onclick="publishLesson('${lesson.id}')">Publish</button>`
                : '';
            
            item.innerHTML = `
                <div class="lesson-item">
                    <div>
                        <div class="fw-semibold">
                            ${escapeHtml(lesson.title || 'Untitled lesson')}
                            ${statusBadge}
                        </div>
                        <div class="lesson-meta">
                            <span class="lesson-type">${escapeHtml(lesson.type || 'text')}</span>
                            ${lesson.duration ? `<span>${lesson.duration} min</span>` : ''}
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        ${publishBtn}
                        <span class="badge bg-light text-dark">#${lesson.order ?? '-'}</span>
                    </div>
                </div>
            `;
            lessonsList.appendChild(item);
    
    // Make publishLesson global so it can be called from onclick
    window.publishLesson = async function(lessonId) {
        if (!confirm('Publish this lesson? It will become visible to all students.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/lessons/${lessonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: true })
            });
            
            if (!response.ok) {
                throw new Error('Failed to publish lesson');
            }
            
            // Reload the page to show updated status
            window.location.reload();
        } catch (error) {
            alert('Error publishing lesson: ' + error.message);
            console.error(error);
        }
    };
        });
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
