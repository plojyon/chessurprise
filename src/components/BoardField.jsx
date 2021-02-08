import React, { Component } from "react";
import Figure from "./Figure";

class BoardField extends Component {
	constructor(props) {
		super(props);
		this.state = {
			"coords": this.props.coords,
			"name": this.props.name,
			"figure": this.props.figure,
			"highlighted": false
		};
	}
	render() {
		let corner = <></>;
		if (this.state.coords[0] == 0)
			corner = <> {corner} <span className="borderField bottom">{this.state.name[0]}</span> </>;
		if (this.state.coords[1] == 0)
			corner = <> {corner} <span className="borderField left">{this.state.name[1]}</span> </>;

		return <div className={"field"+(this.state.highlighted?" highlighted":"")}>
			{this.state.figure} {corner}
		</div>;
	}
}

export default BoardField;
