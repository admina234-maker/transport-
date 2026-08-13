import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { QRCodeSVG } from "qrcode.react";
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  MessageSquare,
  ShieldCheck,
  Star,
  Bus,
  CheckCircle2,
  X,
  AlertTriangle,
  QrCode,
  Camera,
  CameraOff,
  RefreshCw,
  Upload,
  Volume2,
  UserCheck,
  Printer,
  Download,
  Clock,
  Zap,
  Check,
  Sparkles,
  Filter,
  CheckCircle
} from "lucide-react";
import { Driver, Vehicle, Student, AttendanceStatus } from "../types";
import { INITIAL_STUDENTS, SCHOOL_INFO } from "../data/mockData";
import { printFormattedContent } from "../utils/printHelper";

interface DriverManagementProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  students?: Student[];
  onUpdateAttendance?: (studentId: string, status: AttendanceStatus) => void;
  onAddDriver: (driver: Driver) => void;
  onEditDriver: (driver: Driver) => void;
  onDeleteDriver: (driverId: string) => void;
  onAddVehicle?: (vehicle: Vehicle) => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

export const DriverManagement: React.FC<DriverManagementProps> = ({
  drivers,
  vehicles,
  students,
  onUpdateAttendance,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  // Keep local student state synchronized with props
  const [studentList, setStudentList] = useState<Student[]>(students || INITIAL_STUDENTS);

  useEffect(() => {
    if (students && students.length > 0) {
      setStudentList(students);
    }
  }, [students]);

  // Modal states for Driver CRUD
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null);

  // QR Roster & Scanner Modal state
  const [scanningDriver, setScanningDriver] = useState<Driver | null>(null);
  const [tripType, setTripType] = useState<"Morning Pickup" | "Afternoon Return">("Morning Pickup");
  const [rosterFilter, setRosterFilter] = useState<"All" | "Boarded" | "Pending">("All");

  // Camera & QR Scanner refs and states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [manualCodeInput, setManualCodeInput] = useState<string>("");
  const [scanSuccessToast, setScanSuccessToast] = useState<string | null>(null);
  const [scanErrorToast, setScanErrorToast] = useState<string | null>(null);
  const [lastBoardedStudent, setLastBoardedStudent] = useState<Student | null>(null);

  // Student QR ID Badge Modal State
  const [viewingBadgeStudent, setViewingBadgeStudent] = useState<Student | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State for Add / Edit Driver
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    licenseNumber: "",
    experienceYears: 5,
    rating: 4.8,
    status: "Active" as "Active" | "On Break" | "Off Duty",
    assignedVehicleId: vehicles[0]?.id || "",
  });

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "All" || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Audio BEEP for successful QR scan
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 pitch
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {
      console.warn("Audio Context beep error:", e);
    }
  };

  // Start Camera for Live QR Scanning
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        requestAnimationFrame(processQrFrame);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setIsCameraActive(false);
      setCameraError(
        "Camera hardware inaccessible or permission denied. You can use image upload or quick scan buttons below."
      );
    }
  };

  // Stop Camera stream
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Process live video frame with jsQR
  const processQrFrame = () => {
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
          handleProcessScannedCode(code.data);
          stopCamera();
          return;
        }
      }
    }

    if (streamRef.current && isCameraActive) {
      animFrameRef.current = requestAnimationFrame(processQrFrame);
    }
  };

  // Process uploaded QR code image
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            handleProcessScannedCode(code.data);
          } else {
            setScanErrorToast("Could not detect a valid QR code in the uploaded image. Please try another image.");
            setTimeout(() => setScanErrorToast(null), 4000);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Core handler: process raw scanned code string & update student boarding
  const handleProcessScannedCode = (rawCode: string) => {
    if (!rawCode || !rawCode.trim()) return;

    const query = rawCode.trim().toLowerCase();

    // Parse JSON if encoded as object
    let parsedQuery = query;
    try {
      const jsonObj = JSON.parse(rawCode);
      if (jsonObj.id) parsedQuery = jsonObj.id.toLowerCase();
      else if (jsonObj.rollNumber) parsedQuery = jsonObj.rollNumber.toLowerCase();
      else if (jsonObj.studentId) parsedQuery = jsonObj.studentId.toLowerCase();
    } catch (e) {
      // plain text string
    }

    // Match student in overall list
    const matchedStudent = studentList.find(
      (s) =>
        s.id.toLowerCase() === parsedQuery ||
        s.rollNumber.toLowerCase() === parsedQuery ||
        (s.rfidTagId && s.rfidTagId.toLowerCase() === parsedQuery) ||
        s.name.toLowerCase() === parsedQuery ||
        s.name.toLowerCase().includes(parsedQuery)
    );

    if (matchedStudent) {
      playScanBeep();

      const newStatus: AttendanceStatus =
        tripType === "Morning Pickup" ? "Boarded Pickup" : "Boarded Return";
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      // Update local student roster
      setStudentList((prev) =>
        prev.map((st) =>
          st.id === matchedStudent.id
            ? { ...st, attendanceStatus: newStatus, lastStatusTime: timeStr }
            : st
        )
      );

      if (onUpdateAttendance) {
        onUpdateAttendance(matchedStudent.id, newStatus);
      }

      setLastBoardedStudent({ ...matchedStudent, attendanceStatus: newStatus, lastStatusTime: timeStr });
      setScanSuccessToast(
        `✓ BOARDED CONFIRMED: ${matchedStudent.name} (${matchedStudent.grade}) marked as ${newStatus} at ${timeStr}. SMS sent to parent (${matchedStudent.parentPhone}).`
      );
      setScanErrorToast(null);
      setManualCodeInput("");

      setTimeout(() => setScanSuccessToast(null), 5000);
    } else {
      setScanErrorToast(`⚠️ No student found matching QR code "${rawCode}". Check student ID or roster.`);
      setTimeout(() => setScanErrorToast(null), 4500);
    }
  };

  // Toggle Manual Student Attendance
  const handleManualToggleBoarding = (studentId: string, currentStatus: AttendanceStatus) => {
    const isAlreadyBoarded =
      currentStatus === "Boarded Pickup" ||
      currentStatus === "Boarded Return" ||
      currentStatus === "Dropped at School" ||
      currentStatus === "Dropped Home";

    const nextStatus: AttendanceStatus = isAlreadyBoarded
      ? "Absent"
      : tripType === "Morning Pickup"
      ? "Boarded Pickup"
      : "Boarded Return";

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setStudentList((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, attendanceStatus: nextStatus, lastStatusTime: timeStr } : s))
    );

    if (onUpdateAttendance) {
      onUpdateAttendance(studentId, nextStatus);
    }

    playScanBeep();
  };

  // Open QR Scanner for specific driver
  const handleOpenRosterScanner = (driver: Driver) => {
    setScanningDriver(driver);
    setScanSuccessToast(null);
    setScanErrorToast(null);
    setLastBoardedStudent(null);
  };

  // Close QR Scanner Modal & cleanup
  const handleCloseRosterScanner = () => {
    stopCamera();
    setScanningDriver(null);
  };

  // Driver CRUD Open Add
  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      phone: "",
      licenseNumber: "TN-25-202400" + Math.floor(100 + Math.random() * 900),
      experienceYears: 6,
      rating: 4.9,
      status: "Active",
      assignedVehicleId: vehicles[0]?.id || "",
    });
    setShowAddModal(true);
  };

  // Driver CRUD Open Edit
  const handleOpenEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      experienceYears: driver.experienceYears,
      rating: driver.rating,
      status: driver.status,
      assignedVehicleId: driver.assignedVehicleId,
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const newDriver: Driver = {
      id: "DRV-" + Math.floor(10 + Math.random() * 90),
      name: formData.name,
      phone: formData.phone,
      licenseNumber: formData.licenseNumber || "TN-25-202400999",
      experienceYears: formData.experienceYears,
      rating: formData.rating,
      status: formData.status,
      assignedVehicleId: formData.assignedVehicleId,
    };

    onAddDriver(newDriver);
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver || !formData.name || !formData.phone) return;

    const updatedDriver: Driver = {
      ...editingDriver,
      name: formData.name,
      phone: formData.phone,
      licenseNumber: formData.licenseNumber,
      experienceYears: formData.experienceYears,
      rating: formData.rating,
      status: formData.status,
      assignedVehicleId: formData.assignedVehicleId,
    };

    onEditDriver(updatedDriver);
    setEditingDriver(null);
  };

  const handleConfirmDelete = () => {
    if (deletingDriverId) {
      onDeleteDriver(deletingDriverId);
      setDeletingDriverId(null);
    }
  };

  // Print Student QR Badge
  const handlePrintStudentBadge = (student: Student) => {
    const assignedVehicle = vehicles.find((v) => v.id === student.assignedVehicleId);
    const html = `
      <div style="max-width: 400px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 16px; padding: 24px; text-align: center; font-family: sans-serif; background: #ffffff;">
        <div style="font-size: 10px; font-weight: 900; letter-spacing: 1px; color: #d97706; text-transform: uppercase;">
          ${SCHOOL_INFO.name}
        </div>
        <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px;">
          STUDENT TRANSPORT QR ID BADGE
        </div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 16px;">
          Session 2025-2026 • Official Bus Pass
        </div>

        <div style="display: flex; justify-content: center; margin: 16px 0;">
          <div style="padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; display: inline-block;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(student.id)}" alt="Student QR Code" style="width: 160px; height: 160px;" />
          </div>
        </div>

        <div style="font-size: 20px; font-weight: 900; color: #0f172a;">${student.name}</div>
        <div style="font-size: 12px; font-weight: 700; color: #2563eb; margin-top: 2px;">Class / Grade: ${student.grade}</div>
        <div style="font-size: 11px; font-family: monospace; font-weight: 700; color: #475569; margin-top: 2px;">
          ID: ${student.id} | Roll: ${student.rollNumber}
        </div>

        <div style="margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 10px; font-size: 11px; text-align: left; line-height: 1.5;">
          <div><strong>Assigned Van:</strong> ${assignedVehicle ? assignedVehicle.registrationNumber : 'School Transport'}</div>
          <div><strong>Pickup Stop:</strong> ${student.pickupStopName}</div>
          <div><strong>Parent Contact:</strong> +91 ${student.parentPhone}</div>
          <div><strong>Emergency Helpline:</strong> +91 ${SCHOOL_INFO.contactPhone}</div>
        </div>

        <div style="margin-top: 16px; font-size: 9px; color: #94a3b8; border-top: 1px border-slate-200; padding-top: 8px;">
          Drivers scan this QR badge upon student boarding to send automated SMS to parents.
        </div>
      </div>
    `;
    printFormattedContent(`Student QR Badge - ${student.name}`, html);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-600 text-white font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Driver Roster & Safety Portal
            </span>
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" />
              Daily Roster QR Scanner
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">Van & Bus Driver Management</h2>
          <p className="text-xs text-slate-400">
            Maintain authorized drivers, assigned vehicles, safety ratings, and launch the real-time student QR boarding scanner.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {drivers.length > 0 && (
            <button
              onClick={() => handleOpenRosterScanner(drivers[0])}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-slate-950" />
              Launch Roster QR Scanner
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add New Driver
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs sm:text-sm">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search driver by name, phone number, or license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 font-semibold text-slate-800 cursor-pointer"
          >
            <option value="All">All Statuses (Active / On Break / Off Duty)</option>
            <option value="Active">Active Duty Only</option>
            <option value="On Break">On Break</option>
            <option value="Off Duty">Off Duty</option>
          </select>
        </div>
      </div>

      {/* Drivers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDrivers.map((driver) => {
          const assignedVehicle = vehicles.find((v) => v.id === driver.assignedVehicleId) || vehicles[0];
          const vehicleStudents = studentList.filter((s) => s.assignedVehicleId === driver.assignedVehicleId);
          const boardedCount = vehicleStudents.filter(
            (s) =>
              s.attendanceStatus === "Boarded Pickup" ||
              s.attendanceStatus === "Boarded Return" ||
              s.attendanceStatus === "Dropped at School" ||
              s.attendanceStatus === "Dropped Home"
          ).length;

          return (
            <div
              key={driver.id}
              className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200 space-y-4 hover:border-amber-400 transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header card info */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-yellow-400 font-black flex items-center justify-center text-lg border border-slate-700 shadow">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{driver.name}</h4>
                      <span className="text-xs text-slate-500 font-mono font-bold block">
                        ID: {driver.id}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                      driver.status === "Active"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : driver.status === "On Break"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-slate-100 text-slate-600 border border-slate-300"
                    }`}
                  >
                    {driver.status}
                  </span>
                </div>

                {/* Details List */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Assigned Vehicle</span>
                    <span className="font-extrabold text-blue-900 flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-blue-600" />
                      {assignedVehicle ? assignedVehicle.registrationNumber : "Unassigned"}
                    </span>
                  </div>

                  {/* Student Roster Boarding Badge */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-amber-900 text-[10px] font-bold uppercase block">Today's Roster Progress</span>
                      <span className="font-extrabold text-slate-900 font-mono text-xs">
                        {boardedCount} / {vehicleStudents.length} Kids Boarded
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-white px-2 py-1 rounded-lg border border-amber-300 shadow-sm">
                      {vehicleStudents.length > 0 ? Math.round((boardedCount / vehicleStudents.length) * 100) : 0}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-500 font-bold uppercase text-[10px] block">Driving License</span>
                      <strong className="text-slate-900 font-mono text-[11px] block truncate">
                        {driver.licenseNumber}
                      </strong>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-500 font-bold uppercase text-[10px] block">Experience</span>
                      <strong className="text-slate-900 block">
                        {driver.experienceYears} Years
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-yellow-50 p-2.5 rounded-xl border border-yellow-200">
                    <span className="text-yellow-900 font-bold text-[11px]">Safety Rating:</span>
                    <span className="font-extrabold text-slate-950 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                      {driver.rating} / 5.0
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => handleOpenRosterScanner(driver)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-black py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  Scan Student QR Roster
                </button>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${driver.phone}`}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      title="Call Driver"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>

                    <a
                      href={`https://wa.me/91${driver.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      title="WhatsApp Driver"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(driver)}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Edit Driver Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    <button
                      onClick={() => setDeletingDriverId(driver.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Delete Driver"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DRIVER QR SCANNER & ROSTER MODAL */}
      {scanningDriver && (() => {
        const assignedVehicle = vehicles.find((v) => v.id === scanningDriver.assignedVehicleId);
        const driverRoster = studentList.filter(
          (s) => s.assignedVehicleId === scanningDriver.assignedVehicleId
        );

        const filteredRoster = driverRoster.filter((st) => {
          const isBoarded =
            st.attendanceStatus === "Boarded Pickup" ||
            st.attendanceStatus === "Boarded Return" ||
            st.attendanceStatus === "Dropped at School" ||
            st.attendanceStatus === "Dropped Home";

          if (rosterFilter === "Boarded") return isBoarded;
          if (rosterFilter === "Pending") return !isBoarded;
          return true;
        });

        const boardedCount = driverRoster.filter(
          (st) =>
            st.attendanceStatus === "Boarded Pickup" ||
            st.attendanceStatus === "Boarded Return" ||
            st.attendanceStatus === "Dropped at School" ||
            st.attendanceStatus === "Dropped Home"
        ).length;
        const totalCount = driverRoster.length;
        const progressPercent = totalCount > 0 ? Math.round((boardedCount / totalCount) * 100) : 0;

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 space-y-6 shadow-2xl border border-slate-200 text-slate-900 my-6">
              
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                        Driver QR Boarding Scanner
                      </span>
                      <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        Driver: {scanningDriver.name}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-lg sm:text-xl mt-0.5">
                      Student Boarding Roster & Scanner
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Assigned Van: <strong className="text-slate-800">{assignedVehicle?.registrationNumber || 'Unassigned'}</strong> • {assignedVehicle?.routeName || 'Transport Route'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCloseRosterScanner}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Top Control Bar: Trip Mode & Progress Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {/* Trip Mode Switch */}
                <div className="md:col-span-5 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Select Active Trip Session</label>
                  <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button
                      onClick={() => setTripType("Morning Pickup")}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        tripType === "Morning Pickup"
                          ? "bg-amber-500 text-slate-950 shadow"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Morning Pickup
                    </button>

                    <button
                      onClick={() => setTripType("Afternoon Return")}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        tripType === "Afternoon Return"
                          ? "bg-blue-600 text-white shadow"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Bus className="w-3.5 h-3.5" />
                      Afternoon Return
                    </button>
                  </div>
                </div>

                {/* Progress Bar Gauge */}
                <div className="md:col-span-7 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      Boarding Status Summary
                    </span>
                    <span className="font-mono text-slate-900 bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-300">
                      {boardedCount} / {totalCount} Students Boarded ({progressPercent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Toast Messages */}
              {scanSuccessToast && (
                <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg border border-emerald-500 flex items-center justify-between text-xs font-extrabold animate-bounce-short">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                    <span>{scanSuccessToast}</span>
                  </div>
                  <button onClick={() => setScanSuccessToast(null)} className="text-emerald-100 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {scanErrorToast && (
                <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg border border-rose-500 flex items-center justify-between text-xs font-extrabold">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                    <span>{scanErrorToast}</span>
                  </div>
                  <button onClick={() => setScanErrorToast(null)} className="text-rose-100 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Scanner Grid: Live Camera Stream + Manual Barcode/Code Input */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (5 cols): Camera / Image Scanner Widget */}
                <div className="lg:col-span-5 bg-slate-950 text-white p-4 rounded-2xl space-y-4 shadow-xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                      <Camera className="w-4 h-4" />
                      Live Optical QR Scanner
                    </span>
                    {isCameraActive && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold animate-pulse">
                        ● CAMERA ONLINE
                      </span>
                    )}
                  </div>

                  {/* Camera Video / Canvas Area */}
                  <div className="relative bg-slate-900 rounded-xl overflow-hidden min-h-[200px] flex items-center justify-center border border-slate-800">
                    {isCameraActive ? (
                      <>
                        <video ref={videoRef} className="w-full h-48 object-cover rounded-xl" />
                        <canvas ref={canvasRef} className="hidden" />
                        {/* Target Reticle Overlay */}
                        <div className="absolute inset-0 border-2 border-dashed border-amber-400/80 m-6 rounded-2xl pointer-events-none flex items-center justify-center">
                          <div className="w-full h-0.5 bg-amber-400/60 animate-pulse" />
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center space-y-3">
                        <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 font-medium max-w-xs">
                          {cameraError || "Camera feed paused. Click below to activate device camera or test scan buttons."}
                        </p>
                        <button
                          onClick={startCamera}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow flex items-center gap-2 mx-auto cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          Start Live Camera Feed
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    {isCameraActive ? (
                      <button
                        onClick={stopCamera}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition flex items-center gap-1 cursor-pointer"
                      >
                        <CameraOff className="w-3.5 h-3.5" />
                        Stop Camera
                      </button>
                    ) : (
                      <button
                        onClick={startCamera}
                        className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-3 py-1.5 rounded-xl text-[11px] transition flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Start Camera
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
                        if (isCameraActive) startCamera();
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-xl text-[11px] transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Flip Camera
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold px-3 py-1.5 rounded-xl text-[11px] transition flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload QR
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Manual Barcode / Student ID Input Box */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 block">
                      Manual Barcode / USB Scanner Input
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. STU-1001 or WIS-2025-014"
                        value={manualCodeInput}
                        onChange={(e) => setManualCodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleProcessScannedCode(manualCodeInput);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        onClick={() => handleProcessScannedCode(manualCodeInput)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                      >
                        Scan
                      </button>
                    </div>
                  </div>

                  {/* Quick Test Demo Scan Buttons */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] uppercase font-extrabold text-amber-400 block flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Quick Demo Test Buttons:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {driverRoster.slice(0, 4).map((st) => (
                        <button
                          key={st.id}
                          onClick={() => handleProcessScannedCode(st.id)}
                          className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-mono text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer border border-slate-700"
                        >
                          ⚡ {st.name.split(" ")[0]} ({st.id})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column (7 cols): Assigned Student Roster Table */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Driver Student Roster ({driverRoster.length} Kids)
                    </h4>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRosterFilter("All")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          rosterFilter === "All"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        All ({driverRoster.length})
                      </button>
                      <button
                        onClick={() => setRosterFilter("Boarded")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          rosterFilter === "Boarded"
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Boarded ({boardedCount})
                      </button>
                      <button
                        onClick={() => setRosterFilter("Pending")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          rosterFilter === "Pending"
                            ? "bg-amber-500 text-slate-950 font-black"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Pending ({totalCount - boardedCount})
                      </button>
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                    {filteredRoster.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                        No students match the selected filter.
                      </div>
                    ) : (
                      filteredRoster.map((st) => {
                        const isBoarded =
                          st.attendanceStatus === "Boarded Pickup" ||
                          st.attendanceStatus === "Boarded Return" ||
                          st.attendanceStatus === "Dropped at School" ||
                          st.attendanceStatus === "Dropped Home";

                        const isJustScanned = lastBoardedStudent?.id === st.id;

                        return (
                          <div
                            key={st.id}
                            className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                              isJustScanned
                                ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400 shadow"
                                : isBoarded
                                ? "bg-emerald-50/50 border-emerald-200"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shadow-sm ${
                                  isBoarded
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {isBoarded ? <Check className="w-5 h-5" /> : st.name.charAt(0)}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{st.name}</span>
                                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                                    {st.grade}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                  Stop: <strong className="text-slate-800">{st.pickupStopName}</strong> • Phone: +91 {st.parentPhone}
                                </div>
                                <div className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">
                                  ID: {st.id} | Roll: {st.rollNumber}
                                </div>
                              </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center gap-2">
                              {/* QR Badge Button */}
                              <button
                                onClick={() => setViewingBadgeStudent(st)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="View / Print Student QR Badge"
                              >
                                <QrCode className="w-3.5 h-3.5 text-amber-600" />
                                <span className="hidden sm:inline">Badge</span>
                              </button>

                              {/* Manual Board Toggle Button */}
                              <button
                                onClick={() => handleManualToggleBoarding(st.id, st.attendanceStatus)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-sm ${
                                  isBoarded
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                                }`}
                              >
                                {isBoarded ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Boarded</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Board Student</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Batch Completion Action Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 font-medium">
                      All boardings auto-trigger SMS/WhatsApp parent alerts.
                    </span>

                    <button
                      onClick={() => {
                        setScanSuccessToast(
                          `✓ Roster Batch Completed! All ${boardedCount} boarded students verified. SMS summary broadcasted to parents.`
                        );
                        setTimeout(() => setScanSuccessToast(null), 5000);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition shadow cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Complete Roster Batch
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* STUDENT QR BADGE MODAL */}
      {viewingBadgeStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-200 text-center text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <QrCode className="w-4 h-4" /> Student Transport Pass
              </span>
              <button
                onClick={() => setViewingBadgeStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
                <QRCodeSVG value={viewingBadgeStudent.id} size={160} level="H" />
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">{viewingBadgeStudent.name}</h3>
                <p className="text-xs text-blue-600 font-bold">{viewingBadgeStudent.grade} • Roll: {viewingBadgeStudent.rollNumber}</p>
                <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">ID: {viewingBadgeStudent.id}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1">
                <div><span className="text-slate-500 font-bold">Bus Stop:</span> <strong>{viewingBadgeStudent.pickupStopName}</strong></div>
                <div><span className="text-slate-500 font-bold">Route:</span> {viewingBadgeStudent.assignedRouteName}</div>
                <div><span className="text-slate-500 font-bold">Parent Phone:</span> +91 {viewingBadgeStudent.parentPhone}</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingBadgeStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => handlePrintStudentBadge(viewingBadgeStudent)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Official Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD DRIVER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Add New Driver to Roster</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Driver Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mr. S. Ramanan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9840012345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driving License Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TN-25-202000841"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duty Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="On Break">On Break</option>
                    <option value="Off Duty">Off Duty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Fleet Vehicle</label>
                <select
                  value={formData.assignedVehicleId}
                  onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.type}) - {v.routeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-sm transition shadow-lg cursor-pointer"
                >
                  Save Driver to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DRIVER MODAL */}
      {editingDriver && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Edit Driver: {editingDriver.name}</h3>
              <button onClick={() => setEditingDriver(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Driver Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driving License Number</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duty Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="On Break">On Break</option>
                    <option value="Off Duty">Off Duty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Fleet Vehicle</label>
                <select
                  value={formData.assignedVehicleId}
                  onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 cursor-pointer"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.type}) - {v.routeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-xl text-sm transition shadow-lg cursor-pointer"
                >
                  Update Driver Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDriverId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Confirm Delete Driver?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this driver from the school transport roster?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingDriverId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow cursor-pointer"
              >
                Delete Driver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
