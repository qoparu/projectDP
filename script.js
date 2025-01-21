const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// Tool settings
let isDrawing = false;
let strokeColor = '#000000'; // Default color
let lineWidth = 5; // Default line width
let isEraser = false;

// DOM elements for tools
const colorPicker = document.getElementById('colorPicker');
const lineWidthRange = document.getElementById('lineWidth');
const eraserButton = document.getElementById('eraser');
const clearCanvasButton = document.getElementById('clearCanvas');

// History for undo functionality
let history = [];
let currentStep = -1;

// Save canvas state to history
function saveState() {
    if (currentStep < history.length - 1) {
        history = history.slice(0, currentStep + 1); // Remove future states
    }
    history.push(canvas.toDataURL());
    currentStep++;
}

// Undo functionality
function undo() {
    if (currentStep > 0) {
        currentStep--;
        const img = new Image();
        img.src = history[currentStep];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
}

// Drawing events
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    saveState(); // Save state before starting a new stroke
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        ctx.strokeStyle = isEraser ? '#FFFFFF' : strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    ctx.closePath();
});

// Tool event listeners
colorPicker.addEventListener('input', (e) => {
    strokeColor = e.target.value;
    isEraser = false; // Turn off eraser when color is picked
});

lineWidthRange.addEventListener('input', (e) => {
    lineWidth = e.target.value;
});

eraserButton.addEventListener('click', () => {
    isEraser = true; // Switch to eraser
});

clearCanvasButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState(); // Save the cleared state
});

// Hotkey for undo (Ctrl+Z)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        undo();
    }
});

const socket = new WebSocket('ws://localhost:8080/ws');

// Send drawing data to the server
function sendDrawingData(x, y, color, lineWidth, isEraser) {
    const message = { x, y, color, lineWidth, isEraser };
    socket.send(JSON.stringify(message));
}

// Receive drawing data from the server
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    ctx.strokeStyle = data.isEraser ? '#FFFFFF' : data.color;
    ctx.lineWidth = data.lineWidth;
    ctx.beginPath();
    ctx.moveTo(data.x, data.y); // Assume the server sends line start coordinates
    ctx.stroke();
};