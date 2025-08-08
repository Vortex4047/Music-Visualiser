// Main entry point for the AI Music Visualizer

// Global variables
let audioContext;
let audioHandler;
let aiAnalyzer;
let visualizer;
let uiManager;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize components
        audioHandler = new AudioHandler();
        aiAnalyzer = new AIAnalyzer();
        visualizer = new Visualizer();
        uiManager = new UIManager();
        
        // Show loading spinner during initialization
        uiManager.showLoading('Initializing application...');
        
        // Set up event listeners
        setupEventListeners();
        
        // Initialize the visualization
        await visualizer.init();
        
        console.log('AI Music Visualizer initialized successfully');
        uiManager.showStatus('Ready to visualize music');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        uiManager.showError('Failed to initialize application: ' + error.message);
    }
});

// Set up event listeners for UI elements
function setupEventListeners() {
    // File upload button
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', async (event) => {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            await handleAudioFile(file);
        }
    });
    
    // Microphone button
    const micBtn = document.getElementById('mic-btn');
    micBtn.addEventListener('click', async () => {
        // Check if we're already listening to microphone
        if (micBtn.classList.contains('active')) {
            // Stop microphone input
            audioHandler.stopMicrophone();
            uiManager.toggleMicrophoneButton(false);
            uiManager.showStatus('Microphone stopped');
        } else {
            // Start microphone input
            await handleMicrophoneInput();
        }
    });
}

// Handle audio file input
async function handleAudioFile(file) {
    try {
        uiManager.showLoading('Loading audio file...');
        
        // Process the audio file
        const audioBuffer = await audioHandler.loadAudioFile(file);
        
        // Analyze the audio with AI
        uiManager.showLoading('Analyzing audio with AI...');
        const analysis = await aiAnalyzer.analyzeAudio(audioBuffer);
        
        // Update UI with analysis results
        uiManager.updateGenreDisplay(analysis.genre);
        uiManager.showLoading('Playing audio and visualizing...');
        
        // Play the audio and start visualization
        await audioHandler.playAudio(audioBuffer, (currentTime) => {
            // Get audio data for visualization
            const audioData = audioHandler.getAudioData();
            
            // Add pulse effect to visualization container
            uiManager.addPulseEffect();
            
            // Update visualization in real-time
            visualizer.update(analysis, currentTime, audioData);
            
            // Update beat display
            uiManager.updateBeatDisplay(analysis.beat);
        });
    } catch (error) {
        console.error('Error processing audio file:', error);
        uiManager.showError('Error processing audio file: ' + error.message);
    }
}

// Handle microphone input
async function handleMicrophoneInput() {
    try {
        uiManager.showLoading('Accessing microphone...');
        
        // Get microphone input
        const stream = await audioHandler.getMicrophoneInput();
        
        // Update UI to show that microphone is active
        uiManager.toggleMicrophoneButton(true);
        
        // Start real-time analysis and visualization
        uiManager.showLoading('Analyzing microphone input...');
        await audioHandler.analyzeMicrophoneStream(stream, async (audioData) => {
            // Analyze the audio data with AI
            const analysis = await aiAnalyzer.analyzeAudioData(audioData);
            
            // Update UI with analysis results
            uiManager.updateGenreDisplay(analysis.genre);
            uiManager.updateBeatDisplay(analysis.beat);
            
            // Add pulse effect to visualization container
            uiManager.addPulseEffect();
            
            // Update visualization
            visualizer.update(analysis, audioData.timestamp, audioData);
        });
    } catch (error) {
        console.error('Error accessing microphone:', error);
        uiManager.showError('Error accessing microphone: ' + error.message);
        // Remove pulse effect if there's an error
        uiManager.removePulseEffect();
        // Update UI to show that microphone is inactive
        uiManager.toggleMicrophoneButton(false);
    }
}

// Handle window resize for responsive visualization
window.addEventListener('resize', () => {
    if (visualizer) {
        visualizer.handleResize();
    }
});


// --- ENHANCEMENTS: UI wiring ---
document.addEventListener('DOMContentLoaded', () => {
    const visualMode = document.getElementById('visual-mode');
    const micToggle = document.getElementById('mic-toggle');
    const recordBtn = document.getElementById('record-btn');
    const screenshotBtn = document.getElementById('screenshot-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // Assume existing global app or audioController objects; otherwise create minimal hooks
    const audioController = window.audioController || window.AudioControllerInstance || null;
    const canvas = document.querySelector('canvas') || document.getElementById('visual-canvas') || document.body.querySelector('canvas');

    let threeViz = null;
    let recorder = null;

    visualMode && visualMode.addEventListener('change', (e) => {
        const mode = e.target.value;
        if (mode === 'three') {
            // create three visualizer attached to body (or container)
            if (!threeViz) {
                const analyser = (audioController && audioController.analyser) ? audioController.analyser : (window.analyserNode || null);
                threeViz = new ThreeVisualizer(document.body, analyser);
            }
            // hide canvas visuals if any
            const canvasEl = document.querySelector('canvas');
            if (canvasEl) canvasEl.style.display = 'none';
        } else {
            if (threeViz) { threeViz.destroy(); threeViz = null; }
            const canvasEl = document.querySelector('canvas');
            if (canvasEl) canvasEl.style.display = '';
        }
    });

    micToggle && micToggle.addEventListener('click', async () => {
        // toggle microphone usage - attempt to getUserMedia and connect to existing audio controller
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (window.audioController && window.audioController.useMicStream) {
                window.audioController.useMicStream(stream);
            } else if (window.AudioControllerInstance && window.AudioControllerInstance.useMicStream) {
                window.AudioControllerInstance.useMicStream(stream);
            } else {
                // basic connect: create AudioContext and Analyser and attach to window for visualizers
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const src = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 2048;
                src.connect(analyser);
                window.analyserNode = analyser;
                alert('Microphone connected — switch visual mode to see it.');
            }
        } catch (e) {
            console.error(e);
            alert('Could not access microphone: ' + e.message);
        }
    });

    recordBtn && recordBtn.addEventListener('click', () => {
        if (!recorder) {
            const canvasEl = document.querySelector('canvas') || document.body.querySelector('canvas');
            recorder = new VisualRecorder(canvasEl || document.body);
            recorder.start();
            recordBtn.textContent = 'Stop Recording';
        } else {
            recorder.stop();
            recorder = null;
            recordBtn.textContent = 'Record';
        }
    });

    screenshotBtn && screenshotBtn.addEventListener('click', () => {
        const canvasEl = document.querySelector('canvas');
        if (!canvasEl) {
            alert('No canvas found to screenshot.');
            return;
        }
        const dataURL = canvasEl.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'visualizer-screenshot.png';
        link.click();
    });

    themeToggle && themeToggle.addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-theme', e.target.value);
    });
});
// --- END ENHANCEMENTS ---
