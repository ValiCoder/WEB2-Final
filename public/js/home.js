document.addEventListener('DOMContentLoaded', function() {
    const carousel = new bootstrap.Carousel('#testimonialCarousel', {
        interval: 5000,
        wrap: true
    });
    
    const featureCards = document.querySelectorAll('.feature-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });

    // Check auth status and update nav
    fetch('/api/me')
        .then(res => {
            if (res.ok) return res.json();
            return null;
        })
        .then(user => {
            const loginNavItem = document.getElementById('loginNavItem');
            const registerNavItem = document.getElementById('registerNavItem');
            const logoutNavItem = document.getElementById('logoutNavItem');
            const heroRegisterBtn = document.getElementById('heroRegisterBtn');

            if (user) {
                // User is logged in
                if (loginNavItem) loginNavItem.classList.add('d-none');
                if (registerNavItem) registerNavItem.classList.add('d-none');
                if (logoutNavItem) logoutNavItem.classList.remove('d-none');
                if (heroRegisterBtn) heroRegisterBtn.classList.add('d-none');
            } else {
                // User is not logged in
                if (loginNavItem) loginNavItem.classList.remove('d-none');
                if (registerNavItem) registerNavItem.classList.remove('d-none');
                if (logoutNavItem) logoutNavItem.classList.add('d-none');
                if (heroRegisterBtn) heroRegisterBtn.classList.remove('d-none');
            }
        })
        .catch(() => {
            // Not logged in
        });
});