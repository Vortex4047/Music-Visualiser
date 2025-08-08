// Enhanced Audio Handler for AI Music Visualizer
// Handles audio input from files, microphone, playlist, and web search

class AudioHandler {
    constructor() {
        // Initialize Web Audio API context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.source = null;
        this.analyser = null;
        this.mediaStream = null;
        
        // HTML5 Audio element for proper playback control
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        this.mediaElementSource = null;
        
        // Playback state
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTrack = null;
        this.duration = 0;
        this.currentTime = 0;
        
        // Playlist management
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.shuffle = false;
        this.repeat = 'off'; // 'off', 'all', 'one'
        
        // Setup audio element events
        this.setupAudioEvents();
    }

    // Load and decode an audio file
    async loadAudioFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            throw new Error('Failed to load audio file: ' + error.message);
        }
    }

    // Play an audio buffer with visualization callback
    async playAudio(audioBuffer, onPlay) {
        // Stop any currently playing audio
        this.stopAudio();

        // Create audio source
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = audioBuffer;

        // Create analyser node for visualization
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        // Connect nodes
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        // Set up playback
        let startTime = this.audioContext.currentTime;
        this.source.start(0);

        // Visualization loop
        const visualize = () => {
            if (this.source && this.audioContext.state === 'running') {
                const currentTime = this.audioContext.currentTime - startTime;
                onPlay(currentTime);
                requestAnimationFrame(visualize);
            }
        };

        visualize();

        // Handle playback completion
        return new Promise((resolve) => {
            this.source.onended = () => {
                // Remove pulse effect when audio playback stops
                if (typeof uiManager !== 'undefined' && uiManager.removePulseEffect) {
                    uiManager.removePulseEffect();
                }
                resolve();
            };
        });
    }

    // Stop currently playing audio
    stopAudio() {
        if (this.source) {
            this.source.stop();
            this.source.disconnect();
            this.source = null;
        }

        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        
        // Remove pulse effect when audio playback stops
        if (typeof uiManager !== 'undefined' && uiManager.removePulseEffect) {
            uiManager.removePulseEffect();
        }
    }

    // Get microphone input stream
    async getMicrophoneInput() {
        try {
            // Stop any existing microphone stream
            this.stopMicrophone();

            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

            // Create audio source from microphone
            this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            // Connect nodes
            this.source.connect(this.analyser);

            return this.mediaStream;
        } catch (error) {
            throw new Error('Failed to access microphone: ' + error.message);
        }
    }

    // Stop microphone input
    stopMicrophone() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }

        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        
        // Remove pulse effect when microphone stops
        if (typeof uiManager !== 'undefined' && uiManager.removePulseEffect) {
            uiManager.removePulseEffect();
        }
    }

    // Analyze microphone stream in real-time
    async analyzeMicrophoneStream(stream, onAudioData) {
        // Set up data extraction
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Analysis loop
        const analyze = () => {
            if (this.analyser && stream.active) {
                // Get frequency data
                this.analyser.getByteFrequencyData(dataArray);

                // Create audio data object
                const audioData = {
                    frequencyData: dataArray,
                    timestamp: Date.now()
                };

                // Pass to callback
                onAudioData(audioData);

                // Continue analysis
                requestAnimationFrame(analyze);
            }
        };

        analyze();
    }

    // Extract audio features for analysis
    extractAudioFeatures(audioBuffer) {
        // Create offline context for analysis
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );

        // Create source and analyser
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;

        const analyser = offlineContext.createAnalyser();
        analyser.fftSize = 2048;

        // Connect nodes
        source.connect(analyser);
        analyser.connect(offlineContext.destination);

        // Start processing
        source.start(0);

        // Render and extract data
        return offlineContext.startRendering().then(renderedBuffer => {
            const bufferLength = analyser.frequencyBinCount;
            const frequencyData = new Uint8Array(bufferLength);
            const timeDomainData = new Uint8Array(bufferLength);

            analyser.getByteFrequencyData(frequencyData);
            analyser.getByteTimeDomainData(timeDomainData);

            return {
                frequencyData,
                timeDomainData,
                sampleRate: audioBuffer.sampleRate,
                duration: audioBuffer.duration
            };
        });
    }

    // Get current audio data for visualization
    getAudioData() {
        if (this.analyser) {
            // Create arrays to hold the data
            const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            const timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Get the data from the analyser
            this.analyser.getByteFrequencyData(frequencyData);
            this.analyser.getByteTimeDomainData(timeDomainData);
            
            return {
                frequencyData,
                timeDomainData
            };
        }
        
        return null;
    }

    // ====== ENHANCED PLAYBACK CONTROLS ======

    setupAudioEvents() {
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.duration = this.audioElement.duration;
            this.dispatchEvent('durationchange', { duration: this.duration });
        });

        this.audioElement.addEventListener('timeupdate', () => {
            this.currentTime = this.audioElement.currentTime;
            this.dispatchEvent('timeupdate', { 
                currentTime: this.currentTime, 
                duration: this.duration 
            });
        });

        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
            this.isPaused = false;
            this.dispatchEvent('ended');
            this.handleTrackEnd();
        });

        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            this.isPaused = false;
            this.dispatchEvent('play');
        });

        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            this.isPaused = true;
            this.dispatchEvent('pause');
        });

        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            this.dispatchEvent('error', { error: e });
        });
    }

    // Load and play a track from file or URL
    async loadTrack(source, metadata = {}) {
        try {
            // Stop current playback
            this.stop();

            // Create track object
            const track = {
                id: Date.now() + Math.random(),
                title: metadata.title || 'Unknown Track',
                artist: metadata.artist || 'Unknown Artist',
                album: metadata.album || 'Unknown Album',
                duration: metadata.duration || 0,
                source: source,
                type: this.getSourceType(source),
                ...metadata
            };

            this.currentTrack = track;

            // Handle different source types
            if (source instanceof File) {
                const url = URL.createObjectURL(source);
                this.audioElement.src = url;
            } else if (typeof source === 'string') {
                this.audioElement.src = source;
            } else {
                throw new Error('Invalid audio source');
            }

            // Setup Web Audio API connection
            await this.setupWebAudioAnalyzer();

            // Load the audio
            await new Promise((resolve, reject) => {
                this.audioElement.onloadeddata = resolve;
                this.audioElement.onerror = reject;
                this.audioElement.load();
            });

            this.dispatchEvent('trackloaded', { track });
            return track;

        } catch (error) {
            console.error('Failed to load track:', error);
            throw error;
        }
    }

    // Setup Web Audio API analyzer for the HTML audio element
    async setupWebAudioAnalyzer() {
        if (this.mediaElementSource) {
            this.mediaElementSource.disconnect();
        }

        // Create media element source
        this.mediaElementSource = this.audioContext.createMediaElementSource(this.audioElement);
        
        // Create analyzer
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        
        // Connect nodes
        this.mediaElementSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
    }

    // Play current track
    async play() {
        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            await this.audioElement.play();
            return true;
        } catch (error) {
            console.error('Play failed:', error);
            return false;
        }
    }

    // Pause current track
    pause() {
        this.audioElement.pause();
    }

    // Stop current track
    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
    }

    // Toggle play/pause
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    // Seek to specific time
    seekTo(time) {
        if (this.audioElement && !isNaN(this.duration) && this.duration > 0) {
            this.audioElement.currentTime = Math.max(0, Math.min(time, this.duration));
        }
    }

    // Set volume (0-1)
    setVolume(volume) {
        this.audioElement.volume = Math.max(0, Math.min(1, volume));
        this.dispatchEvent('volumechange', { volume: this.audioElement.volume });
    }

    // Get current volume
    getVolume() {
        return this.audioElement.volume;
    }

    // ====== PLAYLIST MANAGEMENT ======

    // Add track to playlist
    addToPlaylist(trackData) {
        const track = {
            id: Date.now() + Math.random(),
            ...trackData,
            addedAt: new Date()
        };
        
        this.playlist.push(track);
        this.dispatchEvent('playlistupdate', { playlist: this.playlist });
        return track;
    }

    // Remove track from playlist
    removeFromPlaylist(trackId) {
        const index = this.playlist.findIndex(t => t.id === trackId);
        if (index !== -1) {
            this.playlist.splice(index, 1);
            
            // Adjust current index if needed
            if (this.currentTrackIndex >= index) {
                this.currentTrackIndex--;
            }
            
            this.dispatchEvent('playlistupdate', { playlist: this.playlist });
            return true;
        }
        return false;
    }

    // Clear playlist
    clearPlaylist() {
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.dispatchEvent('playlistupdate', { playlist: this.playlist });
    }

    // Play track from playlist
    async playTrackFromPlaylist(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.currentTrackIndex = index;
            const track = this.playlist[index];
            await this.loadTrack(track.source, track);
            return this.play();
        }
        return false;
    }

    // Play next track
    async playNext() {
        if (this.playlist.length === 0) return false;

        let nextIndex;
        
        if (this.shuffle) {
            // Random track
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            // Sequential
            nextIndex = this.currentTrackIndex + 1;
            if (nextIndex >= this.playlist.length) {
                if (this.repeat === 'all') {
                    nextIndex = 0;
                } else {
                    return false; // End of playlist
                }
            }
        }

        return this.playTrackFromPlaylist(nextIndex);
    }

    // Play previous track
    async playPrevious() {
        if (this.playlist.length === 0) return false;

        let prevIndex;
        
        if (this.shuffle) {
            // Random track
            prevIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            // Sequential
            prevIndex = this.currentTrackIndex - 1;
            if (prevIndex < 0) {
                if (this.repeat === 'all') {
                    prevIndex = this.playlist.length - 1;
                } else {
                    return false; // Beginning of playlist
                }
            }
        }

        return this.playTrackFromPlaylist(prevIndex);
    }

    // Handle track end based on repeat settings
    handleTrackEnd() {
        if (this.repeat === 'one') {
            // Repeat current track
            this.seekTo(0);
            this.play();
        } else {
            // Play next track
            this.playNext();
        }
    }

    // Set shuffle mode
    setShuffle(enabled) {
        this.shuffle = enabled;
        this.dispatchEvent('shufflechange', { shuffle: enabled });
    }

    // Set repeat mode
    setRepeat(mode) {
        this.repeat = mode; // 'off', 'all', 'one'
        this.dispatchEvent('repeatchange', { repeat: mode });
    }

    // ====== WEB SEARCH FUNCTIONALITY ======

    // Search for music on the web using YouTube/SoundCloud APIs
    async searchMusic(query, source = 'youtube') {
        try {
            switch (source) {
                case 'youtube':
                    return await this.searchYouTube(query);
                case 'soundcloud':
                    return await this.searchSoundCloud(query);
                case 'freemusicarchive':
                    return await this.searchFreeMusicArchive(query);
                default:
                    throw new Error('Unsupported search source');
            }
        } catch (error) {
            console.error('Music search failed:', error);
            throw error;
        }
    }

    // Search YouTube (using a free API or web scraping approach)
    async searchYouTube(query) {
        // Note: This requires a YouTube API key or alternative method
        // For demo purposes, returning mock data
        return [
            {
                id: 'youtube_1',
                title: 'Sample Song - ' + query,
                artist: 'Demo Artist',
                duration: 180,
                thumbnail: 'https://via.placeholder.com/120x120',
                source: 'youtube',
                url: '#demo-url-1'
            },
            {
                id: 'youtube_2',
                title: 'Another Track - ' + query,
                artist: 'Test Musician',
                duration: 240,
                thumbnail: 'https://via.placeholder.com/120x120',
                source: 'youtube',
                url: '#demo-url-2'
            }
        ];
    }

    // Search SoundCloud
    async searchSoundCloud(query) {
        // SoundCloud search implementation
        // For demo purposes, returning mock data
        return [
            {
                id: 'soundcloud_1',
                title: query + ' - SoundCloud Mix',
                artist: 'SC Artist',
                duration: 300,
                thumbnail: 'https://via.placeholder.com/120x120',
                source: 'soundcloud',
                url: '#demo-soundcloud-url-1'
            }
        ];
    }

    // Search Free Music Archive
    async searchFreeMusicArchive(query) {
        try {
            // Free Music Archive has an open API
            const response = await fetch(`https://freemusicarchive.org/api/get/tracks.json?api_key=YOUR_API_KEY&limit=10&search=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                // Fallback to mock data if API fails
                return [
                    {
                        id: 'fma_1',
                        title: 'Free Song - ' + query,
                        artist: 'Independent Artist',
                        album: 'Open Album',
                        duration: 220,
                        thumbnail: 'https://via.placeholder.com/120x120',
                        source: 'freemusicarchive',
                        url: '#demo-fma-url-1'
                    }
                ];
            }

            const data = await response.json();
            return data.dataset.map(track => ({
                id: 'fma_' + track.track_id,
                title: track.track_title,
                artist: track.artist_name,
                album: track.album_title,
                duration: parseInt(track.track_duration) || 0,
                thumbnail: track.track_image_file || 'https://via.placeholder.com/120x120',
                source: 'freemusicarchive',
                url: track.track_file_url
            }));
        } catch (error) {
            console.warn('Free Music Archive search failed, using fallback');
            return [];
        }
    }

    // ====== UTILITY METHODS ======

    getSourceType(source) {
        if (source instanceof File) {
            return 'file';
        } else if (typeof source === 'string') {
            if (source.includes('youtube.com') || source.includes('youtu.be')) {
                return 'youtube';
            } else if (source.includes('soundcloud.com')) {
                return 'soundcloud';
            } else {
                return 'url';
            }
        }
        return 'unknown';
    }

    // Simple event dispatcher
    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(`audio-${eventName}`, { detail: data });
        document.dispatchEvent(event);
    }

    // Format time in MM:SS format
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Get current playback state
    getState() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            currentTrack: this.currentTrack,
            currentTime: this.currentTime,
            duration: this.duration,
            volume: this.audioElement.volume,
            playlist: this.playlist,
            currentTrackIndex: this.currentTrackIndex,
            shuffle: this.shuffle,
            repeat: this.repeat
        };
    }
}
