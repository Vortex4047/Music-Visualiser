// playlist-manager.js - Enhanced playlist management with ZIP and multiple file support
export class PlaylistManager {
    constructor() {
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.shuffleMode = false;
        this.repeatMode = 'off'; // 'off', 'one', 'all'
        this.audioController = null;
        this.visualizerManager = null;
        this.trackInfoManager = null;
        
        // Initialize UI elements
        this.initializeUI();
        
        // Supported audio formats
        this.supportedFormats = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'];
        
        console.log('✅ Playlist Manager initialized');
    }
    
    initializeUI() {
        this.playlistContainer = document.getElementById('playlist-tracks');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.repeatBtn = document.getElementById('repeat-btn');
        this.clearBtn = document.getElementById('clear-playlist');
        
        // Set up event listeners
        if (this.shuffleBtn) {
            this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        }
        
        if (this.repeatBtn) {
            this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        }
        
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearPlaylist());
        }
        
        // Add file upload capabilities to playlist modal
        this.addFileUploadControls();
    }
    
    addFileUploadControls() {
        const playlistContainer = document.querySelector('.playlist-container');
        if (!playlistContainer) return;
        
        // Create enhanced upload section
        const uploadSection = document.createElement('div');
        uploadSection.className = 'playlist-upload-section';
        uploadSection.innerHTML = `
            <div class="upload-controls">
                <input type="file" id="playlist-file-input" accept="audio/*" multiple style="display: none;">
                <input type="file" id="playlist-zip-input" accept=".zip" style="display: none;">
                <button id="add-files-btn" class="btn upload-btn">📁 Add Audio Files</button>
                <button id="add-zip-btn" class="btn upload-btn">📦 Add ZIP Archive</button>
                <div class="upload-info">
                    <p>💡 Drag and drop files or click to browse</p>
                    <p>Supported formats: MP3, WAV, OGG, FLAC, AAC, M4A, WMA</p>
                </div>
            </div>
            <div id="upload-progress" class="upload-progress" style="display: none;">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">Processing files...</div>
            </div>
        `;
        
        // Insert before playlist tracks
        playlistContainer.insertBefore(uploadSection, this.playlistContainer);
        
        // Set up file input event listeners
        this.setupFileUploadListeners();
        
        // Set up drag and drop
        this.setupDragAndDrop(playlistContainer);
    }
    
    setupFileUploadListeners() {
        const fileInput = document.getElementById('playlist-file-input');
        const zipInput = document.getElementById('playlist-zip-input');
        const addFilesBtn = document.getElementById('add-files-btn');
        const addZipBtn = document.getElementById('add-zip-btn');
        
        if (addFilesBtn && fileInput) {
            addFilesBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleMultipleFiles(e.target.files));
        }
        
        if (addZipBtn && zipInput) {
            addZipBtn.addEventListener('click', () => zipInput.click());
            zipInput.addEventListener('change', (e) => this.handleZipFile(e.target.files[0]));
        }
    }
    
    setupDragAndDrop(container) {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });
        
        container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleDroppedFiles(files);
        });
    }
    
    async handleMultipleFiles(files) {
        if (!files || files.length === 0) return;
        
        const audioFiles = Array.from(files).filter(file => 
            this.isAudioFile(file) || file.type.startsWith('audio/')
        );
        
        if (audioFiles.length === 0) {
            this.showMessage('No supported audio files found', 'warning');
            return;
        }
        
        this.showProgress(`Processing ${audioFiles.length} files...`);
        
        try {
            for (let i = 0; i < audioFiles.length; i++) {
                await this.addTrack(audioFiles[i]);
                this.updateProgress(((i + 1) / audioFiles.length) * 100);
            }
            
            this.hideProgress();
            this.showMessage(`Added ${audioFiles.length} tracks to playlist`, 'success');
            this.updatePlaylistDisplay();
        } catch (error) {
            this.hideProgress();
            this.showMessage(`Error processing files: ${error.message}`, 'error');
            console.error('Error adding multiple files:', error);
        }
    }
    
    async handleZipFile(zipFile) {
        if (!zipFile || !zipFile.name.endsWith('.zip')) {
            this.showMessage('Please select a valid ZIP file', 'error');
            return;
        }
        
        this.showProgress('Extracting ZIP archive...');
        
        try {
            // Import JSZip library dynamically if not already loaded
            if (typeof JSZip === 'undefined') {
                await this.loadJSZip();
            }
            
            const zip = new JSZip();
            const zipContents = await zip.loadAsync(zipFile);
            
            const audioFiles = [];
            const promises = [];
            
            // Find all audio files in the ZIP
            zipContents.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir && this.isAudioFile({name: relativePath})) {
                    promises.push(
                        zipEntry.async('blob').then(blob => {
                            // Create a File object from the blob
                            const file = new File([blob], relativePath, {
                                type: this.getMimeType(relativePath)
                            });
                            audioFiles.push(file);
                        })
                    );
                }
            });
            
            if (promises.length === 0) {
                this.hideProgress();
                this.showMessage('No audio files found in ZIP archive', 'warning');
                return;
            }
            
            // Wait for all files to be extracted
            await Promise.all(promises);
            
            // Add extracted files to playlist
            for (let i = 0; i < audioFiles.length; i++) {
                await this.addTrack(audioFiles[i]);
                this.updateProgress(((i + 1) / audioFiles.length) * 100);
            }
            
            this.hideProgress();
            this.showMessage(`Extracted and added ${audioFiles.length} tracks from ZIP`, 'success');
            this.updatePlaylistDisplay();
            
        } catch (error) {
            this.hideProgress();
            this.showMessage(`Error processing ZIP file: ${error.message}`, 'error');
            console.error('Error processing ZIP file:', error);
        }
    }
    
    async handleDroppedFiles(files) {
        const zipFiles = files.filter(f => f.name.endsWith('.zip'));
        const audioFiles = files.filter(f => this.isAudioFile(f) || f.type.startsWith('audio/'));
        
        if (zipFiles.length > 0) {
            for (const zipFile of zipFiles) {
                await this.handleZipFile(zipFile);
            }
        }
        
        if (audioFiles.length > 0) {
            await this.handleMultipleFiles(audioFiles);
        }
        
        if (zipFiles.length === 0 && audioFiles.length === 0) {
            this.showMessage('No supported audio files or ZIP archives found', 'warning');
        }
    }
    
    async loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    isAudioFile(file) {
        if (!file || !file.name) return false;
        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        return this.supportedFormats.includes(extension);
    }
    
    getMimeType(filename) {
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        const mimeTypes = {
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.flac': 'audio/flac',
            '.aac': 'audio/aac',
            '.m4a': 'audio/mp4',
            '.wma': 'audio/x-ms-wma'
        };
        return mimeTypes[ext] || 'audio/mpeg';
    }
    
    async addTrack(file) {
        const track = {
            id: Date.now() + Math.random(),
            file: file,
            name: this.extractTrackName(file.name),
            artist: this.extractArtistName(file.name),
            duration: null,
            url: URL.createObjectURL(file)
        };
        
        // Try to get duration
        try {
            track.duration = await this.getAudioDuration(track.url);
        } catch (error) {
            console.warn('Could not determine duration for:', file.name);
        }
        
        this.playlist.push(track);
        return track;
    }
    
    async getAudioDuration(url) {
        return new Promise((resolve) => {
            const audio = new Audio(url);
            audio.addEventListener('loadedmetadata', () => {
                resolve(audio.duration);
            });
            audio.addEventListener('error', () => {
                resolve(null);
            });
            audio.load();
        });
    }
    
    extractTrackName(filename) {
        const name = filename.replace(/\.[^/.]+$/, '');
        if (name.includes(' - ')) {
            return name.split(' - ').slice(1).join(' - ').trim();
        }
        return name;
    }
    
    extractArtistName(filename) {
        const name = filename.replace(/\.[^/.]+$/, '');
        if (name.includes(' - ')) {
            return name.split(' - ')[0].trim();
        }
        return 'Unknown Artist';
    }
    
    updatePlaylistDisplay() {
        if (!this.playlistContainer) return;
        
        if (this.playlist.length === 0) {
            this.playlistContainer.innerHTML = `
                <div class="playlist-empty">
                    <p>Your playlist is empty</p>
                    <p>Add some tracks to get started!</p>
                </div>
            `;
            return;
        }
        
        this.playlistContainer.innerHTML = this.playlist.map((track, index) => `
            <div class="playlist-item ${index === this.currentTrackIndex ? 'active' : ''}" data-index="${index}">
                <div class="track-number">${index + 1}</div>
                <div class="track-info">
                    <div class="track-name">${track.name}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-duration">
                    ${track.duration ? this.formatTime(track.duration) : '--:--'}
                </div>
                <div class="track-actions">
                    <button class="track-play-btn" data-index="${index}">▶️</button>
                    <button class="track-remove-btn" data-index="${index}">🗑️</button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for track actions
        this.attachTrackEventListeners();
    }
    
    attachTrackEventListeners() {
        const playButtons = this.playlistContainer.querySelectorAll('.track-play-btn');
        const removeButtons = this.playlistContainer.querySelectorAll('.track-remove-btn');
        
        playButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.getAttribute('data-index'));
                this.playTrack(index);
            });
        });
        
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.getAttribute('data-index'));
                this.removeTrack(index);
            });
        });
        
        // Add click to play functionality
        const playlistItems = this.playlistContainer.querySelectorAll('.playlist-item');
        playlistItems.forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.getAttribute('data-index'));
                this.playTrack(index);
            });
        });
    }
    
    async playTrack(index) {
        if (!this.playlist[index] || !this.audioController) return;
        
        const track = this.playlist[index];
        this.currentTrackIndex = index;
        
        try {
            const res = await this.audioController.loadFile(track.file);
            
            if (this.visualizerManager) {
                this.visualizerManager.connectAnalyser(res.analyser);
            }
            
            if (this.trackInfoManager) {
                this.trackInfoManager.displayTrackInfo(track.file, res.audio);
            }
            
            this.updatePlaylistDisplay();
            
            // Set up auto-advance to next track
            res.audio.addEventListener('ended', () => this.onTrackEnded());
            
            console.log('Playing track:', track.name);
            
        } catch (error) {
            console.error('Error playing track:', error);
            this.showMessage(`Error playing track: ${track.name}`, 'error');
        }
    }
    
    onTrackEnded() {
        if (this.repeatMode === 'one') {
            this.playTrack(this.currentTrackIndex);
        } else if (this.repeatMode === 'all' || this.currentTrackIndex < this.playlist.length - 1) {
            this.playNext();
        }
    }
    
    playNext() {
        if (this.playlist.length === 0) return;
        
        let nextIndex;
        if (this.shuffleMode) {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        }
        
        this.playTrack(nextIndex);
    }
    
    playPrevious() {
        if (this.playlist.length === 0) return;
        
        let prevIndex;
        if (this.shuffleMode) {
            prevIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            prevIndex = this.currentTrackIndex > 0 ? this.currentTrackIndex - 1 : this.playlist.length - 1;
        }
        
        this.playTrack(prevIndex);
    }
    
    removeTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        // Clean up URL object
        if (this.playlist[index].url) {
            URL.revokeObjectURL(this.playlist[index].url);
        }
        
        this.playlist.splice(index, 1);
        
        // Adjust current track index if necessary
        if (index < this.currentTrackIndex) {
            this.currentTrackIndex--;
        } else if (index === this.currentTrackIndex) {
            this.currentTrackIndex = -1;
        }
        
        this.updatePlaylistDisplay();
        this.showMessage('Track removed from playlist', 'info');
    }
    
    toggleShuffle() {
        this.shuffleMode = !this.shuffleMode;
        
        if (this.shuffleBtn) {
            if (this.shuffleMode) {
                this.shuffleBtn.classList.add('active');
                this.shuffleBtn.textContent = '🔀 Shuffle ON';
            } else {
                this.shuffleBtn.classList.remove('active');
                this.shuffleBtn.textContent = '🔀 Shuffle';
            }
        }
        
        this.showMessage(`Shuffle mode ${this.shuffleMode ? 'enabled' : 'disabled'}`, 'info');
    }
    
    toggleRepeat() {
        const modes = ['off', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        if (this.repeatBtn) {
            this.repeatBtn.classList.remove('active', 'repeat-one');
            
            switch (this.repeatMode) {
                case 'off':
                    this.repeatBtn.textContent = '🔁 Repeat';
                    break;
                case 'all':
                    this.repeatBtn.classList.add('active');
                    this.repeatBtn.textContent = '🔁 Repeat All';
                    break;
                case 'one':
                    this.repeatBtn.classList.add('active', 'repeat-one');
                    this.repeatBtn.textContent = '🔂 Repeat One';
                    break;
            }
        }
        
        this.showMessage(`Repeat mode: ${this.repeatMode}`, 'info');
    }
    
    clearPlaylist() {
        if (this.playlist.length === 0) return;
        
        if (!confirm(`Are you sure you want to clear all ${this.playlist.length} tracks?`)) {
            return;
        }
        
        // Clean up URL objects
        this.playlist.forEach(track => {
            if (track.url) {
                URL.revokeObjectURL(track.url);
            }
        });
        
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.updatePlaylistDisplay();
        this.showMessage('Playlist cleared', 'info');
    }
    
    // Helper methods for UI feedback
    showProgress(text) {
        const progressDiv = document.getElementById('upload-progress');
        if (progressDiv) {
            progressDiv.style.display = 'block';
            progressDiv.querySelector('.progress-text').textContent = text;
            progressDiv.querySelector('.progress-fill').style.width = '0%';
        }
    }
    
    updateProgress(percent) {
        const progressFill = document.querySelector('#upload-progress .progress-fill');
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    }
    
    hideProgress() {
        const progressDiv = document.getElementById('upload-progress');
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
    }
    
    showMessage(message, type = 'info') {
        // Create a simple toast notification
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
            z-index: 10000;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        // Color coding for different message types
        if (type === 'success') toast.style.borderLeft = '4px solid #4ade80';
        if (type === 'error') toast.style.borderLeft = '4px solid #ef4444';
        if (type === 'warning') toast.style.borderLeft = '4px solid #f59e0b';
        if (type === 'info') toast.style.borderLeft = '4px solid #3b82f6';
        
        document.body.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
        
        console.log(`[Playlist] ${message}`);
    }
    
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Set controller references
    setControllers(audioController, visualizerManager, trackInfoManager) {
        this.audioController = audioController;
        this.visualizerManager = visualizerManager;
        this.trackInfoManager = trackInfoManager;
    }
    
    // Get current track info
    getCurrentTrack() {
        return this.playlist[this.currentTrackIndex] || null;
    }
    
    // Get playlist stats
    getStats() {
        const totalTracks = this.playlist.length;
        const totalDuration = this.playlist.reduce((sum, track) => sum + (track.duration || 0), 0);
        
        return {
            tracks: totalTracks,
            duration: this.formatTime(totalDuration),
            currentTrack: this.getCurrentTrack()
        };
    }
}
