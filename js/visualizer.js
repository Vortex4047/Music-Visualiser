// Visualization Engine for AI Music Visualizer
// Uses WebGL via Three.js for creating dynamic visualizations

class Visualizer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.geometry = null;
        this.material = null;
        this.mesh = null;
        this.analyser = null;
        this.frequencyData = null;
        this.currentGenre = 'pop';
        this.visualizationType = 'particles';
        this.particles = [];
        this.barGraphs = [];
        this.waveformLines = [];
        this.quality = 'medium'; // 'low', 'medium', 'high'
    }

    // Initialize the visualization engine
    async init() {
        try {
            // Auto-detect device performance and set quality
            this.autoDetectQuality();
            
            // Set up Three.js scene
            this.setupScene();
            
            // Create initial visualization elements
            this.createVisualizationElements();
            
            // Start animation loop
            this.animate();
            
            console.log('Visualization engine initialized');
        } catch (error) {
            throw new Error('Failed to initialize visualization engine: ' + error.message);
        }
    }

    // Set up Three.js scene
    setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.z = 5;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('visualizer'),
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    // Handle window resize
    handleResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    // Create visualization elements
    createVisualizationElements() {
        // Create particle system for visualization
        this.createParticleSystem();
        
        // Create bar graph visualization
        this.createBarGraph();
        
        // Create waveform visualization
        this.createWaveformVisualization();
        
        // Add some ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }

    // Create particle system
    createParticleSystem() {
        // Clear existing particles
        this.particles.forEach(particle => this.scene.remove(particle));
        this.particles = [];
        
        // Get quality-based settings
        const settings = this.getQualitySettings();
        
        // Create particle geometry
        const particleCount = settings.particleCount;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // Initialize particle positions and colors
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random positions
            positions[i3] = (Math.random() - 0.5) * 10;
            positions[i3 + 1] = (Math.random() - 0.5) * 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 10;
            
            // Initial colors
            colors[i3] = Math.random();
            colors[i3 + 1] = Math.random();
            colors[i3 + 2] = Math.random();
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create material
        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        // Create particle system
        const particleSystem = new THREE.Points(geometry, material);
        this.scene.add(particleSystem);
        this.particles.push(particleSystem);
    }

    // Create bar graph visualization
    createBarGraph() {
        // Clear existing bars
        this.barGraphs.forEach(bar => this.scene.remove(bar));
        this.barGraphs = [];
        
        // Get quality-based settings
        const settings = this.getQualitySettings();
        
        // Create bars for frequency visualization
        const barCount = settings.barCount;
        const barGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
        
        for (let i = 0; i < barCount; i++) {
            const material = new THREE.MeshPhongMaterial({
                color: this.getGenreColor(this.currentGenre),
                transparent: true,
                opacity: 0.7
            });
            
            const bar = new THREE.Mesh(barGeometry, material);
            
            // Position bars in a circle
            const angle = (i / barCount) * Math.PI * 2;
            const radius = 2;
            bar.position.x = Math.cos(angle) * radius;
            bar.position.z = Math.sin(angle) * radius;
            bar.position.y = 0;
            
            // Rotate bars to face center
            bar.lookAt(0, 0, 0);
            bar.rotateX(Math.PI / 2);
            
            this.scene.add(bar);
            this.barGraphs.push(bar);
        }
    }

    // Create waveform visualization
    createWaveformVisualization() {
        // Clear existing waveform lines
        this.waveformLines.forEach(line => this.scene.remove(line));
        this.waveformLines = [];
        
        // Get quality-based settings
        const settings = this.getQualitySettings();
        
        // Create a line for waveform visualization
        const points = [];
        const pointCount = settings.waveformPoints;
        
        // Initialize points in a sine wave pattern
        for (let i = 0; i < pointCount; i++) {
            const x = (i / pointCount) * 10 - 5; // Range from -5 to 5
            const y = 0;
            const z = 0;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        // Create geometry and material
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: this.getGenreColor(this.currentGenre),
            linewidth: 2
        });
        
        // Create line and add to scene
        const line = new THREE.Line(geometry, material);
        line.position.y = 2; // Position above other visualizations
        this.scene.add(line);
        this.waveformLines.push(line);
    }

    // Update visualization based on audio analysis
    update(analysis, timestamp, audioData = null) {
        // Get quality-based settings
        const settings = this.getQualitySettings();
        
        // Skip frames based on quality settings
        if (settings.updateInterval > 1) {
            if (!this.frameCount) this.frameCount = 0;
            this.frameCount++;
            if (this.frameCount % settings.updateInterval !== 0) {
                return;
            }
        }
        
        // Update genre if changed
        if (analysis.genre !== this.currentGenre) {
            this.currentGenre = analysis.genre;
            this.updateVisualizationStyle();
        }
        
        // Update particle system based on beat
        this.updateParticles(analysis.beat);
        
        // Update bar graph based on frequency
        this.updateBarGraph(analysis.frequency);
        
        // Update waveform visualization
        this.updateWaveformVisualization(audioData);
        
        // Rotate camera slowly
        if (this.camera) {
            this.camera.position.x = Math.sin(timestamp * 0.0001) * 2;
            this.camera.position.z = Math.cos(timestamp * 0.0001) * 2;
            this.camera.lookAt(this.scene.position);
        }
    }

    // Update waveform visualization
    updateWaveformVisualization(audioData) {
        // Update waveform lines based on time domain data
        if (this.waveformLines.length > 0 && audioData) {
            const line = this.waveformLines[0];
            const geometry = line.geometry;
            const positions = geometry.attributes.position.array;
            
            // Update positions based on time domain data
            if (audioData.timeDomainData) {
                // Reduce the number of points we update for better performance
                const updateInterval = Math.max(1, Math.floor(audioData.timeDomainData.length / 64));
                const dataLength = Math.min(audioData.timeDomainData.length, positions.length / 3);
                
                for (let i = 0; i < dataLength; i += updateInterval) {
                    const index = i * 3;
                    // Normalize the timeDomainData to -1 to 1 range
                    const normalizedValue = (audioData.timeDomainData[i] / 128) - 1;
                    positions[index + 1] = normalizedValue * 3; // Reduce scale for better performance
                }
                
                geometry.attributes.position.needsUpdate = true;
            }
            
            // Update color based on genre
            const material = line.material;
            material.color.set(this.getGenreColor(this.currentGenre));
        }
    }

    // Update particle system
    updateParticles(beat) {
        if (this.particles.length > 0) {
            const particleSystem = this.particles[0];
            const positions = particleSystem.geometry.attributes.position.array;
            const colors = particleSystem.geometry.attributes.color.array;
            
            // Limit the number of particles we update each frame for better performance
            const updateLimit = Math.min(500, positions.length / 3); // Update max 500 particles per frame
            const startIndex = Math.floor((performance.now() / 16) % (positions.length / 3)) * 3;
            
            // Update particle positions based on beat
            for (let i = 0; i < updateLimit * 3; i += 3) {
                const actualIndex = (startIndex + i) % positions.length;
                
                // Add movement based on beat strength and pattern
                const bandIndex = Math.floor(actualIndex / 3) % beat.pattern.length;
                const bandStrength = beat.pattern[bandIndex] || 0;
                
                // Movement is influenced by both overall beat strength and band-specific strength
                const movementFactor = beat.strength * (0.5 + bandStrength * 0.5);
                
                positions[actualIndex] += (Math.random() - 0.5) * movementFactor * 0.1;
                positions[actualIndex + 1] += (Math.random() - 0.5) * movementFactor * 0.1;
                positions[actualIndex + 2] += (Math.random() - 0.5) * movementFactor * 0.1;
                
                // Keep particles within bounds
                if (Math.abs(positions[actualIndex]) > 5) positions[actualIndex] *= 0.9;
                if (Math.abs(positions[actualIndex + 1]) > 5) positions[actualIndex + 1] *= 0.9;
                if (Math.abs(positions[actualIndex + 2]) > 5) positions[actualIndex + 2] *= 0.9;
                
                // Update colors based on beat strength and position
                const colorIndex = actualIndex;
                colors[colorIndex] = 0.5 + Math.sin(timestamp * 0.001 + actualIndex) * 0.5;
                colors[colorIndex + 1] = 0.5 + Math.cos(timestamp * 0.001 + actualIndex) * 0.5;
                colors[colorIndex + 2] = Math.min(1, beat.strength + bandStrength * 0.5);
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
            particleSystem.geometry.attributes.color.needsUpdate = true;
        }
    }

    // Update bar graph
    updateBarGraph(frequency) {
        // Update bar heights based on frequency distribution
        const barCount = Math.min(this.barGraphs.length, 32); // Reduce bar count for better performance
        
        // Get the frequency band keys
        const bandKeys = Object.keys(frequency.distribution);
        
        // Cache the genre color to avoid repeated calculations
        const genreColor = this.getGenreColor(this.currentGenre);
        const colorObj = new THREE.Color(genreColor);
        
        for (let i = 0; i < barCount; i++) {
            const bar = this.barGraphs[i];
            if (bar) {
                // Calculate height based on frequency data
                // Use the band key that corresponds to this bar
                const bandKey = bandKeys[i % bandKeys.length];
                const bandValue = frequency.distribution[bandKey] || 0;
                
                // Calculate height with some additional dynamics
                const baseHeight = 0.5 + bandValue * 2; // Reduce multiplier for smoother animation
                const pulseEffect = 0.05 * Math.sin(timestamp * 0.003 + i); // Slower pulse effect
                const height = Math.max(0.1, baseHeight + pulseEffect);
                
                bar.scale.y = height;
                bar.position.y = height / 2;
                
                // Update color based on genre and frequency intensity
                const material = bar.material;
                
                // Adjust color intensity based on frequency intensity
                const intensity = 0.7 + bandValue * 0.2; // Reduce intensity multiplier
                material.color.setRGB(
                    colorObj.r * intensity,
                    colorObj.g * intensity,
                    colorObj.b * intensity
                );
                
                // Add some pulsing effect based on frequency
                material.opacity = 0.7 + bandValue * 0.2 + Math.sin(timestamp * 0.005 + i) * 0.05; // Reduce opacity variation
            }
        }
    }

    // Update visualization style based on genre
    updateVisualizationStyle() {
        // Recreate bar graph with new genre colors
        this.createBarGraph();
        
        // Recreate waveform visualization with new genre colors
        this.createWaveformVisualization();
        
        // Update particle colors
        if (this.particles.length > 0) {
            const particleSystem = this.particles[0];
            const colors = particleSystem.geometry.attributes.color.array;
            
            const genreColor = this.getGenreColor(this.currentGenre);
            const colorObj = new THREE.Color(genreColor);
            
            for (let i = 0; i < colors.length; i += 3) {
                colors[i] = colorObj.r;
                colors[i + 1] = colorObj.g;
                colors[i + 2] = colorObj.b;
            }
            
            particleSystem.geometry.attributes.color.needsUpdate = true;
        }
    }

    // Get color for a specific genre
    getGenreColor(genre) {
        const genreColors = {
            'rock': 0xff416c,
            'pop': 0x5433ff,
            'jazz': 0xf7971e,
            'classical': 0x8e2de2,
            'hiphop': 0x00c9ff,
            'electronic': 0xff0084
        };
        
        return genreColors[genre] || 0x5433ff; // Default to pop color
    }

    // Animation loop
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update any time-based animations
        if (this.particles.length > 0) {
            const particleSystem = this.particles[0];
            if (particleSystem.rotation) {
                particleSystem.rotation.y += 0.001;
            }
        }
        
        // Render the scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // Set visualization quality
    setQuality(quality) {
        if (['low', 'medium', 'high'].includes(quality)) {
            this.quality = quality;
            // Recreate visualization elements with new quality settings
            this.createVisualizationElements();
        }
    }
    
    // Get quality-based settings
    getQualitySettings() {
        switch (this.quality) {
            case 'low':
                return {
                    particleCount: 200,
                    barCount: 16,
                    waveformPoints: 32,
                    updateInterval: 2 // Update every 2 frames
                };
            case 'medium':
                return {
                    particleCount: 500,
                    barCount: 32,
                    waveformPoints: 64,
                    updateInterval: 1 // Update every frame
                };
            case 'high':
                return {
                    particleCount: 1000,
                    barCount: 64,
                    waveformPoints: 128,
                    updateInterval: 1 // Update every frame
                };
            default:
                return {
                    particleCount: 500,
                    barCount: 32,
                    waveformPoints: 64,
                    updateInterval: 1
                };
        }
    }
    
    // Auto-detect device performance and set quality
    autoDetectQuality() {
        // Check device capabilities
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowEndDevice = navigator.hardwareConcurrency <= 4;
        const isFirefox = navigator.userAgent.includes('Firefox');
        
        // Check screen size
        const isSmallScreen = window.innerWidth < 768;
        
        // Set quality based on device capabilities
        if (isMobile || isLowEndDevice || isSmallScreen) {
            this.setQuality('low');
        } else if (isFirefox) {
            // Firefox may have performance issues with high settings
            this.setQuality('medium');
        } else {
            this.setQuality('high');
        }
        
        console.log(`Auto-detected quality setting: ${this.quality}`);
    }
}