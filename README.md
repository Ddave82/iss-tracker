# 🛰️ ISS Tracker

> Eine moderne, lokal startbare 3D-Web-App, die die aktuelle Position der International Space Station live visualisiert.

ISS Tracker kombiniert Live-Telemetrie, eine interaktive 3D-Erde, Ground-Track-Erkennung und einen eingebetteten ISS-Livestream zu einem kompakten Mission-Control-Dashboard.

![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=06111f)
![Vite](https://img.shields.io/badge/Vite-7-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.176-111111?style=for-the-badge&logo=three.js&logoColor=white)
![Status](https://img.shields.io/badge/Status-live_ready-75ffc7?style=for-the-badge)

## 🚀 Live Demo

Die App ist live auf Vercel erreichbar:

👉 **[iss-tracker-gilt.vercel.app](https://iss-tracker-gilt.vercel.app)**

## ✨ Highlights

- 🌍 **Interaktive 3D-Erde** mit Sternenfeld, Atmosphärenglanz, Wolkenlayer und ISS-Marker
- 📡 **Live-Telemetrie** für Koordinaten, Höhe, Geschwindigkeit, Sichtbarkeit, Richtung und Update-Zeitpunkt
- 🗺️ **Ground Track** erkennt, welches Land oder welcher Ozean aktuell unter der ISS liegt
- 🔴 **Orbit-Trail** zeigt die zuletzt empfangenen Positionspunkte
- 🧭 **Orbit-Prognose** visualisiert die aktuelle Flugbahn als gestrichelte Linie
- 📺 **ISS-Livestream** direkt im Dashboard eingebettet
- ⚡ **Optimierter Startpfad** mit lazy geladener 3D-Szene und ausgelagerten Geo-Daten
- 📱 **Responsive Layout** für Desktop, Tablet und Mobile

## 🧪 Demo lokal starten

```bash
npm install
npm run dev
```

Danach im Browser öffnen:

```text
http://localhost:5173/
```

> Wichtig: Die App bitte über den Vite-Dev-Server starten. Ein Doppelklick auf `index.html` reicht nicht, weil ES-Module und der lokale API-Proxy benötigt werden.

## 🏗️ Produktions-Build

```bash
npm run build
```

Build lokal testen:

```bash
npm run preview
```

## 🧰 Tech Stack

| Bereich | Technologie |
| --- | --- |
| UI | React 19 |
| Build Tooling | Vite |
| 3D Rendering | Three.js, React Three Fiber |
| 3D Helpers | `@react-three/drei` |
| Geo-Berechnung | `d3-geo`, `topojson-client` |
| Kartenbasis | `world-atlas` |
| Styling | CSS mit responsivem Glas-/Space-UI |

## 📁 Projektstruktur

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

## 🔌 Datenquellen

| Zweck | Quelle |
| --- | --- |
| Primäre ISS-Telemetrie | `https://api.wheretheiss.at/v1/satellites/25544` |
| Lokaler Dev-Proxy | `/api/iss/current` |
| Sekundärer Fallback | `http://api.open-notify.org/iss-now.json` |
| Livestream | `https://www.youtube.com/watch?v=zPH5KtjJFaQ` |
| Länder- und Küstengeometrie | `world-atlas/countries-110m.json` |

## 🛡️ Robustheit

- Primär-API, direkter Abruf und Fallback-API werden automatisch kombiniert.
- Bei temporären Fehlern bleibt die letzte bekannte Position sichtbar.
- Stale-/Offline-Status wird im UI transparent angezeigt.
- Polling läuft sequenziell, damit bei langsamen API-Antworten keine Request-Staus entstehen.
- Fehlende Fallback-Werte werden im Interface als `Nicht verfügbar` angezeigt.

## ⚡ Performance-Notizen

- Die 3D-Szene wird lazy geladen, damit die App schneller interaktiv wird.
- Geo-Daten für den Ground Track werden dynamisch nachgeladen.
- Three.js-Texturen und berechnete Orbit-/Markerpunkte werden memoisiert.
- Auf Mobile wird eine kleinere Texturauflösung genutzt.
- Der YouTube-Embed lädt lazy und blockiert nicht den Start.

## 🎮 Bedienung

| Gerät | Interaktion |
| --- | --- |
| Desktop | Ziehen zum Rotieren, Mausrad zum Zoomen |
| Mobile | Ziehen zum Rotieren, Spreizen zum Zoomen |
| Große Screens | Sidebar scrollt unabhängig, 3D-Ansicht bleibt sichtbar |
| Kleine Screens | Layout wechselt in eine vertikale, touchfreundliche Ansicht |

## 🚀 Deployment-Hinweis

Für statisches Hosting funktioniert der Build grundsätzlich über `npm run build`. Da die App in der lokalen Entwicklung einen Vite-Proxy für ISS-APIs nutzt, sollte für produktives Hosting ein eigener Proxy, eine Serverless Function oder ein kleines Backend für die API-Aufrufe eingeplant werden.

## 📜 Scripts

```bash
npm run dev      # Entwicklungsserver starten
npm run build    # Produktionsbuild erstellen
npm run preview  # Produktionsbuild lokal ansehen
```

---

Made for space nerds, curious builders and everyone who gerne mal wissen will, wo die ISS gerade über uns vorbeizieht. 🌌
