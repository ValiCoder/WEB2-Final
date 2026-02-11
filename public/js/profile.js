document.addEventListener('DOMContentLoaded', function() {
    const editProfileForm = document.getElementById('editProfileForm');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const userAvatar = document.getElementById('userAvatar');
    const courseManagement = document.getElementById('courseManagement');
    const enrolledCourses = document.getElementById('enrolledCourses');
    const createCourseForm = document.getElementById('createCourseForm');
    const courseList = document.getElementById('courseList');
    const courseListEmpty = document.getElementById('courseListEmpty');
    const enrolledList = document.getElementById('enrolledList');
    const enrolledEmpty = document.getElementById('enrolledEmpty');
    const adminUsersItem = document.getElementById('adminUsersItem');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');

    let currentUser = null;

    loadProfile();

    saveProfileBtn.addEventListener('click', function() {
        if (editProfileForm.checkValidity()) {
            const payload = {
                name: document.getElementById('fullName').value.trim(),
                email: document.getElementById('email').value.trim()
            };

            updateProfile(payload);
        } else {
            editProfileForm.reportValidity();
        }
    });

    savePasswordBtn.addEventListener('click', function() {
        if (changePasswordForm.checkValidity()) {
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword.length < 8) {
                showAlert('Password must be at least 8 characters long.', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showAlert('New passwords do not match.', 'error');
                return;
            }

            updateProfile({ password: newPassword }, () => {
                changePasswordForm.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                modal.hide();
            });
        } else {
            changePasswordForm.reportValidity();
        }
    });

    deleteAccountBtn.addEventListener('click', function() {
        if (!currentUser) return;
        const confirmed = confirm('Delete your account? This cannot be undone.');
        if (!confirmed) return;

        fetch(`/api/users/${currentUser.id}`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(() => {
                window.location.href = '/logout';
            })
            .catch(() => showAlert('Unable to delete account.', 'error'));
    });

    createCourseForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('courseName').value.trim();
        const topic = document.getElementById('courseTopic').value.trim();

        if (!name || !topic) return;

        fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, topic })
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to create course');
                return res.json();
            })
            .then(() => {
                createCourseForm.reset();
                showAlert('Course created successfully!', 'success');
                loadCourses();
            })
            .catch(() => showAlert('Unable to create course.', 'error'));
    });

    courseList.addEventListener('click', function(event) {
        const target = event.target;
        const row = target.closest('[data-course-id]');
        if (!row) return;

        const courseId = row.dataset.courseId;

        if (target.matches('[data-action="save"]')) {
            const nameInput = row.querySelector('[data-field="name"]');
            const topicInput = row.querySelector('[data-field="topic"]');
            const payload = {
                name: nameInput.value.trim(),
                topic: topicInput.value.trim()
            };

            fetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to update course');
                    return res.json();
                })
                .then(() => showAlert('Course updated.', 'success'))
                .catch(() => showAlert('Unable to update course.', 'error'));
        }

        if (target.matches('[data-action="students"]')) {
            loadStudents(courseId, row.querySelector('[data-students]'));
        }

        if (target.matches('[data-action="lessons"]')) {
            const panel = row.querySelector('[data-lessons]');
            if (panel.classList.contains('is-open')) {
                panel.classList.remove('is-open');
                panel.innerHTML = '';
                return;
            }
            panel.classList.add('is-open');
            loadLessons(courseId, panel);
        }

        if (target.matches('[data-action="edit-lesson"]')) {
            const lessonId = target.dataset.lessonId;
            editLesson(lessonId, courseId, row.querySelector('[data-lessons]'));
        }

        if (target.matches('[data-action="delete-lesson"]')) {
            const lessonId = target.dataset.lessonId;
            deleteLesson(lessonId, courseId, row.querySelector('[data-lessons]'));
        }
    });

    courseList.addEventListener('submit', function(event) {
        const form = event.target.closest('form[data-lesson-form]');
        if (!form) return;
        event.preventDefault();

        const courseId = form.dataset.courseId;
        const fd = new FormData(form);
        const body = {
            title: fd.get('title'),
            content: fd.get('content'),
            type: fd.get('type'),
            order: Number(fd.get('order')),
            course: courseId,
            videoUrl: fd.get('videoUrl'),
            attachments: fd.get('attachments')
                ? fd.get('attachments').split(',').map(s => s.trim()).filter(Boolean)
                : [],
            duration: fd.get('duration') ? Number(fd.get('duration')) : undefined,
            isPublished: true
        };

        fetch('/api/lessons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(() => {
                showAlert('Lesson added.', 'success');
                form.reset();
                loadLessons(courseId, form.closest('[data-lessons]'));
            })
            .catch(() => showAlert('Unable to add lesson.', 'error'));
    });

    function loadProfile() {
        fetch('/api/me')
            .then(res => {
                if (res.status === 401) {
                    window.location.href = '/login';
                    return null;
                }
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(data => {
                if (!data) return;
                currentUser = data;
                updateProfileDisplay();
                loadCourses();
            })
            .catch(() => showAlert('Unable to load profile.', 'error'));
    }

    function updateProfile(payload, onSuccess) {
        fetch(`/api/users/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(updated => {
                currentUser = { ...currentUser, ...updated };
                updateProfileDisplay();
                showAlert('Profile updated successfully!', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
                if (modal) modal.hide();
                if (onSuccess) onSuccess();
            })
            .catch(() => showAlert('Unable to update profile.', 'error'));
    }

    function updateProfileDisplay() {
        const initials = currentUser.name
            ? currentUser.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
            : 'U';
        userAvatar.src = `https://via.placeholder.com/150/3498db/ffffff?text=${initials}`;

        document.getElementById('userName').textContent = currentUser.name || '-';
        document.getElementById('userRole').textContent = currentUser.role || '-';
        document.getElementById('memberSince').textContent = formatDate(currentUser.createdAt);

        document.getElementById('displayName').textContent = currentUser.name || '-';
        document.getElementById('displayEmail').textContent = currentUser.email || '-';
        document.getElementById('displayRole').textContent = currentUser.role || '-';

        document.getElementById('fullName').value = currentUser.name || '';
        document.getElementById('email').value = currentUser.email || '';

        if (currentUser.role === 'learner') {
            courseManagement.classList.add('d-none');
            enrolledCourses.classList.remove('d-none');
        } else {
            courseManagement.classList.remove('d-none');
            enrolledCourses.classList.add('d-none');
        }

        if (adminUsersItem) {
            if (currentUser.role === 'admin') adminUsersItem.classList.remove('d-none');
            else adminUsersItem.classList.add('d-none');
        }
    }

    function loadCourses() {
        fetch('/api/my-courses')
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(courses => {
                if (currentUser.role === 'learner') {
                    renderEnrolledCourses(courses);
                } else {
                    renderManagedCourses(courses);
                }
            })
            .catch(() => showAlert('Unable to load courses.', 'error'));
    }

    function renderManagedCourses(courses) {
        courseList.innerHTML = '';
        if (!courses.length) {
            courseListEmpty.classList.remove('d-none');
            return;
        }
        courseListEmpty.classList.add('d-none');

        courses.forEach(course => {
            const wrapper = document.createElement('div');
            wrapper.className = 'course-row';
            wrapper.dataset.courseId = course.id;
            wrapper.innerHTML = `
                <div class="course-list-item">
                    <input type="text" class="form-control" data-field="name" value="${course.name}">
                    <input type="text" class="form-control" data-field="topic" value="${course.topic || ''}">
                    <button class="btn btn-outline-primary" data-action="save">Save</button>
                    <button class="btn btn-outline-secondary" data-action="lessons">Lessons</button>
                    <button class="btn btn-outline-secondary" data-action="students">Students (${course.studentsCount || 0})</button>
                </div>
                <div class="lessons-panel mt-3" data-lessons></div>
                <ul class="students-list list-group list-group-flush mt-2" data-students></ul>
            `;
            courseList.appendChild(wrapper);
        });
    }

    function renderEnrolledCourses(courses) {
        enrolledList.innerHTML = '';
        if (!courses.length) {
            enrolledEmpty.classList.remove('d-none');
            return;
        }
        enrolledEmpty.classList.add('d-none');

        courses.forEach(course => {
            const item = document.createElement('div');
            item.className = 'list-group-item';
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-semibold">${course.name}</div>
                        <div class="text-muted">${course.topic || ''}</div>
                    </div>
                    <a class="btn btn-sm btn-primary" href="/course?id=${course.id}">View</a>
                </div>
            `;
            enrolledList.appendChild(item);
        });
    }

    function loadStudents(courseId, container) {
        if (!container) return;
        container.innerHTML = '<li class="list-group-item">Loading...</li>';

        fetch(`/api/courses/${courseId}/students`)
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(students => {
                container.innerHTML = '';
                if (!students.length) {
                    container.innerHTML = '<li class="list-group-item">No enrolled students yet.</li>';
                    return;
                }
                students.forEach(student => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item';
                    li.textContent = `${student.name} (${student.email})`;
                    container.appendChild(li);
                });
            })
            .catch(() => {
                container.innerHTML = '<li class="list-group-item">Unable to load students.</li>';
            });
    }

    function loadLessons(courseId, container) {
        if (!container) return;
        container.innerHTML = '<div class="text-muted">Loading lessons...</div>';

        fetch(`/api/lessons?course=${courseId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(lessons => {
                container.innerHTML = renderLessonsPanel(courseId, lessons);
            })
            .catch(() => {
                container.innerHTML = '<div class="text-danger">Unable to load lessons.</div>';
            });
    }

    function renderLessonsPanel(courseId, lessons) {
        const listHtml = lessons.length
            ? `<ul class="list-group list-group-flush">
                ${lessons.map(lesson => `
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div class="fw-semibold">
                                    ${lesson.title}
                                    ${lesson.isPublished 
                                        ? '<span class="badge bg-success ms-2">Published</span>' 
                                        : '<span class="badge bg-secondary ms-2">Draft</span>'}
                                </div>
                                <div class="text-muted">${lesson.type} • Order ${lesson.order}</div>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-primary" data-action="edit-lesson" data-lesson-id="${lesson._id}">Edit</button>
                                <button class="btn btn-sm btn-outline-danger" data-action="delete-lesson" data-lesson-id="${lesson._id}">Delete</button>
                            </div>
                        </div>
                    </li>
                `).join('')}
               </ul>`
            : '<div class="text-muted">No lessons yet.</div>';

        return `
            <div class="card card-body">
                <h6 class="mb-3">Lessons</h6>
                ${listHtml}
                <hr>
                <form data-lesson-form data-course-id="${courseId}">
                    <div class="row g-2">
                        <div class="col-md-6">
                            <input class="form-control" name="title" placeholder="Lesson title" required>
                        </div>
                        <div class="col-md-6">
                            <input class="form-control" name="content" placeholder="Lesson content" required>
                        </div>
                        <div class="col-md-4">
                            <select class="form-select" name="type">
                                <option value="text">Text</option>
                                <option value="video">Video</option>
                                <option value="document">Document</option>
                                <option value="quiz">Quiz</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <input class="form-control" name="order" type="number" min="1" placeholder="Order" required>
                        </div>
                        <div class="col-md-4">
                            <input class="form-control" name="duration" type="number" min="1" placeholder="Duration (min)">
                        </div>
                        <div class="col-md-6">
                            <input class="form-control" name="videoUrl" placeholder="Video URL">
                        </div>
                        <div class="col-md-6">
                            <input class="form-control" name="attachments" placeholder="Attachments URLs, comma separated">
                        </div>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-primary" type="submit">Add Lesson</button>
                    </div>
                </form>
            </div>
        `;
    }

    function editLesson(lessonId, courseId, container) {
        fetch(`/api/lessons/${lessonId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(lesson => {
                const title = prompt('Lesson title:', lesson.title);
                if (title === null) return;
                const content = prompt('Lesson content:', lesson.content);
                if (content === null) return;
                const type = prompt('Type (text,video,document,quiz):', lesson.type);
                if (type === null) return;
                const order = prompt('Order:', lesson.order);
                if (order === null) return;
                const videoUrl = prompt('Video URL:', lesson.videoUrl || '');
                const attachments = prompt('Attachments (comma separated URLs):', (lesson.attachments || []).join(','));
                const duration = prompt('Duration (min):', lesson.duration || '');
                const published = confirm('Publish this lesson? (Click OK to publish, Cancel to keep unpublished)');

                const body = {
                    title,
                    content,
                    type,
                    order: Number(order),
                    videoUrl,
                    attachments: attachments ? attachments.split(',').map(s => s.trim()).filter(Boolean) : [],
                    duration: duration ? Number(duration) : undefined,
                    isPublished: published
                };

                return fetch(`/api/lessons/${lessonId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            })
            .then(res => {
                if (!res) return;
                if (!res.ok) throw new Error('Failed');
                showAlert('Lesson updated.', 'success');
                loadLessons(courseId, container);
            })
            .catch(() => showAlert('Unable to update lesson.', 'error'));
    }

    function deleteLesson(lessonId, courseId, container) {
        const confirmed = confirm('Delete this lesson?');
        if (!confirmed) return;

        fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' })
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                showAlert('Lesson deleted.', 'success');
                loadLessons(courseId, container);
            })
            .catch(() => showAlert('Unable to delete lesson.', 'error'));
    }

    function formatDate(value) {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString();
    }

    function showAlert(message, type) {
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} custom-alert alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.querySelector('main').insertBefore(alertDiv, document.querySelector('main').firstChild);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                const bsAlert = new bootstrap.Alert(alertDiv);
                bsAlert.close();
            }
        }, 3000);
    }
});