import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import {
  Camera,
  CameraOff,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Volume2,
  Upload,
  Copy,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowRight,
  Info
} from "lucide-react";
import { SCHOOL_INFO } from "../data/mockData";

interface ParsedUpiData {
  upiId?: string;
  name?: string;
  amount?: number;
  note?: string;
  rawText: string;
}

interface CameraQrScannerProps {
  onScanSuccess?: (parsedData: ParsedUpiData) => void;
  onClose: () => void;
  defaultStudentName?: string;
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  onScanSuccess,
  onClose,
  defaultStudentName = "Wisdom Student",
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scannedResult, setScannedResult] = useState<ParsedUpiData | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to parse standard upi://pay? parameters or plain strings
  const parseUpiUri = (rawText: string): ParsedUpiData => {
    try {
      if (rawText.startsWith("upi://pay")) {
        const urlParams = new URLSearchParams(rawText.split("?")[1] || "");
        const upiId = urlParams.get("pa") || undefined;
        const name = urlParams.get("pn") || undefined;
        const amountStr = urlParams.get("am");
        const note = urlParams.get("tn") || undefined;

        return {
          upiId: upiId ? decodeURIComponent(upiId) : SCHOOL_INFO.upiId,
          name: name ? decodeURIComponent(name) : SCHOOL_INFO.upiName,
          amount: amountStr ? parseFloat(amountStr) : undefined,
          note: note ? decodeURIComponent(note) : undefined,
          rawText,
        };
      }
    } catch (e) {
      console.warn("Could not parse as standard URLSearchParams", e);
    }

    // Fallback regex detection for UPI ID or plain numbers
    const upiMatch = rawText.match(/[\w.-]+@[\w.-]+/);
    const amountMatch = rawText.match(/(?:INR|Rs|₹|\b)(\d+(?:\.\d{1,2})?)/i);

    return {
      upiId: upiMatch ? upiMatch[0] : SCHOOL_INFO.upiId,
      name: SCHOOL_INFO.upiName,
      amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
      note: `Fee Payment for ${defaultStudentName}`,
      rawText,
    };
  };

  // Start video stream from device camera
  const startCamera = async () => {
    setErrorMessage(null);
    setIsScanning(true);
    setScannedResult(null);

    // Stop existing stream if any
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // required on iOS
        await videoRef.current.play();
        setHasPermission(true);
        requestAnimationFrame(scanQrFrame);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera hardware permission was denied. Please allow camera access in your browser settings or upload a QR image.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No camera hardware found on this device. You can upload a QR image or test with a simulated scan.");
      } else {
        setErrorMessage("Unable to access camera: " + (err.message || "Unknown error"));
      }
    }
  };

  // Stop video stream & cleanup
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Frame processing loop for QR detection
  const scanQrFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          // Successfully detected a QR Code!
          const parsed = parseUpiUri(code.data);
          setScannedResult(parsed);
          setIsScanning(false);
          stopCamera();

          // Audio beep simulation
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
          } catch (e) {
            // Audio context not allowed or muted
          }

          if (onScanSuccess) {
            onScanSuccess(parsed);
          }
          return;
        }
      }
    }

    if (isScanning) {
      animationFrameId.current = requestAnimationFrame(scanQrFrame);
    }
  };

  // Handle uploaded QR image file fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          const parsed = parseUpiUri(code.data);
          setScannedResult(parsed);
          setIsScanning(false);
          if (onScanSuccess) {
            onScanSuccess(parsed);
          }
        } else {
          alert("No QR Code detected in the uploaded image. Please try another clear photo.");
        }
      }
    };
    img.src = URL.createObjectURL(file);
  };

  // Simulated Test QR Trigger
  const handleSimulatedScan = () => {
    const testData = parseUpiUri(
      `upi://pay?pa=${SCHOOL_INFO.upiId}&pn=${encodeURIComponent(
        SCHOOL_INFO.upiName
      )}&am=12800&cu=INR&tn=${encodeURIComponent(`Wisdom Fee ${defaultStudentName}`)}`
    );
    setScannedResult(testData);
    setIsScanning(false);
    stopCamera();
    if (onScanSuccess) {
      onScanSuccess(testData);
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities = track.getCapabilities() as any;
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn } as any],
          });
          setTorchOn(!torchOn);
        } else {
          alert("Flashlight/Torch is not available on this camera.");
        }
      } catch (err) {
        console.warn("Torch error:", err);
      }
    }
  };

  const handleCopyUpi = () => {
    if (scannedResult?.upiId) {
      navigator.clipboard.writeText(scannedResult.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
        {/* Header HUD */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">UPI QR Camera Scanner</h3>
              <p className="text-[11px] text-slate-400">
                Wisdom School Hardware Scanner
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Camera Stream View */}
        <div className="relative bg-black min-h-[340px] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover max-h-[360px] ${
              facingMode === "user" ? "scale-x-[-1]" : ""
            }`}
          />

          {/* Scanner Overlay Frame */}
          {isScanning && !errorMessage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {/* Target Reticle Frame */}
              <div className="relative w-64 h-64 border-2 border-emerald-400/80 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.3)] flex items-center justify-center overflow-hidden">
                {/* Corner Markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />

                {/* Animated Laser Scanning Beam */}
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />
              </div>

              <span className="mt-4 text-xs font-bold text-emerald-300 bg-slate-900/80 px-3 py-1 rounded-full border border-emerald-500/40 backdrop-blur-sm">
                Position UPI QR Code inside frame
              </span>
            </div>
          )}

          {/* Error Banner / Camera Permission Request */}
          {errorMessage && (
            <div className="p-6 text-center space-y-4 max-w-xs">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
                <CameraOff className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {errorMessage}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={startCamera}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Retry Camera Hardware Access
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload QR Image Photo
                </button>
              </div>
            </div>
          )}

          {/* Camera Hardware Controls Bar */}
          {!scannedResult && !errorMessage && (
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10">
              <button
                onClick={() =>
                  setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
                }
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 backdrop-blur-md transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
                title="Switch Front/Rear Camera"
              >
                <RefreshCw className="w-4 h-4" />
                Flip Cam
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-amber-400 rounded-2xl border border-slate-700 backdrop-blur-md transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
                title="Upload Photo of QR"
              >
                <Upload className="w-4 h-4" />
                Pick Image
              </button>

              <button
                onClick={toggleTorch}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-yellow-300 rounded-2xl border border-slate-700 backdrop-blur-md transition cursor-pointer text-xs font-bold flex items-center gap-1.5"
                title="Toggle Torch"
              >
                <Zap className="w-4 h-4" />
                Flash
              </button>
            </div>
          )}
        </div>

        {/* Scanned Payload Result Card */}
        {scannedResult && (
          <div className="p-5 bg-slate-900 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">
                  QR Code Successfully Scanned
                </span>
                <p className="text-sm font-bold text-white">
                  {scannedResult.name || SCHOOL_INFO.upiName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">
                  Scanned Amount
                </span>
                <span className="text-emerald-400 font-black text-base">
                  ₹{(scannedResult.amount || 12800).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">
                  UPI Beneficiary ID
                </span>
                <span className="text-cyan-400 font-bold text-xs truncate block select-all">
                  {scannedResult.upiId || SCHOOL_INFO.upiId}
                </span>
              </div>
            </div>

            {scannedResult.note && (
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-[9px] uppercase text-slate-400 font-bold block">
                  Transaction Remarks
                </span>
                <p className="text-slate-200 font-semibold">{scannedResult.note}</p>
              </div>
            )}

            {/* Actions Bar */}
            <div className="space-y-2 pt-1">
              <a
                href={
                  scannedResult.rawText.startsWith("upi://")
                    ? scannedResult.rawText
                    : `upi://pay?pa=${scannedResult.upiId}&pn=${encodeURIComponent(
                        scannedResult.name || SCHOOL_INFO.upiName
                      )}&am=${scannedResult.amount || 12800}&cu=INR&tn=${encodeURIComponent(
                        scannedResult.note || "Fee Payment"
                      )}`
                }
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Pay ₹{(scannedResult.amount || 12800).toLocaleString("en-IN")} in UPI App
              </a>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={handleCopyUpi}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied UPI!" : "Copy UPI ID"}
                </button>

                <button
                  onClick={() => {
                    setScannedResult(null);
                    setIsScanning(true);
                    startCamera();
                  }}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Scan Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer HUD Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <button
            onClick={handleSimulatedScan}
            className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1 font-bold"
          >
            <Sparkles className="w-3 h-3" /> Test Simulated QR Scan
          </button>
          <span>HDFC Bank Encrypted</span>
        </div>
      </div>
    </div>
  );
};
