document.addEventListener('DOMContentLoaded', function() {
    const courseSearch = document.getElementById('courseSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const coursesContainer = document.getElementById('coursesContainer');
    const searchButton = document.getElementById('searchButton');
    
    const courseProgress = window.themeManager.getStoredCourseProgress();
    const favorites = window.themeManager.getStoredFavorites();
    
    const courses = [
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
                                <a href="lectures.html?course=${course.id}" class="btn btn-primary">${course.progress > 0 ? 'Continue Learning' : 'Start Learning'}</a>
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
        const favorites = courses
            .filter(course => course.favorite)
            .map(course => course.id);
        
        window.themeManager.setStoredFavorites(favorites);
    }
    
    courseSearch.addEventListener('input', filterCourses);
    categoryFilter.addEventListener('change', filterCourses);
    searchButton.addEventListener('click', filterCourses);
    
    filterCourses();
});