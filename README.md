# Gyro Cube Flick Lab

A polished static web prototype for testing **phone flick gestures** that snap a 3D cube/object by 90 degrees.

It is designed for the exact early-stage UX question: can a mobile user hold the phone in landscape, make a quick motion gesture, and get a predictable object orientation snap without accidental double-rotations?

## Features

- 3D CSS cube with smooth 90° snap rotations
- iPhone/Android motion permission flow
- Live mapped rotation-rate telemetry for cube X/Y/Z
- Live raw sensor telemetry for `alpha`, `beta`, and `gamma`
- Adjustable flick threshold
- Adjustable dominance ratio
- Adjustable cooldown
- Adjustable return-to-neutral behavior
- Axis source mapping and per-axis inversion
- Haptic vibration when a real flick is detected
- Manual X/Y/Z buttons for desktop testing
- LocalStorage persistence for settings
- No build step, no dependencies, GitHub Pages ready

### New Version

- Fullscreen landscape cube scene.
- Portrait mode is blocked with a rotate-your-phone overlay.
- Floating controls only:
  - Settings in the top-left corner.
  - Motion permission in the top center.
  - Logs in the top-right corner.
  - Manual projected flick buttons at the bottom.
- A CSS 3D cube rendered without applying `filter: drop-shadow()` to the cube itself, preserving depth.
- Fixed isometric camera angle so the cube always shows three faces equally.
- Orientation-relative snaps:
  - A flick is treated as a 2D vector across the landscape screen.
  - The app projects the cube's current local X/Y/Z axes into screen space.
  - The nearest projected axis receives the snap.
  - The snap is applied around the cube's current local axis, not the original world axis.

## iPhone testing notes

On iOS Safari, the app must ask for motion permission from a user gesture. Press **Enable motion** after opening the page.

For best testing:

- Hold the phone in landscape.
- Keep fingers off the cube area when flicking.
- Use a short, confident rotational flick.
- Return the phone to neutral after each flick.
- If an axis feels inverted or wrong, open **Settings** and adjust only that axis first.

## Tuning guide

Start with the defaults, then tune on a real iPhone:

- **Planar flick threshold**: how fast the landscape-screen flick vector must be.
- **Projection confidence**: how closely the flick must match one of the cube's projected axes.
- **Cooldown**: prevents accidental double-snaps.
- **Neutral threshold**: how still the phone must be before re-arming.
- **Neutral duration**: how long it must remain still before re-arming.
- **Smoothing**: reduces noisy sensor spikes but adds latency.

If the motion feels rotated or inverted, use the **Landscape sensor mapping** section in Settings.

## Architecture

```text
index.html
styles/main.css
src/
  app.js
  config.js
  core/
    cube-orientation.js   # cube-local orientation matrix and CSS matrix output
    flick-detector.js     # screen-vector to current projected cube-axis selection
    matrix3.js            # small 3D matrix helper, no dependency
    motion-controller.js  # DeviceMotion permission, smoothing, cooldown, neutral logic
    storage.js            # LocalStorage settings persistence
    vector.js             # small 2D vector helpers
    format.js             # formatting and escaping helpers
  ui/
    axis-guide.js         # visual projected-axis guide lines
    log-panel.js          # telemetry and gesture log dialog
    settings-panel.js     # settings dialog and persistence
```
