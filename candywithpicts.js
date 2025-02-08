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

// Paths to images
const TILE_IMAGES = [
    'adi.jpg',  'andra.jpg', 'radu.jpg', 'cri.jpg', 'voldy.jpg'
];

// Load the tile images
const images = [];
let imagesLoaded = 0;
TILE_IMAGES.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === TILE_IMAGES.length) {
            backgroundImage.onload = () => {
                createGrid();
                drawGrid();
                showStartPopup(); // Show start pop-up when the game is ready
            };
        }
    };
    img.onerror = (err) => {
        console.error("Error loading image: ", src, err);
    };
    images.push(img);
});

// Load background image
const backgroundImage = new Image();
backgroundImage.src = 'candies.jpg';

// Load sounds
const popSound = new Audio('pop.mp3');
const winSound = new Audio('winning.mp3');
const loseSound = new Audio('game-over.mp3');
const backgroundMusic = new Audio('background-music.mp3');
backgroundMusic.loop = true;

// Set canvas size and offsets
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - SCORE_BAR_HEIGHT;
const offsetX = (canvas.width - (GRID_WIDTH * TILE_SIZE)) / 2;
const offsetY = (canvas.height - (GRID_HEIGHT * TILE_SIZE) - SCORE_BAR_HEIGHT) / 2;

// Initialize game variables
let grid = [];
let score = 0;
let moves = 0;
let isAnimating = false;

// Create grid
function createGrid() {
    grid = [];
    for (let row = 0; row < GRID_HEIGHT; row++) {
        grid[row] = [];
        for (let col = 0; col < GRID_WIDTH; col++) {
            grid[row][col] = Math.floor(Math.random() * TILE_IMAGES.length); // Random tile index
        }
    }
}

// Draw the grid
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < GRID_HEIGHT; row++) {
        for (let col = 0; col < GRID_WIDTH; col++) {
            const tileType = grid[row][col];
            drawTile(row, col, tileType);  // Apply offset when drawing tiles
        }
    }

    drawScore();
}

// Draw an individual tile
function drawTile(row, col, tileType) {
    const x = offsetX + col * TILE_SIZE;
    const y = offsetY + row * TILE_SIZE;
    const image = images[tileType];

    if (image) {
        ctx.drawImage(image, x, y, TILE_SIZE, TILE_SIZE);
    }

    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
}

// Draw the score bar
function drawScore() {
    ctx.clearRect(0, canvas.height - SCORE_BAR_HEIGHT, canvas.width, SCORE_BAR_HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, canvas.height - SCORE_BAR_HEIGHT, canvas.width, SCORE_BAR_HEIGHT);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(`Score: ${score} Moves Left: ${MAX_MOVES - moves}`, 10, canvas.height - 10);
}

// Display start popup
function showStartPopup() {
    setTimeout(() => {
        alert(`Welcome to the game!\nYou need to score ${TARGET_SCORE} points to win!`);
    }, 200); // Show alert with a slight delay
}

// Check game status
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

// Handle tile clicks
canvas.addEventListener('click', (event) => {
    if (isAnimating) return;  // Prevent clicking during animation

    const col = Math.floor((event.offsetX - offsetX) / TILE_SIZE);  // Adjust for offset
    const row = Math.floor((event.offsetY - offsetY) / TILE_SIZE);  // Adjust for offset

    // Ensure the clicked tile is valid
    if (row < 0 || row >= GRID_HEIGHT || col < 0 || col >= GRID_WIDTH) {
        return;
    }

    const tileType = grid[row][col];  // Get the tile type at the clicked position
    if (tileType === null) return;  // Skip if there's no tile at the clicked position

    const matchingTiles = findMatchingTiles(row, col, tileType, []);  // Find matching tiles

    if (matchingTiles.length >= 3) {
        score += matchingTiles.length * 10;  // Increase score based on matched tiles
        moves++;  // Increment move counter
        popSound.play();  // Play pop sound

        // Animate matching tiles
        animateClick(matchingTiles);

        setTimeout(() => {
            // After animation, remove tiles and drop new ones
            removeTiles(matchingTiles);
            dropTiles();
            drawGrid();  // Redraw the grid with updated tiles
            checkGameStatus();  // Check win/lose status
        }, 500);  // Delay before removing tiles and dropping new ones
    }
});

// Function to reset the game state
function resetGame() {
    // Reset the game variables
    score = 0;
    moves = 0;
    createGrid();  // Recreate the grid with new tiles
    drawGrid();  // Redraw the grid
    backgroundMusic.play(); // Start playing background music again
}

// Your existing game code continues here...



function animateClick(tiles) {
    isAnimating = true;
    const scaleFactor = 1.3;  // Scale factor for pop animation

    tiles.forEach(tile => {
        const x = offsetX + tile.col * TILE_SIZE;
        const y = offsetY + tile.row * TILE_SIZE;

        // Pop animation (scale up)
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
        ctx.scale(scaleFactor, scaleFactor);
        ctx.fillRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
        ctx.restore();
    });

    // After animation ends, remove tiles and update grid
    setTimeout(() => {
        isAnimating = false;
        removeTiles(tiles);  // Remove matched tiles
        dropTiles();  // Drop new tiles into empty spaces
        drawGrid();  // Redraw the grid with new tiles
    }, 300);  // Duration of animation
}

function removeTiles(tiles) {
    tiles.forEach(tile => {
        grid[tile.row][tile.col] = null;  // Set the tile to null (empty)
    });
}

// Find matching tiles for the clicked tile
// Find matching tiles for the clicked tile (up, down, left, right)
function findMatchingTiles(row, col, tileType, visited) {
    // Prevent out-of-bounds or checking already visited tiles
    if (
        row < 0 || row >= GRID_HEIGHT ||
        col < 0 || col >= GRID_WIDTH ||
        grid[row][col] !== tileType ||  // Compare tile type
        visited.some(tile => tile.row === row && tile.col === col)
    ) return visited;

    // Mark the current tile as visited
    visited.push({ row, col });

    // Check the four possible directions (up, down, left, right)
    findMatchingTiles(row + 1, col, tileType, visited); // Down
    findMatchingTiles(row - 1, col, tileType, visited); // Up
    findMatchingTiles(row, col + 1, tileType, visited); // Right
    findMatchingTiles(row, col - 1, tileType, visited); // Left

    return visited;
}

// Remove matched tiles
function removeTiles(tiles) {
    tiles.forEach(tile => {
        grid[tile.row][tile.col] = null;  // Set the tile to null (empty)
    });
}

// Drop tiles
function dropTiles() {
    for (let col = 0; col < GRID_WIDTH; col++) {
        let emptyRow = GRID_HEIGHT - 1;

        for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
            if (grid[row][col] !== null) {
                grid[emptyRow][col] = grid[row][col];
                if (emptyRow !== row) grid[row][col] = null;
                emptyRow--;
            }
        }

        for (let row = emptyRow; row >= 0; row--) {
            grid[row][col] = Math.floor(Math.random() * TILE_IMAGES.length);  // Random tile
        }
    }
}

backgroundImage.onload = function () {
    createGrid();
    drawGrid();
    backgroundMusic.play(); // Start playing background music when the game starts
  };