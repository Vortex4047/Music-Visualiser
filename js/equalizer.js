// equalizer.js - Audio Equalizer with Web Audio API
class AudioEqualizer {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.filters = [];
        this.frequencies = [60, 170, 350, 1000, 3000, 8000];
        this.gainNodes = [];
        this.isInitialized = false;
        
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
        
        // Create filters for each frequency band
        this.frequencies.forEach((frequency, index) => {
            const filter = this.audioContext.createBiquadFilter();
            
            if (index === 0) {
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            } else if (index === this.frequencies.length - 1) {
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            } else {
                filter.type = 'peaking';
                filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                filter.Q.setValueAtTime(1, this.audioContext.currentTime);
            }
            
            filter.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.filters.push(filter);
        });
        
        // Chain filters together
        for (let i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }
        
        this.isInitialized = true;
    }
    
    getInputNode() {
        if (!this.isInitialized) this.initialize();
        return this.filters[0];
    }
    
    getOutputNode() {
        if (!this.isInitialized) this.initialize();
        return this.filters[this.filters.length - 1];
    }
    
    setGain(bandIndex, gainValue) {
        if (!this.isInitialized || bandIndex >= this.filters.length) return;
        
        const filter = this.filters[bandIndex];
        const currentTime = this.audioContext.currentTime;
        
        // Smooth transition to avoid audio pops
        filter.gain.setTargetAtTime(gainValue, currentTime, 0.1);
    }
    
    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;
        
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

class EqualizerUI {
    constructor(audioEqualizer) {
        this.equalizer = audioEqualizer;
        this.modal = document.getElementById('equalizer-modal');
        this.isOpen = false;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Modal controls
        const openBtn = document.getElementById('equalizer-btn');
        const closeBtn = document.getElementById('close-eq');
        
        openBtn?.addEventListener('click', () => this.show());
        closeBtn?.addEventListener('click', () => this.hide());
        
        // Click outside to close
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
        
        // Slider controls
        this.equalizer.frequencies.forEach((freq, index) => {
            const slider = document.getElementById(`eq-${freq}`);
            const valueDisplay = slider?.parentElement.querySelector('.eq-value');
            
            slider?.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.equalizer.setGain(index, value);
                
                if (valueDisplay) {
                    valueDisplay.textContent = `${value > 0 ? '+' : ''}${value}dB`;
                }
            });
            
            // Add visual feedback
            slider?.addEventListener('mousedown', () => {
                slider.style.transform = 'scale(1.1)';
            });
            
            slider?.addEventListener('mouseup', () => {
                slider.style.transform = 'scale(1)';
            });
        });
        
        // Preset controls
        const presetButtons = document.querySelectorAll('.eq-preset');
        presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                const preset = button.dataset.preset;
                this.equalizer.applyPreset(preset);
                
                // Visual feedback
                presetButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Add click animation
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
    
    show() {
        this.modal.style.display = 'flex';
        this.isOpen = true;
        
        // Initialize equalizer if not already done
        this.equalizer.initialize();
        
        // Focus first slider for keyboard navigation
        const firstSlider = document.querySelector('.eq-slider');
        setTimeout(() => firstSlider?.focus(), 100);
        
        // Add body scroll lock
        document.body.style.overflow = 'hidden';
    }
    
    hide() {
        this.modal.style.display = 'none';
        this.isOpen = false;
        
        // Remove body scroll lock
        document.body.style.overflow = '';
    }
    
    // Add real-time frequency visualization
    addFrequencyVisualization(analyser) {
        if (!analyser || !this.isOpen) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 100;
        canvas.style.cssText = `
            width: 100%;
            height: 100px;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            margin: 10px 0;
        `;
        
        const freqVisualization = document.querySelector('.equalizer-controls');
        if (freqVisualization && !freqVisualization.querySelector('canvas')) {
            freqVisualization.appendChild(canvas);
            this.drawFrequencyResponse(canvas, analyser);
        }
    }
    
    drawFrequencyResponse(canvas, analyser) {
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            if (!this.isOpen) return;
            
            analyser.getByteFrequencyData(dataArray);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#60a5fa';
            ctx.beginPath();
            
            const sliceWidth = canvas.width / bufferLength;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            ctx.stroke();
            requestAnimationFrame(draw);
        };
        
        draw();
    }
}

// Export for use in main app
window.AudioEqualizer = AudioEqualizer;
window.EqualizerUI = EqualizerUI;
