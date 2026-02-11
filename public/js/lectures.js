document.addEventListener('DOMContentLoaded', async function() {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const noCourses = document.getElementById('noCourses');
    const coursesList = document.getElementById('coursesList');

    async function loadEnrolledCourses() {
        try {
            const response = await fetch('/api/my-courses');
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/loginpage.html';
                    return;
                }
                throw new Error('Failed to load courses');
            }

            const courses = await response.json();
            
            console.log('Loaded courses:', courses);
            
            loadingMessage.classList.add('d-none');
            
            if (!courses || courses.length === 0) {
                noCourses.classList.remove('d-none');
                return;
            }

            renderCourses(courses);
            
        } catch (error) {
            console.error('Error loading courses:', error);
            loadingMessage.classList.add('d-none');
            errorMessage.textContent = 'Failed to load courses. Please try again later.';
            errorMessage.classList.remove('d-none');
        }
    }

    function renderCourses(courses) {
        coursesList.innerHTML = '';
        
        courses.forEach(course => {
            const courseCard = createCourseCard(course);
            coursesList.appendChild(courseCard);
        });
    }

    function createCourseCard(course) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        console.log('Creating card for course:', course);
        
        // Support both _id and id fields
        const courseId = course._id || course.id;
        const ownerName = course.owner?.name || 'Unknown';
        const studentCount = course.students?.length || 0;
        const lessonCount = course.lessons?.length || 0;
        
        col.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${escapeHtml(course.name)}</h5>
                    <p class="card-text">
                        <span class="badge bg-primary">${escapeHtml(course.topic)}</span>
                    </p>
                    <p class="card-text text-muted">
                        <small>by ${escapeHtml(ownerName)}</small>
                    </p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <small class="text-muted">
                            <i class="bi bi-book"></i> ${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}
                        </small>
                        <small class="text-muted">
                            <i class="bi bi-people"></i> ${studentCount} student${studentCount !== 1 ? 's' : ''}
                        </small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <a href="course.html?id=${courseId}" class="btn btn-primary w-100">
                        View Course
                    </a>
                </div>
            </div>
        `;
        
        return col;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Load courses on page load
    await loadEnrolledCourses();
});
