# Gyro Cube Flick Lab

A polished static web prototype for testing **container-axis phone flick gestures** that snap a 3D cube/object by 90 degrees.

The core UX question is: can a mobile user hold the phone in landscape as if the phone itself is a physical container holding the cube, rotate that container around one of the cube's currently visible axes, and get a predictable 90° snap without accidental double-rotations?

## Features

- Fullscreen landscape-first 3D CSS cube scene
- Portrait mode blocked with a rotate-your-phone overlay
- iPhone/Android motion permission flow
- Cube rendered from an equal three-face/isometric angle
- 90° snaps around the cube's **current local axes**
- Full 3D gyroscope-vector matching, not 2D screen-vector matching
- Live raw sensor telemetry for `alpha`, `beta`, and `gamma`
- Live derived telemetry for `Container X`, `Container Y`, `Container Z`, and 3D spin speed
- Adjustable spin threshold, axis confidence, cooldown, neutral timing, and smoothing
- Manual X/Y/Z snap buttons for desktop testing
- LocalStorage persistence for settings
- No build step, no dependencies, GitHub Pages ready

## Gesture model

This version treats the phone as a **physical box containing the cube**.

A flick is not interpreted as “yaw, pitch, or roll the phone UI.” Instead:

1. The app reads the phone's full 3D angular velocity vector.
2. It maps raw `alpha`, `beta`, and `gamma` motion into a container-space vector.
3. It computes the cube's current local X/Y/Z axes after the cube's current orientation and the fixed isometric view are applied.
4. It compares the phone's 3D spin vector against those current cube axes.
5. The best-matching cube axis snaps by 90°.
6. The snap is applied to the cube's current orientation, so the next flick is based on the new cube orientation, not the original front/right/top.

Example intuition: if you see three faces and rotate the phone around the diagonal axis that visually passes through one of those cube faces, the cube should snap around that matching cube axis.

## iPhone testing notes

On iOS Safari, the app must ask for motion permission from a user gesture. Press **Enable motion** after opening the page.

For best testing:

- Hold the phone in landscape with two hands.
- Keep fingers off the cube area when flicking.
- Rotate the phone as if the cube's visible axes pass through the phone.
- Use a short, confident rotational flick.
- Return the phone to neutral after each flick.

## Calibration order

When testing on a real phone, tune in this order:

1. Test the default mapping first.
2. If the correct axis triggers but the snap direction is reversed, invert that container axis.
3. If the wrong axis triggers, swap the source for `Container X`, `Container Y`, or `Container Z`.
4. If double-snaps happen, increase cooldown or neutral duration.
5. If flicks do not trigger, lower 3D spin threshold or axis confidence.

## GitHub Pages publishing

This project is pure static HTML/CSS/JS.

1. Push the repository to GitHub.
2. Open repository **Settings**.
3. Go to **Pages**.
4. Choose the `main` branch and root folder.
5. Save and open the generated Pages URL on your phone.

Motion permissions require HTTPS, so the GitHub Pages URL is the right way to test the sensor flow on iPhone Safari.

## Architecture

```text
index.html                  # static markup; no runtime HTML rewrite workaround
styles/main.css             # responsive landscape-first UI and 3D cube styling
src/
  app.js                    # app bootstrap and event binding
  config.js                 # defaults and settings metadata
  core/
    cube-orientation.js     # cube-local orientation matrix and CSS matrix output
    flick-detector.js       # 3D container angular velocity to current cube-axis selection
    matrix3.js              # small 3D matrix helper, no dependency
    motion-controller.js    # DeviceMotion permission, smoothing, cooldown, neutral logic
    storage.js              # LocalStorage settings persistence
    vector.js               # small 2D/3D vector helpers
    format.js               # formatting and escaping helpers
  ui/
    axis-guide.js
    log-panel.js
    settings-panel.js
```

## Development

There is no build step. Edit files directly and serve the folder with any static server.

For a quick local test:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` on desktop for manual-button testing. For real phone motion testing, publish through HTTPS such as GitHub Pages.
