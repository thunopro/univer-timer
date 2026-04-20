const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');

// --- Global Variables for Space ---
let width, height, cx, cy;
const stars = [];
let numStars = 800; // Optimized for performance
let speed; 

function updateSpeed() {
    // Speed is relative to width so it feels consistent on all devices
    speed = width * 0.015; 
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    cx = width / 2;
    cy = height / 2;
    updateSpeed();
}
window.addEventListener('resize', resize);
resize();

// --- Timer Logic ---
const timerDisplay = document.getElementById('timer-display');
const timerInput = document.getElementById('timer-input');
const startBtn = document.getElementById('start-btn');
const videoOverlay = document.getElementById('video-overlay');
const alarmVideo = document.getElementById('alarm-video');
const closeVideoBtn = document.getElementById('close-video');

let timerInterval;
let remainingTime = parseInt(timerInput.value) * 60;

function updateDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

updateDisplay(remainingTime);

startBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    const inputVal = parseInt(timerInput.value);
    
    if (isNaN(inputVal) || inputVal <= 0) return;
    
    // RESET state
    startBtn.disabled = false;
    
    // CRITICAL: Warm up the video. We play it muted first to ensure it's "unlocked"
    alarmVideo.muted = true;
    alarmVideo.play().then(() => {
        alarmVideo.pause();
        alarmVideo.muted = false; // Unmute for the real alarm later
        alarmVideo.currentTime = 0;
    }).catch(e => {
        console.log("Video unlock failed, will try again at the end");
    });
    
    alarmVideo.load();
    
    remainingTime = inputVal * 60;
    updateDisplay(remainingTime);
    
    startBtn.textContent = 'Đang chạy...';
    
    timerInterval = setInterval(() => {
        remainingTime--;
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            remainingTime = 0;
            updateDisplay(remainingTime);
            
            showAlarm();
        } else {
            updateDisplay(remainingTime);
        }
    }, 1000);
});

function showAlarm() {
    videoOverlay.style.display = 'flex';
    startBtn.textContent = 'HẾT GIỜ!';
    
    // Attempt to play
    const playPromise = alarmVideo.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error("Auto-play blocked:", error);
            // Fallback: If blocked, make the start button a manual trigger
            startBtn.textContent = 'NHẤN ĐỂ XEM VIDEO';
            startBtn.style.background = '#ff0055';
            
            // Allow user to click the button or the overlay to start the video
            const triggerPlay = () => {
                alarmVideo.play();
                startBtn.textContent = 'HẾT GIỜ!';
                startBtn.style.background = '';
                window.removeEventListener('click', triggerPlay);
            };
            window.addEventListener('click', triggerPlay);
        });
    }
}

// Close video logic
closeVideoBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent triggering window click
    videoOverlay.style.display = 'none';
    alarmVideo.pause();
    alarmVideo.currentTime = 0;
    startBtn.textContent = 'Bắt Đầu';
    startBtn.style.background = '';
});


// --- REALISTIC 3D UNIVERSE LOGIC ---
const starColors = [
    '#9db4ff', '#a2b9ff', '#ffffff', '#ffffd0', '#ffffa0', '#ffcaa8', '#ffb8b8'
];

function getRealisticStarColor() {
    const rand = Math.random();
    if (rand < 0.4) return starColors[2];
    if (rand < 0.7) return starColors[1];
    if (rand < 0.8) return starColors[0];
    if (rand < 0.9) return starColors[3];
    if (rand < 0.95) return starColors[4];
    if (rand < 0.98) return starColors[5];
    return starColors[6];
}

class RealisticStar {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * width * 2;
        this.x = Math.cos(angle) * radius;
        this.y = Math.sin(angle) * radius;
        this.z = initial ? Math.random() * width * 2 : width * 2;
        this.pz = this.z;
        this.color = getRealisticStarColor();
        this.size = Math.random() * 1.5 + 0.2;
        this.twinkleSpeed = Math.random() * 0.05 + 0.01;
        this.twinklePhase = Math.random() * Math.PI * 2;
    }

    update() {
        this.pz = this.z;
        this.z -= speed;
        if (this.z < 1) {
            this.reset();
        }
        this.twinklePhase += this.twinkleSpeed;
    }

    draw() {
        const scale = width / this.z;
        const prevScale = width / this.pz;
        const sx = this.x * scale + cx;
        const sy = this.y * scale + cy;
        const px = this.x * prevScale + cx;
        const py = this.y * prevScale + cy;
        if (this.pz < this.z) return;
        const depthAlpha = Math.max(0, 1 - (this.z / (width * 2)));
        const twinkleAlpha = 0.5 + Math.sin(this.twinklePhase) * 0.5;
        const finalAlpha = depthAlpha * twinkleAlpha;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.lineWidth = Math.max(0.1, this.size * scale * 0.5);
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = finalAlpha;
        ctx.stroke();
        
        if (depthAlpha > 0.6 && this.size > 1.0) {
            ctx.beginPath();
            ctx.arc(sx, sy, this.size * scale * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = finalAlpha * 0.3;
            ctx.fill();
        }
    }
}

for (let i = 0; i < numStars; i++) {
    stars.push(new RealisticStar());
}

function drawNebula() {
    ctx.globalAlpha = 0.05;
    const t = Date.now() * 0.0001;
    const g1 = ctx.createRadialGradient(cx + Math.cos(t) * 200, cy + Math.sin(t) * 200, 0, cx + Math.cos(t) * 200, cy + Math.sin(t) * 200, width * 0.8);
    g1.addColorStop(0, '#0f173b');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);

    const g2 = ctx.createRadialGradient(cx - Math.sin(t*0.8) * 300, cy + Math.cos(t*0.8) * 300, 0, cx - Math.sin(t*0.8) * 300, cy + Math.cos(t*0.8) * 300, width * 0.9);
    g2.addColorStop(0, '#2d0a33');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1.0;
}

function animate() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(2, 2, 4, 0.4)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'screen';
    drawNebula();
    stars.forEach(star => {
        star.update();
        star.draw();
    });
    requestAnimationFrame(animate);
}

animate();
