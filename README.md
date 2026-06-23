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

## iPhone testing notes

On iOS Safari, the app must ask for motion permission from a user gesture. Press **Enable motion** after opening the page.

For best testing:

- Hold the phone in landscape.
- Keep fingers off the cube area when flicking.
- Use a short, confident rotational flick.
- Return the phone to neutral after each flick.
- If an axis feels inverted or wrong, open **Settings** and adjust only that axis first.

## Default mapping

| Cube axis | Sensor source | Default meaning |
| --- | --- | --- |
| X | `beta` | pitch-style motion |
| Y | `gamma` | side/twist-style motion |
| Z | `alpha` | roll/spin-style motion |

Different browsers and device orientations may feel slightly different. The app includes axis remapping so you can tune the feel on the real phone.

## Suggested first experiment

Start with the default settings and test these questions:

1. Can you trigger X, Y, and Z intentionally?
2. Does the cube snap exactly once per flick?
3. Does returning to neutral accidentally trigger the opposite direction?
4. Does increasing the dominance ratio reduce wrong-axis snaps?
5. Does increasing cooldown reduce double-rotations?

## Architecture

```text
.
├── index.html
├── styles/
│   └── main.css
└── src/
    ├── app.js               # App wiring and UI rendering
    ├── config.js            # Defaults and constants
    ├── cube-view.js         # 3D cube state and snap rendering
    ├── motion-controller.js # DeviceMotion permission + flick detection
    ├── settings-panel.js    # Settings dialog and persistence integration
    ├── storage.js           # Settings validation and LocalStorage
    └── utils.js             # Small formatting/math helpers
```
