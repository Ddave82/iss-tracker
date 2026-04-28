const PRIMARY_SOURCE = "/api/iss/current";
const DIRECT_PRIMARY_SOURCE = "https://api.wheretheiss.at/v1/satellites/25544";
const FALLBACK_SOURCE = "/api/iss/fallback";
const REQUEST_TIMEOUT_MS = 8000;

function withTimeout(resource, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  return fetch(resource, {
    ...options,
    signal: controller.signal,
    headers: {
      Accept: "application/json",
      ...options.headers
    }
  }).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function normalizePrimaryPayload(payload) {
  return {
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    altitude: Number(payload.altitude),
    velocity: Number(payload.velocity),
    visibility: payload.visibility,
    footprint: Number(payload.footprint),
    timestamp: Number(payload.timestamp)
  };
}

function normalizeFallbackPayload(payload) {
  return {
    latitude: Number(payload.iss_position?.latitude),
    longitude: Number(payload.iss_position?.longitude),
    altitude: null,
    velocity: null,
    visibility: null,
    footprint: null,
    timestamp: Number(payload.timestamp)
  };
}

async function fetchJson(url) {
  const response = await withTimeout(url);

  if (!response.ok) {
    throw new Error(`Fehler beim Abruf: ${response.status}`);
  }

  return response.json();
}

export async function fetchIssSnapshot() {
  try {
    const payload = await fetchJson(PRIMARY_SOURCE);
    return normalizePrimaryPayload(payload);
  } catch (primaryError) {
    try {
      const directPayload = await fetchJson(DIRECT_PRIMARY_SOURCE);
      return normalizePrimaryPayload(directPayload);
    } catch (directError) {
      try {
        const payload = await fetchJson(FALLBACK_SOURCE);
        return normalizeFallbackPayload(payload);
      } catch (fallbackError) {
        if (primaryError.name === "AbortError" || directError.name === "AbortError") {
          throw new Error("Zeitüberschreitung beim ISS-Datenfeed.");
        }

        throw new Error("ISS-Daten derzeit nicht erreichbar.");
      }
    }
  }
}
