const MODULE_ID = "movement-queue";

Hooks.once("init", async function() {
    game.MovementQueue = {};

    game.MovementQueue.setSelectSegmentFlag = setSelectSegmentFlag;
    game.MovementQueue.unsetSelectSegmentFlag = unsetSelectSegmentFlag;
    game.MovementQueue.setTokenSegmentFlag = setTokenSegmentFlag;
    game.MovementQueue.unsetTokenSegmentFlag = unsetTokenSegmentFlag;
});

function setTokenSegmentFlag(token){
    token.document.setFlag(MODULE_ID, "segments", canvas.controls.ruler.segments);
}

function setSelectSegmentFlag(){
    
    let selectedTokens = canvas.tokens.controlled;
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
        ui.notifications.info(`Flag set for ${token.name}.`);
    });
}




canvas.tokens.controlled.forEach((token) => {
    console.log(token);
});