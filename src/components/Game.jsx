import React, { Component } from "react";
import Chess from "chess.js";
import openSocket from "socket.io-client";

import Chessboard from "chessboardjsx";

class Game extends Component {

	constructor(state) {
		super(state);

		this.state = {
			dropSquareStyle: {}, // square styles for active drop square
			squareStyles: {}, // custom square styles
			pieceSquare: "", // square with the currently clicked piece
			history: [], // array of past game moves
			game: new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
			socket: null,
			message: "Connecting ...",
		};
	}

	// connect to the server (create this.state.socket)
	componentDidMount() {
		console.log("mounted!");
		let socket = openSocket(this.props.serverAddress);

		socket.on("board", board => {
			console.log("setting board to: " + board);
			this.setState({ game: new Chess(board) });
		});

		socket.on("colour", colour => {
			this.setState({ message: "Connected as " + colour, colour: colour });
		});

		socket.on("turn", player => {
			if (player === this.state.colour) {
				this.setState({ message: "You're tarded" });
			} else {
				this.setState({ message: player + " power" });
			}
		});

		socket.on("victory", player => {
			let message;
			if (player === this.state.colour) {
				message = "You win!";
			} else {
				message = "You lose!";
			}
			this.setState({ message: message });
		});

		this.setState({ socket: socket, onMove: move => socket.emit("move", move) });
	}

	isMyTurn() {
		if (this.state.game.turn() == 'w' && this.state.colour == "white") return true;
		if (this.state.game.turn() == 'b' && this.state.colour == "black") return true;
		return false;
	}

	onDrop = ({ sourceSquare, targetSquare }) => {
		if (!this.isMyTurn()) {
			console.log("Not your turn!");
			return;
		}
		console.log("your turn :)");
		// see if the move is legal
		let move = this.state.game.move({
			from: sourceSquare,
			to: targetSquare,
			promotion: "q" // always promote to a queen for example simplicity (TODO)
		});
		console.log("move: "+move);

		// illegal move
		if (move === null) return;

		// legal move; do it
		/*this.setState(({ history, pieceSquare }) => ({
			fen: this.state.game.fen(),
			history: this.state.game.history({ verbose: true }),
			squareStyles: squareStyling({ pieceSquare, history })
		}));*/
		this.state.onMove(move);
		this.removeSelection();
	};

	onSquareClick = square => {
		if (!this.isMyTurn()) {
			console.log("Not your turn!");
			return;
		}

		if (this.state.pieceSquare == square) {
			// reclicked same square; unselect it
			this.removeSelection();
		}
		else {
			// otherwise, see if it's a legal move
			let move = this.state.game.move({
				from: this.state.pieceSquare,
				to: square,
				promotion: "q" // promotion doesn't affect legality (?)
			});
			
			// illegal move (or no square was selected before); select clicked square
			// but only if it's possible to move from here (illegal squares can't be focused)
			if (move === null) {
				this.removeSelection();
				let moves = this.state.game.moves({
					square: square,
					verbose: true
				});
				if (moves.length === 0) return;

				this.select(square);
			}
			else {
				// do move
				/*this.setState({
					fen: this.state.game.fen(),
					history: this.state.game.history({ verbose: true }),
					pieceSquare: ""
				});*/
				this.state.onMove(move);
			}
		}
	};

	onMouseOverSquare = square => {
		// if no square is clicked, show possible moves
		if (!this.state.pieceSquare)
			this.showMoves(square);
	};

	showMoves = square => {
		// get list of possible moves for this square
		let moves = this.state.game.moves({
			square: square,
			verbose: true
		});

		// exit if there are no moves available
		if (moves.length === 0) return;

		let squaresToHighlight = [];
		for (var i = 0; i < moves.length; i++) {
			squaresToHighlight.push(moves[i].to);
		}

		this.highlightSquares(squaresToHighlight);
	}

	onMouseOutSquare = square => {
		if (!this.state.pieceSquare)
			this.removeHighlightSquare(square);
	}

	// get square name (a4) and return whether it is white
	isWhite = square => {
		let x = parseInt(square[0].charCodeAt(0) - 'a'.charCodeAt(0));
		let y = parseInt(square[1]);
		return (x + y) % 2 == 0;
	}

	// central squares get diff dropSquareStyles
	onDragOverSquare = square => {
		this.setState({
			dropSquareStyle: {
				backgroundColour: this.isWhite(square) ? "#AEB188" : "#85784E"
			}
		});
	};

	removeSelection() {
		this.setState({
			squareStyles: squareStyling({ pieceSquare: "", history: this.state.history }),
			pieceSquare: ""
		});
	}

	select(square) {
		this.setState(({ history }) => ({
			squareStyles: squareStyling({ pieceSquare: square, history }),
			pieceSquare: square
		}));
		this.showMoves(square);
	}

	// keep clicked square style and remove hint squares
	removeHighlightSquare = () => {
		this.setState(({ pieceSquare, history }) => ({
			squareStyles: squareStyling({ pieceSquare, history })
		}));
	};

	// show possible moves
	highlightSquares = (squaresToHighlight) => {
		const highlightStyles = [...squaresToHighlight].reduce(
			(a, c) => {
				return {
					...a,
					...{
						[c]: {
							background:
								"radial-gradient(rgba(20,85,30,0.5) 19%, rgba(0,0,0,0) 20%)",
							borderRadius: "50%"
						}
					},
					...squareStyling({
						history: this.state.history,
						pieceSquare: this.state.pieceSquare
					})
				};
			},
			{}
		);

		this.setState(({ squareStyles }) => ({
			squareStyles: { ...squareStyles, ...highlightStyles }
		}));
	};

	onSquareRightClick = (square) => {
		this.setState({
			squareStyles: { [square]: { backgroundColour: "deepPink" } }
		});
	}

	render() {
		return (
			<div className="App">
				<div>
					<Chessboard
						id="Game"
						width={320}
						position={this.state.game.fen()}
						onDrop={this.onDrop}
						onMouseOverSquare={this.onMouseOverSquare}
						onMouseOutSquare={this.onMouseOutSquare}
						boardStyle={{
							border: "2px solid gray",
							boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
							margin: "1em"
						}}
						squareStyles={this.state.squareStyles}
						dropSquareStyle={this.state.dropSquareStyle}
						onDragOverSquare={this.onDragOverSquare}
						onSquareClick={this.onSquareClick}
						onSquareRightClick={this.onSquareRightClick}
					/>
				</div>
				<span>
					{this.state.message}
					<br/>
					turn: {this.state.game.turn()}
					<br/>
					you: {this.state.colour}
				</span>
			</div>
		);
	}
}

const squareStyling = ({ pieceSquare, history }) => {
	const sourceSquare = history.length && history[history.length - 1].from;
	const targetSquare = history.length && history[history.length - 1].to;
	return {
		[pieceSquare]: { backgroundColour: "rgba(20,85,30,0.5)" },
		...(history.length && {
			[sourceSquare]: {
				backgroundColour: "rgba(155,199,0,0.41)"
			}
		}),
		...(history.length && {
			[targetSquare]: {
				backgroundColour: "rgba(155,199,0,0.41)"
			}
		})
	};
};

export default Game;