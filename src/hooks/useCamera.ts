"use client";

import { useEffect, useRef, useState } from "react";

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  stream: MediaStream | null;
  error: string | null;
  isReady: boolean;
  isSupported: boolean;
  restartCamera: () => void;
}

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
  if (typeof navigator === "undefined") {
    return true;
  }

  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(false);

  const [restartKey, setRestartKey] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(() =>
    browserSupportsCamera()
      ? null
      : "This browser does not support camera access. Use manual entry instead."
  );
  const [isReady, setIsReady] = useState(false);
  const [isSupported, setIsSupported] = useState(browserSupportsCamera);

  useEffect(() => {
    if (typeof navigator === "undefined") {
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
        if (
          canvas.width !== video.videoWidth ||
          canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const context = canvas.getContext("2d", { willReadFrequently: true });
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);

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
    error,
    isReady,
    isSupported,
    restartCamera: () => {
      readyRef.current = false;
      setStream(null);
      setIsReady(false);

      if (!browserSupportsCamera()) {
        setIsSupported(false);
        setError("This browser does not support camera access. Use manual entry instead.");
        return;
      }

      setIsSupported(true);
      setError(null);
      setRestartKey((current) => current + 1);
    },
  };
}
