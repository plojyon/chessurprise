const httpServer = require("http").createServer();
const io = require('socket.io')(httpServer, {
	cors: {
		origin: "*" // CORS
	},
	origins: "*:*" // CORS...
});
io.cors = "*:*"; // CORS?
//io.set("origins", "*:*"); // CORS!

const chess = require("chess.js");
const start_board = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let game; // Chess object
const players = {"white": null, "black": null}; // object of players' sockets
let turns; // sockets who have already done the turn
let moves; // ordered chronologically (max length: 2, then erased)
reset(); // initialize

function reset() {
	players["white"] = null;
	players["black"] = null;
	turns = [];
	moves = [];
	game = new chess.Chess(start_board);
}

// take the two moves in the turn[] array and do them both at once
// assume both moves in turn{} array are valid
function mergeMoves() {
	//let board = game.board(); // 2d array of {type, color}
	//chess.put({ type: chess.PAWN, color: chess.BLACK }, 'a5')
	//chess.remove('a5')
	/* Flags:
	'n' - a non - capture
	'b' - a pawn push of two squares
	'e' - an en passant capture
	'c' - a standard capture
	'p' - a promotion
	'k' - kingside castling
	'q' - queenside castling
	*/

	console.log("Merging moves: " + JSON.stringify(moves));
	let s0 = moves[0].from; // source 0
	let d0 = moves[0].to; // destination 0
	let s1 = moves[1].from; // source 1
	let d1 = moves[1].to; // destination 1
	console.log(s0);
	console.log(s1);
	console.log(d0);
	console.log(d1);
	if (d0 == d1) {
		// figures landed on the same spot;
		// move[0] gets the spot
		game.remove(s0);
		game.remove(s1);
		game.put({ type: moves[0].piece, color: moves[0].color }, d0);
	} else {
		// moves don't interfere with each other
		game.remove(s0);
		game.remove(s1);
		game.put({ type: moves[0].piece, color: moves[0].color }, d0);
		game.put({ type: moves[1].piece, color: moves[1].color }, d1);
	}

	// handle special moves
	let isQCastle0 = moves[0].flags.indexOf('q') != -1;
	let isKCastle0 = moves[0].flags.indexOf('k') != -1;
	let isPawnTwoPush0 = moves[0].flags.indexOf('b') != -1; // will allow en passant next move
	let isQCastle1 = moves[1].flags.indexOf('q') != -1;
	let isKCastle1 = moves[1].flags.indexOf('k') != -1;
	let isPawnTwoPush1 = moves[1].flags.indexOf('b') != -1; // will allow en passant next move
	let castle0 = null;
	let castle1 = null;
	if (isQCastle0) castle0 = "q";
	if (isKCastle0) castle0 = "k";
	if (isQCastle1) castle1 = "q";
	if (isKCastle1) castle1 = "k";
	let color0 = moves[0].color;
	let color1 = moves[1].color;
	if (castle0) {
		let rookDest = getRookCastleDestination(color0, castle0);
		// another figure landed there, but move 0 happened first, so rook takes the spot
		// therefore this check is irrelevant
		//if (rookDest == d1) {
			game.put({ type: "r", color: color0 }, rookDest);
			game.remove(getRookCastleOrigin(color0, castle0));
			console.log("removing rook at "+getRookCastleOrigin(color0, castle0)+" color0: "+color0+" castle0: "+castle0);
		//}
	}
	if (castle1) {
		let rookDest = getRookCastleDestination(color1, castle1);
		if (rookDest == d0) {
			// removing the rook is enough, since it was captured at the destination
			game.remove(getRookCastleOrigin(color1, castle1));
			console.log("removing rook at " + getRookCastleOrigin(color1, castle1) + " color1: " + color1 + " castle1: " + castle1);
		}
	}


	moves = [];
	turns = [];
	console.log("broadcasting new board: " + game.fen());
	io.emit("board", game.fen());
	io.emit("turn");
	// TODO: enable en passant flag
	if (checkVictory(game)) {
		console.log("Got victory!");
		console.log("Here's the entire game:");
		chess.header("game", "Chessurprise", "timestamp", Date.now()); // sign the game file
		console.log(game.pgn());
		console.log("lp, resetting board ...");
		io.emit('victory', turns);
		players['white'].disconnect();
		players['black'].disconnect();
		reset();
		return;
	}
}

function getRookCastleDestination(color, side) {
	let dest = "";
	if (side == "q") dest += "d";
	if (side == "k") dest += "f";
	if (color == "w") dest += "1";
	if (color == "b") dest += "8";
	return dest;
}

function getRookCastleOrigin(color, side) {
	let origin = "";
	if (side == "q") origin += "a";
	if (side == "k") origin += "h";
	if (color == "w") origin += "1";
	if (color == "b") origin += "8";
	return origin;
}

function checkVictory(game) {
	if (game.moves() == null) console.log("ILLEGAL GAME STATE: "+game.fen());
	return game.moves().length == 0 ||
		game.in_checkmate() ||
		game.in_draw() ||
		game.in_stalemate() ||
		game.in_threefold_repetition();
}

function setTurn(fen, colour) {
	let fens = fen.split(" ");
	fens[1] = colour.charAt(0); // change turn to match my colour
	return fens.join(" ");
}

function isMoveLegal(move, board) {
	console.log("checking legality of " + JSON.stringify(move) + " on " + setTurn(board.fen(), move.color));
	let boardCopy = new chess.Chess(setTurn(board.fen(), move.color));
	let m = boardCopy.move(move.san);
	console.log(m);
	if (m == null) return false;
	return true;
}

// returns the role of the socket in game ("white" | "black" | "spectator")
function getSocketRole(socket) {
	if (players["white"] == socket) return "white";
	if (players["black"] == socket) return "black";
	return "spectator";
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
		io.emit('board', game.fen());
		io.emit('turn', 'white');
		console.log("Assigned black");
	} else {
		//socket.disconnect(); // brutal
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
		// Ignore clicks before both players are connected
		if ((players['white'] == null) || (players['black'] == null)) {
			console.log("click before all players are connected");
			return;
		}

		// Ignore players clicking when they already moved this turn
		if (turns.includes(socket)) {
			console.log("this player already moved this turn");
			return;
		}

		// ignore players who tried to move an opponent
		if (getSocketRole(socket).charAt(0) != move.color) {
			console.log(getSocketRole(socket) + " is trying to move " + move.color);
			return;
		}

		// ignore illegal moves
		if (!isMoveLegal(move, game)) {
			console.log("whoopsie you going to jail. " + JSON.stringify(move));
			return;
		}

		// do move
		console.log(getSocketRole(socket) + " is doing a move: "+move.san);
		turns.push(socket);
		moves.push(move);

		if (turns.length == moves.length && moves.length == 2) {
			mergeMoves();
		} else if (!(turns.length == moves.length && (moves.length == 1 || moves.length == 0))) {
			console.log("Illegal number of turns happened!");
			console.log("turns: " + JSON.stringify(turns));
			console.log("moves: " + JSON.stringify(moves));
			console.log("!-------------!");
			// TODO: remove this redundant check later
		}
	});
});

reset();
const port = process.env.PORT || 8080;
io.listen(port);
console.log('Listening on port ' + port + '...');
