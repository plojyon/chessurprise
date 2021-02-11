import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Game from './components/Game';
import reportWebVitals from './reportWebVitals';
import './Game.css';

ReactDOM.render(
	<React.StrictMode>
		<header className="header">
			<img src="inquisition.png" className="logo" alt="logo" />
			<p>Chessurprise</p>
		</header>
		<Game serverAddress="http://127.0.0.1:8080" />
	</React.StrictMode>,
	document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
