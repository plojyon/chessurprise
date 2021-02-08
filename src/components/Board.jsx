import React, { Component } from "react";
import BoardField from "./BoardField";
import Figure from "./Figure";

class Board extends Component {
	constructor(props) {
		super(props);
		this.state = {
			fields: [
				//{ figure: "rook", coordinates: [0, 0] },
				//{ figure: "pawn", coordinates: [1, 0] },
				// ...
			],
			movingFigure: false
		};
		const col_names = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
		for (let row = 7; row >= 0; row--) {
			for (let col = 0; col < 8; col++) {
				let figure = this.getFigureAt(row, col);
				this.state.fields.push(<BoardField key={"B" + (8 * row + col + 1)} coords={[row, col]} name={[col_names[col], row+1]} figure={figure} />);
			}
		}
		this.moveFigure = this.moveFigure.bind(this);
	}
	getFigureAt(row, col) {
		let key = "F" + (8 * row + col);
		let colour = "white";
		if (row > 3) {
			row = 7 - row;
			colour = "black";
		}
		if (row == 1) {
			return <Figure key={key} name="pawn" colour={colour} moveFigure={this.moveFigure}/>;
		}
		if (row != 0) return null;
		let name = "?";
		switch (col) {
			case 0: // A
			case 7: // H
				name = "rook";
				break;
			case 1: // B
			case 6: // G
				name = "knight";
				break;
			case 2: // C
			case 5: // F
				name = "bishop";
				break;
			case 3: // D
				name = "king";
				break;
			case 4: // E
				name = "queen";
				break;
			default:
				return null;
		}
		return <Figure key={key} name={name} colour={colour} moveFigure={this.moveFigure} />;
	}

	moveFigure(figure) {
		alert("moving "+figure);
		// TODO: implement moveFigure
	}
	
	render() {
		return <div className="board">{this.state.fields}</div>;
	}
}

export default Board;