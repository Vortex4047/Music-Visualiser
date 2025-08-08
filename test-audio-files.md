# Test Audio Files for AI Music Visualizer

This document lists the audio files that should be used to test the AI Music Visualizer application.

## Test Files by Genre

### Rock
- "Smoke on the Water" by Deep Purple (sample)
- "Back in Black" by AC/DC (sample)

### Pop
- "Bad Romance" by Lady Gaga (sample)
- "Shake It Off" by Taylor Swift (sample)

### Jazz
- "Take Five" by Dave Brubeck (sample)
- "So What" by Miles Davis (sample)

### Classical
- "Für Elise" by Beethoven (sample)
- "Nocturne in E-flat Major, Op. 9, No. 2" by Chopin (sample)

### Hip-Hop
- "Lose Yourself" by Eminem (sample)
- "Sicko Mode" by Travis Scott (sample)

### Electronic
- "Strobe" by Deadmau5 (sample)
- "Windowlicker" by Aphex Twin (sample)

## Testing Instructions

1. Test each audio file with both file upload and microphone input
2. Verify that the genre detection works correctly for each file
3. Verify that the beat detection and visualization respond appropriately to the audio
4. Verify that the UI updates correctly with genre and beat information
5. Verify that the visualization container animations match the detected genre
6. Test with different file formats (MP3, WAV, OGG)
7. Test with different file sizes and durations
8. Test with both short clips (10-30 seconds) and longer tracks (1-5 minutes)

## Expected Results

- Genre detection should be accurate for most files
- Beat detection should respond to the tempo of the music
- Visualization should be visually appealing and responsive to the audio
- UI should update in real-time with genre and beat information
- Application should handle errors gracefully (e.g., unsupported file formats)

## Notes

- Use royalty-free or sample versions of these tracks for testing
- Consider using audio files from [Freesound.org](https://freesound.org/) for testing
- Test with both high-quality and low-quality audio files
- Test with both mono and stereo audio files