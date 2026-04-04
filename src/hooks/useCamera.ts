"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  stream: MediaStream | null;
  error: string | null;
  isReady: boolean;
  isSupported: boolean;
  restartCamera: () => void;
}

const UNSUPPORTED_CAMERA_MESSAGE =
  "This browser does not support camera access. Use manual entry instead.";

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function getCameraErrorMessage(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return "Unable to start the camera right now.";
  }

  switch (error.name) {
    case "NotAllowedError":
      return "Camera access was denied. Allow camera access in your browser settings and try again.";
    case "NotFoundError":
      return "No camera was found on this device.";
    case "NotReadableError":
      return "The camera is already in use by another application.";
    case "OverconstrainedError":
      return "This camera does not support the requested video settings.";
    case "SecurityError":
      return "Camera access requires a secure connection (HTTPS or localhost).";
    default:
      return "Unable to start the camera right now.";
  }
}

function browserSupportsCamera(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return true;
  }

  return Boolean(navigator.mediaDevices?.getUserMedia);
}

function subscribeToCameraSupport(): () => void {
  return () => {};
}

function getServerCameraSupportSnapshot(): boolean {
  return true;
}

function getCoverCropRegion(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    targetWidth <= 0 ||
    targetHeight <= 0
  ) {
    return {
      sx: 0,
      sy: 0,
      sWidth: sourceWidth,
      sHeight: sourceHeight,
    };
  }

  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;

  if (sourceAspect > targetAspect) {
    const sHeight = sourceHeight;
    const sWidth = sHeight * targetAspect;

    return {
      sx: (sourceWidth - sWidth) / 2,
      sy: 0,
      sWidth,
      sHeight,
    };
  }

  const sWidth = sourceWidth;
  const sHeight = sWidth / targetAspect;

  return {
    sx: 0,
    sy: (sourceHeight - sHeight) / 2,
    sWidth,
    sHeight,
  };
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(false);

  const [restartKey, setRestartKey] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isSupported = useSyncExternalStore(
    subscribeToCameraSupport,
    browserSupportsCamera,
    getServerCameraSupportSnapshot
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    let isCancelled = false;
    let animationFrame: number | null = null;
    let activeStream: MediaStream | null = null;
    const videoElement = videoRef.current;

    readyRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }

    const drawFrame = () => {
      if (isCancelled) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        video &&
        canvas &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        const targetWidth = Math.round(video.clientWidth) || video.videoWidth;
        const targetHeight = Math.round(video.clientHeight) || video.videoHeight;

        if (
          canvas.width !== targetWidth ||
          canvas.height !== targetHeight
        ) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }

        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (context) {
          const crop = getCoverCropRegion(
            video.videoWidth,
            video.videoHeight,
            canvas.width,
            canvas.height
          );

          context.drawImage(
            video,
            crop.sx,
            crop.sy,
            crop.sWidth,
            crop.sHeight,
            0,
            0,
            canvas.width,
            canvas.height
          );
        }

        if (!readyRef.current) {
          readyRef.current = true;
          setIsReady(true);
        }
      }

      animationFrame = window.requestAnimationFrame(drawFrame);
    };

    const startCamera = async () => {
      try {
        const nextStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (isCancelled) {
          stopMediaStream(nextStream);
          return;
        }

        const video = videoRef.current ?? videoElement;

        if (!video) {
          stopMediaStream(nextStream);
          setError("The camera preview is unavailable.");
          return;
        }

        activeStream = nextStream;
        setStream(nextStream);
        video.srcObject = nextStream;
        video.muted = true;
        video.playsInline = true;

        try {
          await video.play();
        } catch {
          // Ignore autoplay failures and continue drawing when playback is allowed.
        }

        animationFrame = window.requestAnimationFrame(drawFrame);
      } catch (cameraError) {
        if (isCancelled) {
          return;
        }

        setStream(null);
        setError(getCameraErrorMessage(cameraError));
      }
    };

    void startCamera();

    return () => {
      isCancelled = true;

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      stopMediaStream(activeStream);

      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [restartKey]);

  return {
    videoRef,
    canvasRef,
    stream,
    error: isSupported ? error : UNSUPPORTED_CAMERA_MESSAGE,
    isReady,
    isSupported,
    restartCamera: () => {
      readyRef.current = false;
      setStream(null);
      setIsReady(false);

      if (!browserSupportsCamera()) {
        setError(UNSUPPORTED_CAMERA_MESSAGE);
        return;
      }

      setError(null);
      setRestartKey((current) => current + 1);
    },
  };
}
