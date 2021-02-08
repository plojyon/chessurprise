import './App.css';
import Board from "./components/Board";
import HistoryPanel from "./components/HistoryPanel";

function App() {
	return (
		<div className="App">
			<header className="header">
				<img src="inquisition.png" className="logo" alt="logo" />
				<p>Chessurprise</p>
			</header>
			<div id="container">
				<Board/>
				<HistoryPanel/>
			</div>
		</div>
	);
}

export default App;
