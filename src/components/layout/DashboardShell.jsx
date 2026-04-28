export function DashboardShell({ sidebar, scene }) {
  return (
    <div className="app-shell">
      <div className="background-grid" />
      <div className="background-aurora background-aurora-left" />
      <div className="background-aurora background-aurora-right" />

      <nav className="mobile-quicknav" aria-label="Schnellnavigation">
        <a className="mobile-quicknav-link" href="#orbital-view">
          Orbit
        </a>
        <a className="mobile-quicknav-link" href="#live-data">
          Live-Daten
        </a>
        <a className="mobile-quicknav-link" href="#livestream">
          Livestream
        </a>
      </nav>

      <aside className="dashboard-sidebar">{sidebar}</aside>
      <main className="dashboard-main">{scene}</main>
    </div>
  );
}
