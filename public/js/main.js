class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
        this.setupEventListeners();
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    getStoredUserData() {
        const data = localStorage.getItem('userData');
        return data ? JSON.parse(data) : null;
    }

    setStoredUserData(userData) {
        localStorage.setItem('userData', JSON.stringify(userData));
    }

    getStoredCourseProgress() {
        const progress = localStorage.getItem('courseProgress');
        return progress ? JSON.parse(progress) : {};
    }

    setStoredCourseProgress(progress) {
        localStorage.setItem('courseProgress', JSON.stringify(progress));
    }

    getStoredQuizResults() {
        const results = localStorage.getItem('quizResults');
        return results ? JSON.parse(results) : {};
    }

    setStoredQuizResults(results) {
        localStorage.setItem('quizResults', JSON.stringify(results));
    }

    getStoredFavorites() {
        const favorites = localStorage.getItem('favoriteCourses');
        return favorites ? JSON.parse(favorites) : [];
    }

    setStoredFavorites(favorites) {
        localStorage.setItem('favoriteCourses', JSON.stringify(favorites));
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.setStoredTheme(theme);
        this.updateThemeToggleIcon();
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: newTheme } 
        }));
    }

    createThemeToggle() {
        if (document.getElementById('themeToggle')) return;

        const navbarNav = document.querySelector('.navbar-nav');
        if (!navbarNav) return;

        const toggleItem = document.createElement('li');
        toggleItem.className = 'nav-item';
        toggleItem.innerHTML = `
            <button class="nav-link theme-toggle" id="themeToggle" title="Toggle theme">
                <span class="theme-icon">${this.currentTheme === 'light' ? '🌙' : '☀️'}</span>
            </button>
        `;

        navbarNav.appendChild(toggleItem);
    }

    updateThemeToggleIcon() {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#themeToggle')) {
                this.toggleTheme();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.themeManager = new ThemeManager();

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage && !link.classList.contains('theme-toggle')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 8px 15px rgba(0,0,0,0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        });
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    loadUserData();
});

function loadUserData() {
    const userData = window.themeManager.getStoredUserData();
    if (userData) {
        updateUIWithUserData(userData);
    }
}

function updateUIWithUserData(userData) {
    console.log('User data loaded:', userData);
}

function updateCourseProgress(courseId, progress) {
    const courseProgress = window.themeManager.getStoredCourseProgress();
    courseProgress[courseId] = progress;
    window.themeManager.setStoredCourseProgress(courseProgress);
}

function getCourseProgress(courseId) {
    const courseProgress = window.themeManager.getStoredCourseProgress();
    return courseProgress[courseId] || 0;
}

function saveQuizResults(quizId, score, answers) {
    const quizResults = window.themeManager.getStoredQuizResults();
    quizResults[quizId] = {
        score: score,
        answers: answers,
        completedAt: new Date().toISOString()
    };
    window.themeManager.setStoredQuizResults(quizResults);
}

function getQuizResults(quizId) {
    const quizResults = window.themeManager.getStoredQuizResults();
    return quizResults[quizId] || null;
}