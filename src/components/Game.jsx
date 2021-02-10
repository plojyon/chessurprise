import React, { Component } from "react";
import PropTypes from "prop-types";
import Chess from "chess.js"; // import Chess from  "chess.js"(default) if recieving an error about new Chess() not being a constructor

import Chessboard from "chessboardjsx";

class Game extends Component {
	static propTypes = { children: PropTypes.func };

	state = {
		fen: "start", // regular starting position
		dropSquareStyle: {}, // square styles for active drop square
		squareStyles: {}, // custom square styles
		pieceSquare: "", // square with the currently clicked piece
		square: "", // currently clicked square
		history: [] // array of past game moves
	};

	// invoked by React when DOM is ready and component mounted
	componentDidMount() {
		this.game = new Chess();
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

	onDrop = ({ sourceSquare, targetSquare }) => {
		// see if the move is legal
		let move = this.game.move({
			from: sourceSquare,
			to: targetSquare,
			promotion: "q" // always promote to a queen for example simplicity
		});

		// illegal move
		if (move === null) return;

		// legal move; do it
		this.setState(({ history, pieceSquare }) => ({
			fen: this.game.fen(),
			history: this.game.history({ verbose: true }),
			squareStyles: squareStyling({ pieceSquare, history })
		}));
		this.removeSelection();
	};

	onMouseOverSquare = square => {
		// if no square is clicked, show possible moves
		if (!this.state.pieceSquare)
			this.showMoves(square);
	};

	showMoves = square => {
		// get list of possible moves for this square
		let moves = this.game.moves({
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

	isWhite = square => {
		let x = parseInt(square[0].charCodeAt(0) - 'a'.charCodeAt(0));
		let y = parseInt(square[1]);
		return (x + y) % 2 == 0;
	}

	// central squares get diff dropSquareStyles
	onDragOverSquare = square => {
		this.setState({
			dropSquareStyle: {
				backgroundColor: this.isWhite(square)? "#AEB188":"#85784E"
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

	onSquareClick = square => {
		if (this.state.pieceSquare == square) {
			// reclicked same square; unselect it
			this.removeSelection();
		}
		else {
			// otherwise, see if it's a legal move
			let move = this.game.move({
				from: this.state.pieceSquare,
				to: square,
				promotion: "q" // promotion doesn't affect legality (?)
			});
			
			// illegal move (or no square was selected before); select clicked square
			// but only if it's possible to move from here (illegal squares can't be focused)
			if (move === null) {
				this.removeSelection();
				let moves = this.game.moves({
					square: square,
					verbose: true
				});
				if (moves.length === 0) return;

				this.select(square);
			}
			else {
				// do move
				this.setState({
					fen: this.game.fen(),
					history: this.game.history({ verbose: true }),
					pieceSquare: ""
				});
			}
		}
	};

	onSquareRightClick = square =>
		this.setState({
			squareStyles: { [square]: { backgroundColor: "deepPink" } }
		});

	render() {
		const { fen, dropSquareStyle, squareStyles } = this.state;

		return this.props.children({
			squareStyles,
			position: fen,
			onMouseOverSquare: this.onMouseOverSquare,
			onMouseOutSquare: this.onMouseOutSquare,
			onDrop: this.onDrop,
			dropSquareStyle,
			onDragOverSquare: this.onDragOverSquare,
			onSquareClick: this.onSquareClick,
			onSquareRightClick: this.onSquareRightClick
		});
	}
}

export default function renderGame() {
	return (
		<div>
			<Game>
				{({
					position,
					onDrop,
					onMouseOverSquare,
					onMouseOutSquare,
					squareStyles,
					dropSquareStyle,
					onDragOverSquare,
					onSquareClick,
					onSquareRightClick
				}) => (
					<Chessboard
						id="Game"
						width={320}
						position={position}
						onDrop={onDrop}
						onMouseOverSquare={onMouseOverSquare}
						onMouseOutSquare={onMouseOutSquare}
						boardStyle={{
							border: "2px solid gray",
							boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
							margin: "1em"
						}}
						squareStyles={squareStyles}
						dropSquareStyle={dropSquareStyle}
						onDragOverSquare={onDragOverSquare}
						onSquareClick={onSquareClick}
						onSquareRightClick={onSquareRightClick}
					/>
				)}
			</Game>
		</div>
	);
}

const squareStyling = ({ pieceSquare, history }) => {
	const sourceSquare = history.length && history[history.length - 1].from;
	const targetSquare = history.length && history[history.length - 1].to;
	console.log({
		[pieceSquare]: { backgroundColor: "rgba(20,85,30,0.5)" },
		...(history.length && {
			[sourceSquare]: {
				backgroundColor: "rgba(155,199,0,0.41)"
			}
		}),
		...(history.length && {
			[targetSquare]: {
				backgroundColor: "rgba(155,199,0,0.41)"
			}
		})
	});
	return {
		[pieceSquare]: { backgroundColor: "rgba(20,85,30,0.5)" },
		...(history.length && {
			[sourceSquare]: {
				backgroundColor: "rgba(155,199,0,0.41)"
			}
		}),
		...(history.length && {
			[targetSquare]: {
				backgroundColor: "rgba(155,199,0,0.41)"
			}
		})
	};
};
