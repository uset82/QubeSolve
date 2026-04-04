import { CUBE_COLORS, type CubeColor, type Face, SCAN_ORDER } from "@/lib/constants";

const SCAN_SESSION_KEY = "qubesolve-scan-session";
const SCAN_SESSION_CHANGE_EVENT = "qubesolve-scan-session-change";
const FACE_SET = new Set<Face>(SCAN_ORDER);
const COLOR_SET = new Set<CubeColor>(CUBE_COLORS);

let cachedRawSessionValue: string | null | undefined;
let cachedParsedSession: ScanSession | null = null;

export type ScannedFacesMap = Partial<Record<Face, CubeColor[]>>;

export interface ScanSession {
  scannedFaces: ScannedFacesMap;
  updatedAt: string;
}

function isValidFaceColors(value: unknown): value is CubeColor[] {
  return (
    Array.isArray(value) &&
    value.length === 9 &&
    value.every(
      (color) => typeof color === "string" && COLOR_SET.has(color as CubeColor)
    )
  );
}

function sanitizeScannedFaces(value: unknown): ScannedFacesMap {
  if (!value || typeof value !== "object") {
    return {};
  }

  const entries = Object.entries(value).filter(
    ([face, colors]) => FACE_SET.has(face as Face) && isValidFaceColors(colors)
  ) as Array<[Face, CubeColor[]]>;

  return Object.fromEntries(entries);
}

function parseScanSession(rawValue: string | null): ScanSession | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as {
      scannedFaces?: unknown;
      updatedAt?: unknown;
    };

    return {
      scannedFaces: sanitizeScannedFaces(parsed.scannedFaces),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function broadcastScanSessionChange(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(SCAN_SESSION_CHANGE_EVENT));
}

export function getServerScanSessionSnapshot(): ScanSession | null {
  return null;
}

export function getScanSessionSnapshot(): ScanSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(SCAN_SESSION_KEY);
    if (rawValue === cachedRawSessionValue) {
      return cachedParsedSession;
    }

    cachedRawSessionValue = rawValue;
    cachedParsedSession = parseScanSession(rawValue);
    return cachedParsedSession;
  } catch {
    return null;
  }
}

export function subscribeToScanSession(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SCAN_SESSION_KEY) {
      callback();
    }
  };
  const handleChange = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SCAN_SESSION_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SCAN_SESSION_CHANGE_EVENT, handleChange);
  };
}

export function loadScanSession(): ScanSession | null {
  return getScanSessionSnapshot();
}

export function saveScanSession(scannedFaces: ScannedFacesMap): void {
  if (typeof window === "undefined") {
    return;
  }

  const rawValue = JSON.stringify({
    scannedFaces,
    updatedAt: new Date().toISOString(),
  } satisfies ScanSession);

  window.localStorage.setItem(SCAN_SESSION_KEY, rawValue);
  cachedRawSessionValue = rawValue;
  cachedParsedSession = parseScanSession(rawValue);
  broadcastScanSessionChange();
}

export function clearScanSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SCAN_SESSION_KEY);
  cachedRawSessionValue = null;
  cachedParsedSession = null;
  broadcastScanSessionChange();
}
