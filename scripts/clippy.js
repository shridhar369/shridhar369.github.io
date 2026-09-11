const clippyLines = [
    "It looks like you're trying to view a portfolio!",
    "I can help you find the projects folder.",
    "Trying not to go cold..",
    "Check out the 'Danger' icon... if you dare!",
    "I'm here to stay, whether you like it or not!",
    "Is it a bug, or is it a feature? I'll never tell.",
    "If you highlight the right spot, you might find something 👀",
    "Sleep schedule? Never heard of her.",
    "Say my name. (It's Clippit, but Clippy is fine.)",
    "Getting lost in internet lore and finding a home there."
];

// Flag to pause Clippy text rotation during game
window.clippyGameActive = false;

function rotateClippyText() {
    // Don't rotate text if the game is active
    if (window.clippyGameActive) return;
    
    const textElem = document.getElementById('clippy-text');
    const randomLine = clippyLines[Math.floor(Math.random() * clippyLines.length)];
    textElem.textContent = randomLine;
}

// Change Clippy's text every x seconds
setInterval(rotateClippyText, 9000);


function clippyClick() {
    const clippyContainer = document.querySelector('.clippy-container');
    const textElem = document.getElementById('clippy-text');
    
    // Add the shake class
    clippyContainer.classList.add('shake');
    
    // Pick a "clicked" specific response
    const clickResponses = [
        "Hey! That tickles.",
        "Stop clicking me and look at the Projects!",
        "I'm made of metal, you know.",
        "Ouch! My paperclip head!"
    ];
    
    textElem.textContent = clickResponses[Math.floor(Math.random() * clickResponses.length)];
    
    // Remove the shake class after animation finishes (500ms)
    setTimeout(() => {
        clippyContainer.classList.remove('shake');
    }, 500);
}