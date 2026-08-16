// ===== CONFIGURATION =====
const CONFIG = {
    recipientName: 'Carla Daniela',
    // waitHours: 24, // Hours to wait before envelope can be opened
    waitSeconds: 120, // Seconds to wait before envelope can be opened
    storageKeyCreated: 'cartOfLove_created_v3',
    storageKeyOpened: 'cartOfLove_opened_v3',
};

// ===== DOM ELEMENTS =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
    particles: $('#particles'),
    floatingHearts: $('#floatingHearts'),
    stars: $('#stars'),
    scene: $('#scene'),
    envelopeWrapper: $('#envelopeWrapper'),
    envelope: $('#envelope'),
    tapHint: $('#tapHint'),
    waitTimer: $('#waitTimer'),
    waitCountdown: $('#waitCountdown'),
    waitProgressBar: $('#waitProgressBar'),
    lockIndicator: $('#lockIndicator'),
    letterContainer: $('#letterContainer'),
    letterCard: $('#letterCard'),
    letterTitle: $('#letterTitle'),
    letterName: $('#letterName'),
    letterDate: $('#letterDate'),
    letterBody: $('#letterBody'),
    actionsBar: $('#actionsBar'),
    btnMusic: $('#btnMusic'),
    btnHeart: $('#btnHeart'),
    btnFireworks: $('#btnFireworks'),
    btnShare: $('#btnShare'),
    foreverBadge: $('#foreverBadge'),
    bgMusic: $('#bgMusic'),
};

// ===== STATE =====
let createdAt;
let isOpened = false;
let isReady = false;
let waitInterval;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initState();
    createStars();
    createFloatingHearts();
    initParticles();
    setupEnvelope();
    setupActions();
    setLetterDate();
    addLetterPetals();

    // Check if already opened — go straight to letter
    if (isOpened) {
        showLetterDirectly();
    } else {
        // Start the wait countdown
        startWaitCountdown();
    }
});

// ===== STATE INITIALIZATION =====
function initState() {
    // Check creation time
    const storedCreated = localStorage.getItem(CONFIG.storageKeyCreated);
    if (storedCreated) {
        createdAt = new Date(parseInt(storedCreated));
    } else {
        createdAt = new Date();
        localStorage.setItem(CONFIG.storageKeyCreated, createdAt.getTime().toString());
    }

    // Check if already opened
    isOpened = localStorage.getItem(CONFIG.storageKeyOpened) === 'true';
}

// ===== WAIT TIMER (countdown before envelope can be opened) =====

// HORA
function getUnlockTime() {
    // return new Date(createdAt.getTime() + CONFIG.waitHours * 60 * 60 * 1000);
    return new Date(createdAt.getTime() + CONFIG.waitSeconds * 1000);
}

function startWaitCountdown() {
    updateWaitCountdown(); // initial update
    waitInterval = setInterval(updateWaitCountdown, 1000);
}

function updateWaitCountdown() {
    const now = new Date();
    const unlockTime = getUnlockTime();
    const diff = unlockTime - now;

    if (diff <= 0) {
        // Timer done! Envelope is ready to open
        clearInterval(waitInterval);
        envelopeReady();
        return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    els.waitCountdown.textContent = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

    // HORA
    // Update progress bar (fills up as time passes)
    // const total = CONFIG.waitHours * 60 * 60 * 1000;
    const total = CONFIG.waitSeconds * 1000;
    const elapsed = total - diff;
    const progress = Math.min(100, (elapsed / total) * 100);
    els.waitProgressBar.style.width = `${progress}%`;
}

function pad(n) {
    return n.toString().padStart(2, '0');
}

// ===== ENVELOPE READY (timer finished) =====
function envelopeReady() {
    isReady = true;

    // Hide wait timer and lock
    els.waitTimer.classList.add('hidden');
    els.lockIndicator.style.display = 'none';

    // Show tap hint
    els.tapHint.style.display = 'block';

    // Add ready visual effects
    els.envelope.classList.add('ready');
    els.envelopeWrapper.classList.add('ready');
}

// ===== ENVELOPE INTERACTION =====
function setupEnvelope() {
    els.envelopeWrapper.addEventListener('click', handleEnvelopeClick);

    // Also handle touch for mobile
    els.envelopeWrapper.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleEnvelopeClick(e);
    });
}

function handleEnvelopeClick(e) {
    if (!isReady) {
        // Shake the envelope to indicate it's locked
        shakeEnvelope();
        return;
    }

    if (isOpened) return;

    openEnvelope();
}

function shakeEnvelope() {
    els.envelope.classList.add('shake');
    els.lockIndicator.classList.add('shake-text');

    setTimeout(() => {
        els.envelope.classList.remove('shake');
        els.lockIndicator.classList.remove('shake-text');
    }, 600);
}

function openEnvelope() {
    isOpened = true;
    localStorage.setItem(CONFIG.storageKeyOpened, 'true');

    // Reproducir música automáticamente al abrir (el navegador lo permite porque el usuario acaba de hacer clic)
    if (!musicPlaying) {
        toggleMusic();
    }

    // Open the envelope flap
    els.envelope.classList.add('opened');
    els.tapHint.style.display = 'none';

    // After flap opens, animate wrapper away
    setTimeout(() => {
        els.envelopeWrapper.classList.add('opening');
    }, 600);

    // Show letter after envelope disappears
    setTimeout(() => {
        els.envelopeWrapper.style.display = 'none';
        els.letterContainer.classList.add('visible');
        revealLetterText();
        triggerConfetti();
    }, 1800);
}

// ===== SHOW LETTER DIRECTLY (if already opened before) =====
function showLetterDirectly() {
    els.envelopeWrapper.style.display = 'none';
    els.letterContainer.classList.add('visible');
    els.letterContainer.style.opacity = '1';
    els.letterContainer.style.transform = 'none';

    // Show all text immediately (no stagger)
    const elements = els.letterCard.querySelectorAll('.fade-in-text');
    elements.forEach(el => {
        el.classList.add('revealed');
    });
}

// ===== REVEAL LETTER TEXT WITH STAGGER =====
function revealLetterText() {
    const elements = els.letterCard.querySelectorAll('.fade-in-text');
    elements.forEach((el, index) => {
        const delay = parseFloat(el.dataset.delay || index) * 600 + 500;
        setTimeout(() => {
            el.classList.add('revealed');
        }, delay);
    });
}

// ===== CONFETTI ON OPEN =====
function triggerConfetti() {
    const colors = ['#f43f5e', '#ec4899', '#a855f7', '#fbbf24', '#f472b6', '#c084fc', '#fda4af'];
    const count = 60;

    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.cssText = `
            left: ${Math.random() * 100}vw;
            top: -20px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            --fall-duration: ${Math.random() * 2 + 2}s;
            --fall-delay: ${Math.random() * 1.5}s;
            --rotation: ${Math.random() * 360}deg;
            width: ${Math.random() * 8 + 4}px;
            height: ${Math.random() * 14 + 6}px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        `;
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 5000);
    }
}

// ===== SET LETTER DATE =====
function setLetterDate() {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const now = new Date();
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    els.letterDate.textContent = `${day} de ${month}, ${year}`;
}

// ===== ADD PETALS TO LETTER =====
function addLetterPetals() {
    const petals = ['🌸', '🌺', '🦋'];
    petals.forEach(emoji => {
        const petal = document.createElement('span');
        petal.className = 'petal';
        petal.textContent = emoji;
        els.letterCard.appendChild(petal);
    });
}

// ===== STARS =====
function createStars() {
    const count = 80;
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 3 + 1;
        star.style.cssText = `
            --size: ${size}px;
            --duration: ${Math.random() * 3 + 2}s;
            --delay: ${Math.random() * 5}s;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
        `;
        els.stars.appendChild(star);
    }
}

// ===== FLOATING HEARTS =====
function createFloatingHearts() {
    const hearts = ['💕', '💖', '💗', '💝', '💘', '✨', '🌸', '💜', '🦋'];
    const count = 15; // fewer for mobile performance
    for (let i = 0; i < count; i++) {
        const heart = document.createElement('span');
        heart.className = 'float-heart';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        const duration = Math.random() * 10 + 8;
        const delay = Math.random() * 15;
        const left = Math.random() * 100;
        const opacity = Math.random() * 0.4 + 0.2;
        const blur = Math.random() > 0.7 ? Math.random() * 2 : 0;
        heart.style.cssText = `
            --duration: ${duration}s;
            --delay: ${delay}s;
            --left: ${left}%;
            --opacity: ${opacity};
            --blur: ${blur}px;
            font-size: ${Math.random() * 1.2 + 0.6}rem;
        `;
        els.floatingHearts.appendChild(heart);
    }
}

// ===== PARTICLE SYSTEM =====
let particleCtx;
let particles = [];
let PARTICLE_COUNT = 60;

function initParticles() {
    // Reduce particles on mobile for performance
    if (window.innerWidth < 640) {
        PARTICLE_COUNT = 25;
    }

    const canvas = els.particles;
    particleCtx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
    }

    animateParticles();
}

function resizeCanvas() {
    els.particles.width = window.innerWidth;
    els.particles.height = window.innerHeight;
}

function createParticle() {
    return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        hue: Math.random() > 0.5 ? 340 : 280,
    };
}

function animateParticles() {
    particleCtx.clearRect(0, 0, els.particles.width, els.particles.height);

    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
        if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`;
        particleCtx.fill();
    });

    // Draw connections (skip on very small screens for performance)
    if (window.innerWidth > 400) {
        const connectionDist = window.innerWidth < 640 ? 80 : 120;
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (dist < connectionDist) {
                    particleCtx.beginPath();
                    particleCtx.moveTo(p1.x, p1.y);
                    particleCtx.lineTo(p2.x, p2.y);
                    particleCtx.strokeStyle = `hsla(340, 70%, 60%, ${0.08 * (1 - dist / connectionDist)})`;
                    particleCtx.lineWidth = 0.5;
                    particleCtx.stroke();
                }
            });
        });
    }

    requestAnimationFrame(animateParticles);
}

// ===== ACTION BUTTONS =====
function setupActions() {
    els.btnMusic.addEventListener('click', toggleMusic);

    els.btnHeart.addEventListener('click', (e) => {
        // Efecto visual de corazones
        const rect = e.currentTarget.getBoundingClientRect();
        burstHearts(rect.left + rect.width / 2, rect.top);

        // Enviar a WhatsApp
        // Reemplaza "NUMERO" con tu número incluyendo código de país sin el +. Ej: 573001234567 (para Colombia)
        const tuNumero = "51917520003";
        const mensaje = encodeURIComponent("¡Leí tu carta! ❤️ Te amo mucho.");

        setTimeout(() => {
            window.open(`https://wa.me/${tuNumero}?text=${mensaje}`, '_blank');
        }, 500); // Pequeña pausa para que se vea el efecto de corazones primero
    });

    els.btnFireworks.addEventListener('click', launchFireworks);
    els.btnShare.addEventListener('click', captureAndShare);
}

// Share function
async function captureAndShare() {
    const card = document.getElementById('letterCard');
    if (!card) return;
    
    // Indicador de carga
    const originalText = els.btnShare.innerHTML;
    els.btnShare.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-label">Generando...</span>';
    
    try {
        const canvas = await html2canvas(card, {
            scale: 2, // Mejor resolución
            useCORS: true, 
            backgroundColor: '#fff0f5' // Fondo rosado claro para la captura
        });
        
        // Función auxiliar para descargar la imagen
        const descargarImagen = (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'nuestra-carta.jpg';
            a.click();
            URL.revokeObjectURL(url);
            alert("🖼️ ¡Imagen descargada con éxito en tu PC!\n\nAhora puedes enviarla por WhatsApp Web a quien quieras.");
        };

        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'nuestra-carta.jpg', { type: 'image/jpeg' });
            
            // Intenta compartir nativamente si el dispositivo lo soporta (móviles)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Nuestra Carta de Amor',
                        text: '❤️ ¡Mira la carta que acabo de leer!'
                    });
                } catch (err) {
                    console.log('Error compartiendo o usuario canceló. Forzando descarga.', err);
                    descargarImagen(blob); // Fallback si falla el share nativo
                }
            } else {
                // Si está en PC, descargamos la imagen automáticamente
                descargarImagen(blob);
            }
            els.btnShare.innerHTML = originalText;
        }, 'image/jpeg', 0.95);
    } catch (e) {
        console.error("Error al capturar: ", e);
        els.btnShare.innerHTML = originalText;
        alert("Lo siento, hubo un error al generar la captura.");
    }
}

// Music toggle
let musicPlaying = false;

function toggleMusic() {
    if (musicPlaying) {
        if (typeof ytPlayer !== 'undefined' && ytPlayer.pauseVideo) {
            ytPlayer.pauseVideo();
        }
        els.btnMusic.classList.remove('playing');
        els.btnMusic.querySelector('.btn-label').textContent = 'Música';
    } else {
        if (typeof ytPlayer !== 'undefined' && ytPlayer.playVideo) {
            ytPlayer.setVolume(50);
            ytPlayer.playVideo();
        } else {
            // Fallback si YouTube no cargó a tiempo
            playSimpleMelody();
        }
        els.btnMusic.classList.add('playing');
        els.btnMusic.querySelector('.btn-label').textContent = 'Pausar';
    }
    musicPlaying = !musicPlaying;
}

// ===== YOUTUBE BACKGROUND MUSIC =====
let ytPlayer;
function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('youtubePlayer', {
        height: '0',
        width: '0',
        videoId: 'n5gtmYh9TbE', // Video solicitado por el usuario
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'loop': 1,
            'playlist': 'n5gtmYh9TbE', // Necesario para que el loop funcione
            'playsinline': 1
        }
    });
}

function playSimpleMelody() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 659.25, 523.25];
        const durations = [0.4, 0.4, 0.4, 0.4, 0.6, 0.4, 0.8];

        let startTime = audioCtx.currentTime;

        notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + durations[i]);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(startTime);
            osc.stop(startTime + durations[i]);

            startTime += durations[i];
        });
    } catch (e) {
        // Silently fail
    }
}

// Heart Burst
function burstHearts(x, y) {
    const hearts = ['💖', '💕', '💗', '💝', '❤️', '💜', '🩷', '🩵'];
    const count = 12;

    for (let i = 0; i < count; i++) {
        const heart = document.createElement('span');
        heart.className = 'burst-heart';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];

        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const distance = Math.random() * 120 + 60;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 50;
        const rot = Math.random() * 720 - 360;

        heart.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            --tx: ${tx}px;
            --ty: ${ty}px;
            --rot: ${rot}deg;
            font-size: ${Math.random() * 1.2 + 0.8}rem;
        `;

        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1500);
    }
}

// Fireworks
function launchFireworks() {
    const colors = ['#f43f5e', '#ec4899', '#a855f7', '#fbbf24', '#f472b6', '#34d399', '#60a5fa'];
    const bursts = 4;

    for (let b = 0; b < bursts; b++) {
        setTimeout(() => {
            const cx = Math.random() * window.innerWidth * 0.6 + window.innerWidth * 0.2;
            const cy = Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.1;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particleCount = 20;

            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'firework';

                const angle = (Math.PI * 2 / particleCount) * i;
                const distance = Math.random() * 100 + 40;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;

                particle.style.cssText = `
                    left: ${cx}px;
                    top: ${cy}px;
                    --tx: ${tx}px;
                    --ty: ${ty}px;
                    background: ${color};
                    box-shadow: 0 0 6px ${color};
                `;

                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 1200);
            }
        }, b * 400);
    }

    triggerConfetti();
}
