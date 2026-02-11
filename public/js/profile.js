document.addEventListener('DOMContentLoaded', function() {
    const editProfileForm = document.getElementById('editProfileForm');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const userAvatar = document.getElementById('userAvatar');
    
    let userData = window.themeManager.getStoredUserData() || {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        title: 'Student',
        bio: 'I\'m a passionate learner interested in web development and data science.',
        joinDate: 'Nov 3 2025',
        avatar: 'https://via.placeholder.com/150/3498db/ffffff?text=JD'
    };
    
    const courseProgress = window.themeManager.getStoredCourseProgress();
    
    updateProfileDisplay();
    updateProgressBars();
    
    saveProfileBtn.addEventListener('click', function() {
        if (editProfileForm.checkValidity()) {
            userData.firstName = document.getElementById('firstName').value;
            userData.lastName = document.getElementById('lastName').value;
            userData.email = document.getElementById('email').value;
            userData.title = document.getElementById('title').value;
            userData.bio = document.getElementById('bio').value;
            
            window.themeManager.setStoredUserData(userData);
            
            updateProfileDisplay();
            
            showAlert('Profile updated successfully!', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            modal.hide();
        } else {
            editProfileForm.reportValidity();
        }
    });
    
    savePasswordBtn.addEventListener('click', function() {
        if (changePasswordForm.checkValidity()) {
            const currentPassword = document.getElementById('currentPassword').value;
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
            
            userData.password = newPassword;
            window.themeManager.setStoredUserData(userData);
            
            showAlert('Password changed successfully!', 'success');
            
            changePasswordForm.reset();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            modal.hide();
        } else {
            changePasswordForm.reportValidity();
        }
    });
    
    changeAvatarBtn.addEventListener('click', function() {
        const avatarUrls = [
            'https://via.placeholder.com/150/3498db/ffffff?text=JD',
            'https://via.placeholder.com/150/2ecc71/ffffff?text=JD',
            'https://via.placeholder.com/150/e74c3c/ffffff?text=JD',
            'https://via.placeholder.com/150/9b59b6/ffffff?text=JD'
        ];
        
        const currentSrc = userAvatar.src;
        let currentIndex = avatarUrls.findIndex(url => url === currentSrc);
        
        if (currentIndex === -1 || currentIndex === avatarUrls.length - 1) {
            currentIndex = 0;
        } else {
            currentIndex++;
        }
        
        userAvatar.src = avatarUrls[currentIndex];
        userData.avatar = avatarUrls[currentIndex];
        window.themeManager.setStoredUserData(userData);
        
        showAlert('Avatar updated successfully!', 'success');
    });
    
    function updateProfileDisplay() {
        document.getElementById('firstName').value = userData.firstName;
        document.getElementById('lastName').value = userData.lastName;
        document.getElementById('email').value = userData.email;
        document.getElementById('title').value = userData.title;
        document.getElementById('bio').value = userData.bio;
        
        document.getElementById('userName').textContent = `${userData.firstName} ${userData.lastName}`;
        document.getElementById('userTitle').textContent = userData.title;
        document.getElementById('memberSince').textContent = userData.joinDate;
        
        document.getElementById('displayName').textContent = `${userData.firstName} ${userData.lastName}`;
        document.getElementById('displayEmail').textContent = userData.email;
        document.getElementById('displayBio').textContent = userData.bio;
        
        if (userData.avatar) {
            userAvatar.src = userData.avatar;
        }
    }
    
    function updateProgressBars() {
        const progressData = {
            'web-dev': courseProgress['web-dev'] || 30,
            'data-science': courseProgress['data-science'] || 65,
            'digital-marketing': courseProgress['digital-marketing'] || 0
        };
        
        Object.keys(progressData).forEach(courseId => {
            const progressElement = document.querySelector(`[data-course="${courseId}"] .progress-bar`);
            if (progressElement) {
                progressElement.style.width = `${progressData[courseId]}%`;
                progressElement.textContent = `${progressData[courseId]}%`;
                
                const spanElement = progressElement.closest('.mb-3').querySelector('span');
                if (spanElement) {
                    spanElement.textContent = `${progressData[courseId]}%`;
                }
            }
        });
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
    
    loadUserPreferences();
});

function loadUserPreferences() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    
    if (preferences.fontSize) {
        document.documentElement.style.fontSize = preferences.fontSize;
    }
}