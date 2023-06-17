const MODULE_ID = "movement-queue";

Hooks.once("init", async function() {
    game.MovementQueue = {};

    game.MovementQueue.setSelectSegmentFlag = setSelectSegmentFlag;
    game.MovementQueue.unsetSelectSegmentFlag = unsetSelectSegmentFlag;
    game.MovementQueue.setTokenSegmentFlag = setTokenSegmentFlag;
    game.MovementQueue.unsetTokenSegmentFlag = unsetTokenSegmentFlag;

    game.MovementQueue.tokenTakeSegmentedPath = tokenTakeSegmentedPath;
    game.MovementQueue.selectTokensTakeSegmentedPath = selectTokensTakeSegmentedPath;
    game.MovementQueue.allTokensTakeSegmentedPath = allTokensTakeSegmentedPath;
});

function tokenTakeSegmentedPath(token){
    const segmentsData = token.document.getFlag(MODULE_ID, "segments");
    if(!segmentsData){
        return ui.notifications.info(`No flagged segment data!`);
    }

    const ruler = new Ruler();
    ruler.segments = [];
    for(const seg of segmentsData){
        const ray = new Ray(seg.A, seg.B);
        ruler.segments.push({ray});
    }

    ruler._animateMovement(token);
}

function selectTokensTakeSegmentedPath(){
    const selectedTokens = canvas.tokens.controlled;
    if (selectedTokens.length === 0) {
      return ui.notifications.error("No tokens selected.");
    }

    selectedTokens.forEach((token) => {
        tokenTakeSegmentedPath(token);
        unsetTokenSegmentFlag(token);
    });
}

function allTokensTakeSegmentedPath(){
    const allSceneTokens = canvas.scene.tokens;
    allSceneTokens.forEach((token) => {
        console.log(token)
        const segmentsData = token.object.document.getFlag(MODULE_ID, "segments");
        if(segmentsData){
            tokenTakeSegmentedPath(token.object);
            unsetTokenSegmentFlag(token.object);
        }
    });
}

function setTokenSegmentFlag(token){
    if(!canvas.controls?.ruler.segments){
        return ui.notifications.info(`No Ruler Segment Found!`);
    }

    // token.document.setFlag(MODULE_ID, "segments", canvas.controls.ruler.segments);
    console.log(canvas.controls.ruler.segments);

    const segments = [];
    for(const segment of canvas.controls.ruler.segments){
        console.log(segment)
        segments.push({A: segment.ray.A, B: segment.ray.B});
    }
    
    token.document.setFlag(MODULE_ID, "segments", segments);
    // token.document.setFlag(MODULE_ID, "segments", "SomeText");
}

function setSelectSegmentFlag(){
    
    const selectedTokens = canvas.tokens.controlled;
    if (selectedTokens.length === 0) {
      return ui.notifications.error("No tokens selected.");
    }

    if(!canvas.controls?.ruler.segments){
        return ui.notifications.info(`No Ruler Segment Found!`);
    }

    selectedTokens.forEach((token) => {
        setTokenSegmentFlag(token);
        ui.notifications.info(`Flag set for ${token.name}.`);
    });
    
}

function unsetTokenSegmentFlag(token){
    token.document.unsetFlag(MODULE_ID, "segments");
}

function unsetSelectSegmentFlag(){

    let selectedTokens = canvas.tokens.controlled;
    if (selectedTokens.length === 0) {
      return ui.notifications.error("No tokens selected.");
    }

    selectedTokens.forEach((token) => {
        unsetTokenSegmentFlag(token);
        ui.notifications.info(`Flag unset for ${token.name}.`);
    });
}




canvas.tokens.controlled.forEach((token) => {
    console.log(token);
});