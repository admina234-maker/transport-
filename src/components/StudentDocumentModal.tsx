import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  Plus,
  Trash2,
  Download,
  Eye,
  FileText,
  Shield,
  Heart,
  CreditCard,
  FileCheck,
  CheckCircle2,
  Upload,
  RefreshCw,
  Info,
  Maximize2,
  AlertCircle,
  Sparkles,
  Phone
} from "lucide-react";
import { Student, StudentDocument, StudentDocumentCategory } from "../types";

interface StudentDocumentModalProps {
  student: Student;
  onClose: () => void;
  onSaveStudentDocuments: (studentId: string, documents: StudentDocument[]) => void;
}

export const StudentDocumentModal: React.FC<StudentDocumentModalProps> = ({
  student,
  onClose,
  onSaveStudentDocuments,
}) => {
  const [documents, setDocuments] = useState<StudentDocument[]>(student.documents || []);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // New doc form inputs
  const [docCategory, setDocCategory] = useState<StudentDocumentCategory>("Transport ID Card");
  const [docTitle, setDocTitle] = useState<string>("");
  const [docNotes, setDocNotes] = useState<string>("");

  // Zoom / View modal
  const [selectedDocForView, setSelectedDocForView] = useState<StudentDocument | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Set default document title when category changes
  useEffect(() => {
    if (!docTitle || docTitle.startsWith("Wisdom School")) {
      if (docCategory === "Transport ID Card") {
        setDocTitle(`Wisdom Transport ID Card - ${student.name}`);
      } else if (docCategory === "Medical Record / Fitness") {
        setDocTitle(`Medical Fitness Record - ${student.name}`);
      } else if (docCategory === "Vaccination / Allergy Form") {
        setDocTitle(`Vaccination & Allergy Form - ${student.name}`);
      } else if (docCategory === "Aadhaar / Birth Certificate") {
        setDocTitle(`Birth Certificate / Government ID - ${student.name}`);
      } else {
        setDocTitle(`Emergency Contact Record - ${student.name}`);
      }
    }
  }, [docCategory, student.name]);

  // Start Device Camera
  const startCamera = async () => {
    setCameraError(null);
    setIsCapturing(true);
    setCapturedPreview(null);

    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // essential for iOS
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please allow camera access in browser bar or upload an image file.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera device found. You can upload document image scan directly below.");
      } else {
        setCameraError(`Camera error: ${err.message || "Unable to start stream"}`);
      }
    }
  };

  // Stop camera feed
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Clean up camera on unmount or mode switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Switch between front/back camera
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    if (isCapturing) {
      startCamera();
    }
  };

  // Take Snapshot from video element using canvas
  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      setCapturedPreview(dataUrl);
      stopCamera();
      setIsCapturing(false);
    }
  };

  // File Upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedPreview(result);
        stopCamera();
        setIsCapturing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save new document to student list
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedPreview) return;

    const newDoc: StudentDocument = {
      id: `DOC-${Date.now()}`,
      title: docTitle.trim() || `${docCategory} - ${student.name}`,
      category: docCategory,
      dataUrl: capturedPreview,
      capturedAt: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      notes: docNotes.trim(),
    };

    const updatedDocs = [newDoc, ...documents];
    setDocuments(updatedDocs);
    onSaveStudentDocuments(student.id, updatedDocs);

    // Reset capture form
    setCapturedPreview(null);
    setDocNotes("");
  };

  // Delete document
  const handleDeleteDocument = (docId: string) => {
    if (confirm("Are you sure you want to delete this digital document record?")) {
      const updated = documents.filter((d) => d.id !== docId);
      setDocuments(updated);
      onSaveStudentDocuments(student.id, updated);
      if (selectedDocForView?.id === docId) {
        setSelectedDocForView(null);
      }
    }
  };

  // Helper icon per document category
  const getCategoryIcon = (category: StudentDocumentCategory) => {
    switch (category) {
      case "Transport ID Card":
        return <CreditCard className="w-4 h-4 text-amber-500" />;
      case "Medical Record / Fitness":
        return <Heart className="w-4 h-4 text-rose-500" />;
      case "Vaccination / Allergy Form":
        return <Shield className="w-4 h-4 text-emerald-500" />;
      case "Aadhaar / Birth Certificate":
        return <FileCheck className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Hidden Canvas for Camera Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Top Navigation Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Camera className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  Digital Records & Transport ID Vault
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/30 uppercase">
                  {documents.length} Docs Stored
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Student: <strong className="text-amber-400">{student.name}</strong> ({student.grade}, Roll: {student.rollNumber}) | Parent: {student.parentName}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* CAMERA CAPTURE & RECORD ADDITION SECTION */}
          <div className="bg-slate-950 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-extrabold text-white">Capture / Upload New Student Document</h4>
                  <p className="text-[11px] text-slate-400">
                    Snap student Transport ID Card photo or upload medical fitness certificates using device camera
                  </p>
                </div>
              </div>

              {!isCapturing && !capturedPreview && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Open Camera
                  </button>
                  <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 border border-slate-700 cursor-pointer">
                    <Upload className="w-4 h-4 text-amber-400" />
                    Upload File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Live Video Camera View */}
            {isCapturing && (
              <div className="space-y-3">
                <div className="relative w-full h-64 sm:h-80 bg-slate-900 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />

                  {/* Overlaid Camera Guidelines Frame */}
                  <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-amber-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between items-center text-[10px] text-amber-300 font-mono font-bold bg-slate-950/70 px-2 py-1 rounded">
                      <span>ALIGN TRANSPORT ID / RECORD HERE</span>
                      <span>1080p HD LIVE</span>
                    </div>
                    <div className="text-center text-[11px] text-slate-200 bg-slate-950/80 py-1 px-3 rounded-full mx-auto font-medium">
                      Hold document steady under good lighting
                    </div>
                  </div>

                  {/* Camera Controls Floating Overlay */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="p-2.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl border border-slate-700 transition"
                      title="Switch Camera (Front/Back)"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setIsCapturing(false);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleTakeSnapshot}
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-slate-950" />
                    SNAP PHOTO NOW
                  </button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {cameraError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{cameraError}</span>
                </div>
                <label className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg cursor-pointer whitespace-nowrap">
                  Upload Image
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            {/* Captured Image Form */}
            {capturedPreview && (
              <form onSubmit={handleAddDocument} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Photo Thumbnail Preview */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 h-44 flex items-center justify-center">
                    <img
                      src={capturedPreview}
                      alt="Captured Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedPreview(null);
                        startCamera();
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition"
                      title="Retake Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded">
                      SNAPSHOT READY
                    </div>
                  </div>

                  {/* Meta Form Details */}
                  <div className="sm:col-span-2 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">Document Category</label>
                        <select
                          value={docCategory}
                          onChange={(e) => setDocCategory(e.target.value as StudentDocumentCategory)}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-bold"
                        >
                          <option value="Transport ID Card">💳 Transport ID Card</option>
                          <option value="Medical Record / Fitness">🩺 Medical Record / Fitness</option>
                          <option value="Vaccination / Allergy Form">🛡️ Vaccination / Allergy Form</option>
                          <option value="Aadhaar / Birth Certificate">📄 Aadhaar / Birth Certificate</option>
                          <option value="Emergency Form">🚨 Emergency Form</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-300 block mb-1">Document Title</label>
                        <input
                          type="text"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          placeholder="e.g. 2026 Van Pass ID Card Front"
                          required
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Notes / Medical Remarks (Optional)</label>
                      <input
                        type="text"
                        value={docNotes}
                        onChange={(e) => setDocNotes(e.target.value)}
                        placeholder="e.g. Blood Group O+ve | Asthma inhaler kept with van driver | Verified by Transport Admin"
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-2.5 text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setCapturedPreview(null)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Save Record to Vault
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* STORED DOCUMENTS LIST / GALLERY */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                Captured Student Documents ({documents.length})
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                Click any record to inspect HD view or download copy
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <Camera className="w-10 h-10 text-slate-400 mx-auto animate-bounce" />
                <h5 className="font-bold text-slate-700 text-sm">No Digital Documents Captured Yet</h5>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click <strong>Open Camera</strong> above to snap student transport ID cards, blood group medical reports, or emergency allergy forms using your device camera.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Document Thumbnail Preview */}
                      <div
                        onClick={() => setSelectedDocForView(doc)}
                        className="relative h-40 bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center group-hover:opacity-95 transition"
                      >
                        <img
                          src={doc.dataUrl}
                          alt={doc.title}
                          className="w-full h-full object-cover transition transform group-hover:scale-105 duration-300"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur-md rounded-lg text-[10px] font-black text-amber-400 flex items-center gap-1 border border-slate-800">
                          {getCategoryIcon(doc.category)}
                          {doc.category}
                        </div>
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <span className="p-2 bg-white text-slate-900 rounded-full font-bold text-xs shadow-lg flex items-center gap-1">
                            <Maximize2 className="w-4 h-4 text-emerald-600" /> Inspect HD
                          </span>
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="p-3.5 space-y-1.5">
                        <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1">
                          {doc.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Captured: {doc.capturedAt}
                        </p>

                        {doc.notes && (
                          <p className="text-xs text-slate-700 bg-amber-50 p-2 rounded-xl border border-amber-200/60 font-medium">
                            📌 {doc.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDocForView(doc)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>

                      <div className="flex items-center gap-1">
                        <a
                          href={doc.dataUrl}
                          download={`${student.name.replace(/\s+/g, "_")}_${doc.category.replace(/\s+/g, "_")}.jpg`}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition"
                          title="Download Copy"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Wisdom School Vault: Document scans encrypted locally for child safety</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
          >
            Close Vault
          </button>
        </div>
      </div>

      {/* FULL HD IMAGE ZOOM MODAL */}
      {selectedDocForView && (
        <div className="fixed inset-0 bg-slate-950/90 z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-2xl max-w-3xl w-full overflow-hidden border border-slate-800 shadow-2xl space-y-0">
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div>
                <h4 className="font-extrabold text-amber-400 text-sm sm:text-base">
                  {selectedDocForView.title}
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedDocForView.category} | Captured: {selectedDocForView.capturedAt}
                </p>
              </div>
              <button
                onClick={() => setSelectedDocForView(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={selectedDocForView.dataUrl}
                alt={selectedDocForView.title}
                className="max-h-[60vh] w-auto object-contain rounded-xl border border-slate-800 shadow-lg"
              />
            </div>

            {selectedDocForView.notes && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs text-amber-200 font-medium">
                <strong>Notes / Medical Record Remarks:</strong> {selectedDocForView.notes}
              </div>
            )}

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Student: {student.name} ({student.grade})
              </span>
              <a
                href={selectedDocForView.dataUrl}
                download={`${student.name}_${selectedDocForView.title}.jpg`}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download Original Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
