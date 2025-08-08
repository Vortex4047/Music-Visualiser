
/* Enhanced AI Analyzer: tries to use ml5.js soundClassifier for genre/mood if available.
   Falls back to the existing simulated analyzer functions if ml5 isn't present. */
class EnhancedAIAnalyzer {
    constructor() {
        this.classifier = null;
        this.modelReady = false;
        // Attempt to load ml5 soundClassifier when available
        if (typeof ml5 !== 'undefined' && ml5.soundClassifier) {
            // use a generic pre-trained model if available; this is best-effort and will load in browser runtime
            try {
                const options = { probabilityThreshold: 0.1 };
                // 'https://teachablemachine.withgoogle.com/models/...' could be used for custom models
                this.classifierPromise = ml5.soundClassifier('SpeechCommands18w', options, () => {
                    this.modelReady = true;
                });
                this.classifierPromise.then(c => this.classifier = c).catch(()=>{ this.classifier = null; });
            } catch (e) {
                console.warn('ml5 classifier failed to initialize', e);
            }
        }
    }

    async classifyFromAudioElement(audioElement, callback) {
        if (this.classifier) {
            this.classifier.classify((err, results) => {
                if (err) { console.error(err); callback(null); return; }
                callback(results);
            });
        } else {
            // fallback to simulated analysis in the repo (if available)
            if (typeof AIAnalyzer !== 'undefined') {
                const analyzer = new AIAnalyzer();
                analyzer.analyzeAudio(audioElement, callback);
            } else {
                callback(null);
            }
        }
    }
}

window.EnhancedAIAnalyzer = EnhancedAIAnalyzer;

// AI Analyzer for AI Music Visualizer
// Simulates audio analysis including beat detection, frequency analysis, and genre classification

class AIAnalyzer {
    constructor() {
        // For genre classification, we'll use a simplified approach
        // In a real implementation, you would use a trained model
        this.isInitialized = true;
    }

    // Initialize the analyzer (no async loading needed)
    async init() {
        // No initialization needed for simulated analysis
        return Promise.resolve();
    }

    // Analyze audio buffer for beats, frequency, and genre
    async analyzeAudio(audioBuffer) {
        // For file-based analysis, we'll use simulated analysis
        return {
            beat: this.detectBeat(audioBuffer),
            frequency: this.analyzeFrequency(audioBuffer),
            genre: this.classifyGenre(audioBuffer),
            timestamp: Date.now()
        };
    }

    // Analyze raw audio data from microphone
    async analyzeAudioData(audioData) {
        // For microphone-based analysis, we'll use simulated analysis
        return {
            beat: this.detectBeatFromData(audioData),
            frequency: this.analyzeFrequencyFromData(audioData),
            genre: this.classifyGenreFromData(audioData),
            timestamp: audioData.timestamp
        };
    }

    // Detect beats in audio using audio data
    detectBeatFromData(audioData) {
        // Calculate beat strength from frequency data
        const avgFrequency = audioData.frequencyData.reduce((sum, val) => sum + val, 0) / audioData.frequencyData.length;
        const strength = Math.min(1, avgFrequency / 128);
        
        // Generate a simple beat pattern
        const pattern = this.generateLiveBeatPattern();
        
        return {
            tempo: 100 + Math.floor(Math.random() * 80), // 100-180 BPM
            strength: strength,
            pattern: pattern
        };
    }

    // Analyze frequency distribution from audio data
    analyzeFrequencyFromData(audioData) {
        // Calculate frequency distribution from data
        const lowFreq = audioData.frequencyData.slice(0, 100).reduce((sum, val) => sum + val, 0) / 100;
        const midFreq = audioData.frequencyData.slice(100, 300).reduce((sum, val) => sum + val, 0) / 200;
        const highFreq = audioData.frequencyData.slice(300).reduce((sum, val) => sum + val, 0) / (audioData.frequencyData.length - 300);
        
        const distribution = {
            low: lowFreq / 255,
            mid: midFreq / 255,
            high: highFreq / 255
        };
        
        return {
            distribution: distribution,
            dominantRange: this.getDominantFrequencyRange(distribution),
            spectralCentroid: Math.random() * 10000
        };
    }

    // Classify genre from audio data
    classifyGenreFromData(audioData) {
        // Simple genre classification based on frequency distribution
        const lowFreq = audioData.frequencyData.slice(0, 100).reduce((sum, val) => sum + val, 0) / 100;
        const midFreq = audioData.frequencyData.slice(100, 300).reduce((sum, val) => sum + val, 0) / 200;
        const highFreq = audioData.frequencyData.slice(300).reduce((sum, val) => sum + val, 0) / (audioData.frequencyData.length - 300);
        
        // Simple genre classification based on frequency distribution
        if (highFreq > lowFreq && highFreq > midFreq) {
            return 'electronic';
        } else if (lowFreq > midFreq) {
            return 'rock';
        } else if (midFreq > lowFreq && midFreq > highFreq * 1.5) {
            return 'jazz';
        } else {
            // Randomly choose between pop and hiphop
            return Math.random() > 0.5 ? 'pop' : 'hiphop';
        }
    }

    // Extract features from audio buffer (for file-based analysis)
    extractFeatures(audioBuffer) {
        // Get audio duration
        const duration = audioBuffer.duration;
        
        // Get sample rate
        const sampleRate = audioBuffer.sampleRate;
        
        // Calculate approximate number of beats (simulated)
        const estimatedBeats = Math.floor(duration * 1.5); // 1.5 beats per second average
        
        // Calculate frequency distribution (simulated)
        const frequencyDistribution = {
            low: Math.random(),
            mid: Math.random(),
            high: Math.random()
        };
        
        return {
            duration,
            sampleRate,
            estimatedBeats,
            frequencyDistribution
        };
    }

    // Detect beats in audio (for file-based analysis)
    detectBeat(audioBuffer) {
        // For file-based analysis, we'll use a simplified approach
        // In a real implementation, you would process the audio through the analyser
        
        // Return a simulated beat pattern
        const features = this.extractFeatures(audioBuffer);
        return {
            tempo: 120 + Math.floor(Math.random() * 60), // 120-180 BPM
            strength: Math.random(),
            pattern: this.generateBeatPattern(features.estimatedBeats)
        };
    }

    // Analyze frequency distribution (for file-based analysis)
    analyzeFrequency(audioBuffer) {
        // For file-based analysis, we'll use a simplified approach
        const features = this.extractFeatures(audioBuffer);
        
        return {
            distribution: features.frequencyDistribution,
            dominantRange: this.getDominantFrequencyRange(features.frequencyDistribution),
            spectralCentroid: Math.random() * 10000
        };
    }

    // Classify music genre (for file-based analysis)
    classifyGenre(audioBuffer) {
        // For file-based analysis, we'll use a more sophisticated approach
        // In a real implementation, you would use a trained model
        
        // Extract features from the audio buffer
        const features = this.extractFeatures(audioBuffer);
        
        // Analyze energy distribution
        const lowRatio = features.frequencyDistribution.low;
        const midRatio = features.frequencyDistribution.mid;
        const highRatio = features.frequencyDistribution.high;
        
        // Calculate total energy distribution
        const totalEnergy = lowRatio + midRatio + highRatio;
        const normalizedLow = lowRatio / totalEnergy;
        const normalizedMid = midRatio / totalEnergy;
        const normalizedHigh = highRatio / totalEnergy;
        
        // Estimate tempo from duration and estimated beats
        const tempo = Math.round((features.estimatedBeats / features.duration) * 60);
        
        // Genre classification with weighted scoring
        const scores = {
            rock: 0,
            pop: 0,
            jazz: 0,
            classical: 0,
            hiphop: 0,
            electronic: 0
        };
        
        // Rock characteristics: strong low frequencies
        scores.rock += normalizedLow * 0.7;
        scores.rock += (1 - Math.abs(tempo - 120) / 120) * 0.3; // Rock often around 120 BPM
        
        // Pop characteristics: balanced frequencies, moderate tempo
        scores.pop += (1 - Math.abs(normalizedMid - 0.5)) * 0.6;
        scores.pop += (1 - Math.abs(tempo - 100) / 100) * 0.4; // Pop often around 100 BPM
        
        // Jazz characteristics: balanced frequencies, complex rhythms
        scores.jazz += (1 - Math.abs(normalizedMid - 0.4)) * 0.5;
        scores.jazz += (tempo > 100 && tempo < 200 ? 0.5 : 0); // Jazz often has moderate to fast tempo
        
        // Classical characteristics: balanced frequencies, slower tempo
        scores.classical += (1 - Math.abs(normalizedMid - 0.45)) * 0.6;
        scores.classical += (tempo < 100 ? 0.4 : 0); // Classical often has slower tempo
        
        // Hiphop characteristics: strong low frequencies, moderate tempo
        scores.hiphop += normalizedLow * 0.6;
        scores.hiphop += (1 - Math.abs(tempo - 90) / 90) * 0.4; // Hiphop often around 90 BPM
        
        // Electronic characteristics: strong high frequencies, fast tempo
        scores.electronic += normalizedHigh * 0.6;
        scores.electronic += (tempo > 120 ? 0.4 : 0); // Electronic often has fast tempo
        
        // Find the genre with the highest score
        let bestGenre = 'pop'; // Default
        let bestScore = 0;
        
        for (const genre in scores) {
            if (scores[genre] > bestScore) {
                bestScore = scores[genre];
                bestGenre = genre;
            }
        }
        
        return bestGenre;
    }

    // Generate a beat pattern
    generateBeatPattern(beatCount) {
        // Create a simple beat pattern
        const pattern = [];
        for (let i = 0; i < Math.min(beatCount, 32); i++) {
            pattern.push(Math.random() > 0.3 ? 1 : 0); // 70% chance of beat
        }
        return pattern;
    }

    // Generate a live beat pattern
    generateLiveBeatPattern() {
        // Create a simple live beat pattern
        const pattern = [];
        for (let i = 0; i < 16; i++) {
            pattern.push(Math.random() > 0.7 ? 1 : 0); // 30% chance of beat
        }
        return pattern;
    }

    // Determine dominant frequency range
    getDominantFrequencyRange(distribution) {
        if (distribution.low > distribution.mid && distribution.low > distribution.high) {
            return 'low';
        } else if (distribution.mid > distribution.low && distribution.mid > distribution.high) {
            return 'mid';
        } else {
            return 'high';
        }
    }
}