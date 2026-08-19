const musicToggle = document.querySelector('.music-toggle');
const volumeSlider = document.querySelector('.volume-slider');
const volumeValue = document.querySelector('.volume-value');
const backgroundAudio = document.querySelector('#background-audio');
const cursorLight = document.querySelector('.cursor-light');
const logo = document.querySelector('.logo');
const profileCard = document.querySelector('.profile-card');
const likeButton = document.querySelector('.like-button');
const likeHeart = document.querySelector('.like-heart');
const likeLabel = document.querySelector('.like-label');
const likeCount = document.querySelector('.like-count');
const viewCount = document.querySelector('.view-count strong');
let audioContext;
let effectContext;
let masterGain;
let musicTimer;
let selectedAudio = backgroundAudio;
let isPlaying = false;
let volumeLevel = Number(volumeSlider.value) / 100;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let lightFrame;
let pageLikes = Number.parseInt(window.localStorage.getItem('ly-kylo-page-likes') || '0', 10);
let hasLiked = window.localStorage.getItem('ly-kylo-has-liked') === 'true';
const pageViews = Number.parseInt(window.localStorage.getItem('ly-kylo-page-views') || '0', 10) + 1;

function playUiSound(kind = 'click') {
    effectContext = effectContext || new AudioContext();
    if (effectContext.state === 'suspended') effectContext.resume();
    const startTime = effectContext.currentTime;
    const isHover = kind === 'hover';
    const oscillator = effectContext.createOscillator();
    const gain = effectContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(isHover ? 620 : 740, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(isHover ? 880 : 1040, startTime + .08);
    gain.gain.setValueAtTime(.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(isHover ? .014 : .028, startTime + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, startTime + (isHover ? .08 : .16));
    oscillator.connect(gain).connect(effectContext.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + (isHover ? .09 : .17));

    if (!isHover) {
        const sparkle = effectContext.createOscillator();
        const sparkleGain = effectContext.createGain();
        sparkle.type = 'triangle';
        sparkle.frequency.setValueAtTime(1040, startTime + .06);
        sparkle.frequency.exponentialRampToValueAtTime(1480, startTime + .16);
        sparkleGain.gain.setValueAtTime(.0001, startTime + .06);
        sparkleGain.gain.exponentialRampToValueAtTime(.018, startTime + .068);
        sparkleGain.gain.exponentialRampToValueAtTime(.0001, startTime + .2);
        sparkle.connect(sparkleGain).connect(effectContext.destination);
        sparkle.start(startTime + .06);
        sparkle.stop(startTime + .21);
    }
}

document.addEventListener('pointerover', (event) => {
    const interactive = event.target.closest('button, a, label');
    if (interactive && !interactive.contains(event.relatedTarget)) playUiSound('hover');
});

document.addEventListener('click', (event) => {
    if (event.target.closest('button, a, label')) playUiSound('click');
});

window.localStorage.setItem('ly-kylo-page-views', pageViews);
viewCount.textContent = pageViews;

selectedAudio.loop = true;
selectedAudio.volume = volumeLevel;

function updateLikeButton() {
    likeCount.textContent = pageLikes;
    likeButton.classList.toggle('liked', hasLiked);
    likeButton.setAttribute('aria-pressed', hasLiked);
    likeHeart.textContent = hasLiked ? '♥' : '♡';
    likeLabel.textContent = hasLiked ? 'Liked this page' : 'Like this page';
}

updateLikeButton();

likeButton.addEventListener('click', () => {
    hasLiked = !hasLiked;
    pageLikes = Math.max(0, pageLikes + (hasLiked ? 1 : -1));
    window.localStorage.setItem('ly-kylo-page-likes', pageLikes);
    window.localStorage.setItem('ly-kylo-has-liked', hasLiked);
    updateLikeButton();
});

function moveCursorLight() {
    cursorLight.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
    logo.style.transform = `translate3d(${(pointerX - window.innerWidth / 2) * 0.012}px, ${(pointerY - window.innerHeight / 2) * 0.012}px, 0)`;
    profileCard.style.setProperty('--tilt-x', `${(window.innerHeight / 2 - pointerY) * 0.008}deg`);
    profileCard.style.setProperty('--tilt-y', `${(pointerX - window.innerWidth / 2) * 0.008}deg`);
    lightFrame = null;
}

window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!lightFrame) lightFrame = window.requestAnimationFrame(moveCursorLight);
});

window.addEventListener('scroll', () => {
    cursorLight.classList.add('scrolling');
    window.clearTimeout(window.cursorScrollTimer);
    window.cursorScrollTimer = window.setTimeout(() => cursorLight.classList.remove('scrolling'), 180);
});

function updateMusicControls(playing) {
    isPlaying = playing;
    musicToggle.classList.toggle('playing', playing);
    musicToggle.setAttribute('aria-pressed', playing);
    musicToggle.querySelector('.music-label').textContent = playing ? 'Pause music' : 'Play music';
}

function tryStartMusic() {
    selectedAudio.play().then(() => updateMusicControls(true)).catch(() => {
        updateMusicControls(false);
        document.addEventListener('pointerdown', tryStartMusic, { once: true });
    });
}

tryStartMusic();

function startAtmosphere() {
    audioContext = audioContext || new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = volumeLevel * 0.1;
    masterGain.connect(audioContext.destination);
    const notes = [146.83, 174.61, 220, 261.63];
    let noteIndex = 0;

    const playNote = () => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = notes[noteIndex % notes.length];
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.35, audioContext.currentTime + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 5);
        oscillator.connect(gain).connect(masterGain);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 5.1);
        noteIndex += 1;
    };

    playNote();
    musicTimer = window.setInterval(playNote, 2600);
}

function stopAtmosphere() {
    window.clearInterval(musicTimer);
    masterGain?.disconnect();
    audioContext?.close();
    audioContext = null;
}

function stopSelectedAudio() {
    if (!selectedAudio) return;
    selectedAudio.pause();
    selectedAudio.currentTime = 0;
}

musicToggle.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
        selectedAudio.play().catch(() => {
            isPlaying = false;
            musicToggle.classList.remove('playing');
            musicToggle.setAttribute('aria-pressed', 'false');
            musicToggle.querySelector('.music-label').textContent = 'Play music';
        });
    } else {
        selectedAudio.pause();
    }
    updateMusicControls(isPlaying);
});

volumeSlider.addEventListener('input', (event) => {
    volumeLevel = Number(event.target.value) / 100;
    volumeValue.textContent = `${event.target.value}%`;
    if (masterGain) masterGain.gain.value = volumeLevel * 0.1;
    if (selectedAudio) selectedAudio.volume = volumeLevel;
});
