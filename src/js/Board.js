/**
 * Created by ben on 8/21/15.
 */
var board = (function () {
    'use strict';

    var module = {
        placedWalls: []
    };

    //Returns surrounding wall indexes regardless of position on board
    function getUnboundedAdjacentWalls(pos) {
        var wall,
            walls = [];

        //Bottom right wall vertex
        wall = (pos % module.boardDimension) * 2 +
            Math.floor(pos / module.boardDimension) * (module.boardDimension - 1) * 2;
        walls.push(wall, (wall + 1));

        //Bottom left
        wall -= 2;
        walls.push(wall, (wall + 1));

        //Top left
        wall -= (module.boardDimension - 1) * 2;
        walls.push(wall, (wall + 1));

        //Top right
        wall += 2;
        walls.push(wall, (wall + 1));

        return walls;
    }

    //0:North 1:East 2:South 3:West 4:Identity
    function getUnboundedMoveSet(pos) {
        return [
            (pos - module.boardDimension),
            (pos + 1),
            (pos + module.boardDimension),
            (pos - 1),
            pos
        ];
    }

    //Returns moveset with respect to board position, ignores walls
    function getMoveSet(pos) {
        var i,
            unboundedMoveset = getUnboundedMoveSet(pos),
            moveset          = unboundedMoveset.slice(),
            edges            = getAdjacentBoardEdges(pos);

        for (i = 0; i < edges.length; i++) {
            moveset.splice(moveset.indexOf(unboundedMoveset[edges[i]]), 1);
        }

        return moveset;
    }

    //Returned values:
    //0 is Horizontal Top
    //1 is Vertical Right
    //2 is Horizontal Bottom
    //3 is Vertical Left
    //-1 is Non-adjacent
    function getRelativeWallOrientation(posIndex, wallIndex) {
        var unboundedWalls = getUnboundedAdjacentWalls(posIndex),
            i;
        for (i = 0; i < unboundedWalls.length; i++) {
            if (unboundedWalls[i] === wallIndex) {
                switch (i) {
                    case 4:
                    case 6:
                        return 0;
                    case 1:
                    case 7:
                        return 1;
                    case 0:
                    case 2:
                        return 2;
                    case 3:
                    case 5:
                        return 3;
                }
            }
        }
        return -1;
    }

    //Returned values:
    //0 is North
    //1 is East
    //2 is South
    //3 is West
    //4 is Identical
    //-1 is non-cardinal or non-adjacent
    function getRelativeDirection(pos1, pos2) {
        var i,
            moves = getUnboundedMoveSet(pos1);
        for (i = 0; i < moves.length; i++) {
            if (moves[i] === pos2) {
                return i;
            }
        }
        return -1;
    }

    //Direction indexes
    //0:North 1:East 2:South 3:West
    function getMovePosition(pos, dir) {
        var moves = [
                (pos - module.boardDimension),
                (pos + 1),
                (pos + module.boardDimension),
                (pos - 1)
            ];
        if (moveIsOnBoard(pos, moves[dir])) {
            return moves[dir];
        }
        else {
            return -1;
        }
    }

    function getAdjacentWalls(posIndex, includePotentialWalls) {
        var i,
            //0,1:Southeast 2,3:Southwest 4,5:Northwest 6,7:Northeast Wall Vertices
            unboundedWalls = getUnboundedAdjacentWalls(posIndex),
            walls          = unboundedWalls.slice(),
            edges          = getAdjacentBoardEdges(posIndex),
            invalidWalls   = [];

        function removeWalls(wallIndexes) {
            var spliceIndex, k;

            for (k = 0; k < wallIndexes.length; k++) {
                spliceIndex = walls.indexOf(unboundedWalls[wallIndexes[k]]);
                if (spliceIndex !== -1) {
                    walls.splice(spliceIndex, 2);
                }
            }
        }

        //Remove invalid edge walls
        for (i = 0; i < edges.length; i++) {
            switch (edges[i]) {
                //Top edge
                case 0:
                    removeWalls([4,6]);
                    break;
                //Right edge
                case 1:
                    removeWalls([6,0]);
                    break;
                //Bottom edge
                case 2:
                    removeWalls([0,2]);
                    break;
                //Left edge
                case 3:
                    removeWalls([2,4]);
                    break;
            }
        }

        if (includePotentialWalls === true) {
            //Regardless of currently placed walls, solely based on position
            return walls;
        }
        else {
            for (i = 0; i < walls.length; i++) {
                if (module.placedWalls.indexOf(walls[i]) === -1) {
                    invalidWalls.push(walls[i]);
                }
            }
            for (i = 0; i < invalidWalls.length; i++) {
                walls.splice(walls.indexOf(invalidWalls[i]), 1);
            }
            return walls;
        }
    }
    
    //Returned values:
    //0:Top 1:Right 2:Bottom 3:Left
    function getAdjacentBoardEdges(pos) {
        var i,
            edges = [];

        //Check if moves are on board
        for (i = 0; i < 4; i++) {
            if (getMovePosition(pos, i) === -1) {
                edges.push(i);
            }
        }

        return edges;
    }

    function moveIsOnBoard(pos1, pos2) {
        var direction = getRelativeDirection(pos1, pos2);

        switch (direction) {
            //North is valid if not on top edge
            case 0:
                return (Math.floor(pos1 / module.boardDimension) > 0);
            //East is valid if not on right edge
            case 1:
                return ((pos1 % module.boardDimension) < 8);
            //South
            case 2:
                return (Math.floor(pos1 / module.boardDimension) < 8);
            //West
            case 3:
                return ((pos1 % module.boardDimension) > 0);
            default:
                return false;
        }
    }

    function wallIntersects(wallIndex) {
        var i,
            conflictWalls;

        if ((wallIndex % 2) === 0) {
            conflictWalls = [
                wallIndex,
                wallIndex + 1,
                wallIndex + 2,
                wallIndex - 2
            ];
            if (wallIndex % ((module.boardDimension - 1) * 2) === (((module.boardDimension - 1) * 2) - 2)) {
                conflictWalls.splice(2,1);
            }
            if (wallIndex % ((module.boardDimension - 1) * 2) === 0) {
                conflictWalls.splice(3,1);
            }
        }
        else {
            conflictWalls = [
                wallIndex,
                wallIndex - 1,
                wallIndex - (module.boardDimension - 1) * 2,
                wallIndex + (module.boardDimension - 1) * 2
            ];
        }

        for (i = 0; i < conflictWalls.length; i++) {
            if (module.placedWalls.indexOf(conflictWalls[i]) > -1) {
                return true;
            }
        }
        return false;
    }

    function wallIsValid(wallIndex) {
        return wallIndex > -1 &&
               !wallIntersects(wallIndex) &&
               tokensHavePaths(wallIndex);
    }

    function moveIsValid(movePosition) {
        if (typeof module.validMoves !== 'undefined') {
            return (module.validMoves.indexOf(movePosition) !== -1);
        }
        else {
            return false;
        }
    }

    function tokensHavePaths(wallIndex) {
        var i,
            tokens = players.getTokens();

        for (i = 0; i < tokens.length; i++) {
            if (!tokenHasPathToEnd(tokens[i], wallIndex)) {
                return false;
            }
        }

        return true;
    }

    function tokenHasPathToEnd(token, includeWall) {
        var i, node, moves,
            winRange          = token.getWinRange(),
            positionQueue     = [token.getPosition()],
            examinedPositions = new Array(Math.pow(module.boardDimension, 2) - 1)
                                .join('0').split('').map(parseFloat);
        if (includeWall > -1) {
            module.placedWalls.push(includeWall);
        }

        do {
            node  = positionQueue.shift();
            if (node >= winRange[0] && node <= winRange[1]) {
                module.placedWalls.splice(module.placedWalls.length - 1, 1);
                return true;
            }
            moves = findValidMovePositions(node, false);
            for (i = 0; i < moves.length; i++) {
                if (examinedPositions[moves[i]] !== 1) {
                    examinedPositions[moves[i]] = 1;
                    positionQueue = positionQueue.concat(findValidMovePositions(moves[i]));
                }
            }
        } while (positionQueue.length > 0);
        module.placedWalls.splice(module.placedWalls.length - 1, 1);
        return false;
    }

    function findValidMovePositions(posIndex, ignoreJump) {
        var moves = getMoveSet(posIndex),
            walls = getAdjacentWalls(posIndex, false),
            i, j, k, jumpSpace,
            opponentDirection, opponentMoves, wallOrientation;

        for (i = 0; i < walls.length; i++) {
            //If an obstructive wall has been placed
            if (module.placedWalls.indexOf(walls[i]) > -1) {
                //Get blocking direction of wall
                wallOrientation = getRelativeWallOrientation(posIndex, walls[i]);
                //And remove that direction from moveset
                moves.splice(moves.indexOf(getMovePosition(posIndex, wallOrientation)), 1);
            }
        }

        //Check for adjacent player, add valid jump moves
        if (ignoreJump === false) {
            for (i = 0; i < moves.length; i++) {
                //If there is an adjacent player
                if (typeof players.getTokenAtPosition(moves[i]) !== 'undefined' && moves[i] !== posIndex) {
                    //Get opponent direction and walls around its position
                    opponentDirection = getRelativeDirection(posIndex, moves[i]);
                    walls             = getAdjacentWalls(moves[i], false);
                    for (j = 0; j < walls.length; j++) {
                        wallOrientation = getRelativeWallOrientation(moves[i], walls[j]);
                        //If wall obstructs jump, add opponent's moveset to current player's
                        if (opponentDirection === wallOrientation) {
                            opponentMoves = findValidMovePositions(moves[i], true);
                        }
                    }
                    //If jump is clear, add jump to moveset
                    //remove opponent's position
                    //If jump is off the board (which is an unclear case in the rules!) add opponents moves
                    if (typeof opponentMoves === 'undefined') {
                        jumpSpace = getMovePosition(moves[i], opponentDirection);
                        if (jumpSpace > -1) {
                            moves.splice(i, 1, jumpSpace);
                        }
                        else {
                            opponentMoves = findValidMovePositions(moves[i], true);
                        }
                    }
                    if (typeof opponentMoves !== 'undefined') {
                        for (k = 0; k < opponentMoves.length; k++) {
                            if (moves.indexOf(opponentMoves[k]) === -1) {
                                moves.push(opponentMoves[k]);
                            }
                        }
                        moves.splice(i, 1);
                    }
                }
            }
        }
        return moves;
    }

    function coordinatesToWallIndex(coor) {
        var boardUnit  = module.borderWidth + module.cellWidth,
            index      = 0,
            //X coordinate is inside of a cell border
            boundTest1 = (coor[0] % boardUnit) <= module.borderWidth,
            //Y coordinate is inside of a cell border
            boundTest2 = (coor[1] % boardUnit) <= module.borderWidth,
            //X and Y coordinates are greater than the top and left border widths
            boundTest3 = coor[0] > module.borderWidth && coor[1] > module.borderWidth,
            //X and Y coordinates are less than the bottom and right border dimensions
            boundTest4 = Math.floor(coor[0] / boardUnit) < module.boardDimension &&
                Math.floor(coor[1] / boardUnit) < module.boardDimension;

        if ((boundTest1 !== boundTest2) && boundTest3 && boundTest4) {
            //Vertical wall y coordinate component
            if (Math.floor(coor[1] / boardUnit) > 0 && coor[1] % boardUnit > module.borderWidth) {
                index += 2 * Math.floor(coor[1] / boardUnit) * (module.boardDimension - 1);
            }
            //Horizontal wall y coordinate component
            else if (Math.floor(coor[1] / boardUnit) > 0 ) {
                index += 2 * (Math.floor(coor[1] / boardUnit) - 1) * (module.boardDimension - 1);
            }
            if (Math.floor(coor[0] / boardUnit) < module.boardDimension) {
                //Horizontal wall x coordinate component
                if (coor[0] % boardUnit > module.borderWidth) {
                    index += 2 * Math.floor(coor[0] / boardUnit);
                }
                //Vertical wall x coordinate component
                else {
                    index += 2 * Math.floor(coor[0] / boardUnit) - 1;
                }
            }
            //If X or Y coordinates are in the last board unit
            //use the index of the previous wall
            if (Math.floor(coor[0] / boardUnit) === (module.boardDimension - 1) &&
                coor[0] % boardUnit > module.borderWidth) {
                index -= 2;
            }
            else if (Math.floor(coor[1] / boardUnit) === (module.boardDimension - 1) &&
                coor[1] % boardUnit > module.borderWidth) {
                index -= (module.boardDimension - 1) * 2;
            }
        }
        else {
            //If pointer is at wall vertex, use currently previewed index
            if (boundTest1 && boundTest2 && module.wallPreview > -1) {
                return module.wallPreview;
            }
            else {
                return -1;
            }
        }
        return index;
    }

    function indexToWallCoordinates(idx) {
        var x, y,
            boardUnit = module.borderWidth + module.cellWidth;
        if (idx % 2 === 0) {
            x = module.borderWidth + ((idx % ((module.boardDimension - 1) * 2)) / 2) * boardUnit;
            y = ( 1 + Math.floor(idx / ((module.boardDimension - 1) * 2))) * boardUnit;
        }
        else {
            x = ((((idx % ((module.boardDimension - 1) * 2)) - 1) / 2) + 1) * boardUnit;
            y = module.borderWidth + Math.floor(idx / ((module.boardDimension - 1) * 2)) * boardUnit;
        }
        return [x,y];
    }

    function positionToRectCellCoordinates(pos) {
        var pos1 = pos % module.boardDimension ,
            pos2 = Math.floor(pos / module.boardDimension),
            x    = pos1 * module.cellWidth + (pos1 + 1) * module.borderWidth,
            y    = pos2 * module.cellWidth + (pos2 + 1) * module.borderWidth;
        return [x,y];
    }

    function getValidMoveCoordinates() {
        var moves = [],
            i;
        if (typeof module.validMoves === 'undefined') {
            return undefined;
        }
        for (i = 0; i < module.validMoves.length; i++) {
            moves.push(positionToRectCellCoordinates(module.validMoves[i]));
        }
        return moves;
    }

    function drawHud() {
        var x, y, i,
            player1Walls = players.getPlayer1().getWallCount(),
            player2Walls = players.getPlayer2().getWallCount();

        module.hudContext.fillStyle = 'black';
        module.hudContext.fillRect(0, 0, module.boardSize / 3, module.boardSize);

        for (i = 0; i < player2Walls; i++) {
            x = module.borderWidth + (i % 5) * 2 * module.borderWidth;
            y = module.cellWidth * 2.5 * (0.3 + Math.floor(i / 5));
            drawWall([x,y], module.hudContext, players.getPlayer2().getColor(), true);
        }

        for (i = 0; i < player1Walls; i++) {
            x = module.borderWidth + (i % 5) * 2 * module.borderWidth;
            y = module.cellWidth * 5 + module.cellWidth * 2.5 * (0.3 + Math.floor(i / 5));
            drawWall([x,y], module.hudContext, players.getPlayer1().getColor(), true);
        }
    }

    function drawWall(coor, ctx, fill, vertical) {
        ctx.fillStyle = fill;
        if (vertical === true) {
            ctx.fillRect(coor[0], coor[1], module.borderWidth, module.cellWidth * 2 + module.borderWidth);
        }
        else {
            ctx.fillRect(coor[0], coor[1], module.cellWidth * 2 + module.borderWidth, module.borderWidth);
        }
    }

    function drawBoard() {
        var i, j, k, x, y, coor, tokens, validMoveCoordinates;

        function drawCell(coor, fill) {
            module.boardContext.fillStyle = fill;
            module.boardContext.fillRect(coor[0], coor[1], module.cellWidth, module.cellWidth);
        }

        module.boardContext.fillStyle = 'black';
        module.boardContext.fillRect(0, 0, module.boardSize, module.boardSize);
        for (i = 0; i < module.boardDimension; i++) {
            for (j = 0; j < module.boardDimension; j++) {
                //Cell Coordinates
                x = module.borderWidth * (j + 1) + module.cellWidth * j;
                y = module.borderWidth * (i + 1) + module.cellWidth * i;
                validMoveCoordinates = getValidMoveCoordinates();
                //Draw highlighted cells
                if (typeof validMoveCoordinates !== 'undefined') {
                    for (k = 0; k < validMoveCoordinates.length; k++) {
                        if (validMoveCoordinates[k][0] === x && validMoveCoordinates[k][1] === y) {
                            drawCell([x,y], '#D8D8D8');
                            k = validMoveCoordinates.length + 1;
                        }
                    }
                    if (k === validMoveCoordinates.length) {
                        drawCell([x,y], 'grey');
                    }
                }
                else {
                    drawCell([x,y], 'grey');
                }
            }
        }

        if (typeof module.wallPreview !== 'undefined' && module.wallPreview > -1) {
            coor = indexToWallCoordinates(module.wallPreview);
            if (module.wallPreview % 2 === 0) {
                drawWall(coor, module.boardContext, players.getCurrentPlayer().getColor(), false);
            }
            else {
                drawWall(coor, module.boardContext, players.getCurrentPlayer().getColor(), true);
            }
        }

        if (module.placedWalls.length > 0) {
            for (i = 0; i < module.placedWalls.length; i++) {
                coor = indexToWallCoordinates(module.placedWalls[i]);
                if (module.placedWalls[i] % 2 === 0) {
                    drawWall(coor, module.boardContext, 'white', false);
                }
                else {
                    drawWall(coor, module.boardContext, 'white', true);
                }
            }
        }

        tokens = players.getTokens();
        if (typeof tokens !== 'undefined') {
            tokens[0].drawToken(module.boardContext);
            tokens[1].drawToken(module.boardContext);
        }
    }

    function updateDisplay() {
        drawBoard();
        drawHud();
    }

    //Public methods
    return {
        init: function init(cw, dim) {
            module.cellWidth              = cw;
            module.boardDimension         = dim;
            module.borderWidth            = cw / 5;
            module.topStartPos            = Math.floor(module.boardDimension / 2);
            module.botStartPos            = Math.floor(module.boardDimension / 2) +
                                        module.boardDimension * (module.boardDimension - 1);
            module.boardSize              = module.cellWidth * module.boardDimension +
                                        module.borderWidth * (module.boardDimension + 1);
            //HUD Canvas (Wall count)
            module.hudCanvas              = document.createElement('canvas');
            module.hudCanvas.id           = 'hud';
            module.hudCanvas.height       = module.boardSize;
            module.hudCanvas.width        = module.boardSize / 3;
            module.hudContext             = module.hudCanvas.getContext('2d');
            module.hudContext.fillStyle   = 'black';
            module.hudContext.fillRect(0, 0, module.boardSize / 3, module.boardSize);
            document.body.appendChild(module.hudCanvas);

            //Board Canvas
            module.boardCanvas            = document.createElement('canvas');
            module.boardCanvas.id         = 'board';
            module.boardCanvas.height     = module.boardSize;
            module.boardCanvas.width      = module.boardSize;
            module.boardContext           = module.boardCanvas.getContext('2d');
            module.boardContext.fillStyle = 'black';
            module.boardContext.fillRect(0, 0, module.boardSize, module.boardSize);
            document.body.appendChild(module.boardCanvas);

        },
        drawBoard: drawBoard,
        updateDisplay: updateDisplay,
        getCanvas: function getCanvas() {
            return module.boardCanvas;
        },
        getContext: function getContext() {
            return module.boardContext;
        },
        getDimension: function getDimension() {
            return module.boardDimension;
        },
        getCellWidth: function getCellWidth() {
            return module.cellWidth;
        },
        getBorderWidth: function getBorderWidth() {
            return module.borderWidth;
        },
        getBotPos: function getBotPos() {
            return module.botStartPos;
        },
        getTopPos: function getTopPos() {
            return module.topStartPos;
        },
        //Pixel coordinates on canvas return board position
        coordinatesToCellPosition: function coordinatesToCellPosition(coor) {
            var boardUnit = module.borderWidth + module.cellWidth,
                position  = Math.floor(coor[0] / boardUnit) + Math.floor(coor[1] / boardUnit) * module.boardDimension,
                boundTest,
                i;

            for (i = 0; i < 2; i++) {
                boundTest = coor[i] % boardUnit;
                if (boundTest <= module.borderWidth) {
                    return undefined;
                }
            }
            return position;

        },
        coordinatesToWallIndex: coordinatesToWallIndex,
        //Returns center coordinates of cell
        positionToCellCoordinates: function positionToCellCoordinates(pos) {
            var pos1 = pos % module.boardDimension,
                pos2 = Math.floor(pos / module.boardDimension),
                x = (pos1 + 0.5) * module.cellWidth + (pos1 + 1) * module.borderWidth,
                y = (pos2 + 0.5) * module.cellWidth + (pos2 + 1) * module.borderWidth;
            return [x,y];
        },
        //Returns top left coordinates of cell
        positionToRectCellCoordinates: positionToRectCellCoordinates,
        setValidMovePositions: function setValidMovePositions(mvs) {
            if (typeof mvs !== 'undefined') {
                module.validMoves = mvs.slice();
            }
            else {
                module.validMoves = undefined;
            }
        },
        getValidMovePositions: function getValidMovePositions() {
            return module.validMoves;
        },
        getValidMoveCoordinates: getValidMoveCoordinates,
        setWallPreview: function setWallPreview(coor) {
            if (coor.constructor === Array) {
                module.wallPreview = coordinatesToWallIndex(coor);
            }
            else {
                module.wallPreview = undefined;
            }
        },
        getWallPreview: function getWallPreview() {
            if (module.wallPreview > -1) {
                return module.wallPreview;
            }
            else {
                return undefined;
            }
        },
        placeWall: function placeWall(wall) {
            if (wall > -1) {
                module.placedWalls.push(wall);
            }
        },
        getAdjacentWalls: getAdjacentWalls,
        findValidMovePositions: findValidMovePositions,
        moveIsOnBoard: moveIsOnBoard,
        wallIsValid: wallIsValid,
        moveIsValid: moveIsValid
    };

})();