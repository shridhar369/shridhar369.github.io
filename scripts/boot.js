// --- TYPING SOUND (Web Audio API) ---
let audioCtx = null;

function unlockAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTypeTick() {
    if (!audioCtx || audioCtx.state !== 'running') return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        const now = audioCtx.currentTime;
        osc.frequency.setValueAtTime(760 + Math.random() * 110, now);
        gain.gain.setValueAtTime(0.012, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
    } catch (e) { }
}

// --- FAST BIOS TYPEWRITER ---
const biosLines = [
    "For the Correct Version, open it on your computer",
    "",

    "S-BIOS (C) 2025 Portfolio Systems Inc.",
    "Beta Version 1.0.0  |  Build: 12/31/1999",
    "Architecture: 100% Vanilla HTML/CSS/JS",
    "",

    "CPU: Intel(R) 80486 DX2 @ 3.6GHz",
    "GPU: Integrated",
    "Checking RAM ............ OK",
    "Detecting Memory .......... OK",
    "",

    "Verifying System Integrity",
    "SYSTEM READY"
];

const biosTextElem = document.getElementById("bios-text");
const bootBtn = document.getElementById("boot-btn");

let lineIndex = 0;
let charIndex = 0;

function typeBiosText() {
    if (lineIndex >= biosLines.length) {
        bootBtn.style.display = "inline-block";
        return;
    }

    const line = biosLines[lineIndex];

    if (charIndex < line.length) {
        biosTextElem.textContent += line.charAt(charIndex);
        playTypeTick();
        charIndex++;
        setTimeout(typeBiosText, 10);
    } else {
        biosTextElem.textContent += "\n";
        charIndex = 0;
        lineIndex++;
        setTimeout(typeBiosText, 80); // quick line delay
    }
}

window.addEventListener("load", () => {
    // Show the pre-boot prompt — wait for user click/keypress to unlock audio
    const preBootMsg = document.getElementById('pre-boot-msg');
    if (preBootMsg) {
        preBootMsg.style.display = 'block';
    }

    function startBoot() {
        unlockAudio();
        if (preBootMsg) preBootMsg.style.display = 'none';
        typeBiosText();
        document.removeEventListener('keydown', startBoot);
        document.removeEventListener('click', startBoot);
    }

    document.addEventListener('keydown', startBoot, { once: true });
    document.addEventListener('click', startBoot, { once: true });

    const mainDesktop = document.getElementById('main-desktop');
    if (mainDesktop && mainDesktop.style.display !== 'none') {
        startPeriodicShake();
    }
});




// 1. Clock Functionality
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const timeString = `${hours}:${minutes} ${ampm}`;
    document.getElementById('clock').textContent = timeString;
}

setInterval(updateClock, 1000);
updateClock();

// 2. Window Management (Open/Close/Z-Index)
let zIndexCounter = 10;

function openWindow(id) {
    const win = document.getElementById(id);
    win.style.display = 'flex';
    delete win.dataset.minimized;
    bringToFront(win);
    updateTaskbar();
}

function closeWindow(id) {
    const win = document.getElementById(id);
    win.style.display = 'none';
    delete win.dataset.minimized;
    updateTaskbar();
}

function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.dataset.minimized = 'true';
    win.style.display = 'none';
    updateTaskbar();
}

function updateTaskbar() {
    const tabsContainer = document.getElementById('taskbar-tabs');
    tabsContainer.innerHTML = '';

    document
        .querySelectorAll('.window[data-taskbar="true"]')
        .forEach(win => {
            if (win.style.display !== 'none' || win.dataset.minimized === 'true') {
                // Prefer the desktop icon label that opens this window (if present)
                let label = null;

                // Look for an .icon whose onclick references this window id
                try {
                    const icon = document.querySelector(`.icon[onclick*="${win.id}"]`);
                    if (icon) {
                        label = icon.querySelector('.icon-label')?.textContent?.trim();
                    }
                } catch (e) {
                    // ignore selector errors
                }

                // Fallback to window title
                if (!label) {
                    label = win.querySelector('.title-bar-text')?.textContent?.trim();
                }

                if (!label) return;

                const tab = document.createElement('div');
                tab.className = 'task-tab';
                tab.textContent = label;

                if (win.dataset.minimized === 'true') tab.classList.add('minimized-tab');
                tab.onclick = () => {
                    if (win.dataset.minimized === 'true') {
                        win.style.display = 'flex';
                        delete win.dataset.minimized;
                    }
                    bringToFront(win);
                };

                tabsContainer.appendChild(tab);
            }
        });
}


// Add this line to your bringToFront function to highlight the tab
function bringToFront(element) {
    zIndexCounter++;
    element.style.zIndex = zIndexCounter;
    updateTaskbar();
}

// Add click event to all windows to bring them to front when clicked
document.querySelectorAll('.window').forEach(win => {
    win.addEventListener('mousedown', () => {
        bringToFront(win);
    });
});

// 3. Draggable Windows Logic
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    // The header is the handle for dragging
    const header = element.querySelector('.title-bar');

    if (header) {
        header.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e.preventDefault();
        // Get the mouse cursor position at startup
        pos3 = e.clientX;
        pos4 = e.clientY;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;

        // Bring window to front when dragging starts
        bringToFront(element);
    }

    function elementDrag(e) {
        e.preventDefault();
        // Calculate the new cursor position
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Set the element's new position
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Initialize drag for all windows
document.querySelectorAll('.window').forEach(win => {
    makeDraggable(win);
});
/* --- EXISTING CODE ABOVE (Clock, Drag, Open/Close) --- */

// --- NEW FUNCTIONS ---

// 1. Boot System Logic
function bootSystem() {

    document.getElementById('boot-screen').style.display = 'none';
    document.getElementById('main-desktop').style.display = 'block';
    document.getElementById('taskbar').style.display = 'flex';

    // Start background video
    const bgVideo = document.getElementById('desktop-bg-video');
    if (bgVideo) {
        bgVideo.muted = true;
        bgVideo.play().catch(err => {
            console.log("Video playback note:", err);
        });
    }

    // 2. NEW: Reveal Clippy
    const clippy = document.querySelector('.clippy-container');
    if (clippy) {
        clippy.style.display = 'flex';
        setTimeout(() => {
            clippy.style.opacity = '1'; // Fade it in
        }, 500); // Wait half a second after the desktop appears
    }

    // 3. Audio Handling
    const audio = document.getElementById('startup-sound');
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(err => {
        console.log("Audio issue:", err);
    });

    // 4. Init music player
    if (typeof initPlayer === 'function') initPlayer();

    // 5. Start periodic CRT screen shake (random every 4-7 seconds)
    startPeriodicShake();
}

// --- PERIODIC SCREEN SHAKE LOGIC ---
let periodicShakeTimer = null;

function triggerPeriodicShake() {
    const shutdownScreen = document.getElementById('shutdown-screen');
    const bsodScreen = document.getElementById('bsod');

    // Skip shake if system is shut down or BSOD is visible
    if ((shutdownScreen && shutdownScreen.style.display === 'flex') ||
        (bsodScreen && bsodScreen.style.display === 'block')) {
        return;
    }

    const bodyElem = document.body;
    bodyElem.classList.add('periodic-shake');

    setTimeout(() => {
        bodyElem.classList.remove('periodic-shake');
    }, 400);

    // Random interval between 6 and 9 seconds (4000ms - 9000ms)
    const nextInterval = Math.floor(Math.random() * 3000) + 6000;
    periodicShakeTimer = setTimeout(triggerPeriodicShake, nextInterval);
}

function startPeriodicShake() {
    if (periodicShakeTimer) clearTimeout(periodicShakeTimer);
    // Show first glitch tear shortly after boot (1.5s), then every 4-7 seconds
    periodicShakeTimer = setTimeout(triggerPeriodicShake, 1500);
}

window.triggerPeriodicShake = triggerPeriodicShake;



/* Folder Logic*/
function showFolder(folderId) {
    // Hide all contents
    document.querySelectorAll('.folder-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById('default-msg').style.display = 'none';

    // Show selected content
    const selected = document.getElementById('folder-' + folderId);
    if (selected) {
        selected.style.display = 'block';
    }

    // Highlight active folder in the tree
    document.querySelectorAll('.folder-item').forEach(item => {
        item.classList.remove('active-folder');
        if (item.textContent.toLowerCase().includes(folderId)) {
            item.classList.add('active-folder');
        }
    });
}

function shutDown() {
    const shutdownScreen = document.getElementById('shutdown-screen');

    // Optional: Add a quick "flicker" before going black
    document.body.style.filter = "brightness(2) contrast(3)";

    setTimeout(() => {
        document.body.style.filter = "none";
        shutdownScreen.style.display = 'flex';

        // Hide the main desktop so it's truly "gone"
        document.getElementById('main-desktop').style.display = 'none';
        document.getElementById('taskbar').style.display = 'none';

        const bgVideo = document.getElementById('desktop-bg-video');
        if (bgVideo) bgVideo.pause();

        // Clippy also disappears into the void
        const clippy = document.querySelector('.clippy-container');
        if (clippy) clippy.style.display = 'none';
    }, 1000);
}
