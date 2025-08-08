// eq-search-manager.js - Complete EQ and Search functionality

// Audio Equalizer Class
class AudioEqualizer {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.filters = [];
        this.frequencies = [60, 170, 350, 1000, 3000, 8000];
        this.isInitialized = false;
        this.inputNode = null;
        this.outputNode = null;
        
        this.presets = {
            flat: [0, 0, 0, 0, 0, 0],
            rock: [5, 4, -1, -1, 3, 5],
            pop: [2, 4, 7, 5, -1, -2],
            jazz: [4, 2, -2, 2, 4, 5],
            electronic: [6, 4, -2, 2, 4, 6]
        };
    }
    
    initialize() {
        if (this.isInitialized || !this.audioContext) return;
        
        console.log('🎛️ Initializing equalizer...');
        
        // Create input and output gain nodes
        this.inputNode = this.audioContext.createGain();
        this.outputNode = this.audioContext.createGain();
        
        // Create filters for each frequency band
        this.frequencies.forEach((frequency, index) => {
            const filter = this.audioContext.createBiquadFilter();
            
            if (index === 0) {
                filter.type = 'lowshelf';
            } else if (index === this.frequencies.length - 1) {
                filter.type = 'highshelf';
            } else {
                filter.type = 'peaking';
                filter.Q.setValueAtTime(1, this.audioContext.currentTime);
            }
            
            filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            filter.gain.setValueAtTime(0, this.audioContext.currentTime);
            
            this.filters.push(filter);
        });
        
        // Connect filters in series: input -> filter1 -> filter2 -> ... -> output
        this.inputNode.connect(this.filters[0]);
        for (let i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }
        this.filters[this.filters.length - 1].connect(this.outputNode);
        
        this.isInitialized = true;
        console.log('✅ Equalizer initialized with', this.filters.length, 'bands');
    }
    
    getInputNode() {
        if (!this.isInitialized) this.initialize();
        return this.inputNode;
    }
    
    getOutputNode() {
        if (!this.isInitialized) this.initialize();
        return this.outputNode;
    }
    
    setGain(bandIndex, gainValue) {
        if (!this.isInitialized || bandIndex >= this.filters.length) return;
        
        const filter = this.filters[bandIndex];
        const currentTime = this.audioContext.currentTime;
        
        // Smooth transition to avoid audio pops
        filter.gain.setTargetAtTime(gainValue, currentTime, 0.1);
        console.log(`🎚️ EQ Band ${bandIndex} (${this.frequencies[bandIndex]}Hz) set to ${gainValue}dB`);
    }
    
    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;
        
        console.log('🎵 Applying EQ preset:', presetName);
        preset.forEach((gain, index) => {
            this.setGain(index, gain);
        });
        
        // Update UI sliders
        this.updateUISliders(preset);
    }
    
    updateUISliders(values) {
        values.forEach((value, index) => {
            const slider = document.getElementById(`eq-${this.frequencies[index]}`);
            const valueDisplay = slider?.parentElement.querySelector('.eq-value');
            
            if (slider) {
                slider.value = value;
                if (valueDisplay) {
                    valueDisplay.textContent = `${value > 0 ? '+' : ''}${value}dB`;
                }
            }
        });
    }
    
    getCurrentSettings() {
        return this.filters.map(filter => filter.gain.value);
    }
}

// Equalizer UI Manager
class EqualizerManager {
    constructor(audioController) {
        this.audioController = audioController;
        this.equalizer = null;
        this.modal = document.getElementById('equalizer-modal');
        this.isOpen = false;
        this.isConnected = false;
        
        this.initializeEventListeners();
        
        // Aggressively try to initialize equalizer
        this.aggressiveInitialization();
    }
    
    initializeEventListeners() {
        // Modal controls
        const openBtn = document.getElementById('equalizer-btn');
        const closeBtn = document.getElementById('close-eq');
        
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                console.log('🎛️ Equalizer button clicked');
                this.show();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Click outside to close
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.hide();
            });
        }
        
        // Initialize EQ when audio context is available
        this.initializeEqualizer();
        
        // Slider controls
        const frequencies = [60, 170, 350, 1000, 3000, 8000];
        frequencies.forEach((freq, index) => {
            const slider = document.getElementById(`eq-${freq}`);
            const valueDisplay = slider?.parentElement.querySelector('.eq-value');
            
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    if (this.equalizer) {
                        this.equalizer.setGain(index, value);
                    }
                    
                    if (valueDisplay) {
                        valueDisplay.textContent = `${value > 0 ? '+' : ''}${value}dB`;
                    }
                });
                
                // Visual feedback
                slider.addEventListener('mousedown', () => {
                    slider.style.transform = 'scale(1.05)';
                });
                
                slider.addEventListener('mouseup', () => {
                    slider.style.transform = 'scale(1)';
                });
            }
        });
        
        // Preset controls
        const presetButtons = document.querySelectorAll('.eq-preset');
        presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                const preset = button.dataset.preset;
                if (this.equalizer) {
                    this.equalizer.applyPreset(preset);
                }
                
                // Visual feedback
                presetButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Animation
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 150);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hide();
            }
        });
    }
    
    async initializeEqualizer() {
        // Wait for audio context to be available
        if (!this.audioController.audioContext) {
            setTimeout(() => this.initializeEqualizer(), 500);
            return;
        }
        
        if (!this.equalizer) {
            this.equalizer = new AudioEqualizer(this.audioController.audioContext);
            console.log('🎛️ Equalizer created with AudioContext');
            
            // Immediately connect to audio controller
            this.connectToAudio();
        }
    }
    
    connectToAudio() {
        if (!this.equalizer || this.isConnected) return;
        
        try {
            // Set equalizer in audio controller
            if (this.audioController && this.audioController.setEqualizer) {
                this.audioController.setEqualizer(this.equalizer);
                this.isConnected = true;
                console.log('✅ Equalizer connected to audio controller');
            } else {
                console.warn('⚠️ AudioController not available or missing setEqualizer method');
            }
        } catch (error) {
            console.error('❌ Failed to connect equalizer:', error);
        }
    }
    
    show() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.isOpen = true;
            
            // Initialize equalizer if not already done
            if (!this.equalizer && this.audioController.audioContext) {
                this.equalizer = new AudioEqualizer(this.audioController.audioContext);
            }
            
            // Connect to audio if possible
            this.connectToAudio();
            
            // Focus first slider
            const firstSlider = document.querySelector('.eq-slider');
            setTimeout(() => firstSlider?.focus(), 100);
            
            console.log('🎛️ Equalizer modal opened');
        }
    }
    
    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.isOpen = false;
            console.log('🎛️ Equalizer modal closed');
        }
    }
    
    getEqualizer() {
        return this.equalizer;
    }
    
    aggressiveInitialization() {
        // Try immediate initialization
        const tryInit = () => {
            if (this.audioController && !this.equalizer) {
                // Force audio context creation if needed
                if (!this.audioController.audioContext) {
                    this.audioController.initAudioContext().then(() => {
                        this.initializeEqualizer();
                    }).catch(err => {
                        console.log('🎛️ Waiting for user interaction to initialize equalizer');
                    });
                } else {
                    this.initializeEqualizer();
                }
            }
        };
        
        // Try immediately
        tryInit();
        
        // Try again after various delays
        setTimeout(tryInit, 100);
        setTimeout(tryInit, 500);
        setTimeout(tryInit, 1000);
        
        // Try on user interaction
        const initOnInteraction = () => {
            tryInit();
            document.removeEventListener('click', initOnInteraction);
        };
        document.addEventListener('click', initOnInteraction);
    }
}

// Search Functionality
class SearchManager {
    constructor() {
        this.modal = document.getElementById('search-modal');
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-btn-action');
        this.searchResults = document.getElementById('search-results');
        this.searchSource = document.getElementById('search-source');
        this.isOpen = false;
        this.isSearching = false;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Modal controls
        const openBtn = document.getElementById('search-btn');
        const closeBtn = document.getElementById('close-search');
        
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                console.log('🔍 Search button clicked');
                this.show();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Click outside to close
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.hide();
            });
        }
        
        // Search functionality
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => {
                this.performSearch();
            });
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
            
            // Clear results when input is cleared
            this.searchInput.addEventListener('input', (e) => {
                if (e.target.value.trim() === '') {
                    this.clearResults();
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hide();
            }
            // Ctrl+K or Cmd+K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.show();
            }
        });
    }
    
    show() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.isOpen = true;
            
            // Focus search input
            setTimeout(() => {
                if (this.searchInput) {
                    this.searchInput.focus();
                    this.searchInput.select();
                }
            }, 100);
            
            console.log('🔍 Search modal opened');
        }
    }
    
    hide() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.isOpen = false;
            console.log('🔍 Search modal closed');
        }
    }
    
    async performSearch() {
        if (!this.searchInput || this.isSearching) return;
        
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showMessage('Please enter a search term', 'warning');
            return;
        }
        
        const source = this.searchSource?.value || 'youtube';
        
        console.log('🔍 Searching for:', query, 'on', source);
        this.isSearching = true;
        this.showLoading();
        
        try {
            const results = await this.searchMusic(query, source);
            this.displayResults(results);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Search failed. Please try again.');
        } finally {
            this.isSearching = false;
            this.hideLoading();
        }
    }
    
    async searchMusic(query, source) {
        // Search functionality is not implemented yet
        // This would integrate with music APIs like YouTube, Spotify, SoundCloud, etc.
        return new Promise((resolve) => {
            setTimeout(() => {
                // Return empty results with message
                resolve([]);
            }, 800);
        });
    }
    
    displayResults(results) {
        if (!this.searchResults) return;
        
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-empty">
                    <p>🔍 Search Feature Coming Soon</p>
                    <p>Music search will be available in a future update</p>
                    <p>For now, use the file upload feature to add your music</p>
                </div>
            `;
            return;
        }
        
        const resultsHTML = results.map(result => `
            <div class="search-result-item" data-url="${result.url}">
                <div class="result-thumbnail">
                    <img src="${result.thumbnail}" alt="Thumbnail" width="48" height="48">
                    <div class="play-overlay">▶️</div>
                </div>
                <div class="result-info">
                    <div class="result-title">${result.title}</div>
                    <div class="result-artist">${result.artist}</div>
                    <div class="result-meta">
                        <span class="result-duration">${result.duration}</span>
                        <span class="result-source">${result.source}</span>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn-small play-btn" title="Play">▶️</button>
                    <button class="btn-small add-btn" title="Add to Playlist">➕</button>
                </div>
            </div>
        `).join('');
        
        this.searchResults.innerHTML = `
            <div class="search-results-header">
                <h4>Found ${results.length} results</h4>
            </div>
            <div class="search-results-list">
                ${resultsHTML}
            </div>
        `;
        
        // Add event listeners to result items
        this.attachResultListeners();
    }
    
    attachResultListeners() {
        const resultItems = this.searchResults.querySelectorAll('.search-result-item');
        
        resultItems.forEach(item => {
            const playBtn = item.querySelector('.play-btn');
            const addBtn = item.querySelector('.add-btn');
            const url = item.dataset.url;
            const title = item.querySelector('.result-title').textContent;
            const artist = item.querySelector('.result-artist').textContent;
            
            // Play button
            playBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playResult(url, title, artist);
            });
            
            // Add to playlist button
            addBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addToPlaylist(url, title, artist);
            });
            
            // Click on item to play
            item.addEventListener('click', () => {
                this.playResult(url, title, artist);
            });
        });
    }
    
    playResult(url, title, artist) {
        console.log('🎵 Playing:', title, 'by', artist, 'from', url);
        this.showMessage(`Would play: ${title} by ${artist}`, 'info');
        
        // In a real implementation, you would:
        // 1. Stream the audio from the URL
        // 2. Load it into the audio controller
        // 3. Start playback with visualization
    }
    
    addToPlaylist(url, title, artist) {
        console.log('➕ Adding to playlist:', title, 'by', artist);
        this.showMessage(`Added to playlist: ${title}`, 'success');
        
        // In a real implementation, you would add this to the playlist manager
    }
    
    showLoading() {
        if (this.searchResults) {
            this.searchResults.innerHTML = `
                <div class="search-loading">
                    <div class="loading-spinner"></div>
                    <p>Searching...</p>
                </div>
            `;
        }
        
        if (this.searchButton) {
            this.searchButton.disabled = true;
            this.searchButton.textContent = '⏳ Searching...';
        }
    }
    
    hideLoading() {
        if (this.searchButton) {
            this.searchButton.disabled = false;
            this.searchButton.textContent = '🔍 Search';
        }
    }
    
    showError(message) {
        if (this.searchResults) {
            this.searchResults.innerHTML = `
                <div class="search-error">
                    <p>❌ ${message}</p>
                    <button class="btn" onclick="location.reload()">Try Again</button>
                </div>
            `;
        }
    }
    
    clearResults() {
        if (this.searchResults) {
            this.searchResults.innerHTML = `
                <div class="search-empty">
                    <p>Enter a search term to find music</p>
                </div>
            `;
        }
    }
    
    showMessage(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: var(--card-bg, #2a2a2a);
            color: var(--text-color, #fff);
            border-radius: 8px;
            z-index: 10001;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        // Color coding
        if (type === 'success') toast.style.borderLeft = '4px solid #4ade80';
        if (type === 'error') toast.style.borderLeft = '4px solid #ef4444';
        if (type === 'warning') toast.style.borderLeft = '4px solid #f59e0b';
        if (type === 'info') toast.style.borderLeft = '4px solid #3b82f6';
        
        document.body.appendChild(toast);
        
        // Auto-remove
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Export for use in main app
window.EqualizerManager = EqualizerManager;
window.SearchManager = SearchManager;
