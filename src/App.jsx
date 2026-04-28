import { lazy, Suspense } from "react";
import { DashboardShell } from "./components/layout/DashboardShell";
import { SidebarPanel } from "./components/panels/SidebarPanel";
import { useIssTelemetry } from "./hooks/useIssTelemetry";

const EarthScene = lazy(() =>
  import("./components/scene/EarthScene").then((module) => ({
    default: module.EarthScene
  }))
);

function SceneLoadingState() {
  return (
    <section className="scene-panel scene-loading">
      <div className="scene-copy">
        <div>
          <span className="panel-eyebrow">Orbital View</span>
          <h2>Earth / ISS</h2>
        </div>
      </div>
      <div className="scene-stage scene-stage-loading">
        <div className="scene-fallback">
          <span>3D-Szene wird geladen ...</span>
        </div>
      </div>
    </section>
  );
}

function App() {
  const telemetry = useIssTelemetry();

  return (
    <DashboardShell
      sidebar={<SidebarPanel telemetry={telemetry} />}
      scene={
        <Suspense fallback={<SceneLoadingState />}>
          <EarthScene telemetry={telemetry} />
        </Suspense>
      }
    />
  );
}

export default App;
