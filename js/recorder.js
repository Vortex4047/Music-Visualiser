
// Recorder wrapper using CCapture.js
class VisualRecorder {
    constructor(canvas) {
        this.canvas = canvas;
        this.capturer = null;
        this.isRecording = false;
    }

    start() {
        if (!this.canvas) { console.warn('No canvas to record'); return; }
        this.capturer = new CCapture({ format: 'webm', framerate: 30, verbose: false });
        this.capturer.start();
        this.isRecording = true;
        this._tick();
    }

    _tick() {
        if (!this.isRecording) return;
        try {
            this.capturer.capture(this.canvas);
        } catch (e) {
            // some canvases can't be captured; ignore errors
        }
        requestAnimationFrame(() => this._tick());
    }

    stop() {
        if (!this.capturer) return;
        this.isRecording = false;
        this.capturer.stop();
        this.capturer.save();
        this.capturer = null;
    }
}

window.VisualRecorder = VisualRecorder;
