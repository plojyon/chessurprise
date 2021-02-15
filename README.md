# Chessurprise

<sup>Let's hope my wife names the child.</sup>

This is chess, but both players simultaneously make a move. After they're both decided, the moves are shown to the other player.

## How conflicts are resolved:
* A figure will always dodge being captured.
* If two figures try to capture each other, they both dodge each other's attacks, effectively swapping places.
* If two figures land on the same spot, the player who made the move first, will be the one to capture the other
* The game ends if a king is captured, or when a classic checkmate occurs
* If both kings are captured at the same time, or if both players checkmate each other simultaneously, the game ends in a tie

To start the frontend client:  
`npm start`  

To start the server:  
`npm run-script start-server`  
