# AI Music Visualizer User Guide

Welcome to the AI Music Visualizer! This guide will help you get the most out of this innovative web application that combines artificial intelligence with music visualization.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Using the Visualizer](#using-the-visualizer)
4. [Understanding the Visualizations](#understanding-the-visualizations)
5. [Genre Detection](#genre-detection)
6. [Performance Settings](#performance-settings)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

## Introduction

The AI Music Visualizer is a web-based application that creates dynamic, real-time visualizations of music. It uses artificial intelligence to analyze audio and generate visual patterns that respond to the rhythm, frequency spectrum, and genre of the music.

## Getting Started

### System Requirements

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- For microphone input: A device with a microphone
- Internet connection (for initial loading of libraries)

### Opening the Application

1. Download or clone the AI Music Visualizer repository
2. Open the `index.html` file in your web browser
3. The application will load automatically

### First Time Use

When you first open the application, you'll see:
- A title and description
- Two buttons: "Upload Music" and "Use Microphone"
- A visualization area (initially empty)
- Genre and beat information displays

## Using the Visualizer

### File Upload

1. Click the "Upload Music" button
2. Select an audio file from your device
   - Supported formats: MP3, WAV, OGG
   - File size limit: Depends on your browser (typically 2GB or less)
3. The audio will begin playing automatically
4. Visualizations will appear in the visualization area
5. Genre and beat information will be displayed

### Microphone Input

1. Click the "Use Microphone" button
2. Your browser will ask for permission to access your microphone
3. Click "Allow" or "Yes" to grant permission
4. Play music or speak into your microphone
5. Visualizations will appear in real-time
6. To stop microphone input, click the "Stop Microphone" button

### Controls

- **Upload Music**: Opens a file dialog to select an audio file
- **Use Microphone**: Starts microphone input
- **Stop Microphone**: Stops microphone input (only visible when microphone is active)

## Understanding the Visualizations

The AI Music Visualizer creates three types of visualizations:

### Particle System

- Thousands of colored particles that move in response to the music
- Movement intensity corresponds to beat strength
- Colors change based on the detected music genre

### Bar Graph

- Circular arrangement of bars that represent frequency bands
- Bar height corresponds to frequency intensity
- Bars pulse with the music's rhythm

### Waveform

- A line that represents the audio waveform
- Shape changes in real-time with the audio input
- Position corresponds to the time domain data

## Genre Detection

The AI analyzer attempts to classify music into one of six genres:

1. **Rock**: Red and orange color scheme with pulsing animations
2. **Pop**: Purple and blue color scheme with bouncing animations
3. **Jazz**: Yellow and orange color scheme with swinging animations
4. **Classical**: Purple and blue color scheme with floating animations
5. **Hip-Hop**: Cyan and green color scheme with bouncing animations
6. **Electronic**: Pink and dark purple color scheme with rapid pulsing animations

The genre is displayed in the top right corner of the controls area. The visualization colors and animations will change when the genre changes.

## Performance Settings

The visualizer automatically adjusts its quality based on your device's capabilities:

### Auto-Detection

When the application starts, it automatically detects your device's capabilities and sets the appropriate quality level:

- **Low Quality**: For mobile devices or low-end hardware
- **Medium Quality**: For most desktop devices
- **High Quality**: For high-end desktop devices

### Manual Adjustment

You can manually adjust the quality by modifying the code in `js/visualizer.js`:

```javascript
// In the Visualizer constructor
this.quality = 'medium'; // Change to 'low', 'medium', or 'high'
```

## Troubleshooting

### Audio Not Playing

1. Check that your device's volume is turned up
2. Ensure no other applications are using the audio output
3. Try refreshing the page
4. Check that your browser supports the audio format

### Microphone Not Working

1. Ensure your device has a working microphone
2. Check that you granted permission to access the microphone
3. Verify that no other applications are using the microphone
4. Try refreshing the page and granting permission again

### Visualizations Not Appearing

1. Check that JavaScript is enabled in your browser
2. Ensure your browser supports WebGL
3. Try refreshing the page
4. Check the browser console for error messages (Ctrl+Shift+J in Chrome)

### Poor Performance

1. The application automatically adjusts quality based on your device
2. If performance is still poor, try manually setting the quality to 'low'
3. Close other applications to free up system resources
4. Try using a different browser

## FAQ

### Is my audio data sent to any servers?

No, all processing happens locally in your browser. Your audio files never leave your device.

### Can I use this application offline?

Yes, once the initial libraries are loaded, you can use the application offline.

### Why does the genre detection sometimes seem incorrect?

The genre detection is simulated in this prototype. In a full implementation, it would use machine learning models trained on music features.

### Can I save the visualizations?

The application doesn't currently support saving visualizations, but you can take screenshots using your operating system's screenshot tool.

### How can I customize the visualizations?

You can modify the CSS files to change colors and animations, or modify the JavaScript files to change the visualization behavior.

### What browsers are supported?

The application works in all modern browsers that support Web Audio API and WebGL, including:
- Chrome 10+
- Firefox 25+
- Safari 6+
- Edge 12+

### Can I use this on mobile devices?

Yes, the application works on mobile devices, though performance may vary depending on the device's capabilities.

## Technical Information

### Libraries Used

- **Three.js**: For WebGL rendering
- **Web Audio API**: For audio processing
- **TensorFlow.js**: For machine learning (simulated in this prototype)

### File Structure

```
ai-music-visualizer/
├── index.html
├── css/
│   ├── styles.css
│   └── responsive.css
├── js/
│   ├── main.js
│   ├── audio-handler.js
│   ├── ai-analyzer.js
│   ├── visualizer.js
│   └── ui-manager.js
├── README.md
├── USER-GUIDE.md
├── LICENSE
├── test-audio-files.md
└── test-runner.js
```

### Customization

You can customize the visualizer by modifying:
- Color schemes in `css/styles.css`
- Animation styles in `css/styles.css`
- Visualization parameters in `js/visualizer.js`
- AI analysis parameters in `js/ai-analyzer.js`

## Support

For support, please open an issue on the project's GitHub repository or contact the development team.

## Changelog

### v1.0.0
- Initial release
- File upload and microphone input support
- AI-powered beat detection and genre classification
- Dynamic WebGL visualizations
- Responsive design
- Performance optimization

## Roadmap

### Future Features

- Save visualizations as images or videos
- Custom visualization presets
- More advanced AI analysis
- Social sharing features
- Mobile app version

## Contributing

Contributions are welcome! Please read the CONTRIBUTING.md file for details on how to contribute to this project.

## License

This project is licensed under the MIT License. See the LICENSE file for details.