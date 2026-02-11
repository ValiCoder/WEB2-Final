document.addEventListener('DOMContentLoaded', function() {
    const quizForm = document.getElementById('quizForm');
    const submitBtn = document.getElementById('submitQuiz');
    const timerElement = document.getElementById('timer');
    const quizProgress = document.getElementById('quizProgress');
    const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    
    const quizConfig = {
        id: "html-basics-1",
        totalQuestions: 5,
        timeLimit: 600,
        correctAnswers: {
            q1: 'a',
            q2: 'b',
            q3: 'c',
            q4: 'a',
            q5: 'c'
        }
    };
    
    let timeRemaining = quizConfig.timeLimit;
    let timerInterval;
    let userAnswers = {};
    
    const previousResults = window.themeManager.getStoredQuizResults();
    const quizHistory = previousResults[quizConfig.id];
    
    if (quizHistory) {
        displayQuizHistory(quizHistory);
    }
    
    startTimer();
    
    function startTimer() {
        updateTimerDisplay();
        
        timerInterval = setInterval(function() {
            timeRemaining--;
            updateTimerDisplay();
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                submitQuiz();
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeRemaining <= 60) {
            timerElement.parentElement.classList.add('bg-danger', 'text-white');
            timerElement.parentElement.classList.remove('bg-light');
        }
    }
    
    function updateProgress() {
        const answeredQuestions = document.querySelectorAll('input[type="radio"]:checked').length;
        const progress = (answeredQuestions / quizConfig.totalQuestions) * 100;
        quizProgress.style.width = `${progress}%`;
        quizProgress.textContent = `${Math.round(progress)}%`;
    }
    
    quizForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitQuiz();
    });
    
    quizForm.addEventListener('change', function(e) {
        if (e.target.type === 'radio') {
            userAnswers[e.target.name] = e.target.value;
        }
        updateProgress();
    });
    
    function submitQuiz() {
        clearInterval(timerInterval);
        
        const score = calculateScore();
        saveQuizResults(score, userAnswers);
        showResults(score);
    }
    
    function calculateScore() {
        let score = 0;
        
        for (let i = 1; i <= quizConfig.totalQuestions; i++) {
            const questionName = `q${i}`;
            const selectedAnswer = document.querySelector(`input[name="${questionName}"]:checked`);
            
            if (selectedAnswer && selectedAnswer.value === quizConfig.correctAnswers[questionName]) {
                score++;
            }
        }
        
        return score;
    }
    
    function saveQuizResults(score, answers) {
        window.themeManager.saveQuizResults(quizConfig.id, score, answers);
    }
    
    function showResults(score) {
        const scoreText = document.getElementById('scoreText');
        const scoreMessage = document.getElementById('scoreMessage');
        const resultsDetails = document.getElementById('resultsDetails');
        
        scoreText.textContent = `Your Score: ${score}/${quizConfig.totalQuestions}`;
        
        const percentage = (score / quizConfig.totalQuestions) * 100;
        if (percentage >= 80) {
            scoreMessage.innerHTML = '<div class="alert alert-success">Excellent! You have a good understanding of HTML basics.</div>';
        } else if (percentage >= 60) {
            scoreMessage.innerHTML = '<div class="alert alert-info">Good job! You have a basic understanding but could use some review.</div>';
        } else {
            scoreMessage.innerHTML = '<div class="alert alert-warning">You might want to review the material and try again.</div>';
        }
        
        let detailsHtml = '<h6>Question Details:</h6><ul class="list-group">';
        
        for (let i = 1; i <= quizConfig.totalQuestions; i++) {
            const questionName = `q${i}`;
            const selectedAnswer = document.querySelector(`input[name="${questionName}"]:checked`);
            const isCorrect = selectedAnswer && selectedAnswer.value === quizConfig.correctAnswers[questionName];
            
            detailsHtml += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Question ${i}
                    <span class="${isCorrect ? 'correct' : 'incorrect'}">
                        ${isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                </li>
            `;
        }
        
        detailsHtml += '</ul>';
        resultsDetails.innerHTML = detailsHtml;
        
        resultsModal.show();
    }
    
    function displayQuizHistory(history) {
        console.log('Previous quiz results:', history);
    }
    
    updateProgress();
});