document.addEventListener('DOMContentLoaded', function() {
    const lectureList = document.getElementById('lectureList');
    const lectureTitle = document.getElementById('lectureTitle');
    const lectureContent = document.getElementById('lectureContent');
    const prevLectureBtn = document.getElementById('prevLecture');
    const markCompleteBtn = document.getElementById('markComplete');
    
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course') || 'web-dev';
    
    const courseProgress = window.themeManager.getStoredCourseProgress();
    const currentProgress = courseProgress[courseId] || 0;
    
    updateProgressDisplay(currentProgress);
    
    const lectures = [
        {
            id: 1,
            title: "Introduction to HTML",
            content: `
                <p>HTML (HyperText Markup Language) is the standard markup language for documents designed to be displayed in a web browser.</p>
                
                <h5>Basic HTML Structure</h5>
                <pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;title&gt;Page Title&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;h1&gt;My First Heading&lt;/h1&gt;
    &lt;p&gt;My first paragraph.&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
                
                <h5>Common HTML Elements</h5>
                <ul>
                    <li><strong>&lt;h1&gt; to &lt;h6&gt;</strong>: Headings</li>
                    <li><strong>&lt;p&gt;</strong>: Paragraphs</li>
                    <li><strong>&lt;a&gt;</strong>: Links</li>
                    <li><strong>&lt;img&gt;</strong>: Images</li>
                    <li><strong>&lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;</strong>: Lists</li>
                </ul>
            `,
            completed: currentProgress >= 20
        },
        {
            id: 2,
            title: "CSS Basics",
            content: `
                <p>CSS (Cascading Style Sheets) is used to style and layout web pages.</p>
                
                <h5>Basic CSS Syntax</h5>
                <pre><code>selector {
    property: value;
}</code></pre>
                
                <h5>Common CSS Properties</h5>
                <ul>
                    <li><strong>color</strong>: Text color</li>
                    <li><strong>font-size</strong>: Text size</li>
                    <li><strong>margin</strong>: Outer spacing</li>
                    <li><strong>padding</strong>: Inner spacing</li>
                    <li><strong>background-color</strong>: Background color</li>
                </ul>
            `,
            completed: currentProgress >= 40
        },
        {
            id: 3,
            title: "JavaScript Fundamentals",
            content: `
                <p>JavaScript is a programming language that enables interactive web pages.</p>
                
                <h5>Variables</h5>
                <pre><code>let name = "John";
const age = 30;
var isStudent = true;</code></pre>
                
                <h5>Functions</h5>
                <pre><code>function greet(name) {
    return "Hello, " + name + "!";
}</code></pre>
            `,
            completed: currentProgress >= 60
        },
        {
            id: 4,
            title: "Responsive Design",
            content: `
                <p>Responsive design ensures web pages look good on all devices.</p>
                
                <h5>Media Queries</h5>
                <pre><code>@media (max-width: 768px) {
    .container {
        width: 100%;
    }
}</code></pre>
                
                <h5>Flexbox</h5>
                <pre><code>.container {
    display: flex;
    justify-content: center;
    align-items: center;
}</code></pre>
            `,
            completed: currentProgress >= 80
        },
        {
            id: 5,
            title: "Project: Personal Portfolio",
            content: `
                <p>Create a personal portfolio website to showcase your skills and projects.</p>
                
                <h5>Project Requirements</h5>
                <ul>
                    <li>Home page with introduction</li>
                    <li>Projects gallery</li>
                    <li>About section</li>
                    <li>Contact form</li>
                    <li>Responsive design</li>
                </ul>
                
                <h5>Technologies to Use</h5>
                <ul>
                    <li>HTML5</li>
                    <li>CSS3 (with Flexbox/Grid)</li>
                    <li>JavaScript (optional)</li>
                </ul>
            `,
            completed: currentProgress >= 100
        }
    ];
    
    let currentLectureId = 1;
    
    function updateProgressDisplay(progress) {
        const progressElement = document.querySelector('.progress-bar');
        if (progressElement) {
            progressElement.style.width = `${progress}%`;
            progressElement.textContent = `${progress}% Complete`;
        }
    }
    
    function loadLecture(lectureId) {
        const lecture = lectures.find(l => l.id === lectureId);
        if (lecture) {
            lectureTitle.textContent = lecture.title;
            lectureContent.innerHTML = lecture.content;
            currentLectureId = lectureId;
            
            const lectureItems = lectureList.querySelectorAll('.list-group-item');
            lectureItems.forEach(item => {
                item.classList.remove('active');
                if (parseInt(item.dataset.lecture) === lectureId) {
                    item.classList.add('active');
                }
            });
            
            updateMarkCompleteButton(lecture.completed);
            
            prevLectureBtn.disabled = lectureId === 1;
        }
    }
    
    function updateMarkCompleteButton(completed) {
        if (completed) {
            markCompleteBtn.textContent = 'Completed';
            markCompleteBtn.classList.remove('btn-outline-primary');
            markCompleteBtn.classList.add('btn-success');
            markCompleteBtn.disabled = true;
        } else {
            markCompleteBtn.textContent = 'Mark Complete';
            markCompleteBtn.classList.remove('btn-success');
            markCompleteBtn.classList.add('btn-outline-primary');
            markCompleteBtn.disabled = false;
        }
    }
    
    lectureList.addEventListener('click', function(e) {
        e.preventDefault();
        const listItem = e.target.closest('.list-group-item');
        if (listItem) {
            const lectureId = parseInt(listItem.dataset.lecture);
            loadLecture(lectureId);
        }
    });
    
    prevLectureBtn.addEventListener('click', function() {
        if (currentLectureId > 1) {
            loadLecture(currentLectureId - 1);
        }
    });
    
    markCompleteBtn.addEventListener('click', function() {
        const lecture = lectures.find(l => l.id === currentLectureId);
        if (lecture && !lecture.completed) {
            lecture.completed = true;
            
            const completedLectures = lectures.filter(l => l.completed).length;
            const newProgress = Math.min(100, completedLectures * 20);
            
            window.themeManager.updateCourseProgress(courseId, newProgress);
            
            updateProgressDisplay(newProgress);
            updateMarkCompleteButton(true);
            
            const listItem = lectureList.querySelector(`[data-lecture="${currentLectureId}"]`);
            const icon = listItem.querySelector('small i');
            icon.classList.remove('bi-circle');
            icon.classList.add('bi-check-circle-fill', 'text-success');
            
            showCompletionMessage();
        }
    });
    
    function showCompletionMessage() {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            <strong>Well done!</strong> You've completed this lecture.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        lectureContent.appendChild(alertDiv);
        
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }, 3000);
    }
    
    loadLecture(1);
});