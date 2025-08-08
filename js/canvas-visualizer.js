// canvas-visualizer.js - Enhanced canvas-based audio visualizer with multiple modes
export class CanvasVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.analyser = null;
        this.fftSize = 2048;
        this.dataArray = null;
        this.timeArray = null;
        this.running = false;
        this.mode = 'canvas'; // Default mode
        this.particles = [];
        this.time = 0;
        this.frameCount = 0;
        
        // Performance optimizations - cache gradients
        this.gradientCache = new Map();
        this.lastGradientUpdate = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Initialize particles
        this.initializeParticles();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        // Get the actual container dimensions
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // Use the full container dimensions
        const width = this.canvas.clientWidth || containerRect.width || window.innerWidth;
        const height = this.canvas.clientHeight || containerRect.height || 600; // fallback to 600px
        
        this.width = this.canvas.width = Math.floor(width * dpr);
        this.height = this.canvas.height = Math.floor(height * dpr);
        
        if (this.ctx) {
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        
        // Reinitialize particles after resize
        this.initializeParticles();
    }
    
    initializeParticles() {
        this.particles = [];
        // Reduced particle count for better performance
        const particleCount = 25;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.clientWidth,
                y: Math.random() * this.canvas.clientHeight,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                color: {
                    r: Math.floor(Math.random() * 255),
                    g: Math.floor(Math.random() * 255),
                    b: Math.floor(Math.random() * 255)
                },
                frequency: Math.floor(Math.random() * 128)
            });
        }
    }

    setMode(mode) {
        this.mode = mode;
    }

    connectAnalyser(analyser) {
        this.analyser = analyser;
        this.analyser.fftSize = this.fftSize;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.timeArray = new Uint8Array(this.analyser.fftSize);
    }

    disconnectAnalyser() {
        this.analyser = null;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.loop();
    }

    stop() {
        this.running = false;
    }

    loop() {
        if (!this.running) return;
        requestAnimationFrame(() => this.loop());
        this.time += 0.016; // Roughly 60fps
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        
        // Clear canvas completely transparent
        ctx.clearRect(0, 0, w, h);

        // Get theme for text colors and mode switching
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        
        if (!this.analyser) {
            // Draw idle message
            const textColors = {
                'dark': '#e6eef8',
                'light': '#0b1220',
                'neon': '#e6f7ff'
            };
            
            ctx.fillStyle = textColors[theme];
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Drop an MP3 file or click Upload to start visualizing', w / 2, h / 2);
            ctx.textAlign = 'left';
            return;
        }

        this.analyser.getByteFrequencyData(this.dataArray);
        this.analyser.getByteTimeDomainData(this.timeArray);
        
        // Draw based on current mode
        switch (this.mode) {
            case 'waveform':
                this.drawWaveform(ctx, w, h, theme);
                break;
            case 'frequency-spectrum':
                this.drawFrequencySpectrum(ctx, w, h, theme);
                break;
            case 'mandala':
                this.drawEnhancedMandala(ctx, w, h, theme);
                break;
            case 'dna':
                this.drawDNA(ctx, w, h, theme);
                break;
            case 'spiral':
                this.drawSpiral(ctx, w, h, theme);
                break;
            case 'kaleidoscope':
                this.drawKaleidoscope(ctx, w, h, theme);
                break;
            case 'ripples':
                this.drawSoundRipples(ctx, w, h, theme);
                break;
            case 'canvas':
            default:
                this.drawSpectrum(ctx, w, h, theme);
                break;
        }
    }
    
    drawSpectrum(ctx, w, h, theme) {
        const barWidth = Math.max(2, Math.floor(w / (this.bufferLength / 4)));
        const barCount = Math.floor(w / (barWidth + 1));
        let x = 0;
        
        for (let i = 0; i < barCount && i < this.bufferLength; i++) {
            const v = this.dataArray[i] / 255;
            const barHeight = v * h * 0.8;
            
            // Theme-based colors
            let color;
            switch (theme) {
                case 'light':
                    color = `rgba(${Math.floor(37 + 100*v)}, ${Math.floor(117 + 100*v)}, 252, ${0.7 + v * 0.3})`;
                    break;
                case 'neon':
                    color = `rgba(255, ${Math.floor(100*v)}, ${Math.floor(200 + 55*v)}, ${0.8 + v * 0.2})`;
                    break;
                case 'dark':
                default:
                    color = `rgba(${Math.floor(96 + 100*v)}, ${Math.floor(165 + 90*v)}, 250, ${0.7 + v * 0.3})`;
                    break;
            }
            
            ctx.fillStyle = color;
            ctx.fillRect(x, h - barHeight, barWidth, barHeight);
            
            // Add glow effect
            if (v > 0.3) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = color;
                ctx.fillRect(x, h - barHeight, barWidth, barHeight);
                ctx.shadowBlur = 0;
            }
            
            x += barWidth + 1;
        }
    }
    
    drawFrequencySpectrum(ctx, w, h, theme) {
        // Define frequency bands with clear labels and colors
        const frequencyBands = [
            { name: 'Sub Bass', min: 0, max: 4, color: '#8B5CF6', freq: '20-60Hz' },
            { name: 'Bass', min: 4, max: 12, color: '#3B82F6', freq: '60-250Hz' },
            { name: 'Low Mid', min: 12, max: 32, color: '#10B981', freq: '250-500Hz' },
            { name: 'Mid', min: 32, max: 80, color: '#F59E0B', freq: '500-2kHz' },
            { name: 'High Mid', min: 80, max: 160, color: '#EF4444', freq: '2-4kHz' },
            { name: 'Presence', min: 160, max: 320, color: '#EC4899', freq: '4-6kHz' },
            { name: 'Brilliance', min: 320, max: 512, color: '#F97316', freq: '6-20kHz' }
        ];
        
        const bandWidth = w / frequencyBands.length;
        const maxHeight = h - 60; // Leave space for labels
        
        // Draw background grid
        ctx.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        
        // Horizontal grid lines (dB levels)
        for (let i = 0; i <= 10; i++) {
            const y = (i / 10) * maxHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
            
            // dB labels on the left
            ctx.fillStyle = theme === 'light' ? '#666' : '#ccc';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${(10 - i) * 10}dB`, 35, y + 3);
        }
        
        // Vertical grid lines (frequency separators)
        for (let i = 0; i <= frequencyBands.length; i++) {
            const x = i * bandWidth;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, maxHeight);
            ctx.stroke();
        }
        
        // Draw frequency bands
        frequencyBands.forEach((band, bandIndex) => {
            const startX = bandIndex * bandWidth;
            const bandCenter = startX + bandWidth / 2;
            
            // Calculate average frequency value for this band
            let bandValue = 0;
            let sampleCount = 0;
            
            for (let i = band.min; i < Math.min(band.max, this.bufferLength); i++) {
                bandValue += this.dataArray[i];
                sampleCount++;
            }
            
            if (sampleCount > 0) {
                bandValue = (bandValue / sampleCount) / 255;
            }
            
            // Draw the main frequency bar
            const barHeight = bandValue * maxHeight;
            const barWidth = bandWidth * 0.8;
            const barX = startX + (bandWidth - barWidth) / 2;
            
            // Create gradient for the bar
            const gradient = ctx.createLinearGradient(0, maxHeight, 0, maxHeight - barHeight);
            gradient.addColorStop(0, band.color + '60');
            gradient.addColorStop(0.5, band.color + 'AA');
            gradient.addColorStop(1, band.color + 'FF');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(barX, maxHeight - barHeight, barWidth, barHeight);
            
            // Add glow effect for active frequencies
            if (bandValue > 0.1) {
                ctx.shadowBlur = 15 * bandValue;
                ctx.shadowColor = band.color;
                ctx.fillRect(barX, maxHeight - barHeight, barWidth, barHeight);
                ctx.shadowBlur = 0;
            }
            
            // Draw peak indicator
            if (bandValue > 0.7) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(barX, maxHeight - barHeight - 3, barWidth, 3);
                
                // Peak glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#FFFFFF';
                ctx.fillRect(barX, maxHeight - barHeight - 3, barWidth, 3);
                ctx.shadowBlur = 0;
            }
            
            // Draw individual frequency lines within each band for detail
            const detailLines = Math.min(band.max - band.min, 20);
            for (let i = 0; i < detailLines; i++) {
                const freqIndex = band.min + Math.floor((i / detailLines) * (band.max - band.min));
                if (freqIndex < this.bufferLength) {
                    const freqValue = this.dataArray[freqIndex] / 255;
                    const lineHeight = freqValue * maxHeight * 0.8;
                    const lineX = barX + (i / detailLines) * barWidth;
                    
                    if (lineHeight > 5) {
                        ctx.strokeStyle = band.color + '88';
                        ctx.lineWidth = Math.max(1, barWidth / detailLines - 1);
                        ctx.beginPath();
                        ctx.moveTo(lineX, maxHeight);
                        ctx.lineTo(lineX, maxHeight - lineHeight);
                        ctx.stroke();
                    }
                }
            }
            
            // Draw frequency band labels at the bottom
            ctx.fillStyle = theme === 'light' ? '#333' : '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(band.name, bandCenter, h - 35);
            
            // Draw frequency range
            ctx.font = '10px sans-serif';
            ctx.fillStyle = theme === 'light' ? '#666' : '#ccc';
            ctx.fillText(band.freq, bandCenter, h - 20);
            
            // Draw current level indicator
            const dbLevel = Math.round(bandValue * 100);
            ctx.font = 'bold 11px monospace';
            ctx.fillStyle = bandValue > 0.8 ? '#ff4444' : (bandValue > 0.5 ? '#ffaa00' : (theme === 'light' ? '#666' : '#ccc'));
            ctx.fillText(`${dbLevel}%`, bandCenter, h - 5);
        });
        
        // Draw title and overall stats
        ctx.fillStyle = theme === 'light' ? '#333' : '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Frequency Spectrum Analyzer', 10, 20);
        
        // Calculate and show overall RMS level
        const rmsLevel = Math.sqrt(this.dataArray.reduce((sum, val) => sum + (val * val), 0) / this.dataArray.length) / 255;
        ctx.font = '12px monospace';
        ctx.fillStyle = rmsLevel > 0.8 ? '#ff4444' : (rmsLevel > 0.5 ? '#ffaa00' : (theme === 'light' ? '#666' : '#ccc'));
        ctx.fillText(`RMS: ${Math.round(rmsLevel * 100)}%`, w - 100, 20);
        
        // Show peak frequency
        const peakIndex = this.dataArray.indexOf(Math.max(...this.dataArray));
        const peakFreq = Math.round((peakIndex / this.bufferLength) * (this.analyser.context.sampleRate / 2));
        ctx.fillText(`Peak: ${peakFreq}Hz`, w - 100, 35);
    }
    
    drawWaveform(ctx, w, h, theme) {
        // Theme-based colors
        const colors = {
            'dark': '#60a5fa',
            'light': '#2563eb', 
            'neon': '#ff00c8'
        };
        
        ctx.strokeStyle = colors[theme];
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const sliceWidth = w / this.timeArray.length;
        let x = 0;
        
        for (let i = 0; i < this.timeArray.length; i++) {
            const v = this.timeArray[i] / 128.0;
            const y = v * h / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
        
        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors[theme];
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    drawParticles(ctx, w, h, theme) {
        // Update and draw particles
        const avgFreq = this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length;
        const intensity = avgFreq / 255;
        
        // Theme-based particle colors
        const baseColors = {
            'dark': { r: 96, g: 165, b: 250 },
            'light': { r: 37, g: 99, b: 235 },
            'neon': { r: 255, g: 0, b: 200 }
        };
        
        const baseColor = baseColors[theme];
        
        // Add background gradient for depth effect
        const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h)/2);
        gradient.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.1)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        this.particles.forEach((particle, index) => {
            // Update particle position with more dynamic movement
            const speedMultiplier = 1 + intensity * 3;
            particle.x += particle.vx * speedMultiplier + Math.sin(this.time * 0.01 + index) * 0.5;
            particle.y += particle.vy * speedMultiplier + Math.cos(this.time * 0.01 + index) * 0.5;
            
            // Bounce off edges with energy loss
            if (particle.x <= 0 || particle.x >= w) {
                particle.vx *= -0.8;
                particle.x = Math.max(0, Math.min(w, particle.x));
            }
            if (particle.y <= 0 || particle.y >= h) {
                particle.vy *= -0.8;
                particle.y = Math.max(0, Math.min(h, particle.y));
            }
            
            // Get frequency data for this particle
            const freqValue = this.dataArray[particle.frequency] / 255;
            const size = particle.size * (1 + freqValue * 4);
            
            // Create dynamic color based on frequency and position
            const hue = (freqValue * 360 + this.time * 2) % 360;
            const saturation = 70 + (freqValue * 30);
            const lightness = 50 + (freqValue * 40);
            const alpha = 0.4 + freqValue * 0.6;
            
            // Draw particle with pulsing effect
            const pulseSize = size + Math.sin(this.time * 0.05 + index) * (size * 0.2);
            
            // Outer glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.5})`;
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, pulseSize * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner bright core
            ctx.shadowBlur = 10;
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${Math.min(90, lightness + 20)}%, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Center highlight
            ctx.shadowBlur = 5;
            ctx.fillStyle = `hsla(${hue}, ${saturation}%, 95%, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, pulseSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
            // Connect nearby particles with lines for extra visual interest
            if (freqValue > 0.3) {
                this.particles.slice(index + 1).forEach(otherParticle => {
                    const distance = Math.sqrt(
                        Math.pow(particle.x - otherParticle.x, 2) + 
                        Math.pow(particle.y - otherParticle.y, 2)
                    );
                    
                    if (distance < 100 && Math.random() < 0.1) {
                        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.2})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.stroke();
                    }
                });
            }
        });
    }

    drawEnhancedMandala(ctx, w, h, theme) {
        const centerX = w / 2;
        const centerY = h / 2;
        const maxRadius = Math.min(w, h) / 2 - 20;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Reduced layers for better performance
        const layers = 8;
        this.frameCount++;
        
        for (let layer = 0; layer < layers; layer++) {
            const numPoints = 8 + layer * 3; // Fewer points per layer
            const radius = (maxRadius / layers) * (layer + 1);
            
            for (let i = 0; i < numPoints; i++) {
                const angle = (Math.PI * 2 * i) / numPoints + this.time * 0.015 + (layer * 0.1);
                const freqIndex = Math.floor(((i + layer * numPoints) % this.bufferLength));
                const freqValue = this.dataArray[freqIndex] / 255;
                
                if (freqValue < 0.1) continue; // Skip very low frequency points
                
                const pointRadius = radius * (0.6 + freqValue * 0.8);
                const x = Math.cos(angle) * pointRadius;
                const y = Math.sin(angle) * pointRadius;
                
                const hue = ((layer * 30 + i * 10 + this.time * 3) | 0) % 360;
                const saturation = 60 + (freqValue * 40 | 0);
                const lightness = 40 + (freqValue * 50 | 0);
                const alpha = 0.4 + freqValue * 0.6;
                
                const pointSize = 2 + freqValue * 4;
                
                ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                
                // Reduced shadow blur for performance
                if (freqValue > 0.5) {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
                }
                
                ctx.beginPath();
                ctx.arc(x, y, pointSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Simplified connection lines - only every other frame for performance
                if (freqValue > 0.3 && this.frameCount % 2 === 0) {
                    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.3})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            }
        }
        
        // Simplified central core
        const avgFreq = this.dataArray.slice(0, 32).reduce((a, b) => a + b, 0) / 32 / 255;
        const coreSize = 8 + avgFreq * 12;
        const coreHue = (this.time * 3 | 0) % 360;
        
        ctx.fillStyle = `hsla(${coreHue}, 90%, 70%, ${0.8 + avgFreq * 0.2})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${coreHue}, 90%, 70%, 0.7)`;
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    drawKaleidoscope(ctx, w, h, theme) {
        const centerX = w / 2;
        const centerY = h / 2;
        const segments = 6;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Draw each kaleidoscope segment
        for (let segment = 0; segment < segments; segment++) {
            ctx.save();
            ctx.rotate((Math.PI * 2 * segment) / segments);
            
            // Create clipping path for the segment
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI / segments);
            ctx.closePath();
            ctx.clip();
            
            // Reduced data points for better performance
            for (let i = 0; i < this.bufferLength / 16; i++) {
                const freqValue = this.dataArray[i] / 255;
                if (freqValue < 0.2) continue;
                
                const radius = (i / this.bufferLength * 16) * Math.min(w, h) * 0.4;
                const angle = (i * 0.2 + this.time * 0.02) % (Math.PI * 2);
                
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                const size = 2 + freqValue * 6;
                const hue = (i * 8 + this.time * 10 | 0) % 360;
                const alpha = freqValue * 0.7;
                
                // Draw mirrored pattern with reduced shadow blur
                ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
                if (freqValue > 0.4) {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.4)`;
                }
                
                // Original position
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Mirrored position
                ctx.beginPath();
                ctx.arc(x, -y, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Simplified connecting lines
                if (freqValue > 0.6 && this.frameCount % 3 === 0) {
                    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, -y);
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    drawDNA(ctx, w, h, theme) {
        const centerY = h / 2;
        const amplitude = h / 4;
        const frequency = 0.01;
        
        ctx.strokeStyle = theme === 'neon' ? '#ff00ff' : '#00ffff';
        ctx.lineWidth = 3;
        
        // Draw DNA double helix
        for (let strand = 0; strand < 2; strand++) {
            ctx.beginPath();
            
            for (let x = 0; x < w; x += 5) {
                const freqIndex = Math.floor((x / w) * this.bufferLength);
                const freqValue = this.dataArray[freqIndex] / 255;
                
                const offset = strand * Math.PI;
                const y = centerY + Math.sin(x * frequency + this.time * 0.02 + offset) * (amplitude * (0.5 + freqValue));
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                // Add base pairs
                if (x % 30 === 0 && freqValue > 0.2) {
                    const otherY = centerY + Math.sin(x * frequency + this.time * 0.02 + Math.PI - offset) * (amplitude * (0.5 + freqValue));
                    
                    ctx.save();
                    ctx.strokeStyle = `hsla(${(x + this.time * 10) % 360}, 70%, 60%, ${freqValue})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, otherY);
                    ctx.stroke();
                    ctx.restore();
                    
                    // Draw nucleotide bases
                    const bases = ['A', 'T', 'C', 'G'];
                    ctx.fillStyle = `hsla(${(x + this.time * 10) % 360}, 70%, 60%, ${freqValue})`;
                    ctx.font = '12px monospace';
                    ctx.fillText(bases[Math.floor(Math.random() * 4)], x - 5, y - 5);
                }
            }
            
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
    }

    drawSpiral(ctx, w, h, theme) {
        const centerX = w / 2;
        const centerY = h / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        const spirals = 3;
        for (let spiral = 0; spiral < spirals; spiral++) {
            ctx.beginPath();
            
            const points = 200;
            for (let i = 0; i < points; i++) {
                const freqIndex = Math.floor((i / points) * this.bufferLength);
                const freqValue = this.dataArray[freqIndex] / 255;
                
                const angle = (i / points) * Math.PI * 8 + (spiral * Math.PI * 2 / spirals) + this.time * 0.02;
                const radius = (i / points) * Math.min(w, h) * 0.4 * (0.5 + freqValue);
                
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                // Add glowing points at frequency peaks
                if (freqValue > 0.5) {
                    const hue = (angle * 57.3 + this.time * 5) % 360;
                    ctx.save();
                    ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${freqValue})`;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.8)`;
                    ctx.beginPath();
                    ctx.arc(x, y, 2 + freqValue * 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
            
            const hue = (spiral * 120 + this.time * 2) % 360;
            ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.8)`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = `hsla(${hue}, 70%, 50%, 0.5)`;
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    
    drawSoundRipples(ctx, w, h, theme) {
        const centerX = w / 2;
        const centerY = h / 2;
        const avgFreq = this.dataArray.reduce((a, b) => a + b, 0) / this.dataArray.length / 255;
        
        // Create multiple ripple sources based on frequency peaks
        const rippleSources = [];
        for (let i = 0; i < this.bufferLength / 16; i++) {
            const freqValue = this.dataArray[i] / 255;
            if (freqValue > 0.3) {
                const angle = (i / (this.bufferLength / 16)) * Math.PI * 2;
                const distance = freqValue * Math.min(w, h) * 0.2;
                
                rippleSources.push({
                    x: centerX + Math.cos(angle) * distance,
                    y: centerY + Math.sin(angle) * distance,
                    intensity: freqValue,
                    frequency: i
                });
            }
        }
        
        // Draw background gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(w, h) / 2);
        gradient.addColorStop(0, `rgba(0, 20, 40, ${avgFreq * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // Draw concentric ripples from center
        const maxRipples = 8;
        for (let i = 0; i < maxRipples; i++) {
            const progress = (i / maxRipples);
            const rippleRadius = progress * Math.max(w, h) * 0.6;
            const adjustedRadius = rippleRadius + Math.sin(this.time * 0.1 + i) * 20;
            
            // Audio-reactive ripple size and opacity
            const freqIndex = Math.floor(progress * this.bufferLength);
            const freqValue = this.dataArray[freqIndex] / 255;
            const opacity = (1 - progress) * 0.4 * (0.3 + freqValue * 0.7);
            const lineWidth = 1 + freqValue * 3;
            
            if (opacity > 0.01) {
                const hue = (progress * 60 + this.time * 2) % 360;
                ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${opacity})`;
                ctx.lineWidth = lineWidth;
                ctx.shadowBlur = 5 + freqValue * 15;
                ctx.shadowColor = `hsla(${hue}, 70%, 60%, ${opacity * 0.5})`;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, adjustedRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // Draw ripples from frequency peak sources
        rippleSources.forEach((source, sourceIndex) => {
            const rippleCount = 5;
            for (let i = 0; i < rippleCount; i++) {
                const progress = i / rippleCount;
                const rippleRadius = progress * 100 * source.intensity;
                const adjustedRadius = rippleRadius + Math.sin(this.time * 0.15 + sourceIndex + i) * 10;
                
                const opacity = (1 - progress) * source.intensity * 0.6;
                const lineWidth = 1 + source.intensity * 2;
                
                if (opacity > 0.01 && adjustedRadius > 0) {
                    const hue = (source.frequency * 5 + this.time * 3) % 360;
                    ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${opacity})`;
                    ctx.lineWidth = lineWidth;
                    ctx.shadowBlur = 3 + source.intensity * 10;
                    ctx.shadowColor = `hsla(${hue}, 80%, 70%, ${opacity * 0.3})`;
                    
                    ctx.beginPath();
                    ctx.arc(source.x, source.y, adjustedRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            
            // Draw source point
            ctx.fillStyle = `hsla(${(source.frequency * 5 + this.time * 3) % 360}, 90%, 80%, ${source.intensity})`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath();
            ctx.arc(source.x, source.y, 2 + source.intensity * 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.shadowBlur = 0;
    }
    
    // Helper function to convert HSL to RGB
    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return { r, g, b };
    }
}
