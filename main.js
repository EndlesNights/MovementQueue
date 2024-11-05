const MODULE_ID = "movement-queue";
const arrowHeadLength = 30;
const arrowHeadWidth = 15;

Hooks.once("init", async function () {
    game.MovementQueue = {};

    game.MovementQueue.setSelectSegmentFlag = setSelectSegmentFlag;
    game.MovementQueue.unsetSelectSegmentFlag = unsetSelectSegmentFlag;
    game.MovementQueue.setTokenSegmentFlag = setTokenSegmentFlag;
    game.MovementQueue.unsetTokenSegmentFlag = unsetTokenSegmentFlag;

    game.MovementQueue.tokenTakeSegmentedPath = tokenTakeSegmentedPath;
    game.MovementQueue.selectTokensTakeSegmentedPath = selectTokensTakeSegmentedPath;
    game.MovementQueue.allTokensTakeSegmentedPath = allTokensTakeSegmentedPath;

    game.MovementQueue.drawTokenPath = drawTokenPath;
    game.MovementQueue.drawAllTokenPaths = drawAllTokenPaths;

    game.MovementQueue.clearAllTokenPathDrawings = clearAllTokenPathDrawings;
});

function tokenTakeSegmentedPath(token) {
    const segmentsData = token.document.getFlag(MODULE_ID, "segments");
    if (!segmentsData) {
        return ui.notifications.info(`No flagged segment data!`);
    }

    const ruler = new Ruler();
    ruler.segments = [];
    for (const seg of segmentsData) {
        const ray = new Ray(seg.A, seg.B);
        ruler.segments.push({ ray });
    }

    ruler._animateMovement(token);
}

function selectTokensTakeSegmentedPath() {
    const selectedTokens = canvas.tokens.controlled;
    if (selectedTokens.length === 0) {
        return ui.notifications.error("No tokens selected.");
    }

    selectedTokens.forEach((token) => {
        tokenTakeSegmentedPath(token);
        unsetTokenSegmentFlag(token);
    });
}

function allTokensTakeSegmentedPath() {
    const allSceneTokens = canvas.scene.tokens;
    allSceneTokens.forEach((token) => {
        console.log(token)
        const segmentsData = token.object.document.getFlag(MODULE_ID, "segments");
        if (segmentsData) {
            tokenTakeSegmentedPath(token.object);
            unsetTokenSegmentFlag(token.object);
        }
    });
}

async function setTokenSegmentFlag(token) {
    if (!canvas.controls?.ruler.segments) {
        return ui.notifications.info(`No Ruler Segment Found!`);
    }

    // token.document.setFlag(MODULE_ID, "segments", canvas.controls.ruler.segments);
    console.log(canvas.controls.ruler.segments);

    const segments = [];
    for (const segment of canvas.controls.ruler.segments) {
        await segments.push({ A: segment.ray.A, B: segment.ray.B });
        console.log(segment)
    }

    return await token.document.setFlag(MODULE_ID, "segments", segments);
    // token.document.setFlag(MODULE_ID, "segments", "SomeText");
}

async function setSelectSegmentFlag() {
    const selectedTokens = canvas.tokens.controlled;
    if (selectedTokens.length === 0) {
        return ui.notifications.error("No tokens selected.");
    }

    if (!canvas.controls?.ruler.segments) {
        return ui.notifications.info(`No Ruler Segment Found!`);
    }

    for (const token of selectedTokens) {
        await setTokenSegmentFlag(token);
        ui.notifications.info(`Flag set for ${token.name}.`);
    }

}

function unsetTokenSegmentFlag(token) {
    token.document.unsetFlag(MODULE_ID, "segments");
}

function unsetSelectSegmentFlag() {

    let selectedTokens = canvas.tokens.controlled;
    if (selectedTokens.length === 0) {
        return ui.notifications.error("No tokens selected.");
    }

    selectedTokens.forEach((token) => {
        unsetTokenSegmentFlag(token);
        ui.notifications.info(`Flag unset for ${token.name}.`);
    });
}

async function drawTokenPath(token) {

    const segmentsData = await token.document.getFlag(MODULE_ID, "segments")
    if (!segmentsData) {
        return;
    }
    console.log(segmentsData)


    if (!canvas.MovementQueueDrawings) {
        canvas.MovementQueueDrawings = {};
    }

    const tokenID = token.id
    if (canvas.MovementQueueDrawings[tokenID]) {
        await clearTokenPathDrawing(token);
        canvas.MovementQueueDrawings = {};
    }

    // canvas.MovementQueueDrawings[tokenID] = [];

    let color = "0x00FF00";
    let thickness = 3;

    const position = token.center;
    canvas.MovementQueueDrawings[tokenID] = new PIXI.Graphics();
    // canvas.MovementQueueDrawings[tokenID].lineStyle(thickness, color).moveTo(position.x, position.y)
    canvas.MovementQueueDrawings[tokenID].lineStyle({
        width: thickness,
        color,
        join: "round",
        cap: "round"
    });
    canvas.MovementQueueDrawings[tokenID].moveTo(position.x, position.y)

    if (!segmentsData.length) return;

    for (let i = 0; i < segmentsData.length; i++) {

        const dx = (segmentsData[i].B.x - segmentsData[i].A.x);
        const dy = (segmentsData[i].B.y - segmentsData[i].A.y);
        position.x += dx;
        position.y += dy;

        canvas.MovementQueueDrawings[tokenID].lineTo(position.x, position.y);
    }

    //draw arrowHead at end
    const lastSegment = getLastValidSegment(segmentsData);
    if (lastSegment) {
        // Use the total final position as the end of the last segment
        const arrowLength = 30;  // Length of the arrowhead lines
        const arrowAngle = Math.PI / 6;  // Angle between the arrow lines (30 degrees)

        // Calculate the final displacement of the last valid segment
        const lastDx = lastSegment.B.x - lastSegment.A.x;
        const lastDy = lastSegment.B.y - lastSegment.A.y;

        // Calculate the angle of the last segment (based on displacement)
        const lineAngle = Math.atan2(lastDy, lastDx);

        // Calculate the two arrowhead points relative to the current position
        const arrowPoint1 = {
            x: position.x - arrowLength * Math.cos(lineAngle - arrowAngle),
            y: position.y - arrowLength * Math.sin(lineAngle - arrowAngle)
        };
        const arrowPoint2 = {
            x: position.x - arrowLength * Math.cos(lineAngle + arrowAngle),
            y: position.y - arrowLength * Math.sin(lineAngle + arrowAngle)
        };

        // Draw the arrowhead using two lines
        canvas.MovementQueueDrawings[tokenID].moveTo(position.x, position.y);
        canvas.MovementQueueDrawings[tokenID].lineTo(arrowPoint1.x, arrowPoint1.y);

        canvas.MovementQueueDrawings[tokenID].moveTo(position.x, position.y);
        canvas.MovementQueueDrawings[tokenID].lineTo(arrowPoint2.x, arrowPoint2.y);
    }

    return canvas.environment.children[0].addChild(canvas.MovementQueueDrawings[tokenID]);
}

// Helper function to find the last valid segment with non-zero displacement
function getLastValidSegment(segments) {
    for (let i = segments.length - 1; i >= 0; i--) {
        const dx = segments[i].B.x - segments[i].A.x;
        const dy = segments[i].B.y - segments[i].A.y;
        // Check if displacement is non-zero
        if (dx !== 0 || dy !== 0) {
            return segments[i];
        }
    }
    // If all segments have zero displacement, return null or handle accordingly
    return null;
}

async function drawAllTokenPaths() {
    await clearAllTokenPathDrawings();

    const allSceneTokens = canvas.scene.tokens;

    for (const token of allSceneTokens) {
        await drawTokenPath(token.object);
    }
}

async function clearTokenPathDrawing(token) {
    const tokenID = token.id
    if (!canvas.MovementQueueDrawings[tokenID]) {
        return;
    }

    if (canvas.MovementQueueDrawings[tokenID].destroyed) {
        return;
    }

    canvas.MovementQueueDrawings[tokenID].destroy();
    delete canvas.MovementQueueDrawings[tokenID];
}

async function clearAllTokenPathDrawings() {
    if (!canvas.MovementQueueDrawings) {
        return;
    }
    for (const [tokenID, drawing] of Object.entries(canvas.MovementQueueDrawings)) {
        canvas.MovementQueueDrawings[tokenID].destroy();
        delete canvas.MovementQueueDrawings[tokenID];
    }
}
