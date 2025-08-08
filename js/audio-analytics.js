// audio-analytics.js - Advanced real-time audio analysis and visualization
class AudioAnalyticsController {
    constructor() {
        this.modal = document.getElementById('analytics-modal');
        this.overlay = document.getElementById('analytics-overlay');
        this.overlayContent = document.getElementById('analytics-content');
        this.spectrumChart = document.getElementById('spectrum-chart');
        this.spectrumCtx = this.spectrumChart?.getContext('2d');
        
        this.analyser = null;
        this.isOpen = false;
        this.isAnalyzing = false;
        this.overlayVisible = false;
        
        // Analysis parameters
        this.sampleRate = 44100;
        this.bufferSize = 2048;
        this.analysisData = [];
        this.beatHistory = [];
        this.keyDetectionBuffer = [];
        
        // Real-time metrics
        this.metrics = {
            bpm: 0,
            key: 'C',
            mood: 'Unknown',
            spectralCentroid: 0,
            zeroCrossingRate: 0,
            rmsEnergy: 0,
            brightness: 0,
            rolloff: 0
        };
        
        this.initializeEventListeners();
        this.initializeAnalysis();
        this.installScrollReveal();
    }
    
    initializeEventListeners() {
        // Modal controls
        const openBtn = document.getElementById('analytics-btn');
        const closeBtn = document.getElementById('close-analytics');
        
        openBtn?.addEventListener('click', () => this.show());
        closeBtn?.addEventListener('click', () => this.hide());
        
        // Click outside to close
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
        
        // Analytics controls
        const toggleOverlayBtn = document.getElementById('toggle-overlay');
        const exportBtn = document.getElementById('export-analytics');
        const resetBtn = document.getElementById('reset-analytics');
        
        toggleOverlayBtn?.addEventListener('click', () => this.toggleOverlay());
        exportBtn?.addEventListener('click', () => this.exportData());
        resetBtn?.addEventListener('click', () => this.resetAnalytics());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            switch(e.key) {
                case 'Escape':
                    this.hide();
                    break;
                case 'o':
                case 'O':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.toggleOverlay();
                    }
                    break;
                case 'e':
                case 'E':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.exportData();
                    }
                    break;
            }
        });
    }
    
    installScrollReveal() {
        // Add reveal-up class to cards and chart so they animate when scrolled into view
        const revealables = [
            ...document.querySelectorAll('.analytics-card'),
            document.querySelector('.analytics-chart')
        ].filter(Boolean);
        revealables.forEach(el => el.classList.add('reveal-up'));

        // Use IntersectionObserver for scroll-triggered animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, { root: this.modal?.querySelector('.modal-content') || null, threshold: 0.15 });

        revealables.forEach(el => observer.observe(el));
        this._revealObserver = observer;
    }
    
    initializeAnalysis() {
        // Initialize chart canvas
        if (this.spectrumChart) {
            this.spectrumChart.width = 600;
            this.spectrumChart.height = 200;
        }
        
        // Start analysis loop
        this.analysisLoop();
    }
    
    show() {
        if (!this.modal) {
            console.error('Analytics modal not found!');
            return;
        }
        
        this.modal.style.display = 'flex';
        this.isOpen = true;
        this.startAnalysis();
        
        // Add body scroll lock
        document.body.style.overflow = 'hidden';
        
        console.log('Analytics modal shown');
    }
    
    hide() {
        if (!this.modal) return;
        
        this.modal.style.display = 'none';
        this.isOpen = false;
        
        // Remove body scroll lock
        document.body.style.overflow = '';
        
        console.log('Analytics modal hidden');
    }
    
    toggleOverlay() {
        if (!this.overlay) return;
        
        this.overlayVisible = !this.overlayVisible;
        this.overlay.style.display = this.overlayVisible ? 'block' : 'none';
        
        if (this.overlayVisible) {
            this.updateOverlayContent();
        }
        
        const toggleBtn = document.getElementById('toggle-overlay');
        if (toggleBtn) {
            toggleBtn.textContent = this.overlayVisible ? '📌 Hide Overlay' : '📌 Show Overlay';
        }
    }
    
    setAnalyser(analyser) {
        this.analyser = analyser;
        if (this.analyser) {
            this.sampleRate = this.analyser.context?.sampleRate || 44100;
            console.log('Analytics connected to analyser, sample rate:', this.sampleRate);
        }
    }
    
    startAnalysis() {
        if (!this.analyser) {
            console.log('No analyser available for analytics');
            return;
        }
        
        this.isAnalyzing = true;
        console.log('Started audio analytics');
    }
    
    stopAnalysis() {
        this.isAnalyzing = false;
        console.log('Stopped audio analytics');
    }
    
    analysisLoop() {
        if (this.isAnalyzing && this.analyser && (this.isOpen || this.overlayVisible)) {
            this.performAnalysis();
            this.updateUI();
        }
        
        requestAnimationFrame(() => this.analysisLoop());
    }
    
    performAnalysis() {
        if (!this.analyser) return;
        
        // Get frequency and time domain data
        const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        const timeDomainData = new Uint8Array(this.analyser.fftSize);
        
        this.analyser.getByteFrequencyData(frequencyData);
        this.analyser.getByteTimeDomainData(timeDomainData);
        
        // Convert to float arrays for analysis
        const freqFloat = Array.from(frequencyData).map(val => val / 255);
        const timeFloat = Array.from(timeDomainData).map(val => (val - 128) / 128);
        
        // Perform various analyses
        this.analyzeSpectralCentroid(freqFloat);
        this.analyzeRMSEnergy(timeFloat);
        this.analyzeZeroCrossingRate(timeFloat);
        this.analyzeBPM(freqFloat);
        this.analyzeKey(freqFloat);
        this.analyzeMood(freqFloat);
        this.analyzeSpectralFeatures(freqFloat);
        
        // Store data for history
        this.analysisData.push({
            timestamp: Date.now(),
            frequency: [...freqFloat],
            metrics: { ...this.metrics }
        });
        
        // Keep only last 100 analysis frames
        if (this.analysisData.length > 100) {
            this.analysisData.shift();
        }
    }
    
    analyzeSpectralCentroid(freqData) {
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < freqData.length; i++) {
            const frequency = (i * this.sampleRate) / (2 * freqData.length);
            weightedSum += frequency * freqData[i];
            magnitudeSum += freqData[i];
        }
        
        this.metrics.spectralCentroid = magnitudeSum > 0 ? Math.round(weightedSum / magnitudeSum) : 0;
        this.metrics.brightness = Math.min(100, Math.round((this.metrics.spectralCentroid / 4000) * 100));
    }
    
    analyzeRMSEnergy(timeData) {
        const squaredSum = timeData.reduce((sum, val) => sum + val * val, 0);
        this.metrics.rmsEnergy = Math.round(Math.sqrt(squaredSum / timeData.length) * 100);
    }
    
    analyzeZeroCrossingRate(timeData) {
        let crossings = 0;
        
        for (let i = 1; i < timeData.length; i++) {
            if ((timeData[i] >= 0) !== (timeData[i - 1] >= 0)) {
                crossings++;
            }
        }
        
        this.metrics.zeroCrossingRate = Math.round((crossings / timeData.length) * 1000) / 10;
    }
    
    analyzeBPM(freqData) {
        // Simplified BPM detection using beat energy in low-mid frequencies
        const beatRange = freqData.slice(1, 8); // ~20-150 Hz range
        const beatEnergy = beatRange.reduce((sum, val) => sum + val, 0) / beatRange.length;
        
        const threshold = 0.3;
        const now = Date.now();
        
        if (beatEnergy > threshold) {
            this.beatHistory.push(now);
        }
        
        // Keep only beats from last 10 seconds
        this.beatHistory = this.beatHistory.filter(time => now - time < 10000);
        
        if (this.beatHistory.length > 4) {
            const intervals = [];
            for (let i = 1; i < this.beatHistory.length; i++) {
                intervals.push(this.beatHistory[i] - this.beatHistory[i - 1]);
            }
            
            // Average interval in milliseconds
            const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
            const bpm = Math.round(60000 / avgInterval);
            
            // Reasonable BPM range
            if (bpm >= 60 && bpm <= 200) {
                this.metrics.bpm = bpm;
            }
        }
    }
    
    analyzeKey(freqData) {
        // Simplified chromatic analysis
        const chromaVector = new Array(12).fill(0);
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Map frequency bins to chromatic classes
        for (let i = 1; i < freqData.length; i++) {
            const frequency = (i * this.sampleRate) / (2 * freqData.length);
            if (frequency > 80 && frequency < 2000) { // Musical range
                const pitchClass = Math.round(12 * Math.log2(frequency / 440)) % 12;
                const normalizedPitch = pitchClass < 0 ? pitchClass + 12 : pitchClass;
                chromaVector[normalizedPitch] += freqData[i];
            }
        }
        
        // Find dominant pitch class
        const maxChroma = Math.max(...chromaVector);
        const dominantPitch = chromaVector.indexOf(maxChroma);
        
        if (maxChroma > 0.1) {
            this.metrics.key = noteNames[dominantPitch];
        }
    }
    
    analyzeMood(freqData) {
        // Simplified mood analysis based on spectral characteristics
        const bassEnergy = freqData.slice(0, 8).reduce((sum, val) => sum + val, 0) / 8;
        const midEnergy = freqData.slice(8, 32).reduce((sum, val) => sum + val, 0) / 24;
        const highEnergy = freqData.slice(32, 64).reduce((sum, val) => sum + val, 0) / 32;
        
        const totalEnergy = bassEnergy + midEnergy + highEnergy;
        
        if (totalEnergy < 0.2) {
            this.metrics.mood = 'Calm';
        } else if (bassEnergy > midEnergy && bassEnergy > highEnergy) {
            this.metrics.mood = 'Deep';
        } else if (highEnergy > bassEnergy && highEnergy > midEnergy) {
            this.metrics.mood = 'Bright';
        } else if (totalEnergy > 0.6) {
            this.metrics.mood = 'Energetic';
        } else if (midEnergy > bassEnergy && midEnergy > highEnergy) {
            this.metrics.mood = 'Warm';
        } else {
            this.metrics.mood = 'Balanced';
        }
    }
    
    analyzeSpectralFeatures(freqData) {
        // Spectral rolloff (frequency below which 85% of energy is contained)
        const totalEnergy = freqData.reduce((sum, val) => sum + val, 0);
        let cumulativeEnergy = 0;
        
        for (let i = 0; i < freqData.length; i++) {
            cumulativeEnergy += freqData[i];
            if (cumulativeEnergy >= totalEnergy * 0.85) {
                const frequency = (i * this.sampleRate) / (2 * freqData.length);
                this.metrics.rolloff = Math.round(frequency);
                break;
            }
        }
    }
    
    updateUI() {
        // Update metric displays
        const elements = {
            'bpm-value': `${this.metrics.bpm || '--'} BPM`,
            'key-value': this.metrics.key || '--',
            'mood-value': this.metrics.mood || '--',
            'centroid-value': `${this.metrics.spectralCentroid || '--'} Hz`,
            'zcr-value': `${this.metrics.zeroCrossingRate || '--'}%`,
            'rms-value': `${this.metrics.rmsEnergy || '--'}%`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update spectrum chart
        this.drawSpectrumChart();
        
        // Update overlay if visible
        if (this.overlayVisible) {
            this.updateOverlayContent();
        }
    }
    
    drawSpectrumChart() {
        if (!this.spectrumCtx || !this.analyser) return;
        
        const canvas = this.spectrumChart;
        const ctx = this.spectrumCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        // Get frequency data
        const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(frequencyData);
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw frequency bars
        const barWidth = width / frequencyData.length * 2;
        const barCount = Math.min(frequencyData.length, Math.floor(width / barWidth));
        
        for (let i = 0; i < barCount; i++) {
            const barHeight = (frequencyData[i] / 255) * height * 0.8;
            const x = (i * width) / barCount;
            const y = height - barHeight;
            
            // Color gradient based on frequency
            const hue = (i / barCount) * 270; // Blue to red spectrum
            ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
            
            ctx.fillRect(x, y, barWidth - 1, barHeight);
        }
        
        // Draw frequency labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        const frequencies = [100, 1000, 5000, 10000];
        frequencies.forEach(freq => {
            const binIndex = Math.round((freq * frequencyData.length * 2) / this.sampleRate);
            const x = (binIndex / barCount) * width;
            
            if (x > 0 && x < width) {
                ctx.fillText(`${freq}Hz`, x, height - 5);
            }
        });
    }
    
    updateOverlayContent() {
        if (!this.overlayContent) return;
        
        this.overlayContent.innerHTML = `
            <div style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4;">
                <div style="margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 8px;">
                    <strong>🎵 LIVE ANALYTICS</strong>
                </div>
                <div><strong>BPM:</strong> ${this.metrics.bpm || '--'}</div>
                <div><strong>Key:</strong> ${this.metrics.key || '--'}</div>
                <div><strong>Mood:</strong> ${this.metrics.mood || '--'}</div>
                <div><strong>Brightness:</strong> ${this.metrics.brightness || '--'}%</div>
                <div><strong>Energy:</strong> ${this.metrics.rmsEnergy || '--'}%</div>
                <div style="margin-top: 8px; font-size: 12px; color: #aaa;">
                    Centroid: ${this.metrics.spectralCentroid || '--'} Hz<br>
                    ZCR: ${this.metrics.zeroCrossingRate || '--'}%
                </div>
            </div>
        `;
    }
    
    exportData() {
        if (this.analysisData.length === 0) {
            alert('No analysis data available to export.');
            return;
        }
        
        const exportData = {
            timestamp: new Date().toISOString(),
            sampleRate: this.sampleRate,
            totalSamples: this.analysisData.length,
            currentMetrics: this.metrics,
            analysisHistory: this.analysisData.slice(-50) // Last 50 samples
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audio-analytics-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Analytics data exported');
    }
    
    resetAnalytics() {
        this.analysisData = [];
        this.beatHistory = [];
        this.keyDetectionBuffer = [];
        
        this.metrics = {
            bpm: 0,
            key: 'C',
            mood: 'Unknown',
            spectralCentroid: 0,
            zeroCrossingRate: 0,
            rmsEnergy: 0,
            brightness: 0,
            rolloff: 0
        };
        
        this.updateUI();
        console.log('Analytics data reset');
    }
}

// Export for use in main app
window.AudioAnalyticsController = AudioAnalyticsController;
