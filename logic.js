class AI {
    tree;
    depth;
    expanded;

    constructor(depth) {
        this.depth = depth;
        this.tree = {};
        this.tree["root"] = {};
    }

    /**
     * Return a move.
     * 
     * @param {*} board 
     */
    makeDecision(board) {
        this.expanded = 0;
        var move = "";
        // minimax 
        if (mode === 1) {
            var extreme = Number.POSITIVE_INFINITY * ((turn === "white") ? - 1 : 1);
            for (var i = 0; i < board.length; i++) {
                var emptyMark = false;
                if (board[i] === "empty") {
                    for (var j = 1; j <= 8; j++) {
                        this.expanded++;
                        var newBoard = getBoardState(board, turn, i, j);
                        var empties = this.getEmptyQuad(newBoard);

                        // skip empty quadrants
                        if (empties.includes(Math.ceil(j / 2))) {
                            if (!emptyMark) 
                                emptyMark = true;
                            else 
                                continue;
                        }
                        //                                                                      pass in next turn
                        var value = this.minimaxValue(this.traverseTree(), newBoard, i, j, (turn === "white") ? 1 : -1, 1);
                        //console.log(i + " " + j);
                        if (turn === "white") {
                            if (value > extreme) {
                                extreme = value;
                                move = i + " " + j;
                            }
                        } else {
                            if (value < extreme) {
                                extreme = value;
                                move = i + " " + j;
                            }
                        }
                    }
                }
            }
        } else { // alpha beta
            move = this.alphaBetavalue(this.traverseTree(), board, -1, 0, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
        }
        return move;
    }

    /**
     * Request a move then perform it on front-end.
     * 
     * @param {*} board 
     */
    move(board) {
        var move = this.makeDecision(board);
        var position = move.split(" ")[0];
        var rotation = move.split(" ")[1];
        console.log(move);
        $("#expanded").html(this.expanded);
        switchTurn($(`#${position}`)[0]);
        rotate(rotation);
    }
    
    /**
     * Return the min/max value of sub tree.
     * 
     * @param {*} parent array of parent's children
     * @param {*} board 
     * @param {*} position 
     * @param {*} rotation 
     * @param {*} m -1 for max, 1 for min
     */
    minimaxValue(parent, board, position, rotation, m, depth) {
        // step 1: record new state
        var turn = (m === -1) ? "white" : "black"; // the bot turn is white, player is black

        // record child to the tree
        var move = position + " " + rotation;
        
        if (!parent[move])
            parent[move] = {};

        // step 2: check terminal states (game over) 
        if (checkWin(board).length > 0 || board.filter(e => e === "empty").length === 0 || depth >= this.depth) {
            return this.calculateUtil(board);
        }

        // step 3: get min/max from children
        var value;
        var children = [];
        // for every possible move on board
        for (var i = 0; i < board.length; i++) {
            var emptyMark = false;
            if (board[i] === "empty") {
                // for every rotation
                for (var j = 1; j <= 8; j++) {
                    this.expanded++;
                    var newBoard = getBoardState(board, turn, i, j);
                    var empties = this.getEmptyQuad(newBoard);

                    // skip empty quadrants
                    if (empties.includes(Math.ceil(j / 2))) {
                        if (!emptyMark) 
                            emptyMark = true;
                        else 
                            continue;
                    }

                    // explore child
                    children.push(this.minimaxValue(parent[move] , newBoard, i, j, -m, depth + 1));
                }
            }
        }
        if (m === -1) {
            value = Math.max.apply(null, children);
        } else {
            value = Math.min.apply(null, children);
        }
        return value;
    }
    
    /**
     * Return an alpha beta value on sub trees (depth > 0). Return a move for depth 0.
     * 
     * @param {*} parent 
     * @param {*} board 
     * @param {*} m -1 for max, 1 for min
     * @param {*} depth  
     * @param {*} a alpha
     * @param {*} b beta
     */
    alphaBetavalue(parent, board, m, depth, a, b) {
        var turn = (m === -1) ? "white" : "black"; // the bot turn is white, player is black

        // step 1: check terminal states (game over) 
        if (checkWin(board).length > 0 || board.filter(e => e === "empty").length === 0 || depth >= this.depth) {
            return this.calculateUtil(board);
        }

        // step 2: explore children
        var value = Number.POSITIVE_INFINITY * m;
        var moveReturn = "";
        // for every possible move on board
        for (var i = 0; i < board.length; i++) {
            var emptyMark = false;
            if (board[i] === "empty") {
                // for every rotation
                for (var j = 1; j <= 8; j++) {
                    this.expanded++;
                    var newBoard = getBoardState(board, turn, i, j);
                    var empties = this.getEmptyQuad(newBoard);

                    // skip empty quadrants
                    if (empties.includes(Math.ceil(j / 2))) {
                        if (!emptyMark) 
                            emptyMark = true;
                        else 
                            continue;
                    }
                    // record child to the tree
                    var move = i + " " + j;
                    /*
                    if (depth === 0)
                        console.log(move);
                    */
                    if (!parent[move])
                        parent[move] = {};

                    // explore child
                    var old = value; // just to save move
                    if (m === -1) {
                        value = Math.max(this.alphaBetavalue(parent[move] , newBoard, -m, depth + 1, a, b), value);
                        if (value >= b) return value;
                        a = Math.max(a, value);
                        if (old < value)
                            moveReturn = move;
                    } else {
                        value = Math.min(this.alphaBetavalue(parent[move] , newBoard, -m, depth + 1, a, b), value);
                        if (value <= a) return value;
                        b = Math.min(b, value);
                        if (old > value)
                            moveReturn = move;
                    }
                }
            }
        }
        if (depth === 0)
            return moveReturn;
        return value;
    }

    /**
     * Get utility value of a given board.
     * 
     * @param {*} board current board 
     */
    calculateUtil(board) {
        var value = 0;
        // prioritize for quadrant center
        for (var i = 0; i < 2; i++) {
            for (var j = 0 ; j < 2; j++) {
                if (board[7 + i * 18 + j * 3] === "white")
                    value += 100;
                else if (board[7 + i * 18 + j * 3] === "black") {
                    value -= 100;
                }
            }
        }

        // prioritize consecutive blocks
        // rewards winning moves
        
        for (var i = 0; i < board.length; i++) {
            var turn = (board[i] === "white") ? 1 : -1;
            var bd = checkBackwardDiagonal(board, i);
            var fd = checkForwardDiagonal(board, i);
            var h = checkHorizontal(board, i);
            var v = checkVertical(board, i);
            
            value += Math.pow(bd === 5 ? 1000 : bd, 5) * turn;
            value += Math.pow(fd === 5 ? 1000 : fd, 5) * turn;
            value += Math.pow(h === 5 ? 1000 : h, 5) * turn;
            value += Math.pow(v === 5 ? 1000 : v, 5) * turn;
            
        }


        // check for available spaces
        value += this.checkWinsAvailable(board);

        return value;
    }

    // get to the current branch of board
    traverseTree() {
        var current = this.tree["root"];
        moves.forEach(element => {
            if (!current[element])
                current[element] = {};
            current = current[element];
        });
        return current;
    }

    getEmptyQuad(board) {
        var quads = [1, 2, 3, 4];
        for (var q = 1; q <= 4; q++) {
            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    var p = i * 6 + j + ((q - 1) % 2) * 3 + Math.floor((q - 1) / 2) * 18; 
                    if (board[p] !== "empty" && !(i === 1 && j === 1)) {
                        if (quads.indexOf(q) > -1)
                            quads.splice(quads.indexOf(q), 1);
                    }
                }
            }
        }
        return quads;
    }

    /**
     * Check for possible win on horizontal, vertical, diagonal lines.
     * (similar to tic-tac-toe heuristic).
     * 
     * @param {*} board 
     */
    checkWinsAvailable(board) {
        var sum = 0;
        var reward = 50;
        var p = [];
        // check horizontal
        for (var i = 0; i < 6; i++) {
            for (var j = 0; j < 2; j++) {
                // fill an array with players (empty, black, white)
                for (var a = 0; a < 5; a++) {
                    p.push(board[i * 6 + j + a]);
                }
                // remove duplicate and empty player
                p = [...new Set(p)].filter(e => e !== "empty");
                // if only one player present in array, give bonus for player.
                // two player present in array is a tie - no bonus.
                if (p.length === 1) {
                    sum += reward * (p[0] === "white" ? 1 : -1);
                }
                // reset array for next check
                p = [];
            }
        }
        // check vertical
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 6; j++) {
                for (var a = 0; a < 5; a++) {
                    p.push(board[i * 6 + i + a * 6]);
                }
                p = [...new Set(p)].filter(e => e !== "empty");
                if (p.length === 1) {
                    sum += reward * (p[0] === "white" ? 1 : -1);
                }
                p = [];
            }
        }

        // check forward diag
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                for (var a = 0; a < 5; a++) {
                    p.push(board[i * 6 + i + a * 7]);
                }
                p = [...new Set(p)].filter(e => e !== "empty");
                if (p.length === 1) {
                    sum += reward * (p[0] === "white" ? 1 : -1);
                }
                p = [];
            }
        }

        // check backward diag
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                for (var a = 0; a < 5; a++) {
                    p.push(board[4 + i * 6 + i + a * 5]);
                }
                p = [...new Set(p)].filter(e => e !== "empty");
                if (p.length === 1) {
                    sum += reward * (p[0] === "white" ? 1 : -1);
                }
                p = [];
            }
        }
        return sum;
    }
}