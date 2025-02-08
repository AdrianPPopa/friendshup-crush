// Get canvas element and context
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
const totalImages = TILE_IMAGES.length + 1; // +1 for the background image

function checkAllImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        createGrid();
        drawGrid();
        showStartPopup();
    }
}
TILE_IMAGES.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = checkAllImagesLoaded;
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
    if (isAnimating) return; // Prevent clicks during animation

    const col = Math.floor((event.offsetX - offsetX) / TILE_SIZE);
    const row = Math.floor((event.offsetY - offsetY) / TILE_SIZE);

    if (row < 0 || row >= GRID_HEIGHT || col < 0 || col >= GRID_WIDTH) {
        return; // Ignore clicks outside the grid
    }

    const tileType = grid[row][col];
    if (tileType === null) return; // Ignore empty tiles

    const matchingTiles = findMatchingTiles(row, col, tileType, []);

    if (matchingTiles.length >= 3) {
        score += matchingTiles.length * 10; // Update score
        moves++; // Increment move counter
        popSound.play(); // Play sound

        animateClick(matchingTiles); // Start the animation
    }
});
// Function to reset the game state
function resetGame() {
    score = 0;
    moves = 0;
    createGrid();
    drawGrid();
    backgroundMusic.play();
}

// Animation for tile click
function animateClick(tiles) {
    isAnimating = true;
    const duration = 300; // Animation duration in milliseconds
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        // Clear the canvas and redraw the grid
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();

        // Scale tiles based on progress
        tiles.forEach(tile => {
            const x = offsetX + tile.col * TILE_SIZE;
            const y = offsetY + tile.row * TILE_SIZE;
            const scale = 1 + 0.3 * Math.sin(progress * Math.PI); // Bounce effect

            ctx.save();
            ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
            ctx.scale(scale, scale);
            drawTile(tile.row, tile.col, grid[tile.row][tile.col]);
            ctx.restore();
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isAnimating = false;
            removeTiles(tiles); // Remove tiles after animation
            dropTiles(); // Drop new tiles
            drawGrid(); // Redraw the grid
            checkGameStatus(); // Check if the game is won or lost
        }
    }

    requestAnimationFrame(animate);
}

function removeTiles(tiles) {
    tiles.forEach(tile => {
        grid[tile.row][tile.col] = null; // Set the tile to null (empty)
    });
}

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

// Drop tiles and fill empty spaces with new tiles
function dropTiles() {
    for (let col = 0; col < GRID_WIDTH; col++) {
        let emptySpaces = 0;

        for (let row = GRID_HEIGHT - 1; row >= 0; row--) {
            if (grid[row][col] === null) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                grid[row + emptySpaces][col] = grid[row][col];
                grid[row][col] = null;
            }
        }

        for (let row = 0; row < emptySpaces; row++) {
            grid[row][col] = Math.floor(Math.random() * TILE_IMAGES.length);
        }
    }
}

backgroundImage.onload = checkAllImagesLoaded;
