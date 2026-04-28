import { DataField } from "./DataField";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "medium"
});

function formatCoordinate(value, positiveLabel, negativeLabel) {
  if (!Number.isFinite(value)) {
    return "Nicht verfügbar";
  }

  const direction = value >= 0 ? positiveLabel : negativeLabel;
  return `${Math.abs(value).toFixed(2)}° ${direction}`;
}

function formatMetric(value, suffix, digits = 1) {
  if (!Number.isFinite(value)) {
    return "Nicht verfügbar";
  }

  return `${value.toFixed(digits)} ${suffix}`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "Noch keine Aktualisierung";
  }

  return DATE_TIME_FORMATTER.format(new Date(timestamp));
}

function formatHeading(heading) {
  if (!Number.isFinite(heading)) {
    return "Nicht verfügbar";
  }

  const normalized = (heading + 360) % 360;
  const sectors = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"];
  const sector = sectors[Math.round(normalized / 45) % sectors.length];
  return `${normalized.toFixed(0)}° ${sector}`;
}

function getStatusLabel(status, error) {
  if (status === "loading") {
    return "Initialisiert";
  }

  if (status === "stale") {
    return "Zwischengespeichert";
  }

  if (status === "offline") {
    return "Offline";
  }

  if (error) {
    return "Teilweise verfügbar";
  }

  return "Live";
}

export function SidebarPanel({ telemetry }) {
  const { snapshot, status, error, lastUpdated, history } = telemetry;
  const visibility =
    snapshot?.visibility === "daylight"
      ? "Im Sonnenlicht"
      : snapshot?.visibility === "eclipsed"
        ? "Im Erdschatten"
        : "Nicht verfügbar";

  const trailWindow =
    history.length > 1
      ? `${history.length} Punkte / ${(((history.length - 1) * 10) / 60).toFixed(1)} min Verlauf`
      : "Verlauf wird aufgebaut";

  return (
    <div className="sidebar-stack">
      <section className="panel hero-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">Mission Control</span>
            <h1>ISS Tracker</h1>
          </div>
          <div className={`status-pill status-${status}`}>
            <span className="status-dot" />
            {getStatusLabel(status, error)}
          </div>
        </div>
        {error ? (
          <div className="alert-card">
            <strong>Datenfeed instabil</strong>
            <p>{error}</p>
          </div>
        ) : null}
      </section>

      <section id="live-data" className="panel scroll-target">
        <div className="section-heading">
          <h2>Live-Daten</h2>
          <span>{trailWindow}</span>
        </div>

        <div className="data-grid">
          <DataField
            label="Breitengrad"
            value={formatCoordinate(snapshot?.latitude, "N", "S")}
            emphasized
          />
          <DataField
            label="Längengrad"
            value={formatCoordinate(snapshot?.longitude, "O", "W")}
            emphasized
          />
          <DataField
            label="Höhe"
            value={formatMetric(snapshot?.altitude, "km")}
          />
          <DataField
            label="Geschwindigkeit"
            value={formatMetric(snapshot?.velocity, "km/h", 0)}
          />
          <DataField label="Sichtbarkeit" value={visibility} />
          <DataField
            label="Bodenpunkt"
            value={snapshot?.groundTrack || "Nicht verfügbar"}
            hint={
              snapshot?.footprint
                ? `Footprint ${formatMetric(snapshot.footprint, "km", 0)}`
                : undefined
            }
          />
          <DataField
            label="Richtung"
            value={formatHeading(snapshot?.heading)}
            hint="Aus den letzten Live-Punkten berechnet"
          />
          <DataField
            label="Letztes Update"
            value={formatTimestamp(lastUpdated)}
          />
        </div>
      </section>

      <section id="livestream" className="panel compact-panel scroll-target">
        <div className="section-heading">
          <h2>Livestream</h2>
          <span>YouTube Embed</span>
        </div>

        <div className="stream-frame">
          <iframe
            src="https://www.youtube.com/embed/zPH5KtjJFaQ?autoplay=1&mute=1&rel=0&modestbranding=1"
            title="ISS Live Stream"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        <a
          className="stream-mobile-link"
          href="https://www.youtube.com/watch?v=zPH5KtjJFaQ"
          target="_blank"
          rel="noreferrer"
        >
          Livestream auf YouTube oeffnen
        </a>
      </section>
    </div>
  );
}
