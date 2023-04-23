let page = 0;
let oranges = []
let bugs = []
const startPos = { x: 954, y: 244 }
let nextOrange = 0;
let nextBug = 0;
let speed = 4
let bugSpeed = 1.2;


// TODO 
// fix start pos for different browser size
// remove bugs after homescreen
// bug / orange interactions
// finish resume


function switchitup(toggle) {
    toggle.checked ? handleChecked() : handleUnchecked();
}

function handleChecked() {
    page = 1;
    document.getElementById("body-root").className = "global-lit"
    document.getElementById("theme-song").play()
    document.getElementById("headshot").src = "headshot_deepfried.jpg"
    gameLoop();
}

function handleUnchecked() {
    page = 0;
    document.getElementById("body-root").className = "global-regular"
    document.getElementById("theme-song").pause();
    document.getElementById("headshot").src = "headshot.png"
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
}

function isOutOfBounds(element) {
    if (element) {
        const boundBox = element.getBoundingClientRect();
        if (boundBox.bottom < 0 || boundBox.left > window.innerWidth || boundBox.top > window.innerHeight || boundBox.right < 0) {
            return true;
        }
        return false;
    }
}

function handleOranges() {
    oranges.forEach((orange, index) => {
        let orangeElement = document.getElementById(orange.id)
        if (isOutOfBounds(orangeElement)) {
            orangeElement.remove();
            oranges.splice(index, 1)
        } else {
            orange.position.x += orange.dir.x * speed
            orange.position.y += orange.dir.y * speed
            orangeElement.style.left = (orange.position.x - 25).toString() + "px"
            orangeElement.style.top = (orange.position.y - 25).toString() + "px"
        }
    })
}

function handleBugs() {
    bugs.forEach((bug, index) => {
        let bugElement = document.getElementById(bug.id)
        if (isOutOfBounds(bugElement) && bug.inBounds) {
            bugElement.remove();
            bugs.splice(index, 1);
        } else {
            if (!bug.inBounds) {
                if (!isOutOfBounds(bugElement)) {
                    bug.inBounds = true;
                }
            }
            bug.position.x += bug.dir.x * bugSpeed
            bug.position.y += bug.dir.y * bugSpeed
            bugElement.style.left = (bug.position.x - 25).toString() + "px"
            bugElement.style.top = (bug.position.y - 25).toString() + "px"
        }
    })
}

async function gameLoop() {
    let bugTimer = 0;
    while (page) {
        handleOranges()
        handleBugs()
        bugTimer += 10;
        if (bugTimer % 2500 === 0) {
            addBug()
        }
        await sleep(0.5)
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
    let windowCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    let negativeX = getRandomInt(100) > 50 ? 1 : -1
    let negativeY = getRandomInt(100) > 50 ? 1 : -1
    let bug = {}
    switch (side) {
        case 0: // Top side
            bug.position = { x: getRandomInt(window.innerWidth), y: -100 }
            bug.dir = normalize({ x: (windowCenter.x + getRandomInt(100) * negativeX) - bug.position.x, y: (windowCenter.y + getRandomInt(100) * negativeY) - bug.position.y });
            bugs.push(bug)
            break;
        case 1: // Right side
            bug.position = { x: window.innerWidth + 100, y: getRandomInt(window.innerHeight) }
            bug.dir = normalize({ x: (windowCenter.x + getRandomInt(100) * negativeX) - bug.position.x, y: (windowCenter.y + getRandomInt(100) * negativeY) - bug.position.y });
            bugs.push(bug)
            break;
        case 2: // Bottom side
            bug.position = { x: getRandomInt(window.innerWidth), y: window.innerHeight }
            bug.dir = normalize({ x: (windowCenter.x + getRandomInt(100) * negativeX) - bug.position.x, y: (windowCenter.y + getRandomInt(100) * negativeY) - bug.position.y });
            bugs.push(bug)
            break;
        case 3: // Left side
            bug.position = { x: -100, y: getRandomInt(window.innerHeight) }
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
    bugElement.style = "position: fixed;"
    bugElement.style.left = bug.position.x.toString() + "px";
    bugElement.style.top = bug.position.y.toString() + "px";
    bugElement.style.transform = "translate(-50%. -50%)"
    bugElement.style.userSelect = "none"
    bugElement.id = bug.id
    document.body.append(bugElement)
    nextBug += 1;
}

window.addEventListener('click', function (event) {
    const parent = event.target.parentElement;
    if (parent && parent.id === "page-switch") {
        return;
    }
    if (page) {
        let dirX = event.screenX - startPos.x
        let dirY = event.screenY - startPos.y - 100
        let magnitude = Math.sqrt((dirX * dirX) + (dirY * dirY))
        let dirVector = { x: dirX / magnitude, y: dirY / magnitude }
        let newOrangeId = "orange_" + nextOrange.toString()
        const newOrange = { id: newOrangeId, dir: dirVector, position: { ...startPos } }
        oranges.push(newOrange);
        const orangeElement = document.createElement("img")
        orangeElement.src = "orange_art_2.png"
        orangeElement.id = newOrangeId
        orangeElement.style = "position: fixed;"
        orangeElement.style.left = startPos.x.toString() + "px";
        orangeElement.style.top = startPos.y.toString() + "px";
        orangeElement.style.transform = "translate(-50%. -50%)"
        orangeElement.style.userSelect = "none"
        document.body.appendChild(orangeElement)
        nextOrange += 1;
    }
})
