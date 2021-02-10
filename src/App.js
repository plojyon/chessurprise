import Chessboard from 'chessboardjsx';
import './App.css';
import Game from "./components/Game";
import { Chess } from "chess.js"; // import Chess from  "chess.js"(default) if recieving an error about new Chess() not being a constructor

function App() {
	return (
		<div className="App">
			<header className="header">
				<img src="inquisition.png" className="logo" alt="logo" />
				<p>Chessurprise</p>
			</header>
			<div id="container">
				{/*<Board/>*/}
				{/*<Chessboard position="start" />*/}
				{/*<HistoryPanel />*/}
				<Game/>
			</div>
		</div>
	);
}

export default App;
