const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');

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
    
    // Pre-load/Unlock video for mobile/modern browsers
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
            startBtn.textContent = 'Hết Giờ!';
            
            // Play the video alarm
            videoOverlay.style.display = 'flex';
            alarmVideo.play().catch(err => {
                console.error("Video play failed:", err);
            });
        } else {
            updateDisplay(remainingTime);
        }
    }, 1000);
});

// Close video logic
closeVideoBtn.addEventListener('click', () => {
    videoOverlay.style.display = 'none';
    alarmVideo.pause();
    alarmVideo.currentTime = 0;
});


// --- REALISTIC 3D UNIVERSE LOGIC ---
let width, height, cx, cy;
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    cx = width / 2;
    cy = height / 2;
}
window.addEventListener('resize', resize);
resize();

// Realistic star colors based on spectral types (O, B, A, F, G, K, M)
const starColors = [
    '#9db4ff', // O (Blue)
    '#a2b9ff', // B (Blue-white)
    '#ffffff', // A (White)
    '#ffffd0', // F (Yellow-white)
    '#ffffa0', // G (Yellow)
    '#ffcaa8', // K (Orange)
    '#ffb8b8'  // M (Red)
];

// Helper to pick realistic colors (skewed towards white/blue)
function getRealisticStarColor() {
    const rand = Math.random();
    if (rand < 0.4) return starColors[2]; // 40% White
    if (rand < 0.7) return starColors[1]; // 30% Blue-white
    if (rand < 0.8) return starColors[0]; // 10% Blue
    if (rand < 0.9) return starColors[3]; // 10% Yellow-white
    if (rand < 0.95) return starColors[4]; // 5% Yellow
    if (rand < 0.98) return starColors[5]; // 3% Orange
    return starColors[6]; // 2% Red
}

const stars = [];
const numStars = 1500; // Large number of stars for Milky Way feel
let speed = 25; // Light speed warp effect

class RealisticStar {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        // Distribute stars evenly across a wide volume
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * width * 2;
        
        this.x = Math.cos(angle) * radius;
        this.y = Math.sin(angle) * radius;
        
        // Z is distance from camera. Initial spawn covers entire depth.
        this.z = initial ? Math.random() * width * 2 : width * 2;
        this.pz = this.z;
        
        this.color = getRealisticStarColor();
        this.size = Math.random() * 1.5 + 0.2; // Tiny realistic points
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
        // Perspective projection
        const scale = width / this.z;
        const prevScale = width / this.pz;

        const sx = this.x * scale + cx;
        const sy = this.y * scale + cy;

        const px = this.x * prevScale + cx;
        const py = this.y * prevScale + cy;

        // If it moved too far in one frame (e.g. wrapped around), don't draw line
        if (this.pz < this.z) return;

        // Atmospheric/Depth fading
        const depthAlpha = Math.max(0, 1 - (this.z / (width * 2)));
        
        // Twinkling effect
        const twinkleAlpha = 0.5 + Math.sin(this.twinklePhase) * 0.5;
        const finalAlpha = depthAlpha * twinkleAlpha;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        
        // Closer stars are thicker and brighter
        ctx.lineWidth = Math.max(0.1, this.size * scale * 0.5);
        ctx.strokeStyle = this.color;
        
        ctx.globalAlpha = finalAlpha;
        ctx.stroke();
        
        // Add a soft glow to closer, larger stars
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

// Draw faint nebula clouds in the background
function drawNebula() {
    ctx.globalAlpha = 0.05; // Very subtle
    
    // Cloud 1
    const t = Date.now() * 0.0001;
    const g1 = ctx.createRadialGradient(
        cx + Math.cos(t) * 200, cy + Math.sin(t) * 200, 0, 
        cx + Math.cos(t) * 200, cy + Math.sin(t) * 200, width * 0.8
    );
    g1.addColorStop(0, '#0f173b'); // Deep blue
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);

    // Cloud 2
    const g2 = ctx.createRadialGradient(
        cx - Math.sin(t*0.8) * 300, cy + Math.cos(t*0.8) * 300, 0, 
        cx - Math.sin(t*0.8) * 300, cy + Math.cos(t*0.8) * 300, width * 0.9
    );
    g2.addColorStop(0, '#2d0a33'); // Deep purple
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, width, height);
    
    ctx.globalAlpha = 1.0;
}

function animate() {
    // True black space background with a trailing smear effect
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(2, 2, 4, 0.4)'; // Almost black, leaves slight motion trails
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'screen'; // Realistic light bending

    drawNebula();

    stars.forEach(star => {
        star.update();
        star.draw();
    });

    requestAnimationFrame(animate);
}

animate();
