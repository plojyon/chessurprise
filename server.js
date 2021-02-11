const httpServer = require("http").createServer();
const io = require('socket.io')(httpServer, {
	cors: {
		origin: "*" // CORS
	},
	origins: "*:*" // CORS...
});
io.cors = "*:*"; // CORS?
//io.set("origins", "*:*"); // CORS!

const start_board = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const chess = require("chess.js");
let game = new chess.Chess(start_board);
const players = { 'white': null, 'black': null };
let turn = "white";

function reset() {
	players["white"] = null;
	players["black"] = null;
	turn = "white";
	game = new chess.Chess();
}

/*

let move = game.move(move); // does a move (or returns null if illegal)

game.fen();

game.history({ verbose: true });

let moves = game.moves({
	square: square,
	verbose: true
});

*/

function checkVictory(i, j) {
	return false; // TODO
}


io.on('connection', function (socket) {
	console.log("Received new connection");

	if (players['white'] == null) {
		players['white'] = socket;
		socket.emit('colour', 'white');
		console.log("Assigned white");
	} else if (players['black'] == null) {
		players['black'] = socket;
		socket.emit('colour', 'black');
		socket.emit('board', game.fen());
		io.emit('turn', 'white');
		console.log("Assigned black");
	} else {
		//socket.disconnect();
		socket.emit('colour', 'spectator');
		socket.emit('board', game.fen());
		console.log("Assigned spectator");
	}

	socket.on('disconnect', function () {
		if (players['white'] === socket) {
			players['white'] = null;
			console.log("White is gon");
		} else if (players['black'] === socket) {
			players['black'] = null;
			console.log("Black is gon");
		}
		else {
			console.log("A spectator got bored and left.");
		}
	});

	socket.on('move', function (move) {
		// Ignore players clicking when it's not their turn
		if (players[turn] !== socket) {
			let inverted = (turn === 'white') ? 'black' : 'white';
			if (players[inverted] == socket)
				console.log(inverted + " is trying to move on " + turn + "s turn!");
			else
				console.log("A spectator is trying to interfere");
			return;
		}

		// Ignore clicks before both players are connected
		if ((players['white'] == null) || (players['black'] == null)) {
			console.log("click before all players are connected");
			return;
		}

		// do move
		console.log("Doing move: "+move.san);
		let m = game.move(move.san);
		if (m == null) return; // illegal

		console.log("broadcasting new board: "+game.fen());
		io.emit("board", game.fen());

		// Check victory (only current player can win)
		if (checkVictory()) {
			io.emit('victory', turn);
			// Disconnect players
			players['white'].disconnect();
			players['black'].disconnect();
			reset();
			return;
		}

		// Toggle the player
		turn = turn === 'white' ? 'black' : 'white';
		io.emit('turn', turn);
	});
});

reset();
const port = process.env.PORT || 8080;
io.listen(port);
console.log('Listening on port ' + port + '...');
