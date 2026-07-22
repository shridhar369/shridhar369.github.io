// ================= RETRO MUSIC PLAYER =================
// One game stream plus offline-generated loops. Unavailable remote streams
// are removed automatically if the host changes in the future.

const BASE = 'https://archive.org/download/undertaleost_202004/' +
    'Undertale%20-%20Lossless%20Soundtrack%20%28toby%20fox%29/' +
    'toby%20fox%20-%20UNDERTALE%20Soundtrack%20-%20';
const playlist = [
    { title: 'MEGALOVANIA', artist: 'Undertale OST', src: BASE + '100%20MEGALOVANIA.mp3' },
    { title: 'SIGNAL LOST', artist: 'Portfolio Radio', synth: 'signal' },
    { title: 'ARCADE OVERDRIVE', artist: 'Portfolio Radio', synth: 'arcade' }
];
let currentTrack = 0;
let isPlaying = false;
let progressInterval = null;
const audioEl = new Audio();
audioEl.preload = 'metadata';
audioEl.volume = 0.8;

audioEl.addEventListener('ended', nextTrack);
audioEl.addEventListener('play', () => {
    isPlaying = true; updatePlayBtn(); startProgress();
    document.getElementById('player-vinyl')?.classList.add('spinning');
});
audioEl.addEventListener('pause', () => {
    isPlaying = false; updatePlayBtn(); stopProgress();
    document.getElementById('player-vinyl')?.classList.remove('spinning');
});
audioEl.addEventListener('error', () => {
    const failed = playlist.splice(currentTrack, 1)[0];
    console.warn('Removing unavailable audio stream:', failed?.title);
    if (!playlist.length) return setPlayerStatus('No music streams are available right now.');
    currentTrack %= playlist.length;
    renderPlaylist();
    loadTrack(true);
});

function playerPlayPause() {
    if (isPlaying) audioEl.pause();
    else audioEl.play().catch(() => setPlayerStatus('Press play again to start audio.'));
}
function prevTrack() { currentTrack = (currentTrack - 1 + playlist.length) % playlist.length; loadTrack(true); }
function nextTrack() { currentTrack = (currentTrack + 1) % playlist.length; loadTrack(true); }
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
    renderPlaylistHighlight();
    if (autoplay) audioEl.play().catch(() => setPlayerStatus('Could not start this stream.'));
}
function updatePlayBtn() {
    const btn = document.getElementById('player-play-btn');
    if (btn) btn.textContent = isPlaying ? '\u23f8' : '\u25b6';
}
function startProgress() {
    stopProgress();
    progressInterval = setInterval(() => {
        if (!Number.isFinite(audioEl.duration)) return;
        document.getElementById('player-progress').style.width = `${(audioEl.currentTime / audioEl.duration) * 100}%`;
        document.getElementById('player-time').textContent = `${formatTime(audioEl.currentTime)} / ${formatTime(audioEl.duration)}`;
    }, 250);
}
function stopProgress() { clearInterval(progressInterval); }
function formatTime(seconds) {
    const safe = Number.isFinite(seconds) ? seconds : 0;
    return `${Math.floor(safe / 60)}:${Math.floor(safe % 60).toString().padStart(2, '0')}`;
}
function seekTo(event) {
    if (!Number.isFinite(audioEl.duration)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    audioEl.currentTime = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * audioEl.duration;
}
function setVolume(value) { audioEl.volume = value / 100; }
function selectTrack(index) { currentTrack = index; loadTrack(true); }
function renderPlaylistHighlight() {
    document.querySelectorAll('.pl-item').forEach((item, index) => item.classList.toggle('pl-active', index === currentTrack));
}
function renderPlaylist() {
    const list = document.getElementById('player-playlist');
    if (!list) return;
    list.replaceChildren(...playlist.map((track, index) => {
        const row = document.createElement('button');
        row.type = 'button'; row.className = `pl-item${index === currentTrack ? ' pl-active' : ''}`;
        row.innerHTML = `<span class="pl-num">${index + 1}.</span>${track.title}`;
        row.addEventListener('click', () => selectTrack(index));
        return row;
    }));
}
function setPlayerStatus(message) {
    const note = document.querySelector('.player-note');
    if (note) note.textContent = message;
}

// Small original loops made in-browser. They give the player a reliable
// analog-horror / game-terminal mood without downloading copyrighted audio.
function makeSynthTrack(kind) {
    const rate = 16000;
    const seconds = 28;
    const samples = new Int16Array(rate * seconds);
    for (let index = 0; index < samples.length; index++) {
        const time = index / rate;
        let sound;
        if (kind === 'arcade') {
            // Fast, bright arpeggio with a low arcade kick on each beat.
            const notes = [60, 64, 67, 72, 76, 72, 67, 64];
            const step = Math.floor(time * 8) % notes.length;
            const frequency = 440 * Math.pow(2, (notes[step] - 69) / 12);
            const phase = time % 0.125;
            const lead = (2 * Math.abs(2 * ((frequency * time) % 1) - 1) - 1) * Math.max(0, 1 - phase * 7) * 0.22;
            const beat = time % 0.5;
            const kick = Math.sin(Math.PI * 2 * (110 - beat * 150) * time) * Math.max(0, 1 - beat * 7) * 0.15;
            sound = lead + kick;
        } else {
            const notes = [55, 58, 62, 58, 53, 55, 50, 48];
            const step = Math.floor(time * 2) % notes.length;
            const frequency = 440 * Math.pow(2, (notes[step] - 69) / 12);
            const phase = time % 0.5;
            const envelope = Math.min(1, phase * 16) * Math.max(0, 1 - phase * 1.7);
            const lead = Math.sin(Math.PI * 2 * frequency * time) * 0.24;
            const pulse = Math.sign(Math.sin(Math.PI * 2 * frequency * 0.5 * time)) * 0.055;
            const noise = (Math.sin(index * 12.9898) * 43758.5453 % 1 - 0.5) * 0.018;
            sound = (lead + pulse + noise) * envelope;
        }
        samples[index] = Math.max(-1, Math.min(1, sound)) * 32767;
    }
    const buffer = new ArrayBuffer(44 + samples.byteLength);
    const view = new DataView(buffer);
    const write = (offset, value) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
    write(0, 'RIFF'); view.setUint32(4, 36 + samples.byteLength, true); write(8, 'WAVEfmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, samples.byteLength, true);
    new Int16Array(buffer, 44).set(samples);
    return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}
function initPlayer() {
    playlist.filter(track => track.synth).forEach(track => { track.src = makeSynthTrack(track.synth); });
    renderPlaylist();
    loadTrack();
}
