
// modules
import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

// styling
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';

const canvasSize = 700;
const origin = 30;
const boardSize = 19;

const game = require('./functions/boardFunctions');

//***********************************

class App extends React.Component{
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this);
    this.redrawCanvas = this.redrawCanvas.bind(this);
    this.state = game.getInitialState();
  }
  
  componentDidMount () {
    console.log("mounted");
    //this.setState({dummy: this.state.pieceFunction(3,4)});
    const ctx = this.refs.canvas.getContext('2d');
    let board = JSON.parse(JSON.stringify(this.state.board));
    this.redrawCanvas (board);
  }
  
  /////////////////////***********************//////////////////////////
  
  
  // this redraws the board array onto the visual board whenever a change has occured.
  redrawCanvas () {
    
    // copy the board
    let board = JSON.parse(JSON.stringify(this.state.board));
    
    // get the canvas context and the laySquare function
    const ctx = this.refs.canvas.getContext('2d');
    // clear the current canvas and redraw according to this.state.board
    ctx.clearRect(0, 0, this.state.canvasWidth, this.state.canvasHeight);
    
    // draw the grid
    game.drawBoard(ctx);
    
    board.map((row) => {
      //draw the shadows of the played stones
      // row.map((point) => {
      //   if (point.occupied == true) {
      //     drawCircle(point.x+1.5, point.y+1.5, 'grey', ctx);
      //   }
      // });
      // then draw the stones themselves
      row.map((point) => {
        if (point.occupied === true) {
          game.drawCircle(point.x, point.y, point.color, ctx);
        }
      });

    });
  }
  
  switchColor () {
    let color;
    this.state.color == "black" ? color = "white" : color = "black";
    this.setState({
      color: color
    });
  }
  
  handleClick (event) {
    let leftPad = $("canvas").offset().left;
    let topPad = $("canvas").offset().top;
    let xPos = event.clientX-leftPad;
    let yPos = event.clientY-topPad + $(window).scrollTop();
    let coords = game.convertCoords(xPos,yPos);
  
    // get the indices of the point object to change in currentBoard array
    let rawCanvasCoords = game.getRawCanvasCoords(boardSize, canvasSize, origin);
    let boardX = rawCanvasCoords.indexOf(coords.X);
    let boardY = rawCanvasCoords.indexOf(coords.Y);
    console.log(boardX, boardY)
    
    //copy the current board
    let board = JSON.parse(JSON.stringify(this.state.board)); 
    
    // play move if move is legal
    let thisMove = board[boardX][boardY];
    thisMove.color = this.state.color;
    
    
    if (game.isMoveLegal(thisMove, board)) {    
      this.playMove(thisMove);
    }
    

  }
  
  //  After the move has been determined to be legal, this function plays the move on the this.state.board array (All the visualization is handled by redrawCanvas). Then, it :  
// checks for resulting captures, 
// switches the current color, 
// and records move in the game log. 
  playMove (thisMove) { 
    
    this.logMove(thisMove);
    this.logBoard();
    this.switchColor();  
 
  }
  
  // this logs the board to this.state.board and this.state.boardHistory
  logBoard (board) {
    // console.log('logging board ... ')
    let newBoardHistory = JSON.parse(JSON.stringify(this.state.boardHistory));
    newBoardHistory.push(board);
    
    this.setState({
      boardHistory: newBoardHistory,
      moveDisplayed: newBoardHistory.length-1   
    });
    // console.log('board logged', this.state.moveDisplayed);
  }
  
  // this logs a single move onto this.state.board, removing any captures
  logMove (thisMove) {
    
    let col = thisMove.column;
    let row = thisMove.row;
  
    //copy the current board
    let newBoard = JSON.parse(JSON.stringify(this.state.board)); 
    
    newBoard[col][row].occupied = true;
    newBoard[col][row].color = this.state.color;
    //board[col][row].img = color == "white" ? whiteStone : blackStone;
    console.log(newBoard[col][row])
       
    this.setState({
      board: game.removeCaptures(thisMove, newBoard)
    }, () => {
      this.redrawCanvas ();
    });
    
    
    
    
  }
  
  
  
  ////////////////////////////
  
  render() {
  //console.log("rendering");
    
    const self = this;
    
    let col, row;
    return (
      <div>
        <canvas onClick={this.handleClick} ref="canvas" width={this.state.canvasWidth} height={this.state.canvasHeight}/>
      </div>
    )
  }
  
}

export default App;
