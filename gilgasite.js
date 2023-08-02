let page = 0;
let oranges = []
let bugs = []
let startPos = { x: 954, y: 244 }
let nextOrange = 0
let nextBug = 0
let speed = 20
let bugSpeed = 2
let buggables = [];
let buggableCollided = {};
let lastAddedOrange = Date.now()
let addBugTime = 300


function switchitup(toggle) {
    toggle.checked ? handleChecked() : handleUnchecked();
}

function handleChecked() {
    page = 1;
    document.getElementById("body-root").className = "global-lit"
    document.getElementById("theme-song").play()
    document.getElementById("headshot").src = "headshot_deepfried.jpg"
    let headshoutBounds = document.getElementById("headshot").getBoundingClientRect();
    let width = headshoutBounds.right - headshoutBounds.left;
    let height = headshoutBounds.bottom - headshoutBounds.top;
    startPos = {x: headshoutBounds.left + Math.floor(width / 2), y: headshoutBounds.top + Math.floor(height / 2)}
    buggables = document.getElementsByName("buggable")
    bugs.forEach(bug => {
        document.getElementById(bug.id).style.display = "inline"
    })
    document.getElementById("toggle-sound").play()
    document.getElementById('body-root').style.userSelect = "none"
    document.getElementById("try-me").style.display = "none"
    document.getElementById("bug-attack").style.display = "block"
    gameLoop();
}

function handleUnchecked() {
    page = 0;
    document.getElementById("body-root").className = "global-regular"
    document.getElementById("theme-song").pause();
    document.getElementById("headshot").src = "headshot.png"
    bugs.forEach(bug => {
        document.getElementById(bug.id).style.display = "none"
    })
    document.getElementById('body-root').style.userSelect = "auto"
    document.getElementById("bug-attack").style.display = "none"
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
                    buggableCollided[bug.attached] = undefined;
                }
                document.getElementById("hit-bug").volume = 0.6
                document.getElementById("hit-bug").play()
            }
        }
        if (isOutOfBounds(orangeElement)) {
            orangeElement.remove();
            oranges.splice(index, 1)
        } else {
            orange.position.x += orange.dir.x * speed * dt
            orange.position.y += orange.dir.y * speed * dt
            orangeElement.style.left = (orange.position.x - 25).toString() + "px"
            orangeElement.style.top = (orange.position.y - 25).toString() + "px"
        }
    })
}

function handleBugs(dt) {
    bugs.forEach((bug, index) => {
        let bugElement = document.getElementById(bug.id)

        for (let i = 0; i < buggables.length; i++) {
            if (bug.attached == undefined) {
                let buggablesBound =  buggables[i].getBoundingClientRect();
                if (detectCollision(bugElement.getBoundingClientRect(), buggablesBound) && buggableCollided[i] === undefined) {
                    bug.attached = i;
                    buggables[i].style.position = "fixed"
                    buggables[i].style.left = buggablesBound.x
                    buggables[i].style.top = buggablesBound.y
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
            bug.position.x += bug.dir.x * bugSpeed * dt
            bug.position.y += bug.dir.y * bugSpeed * dt
            
            bugElement.style.left = (bug.position.x - 25).toString() + "px"
            bugElement.style.top = (bug.position.y - 25).toString() + "px"
            if (bug.attached !== undefined) {
                let boundBox = buggables[bug.attached].getBoundingClientRect();
                buggables[bug.attached].style.left = (boundBox.left + (bug.dir.x * bugSpeed * dt)).toString() + "px"
                buggables[bug.attached].style.top = (boundBox.top + (bug.dir.y * bugSpeed * dt)).toString() + "px"
            }
        }
    })
}

async function gameLoop() {
    let bugTimer = 0;
    let overallTime = 0;
    let gameTimer = new Date().getTime();
    while (page) {
        let currTime = new Date().getTime();
        let dt = (currTime - gameTimer) / 10
        handleOranges(dt)
        handleBugs(dt)
        bugTimer += dt;
        overallTime += dt;
        if (bugTimer > addBugTime) {
            addBug()
            bugTimer = 0
        }
        if (overallTime > 1000 && addBugTime > 150) {
            addBugTime *= 0.5
        }
        await sleep(0.5)
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
    if (page && Date.now() - lastAddedOrange > 300) {
        let dirX = event.pageX - startPos.x
        let dirY = event.pageY - startPos.y
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
        document.getElementById("shoot-orange").volume = 0.6
        document.getElementById("shoot-orange").load()
        document.getElementById("shoot-orange").play()
        nextOrange += 1;
        lastAddedOrange = Date.now()
    }
})
