"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export type ScanSource = "HID" | "CAMERA" | "MANUAL";

interface UseBarcodeScanInputOptions {
  onScan: (value: string, source: ScanSource) => void;
  /** Pause HID listening while a modal/other input has focus. Defaults to true. */
  enabled?: boolean;
  /** Ignore buffers shorter than this — guards against stray keystrokes. */
  minLength?: number;
  /**
   * HID scanners "type" an entire code in a tight burst (usually well under
   * 50ms between characters) and terminate with Enter. A gap longer than
   * this means a human is typing, not a scanner — the buffer resets.
   */
  interKeyTimeoutMs?: number;
}

interface UseBarcodeScanInputResult {
  isListening: boolean;
  /** Camera-based scanning is not wired up yet — see note below. */
  openCameraScanner: () => void;
  simulateManualEntry: (value: string) => void;
}

/**
 * Hardware-agnostic barcode scan input. Handheld HID scanners act as a very
 * fast keyboard, so we listen globally for Enter-terminated bursts of
 * characters and treat any tight-timed burst as a scan rather than typing.
 * Every consuming screen must also render its own manual-entry fallback
 * input wired to `simulateManualEntry` — scanners break or go missing, and
 * staff need a way to keep working (see plan §4).
 *
 * Camera scanning (`openCameraScanner`) is stubbed for now — wiring it up
 * needs a QR/barcode-reading library (e.g. html5-qrcode), which isn't a
 * dependency of this project yet, so we haven't silently added one.
 */
export function useBarcodeScanInput({
  onScan,
  enabled = true,
  minLength = 4,
  interKeyTimeoutMs = 80,
}: UseBarcodeScanInputOptions): UseBarcodeScanInputResult {
  const [isListening, setIsListening] = useState(false);
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setIsListening(false);
      return;
    }
    setIsListening(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isTypingField) return;

      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (gap > interKeyTimeoutMs) {
        bufferRef.current = "";
      }

      if (e.key === "Enter") {
        const value = bufferRef.current;
        bufferRef.current = "";
        if (value.length >= minLength) {
          onScan(value, "HID");
        }
        return;
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, minLength, interKeyTimeoutMs, onScan]);

  const openCameraScanner = useCallback(() => {
    toast("Camera scanning isn't set up yet — use a handheld scanner or type the code manually.");
  }, []);

  const simulateManualEntry = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length >= minLength) {
        onScan(trimmed, "MANUAL");
      }
    },
    [onScan, minLength],
  );

  return { isListening, openCameraScanner, simulateManualEntry };
}
