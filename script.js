// Get references to all necessary HTML elements
const video = document.getElementById('cameraFeed');
const leftCanvas = document.getElementById('leftCanvas');
const rightCanvas = document.getElementById('rightCanvas');
const leftCtx = leftCanvas.getContext('2d', { willReadFrequently: true });
const rightCtx = rightCanvas.getContext('2d', { willReadFrequently: true });
const controls = document.getElementById('controls');
const startupScreen = document.getElementById('startupScreen');
const startButton = document.getElementById('startButton');
const statusMessage = document.getElementById('statusMessage');

// Color matrices (no changes)
const colorMatrices = {
    normal: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
    deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
    tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525]
};
let currentFilter = 'normal';

// This function will be called when the user clicks the start button
async function initializeCamera() {
    statusMessage.textContent = 'Requesting camera access...';
    startButton.disabled = true; // Prevent multiple clicks

    try {
        // 1. Get the camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        video.srcObject = stream;
        
        // 2. IMPORTANT: Explicitly call play() on the video element.
        // This is the key fix. We await it to make sure it starts.
        await video.play();

        statusMessage.textContent = 'Camera is running!';

        // 3. Set canvas dimensions now that the video is playing
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        leftCanvas.width = videoWidth;
        leftCanvas.height = videoHeight;
        rightCanvas.width = videoWidth;
        rightCanvas.height = videoHeight;

        // 4. Hide the startup screen
        startupScreen.style.display = 'none';
        
        // 5. Start the processing loop
        requestAnimationFrame(processFrame);

    } catch (err) {
        // 6. Provide detailed error feedback if something goes wrong
        console.error("An error occurred:", err); // Log the full error for debugging
        if (err.name === "NotAllowedError") {
            statusMessage.textContent = "Camera access was denied. Please check your browser's site settings.";
        } else if (err.name === "NotFoundError") {
            statusMessage.textContent = "No camera was found. Make sure a camera is connected and enabled.";
        } else {
            statusMessage.textContent = `An error occurred: ${err.name}. Please check the console for details.`;
        }
        startButton.disabled = false; // Re-enable the button if it failed
    }
}

// Function to process each frame (no changes needed)
function processFrame() {
    if (video.paused || video.ended) return;
    
    leftCtx.drawImage(video, 0, 0, leftCanvas.width, leftCanvas.height);
    const imageData = leftCtx.getImageData(0, 0, leftCanvas.width, leftCanvas.height);
    const data = imageData.data;
    const matrix = colorMatrices[currentFilter];

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        data[i] = r * matrix[0] + g * matrix[1] + b * matrix[2];
        data[i + 1] = r * matrix[3] + g * matrix[4] + b * matrix[5];
        data[i + 2] = r * matrix[6] + g * matrix[7] + b * matrix[8];
    }

    leftCtx.putImageData(imageData, 0, 0);
    rightCtx.putImageData(imageData, 0, 0);

    requestAnimationFrame(processFrame);
}

// Event listeners (no changes)
startButton.addEventListener('click', initializeCamera);
controls.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        currentFilter = e.target.dataset.filter;
    }
});