const canvasSize = 700;
const origin = 30;
const boardSize = 19;

// rawCanvasCoords will return the raw coordinates of 1,2,3 ... 19 on the canvas
const getRawCanvasCoords = (boardSize, canvasSize, origin) => {
  let rawCanvasCoords = [];
  const spacer = (canvasSize-origin*2)/(boardSize-1);
  for ( let i=0; i<boardSize; i++) {
    rawCanvasCoords.push(Math.floor(origin + i*spacer));
  }  
  return rawCanvasCoords;
}

var moveDisplayed;

var color = "black";

const stoneRadius = (((canvasSize-origin*2)/(boardSize-1))/2) - 0.5;

//**************************************
// object creation functions
function point (i, j) {
  let rawCanvasCoords = getRawCanvasCoords(boardSize, canvasSize, origin);
  this.row = j;
  this.column = i;
  this.x = rawCanvasCoords[i];
  this.y = rawCanvasCoords[j];
  this.occupied = false;
  this.color = null;
  this.img = null;
}

function makeGameArray (boardSize) {
  let gameArray = [];
  for (let i=0; i<boardSize; i++) {
    let thisRow = [];
    for (let j=0; j<boardSize; j++) {
      let thisPoint = new point(i,j);  
      thisRow.push(thisPoint);
    }
    gameArray.push(thisRow);
  }
  // let initialBoard = JSON.parse(JSON.stringify(gameArray));
  // boardHistory.push(initialBoard);
  return gameArray;
}
//**************************************

//**************************************
// Math to convert clicked point to closest coordinate pair
function convertCoords(x,y) {
  let rawCanvasCoords = getRawCanvasCoords(boardSize, canvasSize, origin);
  let convertedX = rawCanvasCoords[0];
  let convertedY = rawCanvasCoords[0];
  let xDiff = Math.abs(x-rawCanvasCoords[0]);
  let yDiff = Math.abs(y-rawCanvasCoords[0]);

  rawCanvasCoords.map(function(thisPoint) {
    let thisXDiff = Math.abs(x-thisPoint);
    let thisYDiff = Math.abs(y-thisPoint);
    if (thisXDiff < xDiff) {
      convertedX = thisPoint; 
      xDiff = thisXDiff;
    }
    if (thisYDiff < yDiff) {
      convertedY = thisPoint; 
      yDiff = thisYDiff;
    }
  });
  let coords = {};
  coords.X = convertedX;
  coords.Y = convertedY;
  return coords;
}

//**************************************

//**************************************
// functions for drawing the board itself
function drawLine(xPosition, yPosition, ctx) {
  
  // when using this function either the yPosition or xPosition will always be == origin
  ctx.beginPath();
  ctx.moveTo(xPosition, yPosition);
  ctx.lineWidth = .75;
  
  
  // draw Line left to right
  if (xPosition == origin) {
    ctx.lineTo(canvasSize-origin+1, yPosition);
  } 
  // draw Line top to bottom
  else if (yPosition == origin) {
    ctx.lineTo(xPosition, canvasSize-origin);
  }
  
  ctx.stroke();
}

// just draws the board itself
function drawBoard(ctx) {
  let spacer = (canvasSize-origin*2)/(boardSize-1);
  let rawCanvasCoords = getRawCanvasCoords(boardSize, canvasSize, origin);
  for (let i=0; i<(boardSize); i++) {
    let thisPoint = origin + spacer*i;
    drawLine(thisPoint, origin, ctx);
    drawLine(origin, thisPoint, ctx);
    rawCanvasCoords.push(Math.floor(thisPoint));
  }
  drawLine(30.05,30, ctx);
}

///places the moves / stones on the board

// to draw circles / stones on canvas
function drawCircle(centerX, centerY, color, ctx) {
  let stoneRadius = (((canvasSize-origin*2)/(boardSize-1))/2) - 0.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, stoneRadius, 0, 2 * Math.PI, false);
  // ctx.strokeStyle = color == "black" ? "black" : "grey";
  ctx.strokeStyle='black';
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();
}
//**************************************


//**************************************
// functions for move logic 

// to get the surrounding nodes of a point  ---  NODE
//                                                |
//                                          NODE--P--NODE
//                                                |
//                                               NODE
function getNodes(parent, board) {
  let col = parent.column;
  let row = parent.row;
  let adjacentPoints = [];
  
  if (!!board[col-1]) {
    adjacentPoints.push(board[col-1][row])
  }
  if (!!board[col+1]) {
    adjacentPoints.push(board[col+1][row])
  }
  if (!!board[col][row-1]) {
    adjacentPoints.push(board[col][row-1])
  }
  if (!!board[col][row+1]) {
    adjacentPoints.push(board[col][row+1])
  }
  return adjacentPoints;
}


// this checks a node at any position to see if it is captured or not. 
// returns true for captured and false for not captured
function checkNode (node, thisBoard, nodesChecked) {
  
  //assign nodes
  let nodes = getNodes(node, thisBoard)  

  // now filter out the nodes that are present in nodesChecked. this is necessary
  // to prevent infinite loops where nodes are connected, or share nodes
  let branches = nodes.filter( (node) => {
    let match = false;
    nodesChecked.forEach ( (checkedNode) => {
      let columnsMatch = checkedNode.column === node.column;
      let rowsMatch = checkedNode.row === node.row;
      if (columnsMatch && rowsMatch) {
        match = true;
      }
    });
    return !match;
  });
  
  console.log(`branches: `)
  console.log(branches)
  
  //add this node to nodesChecked for the next time the function runs
  nodesChecked.push(node);

  //first check if any branches are unoccupied
  for (let i=0; i<branches.length; i++) {
    if (branches[i].occupied == false) {
      return {
        captured: false,
        stones: [nodesChecked]
      };
    }
  }
  
  // then check each branch that is the same color, since these are connected to the initial node and share liberties. 
  for (let i=0; i<branches.length; i++) {
    if (branches[i].color == node.color) {
      //captured.push(checkNode(branches[i]));
      if (!checkNode(branches[i], thisBoard, nodesChecked).captured) {
        return {
          captured: false,
          stones: [nodesChecked]
        };
      }
    }
  }
  //if all tests passed, entire connected group is captured!!!
  return {
    captured: true,
    stones: [nodesChecked]
  };
}

// determines if a move islegal on the board, true for yes, false for no
function isMoveLegal (move, board) {
  
  let col = move.column;
  let row = move.row;
  let nodes = getNodes(move, board);
  
  // is the move unoccupied? 
  if (move.occupied) {
    //console.log("occupied? : " + move.occupied);
    return false;
  }
  
  // does the move have liberties? 
  let hasLiberties = false;
  for ( let i=0; i<nodes.length; i++ ) {
    if (!nodes[i].occupied) { 
      hasLiberties = true; 
      break;
    }
  }
  
  //if move has liberties nothing else matters.
  if ( !hasLiberties ) {
    //console.log("move has no liberties ... checking for capturing possibility");
  }
  else {
    return true;
  }
  
  // past this point a move the move is illegal if: 
  //    - it is a self capture, and 
  //    - it isn't capturing anything or surrounded by itself
  
  //**allow move to be played on this version of the board
  board[col][row].occupied = true;
  board[col][row].color = move.color;
  
  // is the move a selfCapture? 
  let testMove = board[col][row];
  let selfCapture = checkNode(testMove, board, []);
  
  // is the move capturing anything?
  let capturing = false;
  for ( let i=0; i<nodes.length; i++ ) {
    // if any node is a capturing node, break and set capturing to true
    if (checkNode(nodes[i], board,[])) {
      capturing = true;
      break;
    }
  }

  // is the move selfSurrounded?
  let selfSurrounded = true;
  for ( let i=0; i<nodes.length; i++ ) {
    if (nodes[i].color !== testMove.color) {
      selfSurrounded = false;
      break;
    }
  }
  
  // is the move an illegal ko?
  
  // if all tests pass, the move is legal
  return true;
}



//***********************************

//***********************************

//getEnemyNodes retrieves the opposing nodes of the move played, to use in checkForCapture. The function is different than getNodes since we are looking for enemy nodes and still checking all enemy nodes, even if we find an occupied node. 
function getEnemyNodes (point, thisBoard) {
  let col = point.column;
  let row = point.row;
  //console.log("origin:  " + point.column + ", " + point.row);
  let neighbors = getNodes(point, thisBoard);
  let enemyNodes = neighbors.filter(function(n) { 
    return (n.occupied && n.color !== point.color);
  });
  
  return enemyNodes;
}

// checks the board for captures to remove after the move has been played, before logging the move. 
// returns the board with any captures removed.
function removeCaptures (origin, thisBoard) {
  
  let newBoard = JSON.parse(JSON.stringify(thisBoard));
  
  console.log("checking for capture");
  let neighbors = getEnemyNodes(origin, newBoard); 
  
  if (neighbors.length < 1) {
    console.log("no opposing neighbors");
    return newBoard;
  }
  
  for ( let i=0; i<neighbors.length; i++) {
    console.log(`checking neighbor ${i} @ ${neighbors[i].column}, ${neighbors[i].row}`)
    
    // get the capturing info on this node - see checkNode function
    let isNodeCaptured = checkNode(neighbors[i], newBoard, []);
    
    if (isNodeCaptured.captured) { 
      console.log(`capture at neighbor ${i}: ${neighbors[i].column}, ${neighbors[i].row}`)
      
      // filter out self from nodesToRemove - was a bug before, fixed? check
      let nodesToRemove = isNodeCaptured.stones.filter( (node) => {
        return node.row !== origin.row || node.column !== origin.column
      })
      // remove the captured stones if there are any
      if (nodesToRemove.length > 0) {
        newBoard = clearStones(nodesToRemove, newBoard);
      }
    }  
  } 
  
  return newBoard;
} 


// functions for modifying and returning the board
function clearStones (nodes, thisBoard) {
  console.log(`clearing ${nodes.length} captured stones`);
  
  nodes.forEach( (point) => {
    
    console.log(point[0])
    let col = point[0].column;
    let row = point[0].row;
    
    thisBoard[col][row].occupied = false;
    thisBoard[col][row].color = null;
    thisBoard[col][row].img = null;
  });
  return thisBoard;
}

const getInitialState = () => {
  var initialStateObj = {
    canvasWidth: canvasSize,
    canvasHeight: canvasSize,
    gameWidth: boardSize,
    board: makeGameArray(boardSize),
    boardHistory: [],
    nodesChecked: [],
    color: 'black',
    moveDisplayed: 0,
  };
  
  return initialStateObj;
}

export {
  clearStones,
  removeCaptures,
  getEnemyNodes,
  isMoveLegal,
  checkNode,
  getNodes,
  drawBoard,
  drawLine,
  drawCircle,
  convertCoords,
  makeGameArray,
  point,
  getRawCanvasCoords,
  getInitialState
}