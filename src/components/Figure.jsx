import React, { Component } from "react";

const whites = { "king": "♔", "queen": "♕", "rook": "♖", "bishop": "♗", "knight": "♘", "pawn": "♙" };
const blacks = { "king": "♚", "queen": "♛", "rook": "♜", "bishop": "♝", "knight": "♞", "pawn": "♟" };
//const figures = {"white": whites, "black": blacks};
const figures = { "white": blacks, "black": blacks }; // abolish race

class Figure extends Component {
	constructor(props) {
		super(props);
		this.state = {
			colour: this.props.colour,
			name: this.props.name,
			onclick: this.props.moveFigure
		}
		this.getName = this.getName.bind(this);
	}

	render() {
		return <span className={"figure "+(this.state.colour || "")} onClick={this.state.onclick}>
					{figures[this.state.colour][this.state.name] || " "}
				</span>;
	}

	setColour(col) {
		this.state.colour = col;
	}

	getName() {
		return this.state.name;
	}
}

export default Figure;
