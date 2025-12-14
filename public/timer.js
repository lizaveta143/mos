document.addEventListener('DOMContentLoaded', function() {
    const countDownDate = new Date("Jan 07, 2026 23:59:59").getTime();
    const countdownTimer = document.getElementById("countdown-timer");
    
    const timer = setInterval(function() {
        const now = new Date().getTime();
        const distance = countDownDate - now;
        
        if (distance < 0) {
            clearInterval(timer);
            countdownTimer.innerHTML = "СМЕРТЕЛЬНАЯ МИГРАЦИЯ";
            countdownTimer.classList.add('finished');
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById("days").innerHTML = String(days).padStart(2, '0');
        document.getElementById("hours").innerHTML = String(hours).padStart(2, '0');
        document.getElementById("minutes").innerHTML = String(minutes).padStart(2, '0');
        document.getElementById("seconds").innerHTML = String(seconds).padStart(2, '0');
    }, 1000);
});