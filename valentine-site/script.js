// --- 1. Audio Start Logic ---
const musicOverlay = document.getElementById('music-overlay');
const audio = document.getElementById('bgMusic');
let isPlaying = false;

function startExperience() {
    musicOverlay.style.opacity = '0';
    setTimeout(() => {
        musicOverlay.style.display = 'none';
    }, 500);

    // Play Audio
    audio.play().then(() => {
        isPlaying = true;
    }).catch(error => {
        console.log("Audio play failed: ", error);
    });
}

function toggleMusic() {
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
    isPlaying = !isPlaying;
}

// --- 2. Scroll Animation ---
const sections = document.querySelectorAll('.story-section');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const content = entry.target.querySelector('.content-box');
            if (content) {
                content.classList.add('visible');
            }
        }
    });
}, { threshold: 0.3 });

sections.forEach(section => {
    observer.observe(section);
});

// --- 3. No Button Logic (Fly Anywhere) ---
const noBtn = document.getElementById('noBtn');

const phrases = [
    "No", "Are you sure?", "Really sure?", "Think again!", 
    "Last chance!", "Surely not?", "You might regret this!", 
    "Give it another thought!", "Are you absolutely certain?", 
    "This could be a mistake!", "Have a heart!", 
    "Don't be so cold!", "Change of heart?", "Wouldn't you reconsider?", 
    "Is that your final answer?", "You're breaking my heart ;("
];

function moveButton() {
    // 1. Update text FIRST so we know how big the button is
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    noBtn.innerText = randomPhrase;

    // 2. Get viewport dimensions (Full Screen)
    const xMax = window.innerWidth - noBtn.offsetWidth - 20; 
    const yMax = window.innerHeight - noBtn.offsetHeight - 20;

    // 3. Calculate Random Position
    const newX = Math.random() * xMax;
    const newY = Math.random() * yMax;

    // 4. Set Fixed Position (Relative to Screen)
    noBtn.style.position = 'fixed'; 
    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;
}

noBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    moveButton();
});

// --- 4. Yes Button Logic ---
function acceptLove() {
    // Show success view
    document.getElementById('successView').style.display = 'flex';
    
    // REMOVE THE NO BUTTON
    document.getElementById('noBtn').style.display = 'none';

    // Confetti
    triggerConfetti();
}

function closeSuccess() {
    document.getElementById('successView').style.display = 'none';
}

function triggerConfetti() {
    var duration = 15 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) { return Math.random() * (max - min) + min; }

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}