import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  createOrbitPreviewPoints,
  createEarthTexture,
  createCloudTexture,
  getOrbitRadius,
  latLonToVector3,
  toTrailSegments
} from "../../lib/earthMath";

const EARTH_RADIUS = 1.9;
const CAMERA_DISTANCE = 8.8;
const VIEW_TARGET_Y = 0.08;
const MOBILE_CAMERA_DISTANCE = 6.35;
const MOBILE_EARTH_POSITION_Y = -0.16;
const SURFACE_NORMAL = new THREE.Vector3(0, 0, 1);
const MOBILE_SCENE_BREAKPOINT = "(max-width: 900px)";
const DESKTOP_TEXTURE_WIDTH = 2304;
const MOBILE_TEXTURE_WIDTH = 1536;

function useIsMobileScene() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(MOBILE_SCENE_BREAKPOINT).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_SCENE_BREAKPOINT);
    const handleChange = (event) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return isMobile;
}

function canRequestFullscreen(element) {
  return Boolean(
    element?.requestFullscreen ||
      element?.webkitRequestFullscreen ||
      element?.webkitRequestFullScreen
  );
}

function isFullscreenSupported() {
  if (typeof document === "undefined") {
    return false;
  }

  if (typeof document.fullscreenEnabled === "boolean") {
    return document.fullscreenEnabled;
  }

  if (typeof document.webkitFullscreenEnabled === "boolean") {
    return document.webkitFullscreenEnabled;
  }

  return true;
}

function getCurrentFullscreenElement() {
  if (typeof document === "undefined") {
    return null;
  }

  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    null
  );
}

async function requestElementFullscreen(element) {
  if (element?.requestFullscreen) {
    return element.requestFullscreen();
  }

  if (element?.webkitRequestFullscreen) {
    return element.webkitRequestFullscreen();
  }

  if (element?.webkitRequestFullScreen) {
    return element.webkitRequestFullScreen();
  }

  return null;
}

async function exitCurrentFullscreen() {
  if (typeof document === "undefined") {
    return null;
  }

  if (document.exitFullscreen) {
    return document.exitFullscreen();
  }

  if (document.webkitExitFullscreen) {
    return document.webkitExitFullscreen();
  }

  if (document.webkitCancelFullScreen) {
    return document.webkitCancelFullScreen();
  }

  return null;
}

function EarthBody({ snapshot, history, isMobile, positionY }) {
  const trackingRef = useRef(null);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const rotationActiveRef = useRef(false);
  const { invalidate } = useThree();
  const textureWidth = isMobile ? MOBILE_TEXTURE_WIDTH : DESKTOP_TEXTURE_WIDTH;
  const earthTexture = useMemo(
    () => createEarthTexture(textureWidth),
    [textureWidth]
  );
  const cloudTexture = useMemo(
    () => createCloudTexture(textureWidth),
    [textureWidth]
  );
  const groupPosition = useMemo(() => [0, positionY, 0], [positionY]);

  const hasPosition =
    Number.isFinite(snapshot?.latitude) && Number.isFinite(snapshot?.longitude);
  const trailSegments = useMemo(
    () => toTrailSegments(history, EARTH_RADIUS),
    [history]
  );
  const orbitPreviewPoints = useMemo(
    () =>
      createOrbitPreviewPoints(
        snapshot,
        EARTH_RADIUS,
        isMobile ? 168 : 220
      ),
    [snapshot, isMobile]
  );
  const positionMarkers = useMemo(() => {
    if (!hasPosition) {
      return null;
    }

    const surfacePoint = latLonToVector3(
      snapshot.latitude,
      snapshot.longitude,
      EARTH_RADIUS
    );
    const orbitPoint = latLonToVector3(
      snapshot.latitude,
      snapshot.longitude,
      getOrbitRadius(snapshot.altitude, EARTH_RADIUS)
    );
    const markerPoint = surfacePoint.clone().setLength(EARTH_RADIUS + 0.02);
    const markerRotation = new THREE.Quaternion().setFromUnitVectors(
      SURFACE_NORMAL,
      markerPoint.clone().normalize()
    );
    const markerPointArray = markerPoint.toArray();
    const orbitPointArray = orbitPoint.toArray();

    return {
      markerPoint: markerPointArray,
      orbitPoint: orbitPointArray,
      markerRotation,
      tetherPoints: [markerPointArray, orbitPointArray]
    };
  }, [hasPosition, snapshot]);
  const earthSegments = isMobile ? 52 : 72;
  const cloudSegments = isMobile ? 36 : 48;

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    targetRotationRef.current = {
      x: THREE.MathUtils.degToRad(snapshot.latitude),
      y: THREE.MathUtils.degToRad(-snapshot.longitude)
    };
    rotationActiveRef.current = true;
    invalidate();
  }, [snapshot, invalidate]);

  useFrame(() => {
    if (!trackingRef.current || !rotationActiveRef.current) {
      return;
    }

    const nextRotation = targetRotationRef.current;
    const currentGroup = trackingRef.current;

    currentGroup.rotation.x = THREE.MathUtils.lerp(
      currentGroup.rotation.x,
      nextRotation.x,
      0.11
    );
    currentGroup.rotation.y = THREE.MathUtils.lerp(
      currentGroup.rotation.y,
      nextRotation.y,
      0.11
    );
    currentGroup.rotation.z = 0;

    const rotationSettled =
      Math.abs(currentGroup.rotation.x - nextRotation.x) < 0.0006 &&
      Math.abs(currentGroup.rotation.y - nextRotation.y) < 0.0006;

    if (rotationSettled) {
      currentGroup.rotation.x = nextRotation.x;
      currentGroup.rotation.y = nextRotation.y;
      currentGroup.rotation.z = 0;
      rotationActiveRef.current = false;
      return;
    }

    invalidate();
  });

  useEffect(() => {
    return () => {
      earthTexture.dispose();
      cloudTexture.dispose();
    };
  }, [earthTexture, cloudTexture]);

  return (
    <group position={groupPosition}>
      <group ref={trackingRef}>
        <group rotation={[0, -Math.PI / 2, 0]}>
          <mesh>
            <sphereGeometry args={[EARTH_RADIUS, earthSegments, earthSegments]} />
            <meshStandardMaterial
              map={earthTexture}
              metalness={0.04}
              roughness={0.9}
              emissive="#081628"
              emissiveIntensity={0.1}
            />
          </mesh>

          <mesh>
            <sphereGeometry args={[EARTH_RADIUS + 0.022, cloudSegments, cloudSegments]} />
            <meshStandardMaterial
              map={cloudTexture}
              transparent
              opacity={0.12}
              depthWrite={false}
              emissive="#78d7ff"
              emissiveIntensity={0.02}
            />
          </mesh>

          <mesh scale={1.045}>
            <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
            <meshBasicMaterial
              color="#2ca8ff"
              transparent
              opacity={0.14}
              blending={THREE.AdditiveBlending}
              side={THREE.BackSide}
            />
          </mesh>
        </group>

        {trailSegments.map((trailPoints, index) => (
          <Line
            key={`trail-segment-${index}-${trailPoints.length}`}
            points={trailPoints}
            color="#ff5c6e"
            transparent
            opacity={0.42}
            lineWidth={2}
          />
        ))}

        {orbitPreviewPoints.length > 1 ? (
          <Line
            points={orbitPreviewPoints}
            color="#9fe8ff"
            transparent
            opacity={0.24}
            lineWidth={1.5}
            dashed
            dashScale={36}
            dashSize={0.8}
            gapSize={0.55}
          />
        ) : null}

        {positionMarkers ? (
          <>
            <Line
              points={positionMarkers.tetherPoints}
              color="#76ecff"
              transparent
              opacity={0.16}
              lineWidth={0.8}
            />

            <group
              position={positionMarkers.markerPoint}
              quaternion={positionMarkers.markerRotation}
            >
              <mesh>
                <ringGeometry args={[0.016, 0.034, 32]} />
                <meshBasicMaterial color="#d6fbff" transparent opacity={0.72} />
              </mesh>
              <mesh>
                <ringGeometry args={[0.04, 0.055, 32]} />
                <meshBasicMaterial color="#47dbff" transparent opacity={0.12} />
              </mesh>
            </group>

            <group position={positionMarkers.orbitPoint}>
              <mesh>
                <sphereGeometry args={[0.06, 18, 18]} />
                <meshBasicMaterial color="#cfffff" />
              </mesh>
              <Html
                position={[0, 0, 0]}
                transform={false}
                wrapperClass="iss-tag-anchor"
              >
                <div className="iss-overlay">
                  <span className="iss-pulse-ring" />
                  <span className="iss-pulse-halo" />
                  <span className="iss-core-dot" />
                  <div className="iss-tag">ISS</div>
                </div>
              </Html>
            </group>
          </>
        ) : null}
      </group>
    </group>
  );
}

function SceneControls({ isMobile, viewTargetY }) {
  const { invalidate } = useThree();

  return (
    <OrbitControls
      target={[0, viewTargetY, 0]}
      enablePan={false}
      enableZoom
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={isMobile ? 0.72 : 0.55}
      zoomSpeed={isMobile ? 0.92 : 0.86}
      minDistance={isMobile ? 5.9 : 4.9}
      maxDistance={isMobile ? 12.3 : 11.8}
      minPolarAngle={Math.PI / 3.2}
      maxPolarAngle={Math.PI / 1.48}
      touches={
        isMobile
          ? {
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_ROTATE
            }
          : {
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN
            }
      }
      onChange={() => invalidate()}
    />
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.54} color="#bfd5ff" />
      <directionalLight
        position={[8.8, 6.4, 7.6]}
        intensity={2.8}
        color="#f2fbff"
      />
      <directionalLight
        position={[-7.5, -3.2, -5.4]}
        intensity={0.42}
        color="#1d4fa2"
      />
      <pointLight position={[0, 0, 8.5]} intensity={0.22} color="#28c6ff" />
    </>
  );
}

function SceneFallback() {
  return (
    <div className="scene-fallback">
      <span>3D-Ansicht konnte nicht geladen werden.</span>
    </div>
  );
}

function SceneHeading() {
  return (
    <div>
      <span className="panel-eyebrow">Orbital View</span>
      <h2>Earth / ISS</h2>
    </div>
  );
}

function SceneToolbar({ isFullscreen, isFullscreenAvailable, onToggleFullscreen }) {
  if (!isFullscreenAvailable) {
    return null;
  }

  return (
    <div className="scene-toolbar">
      <button
        type="button"
        className={`scene-action-button${isFullscreen ? " is-active" : ""}`}
        onClick={onToggleFullscreen}
        aria-pressed={isFullscreen}
        aria-label={
          isFullscreen
            ? "Orbital View Vollbild schließen"
            : "Orbital View im Vollbild öffnen"
        }
      >
        {isFullscreen ? "Vollbild schließen" : "Vollbild"}
      </button>
    </div>
  );
}

function SceneHudCard({ groundTrack, statusText, interactionHint, inline = false }) {
  return (
    <div className={`scene-hud-card${inline ? " scene-hud-card-inline" : ""}`}>
      <span className="scene-card-label">Ground Track</span>
      <strong>{groundTrack || "Position wird bestimmt"}</strong>
      <span>{statusText}</span>
      <span>{interactionHint}</span>
    </div>
  );
}

export function EarthScene({ telemetry }) {
  const { snapshot, history, status } = telemetry;
  const isMobile = useIsMobileScene();
  const stageRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullscreenAvailable, setIsFullscreenAvailable] = useState(false);
  const viewTargetY = VIEW_TARGET_Y;
  const earthPositionY = isMobile ? MOBILE_EARTH_POSITION_Y : viewTargetY;
  const statusText =
    status === "live"
      ? "Tracking in Echtzeit"
      : status === "stale"
        ? "Zuletzt bekannte Position"
        : "Warte auf Daten";
  const interactionHint = isMobile
    ? "Ziehen: Orbit · Spreizen: Zoom · Gestrichelt: Orbit-Prognose"
    : "Mausrad: Zoom · Ziehen: Orbit · Gestrichelt: Orbit-Prognose";

  useEffect(() => {
    const stageElement = stageRef.current;

    setIsFullscreenAvailable(
      Boolean(stageElement && canRequestFullscreen(stageElement) && isFullscreenSupported())
    );

    const handleFullscreenChange = () => {
      setIsFullscreen(getCurrentFullscreenElement() === stageElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  async function handleToggleFullscreen() {
    const stageElement = stageRef.current;

    if (!stageElement || !canRequestFullscreen(stageElement)) {
      return;
    }

    try {
      if (getCurrentFullscreenElement() === stageElement) {
        await exitCurrentFullscreen();
        return;
      }

      await requestElementFullscreen(stageElement);
    } catch {
      // Ignore browser fullscreen rejections and leave the current UI state intact.
    }
  }

  return (
    <section id="orbital-view" className="scene-panel earth-scene-panel scroll-target">
      {isMobile ? (
        <div className="scene-copy scene-copy-mobile">
          <SceneHeading />
        </div>
      ) : null}

      <div
        ref={stageRef}
        className={`scene-stage${isFullscreen ? " scene-stage-fullscreen" : ""}`}
      >
        {!isMobile ? (
          <div className="scene-copy scene-copy-overlay">
            <SceneHeading />
          </div>
        ) : null}

        <SceneToolbar
          isFullscreen={isFullscreen}
          isFullscreenAvailable={isFullscreenAvailable}
          onToggleFullscreen={handleToggleFullscreen}
        />

        <Canvas
          dpr={isMobile ? [0.85, 1.05] : [1, 1.25]}
          frameloop="demand"
          gl={{
            alpha: true,
            antialias: !isMobile,
            powerPreference: "low-power"
          }}
          fallback={<SceneFallback />}
        >
          <PerspectiveCamera
            makeDefault
            position={[0, viewTargetY, isMobile ? MOBILE_CAMERA_DISTANCE : CAMERA_DISTANCE]}
            fov={36}
          />
          <fog attach="fog" args={["#02030b", 10, 22]} />
          <SceneLighting />
          <EarthBody
            snapshot={snapshot}
            history={history}
            isMobile={isMobile}
            positionY={earthPositionY}
          />
          <SceneControls isMobile={isMobile} viewTargetY={viewTargetY} />
        </Canvas>

        {!isMobile ? (
          <SceneHudCard
            groundTrack={snapshot?.groundTrack}
            statusText={statusText}
            interactionHint={interactionHint}
          />
        ) : null}

        <div className="scene-overlay scene-overlay-top" />
        <div className="scene-overlay scene-overlay-bottom" />
      </div>

      {isMobile ? (
        <SceneHudCard
          groundTrack={snapshot?.groundTrack}
          statusText={statusText}
          interactionHint={interactionHint}
          inline
        />
      ) : null}
    </section>
  );
}
