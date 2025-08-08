// music-games.js - Mini-games that sync with music
class MusicGamesController {
    constructor() {
        this.modal = document.getElementById('games-modal');
        this.gameCanvas = document.getElementById('game-canvas');
        this.gameCtx = this.gameCanvas?.getContext('2d');
        this.currentGame = null;
        this.isOpen = false;
        this.isPlaying = false;
        this.score = 0;
        this.analyser = null;
        
        this.games = {
            rhythm: new BeatCatcherGame(),
            frequency: new FrequencyRunnerGame(),
            spectrum: new SpectrumSnakeGame(),
            particles: new ParticleShooterGame()
        };
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Modal controls
        const openBtn = document.getElementById('game-btn');
        const closeBtn = document.getElementById('close-games');
        
        openBtn?.addEventListener('click', () => this.show());
        closeBtn?.addEventListener('click', () => this.hide());
        
        // Click outside to close
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
        
        // Game selection
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectGame(card.dataset.game);
            });
        });
        
        // Game controls
        const startBtn = document.getElementById('start-game');
        const pauseBtn = document.getElementById('pause-game');
        const stopBtn = document.getElementById('stop-game');
        
        startBtn?.addEventListener('click', () => this.startGame());
        pauseBtn?.addEventListener('click', () => this.pauseGame());
        stopBtn?.addEventListener('click', () => this.stopGame());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            switch(e.key) {
                case 'Escape':
                    this.hide();
                    break;
                case ' ':
                    e.preventDefault();
                    if (this.isPlaying) {
                        this.pauseGame();
                    } else if (this.currentGame) {
                        this.startGame();
                    }
                    break;
            }
        });
    }
    
    show() {
        if (!this.modal) {
            console.error('Games modal not found!');
            return;
        }
        this.modal.style.display = 'flex';
        this.isOpen = true;
        
        // Resize game canvas
        this.resizeGameCanvas();
        
        // Add body scroll lock
        document.body.style.overflow = 'hidden';
        
        console.log('Games modal shown');
    }
    
    hide() {
        this.modal.style.display = 'none';
        this.isOpen = false;
        this.stopGame();
        
        // Remove body scroll lock
        document.body.style.overflow = '';
        
        // Hide game overlay
        const gameOverlay = document.getElementById('game-overlay');
        if (gameOverlay) {
            gameOverlay.style.display = 'none';
        }
    }
    
    selectGame(gameType) {
        // Update UI
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.game === gameType) {
                card.classList.add('selected');
            }
        });
        
        // Show game controls
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            gameControls.style.display = 'flex';
        }
        
        // Set current game
        this.currentGame = this.games[gameType];
        this.currentGame.initialize(this.gameCanvas, this.gameCtx);
        
        // Reset score
        this.score = 0;
        this.updateScore();
    }
    
    startGame() {
        if (!this.currentGame || this.isPlaying) return;
        
        this.isPlaying = true;
        
        // Show game overlay
        const gameOverlay = document.getElementById('game-overlay');
        if (gameOverlay) {
            gameOverlay.style.display = 'block';
            gameOverlay.style.pointerEvents = 'auto';
        }
        
        // Hide modal, show game
        this.modal.style.display = 'none';
        
        // Resize canvas
        this.resizeGameCanvas();
        
        // Start game loop
        this.currentGame.start(this.analyser);
        this.gameLoop();
        
        // Update UI
        const startBtn = document.getElementById('start-game');
        const pauseBtn = document.getElementById('pause-game');
        if (startBtn) startBtn.textContent = '🔄 Restart';
        if (pauseBtn) pauseBtn.style.display = 'inline-block';
    }
    
    pauseGame() {
        if (!this.currentGame || !this.isPlaying) return;
        
        this.isPlaying = false;
        this.currentGame.pause();
        
        // Show modal again
        this.modal.style.display = 'flex';
        
        // Update UI
        const startBtn = document.getElementById('start-game');
        if (startBtn) startBtn.textContent = '▶️ Resume';
    }
    
    stopGame() {
        if (!this.currentGame) return;
        
        this.isPlaying = false;
        this.currentGame.stop();
        
        // Hide game overlay
        const gameOverlay = document.getElementById('game-overlay');
        if (gameOverlay) {
            gameOverlay.style.display = 'none';
            gameOverlay.style.pointerEvents = 'none';
        }
        
        // Show modal
        this.modal.style.display = 'flex';
        
        // Update UI
        const startBtn = document.getElementById('start-game');
        const pauseBtn = document.getElementById('pause-game');
        if (startBtn) startBtn.textContent = '🎮 Start Game';
        if (pauseBtn) pauseBtn.style.display = 'none';
        
        // Reset score
        this.score = 0;
        this.updateScore();
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        
        // Update current game
        if (this.currentGame) {
            const gameScore = this.currentGame.update(this.analyser);
            if (gameScore !== null) {
                this.score += gameScore;
                this.updateScore();
            }
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateScore() {
        const scoreElement = document.getElementById('current-score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }
    }
    
    setAnalyser(analyser) {
        this.analyser = analyser;
    }
    
    resizeGameCanvas() {
        if (!this.gameCanvas) return;
        
        const container = document.querySelector('.visualization-container');
        if (container) {
            this.gameCanvas.width = container.clientWidth;
            this.gameCanvas.height = container.clientHeight;
        }
    }
}

// Beat Catcher Game - Catch falling beats
class BeatCatcherGame {
    constructor() {
        this.beats = [];
        this.paddle = { x: 0, y: 0, width: 80, height: 20 };
        this.isInitialized = false;
        this.lastBeatTime = 0;
    }
    
    initialize(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isInitialized = true;
        this.beats = [];
        
        // Center paddle
        this.paddle.x = canvas.width / 2 - this.paddle.width / 2;
        this.paddle.y = canvas.height - 50;
        
        // Mouse control
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.paddle.x = e.clientX - rect.left - this.paddle.width / 2;
        });
    }
    
    start(analyser) {
        this.analyser = analyser;
        this.lastBeatTime = Date.now();
    }
    
    update(analyser) {
        if (!this.isInitialized) return null;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Detect beats (simplified)
        const avgFreq = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const now = Date.now();
        
        // Create new beats on strong signals
        if (avgFreq > 100 && now - this.lastBeatTime > 300) {
            this.beats.push({
                x: Math.random() * (this.canvas.width - 30),
                y: 0,
                size: 15 + (avgFreq / 255) * 15,
                speed: 2 + (avgFreq / 255) * 3,
                hue: Math.random() * 360,
                caught: false
            });
            this.lastBeatTime = now;
        }
        
        // Update and draw
        this.draw();
        return this.checkCollisions();
    }
    
    draw() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw paddle
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        
        // Draw beats
        this.beats.forEach((beat, index) => {
            beat.y += beat.speed;
            
            ctx.fillStyle = `hsl(${beat.hue}, 70%, 60%)`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsl(${beat.hue}, 70%, 60%)`;
            
            ctx.beginPath();
            ctx.arc(beat.x, beat.y, beat.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
            // Remove beats that fall off screen
            if (beat.y > this.canvas.height + beat.size) {
                this.beats.splice(index, 1);
            }
        });
    }
    
    checkCollisions() {
        let score = 0;
        
        this.beats.forEach((beat, index) => {
            if (!beat.caught &&
                beat.x > this.paddle.x &&
                beat.x < this.paddle.x + this.paddle.width &&
                beat.y > this.paddle.y &&
                beat.y < this.paddle.y + this.paddle.height) {
                
                beat.caught = true;
                score += Math.floor(beat.size);
                
                // Visual feedback
                beat.size *= 1.5;
                beat.hue = 120; // Green for success
                
                setTimeout(() => {
                    this.beats.splice(this.beats.indexOf(beat), 1);
                }, 200);
            }
        });
        
        return score;
    }
    
    pause() {}
    stop() {
        this.beats = [];
    }
}

// Frequency Runner Game - Navigate through frequency waves
class FrequencyRunnerGame {
    constructor() {
        this.player = { x: 0, y: 0, size: 20 };
        this.obstacles = [];
        this.isInitialized = false;
    }
    
    initialize(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isInitialized = true;
        this.obstacles = [];
        
        // Center player
        this.player.x = 50;
        this.player.y = canvas.height / 2;
        
        // Keyboard controls
        this.keys = {};
        document.addEventListener('keydown', (e) => this.keys[e.key] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }
    
    start(analyser) {
        this.analyser = analyser;
    }
    
    update(analyser) {
        if (!this.isInitialized) return null;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Player movement
        if (this.keys['ArrowUp'] || this.keys['w']) this.player.y -= 5;
        if (this.keys['ArrowDown'] || this.keys['s']) this.player.y += 5;
        if (this.keys['ArrowLeft'] || this.keys['a']) this.player.x -= 3;
        if (this.keys['ArrowRight'] || this.keys['d']) this.player.x += 3;
        
        // Keep player in bounds
        this.player.x = Math.max(this.player.size, Math.min(this.canvas.width - this.player.size, this.player.x));
        this.player.y = Math.max(this.player.size, Math.min(this.canvas.height - this.player.size, this.player.y));
        
        // Create obstacles based on frequency data
        if (Math.random() < 0.02) {
            const freqIndex = Math.floor(Math.random() * dataArray.length);
            const intensity = dataArray[freqIndex] / 255;
            
            this.obstacles.push({
                x: this.canvas.width,
                y: Math.random() * (this.canvas.height - 100) + 50,
                width: 20 + intensity * 40,
                height: 20 + intensity * 40,
                speed: 3 + intensity * 2,
                hue: (freqIndex / dataArray.length) * 360
            });
        }
        
        this.draw();
        return this.checkCollisions() ? -10 : 1; // Lose points for hitting obstacles
    }
    
    draw() {
        const ctx = this.ctx;
        
        // Clear with trail effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw player
        ctx.fillStyle = '#00ff88';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ff88';
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw obstacles
        this.obstacles.forEach((obstacle, index) => {
            obstacle.x -= obstacle.speed;
            
            ctx.fillStyle = `hsl(${obstacle.hue}, 70%, 50%)`;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Remove off-screen obstacles
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(index, 1);
            }
        });
    }
    
    checkCollisions() {
        return this.obstacles.some(obstacle => 
            this.player.x + this.player.size > obstacle.x &&
            this.player.x - this.player.size < obstacle.x + obstacle.width &&
            this.player.y + this.player.size > obstacle.y &&
            this.player.y - this.player.size < obstacle.y + obstacle.height
        );
    }
    
    pause() {}
    stop() {
        this.obstacles = [];
        this.keys = {};
    }
}

// Spectrum Snake Game - Snake follows music spectrum
class SpectrumSnakeGame {
    constructor() {
        this.snake = [{ x: 200, y: 200 }];
        this.food = { x: 0, y: 0 };
        this.direction = { x: 20, y: 0 };
        this.isInitialized = false;
    }
    
    initialize(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isInitialized = true;
        this.spawnFood();
        
        // Simplified controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp': this.direction = { x: 0, y: -20 }; break;
                case 'ArrowDown': this.direction = { x: 0, y: 20 }; break;
                case 'ArrowLeft': this.direction = { x: -20, y: 0 }; break;
                case 'ArrowRight': this.direction = { x: 20, y: 0 }; break;
            }
        });
    }
    
    start(analyser) {
        this.analyser = analyser;
        this.gameInterval = setInterval(() => this.moveSnake(), 150);
    }
    
    update(analyser) {
        if (!this.isInitialized) return null;
        
        this.draw();
        return this.checkFood() ? 10 : 0;
    }
    
    moveSnake() {
        if (!this.isInitialized) return;
        
        const head = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.canvas.width || head.y < 0 || head.y >= this.canvas.height) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check if food eaten
        if (head.x === this.food.x && head.y === this.food.y) {
            this.spawnFood();
        } else {
            this.snake.pop();
        }
    }
    
    draw() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw snake
        this.snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? '#ff6b35' : '#ffaa44';
            ctx.fillRect(segment.x, segment.y, 18, 18);
        });
        
        // Draw food
        ctx.fillStyle = '#00ff88';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff88';
        ctx.fillRect(this.food.x, this.food.y, 18, 18);
        ctx.shadowBlur = 0;
    }
    
    spawnFood() {
        this.food = {
            x: Math.floor(Math.random() * (this.canvas.width / 20)) * 20,
            y: Math.floor(Math.random() * (this.canvas.height / 20)) * 20
        };
    }
    
    checkFood() {
        return this.snake[0].x === this.food.x && this.snake[0].y === this.food.y;
    }
    
    gameOver() {
        clearInterval(this.gameInterval);
        // Could add game over screen here
    }
    
    pause() {
        clearInterval(this.gameInterval);
    }
    
    stop() {
        clearInterval(this.gameInterval);
        this.snake = [{ x: 200, y: 200 }];
        this.spawnFood();
    }
}

// Particle Shooter Game - Shoot particles that sync with beats
class ParticleShooterGame {
    constructor() {
        this.player = { x: 0, y: 0 };
        this.bullets = [];
        this.targets = [];
        this.isInitialized = false;
    }
    
    initialize(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isInitialized = true;
        
        this.player.x = canvas.width / 2;
        this.player.y = canvas.height - 50;
        
        // Mouse controls
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.player.x = e.clientX - rect.left;
        });
        
        canvas.addEventListener('click', () => this.shoot());
    }
    
    start(analyser) {
        this.analyser = analyser;
    }
    
    update(analyser) {
        if (!this.isInitialized) return null;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Create targets based on frequency peaks
        const avgFreq = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (avgFreq > 80 && Math.random() < 0.05) {
            this.targets.push({
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: 0,
                size: 20 + (avgFreq / 255) * 20,
                speed: 1 + (avgFreq / 255) * 2,
                hue: Math.random() * 360,
                hit: false
            });
        }
        
        this.draw();
        return this.checkHits();
    }
    
    shoot() {
        this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            speed: 8
        });
    }
    
    draw() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw player
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bullets
        this.bullets.forEach((bullet, index) => {
            bullet.y -= bullet.speed;
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            if (bullet.y < 0) {
                this.bullets.splice(index, 1);
            }
        });
        
        // Draw targets
        this.targets.forEach((target, index) => {
            target.y += target.speed;
            
            if (!target.hit) {
                ctx.fillStyle = `hsl(${target.hue}, 70%, 60%)`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = `hsl(${target.hue}, 70%, 60%)`;
                
                ctx.beginPath();
                ctx.arc(target.x, target.y, target.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
            if (target.y > this.canvas.height + target.size) {
                this.targets.splice(index, 1);
            }
        });
    }
    
    checkHits() {
        let score = 0;
        
        this.bullets.forEach((bullet, bulletIndex) => {
            this.targets.forEach((target, targetIndex) => {
                if (!target.hit) {
                    const distance = Math.sqrt(
                        Math.pow(bullet.x - target.x, 2) + 
                        Math.pow(bullet.y - target.y, 2)
                    );
                    
                    if (distance < target.size) {
                        target.hit = true;
                        score += Math.floor(target.size);
                        
                        // Remove bullet and target
                        this.bullets.splice(bulletIndex, 1);
                        setTimeout(() => {
                            this.targets.splice(this.targets.indexOf(target), 1);
                        }, 100);
                    }
                }
            });
        });
        
        return score;
    }
    
    pause() {}
    stop() {
        this.bullets = [];
        this.targets = [];
    }
}

// Export for use in main app
window.MusicGamesController = MusicGamesController;
