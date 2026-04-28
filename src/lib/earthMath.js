import * as THREE from "three";
import {
  geoEquirectangular,
  geoGraticule,
  geoPath
} from "d3-geo";
import { feature, mesh } from "topojson-client";
import countriesAtlas from "world-atlas/countries-110m.json";

const WORLD_SPHERE = { type: "Sphere" };
const COUNTRIES = feature(countriesAtlas, countriesAtlas.objects.countries);
const COUNTRY_BORDERS = mesh(
  countriesAtlas,
  countriesAtlas.objects.countries,
  (leftCountry, rightCountry) => leftCountry !== rightCountry
);
const GRATICULE = geoGraticule().step([5, 5])();
const FULL_ORBIT_RADIANS = Math.PI * 2;
const DEFAULT_ISS_ALTITUDE_KM = 408;
const ISS_ORBIT_PERIOD_SECONDS = 92 * 60;
const ISS_ANGULAR_SPEED_RAD_PER_SECOND =
  FULL_ORBIT_RADIANS / ISS_ORBIT_PERIOD_SECONDS;

function isFiniteCoordinate(value) {
  return Number.isFinite(value);
}

function flushTrailSegment(segments, currentSegment) {
  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }
}

function shouldSplitTrail(previousVector, nextVector, previousTimestamp, nextTimestamp) {
  const timeDeltaSeconds =
    Number.isFinite(previousTimestamp) && Number.isFinite(nextTimestamp)
      ? Math.max(1, Math.abs(nextTimestamp - previousTimestamp))
      : 10;
  const averageRadius = (previousVector.length() + nextVector.length()) / 2;
  const expectedStepDistance =
    averageRadius * ISS_ANGULAR_SPEED_RAD_PER_SECOND * timeDeltaSeconds;
  const allowedStepDistance = THREE.MathUtils.clamp(
    expectedStepDistance * 4.5,
    averageRadius * 0.04,
    averageRadius * 0.18
  );

  return previousVector.distanceTo(nextVector) > allowedStepDistance;
}

function toRadians(value) {
  return value * (Math.PI / 180);
}

function createSeededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function latLonToVector3(latitude, longitude, radius) {
  const latitudeRadians = toRadians(latitude);
  const longitudeRadians = toRadians(longitude);
  const x = radius * Math.cos(latitudeRadians) * Math.sin(longitudeRadians);
  const y = radius * Math.sin(latitudeRadians);
  const z = radius * Math.cos(latitudeRadians) * Math.cos(longitudeRadians);

  return new THREE.Vector3(x, y, z);
}

function createEastVector(longitude) {
  const longitudeRadians = toRadians(longitude);

  return new THREE.Vector3(
    Math.cos(longitudeRadians),
    0,
    -Math.sin(longitudeRadians)
  ).normalize();
}

export function getOrbitRadius(altitude, earthRadius) {
  const safeAltitude = Number.isFinite(altitude)
    ? altitude
    : DEFAULT_ISS_ALTITUDE_KM;
  const altitudeScale = 1.85;
  return earthRadius + 0.06 + (safeAltitude / 6371) * earthRadius * altitudeScale;
}

export function toTrailSegments(history, radius) {
  const segments = [];
  let currentSegment = [];
  let previousVector = null;
  let previousTimestamp = null;
  let lastKnownAltitude = null;

  history.forEach((point) => {
    if (
      !point ||
      !isFiniteCoordinate(point.latitude) ||
      !isFiniteCoordinate(point.longitude)
    ) {
      flushTrailSegment(segments, currentSegment);
      currentSegment = [];
      previousVector = null;
      previousTimestamp = null;
      return;
    }

    const resolvedAltitude = Number.isFinite(point.altitude)
      ? point.altitude
      : lastKnownAltitude;

    if (Number.isFinite(resolvedAltitude)) {
      lastKnownAltitude = resolvedAltitude;
    }

    const nextVector = latLonToVector3(
      point.latitude,
      point.longitude,
      getOrbitRadius(resolvedAltitude, radius)
    );
    const nextTimestamp = Number.isFinite(point.timestamp)
      ? point.timestamp
      : null;

    if (
      previousVector &&
      shouldSplitTrail(previousVector, nextVector, previousTimestamp, nextTimestamp)
    ) {
      flushTrailSegment(segments, currentSegment);
      currentSegment = [];
    }

    currentSegment.push(nextVector.toArray());
    previousVector = nextVector;
    previousTimestamp = nextTimestamp;
  });

  flushTrailSegment(segments, currentSegment);

  return segments;
}

export function createOrbitPreviewPoints(snapshot, earthRadius, pointCount = 220) {
  if (
    !snapshot ||
    !Number.isFinite(snapshot.latitude) ||
    !Number.isFinite(snapshot.longitude) ||
    !Number.isFinite(snapshot.heading)
  ) {
    return [];
  }

  const orbitRadius = getOrbitRadius(snapshot.altitude, earthRadius);
  const surfaceVector = latLonToVector3(
    snapshot.latitude,
    snapshot.longitude,
    1
  ).normalize();
  const eastVector = createEastVector(snapshot.longitude);
  const northReference = new THREE.Vector3(0, 1, 0);
  const northVector = northReference
    .clone()
    .sub(surfaceVector.clone().multiplyScalar(surfaceVector.dot(northReference)))
    .normalize();
  const headingRadians = toRadians(snapshot.heading);
  const tangentVector = northVector
    .multiplyScalar(Math.cos(headingRadians))
    .add(eastVector.multiplyScalar(Math.sin(headingRadians)))
    .normalize();
  const orbitAxis = new THREE.Vector3()
    .crossVectors(surfaceVector, tangentVector)
    .normalize();

  if (orbitAxis.lengthSq() < 0.000001) {
    return [];
  }

  const points = [];
  const baseOrbitVector = surfaceVector.clone().multiplyScalar(orbitRadius);

  for (let step = 0; step <= pointCount; step += 1) {
    const angle = (step / pointCount) * Math.PI * 2;
    const point = baseOrbitVector.clone().applyAxisAngle(orbitAxis, angle);
    points.push(point.toArray());
  }

  return points;
}

function createCanvasTexture(drawTexture, width = 2304, height = 1152) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  drawTexture(context, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createEarthTexture(width = 2304) {
  return createCanvasTexture((context, textureWidth, textureHeight) => {
    const height = textureHeight;
    const width = textureWidth;
    const projection = geoEquirectangular().fitSize([width, height], WORLD_SPHERE);
    const path = geoPath(projection, context);
    const random = createSeededRandom(42);
    const oceanGradient = context.createLinearGradient(0, 0, 0, height);
    oceanGradient.addColorStop(0, "#031324");
    oceanGradient.addColorStop(0.25, "#0e3754");
    oceanGradient.addColorStop(0.55, "#0a2740");
    oceanGradient.addColorStop(0.8, "#071b30");
    oceanGradient.addColorStop(1, "#04111d");
    context.fillStyle = oceanGradient;
    context.fillRect(0, 0, width, height);

    const oceanGlow = context.createLinearGradient(0, 0, 0, height);
    oceanGlow.addColorStop(0, "rgba(119, 177, 255, 0.18)");
    oceanGlow.addColorStop(0.5, "rgba(79, 198, 255, 0.08)");
    oceanGlow.addColorStop(1, "rgba(16, 62, 112, 0.22)");
    context.fillStyle = oceanGlow;
    context.fillRect(0, 0, width, height);

    context.beginPath();
    path(GRATICULE);
    context.strokeStyle = "rgba(152, 206, 255, 0.065)";
    context.lineWidth = 0.85;
    context.stroke();

    context.save();
    context.beginPath();
    path(COUNTRIES);
    context.clip();

    const landGradient = context.createLinearGradient(0, 0, 0, height);
    landGradient.addColorStop(0, "#eef4f2");
    landGradient.addColorStop(0.12, "#cfd9c6");
    landGradient.addColorStop(0.3, "#6b8b63");
    landGradient.addColorStop(0.48, "#4c6d4d");
    landGradient.addColorStop(0.66, "#7b7253");
    landGradient.addColorStop(0.82, "#8b8d73");
    landGradient.addColorStop(1, "#eef4f4");
    context.fillStyle = landGradient;
    context.fillRect(0, 0, width, height);

    const saharaGlow = context.createRadialGradient(
      width * 0.56,
      height * 0.39,
      width * 0.015,
      width * 0.56,
      height * 0.39,
      width * 0.09
    );
    saharaGlow.addColorStop(0, "rgba(215, 189, 121, 0.45)");
    saharaGlow.addColorStop(1, "rgba(215, 189, 121, 0)");
    context.fillStyle = saharaGlow;
    context.fillRect(0, 0, width, height);

    const australiaGlow = context.createRadialGradient(
      width * 0.82,
      height * 0.69,
      width * 0.01,
      width * 0.82,
      height * 0.69,
      width * 0.06
    );
    australiaGlow.addColorStop(0, "rgba(195, 157, 107, 0.28)");
    australiaGlow.addColorStop(1, "rgba(195, 157, 107, 0)");
    context.fillStyle = australiaGlow;
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 1100; index += 1) {
      const x = random() * width;
      const y = random() * height;
      const radius = 18 + random() * 165;
      const opacity = 0.02 + random() * 0.05;
      const tone =
        y < height * 0.14 || y > height * 0.86
          ? `rgba(240, 247, 250, ${opacity})`
          : y > height * 0.32 && y < height * 0.62
            ? `rgba(82, 120, 78, ${opacity})`
            : `rgba(128, 117, 84, ${opacity})`;
      const terrainPatch = context.createRadialGradient(
        x,
        y,
        radius * 0.08,
        x,
        y,
        radius
      );
      terrainPatch.addColorStop(0, tone);
      terrainPatch.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = terrainPatch;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();

    context.beginPath();
    path(COUNTRIES);
    context.fillStyle = "rgba(69, 91, 70, 0.16)";
    context.fill();
    context.strokeStyle = "rgba(222, 239, 241, 0.24)";
    context.lineWidth = 1.4;
    context.stroke();

    context.beginPath();
    path(COUNTRY_BORDERS);
    context.strokeStyle = "rgba(218, 236, 242, 0.16)";
    context.lineWidth = 0.9;
    context.stroke();

    for (let index = 0; index < 140; index += 1) {
      const x = random() * width;
      const y = random() * height;
      const radius = 28 + random() * 180;
      const oceanPatch = context.createRadialGradient(
        x,
        y,
        radius * 0.08,
        x,
        y,
        radius
      );
      oceanPatch.addColorStop(0, `rgba(108, 182, 255, ${0.025 + random() * 0.03})`);
      oceanPatch.addColorStop(1, "rgba(108, 182, 255, 0)");
      context.fillStyle = oceanPatch;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    const glowGradient = context.createRadialGradient(
      width * 0.36,
      height * 0.34,
      width * 0.03,
      width * 0.36,
      height * 0.34,
      width * 0.22
    );
    glowGradient.addColorStop(0, "rgba(150, 232, 255, 0.16)");
    glowGradient.addColorStop(1, "rgba(146, 253, 255, 0)");
    context.fillStyle = glowGradient;
    context.fillRect(0, 0, width, height);
  }, width, width / 2);
}

export function createCloudTexture(width = 2304) {
  return createCanvasTexture((context, textureWidth, textureHeight) => {
    const height = textureHeight;
    const width = textureWidth;
    const random = createSeededRandom(7);
    context.fillStyle = "rgba(0, 0, 0, 0)";
    context.fillRect(0, 0, width, height);

    for (let layer = 0; layer < 65; layer += 1) {
      const x = random() * width;
      const y = random() * height;
      const radius = 18 + random() * 110;
      const opacity = 0.025 + random() * 0.06;
      const cloudGradient = context.createRadialGradient(x, y, radius * 0.1, x, y, radius);
      cloudGradient.addColorStop(0, `rgba(225, 242, 255, ${opacity})`);
      cloudGradient.addColorStop(1, "rgba(225, 242, 255, 0)");
      context.fillStyle = cloudGradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
  }, width, width / 2);
}
