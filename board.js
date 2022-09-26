// functions for front-end of the game

// make the front end of board
function makeQuadrants() {
    var count = 1;
    for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
            var x = sidePadding + j * boardSize / 2;
            var y = topPadding + i * boardSize / 2;
            var quad = $(`<g class='quad' style="cx:${x}; cy:${y}" id="0${count}" transform='translate(${x}, ${y}) rotate(0)'></g>`);
            quad.append($(`<rect class='quad'></rect>`));
            for (var a = 0; a < 3; a++) {
                for (var b = 0; b < 3; b++) {
                    var id = i * 18 + j * 3 + a * 6 + b;
                    var location = `cx=${circlePadding / 2 + (circleRadius + circlePadding * 2) * (b + 0.5)  * 2} cy=${circlePadding / 2 + (circleRadius + circlePadding * 2) * (a + 0.5)* 2} x=${circlePadding / 2 + (circleRadius + circlePadding * 2) * (b + 0.5)  * 2} y=${circlePadding / 2 + (circleRadius + circlePadding * 2) * (a + 0.5)* 2}`;
                    var circle = $(`<a href="#" class="move" onclick="switchTurn(this.firstChild)"><circle id=${id} class="empty" r=${circleRadius} ${location} ></circle></a>`);
                    quad.append(circle);
                }
            }
            $(".board").append(quad);
            count++;
        }
    }
}

//-----------------------------------------Action on board--------------------------------------

/**
 * Pick a position.
 * 
 * @param {*} e the circle element on the board front end
 */
function switchTurn(e) {
    moves.push(e.id);
    if (e.classList.contains("empty")) {
        $(".empty").css("pointer-events", "none");
        e.classList.remove("empty");
        e.classList.add(turn);
        
        if (turn === "black") {
            turn = "white";
        } else {
            turn = "black";
        }
        document.documentElement.style.setProperty("--turn", turn);
        updateBoard();
        if (!gameEnd)
            $(".rotate-options").css("display", "block");
    }
}

/**
 * Perform a rotation from player.
 * 
 * @param {*} rotation 
 */
function rotateP(rotation) {
    rotate(rotation);
    
    if (!manual & !gameEnd) {
        window.setTimeout(function () {
            bot.move(board);
        }, 510);
    }
    
}

/**
 * Make a rotation.
 * 
 * @param {*} rotation coded from 1-8 
 */
function rotate(rotation) {
    var id = "0" + Math.ceil(rotation / 2);
    moves[moves.length - 1] += " " + rotation;
    var e = $("#"+id);
    var children = $("#"+id + " circle").toArray().sort(function (a, b) { return a.id - b.id;});
    $(e).attr("transform", $(e).attr("transform") + ` rotate(${Math.pow(-1, rotation % 2 + 1) * 90})`);
    $(".rotate-options").css("display", "none");
    reassignElements(id, children, Math.pow(-1, rotation % 2) * Math.PI/2);
}

//----------------------------------Helpers---------------------------------------------------
function reassignElements(id, children, angle) {
    var newIDs = [];
    var newLocations = [];
    for (var i = 0; i < 9; i++) {
        var quadrant = parseInt(id) - 1;
        var relativePosition = Math.round(calculateRoration(angle, i));
        relativePosition += Math.floor(relativePosition / 3) * 3;
        var newID = ((quadrant) % 2) * 3 + Math.floor(quadrant / 2) * 18 + relativePosition;
        newLocations[newID] = {x : $("#" + newID).attr("x"), y : $("#" + newID).attr("y")};
        newIDs.push(newID);
    }
    for (var i = 0; i < 9; i++) {
        children[i].id = newIDs[i];
        $(children[i]).attr("x", newLocations[newIDs[i]].x);
        $(children[i]).attr("y", newLocations[newIDs[i]].y);
    }
    
    updateBoard();
    if (!gameEnd)
        $(".empty").css("pointer-events", "");
    // filled board
    if (!gameEnd && board.filter(x => x === "empty").length === 0) {
        gameEnd = true;
        $("#status").text("TIE");
    }

}

function updateBoard() {
    $("circle").toArray().forEach(function (e) {
        board[e.id] = e.classList[0];
    });
    var winners = checkWin(board);
    processWinState(winners);
}

function processWinState(winners) {
    if (winners.length > 0) {
        var player = board[winners[0][0]];
        gameEnd = true;
        for (var i = 0; i < winners.length; i++) {
            if (player !== board[winners[i][0]])
                player = "tie";
            var color = board[winners[i][0]];
            var start = $("#" + winners[i][0]);
            var end = $("#" + (winners[i][0] + winners[i][1] * 4));

            var x1 = parseInt(start.attr("x"))  + parseInt(start.parents()[1].style["cx"]);
            var y1 = parseInt(start.attr("y"))  + parseInt(start.parents()[1].style["cy"]);
            var x2 = parseInt(end.attr("x")) + parseInt(end.parents()[1].style["cx"]);
            var y2 = parseInt(end.attr("y")) + parseInt(end.parents()[1].style["cy"]);

            var line = `<line x1=${x1} y1=${y1} x2=${x2} y2=${y2} style="stroke:${color};stroke-width:12"/>`;
            $(".board").append(line);
            // wait for animation to declare win
        }
        window.setTimeout(function () {
            $("svg").html($("svg").html());
        }, 510);
        $("#status").text(player.toUpperCase());
        if (player !== "tie")
            $("#status").append(" wins");
    }
}

function reset() {
    turn = (Math.random() >= 0.5) ? "white" : "black";
    document.documentElement.style.setProperty("--turn", turn);
    $(".quad").remove();
    $("line").remove();
    $("#status").text("");
    board = new Array(36).fill("empty");
    moves = [];
    gameEnd = false;
    bot = new AI(AIDepth);
    makeQuadrants();
    $(".rotate-options").css("display", "none");
    $("svg").html($("svg").html());
    if (turn === "white" && !manual) {
        bot.move(board);
    }
}

function updateInfo() {
    AIDepth = parseInt($("#depth").val());
    mode = parseInt($("#mode").val());
    reset();
}


function getBoardString() {
    console.log(JSON.stringify(bot.tree));
}

//---------------------------Generalized functions usable to the back-end----------------------------

/**
 * calculate position of a block after rotation in a quadrant (3x3)
 * 
 * @param {*} angle in radians
 * @param {*} position in a 3x3 board
 */
function calculateRoration(angle, position) {
    var x = -1 + position % 3;
    var y = 1 - Math.floor(position / 3);
    var x1 = x * Math.cos(angle) - y * Math.sin(angle);
    var y1 = x * Math.sin(angle) + y * Math.cos(angle);
    var newPosition = x1 + 1 + (1 - y1) * 3;
    return newPosition;
}


function checkWin(board) {
    var winners = [];
    // checking everything position in board
    for (var i = 0; i < board.length; i++) {
        if (checkHorizontal(board, i) >= 5) {
            winners.push([i, 1]);
        }
        if (checkVertical(board, i) >= 5) {
            winners.push([i, 6]);
        }
        if (checkForwardDiagonal(board, i) >= 5) {
            winners.push([i, 7]);
        }
        if (checkBackwardDiagonal(board, i) >= 5) {   
            winners.push([i, 5]);
        }
    }
    return winners;
}

function checkHorizontal(board, index) {
    var current = board[index];
    var stack = [];
    if (current === "empty")
        return 0;
    for (var i = 0; i < 5; i++) {
        // horizontal should be in the same line
        if (Math.floor((index + i) / 6) > Math.floor(index / 6))
            break;
        stack.push(board[index + i]);
    }
    // if more than 1 player presents in 5 consecutive, not worth exploring
    if ([...new Set(stack)].filter(e => e !== "empty").length > 1) {
        return 1;
    } 
    return stack.filter(e => e === current).length;
}

function checkVertical(board, index) {
    var current = board[index];
    var stack = [];
    if (current === "empty")
        return 0;
    for (var i = 0; i < 5; i++) {
        if (index + i * 6 > board.length)
            break;
        stack.push(board[index + i * 6]);
    }
    // if more than 1 player presents in 5 consecutive, not worth exploring
    if ([...new Set(stack)].filter(e => e !== "empty").length > 1) {
        return 1;
    } 
    return stack.filter(e => e === current).length;
}

function checkForwardDiagonal(board, index) {
    var current = board[index];
    var stack = [];
    if (current === "empty")
        return 0;
    for (var i = 0; i < 5; i++) {
        if (index + i * 7 > board.length)
            break;
        
        // diagonal must be in consecutive lines
        if (i > 0 && Math.floor((index + i*7)/6) - Math.floor((index + (i-1)*7)/6) !== 1)
            break;

        stack.push(board[index + i * 7]);
    }
    // if more than 1 player presents in 5 consecutive, not worth exploring
    if ([...new Set(stack)].filter(e => e !== "empty").length > 1) {
        return 1;
    } 
    return stack.filter(e => e === current).length;
}

function checkBackwardDiagonal(board, index) {
    var current = board[index];
    var stack = [];
    if (current === "empty")
        return 0;
    for (var i = 0; i < 5; i++) {  
        if (index + i * 5 > board.length)
            break;

        // diagonal must be in consecutive lines
        if (i > 0 && Math.floor((index + i*5)/6) - Math.floor((index + (i-1)*5)/6) !== 1)
            break;

        stack.push(board[index + i * 5]);
    }
    // if more than 1 player presents in 5 consecutive, not worth exploring
    if ([...new Set(stack)].filter(e => e !== "empty").length > 1) {
        return 1;
    } 
    return stack.filter(e => e === current).length;
}

 /**
 * Get next state of board.
 * 
 * @param {*} board current board
 * @param {*} turn black/white
 * @param {*} position position of move (0-35)
 * @param {*} rotation angle at quadrant, coded 1-8
 */
function getBoardState(board, turn, position, rotation) {
    var angle = Math.pow(-1, rotation % 2) * Math.PI/2;
    var newBoard = copyOf(board);
    newBoard[position] = turn;

    // find quadrant of rotation
    var quad = Math.ceil(rotation / 2);
    // make a copy 
    var quadElement = [];
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            var p = i * 6 + j + ((quad - 1) % 2) * 3 + Math.floor((quad - 1) / 2) * 18; 
            quadElement.push(newBoard[p]);
        }
    }
    // rotate internally of quadrant
    var temp = copyOf(quadElement);
    for (var i = 0; i < quadElement.length; i++) {
        var newP = Math.round(calculateRoration(angle, i));
        quadElement[newP] = temp[i];
    }

    // reflect rotation to the main board
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            var p = i * 6 + j + ((quad - 1) % 2) * 3 + Math.floor((quad - 1) / 2) * 18; 
            newBoard[p] = quadElement[j + 3*i];
        }
    }

    return newBoard;
}

/**
 * Return a deep copy of an object.
 * 
 * @param {*} object
 */
function copyOf(object) {
    return JSON.parse(JSON.stringify(object));
}
