// UI Manager for AI Music Visualizer
// Handles updating the user interface elements

class UIManager {
    constructor() {
        this.currentGenre = 'Unknown';
        this.currentBeat = 0;
        this.genreDisplay = document.getElementById('current-genre');
        this.beatDisplay = document.getElementById('current-beat');
        this.statusElement = null;
        this.errorElement = null;
    }

    // Update the genre display
    updateGenreDisplay(genre) {
        if (genre !== this.currentGenre) {
            this.currentGenre = genre;
            this.genreDisplay.textContent = genre;
            
            // Update the body class for genre-specific styling
            document.body.className = '';
            document.body.classList.add(`genre-${genre}`);
        }
    }

    // Update the beat display
    updateBeatDisplay(beat) {
        if (beat && beat.strength !== this.currentBeat) {
            this.currentBeat = beat.strength;
            this.beatDisplay.textContent = beat.strength.toFixed(2);
            
            // Add visual feedback for strong beats
            if (beat.strength > 0.7) {
                this.beatDisplay.classList.add('strong-beat');
                setTimeout(() => {
                    this.beatDisplay.classList.remove('strong-beat');
                }, 100);
            }
        }
    }

    // Show status message
    showStatus(message) {
        // Remove any existing error messages
        this.hideError();
        
        // Create or update status element
        if (!this.statusElement) {
            this.statusElement = document.createElement('div');
            this.statusElement.id = 'status-message';
            this.statusElement.className = 'status-message';
            document.body.appendChild(this.statusElement);
        }
        
        this.statusElement.textContent = message;
        this.statusElement.className = 'status-message';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (this.statusElement) {
                this.statusElement.remove();
                this.statusElement = null;
            }
        }, 3000);
    }

    // Show loading spinner
    showLoading(message = 'Loading...') {
        // Remove any existing error messages
        this.hideError();
        
        // Create or update status element with spinner
        if (!this.statusElement) {
            this.statusElement = document.createElement('div');
            this.statusElement.id = 'status-message';
            this.statusElement.className = 'status-message';
            document.body.appendChild(this.statusElement);
        }
        
        // Add spinner and message
        this.statusElement.innerHTML = `
            <div class="spinner"></div>
            <div>${message}</div>
        `;
        this.statusElement.className = 'status-message';
    }

    // Show error message
    showError(message) {
        // Remove any existing status messages
        if (this.statusElement) {
            this.statusElement.remove();
            this.statusElement = null;
        }
        
        // Create or update error element
        if (!this.errorElement) {
            this.errorElement = document.createElement('div');
            this.errorElement.id = 'error-message';
            this.errorElement.className = 'error-message';
            document.body.appendChild(this.errorElement);
        }
        
        this.errorElement.textContent = message;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (this.errorElement) {
                this.errorElement.remove();
                this.errorElement = null;
            }
        }, 5000);
    }

    // Hide error message
    hideError() {
        if (this.errorElement) {
            this.errorElement.remove();
            this.errorElement = null;
        }
    }

    // Update visualization info display
    updateVisualizationInfo(analysis) {
        // Update genre display
        this.updateGenreDisplay(analysis.genre);
        
        // Update beat display
        this.updateBeatDisplay(analysis.beat);
    }

    // Hide loading indicator
    hideLoading() {
        if (this.statusElement) {
            this.statusElement.remove();
            this.statusElement = null;
        }
    }

    // Toggle microphone button state
    toggleMicrophoneButton(active) {
        const micBtn = document.getElementById('mic-btn');
        if (active) {
            micBtn.textContent = 'Stop Microphone';
            micBtn.classList.add('active');
        } else {
            micBtn.textContent = 'Use Microphone';
            micBtn.classList.remove('active');
        }
    }

    // Toggle upload button state
    toggleUploadButton(disabled) {
        const uploadBtn = document.getElementById('upload-btn');
        uploadBtn.disabled = disabled;
        
        if (disabled) {
            uploadBtn.classList.add('disabled');
        } else {
            uploadBtn.classList.remove('disabled');
        }
    }

    // Update file input label
    updateFileInputLabel(text) {
        const uploadBtn = document.getElementById('upload-btn');
        uploadBtn.textContent = text;
    }

    // Show/hide visualization container
    toggleVisualizationContainer(show) {
        const container = document.querySelector('.visualization-container');
        if (show) {
            container.style.display = 'flex';
        } else {
            container.style.display = 'none';
        }
    }

    // Add visual feedback to buttons
    addButtonFeedback(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.add('clicked');
            setTimeout(() => {
                button.classList.remove('clicked');
            }, 200);
        }
    }

    // Add pulse effect to visualization container
    addPulseEffect() {
        const container = document.querySelector('.visualization-container');
        if (container) {
            container.classList.add('pulse');
        }
    }

    // Remove pulse effect from visualization container
    removePulseEffect() {
        const container = document.querySelector('.visualization-container');
        if (container) {
            container.classList.remove('pulse');
        }
    }

    // Update progress indicator
    updateProgress(percent) {
        // Create progress element if it doesn't exist
        let progressElement = document.getElementById('progress-bar');
        if (!progressElement) {
            progressElement = document.createElement('div');
            progressElement.id = 'progress-bar';
            progressElement.className = 'progress-bar';
            document.body.appendChild(progressElement);
        }
        
        // Update progress
        progressElement.style.width = `${percent}%`;
        
        // Hide when complete
        if (percent >= 100) {
            setTimeout(() => {
                if (progressElement) {
                    progressElement.remove();
                }
            }, 500);
        }
    }
}

// Add CSS for status and error messages
const style = document.createElement('style');
style.textContent = `
    .status-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(37, 117, 252, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 30px;
        font-size: 0.9rem;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        animation: fadeInOut 0.3s ease;
    }
    
    .error-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 45, 117, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 30px;
        font-size: 0.9rem;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        animation: fadeInOut 0.3s ease;
    }
    
    .progress-bar {
        position: fixed;
        top: 0;
        left: 0;
        height: 4px;
        background: linear-gradient(90deg, #6a11cb, #2575fc);
        transition: width 0.3s ease;
        z-index: 1001;
    }
    
    .strong-beat {
        color: #ff2d75;
        font-weight: bold;
        transform: scale(1.2);
        transition: all 0.1s ease;
    }
    
    .btn.clicked {
        transform: scale(0.95);
        transition: transform 0.1s ease;
    }
    
    .btn.active {
        background: linear-gradient(90deg, #ff416c, #ff4b2b);
        box-shadow: 0 4px 15px rgba(255, 65, 108, 0.3);
    }
    
    .btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-20px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);