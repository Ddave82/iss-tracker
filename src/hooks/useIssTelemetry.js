import { useEffect, useRef, useState } from "react";
import { fetchIssSnapshot } from "../lib/issApi";
import { calculateHeading } from "../lib/telemetryMath";

const POLL_INTERVAL_MS = 10000;
const MAX_HISTORY_POINTS = 72;
let groundTrackModulePromise = null;

function resolveNumericTelemetry(nextValue, fallbackValue) {
  if (Number.isFinite(nextValue)) {
    return nextValue;
  }

  if (Number.isFinite(fallbackValue)) {
    return fallbackValue;
  }

  return null;
}

async function resolveGroundTrack(latitude, longitude) {
  try {
    groundTrackModulePromise ??= import("../lib/groundTrack");
    const { lookupGroundTrack } = await groundTrackModulePromise;
    return lookupGroundTrack(latitude, longitude);
  } catch {
    return "Nicht verfügbar";
  }
}

export function useIssTelemetry() {
  const [snapshot, setSnapshot] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const previousSnapshotRef = useRef(null);
  const latestSnapshotRef = useRef(null);

  useEffect(() => {
    let active = true;
    let timeoutId = 0;

    async function updateSnapshot() {
      try {
        const nextSnapshot = await fetchIssSnapshot();

        if (!active) {
          return;
        }

        const previousSnapshot = previousSnapshotRef.current;
        const resolvedSnapshot = {
          ...nextSnapshot,
          altitude: resolveNumericTelemetry(
            nextSnapshot.altitude,
            previousSnapshot?.altitude
          ),
          velocity: resolveNumericTelemetry(
            nextSnapshot.velocity,
            previousSnapshot?.velocity
          ),
          footprint: resolveNumericTelemetry(
            nextSnapshot.footprint,
            previousSnapshot?.footprint
          )
        };
        const heading = previousSnapshot
          ? calculateHeading(
              previousSnapshot.latitude,
              previousSnapshot.longitude,
              resolvedSnapshot.latitude,
              resolvedSnapshot.longitude
            )
          : null;

        const groundTrack = await resolveGroundTrack(
          resolvedSnapshot.latitude,
          resolvedSnapshot.longitude
        );

        if (!active) {
          return;
        }

        const enrichedSnapshot = {
          ...resolvedSnapshot,
          heading,
          groundTrack
        };

        previousSnapshotRef.current = resolvedSnapshot;
        latestSnapshotRef.current = enrichedSnapshot;
        setSnapshot(enrichedSnapshot);
        setLastUpdated(
          Number.isFinite(resolvedSnapshot.timestamp)
            ? new Date(resolvedSnapshot.timestamp * 1000).toISOString()
            : new Date().toISOString()
        );
        setStatus("live");
        setError("");
        setHistory((currentHistory) => {
          const recentPoint = currentHistory[currentHistory.length - 1];

          if (recentPoint?.timestamp === enrichedSnapshot.timestamp) {
            return currentHistory;
          }

          const nextHistory = [...currentHistory, enrichedSnapshot];
          return nextHistory.slice(-MAX_HISTORY_POINTS);
        });
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(requestError.message);
        setStatus(latestSnapshotRef.current ? "stale" : "offline");
      }
    }

    async function runPollingCycle() {
      await updateSnapshot();

      if (active) {
        timeoutId = window.setTimeout(runPollingCycle, POLL_INTERVAL_MS);
      }
    }

    runPollingCycle();

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  return {
    snapshot,
    history,
    status,
    error,
    lastUpdated
  };
}
