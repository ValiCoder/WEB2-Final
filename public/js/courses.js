document.addEventListener('DOMContentLoaded', function() {
    const courseSearch = document.getElementById('courseSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const coursesContainer = document.getElementById('coursesContainer');
    const searchButton = document.getElementById('searchButton');

    const courseProgress = window.themeManager.getStoredCourseProgress();
    const favorites = window.themeManager.getStoredFavorites();

    let courses = [];

    const badgeMap = {
        web: { label: 'Web Development', className: 'bg-primary' },
        data: { label: 'Data Science', className: 'bg-success' },
        marketing: { label: 'Marketing', className: 'bg-warning text-dark' },
        mobile: { label: 'Mobile Development', className: 'bg-info' }
    };

    function deriveCategory(topic) {
        const value = (topic || '').toLowerCase();
        if (value.includes('web')) return 'web';
        if (value.includes('data')) return 'data';
        if (value.includes('marketing')) return 'marketing';
        if (value.includes('mobile')) return 'mobile';
        return 'web';
    }

    function buildCourseModel(course) {
        const category = deriveCategory(course.topic);
        const badge = badgeMap[category] || badgeMap.web;
        return {
            id: course.id,
            title: course.name,
            description: course.topic || 'Explore this course in LearniX.',
            category,
            progress: courseProgress[course.id] || 0,
            badge: badge.label,
            badgeClass: badge.className,
            favorite: favorites.includes(course.id)
        };
    }

    function setFallbackCourses() {
        courses = [
            {
                id: "web-dev",
                title: "Web Development Fundamentals",
                description: "Learn HTML, CSS, and JavaScript to build modern websites.",
                category: "web",
                progress: courseProgress["web-dev"] || 30,
                badge: "Web Development",
                badgeClass: "bg-primary",
                favorite: favorites.includes("web-dev")
            },
            {
                id: "data-science",
                title: "Data Science Essentials",
                description: "Introduction to data analysis, visualization, and machine learning.",
                category: "data",
                progress: courseProgress["data-science"] || 65,
                badge: "Data Science",
                badgeClass: "bg-success",
                favorite: favorites.includes("data-science")
            },
            {
                id: "digital-marketing",
                title: "Digital Marketing",
                description: "Master SEO, social media, and content marketing strategies.",
                category: "marketing",
                progress: courseProgress["digital-marketing"] || 0,
                badge: "Marketing",
                badgeClass: "bg-warning text-dark",
                favorite: favorites.includes("digital-marketing")
            },
            {
                id: "mobile-dev",
                title: "Mobile App Development",
                description: "Build cross-platform apps with React Native and Flutter.",
                category: "mobile",
                progress: courseProgress["mobile-dev"] || 0,
                badge: "Mobile Development",
                badgeClass: "bg-info",
                favorite: favorites.includes("mobile-dev")
            }
        ];
    }

    function filterCourses() {
        const searchTerm = courseSearch.value.toLowerCase();
        const category = categoryFilter.value;

        const filteredCourses = courses.filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(searchTerm) ||
                course.description.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || course.category === category;

            return matchesSearch && matchesCategory;
        });

        displayCourses(filteredCourses);
    }

    function displayCourses(coursesToDisplay) {
        coursesContainer.innerHTML = '';

        if (coursesToDisplay.length === 0) {
            coursesContainer.innerHTML = '<div class="col-12 text-center"><p>No courses found matching your criteria.</p></div>';
            return;
        }

        coursesToDisplay.forEach(course => {
            const progressHtml = course.progress > 0 ?
                `<div class="progress mb-3">
                    <div class="progress-bar" role="progressbar" style="width: ${course.progress}%">${course.progress}% Complete</div>
                </div>` : '';

            const favoriteIcon = course.favorite ? '❤️' : '🤍';

            const courseHtml = `
                <div class="col-md-6">
                    <div class="card course-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h5 class="card-title">${course.title}</h5>
                                <button class="btn btn-sm favorite-btn" data-course-id="${course.id}">
                                    ${favoriteIcon}
                                </button>
                            </div>
                            <p class="card-text">${course.description}</p>
                            ${progressHtml}
                            <div class="d-flex justify-content-between">
                                <span class="badge ${course.badgeClass}">${course.badge}</span>
                                <a href="/course?id=${course.id}" class="btn btn-primary">${course.progress > 0 ? 'Continue Learning' : 'View Course'}</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            coursesContainer.innerHTML += courseHtml;
        });

        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                toggleFavorite(this.dataset.courseId);
            });
        });
    }

    function toggleFavorite(courseId) {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            course.favorite = !course.favorite;
            saveFavorites();
            filterCourses();
        }
    }

    function saveFavorites() {
        const updatedFavorites = courses
            .filter(course => course.favorite)
            .map(course => course.id);

        window.themeManager.setStoredFavorites(updatedFavorites);
    }

    function loadCourses() {
        fetch('/api/catalog/courses')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load courses');
                return response.json();
            })
            .then(data => {
                courses = data.map(buildCourseModel);
                filterCourses();
            })
            .catch(() => {
                setFallbackCourses();
                filterCourses();
            });
    }

    courseSearch.addEventListener('input', filterCourses);
    categoryFilter.addEventListener('change', filterCourses);
    searchButton.addEventListener('click', filterCourses);

    loadCourses();
});