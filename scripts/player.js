// ================= RETRO MUSIC PLAYER =================

const BASE_URL = 'https://archive.org/download/undertaleost_202004/Undertale%20-%20Lossless%20Soundtrack%20%28toby%20fox%29/toby%20fox%20-%20UNDERTALE%20Soundtrack%20-%20';

const playlist = [
    { title: 'MEGALOVANIA', artist: 'Undertale OST', src: BASE_URL + '100%20MEGALOVANIA.mp3' },
    { title: 'SIGNAL LOST', artist: 'Portfolio Radio', synth: 'signal' },

    // ========================================================
    // --- SONG TEMPLATE 1: Local MP3 in your assets folder ---
    // 1. Put your mp3 file in the "assets/" folder (e.g., assets/my_track.mp3)
    // 2. Uncomment and adjust the line below:
    // { title: 'My Custom Song', artist: 'Artist Name', src: 'assets/my_track.mp3' },
    //
    // --- SONG TEMPLATE 2: Direct web link to any audio file ---
    // 1. Find any direct .mp3 or .ogg URL online
    // 2. Uncomment and adjust the line below:
    // { title: 'Online Track', artist: 'Artist Name', src: 'https://example.com/audio.mp3' }
    // ========================================================
];

let currentTrack = 0;
let isPlaying = false;
let progressInterval = null;
const audioEl = new Audio();
audioEl.preload = 'metadata';
audioEl.volume = 0.8;

// --- AUDIO EVENTS ---
audioEl.addEventListener('ended', nextTrack);
audioEl.addEventListener('play', () => setPlaybackState(true));
audioEl.addEventListener('pause', () => setPlaybackState(false));
audioEl.addEventListener('error', () => {
    playlist.splice(currentTrack, 1);
    if (!playlist.length) return setPlayerStatus('No music streams available.');
    currentTrack %= playlist.length;
    renderPlaylist();
    loadTrack(true);
});

function setPlaybackState(playing) {
    isPlaying = playing;
    const btn = document.getElementById('player-play-btn');
    if (btn) btn.textContent = playing ? '\u23f8' : '\u25b6';
    document.getElementById('player-vinyl')?.classList.toggle('spinning', playing);
    clearInterval(progressInterval);
    if (playing) progressInterval = setInterval(updateProgress, 250);
}

function updateProgress() {
    if (!Number.isFinite(audioEl.duration)) return;
    const pct = (audioEl.currentTime / audioEl.duration) * 100;
    document.getElementById('player-progress').style.width = `${pct}%`;
    document.getElementById('player-time').textContent = `${fmt(audioEl.currentTime)} / ${fmt(audioEl.duration)}`;
}

const fmt = (s) => `${Math.floor(s / 60 || 0)}:${String(Math.floor(s % 60 || 0)).padStart(2, '0')}`;

function playerPlayPause() {
    isPlaying ? audioEl.pause() : audioEl.play().catch(() => setPlayerStatus('Click to start audio.'));
}

function prevTrack() {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(true);
}

function nextTrack() {
    currentTrack = (currentTrack + 1) % playlist.length;
    loadTrack(true);
}

function selectTrack(index) {
    currentTrack = index;
    loadTrack(true);
}

function loadTrack(autoplay = false) {
    const track = playlist[currentTrack];
    if (!track) return;
    audioEl.src = track.src;
    audioEl.load();
    document.getElementById('player-title').textContent = track.title;
    document.getElementById('player-artist').textContent = track.artist;
    document.getElementById('player-track-num').textContent = `${currentTrack + 1} / ${playlist.length}`;
    document.getElementById('player-progress').style.width = '0%';
    document.getElementById('player-time').textContent = '0:00 / 0:00';
    document.querySelectorAll('.pl-item').forEach((el, i) => el.classList.toggle('pl-active', i === currentTrack));
    if (autoplay) audioEl.play().catch(() => setPlayerStatus('Could not play stream.'));
}

function seekTo(e) {
    if (!Number.isFinite(audioEl.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioEl.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * audioEl.duration;
}

function setVolume(val) { audioEl.volume = val / 100; }

function renderPlaylist() {
    const list = document.getElementById('player-playlist');
    if (!list) return;
    list.innerHTML = '';
    playlist.forEach((track, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `pl-item${i === currentTrack ? ' pl-active' : ''}`;
        btn.innerHTML = `<span class="pl-num">${i + 1}.</span>${track.title}`;
        btn.onclick = () => selectTrack(i);
        list.appendChild(btn);
    });
}

function setPlayerStatus(msg) {
    const note = document.querySelector('.player-note');
    if (note) note.textContent = msg;
}

// 8-bit ambient loop generator for "SIGNAL LOST"
function makeSynthTrack() {
    const rate = 16000, sec = 16, samples = new Int16Array(rate * sec);
    const notes = [55, 58, 62, 58, 53, 55, 50, 48];
    for (let i = 0; i < samples.length; i++) {
        const t = i / rate, step = Math.floor(t * 2) % notes.length;
        const freq = 440 * Math.pow(2, (notes[step] - 69) / 12), phase = t % 0.5;
        const env = Math.min(1, phase * 16) * Math.max(0, 1 - phase * 1.7);
        const sound = (Math.sin(2 * Math.PI * freq * t) * 0.24 + Math.sign(Math.sin(Math.PI * freq * 0.5 * t)) * 0.05) * env;
        samples[i] = Math.max(-1, Math.min(1, sound)) * 32767;
    }
    const buf = new ArrayBuffer(44 + samples.byteLength), view = new DataView(buf);
    const write = (pos, str) => [...str].forEach((c, idx) => view.setUint8(pos + idx, c.charCodeAt(0)));
    write(0, 'RIFF'); view.setUint32(4, 36 + samples.byteLength, true); write(8, 'WAVEfmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, samples.byteLength, true);
    new Int16Array(buf, 44).set(samples);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

function switchPlayerTab(tab) {
    const scView = document.getElementById('player-soundcloud-view');
    const customView = document.getElementById('player-custom-view');
    const tabSc = document.getElementById('tab-sc');
    const tabCustom = document.getElementById('tab-custom');

    if (tab === 'soundcloud') {
        if (scView) scView.style.display = 'block';
        if (customView) customView.style.display = 'none';
        tabSc?.classList.add('active');
        tabCustom?.classList.remove('active');
        if (isPlaying) playerPlayPause();
    } else {
        if (scView) scView.style.display = 'none';
        if (customView) customView.style.display = 'block';
        tabSc?.classList.remove('active');
        tabCustom?.classList.add('active');
    }
}
window.switchPlayerTab = switchPlayerTab;

function initPlayer() {
    playlist.forEach(t => { if (t.synth) t.src = makeSynthTrack(); });
    renderPlaylist();
    loadTrack();
}
