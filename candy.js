
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 50;
const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;
const COLORS = ['#ff6b6b', '#339af0', '#51cf66', '#ffd43b', '#845ef7'];
const BORDER_COLOR = '#ffffff';
const SCORE_BAR_HEIGHT = 30;
const TARGET_SCORE = 500;
const MAX_MOVES = 10;

// Load background image
const backgroundImage = new Image();
backgroundImage.src = 'candies.jpg'; // Ensure this path is correct

// Load pop sound
const popSound = new Audio('pop.mp3'); // Ensure this path is correct

// Load win and lose sounds
const winSound = new Audio('winning.mp3'); // Ensure this path is correct
const loseSound = new Audio('game-over.mp3'); // Ensure this path is correct

// Load background music
const backgroundMusic = new Audio('background-music.mp3'); // Ensure this path is correct
backgroundMusic.loop = true;  // Set the background music to loop

// Ensure that the sound files are loaded and ready to use
popSound.addEventListener('canplaythrough', () => {
  console.log('Pop sound is ready!');
});
winSound.addEventListener('canplaythrough', () => {
  console.log('Win sound is ready!');
});
loseSound.addEventListener('canplaythrough', () => {
  console.log('Lose sound is ready!');
});
backgroundMusic.addEventListener('canplaythrough', () => {
  console.log('Background music is ready!');
});

// Set the canvas size dynamically to cover the full screen (excluding score bar)
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - SCORE_BAR_HEIGHT;

let grid = [];
let score = 0;
let moves = 0;
let isAnimating = false;

// Calculate the offsets to center the grid
const offsetX = (canvas.width - (GRID_WIDTH * TILE_SIZE)) / 2;
const offsetY = (canvas.height - (GRID_HEIGHT * TILE_SIZE) - SCORE_BAR_HEIGHT) / 2;

// Initialize game grid
function createGrid() {
  grid = [];
  for (let row = 0; row < GRID_HEIGHT; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_WIDTH; col++) {
      grid[row][col] = getRandomColor();
    }
  }
}

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  // Draw the background image
  if (backgroundImage.complete) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height - SCORE_BAR_HEIGHT);
  }

  // Draw the grid
  for (let row = 0; row < GRID_HEIGHT; row++) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      drawTile(row, col, grid[row][col], offsetX, offsetY);
    }
  }

  drawScore();
}

function drawTile(row, col, color, offsetX, offsetY) {
  const x = col * TILE_SIZE + offsetX;
  const y = row * TILE_SIZE + offsetY;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
}

function drawScore() {
  ctx.clearRect(0, canvas.height - SCORE_BAR_HEIGHT, canvas.width, SCORE_BAR_HEIGHT);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, canvas.height - SCORE_BAR_HEIGHT, canvas.width, SCORE_BAR_HEIGHT);
  ctx.font = '20px Arial';
  ctx.fillStyle = '#000';
  ctx.fillText(`Score: ${score} Moves Left: ${MAX_MOVES - moves}`, 10, canvas.height - 10);
}

function checkGameStatus() {
  if (score >= TARGET_SCORE) {
    winSound.play(); // Play the win sound
    backgroundMusic.pause(); // Stop the background music
    setTimeout(() => alert('You won! Congratulations!'), 100);
    resetGame();
  } else if (moves >= MAX_MOVES) {
    loseSound.play(); // Play the lose sound
    backgroundMusic.pause(); // Stop the background music
    setTimeout(() => alert('Game over! You lost!'), 100);
    resetGame();
  }
}

function resetGame() {
  score = 0;
  moves = 0;
  createGrid();
  drawGrid();
  backgroundMusic.play(); // Start playing background music again
}

// Handle mouse click events
canvas.addEventListener('click', (event) => {
  if (isAnimating) return;

  const col = Math.floor((event.offsetX - offsetX) / TILE_SIZE); // Adjust click position by offset
  const row = Math.floor((event.offsetY - offsetY) / TILE_SIZE); // Adjust click position by offset
  const colorToMatch = grid[row]?.[col];

  if (colorToMatch) {
    const matchingTiles = findMatchingTiles(row, col, colorToMatch, []);
    if (matchingTiles.length >= 3) { // At least 3 tiles for a valid match
      score += matchingTiles.length * 10; // More tiles yield higher scores
      moves++;
      animateClick(matchingTiles);
      popSound.play(); // Play pop sound
      setTimeout(() => {
        removeTiles(matchingTiles);
        dropTiles();
        drawGrid();
        checkGameStatus();
      }, 500);
    }
  }
});

function findMatchingTiles(row, col, color, visited) {
  if (
    row < 0 || row >= GRID_HEIGHT ||
    col < 0 || col >= GRID_WIDTH ||
    grid[row][col] !== color ||
    visited.some(tile => tile.row === row && tile.col === col)
  ) return visited;

  visited.push({ row, col });

  findMatchingTiles(row + 1, col, color, visited);
  findMatchingTiles(row - 1, col, color, visited);
  findMatchingTiles(row, col + 1, color, visited);
  findMatchingTiles(row, col - 1, color, visited);

  return visited;
}

function removeTiles(tiles) {
  for (const tile of tiles) {
    grid[tile.row][tile.col] = null;
  }
}

function animateClick(tiles) {
  isAnimating = true;
  for (const tile of tiles) {
    const x = tile.col * TILE_SIZE + offsetX;
    const y = tile.row * TILE_SIZE + offsetY;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    ctx.scale(1.3, 1.3);
    ctx.fillRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
    ctx.restore();
  }

  setTimeout(() => {
    isAnimating = false;
  }, 300);
}

function dropTiles() {
  // Start dropping tiles to fill null spaces in the grid
  for (let col = 0; col < GRID_WIDTH; col++) {
    let emptyRow = GRID_HEIGHT - 1;
    for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
      if (grid[row][col] !== null) {
        grid[emptyRow][col] = grid[row][col];
        if (emptyRow !== row) grid[row][col] = null;
        emptyRow--;
      }
    }
    // Fill remaining empty spaces with new random colors
    for (let row = emptyRow; row >= 0; row--) {
      grid[row][col] = getRandomColor();
    }
  }
}

// Check if there are any valid moves left on the grid
function hasValidMoves() {
  for (let row = 0; row < GRID_HEIGHT; row++) {
    for (let col = 0; col < GRID_WIDTH; col++) {
      const color = grid[row][col];
      
      // Skip checking if the tile is empty (null)
      if (!color) continue;

      // Check if there are valid horizontal or vertical matches from the current tile
      const horizontalMatches = findMatchingTiles(row, col, color, []);
      const verticalMatches = findMatchingTiles(row, col, color, []);

      if (horizontalMatches.length >= 3 || verticalMatches.length >= 3) {
        return true; // If a valid move is found, return true
      }
    }
  }
  return false; // No valid moves left
}

function refreshGridIfNeeded() {
  if (!hasValidMoves()) {
    alert('No valid moves left. Refreshing grid...');
    createGrid();
    drawGrid();
  }
}

// Initialize and start the game
backgroundImage.onload = function () {
  createGrid();
  drawGrid();
  backgroundMusic.play(); // Start playing background music when the game starts
};
