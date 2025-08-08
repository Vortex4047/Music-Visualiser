// app.js - Enhanced version with playlist and multi-file support
import { CanvasVisualizer } from './canvas-visualizer.js';
import { PlaylistManager } from './playlist-manager.js';

// Simple audio controller that just works
class AudioController {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.audio = null;
        this.equalizer = null;
    }

    async initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    async loadFile(file) {
        await this.initAudioContext();
        const url = URL.createObjectURL(file);
        
        this.stop();
        
        this.audio = new Audio(url);
        this.audio.crossOrigin = 'anonymous';
        
        // Wait for the audio to load
        await new Promise((resolve, reject) => {
            this.audio.addEventListener('canplaythrough', resolve);
            this.audio.addEventListener('error', reject);
            this.audio.load();
        });
        
        // Create media element source
        this.source = this.audioContext.createMediaElementSource(this.audio);
        
        // Create analyser
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        
        // Connect audio chain with equalizer if available
        this.connectAudioChain();
        
        // Auto play
        try {
            await this.audio.play();
        } catch (e) {
            console.log('Autoplay blocked, will play on user interaction');
        }
        
        return { audio: this.audio, analyser: this.analyser, file: file };
    }
    
    connectAudioChain() {
        if (!this.source || !this.analyser) return;
        
        // Disconnect existing connections
        try {
            this.source.disconnect();
            this.analyser.disconnect();
        } catch (e) {
            // Ignore disconnection errors
        }
        
        // Check if equalizer is available and initialized
        if (this.equalizer && this.equalizer.getInputNode && this.equalizer.getOutputNode) {
            console.log('🎛️ Connecting audio chain with equalizer');
            // Connect: source -> equalizer -> analyser -> destination
            this.source.connect(this.equalizer.getInputNode());
            this.equalizer.getOutputNode().connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        } else {
            console.log('🔊 Connecting audio chain without equalizer');
            // Connect: source -> analyser -> destination
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        }
    }
    
    setEqualizer(equalizer) {
        this.equalizer = equalizer;
        // Reconnect audio chain if audio is loaded
        if (this.source && this.analyser) {
            console.log('🔄 Reconnecting audio chain with new equalizer');
            this.connectAudioChain();
        }
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
    }
}

// Simple visualizer manager
class VisualizerManager {
    constructor() {
        this.currentVisualizer = null;
        this.canvasVisualizer = null;
        this.currentMode = 'canvas';
        this.canvas = document.getElementById('visualizer');
        this.analyser = null;
        
        // Initialize canvas visualizer
        this.canvasVisualizer = new CanvasVisualizer(this.canvas);
        this.currentVisualizer = this.canvasVisualizer;
    }

    switchMode(mode) {
        if (this.currentMode === mode) return;
        
        this.currentMode = mode;
        this.canvas.style.display = 'block';
        
        if (this.currentVisualizer && this.currentVisualizer.stop) {
            this.currentVisualizer.stop();
        }
        
        this.currentVisualizer = this.canvasVisualizer;
        this.canvasVisualizer.setMode(mode);
        
        if (this.analyser) {
            this.canvasVisualizer.connectAnalyser(this.analyser);
        }
        this.canvasVisualizer.start();
    }
    
    connectAnalyser(analyser) {
        this.analyser = analyser;
        if (this.currentVisualizer && this.currentVisualizer.connectAnalyser) {
            this.currentVisualizer.connectAnalyser(analyser);
        }
    }
    
    disconnectAnalyser() {
        this.analyser = null;
        if (this.currentVisualizer && this.currentVisualizer.disconnectAnalyser) {
            this.currentVisualizer.disconnectAnalyser();
        }
    }
}

// Simple theme manager
class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.initializeTheme();
    }
    
    initializeTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        document.body.className = `theme-${this.currentTheme}`;
    }
    
    switchTheme(theme) {
        if (this.currentTheme === theme) return;
        
        this.currentTheme = theme;
        document.body.classList.remove('theme-dark', 'theme-light', 'theme-neon');
        document.body.classList.add(`theme-${theme}`);
        document.documentElement.setAttribute('data-theme', theme);
    }
}

// Simple track info manager
class TrackInfoManager {
    constructor() {
        this.trackInfo = document.getElementById('track-info');
        this.trackTitle = document.getElementById('track-title');
        this.trackArtist = document.getElementById('track-artist');
    }
    
    displayTrackInfo(file, audio) {
        if (!this.trackInfo || !this.trackTitle || !this.trackArtist) return;
        
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        let title = 'Unknown Track';
        let artist = 'Unknown Artist';
        
        if (fileName.includes(' - ')) {
            const parts = fileName.split(' - ');
            if (parts.length >= 2) {
                artist = parts[0].trim();
                title = parts.slice(1).join(' - ').trim();
            }
        } else {
            title = fileName;
        }
        
        this.trackTitle.textContent = title;
        this.trackArtist.textContent = artist;
        this.trackInfo.style.display = 'flex';
    }
    
    hideTrackInfo() {
        if (this.trackInfo) {
            this.trackInfo.style.display = 'none';
        }
    }
}

// Main app controller
class AppController {
    constructor() {
        this.audioController = new AudioController();
        this.visualizerManager = new VisualizerManager();
        this.themeManager = new ThemeManager();
        this.trackInfoManager = new TrackInfoManager();
        this.playlistManager = new PlaylistManager();
        this.equalizerManager = null;
        this.searchManager = null;
        this.micStream = null;
        this.isRecording = false;
        
        // Connect playlist manager to other controllers
        this.playlistManager.setControllers(
            this.audioController, 
            this.visualizerManager, 
            this.trackInfoManager
        );
        
        this.initializeEventListeners();
        this.initializeManagers();
        console.log('✅ Enhanced app with playlist initialized');
    }
    
    initializeEventListeners() {
        // File upload
        const fileInput = document.getElementById('file-input');
        const uploadBtn = document.getElementById('upload-btn');
        
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => {
                console.log('Upload button clicked');
                fileInput.click();
            });
            
            fileInput.addEventListener('change', async (e) => {
                console.log('File input changed');
                await this.handleFileUpload(e);
            });
        }
        
        // Play/Pause button
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                console.log('Play/Pause button clicked');
                this.togglePlayPause();
            });
        }
        
        // Audio control buttons
        const skipBackwardBtn = document.getElementById('skip-backward');
        const rewindBtn = document.getElementById('rewind-btn');
        const forwardBtn = document.getElementById('forward-btn');
        const skipForwardBtn = document.getElementById('skip-forward');
        
        if (skipBackwardBtn) {
            skipBackwardBtn.addEventListener('click', () => {
                console.log('Skip backward clicked');
                this.skipToStart();
            });
        }
        
        if (rewindBtn) {
            rewindBtn.addEventListener('click', () => {
                console.log('Rewind clicked');
                this.rewind();
            });
        }
        
        if (forwardBtn) {
            forwardBtn.addEventListener('click', () => {
                console.log('Forward clicked');
                this.fastForward();
            });
        }
        
        if (skipForwardBtn) {
            skipForwardBtn.addEventListener('click', () => {
                console.log('Skip forward clicked');
                this.skipToEnd();
            });
        }
        
        // Volume control
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                console.log('Volume changed to:', e.target.value);
                this.setVolume(e.target.value / 100);
            });
        }
        
        // Progress bar seeking
        const progressBar = document.getElementById('progress-bar-container');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                console.log('Progress bar clicked');
                this.seekToPosition(e);
            });
        }
        
        // Microphone
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.addEventListener('click', () => {
                console.log('Mic button clicked');
                this.toggleMicrophone();
            });
        }
        
        // Playlist button
        const playlistBtn = document.getElementById('playlist-btn');
        const playlistModal = document.getElementById('playlist-modal');
        const closePlaylist = document.getElementById('close-playlist');
        
        if (playlistBtn && playlistModal) {
            playlistBtn.addEventListener('click', () => {
                console.log('Playlist button clicked');
                playlistModal.style.display = 'flex';
            });
        }
        
        if (closePlaylist && playlistModal) {
            closePlaylist.addEventListener('click', () => {
                playlistModal.style.display = 'none';
            });
        }
        
        // Search button
        const searchBtn = document.getElementById('search-btn');
        const searchModal = document.getElementById('search-modal');
        const closeSearch = document.getElementById('close-search');
        
        if (searchBtn && searchModal) {
            searchBtn.addEventListener('click', () => {
                console.log('Search button clicked');
                searchModal.style.display = 'flex';
            });
        }
        
        if (closeSearch && searchModal) {
            closeSearch.addEventListener('click', () => {
                searchModal.style.display = 'none';
            });
        }
        
        // Visual mode switcher
        const visualModeSelect = document.getElementById('visual-mode');
        if (visualModeSelect) {
            visualModeSelect.addEventListener('change', (e) => {
                console.log('Visual mode changed to:', e.target.value);
                this.visualizerManager.switchMode(e.target.value);
            });
        }
        
        // Theme switcher
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                console.log('Theme changed to:', e.target.value);
                this.themeManager.switchTheme(e.target.value);
            });
        }
        
        // Recording
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                console.log('Record button clicked');
                this.toggleRecording();
            });
        }
        
        // Screenshot
        const screenshotBtn = document.getElementById('screenshot-btn');
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', () => {
                console.log('Screenshot button clicked');
                this.takeScreenshot();
            });
        }
        
        console.log('Event listeners initialized');
    }
    
    initializeManagers() {
        // Initialize EQ manager when EQ classes are available
        const initEqualizer = () => {
            if (window.EqualizerManager && !this.equalizerManager) {
                this.equalizerManager = new window.EqualizerManager(this.audioController);
                console.log('🎛️ EQ Manager initialized');
                
                // Ensure the equalizer is connected if audio is already loaded
                if (this.audioController.audioContext && this.audioController.source) {
                    console.log('🔄 Reconnecting equalizer to existing audio');
                    if (this.equalizerManager.equalizer) {
                        this.audioController.setEqualizer(this.equalizerManager.equalizer);
                    }
                }
                return true;
            }
            return false;
        };
        
        if (!initEqualizer()) {
            // Retry multiple times with increasing delays
            let attempts = 0;
            const retryEQ = () => {
                attempts++;
                if (initEqualizer() || attempts > 10) {
                    return;
                }
                setTimeout(retryEQ, 100 * attempts); // Increasing delay
            };
            setTimeout(retryEQ, 100);
        }
        
        // Initialize Search manager
        if (window.SearchManager) {
            this.searchManager = new window.SearchManager();
            console.log('🔍 Search Manager initialized');
        } else {
            // Retry after a short delay
            setTimeout(() => {
                if (window.SearchManager) {
                    this.searchManager = new window.SearchManager();
                    console.log('🔍 Search Manager initialized (delayed)');
                }
            }, 100);
        }
    }
    
    async handleFileUpload(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        console.log(`Processing ${files.length} file(s)`);
        
        // Convert FileList to Array
        const fileArray = Array.from(files);
        
        // Separate ZIP files from audio files
        const zipFiles = fileArray.filter(f => f.name.toLowerCase().endsWith('.zip'));
        const audioFiles = fileArray.filter(f => 
            this.playlistManager.isAudioFile(f) || f.type.startsWith('audio/')
        );
        
        if (files.length === 1 && audioFiles.length === 1) {
            // Single audio file - play immediately
            const file = audioFiles[0];
            console.log('Loading single file:', file.name);
            
            try {
                const res = await this.audioController.loadFile(file);
                this.visualizerManager.connectAnalyser(res.analyser);
                this.trackInfoManager.displayTrackInfo(file, res.audio);
                
                // Set up audio event listeners
                this.setupAudioEventListeners(res.audio);
                
                // Initial button state update
                this.updatePlayPauseButton();
                
                const uploadBtn = document.getElementById('upload-btn');
                if (uploadBtn) {
                    uploadBtn.textContent = `Playing: ${file.name.substring(0, 20)}...`;
                }
                
                console.log('File loaded successfully');
            } catch (error) {
                console.error('Error loading audio file:', error);
                alert('Error loading audio file. Please try a different file.');
            }
        } else {
            // Multiple files or ZIP files - add to playlist
            if (zipFiles.length > 0) {
                for (const zipFile of zipFiles) {
                    await this.playlistManager.handleZipFile(zipFile);
                }
            }
            
            if (audioFiles.length > 0) {
                await this.playlistManager.handleMultipleFiles(audioFiles);
            }
            
            // Show playlist modal after adding files
            const playlistModal = document.getElementById('playlist-modal');
            if (playlistModal) {
                playlistModal.style.display = 'flex';
            }
            
            const uploadBtn = document.getElementById('upload-btn');
            if (uploadBtn) {
                uploadBtn.textContent = `Added ${audioFiles.length + zipFiles.length} file(s) to playlist`;
                setTimeout(() => {
                    uploadBtn.textContent = 'Upload Music';
                }, 3000);
            }
        }
        
        // Clear the file input
        e.target.value = '';
    }
    
    async toggleMicrophone() {
        const micBtn = document.getElementById('mic-btn');
        if (!micBtn) return;
        
        if (this.micStream) {
            // Stop microphone
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
            micBtn.textContent = 'Use Microphone';
            micBtn.classList.remove('active');
            this.visualizerManager.disconnectAnalyser();
            this.trackInfoManager.hideTrackInfo();
            console.log('Microphone stopped');
            return;
        }
        
        try {
            await this.audioController.initAudioContext();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.micStream = stream;
            
            const micSource = this.audioController.audioContext.createMediaStreamSource(stream);
            const analyser = this.audioController.audioContext.createAnalyser();
            analyser.fftSize = 2048;
            micSource.connect(analyser);
            
            this.visualizerManager.connectAnalyser(analyser);
            this.trackInfoManager.hideTrackInfo();
            
            micBtn.textContent = 'Stop Microphone';
            micBtn.classList.add('active');
            console.log('Microphone started');
            
        } catch (error) {
            console.error('Microphone access error:', error);
            alert('Microphone access denied or not available: ' + error.message);
        }
    }
    
    toggleRecording() {
        const recordBtn = document.getElementById('record-btn');
        if (!recordBtn) return;
        
        if (this.isRecording) {
            this.isRecording = false;
            recordBtn.textContent = '⏺ Record';
            recordBtn.classList.remove('active');
            console.log('Recording stopped');
        } else {
            this.isRecording = true;
            recordBtn.textContent = '⏹ Stop Recording';
            recordBtn.classList.add('active');
            console.log('Recording started');
        }
    }
    
    togglePlayPause() {
        const audio = this.audioController.audio;
        if (!audio) {
            console.log('No audio loaded');
            alert('Please load an audio file first');
            return;
        }
        
        try {
            if (audio.paused) {
                console.log('Playing audio');
                audio.play();
            } else {
                console.log('Pausing audio');
                audio.pause();
            }
            this.updatePlayPauseButton();
        } catch (error) {
            console.error('Error toggling play/pause:', error);
        }
    }
    
    updatePlayPauseButton() {
        const playPauseBtn = document.getElementById('play-pause-btn');
        const audio = this.audioController.audio;
        
        if (!playPauseBtn || !audio) return;
        
        if (audio.paused) {
            playPauseBtn.textContent = '▶️';
            playPauseBtn.classList.remove('playing');
            console.log('Button updated to play state');
        } else {
            playPauseBtn.textContent = '⏸️';
            playPauseBtn.classList.add('playing');
            console.log('Button updated to pause state');
        }
    }
    
    // Audio control methods
    skipToStart() {
        const audio = this.audioController.audio;
        if (!audio) return;
        
        audio.currentTime = 0;
        console.log('Skipped to start');
    }
    
    rewind() {
        const audio = this.audioController.audio;
        if (!audio) return;
        
        audio.currentTime = Math.max(0, audio.currentTime - 10);
        console.log('Rewound 10 seconds');
    }
    
    fastForward() {
        const audio = this.audioController.audio;
        if (!audio || !audio.duration) return;
        
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
        console.log('Fast forwarded 10 seconds');
    }
    
    skipToEnd() {
        const audio = this.audioController.audio;
        if (!audio || !audio.duration) return;
        
        audio.currentTime = audio.duration - 1;
        console.log('Skipped to end');
    }
    
    setVolume(volume) {
        const audio = this.audioController.audio;
        if (!audio) return;
        
        audio.volume = Math.max(0, Math.min(1, volume));
        
        // Update volume display
        const volumeValue = document.querySelector('.volume-value');
        if (volumeValue) {
            volumeValue.textContent = `${Math.round(audio.volume * 100)}%`;
        }
        
        console.log('Volume set to:', Math.round(audio.volume * 100) + '%');
    }
    
    seekToPosition(event) {
        const audio = this.audioController.audio;
        if (!audio || !audio.duration) return;
        
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const width = rect.width;
        const clickPercent = clickX / width;
        
        audio.currentTime = clickPercent * audio.duration;
        console.log('Seeked to:', Math.round(clickPercent * 100) + '%');
    }
    
    setupAudioEventListeners(audio) {
        // Remove existing listeners if any
        if (this.audioEventListeners) {
            this.audioEventListeners.forEach(({event, listener}) => {
                audio.removeEventListener(event, listener);
            });
        }
        
        this.audioEventListeners = [];
        
        // Play event
        const playListener = () => {
            console.log('Audio started playing');
            this.updatePlayPauseButton();
        };
        audio.addEventListener('play', playListener);
        this.audioEventListeners.push({event: 'play', listener: playListener});
        
        // Pause event  
        const pauseListener = () => {
            console.log('Audio paused');
            this.updatePlayPauseButton();
        };
        audio.addEventListener('pause', pauseListener);
        this.audioEventListeners.push({event: 'pause', listener: pauseListener});
        
        // Ended event
        const endedListener = () => {
            console.log('Audio ended');
            this.updatePlayPauseButton();
        };
        audio.addEventListener('ended', endedListener);
        this.audioEventListeners.push({event: 'ended', listener: endedListener});
        
        // Time update event for progress tracking
        const timeUpdateListener = () => {
            this.updateProgressBar();
            this.updateTimeDisplay();
        };
        audio.addEventListener('timeupdate', timeUpdateListener);
        this.audioEventListeners.push({event: 'timeupdate', listener: timeUpdateListener});
        
        // Duration change event
        const durationChangeListener = () => {
            this.updateTimeDisplay();
        };
        audio.addEventListener('durationchange', durationChangeListener);
        this.audioEventListeners.push({event: 'durationchange', listener: durationChangeListener});
        
        // Set initial volume
        audio.volume = 0.8;
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.value = 80;
        }
        const volumeValue = document.querySelector('.volume-value');
        if (volumeValue) {
            volumeValue.textContent = '80%';
        }
    }
    
    updateProgressBar() {
        const audio = this.audioController.audio;
        const progressFill = document.getElementById('progress-fill');
        
        if (!audio || !progressFill || !audio.duration) return;
        
        const progress = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${progress}%`;
    }
    
    updateTimeDisplay() {
        const audio = this.audioController.audio;
        const currentTimeEl = document.getElementById('current-time');
        const totalTimeEl = document.getElementById('total-time');
        
        if (!audio || !currentTimeEl || !totalTimeEl) return;
        
        currentTimeEl.textContent = this.formatTime(audio.currentTime || 0);
        totalTimeEl.textContent = this.formatTime(audio.duration || 0);
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    takeScreenshot() {
        try {
            const canvas = document.getElementById('visualizer');
            if (canvas) {
                const dataURL = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `visualizer-screenshot-${Date.now()}.png`;
                link.href = dataURL;
                link.click();
                
                const screenshotBtn = document.getElementById('screenshot-btn');
                if (screenshotBtn) {
                    screenshotBtn.classList.add('clicked');
                    setTimeout(() => screenshotBtn.classList.remove('clicked'), 200);
                }
                console.log('Screenshot taken');
            }
        } catch (error) {
            console.error('Screenshot error:', error);
            alert('Unable to take screenshot. Please try again.');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    const app = new AppController();
    window.app = app; // For debugging
});
