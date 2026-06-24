# Gyro Cube Flick Lab

A polished static web prototype for testing **container-axis phone flick gestures** that snap a 3D cube/object by 90 degrees.

The core UX question is: can a mobile user hold the phone in landscape as if the phone itself is a physical container holding the cube, rotate that container around one of the cube's currently visible axes, and get a predictable 90° snap without accidental double-rotations?

## Features

- Fullscreen landscape-first 3D CSS cube scene
- Portrait mode blocked with a rotate-your-phone overlay
- iPhone/Android motion permission flow
- Cube always rendered from an equal three-face/isometric angle
- 90° snaps around the cube's **current local axes**
- Full 3D gyroscope-vector matching, not 2D screen-vector matching
- Live raw sensor telemetry for `alpha`, `beta`, and `gamma`
- Adjustable flick threshold, confidence, cooldown, neutral timing, and smoothing
- Haptic vibration when a real flick is detected
- Manual buttons for desktop testing
- LocalStorage persistence for settings
- No build step, no dependencies, GitHub Pages ready

## Gesture model

This version treats the phone as a **physical box containing the cube**.

A flick is not interpreted as “yaw, pitch, or roll the phone UI.” Instead:

1. The app reads the phone's full 3D angular velocity vector.
2. It computes the cube's current local X/Y/Z axes after the cube's current orientation and the fixed isometric view are applied.
3. It compares the phone's 3D spin vector against those current cube axes.
4. The best-matching cube axis snaps by 90°.
5. The snap is post-multiplied onto the cube orientation, so the next flick is based on the new cube orientation, not the original front/right/top.

Example intuition: if you see three faces and rotate the phone around the diagonal axis that visually passes through one of those cube faces, the cube should snap around that matching cube axis.

## iPhone testing notes

On iOS Safari, the app must ask for motion permission from a user gesture. Press **Enable motion** after opening the page.

For best testing:

- Hold the phone in landscape with two hands.
- Keep fingers off the cube area when flicking.
- Rotate the phone as if the cube's visible axes pass through the phone.
- Use a short, confident rotational flick.
- Return the phone to neutral after each flick.

## Architecture

```text
index.html
styles/main.css
src/
  app.js
  config.js
  core/
    cube-orientation.js   # cube-local orientation matrix and CSS matrix output
    flick-detector.js     # 3D container angular velocity to current cube-axis selection
    matrix3.js            # small 3D matrix helper, no dependency
    motion-controller.js  # DeviceMotion permission, smoothing, cooldown, neutral logic
    storage.js            # LocalStorage settings persistence
    vector.js             # small 2D/3D vector helpers
    format.js             # formatting and escaping helpers
  ui/
    axis-guide.js
    log-panel.js
    settings-panel.js
```
