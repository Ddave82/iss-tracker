# 🛰️ ISS Tracker

> A modern 3D web app that visualizes the current position of the International Space Station in real time.

ISS Tracker combines live telemetry, an interactive 3D Earth, ground-track detection, and an embedded ISS livestream into a compact mission-control dashboard.

![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=06111f)
![Vite](https://img.shields.io/badge/Vite-7-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.176-111111?style=for-the-badge&logo=three.js&logoColor=white)
![Status](https://img.shields.io/badge/Status-live_ready-75ffc7?style=for-the-badge)



## ✨ Highlights

- 🌍 **Interactive 3D Earth** with starfield, atmospheric glow, cloud layer, and ISS marker
- 📡 **Live telemetry** for latitude, longitude, altitude, velocity, visibility, heading, and last update
- 🗺️ **Ground-track detection** showing the country or ocean currently below the ISS
- 🔴 **Orbit trail** with recently received ISS positions
- 🧭 **Orbit preview** visualizing the current flight path as a dashed line
- 📺 **Embedded ISS livestream** directly inside the dashboard
- ⚡ **Optimized loading path** with a lazy-loaded 3D scene and split geo data
- 📱 **Responsive layout** for desktop, tablet, and mobile screens

## 🧪 Run Locally

```bash
npm install
npm run dev
```

Then open the local Vite URL in your browser:

```text
http://localhost:5173/
```

> Important: Start the app through the Vite dev server. Opening `index.html` directly is not enough because the app uses ES modules and the local API proxy.

## 🏗️ Production Build

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🧰 Tech Stack

| Area | Technology |
| --- | --- |
| UI | React 19 |
| Build tooling | Vite |
| 3D rendering | Three.js, React Three Fiber |
| 3D helpers | `@react-three/drei` |
| Geo calculations | `d3-geo`, `topojson-client` |
| Map data | `world-atlas` |
| Styling | Responsive custom CSS with a space-themed glass UI |

## 📁 Project Structure

```text
.
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── src
    ├── App.jsx
    ├── main.jsx
    ├── styles
    │   └── index.css
    ├── hooks
    │   └── useIssTelemetry.js
    ├── lib
    │   ├── earthMath.js
    │   ├── groundTrack.js
    │   ├── issApi.js
    │   └── telemetryMath.js
    └── components
        ├── layout
        │   └── DashboardShell.jsx
        ├── panels
        │   ├── DataField.jsx
        │   └── SidebarPanel.jsx
        └── scene
            └── EarthScene.jsx
```

## 🔌 Data Sources

| Purpose | Source |
| --- | --- |
| Primary ISS telemetry | `https://api.wheretheiss.at/v1/satellites/25544` |
| Local dev proxy | `/api/iss/current` |
| Secondary fallback | `http://api.open-notify.org/iss-now.json` |
| Livestream | `https://www.youtube.com/watch?v=zPH5KtjJFaQ` |
| Country and coastline geometry | `world-atlas/countries-110m.json` |

## 🛡️ Resilience

- Primary API, direct fetch, and fallback API are combined automatically.
- The last known position remains visible during temporary API issues.
- Stale and offline states are clearly shown in the UI.
- Polling runs sequentially to avoid request pileups during slow API responses.
- Missing fallback values are shown as `Not available` in the interface.

## ⚡ Performance Notes

- The 3D scene is lazy-loaded to make the app interactive faster.
- Ground-track geo data is dynamically imported.
- Three.js textures and computed orbit/marker points are memoized.
- Mobile devices use a smaller texture resolution.
- The YouTube embed loads lazily and does not block the initial render.

## 🎮 Controls

| Device | Interaction |
| --- | --- |
| Desktop | Drag to rotate, mouse wheel to zoom |
| Mobile | Drag to rotate, pinch to zoom |
| Large screens | Sidebar scrolls independently while the 3D view stays visible |
| Small screens | Layout switches to a vertical, touch-friendly view |

## 🚀 Deployment Notes

The production build works for static hosting via `npm run build`. For production deployments, plan for a small API proxy, serverless function, or backend endpoint for ISS telemetry requests, because the local Vite proxy is only available during development.

## 📜 Scripts

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run preview  # Preview the production build locally
```

---

Made for space nerds, curious builders, and everyone who wants to know where the ISS is right now. 🌌
