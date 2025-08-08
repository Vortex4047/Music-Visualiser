
// Simple Three.js visualizer - particle field reacts to frequency data
class ThreeVisualizer {
    constructor(containerId, audioAnalyser) {
        this.analyser = audioAnalyser;
        this.container = document.getElementById(containerId) || document.body;
        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 2000);
        this.camera.position.z = 400;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.container.appendChild(this.renderer.domElement);

        const particles = 1024;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particles * 3);
        const scales = new Float32Array(particles);

        for (let i = 0; i < particles; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 800;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
            scales[i] = 1.0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xffffff) },
            },
            vertexShader: `
                attribute float scale;
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = scale * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            transparent: true
        });

        this.points = new THREE.Points(geometry, material);
        this.scene.add(this.points);

        this.posArray = positions;
        this.scales = scales;
        this.particleCount = particles;

        window.addEventListener('resize', () => this.onResize());
        this.animate();
    }

    onResize() {
        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.analyser) {
            const freqData = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(freqData);
            // map freqData to particle scales
            for (let i = 0; i < this.particleCount; i++) {
                const v = freqData[i % freqData.length] / 255;
                this.scales[i] = 2 + v * 30;
                // slightly move positions for life
                this.posArray[i*3 + 0] += Math.sin(i + performance.now() * 0.0002) * (0.3 + v * 2);
                this.posArray[i*3 + 1] += Math.cos(i + performance.now() * 0.0003) * (0.3 + v * 2);
            }
            this.points.geometry.attributes.scale.needsUpdate = true;
            this.points.geometry.attributes.position.needsUpdate = true;
        }

        // rotate scene slowly
        this.scene.rotation.y += 0.001;
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        if (this.renderer && this.renderer.domElement) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}

window.ThreeVisualizer = ThreeVisualizer;
