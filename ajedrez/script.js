document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const elements = {
        cells: document.querySelectorAll('.cell'),
        dumplingSelectionContainer: document.querySelector('.dumpling-selection'),
        currentPlayerMessage: document.getElementById('current-player-message'),
        gameStatusMessage: document.getElementById('game-status-message'),
        player1DumplingCounts: document.querySelector('.player-info.player-1 .dumpling-counts'),
        player2DumplingCounts: document.querySelector('.player-info.player-2 .dumpling-counts'),
        player1Info: document.querySelector('.player-info.player-1'),
        player2Info: document.querySelector('.player-info.player-2'),
        resetButton: document.getElementById('reset-button')
    };

    // --- Game State ---
    let boardState = Array(9).fill(null); // Represents the board: null or { player: 1/2, size: 'small'/'medium'/'large' }
    let currentPlayer = 1; // 1 for player 1 (Negro), 2 for player 2 (Blanco)
    let selectedDumpling = null; // Stores the currently selected dumpling type: { size: 'small'/'medium'/'large' }
    let gameActive = true;

    // --- Configuration ---
    const DUMPLING_SIZES = { 'small': 1, 'medium': 2, 'large': 3 }; // Numerical value for size comparison
    const INITIAL_DUMPLINGS = {
        1: { large: 2, medium: 3, small: 3 }, // Player 1 (Negro)
        2: { large: 2, medium: 3, small: 3 }  // Player 2 (Blanco)
    };
    const WIN_CONDITIONS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    let dumplings = JSON.parse(JSON.stringify(INITIAL_DUMPLINGS)); // Deep copy for resetting game

    // --- Game Logic Functions ---

    /**
     * Initializes or resets the game state.
     */
    function initializeGame() {
        boardState = Array(9).fill(null);
        currentPlayer = 1;
        selectedDumpling = null;
        gameActive = true;
        dumplings = JSON.parse(JSON.stringify(INITIAL_DUMPLINGS)); // Reset dumpling counts

        elements.cells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('occupied', 'winning-cell', 'player-1', 'player-2', 'small', 'medium', 'large');
        });

        updatePlayerInfoDisplay();
        updateDumplingSelectionDisplay();
        elements.currentPlayerMessage.textContent = 'Turno de: Jugador 1 (Negro)';
        elements.gameStatusMessage.textContent = '¡Comienza el juego!';
        elements.resetButton.style.display = 'none';
        elements.player1Info.classList.add('current-turn');
        elements.player2Info.classList.remove('current-turn');
    }

    /**
     * Updates the displayed dumpling counts for both players.
     */
    function updatePlayerInfoDisplay() {
        ['large', 'medium', 'small'].forEach(size => {
            elements.player1DumplingCounts.querySelector(`.${size}-dumpling-count`).textContent = dumplings[1][size];
            elements.player2DumplingCounts.querySelector(`.${size}-dumpling-count`).textContent = dumplings[2][size];
        });
    }

    /**
     * Updates the available dumpling options for the current player.
     */
    function updateDumplingSelectionDisplay() {
        elements.dumplingSelectionContainer.innerHTML = ''; // Clear previous options
        selectedDumpling = null; // Deselect any previously selected dumpling

        const currentPlayersDumplings = dumplings[currentPlayer];
        Object.entries(currentPlayersDumplings).forEach(([size, count]) => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('dumpling-option', `${size}-dumpling`, `player-${currentPlayer}`);
            optionDiv.dataset.size = size;

            const countOverlay = document.createElement('span');
            countOverlay.classList.add('dumpling-count-overlay');
            countOverlay.textContent = count;
            optionDiv.appendChild(countOverlay);

            if (count === 0) {
                optionDiv.classList.add('disabled');
                optionDiv.style.pointerEvents = 'none';
            } else {
                optionDiv.addEventListener('click', () => {
                    if (gameActive) {
                        selectedDumpling = { size: size, player: currentPlayer };
                        document.querySelectorAll('.dumpling-option').forEach(opt => opt.classList.remove('selected'));
                        optionDiv.classList.add('selected');
                        elements.currentPlayerMessage.textContent = `Turno de: Jugador ${currentPlayer === 1 ? 'Negro' : 'Blanco'}. Seleccionaste: ${size.toUpperCase()}`;
                    }
                });
            }
            elements.dumplingSelectionContainer.appendChild(optionDiv);
        });
    }

    /**
     * Handles a click on a game board cell.
     * @param {Event} event - The click event.
     */
    function handleCellClick(event) {
        if (!gameActive || !selectedDumpling) {
            elements.gameStatusMessage.textContent = 'Selecciona un dumpling antes de mover.';
            return;
        }

        const cell = event.target.closest('.cell');
        if (!cell) return;

        const cellIndex = parseInt(cell.id.replace('cell-', ''));
        const existingDumpling = boardState[cellIndex];

        let isValidMove = false;
        if (existingDumpling === null) {
            // Empty cell: any dumpling can be placed
            isValidMove = true;
        } else {
            // Occupied cell: can only place if opponent's dumpling and selected dumpling is larger
            if (existingDumpling.player !== currentPlayer && DUMPLING_SIZES[selectedDumpling.size] > DUMPLING_SIZES[existingDumpling.size]) {
                isValidMove = true;
            } else {
                elements.gameStatusMessage.textContent = 'Movimiento inválido: No puedes colocar aquí.';
                return;
            }
        }

        if (isValidMove) {
            boardState[cellIndex] = { player: currentPlayer, size: selectedDumpling.size };
            dumplings[currentPlayer][selectedDumpling.size]--; // Decrement count of placed dumpling
            
            renderDumplingInCell(cell, selectedDumpling.player, selectedDumpling.size);
            endTurnAndCheckGameStatus(); // Proceed to next turn and check game status
        }
    }

    /**
     * Renders a dumpling visually in a specific cell.
     * @param {HTMLElement} cellElement - The cell DOM element.
     * @param {number} player - The player ID (1 or 2).
     * @param {string} size - The size of the dumpling ('small', 'medium', 'large').
     */
    function renderDumplingInCell(cellElement, player, size) {
        cellElement.innerHTML = ''; // Clear existing content
        cellElement.classList.add('occupied');
        cellElement.classList.remove('player-1', 'player-2', 'small', 'medium', 'large'); // Clean old classes

        const dumplingDiv = document.createElement('div');
        dumplingDiv.classList.add('dumpling', `player-${player}`, size);
        cellElement.appendChild(dumplingDiv);
    }

    /**
     * Ends the current player's turn and checks for win conditions or game end.
     */
    function endTurnAndCheckGameStatus() {
        updatePlayerInfoDisplay();

        if (checkForWin()) {
            gameActive = false;
            elements.resetButton.style.display = 'block';
            return;
        }

        // If no win, switch player and check for valid moves for the new player
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        elements.currentPlayerMessage.textContent = `Turno de: Jugador ${currentPlayer === 1 ? 'Negro' : 'Blanco'}`;
        elements.gameStatusMessage.textContent = ''; // Clear previous move status

        elements.player1Info.classList.toggle('current-turn', currentPlayer === 1);
        elements.player2Info.classList.toggle('current-turn', currentPlayer === 2);
        
        updateDumplingSelectionDisplay(); // Update options for the new current player

        // Check if the current player has any valid moves (place or eat)
        if (!hasValidMoves(currentPlayer)) {
            declareGameEndByNoMoves();
        }
    }

    /**
     * Checks if a win condition (3 in a row) has been met.
     * @returns {boolean} - True if a player has won, false otherwise.
     */
    function checkForWin() {
        for (const condition of WIN_CONDITIONS) {
            const [a, b, c] = condition;
            // Check if cells are occupied and all by the same player
            if (boardState[a] &&
                boardState[a].player === boardState[b]?.player &&
                boardState[a].player === boardState[c]?.player) {
                
                elements.gameStatusMessage.textContent = `¡Jugador ${boardState[a].player === 1 ? 'Negro' : 'Blanco'} gana por línea!`;
                
                // Highlight winning cells
                elements.cells[a].classList.add('winning-cell');
                elements.cells[b].classList.add('winning-cell');
                elements.cells[c].classList.add('winning-cell');
                
                return true;
            }
        }
        return false;
    }

    /**
     * Determines if the specified player has any valid moves available.
     * A valid move is either placing a dumpling on an empty cell or eating a smaller opponent's dumpling.
     * @param {number} player - The player ID to check for valid moves.
     * @returns {boolean} - True if valid moves exist, false otherwise.
     */
    function hasValidMoves(player) {
        const playerDumplings = dumplings[player];

        // Check if the player has any dumplings left to place/eat
        const hasAvailableDumplingsInInventory = Object.values(playerDumplings).some(count => count > 0);
        
        // If no dumplings left in inventory, no moves are possible
        if (!hasAvailableDumplingsInInventory) {
            return false;
        }

        // Iterate through all cells on the board
        for (let i = 0; i < boardState.length; i++) {
            const cellContent = boardState[i];

            if (cellContent === null) {
                // If the cell is empty, and the current player has *any* dumpling to place, it's a valid move.
                // We just need to know if *any* empty cell exists AND the player has any dumpling.
                // Since we already checked hasAvailableDumplingsInInventory, if we find an empty cell, it's a valid move.
                return true; 
            } else {
                // If the cell is occupied, check if the current player can eat this dumpling
                if (cellContent.player !== player) { // It's an opponent's dumpling
                    // Check if the current player has any dumpling that is larger than the one in the cell
                    for (const size of Object.keys(playerDumplings)) {
                        if (playerDumplings[size] > 0 && DUMPLING_SIZES[size] > DUMPLING_SIZES[cellContent.size]) {
                            return true; // Found a valid eating move
                        }
                    }
                }
            }
        }
        
        // If no empty cells were found and no eating moves were possible, then no valid moves remain.
        return false; 
    }


    /**
     * Declares the game over when no valid moves are possible.
     * Calculates winner based on dumpling count on the board.
     */
    function declareGameEndByNoMoves() {
        gameActive = false;
        elements.resetButton.style.display = 'block';

        const player1Score = boardState.filter(d => d && d.player === 1).length;
        const player2Score = boardState.filter(d => d && d.player === 2).length;

        let finalMessage = `¡Juego terminado! Jugador ${currentPlayer === 1 ? 'Negro' : 'Blanco'} no tiene movimientos válidos.`;
        if (player1Score > player2Score) {
            finalMessage += ` Jugador Negro gana con ${player1Score} dumplings en el tablero.`;
        } else if (player2Score > player1Score) {
            finalMessage += ` Jugador Blanco gana con ${player2Score} dumplings en el tablero.`;
        } else {
            finalMessage += ` Es un empate con ${player1Score} dumplings cada uno.`;
        }
        elements.gameStatusMessage.textContent = finalMessage;
    }

    // --- Event Listeners ---
    elements.cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    elements.resetButton.addEventListener('click', initializeGame);

    // --- Initialization ---
    initializeGame();
});