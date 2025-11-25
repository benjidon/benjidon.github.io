let page = 0;
let oranges = []
let bugs = []
let startPos = { x: 954, y: 244 }
let nextOrange = 0
let nextBug = 0
let speed = 25
let bugSpeed = 2
let buggables = [];
let buggableCollided = {};
let lastAddedOrange = Date.now()
let addBugTime = 3000

// Pre-cache audio elements for better performance
let shootSound = null;
let hitSound = null;


function switchitup(toggle) {
    toggle.checked ? handleChecked() : handleUnchecked();
}

function handleChecked() {
    page = 1;
    document.getElementById("body-root").className = "global-lit"
    
    // Force crosshair cursor on all elements
    document.documentElement.style.cursor = "url('crosshair.png') 15 15, auto";
    document.body.style.cursor = "url('crosshair.png') 15 15, auto";
    
    // Pre-cache and configure audio elements
    shootSound = document.getElementById("shoot-orange");
    hitSound = document.getElementById("hit-bug");
    shootSound.volume = 0.6;
    hitSound.volume = 0.6;
    
    document.getElementById("theme-song").play()
    document.getElementById("headshot").src = "headshot_deepfried.jpg"
    let headshoutBounds = document.getElementById("headshot").getBoundingClientRect();
    let width = headshoutBounds.right - headshoutBounds.left;
    let height = headshoutBounds.bottom - headshoutBounds.top;
    // Keep in viewport coordinates since we're using position: fixed
    startPos = {
        x: headshoutBounds.left + Math.floor(width / 2), 
        y: headshoutBounds.top + Math.floor(height / 2)
    }
    buggables = document.getElementsByName("buggable")
    bugs.forEach(bug => {
        document.getElementById(bug.id).style.display = "inline"
    })
    document.getElementById("toggle-sound").play()
    document.getElementById('body-root').style.userSelect = "none"
    document.getElementById("try-me").style.display = "none"
    document.getElementById("bug-attack").style.display = "block"
    
    // Add touch event listener only when game is active
    window.addEventListener('touchstart', handleShoot, { passive: true });
    
    gameLoop();
}

function handleUnchecked() {
    page = 0;
    document.getElementById("body-root").className = "global-regular"
    
    // Reset cursor to default
    document.documentElement.style.cursor = "";
    document.body.style.cursor = "";
    
    document.getElementById("theme-song").pause();
    document.getElementById("headshot").src = "headshot.png"
    bugs.forEach(bug => {
        document.getElementById(bug.id).style.display = "none"
    })
    document.getElementById('body-root').style.userSelect = "auto"
    document.getElementById("bug-attack").style.display = "none"
    
    // Remove touch event listener when game is inactive
    window.removeEventListener('touchstart', handleShoot);
    
    // Clear audio cache
    shootSound = null;
    hitSound = null;
    
    cleanup()
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanup() {
    oranges.forEach(orange => {
        document.getElementById(orange.id).remove();
    })
    oranges = [];
    nextOrange = 0;
    
    // Reset all buggable elements to their original state
    if (buggables) {
        for (let i = 0; i < buggables.length; i++) {
            if (buggableCollided[i] !== undefined) {
                buggables[i].style.position = "";
                buggables[i].style.left = "";
                buggables[i].style.top = "";
                buggables[i].style.float = "";
            }
        }
    }
    buggableCollided = {};
}

function isOutOfBounds(element) {
    if (element) {
        const boundBox = element.getBoundingClientRect();
        if (boundBox.bottom < -2000 || boundBox.left > window.innerWidth + 2000 || boundBox.top > window.innerHeight + 1000 || boundBox.right < -1000) {
            return true;
        }
        return false;
    }
}

function detectCollision(bb1, bb2) {
    let bb1Width = bb1.right - bb1.left
    let bb1Height = bb1.bottom - bb1.top
    let bb2Width = bb2.right - bb2.left
    let bb2Height = bb2.bottom - bb2.top
    return (bb1.x + bb1Width >= bb2.x &&
        bb1.x <= bb2.x + bb2Width &&
        bb1.y + bb1Height >= bb2.y &&
        bb1.y <= bb2.y + bb2Height);
}

function handleOranges(dt) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const orangeSpeed = isMobile ? speed * 0.75 : speed; // Slightly slower on mobile
    
    oranges.forEach((orange, index) => {
        let orangeElement = document.getElementById(orange.id)
        for (let i = 0; i < bugs.length; i++) {
            let bug = bugs[i]
            let bugElement = document.getElementById(bug.id);
            if (detectCollision(bugElement.getBoundingClientRect(), orangeElement.getBoundingClientRect())) {
                orangeElement.remove();
                oranges.splice(index, 1)
                bugElement.remove();
                bugs.splice(i, 1)
                if (bug.attached !== undefined) {
                    // Text is already in document coordinates, just leave it in place
                    buggableCollided[bug.attached] = undefined;
                }
                // Play hit sound with optimized cached element
                if (hitSound) {
                    hitSound.currentTime = 0; // Reset to start for rapid fire
                    hitSound.play().catch(() => {}); // Ignore play errors
                }
            }
        }
        if (isOutOfBounds(orangeElement)) {
            orangeElement.remove();
            oranges.splice(index, 1)
        } else {
            orange.position.x += orange.dir.x * orangeSpeed * dt
            orange.position.y += orange.dir.y * orangeSpeed * dt
            orangeElement.style.left = (orange.position.x - 25).toString() + "px"
            orangeElement.style.top = (orange.position.y - 25).toString() + "px"
        }
    })
}

function handleBugs(dt) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const mobileBugSpeed = isMobile ? bugSpeed * 0.7 : bugSpeed; // Slightly slower on mobile
    
    bugs.forEach((bug, index) => {
        let bugElement = document.getElementById(bug.id)

        for (let i = 0; i < buggables.length; i++) {
            if (bug.attached == undefined) {
                let buggablesBound =  buggables[i].getBoundingClientRect();
                if (detectCollision(bugElement.getBoundingClientRect(), buggablesBound) && buggableCollided[i] === undefined) {
                    bug.attached = i;
                    buggables[i].style.position = "absolute"
                    buggables[i].style.left = (buggablesBound.left + window.scrollX) + "px"
                    buggables[i].style.top = (buggablesBound.top + window.scrollY) + "px"
                    buggables[i].style.float = "none";
                    buggableCollided[i] = true;
                    bug.dir.x = bug.dir.x * -1;
                    bug.dir.y = bug.dir.y * -1;
                }
            }
        }

        if (isOutOfBounds(bugElement) && bug.inBounds) {
            bugElement.remove();
            bugs.splice(index, 1);
        } else {
            if (!bug.inBounds) {
                if (!isOutOfBounds(bugElement)) {
                    bug.inBounds = true;
                }
            }
            bug.position.x += bug.dir.x * mobileBugSpeed * dt
            bug.position.y += bug.dir.y * mobileBugSpeed * dt
            
            bugElement.style.left = (bug.position.x - 25).toString() + "px"
            bugElement.style.top = (bug.position.y - 25).toString() + "px"
            if (bug.attached !== undefined) {
                let currentLeft = parseFloat(buggables[bug.attached].style.left);
                let currentTop = parseFloat(buggables[bug.attached].style.top);
                buggables[bug.attached].style.left = (currentLeft + (bug.dir.x * mobileBugSpeed * dt)).toString() + "px"
                buggables[bug.attached].style.top = (currentTop + (bug.dir.y * mobileBugSpeed * dt)).toString() + "px"
            }
        }
    })
}

async function gameLoop() {
    let bugTimer = 0;
    let overallTime = 0;
    let gameTimer = performance.now();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    while (page) {
        let currTime = performance.now();
        let deltaTime = currTime - gameTimer;
        let dt = deltaTime / 10; // Keep original movement scaling
        
        // Cap delta time to prevent huge jumps (e.g., when tab becomes inactive)
        dt = Math.min(dt, 5);
        
        handleOranges(dt)
        handleBugs(dt)
        bugTimer += deltaTime; // Use actual milliseconds for timers
        overallTime += deltaTime;
        
        if (bugTimer > addBugTime) {
            addBug()
            bugTimer = 0
        }
        if (overallTime > 5000 && addBugTime > 1500) {
            addBugTime *= 0.8
        }
        
        // Use longer sleep on mobile for better performance
        await sleep(isMobile ? 12 : 6)
        gameTimer = currTime;
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function normalize(vec) {
    let magnitude = Math.sqrt(vec.x * vec.x + vec.y * vec.y)
    return { x: vec.x / magnitude, y: vec.y / magnitude }
}

function addBug() {
    let side = getRandomInt(4);
    let windowCenter = { x: window.innerWidth / 2 + window.scrollX, y: window.innerHeight / 2 + window.scrollY }
    let negativeX = getRandomInt(100) > 50 ? 1 : -1
    let negativeY = getRandomInt(100) > 50 ? 1 : -1
    let bug = {}
    switch (side) {
        case 0: // Top side
            bug.position = { x: getRandomInt(window.innerWidth) + window.scrollX, y: window.scrollY - 100 }
            bug.dir = normalize({ x: (windowCenter.x + getRandomInt(100) * negativeX) - bug.position.x, y: (windowCenter.y + getRandomInt(100) * negativeY) - bug.position.y });
            bugs.push(bug)
            break;
        case 1: // Right side
            bug.position = { x: window.innerWidth + window.scrollX + 100, y: getRandomInt(window.innerHeight) + window.scrollY }
            bug.dir = normalize({ x: (windowCenter.x + getRandomInt(100) * negativeX) - bug.position.x, y: (windowCenter.y + getRandomInt(100) * negativeY) - bug.position.y });
            bugs.push(bug)
            break;
        case 2: // Bottom side
            bug.position = { x: getRandomInt(window.innerWidth) + window.scrollX, y: window.innerHeight + window.scrollY }
            bug.dir = normalize({ x: (windowCenter.x + getRandomInt(100) * negativeX) - bug.position.x, y: (windowCenter.y + getRandomInt(100) * negativeY) - bug.position.y });
            bugs.push(bug)
            break;
        case 3: // Left side
            bug.position = { x: window.scrollX - 100, y: getRandomInt(window.innerHeight) + window.scrollY }
            bug.dir = normalize({ x: (windowCenter.x + getRandomInt(100) * negativeX) - bug.position.x, y: (windowCenter.y + getRandomInt(100) * negativeY) - bug.position.y });
            bugs.push(bug)
            break;
        default:
            break;
    }
    bug.id = "bug_" + nextBug.toString();
    bug.inBounds = false;
    const bugElement = document.createElement("img")
    bugElement.src = "bug_2.png"
    bugElement.style = "position: absolute;"
    bugElement.style.left = bug.position.x.toString() + "px";
    bugElement.style.top = bug.position.y.toString() + "px";
    bugElement.style.transform = "translate(-50%, -50%)"
    bugElement.style.userSelect = "none"
    bugElement.id = bug.id
    document.body.append(bugElement)
    nextBug += 1;
}

function updateStartPos() {
    if (page) {
        let headshoutBounds = document.getElementById("headshot").getBoundingClientRect();
        let width = headshoutBounds.right - headshoutBounds.left;
        let height = headshoutBounds.bottom - headshoutBounds.top;
        // Keep in viewport coordinates since we're using position: fixed
        startPos = {
            x: headshoutBounds.left + Math.floor(width / 2), 
            y: headshoutBounds.top + Math.floor(height / 2)
        }
    }
}

// Update start position when scrolling
window.addEventListener('scroll', updateStartPos);

function handleShoot(event) {
    const parent = event.target.parentElement;
    if (parent && parent.id === "page-switch") {
        return;
    }
    
    // Only handle shooting if game is active
    if (!page) {
        return;
    }
    
    // Slower shooting on mobile to reduce performance load
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const shootCooldown = isMobile ? 150 : 50;
    
    if (Date.now() - lastAddedOrange > shootCooldown) {
        // Don't prevent default to allow scrolling
        
        // Update start position to ensure accuracy
        updateStartPos();
        
        // Get coordinates from touch or mouse event
        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        let dirX = clientX - startPos.x
        let dirY = clientY - startPos.y
        let magnitude = Math.sqrt((dirX * dirX) + (dirY * dirY))
        let dirVector = { x: dirX / magnitude, y: dirY / magnitude }
        let newOrangeId = "orange_" + nextOrange.toString()
        const newOrange = { id: newOrangeId, dir: dirVector, position: { ...startPos } }
        oranges.push(newOrange);
        const orangeElement = document.createElement("img")
        orangeElement.src = "orange_art_2.png"
        orangeElement.id = newOrangeId
        orangeElement.style = "position: fixed;"
        orangeElement.style.left = (startPos.x - 25).toString() + "px";
        orangeElement.style.top = (startPos.y - 25).toString() + "px";
        orangeElement.style.userSelect = "none"
        document.body.appendChild(orangeElement)
        // Play shoot sound with optimized cached element
        if (shootSound) {
            shootSound.currentTime = 0; // Reset to start for rapid fire
            shootSound.play().catch(() => {}); // Ignore play errors
        }
        nextOrange += 1;
        lastAddedOrange = Date.now()
    }
}

// Add mouse event listener (always active)
window.addEventListener('mousedown', handleShoot);

// Touch event listener will be added/removed when game starts/stops
