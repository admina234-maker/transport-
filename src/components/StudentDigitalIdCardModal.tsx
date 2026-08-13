import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  Printer,
  Download,
  Share2,
  Camera,
  Upload,
  CheckCircle2,
  Bus,
  MapPin,
  Phone,
  ShieldCheck,
  CreditCard,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  Layers,
  RotateCcw,
  Check,
  QrCode,
  User,
  Filter,
  FileSpreadsheet
} from "lucide-react";
import { Student, Vehicle, StudentDocument } from "../types";
import { SCHOOL_INFO } from "../data/mockData";
import { printFormattedContent } from "../utils/printHelper";
import { BulkWhatsAppDispatchModal } from "./BulkWhatsAppDispatchModal";

interface StudentDigitalIdCardModalProps {
  student: Student | null;
  students: Student[];
  vehicles: Vehicle[];
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent?: (student: Student) => void;
  onUpdateStudentPhoto?: (studentId: string, photoDataUrl: string) => void;
}

export const StudentDigitalIdCardModal: React.FC<StudentDigitalIdCardModalProps> = ({
  student: initialStudent,
  students,
  vehicles,
  isOpen,
  onClose,
  onSelectStudent,
  onUpdateStudentPhoto,
}) => {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(initialStudent || students[0] || null);
  const [viewMode, setViewMode] = useState<"single" | "bulk">("single");
  const [cardSide, setCardSide] = useState<"front" | "back" | "both">("both");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("All");
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>("All");
  const [cardTheme, setCardTheme] = useState<"gold" | "emerald" | "navy">("gold");
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [selectedBulkStudentIds, setSelectedBulkStudentIds] = useState<Set<string>>(
    new Set(students.map((s) => s.id))
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state if initialStudent or students list changes
  React.useEffect(() => {
    if (initialStudent) {
      setCurrentStudent(initialStudent);
      setCustomPhotoUrl(null);
    }
    if (students.length > 0) {
      setSelectedBulkStudentIds(new Set(students.map((s) => s.id)));
    }
  }, [initialStudent, students]);

  if (!isOpen || !currentStudent) return null;

  const activeVehicle =
    vehicles.find((v) => v.id === currentStudent.assignedVehicleId) ||
    vehicles.find((v) => v.routeName === currentStudent.assignedRouteName) ||
    vehicles[0];

  // Derive photo: custom uploaded photo state > document with "Transport ID Card" > default avatar
  const transportDoc = currentStudent.documents?.find((d) => d.category === "Transport ID Card");
  const studentPhotoSrc = customPhotoUrl || transportDoc?.dataUrl || null;

  // Filtered students for bulk print grid
  const filteredBulkStudents = students.filter((s) => {
    const matchesGrade = selectedGradeFilter === "All" || s.grade === selectedGradeFilter;
    const matchesRoute = selectedRouteFilter === "All" || s.assignedRouteName === selectedRouteFilter;
    return matchesGrade && matchesRoute;
  });

  const selectedForBulkCount = Array.from(selectedBulkStudentIds).filter((id) =>
    filteredBulkStudents.some((s) => s.id === id)
  ).length;

  const toggleSelectAllBulk = () => {
    if (selectedForBulkCount === filteredBulkStudents.length) {
      // Unselect all filtered
      const updated = new Set(selectedBulkStudentIds);
      filteredBulkStudents.forEach((s) => updated.delete(s.id));
      setSelectedBulkStudentIds(updated);
    } else {
      // Select all filtered
      const updated = new Set(selectedBulkStudentIds);
      filteredBulkStudents.forEach((s) => updated.add(s.id));
      setSelectedBulkStudentIds(updated);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const updated = new Set(selectedBulkStudentIds);
    if (updated.has(studentId)) {
      updated.delete(studentId);
    } else {
      updated.add(studentId);
    }
    setSelectedBulkStudentIds(updated);
  };

  const selectedStudentsForWhatsApp = students.filter((s) => selectedBulkStudentIds.has(s.id));

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        setCustomPhotoUrl(dataUrl);
        if (onUpdateStudentPhoto && currentStudent) {
          onUpdateStudentPhoto(currentStudent.id, dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // WhatsApp Share ID Card
  const handleShareWhatsApp = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://wisdomschool.edu.in";
    const portalUrl = `${baseUrl}/?studentId=${currentStudent.id}&tab=parent`;
    
    const text = `🪪 *Wisdom Primary School Digital Transport ID Card*\n\nStudent: *${currentStudent.name}* (Roll: *${currentStudent.rollNumber}*)\nGrade: ${currentStudent.grade}\nRoute: 🚌 ${currentStudent.assignedRouteName}\nVehicle: ${activeVehicle?.registrationNumber || "TN-21-AZ-4921"}\nPickup Stop: 🚏 ${currentStudent.pickupStopName} (${currentStudent.distanceKm} km)\nRFID Tag: ${currentStudent.rfidTagId}\n\nParent Contact: ${currentStudent.parentName} (${currentStudent.parentPhone})\n\n🔗 Online Transport Portal: ${portalUrl}`;

    const cleanPhone = currentStudent.parentPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Printable HTML Generator for Single ID Card
  const handlePrintSingleCard = () => {
    const cardHtml = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 90vh; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="display: flex; gap: 30px; flex-wrap: wrap; justify-content: center;">
          ${renderCardFrontHTML(currentStudent, activeVehicle, studentPhotoSrc)}
          ${renderCardBackHTML(currentStudent, activeVehicle)}
        </div>
      </div>
    `;
    printFormattedContent(`Student_ID_Card_${currentStudent.rollNumber}`, cardHtml);
  };

  // Printable HTML Generator for Bulk Roster ID Cards (A4 Grid)
  const handlePrintBulkCards = () => {
    const studentsToPrint = filteredBulkStudents.filter((s) => selectedBulkStudentIds.has(s.id));
    if (studentsToPrint.length === 0) {
      alert("Please select at least one student card to print.");
      return;
    }

    const cardsGrid = studentsToPrint
      .map((s) => {
        const veh = vehicles.find((v) => v.id === s.assignedVehicleId) || vehicles[0];
        const doc = s.documents?.find((d) => d.category === "Transport ID Card");
        const photo = doc?.dataUrl || null;
        return `
          <div style="page-break-inside: avoid; margin-bottom: 20px;">
            <div style="display: flex; gap: 15px; flex-wrap: nowrap;">
              ${renderCardFrontHTML(s, veh, photo)}
              ${renderCardBackHTML(s, veh)}
            </div>
          </div>
        `;
      })
      .join("");

    const bulkHtml = `
      <div style="padding: 10px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="text-align: center; margin-bottom: 20px; border-b: 2px solid #0284c7; padding-bottom: 10px;">
          <h2 style="margin:0; color:#0f172a; font-size:22px; font-weight:900;">WISDOM NURSERY & PRIMARY SCHOOL - ESSUR CAMPUS</h2>
          <p style="margin:4px 0 0 0; color:#475569; font-size:13px; font-weight:bold;">
            OFFICIAL STUDENT TRANSPORT ID CARDS ROSTER (ACADEMIC YEAR 2026–2027)
          </p>
          <span style="font-size:11px; background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:12px; font-weight:bold; display:inline-block; margin-top:6px;">
            Total Printed: ${studentsToPrint.length} Students | Grade: ${selectedGradeFilter} | Route: ${selectedRouteFilter}
          </span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px; justify-items: center;">
          ${cardsGrid}
        </div>
      </div>
    `;

    printFormattedContent(`Wisdom_School_Bulk_ID_Cards_${selectedGradeFilter}`, bulkHtml);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Modal Top Banner */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono">
                  Printable Digital ID Card
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  Academic Year 2026–2027
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5 flex items-center gap-2">
                <span>Student Transport Pass & Smart ID Card</span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Filter Bar */}
        <div className="bg-slate-900/95 p-3.5 px-6 border-b border-slate-800 text-xs font-bold flex flex-wrap items-center justify-between gap-3 text-white shrink-0">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode("single")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "single" ? "bg-amber-400 text-slate-950 font-black shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Single Card Preview</span>
            </button>
            <button
              onClick={() => setViewMode("bulk")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "bulk" ? "bg-amber-400 text-slate-950 font-black shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bulk Roster Grid ({students.length})</span>
            </button>
          </div>

          {/* Student Selector Dropdown for Single Mode */}
          {viewMode === "single" && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Select Student:</span>
              <select
                value={currentStudent.id}
                onChange={(e) => {
                  const target = students.find((s) => s.id === e.target.value);
                  if (target) {
                    setCurrentStudent(target);
                    setCustomPhotoUrl(null);
                    if (onSelectStudent) onSelectStudent(target);
                  }
                }}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rollNumber} • {s.grade})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bulk Filters */}
          {viewMode === "bulk" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-400" /> Filter Grade:
              </span>
              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none"
              >
                <option value="All">All Grades</option>
                {Array.from(new Set(students.map((s) => s.grade))).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              <select
                value={selectedRouteFilter}
                onChange={(e) => setSelectedRouteFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none"
              >
                <option value="All">All Routes</option>
                {Array.from(new Set(students.map((s) => s.assignedRouteName))).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Side Toggle & Theme Switcher */}
          {viewMode === "single" && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Card Side */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setCardSide("both")}
                  className={`px-2 py-1 rounded text-[10px] font-extrabold ${
                    cardSide === "both" ? "bg-slate-700 text-amber-300" : "text-slate-400"
                  }`}
                >
                  Both Sides
                </button>
                <button
                  onClick={() => setCardSide("front")}
                  className={`px-2 py-1 rounded text-[10px] font-extrabold ${
                    cardSide === "front" ? "bg-slate-700 text-amber-300" : "text-slate-400"
                  }`}
                >
                  Front
                </button>
                <button
                  onClick={() => setCardSide("back")}
                  className={`px-2 py-1 rounded text-[10px] font-extrabold ${
                    cardSide === "back" ? "bg-slate-700 text-amber-300" : "text-slate-400"
                  }`}
                >
                  Back
                </button>
              </div>

              {/* Theme */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setCardTheme("gold")}
                  className={`w-4 h-4 rounded-full bg-amber-500 border border-white/50 ${
                    cardTheme === "gold" ? "ring-2 ring-amber-400" : ""
                  }`}
                  title="Classic Gold Theme"
                />
                <button
                  onClick={() => setCardTheme("emerald")}
                  className={`w-4 h-4 rounded-full bg-emerald-500 border border-white/50 ${
                    cardTheme === "emerald" ? "ring-2 ring-emerald-400" : ""
                  }`}
                  title="Transport Emerald Theme"
                />
                <button
                  onClick={() => setCardTheme("navy")}
                  className={`w-4 h-4 rounded-full bg-blue-600 border border-white/50 ${
                    cardTheme === "navy" ? "ring-2 ring-blue-400" : ""
                  }`}
                  title="Royal Navy Theme"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Main Content Container */}
        <div className="p-6 bg-slate-100 overflow-y-auto flex-1 space-y-6">
          {viewMode === "single" ? (
            /* SINGLE CARD INTERACTIVE PREVIEW & EDITOR */
            <div className="flex flex-col items-center space-y-6">
              {/* Card Container Preview */}
              <div className="flex flex-wrap justify-center items-center gap-8 my-2">
                {(cardSide === "both" || cardSide === "front") && (
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      🪪 ID Card Front View
                    </span>
                    <CardFrontView
                      student={currentStudent}
                      vehicle={activeVehicle}
                      photoSrc={studentPhotoSrc}
                      theme={cardTheme}
                      onUploadClick={() => fileInputRef.current?.click()}
                    />
                  </div>
                )}

                {(cardSide === "both" || cardSide === "back") && (
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      🔄 ID Card Back View
                    </span>
                    <CardBackView student={currentStudent} vehicle={activeVehicle} theme={cardTheme} />
                  </div>
                )}
              </div>

              {/* Photo Upload Hidden Input & Camera Quick Trigger Bar */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm w-full max-w-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      Student Photo Management
                    </h4>
                    <p className="text-xs text-slate-500">
                      Upload or replace photo on student's transport ID card
                    </p>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload / Snap Photo
                  </button>
                </div>

                {studentPhotoSrc && (
                  <div className="flex items-center gap-3 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs">
                    <img src={studentPhotoSrc} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-emerald-300" />
                    <div className="flex-1">
                      <span className="text-emerald-900 font-extrabold block">Custom Photo Attached</span>
                      <span className="text-[10px] text-emerald-700">Active on printable ID card preview</span>
                    </div>
                    <button
                      onClick={() => setCustomPhotoUrl(null)}
                      className="text-slate-400 hover:text-rose-600 text-xs font-bold p-1 cursor-pointer"
                      title="Reset to default photo"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* BULK ROSTER PRINTABLE GRID */
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      Bulk Printable Roster Cards ({filteredBulkStudents.length} Filtered)
                    </h4>
                    <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-md">
                      {selectedForBulkCount} Selected
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select specific students or batch-print standard A4 cardstock ID cards & dispatch WhatsApp passes to parents.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={toggleSelectAllBulk}
                    className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {selectedForBulkCount === filteredBulkStudents.length ? "Deselect All" : "Select All"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWhatsAppModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer border border-emerald-400/40"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Send Bulk WhatsApp ({selectedForBulkCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintBulkCards}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer border border-amber-300"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-950" />
                    <span>Print Selected ({selectedForBulkCount}) ID Cards</span>
                  </button>
                </div>
              </div>

              {/* Grid of cards with checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
                {filteredBulkStudents.map((st) => {
                  const veh = vehicles.find((v) => v.id === st.assignedVehicleId) || vehicles[0];
                  const doc = st.documents?.find((d) => d.category === "Transport ID Card");
                  const isSelected = selectedBulkStudentIds.has(st.id);

                  return (
                    <div
                      key={st.id}
                      onClick={() => toggleStudentSelection(st.id)}
                      className={`p-3 rounded-2xl border shadow-sm flex flex-col items-center space-y-2 cursor-pointer transition relative ${
                        isSelected
                          ? "bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/40"
                          : "bg-white border-slate-200 hover:border-slate-300 opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 px-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudentSelection(st.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                          />
                          <span className="font-extrabold text-slate-900">{st.name} ({st.rollNumber})</span>
                        </div>
                        <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {st.grade} • {st.assignedRouteName}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 justify-center scale-90 origin-top">
                        <CardFrontView student={st} vehicle={veh} photoSrc={doc?.dataUrl || null} theme={cardTheme} compact />
                        <CardBackView student={st} vehicle={veh} theme={cardTheme} compact />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bulk WhatsApp Dispatch Queue Modal */}
        <BulkWhatsAppDispatchModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          selectedStudents={selectedStudentsForWhatsApp}
          vehicles={vehicles}
        />

        {/* Modal Footer Actions */}
        <div className="bg-white p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Wisdom Primary School • Transport Management System
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {viewMode === "single" && (
              <>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition shadow flex items-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  Share via WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handlePrintSingleCard}
                  className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-black px-6 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer border border-slate-800"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  Print / PDF ID Card
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* FRONT CARD COMPONENT */
interface CardFrontViewProps {
  student: Student;
  vehicle: Vehicle;
  photoSrc: string | null;
  theme: "gold" | "emerald" | "navy";
  compact?: boolean;
  onUploadClick?: () => void;
}

const CardFrontView: React.FC<CardFrontViewProps> = ({
  student,
  vehicle,
  photoSrc,
  theme,
  compact = false,
  onUploadClick,
}) => {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://wisdomschool.edu.in";
  const portalUrl = `${baseUrl}/?studentId=${student.id}&tab=parent`;

  const themeStyles = {
    gold: {
      headerBg: "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700",
      accentBadge: "bg-amber-100 text-amber-950 border-amber-300",
      border: "border-amber-400",
      pillBg: "bg-amber-500 text-slate-950",
    },
    emerald: {
      headerBg: "bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700",
      accentBadge: "bg-emerald-100 text-emerald-950 border-emerald-300",
      border: "border-emerald-400",
      pillBg: "bg-emerald-500 text-slate-950",
    },
    navy: {
      headerBg: "bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950",
      accentBadge: "bg-blue-100 text-blue-950 border-blue-300",
      border: "border-blue-400",
      pillBg: "bg-blue-500 text-white",
    },
  }[theme];

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-xl border-2 ${themeStyles.border} overflow-hidden font-sans select-none ${
        compact ? "w-[260px] h-[390px] p-2.5" : "w-[310px] h-[460px] p-3.5"
      } flex flex-col justify-between`}
      style={{
        backgroundImage: "radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.04), transparent 70%)",
      }}
    >
      {/* Background Watermark Crest */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <Building2 className="w-48 h-48 text-slate-900" />
      </div>

      {/* Top Header Section */}
      <div className={`${themeStyles.headerBg} text-white p-2.5 rounded-xl text-center relative overflow-hidden shadow-sm`}>
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-base">🏫</span>
          <h4 className="font-black text-xs tracking-tight uppercase text-amber-100">
            WISDOM NURSERY & PRIMARY SCHOOL
          </h4>
        </div>
        <p className="text-[9px] text-amber-200 font-medium tracking-wide">
          ESSUR CAMPUS • ESTD 2012 • CBSE ROUTE #492
        </p>
        <div className="mt-1 inline-block bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-white tracking-widest border border-white/30">
          STUDENT TRANSPORT PASS • 2026–2027
        </div>
      </div>

      {/* Middle Photo & Roll Number Block */}
      <div className="flex items-center gap-3 my-1">
        {/* Photo Box */}
        <div className="relative group shrink-0">
          <div className="w-20 h-24 rounded-xl border-2 border-amber-400/80 bg-slate-100 overflow-hidden shadow-md flex items-center justify-center relative">
            {photoSrc ? (
              <img src={photoSrc} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 flex flex-col items-center justify-center p-1 text-center">
                <User className="w-10 h-10 text-amber-700/60" />
                <span className="text-[8px] font-black text-amber-900 mt-1 uppercase">
                  {student.name.slice(0, 2)}
                </span>
              </div>
            )}

            {/* Quick Upload Hover overlay */}
            {onUploadClick && (
              <button
                type="button"
                onClick={onUploadClick}
                className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 text-[9px] font-bold cursor-pointer"
              >
                <Camera className="w-4 h-4 text-amber-300" />
                <span>Snap Photo</span>
              </button>
            )}
          </div>
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-400 font-mono text-[7px] font-black px-1.5 py-0.2 rounded border border-amber-400 uppercase tracking-tighter whitespace-nowrap shadow">
            OFFICIAL ID
          </span>
        </div>

        {/* Student Name & Roll Details */}
        <div className="space-y-1 flex-1 min-w-0">
          <div>
            <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">
              Student Name
            </span>
            <strong className="text-slate-950 text-sm font-black block leading-tight truncate">
              {student.name}
            </strong>
          </div>

          <div className="flex items-center gap-1">
            <span className="bg-slate-900 text-amber-400 font-mono text-[10px] font-black px-2 py-0.5 rounded-md border border-slate-800">
              {student.rollNumber}
            </span>
            <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-md border border-amber-300">
              {student.grade}
            </span>
          </div>

          <div className="text-[9px] font-bold text-slate-600 flex items-center gap-1">
            <span>Blood Group:</span>
            <span className="text-rose-700 font-black bg-rose-50 px-1 rounded border border-rose-200">
              O+
            </span>
          </div>
        </div>
      </div>

      {/* Route & Transport Information Details Card */}
      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1.5 text-[10px]">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-1">
          <span className="font-extrabold text-amber-800 flex items-center gap-1 uppercase text-[9px]">
            🚌 Route & Vehicle
          </span>
          <span className="font-mono text-slate-700 font-bold text-[9px] bg-slate-200/80 px-1.5 py-0.2 rounded">
            {vehicle.registrationNumber || "TN-21-AZ-4921"}
          </span>
        </div>

        <div className="font-bold text-slate-900 truncate">
          {student.assignedRouteName}
        </div>

        <div className="grid grid-cols-2 gap-1 text-[9px]">
          <div>
            <span className="text-slate-400 block text-[8px] font-bold uppercase">Pickup Stop</span>
            <strong className="text-slate-800 block truncate">{student.pickupStopName}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[8px] font-bold uppercase">Distance</span>
            <strong className="text-emerald-700 font-mono block">{student.distanceKm} km</strong>
          </div>
        </div>

        <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between text-[9px] text-slate-700">
          <span>Driver: <strong>{vehicle.driverName || "Mr. S. Kumar"}</strong></span>
          <span className="font-mono text-slate-600">📞 {vehicle.driverPhone || "9840123456"}</span>
        </div>
      </div>

      {/* Bottom Security Bar & Scanner QR */}
      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <QRCodeSVG value={portalUrl} size={38} level="M" />
          </div>
          <div>
            <span className="text-[8px] uppercase text-slate-400 font-bold block">RFID Tag ID</span>
            <strong className="font-mono text-[10px] font-extrabold text-slate-900 block">{student.rfidTagId}</strong>
            <span className="text-[7px] text-emerald-600 font-bold block flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Active Scanner
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 border border-amber-500 shadow-inner flex items-center justify-center ml-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
          </div>
          <span className="text-[7px] text-slate-400 font-mono block mt-0.5">VALID 2026-27</span>
        </div>
      </div>
    </div>
  );
};

/* BACK CARD COMPONENT */
interface CardBackViewProps {
  student: Student;
  vehicle: Vehicle;
  theme: "gold" | "emerald" | "navy";
  compact?: boolean;
}

const CardBackView: React.FC<CardBackViewProps> = ({
  student,
  vehicle,
  theme,
  compact = false,
}) => {
  const themeBorder = {
    gold: "border-amber-400",
    emerald: "border-emerald-400",
    navy: "border-blue-400",
  }[theme];

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-xl border-2 ${themeBorder} overflow-hidden font-sans select-none ${
        compact ? "w-[260px] h-[390px] p-2.5" : "w-[310px] h-[460px] p-3.5"
      } flex flex-col justify-between`}
    >
      {/* Header */}
      <div className="bg-slate-900 text-white p-2 rounded-xl text-center space-y-0.5">
        <h5 className="font-extrabold text-[10px] uppercase text-amber-400 tracking-wider">
          EMERGENCY DESK & PARENT DETAILS
        </h5>
        <p className="text-[8px] text-slate-400">Wisdom Primary School Transport Office</p>
      </div>

      {/* Parent Contact Box */}
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[10px]">
        <span className="text-[8px] font-bold text-slate-400 uppercase block">Parent / Guardian Details</span>
        <div className="text-slate-950 font-black text-xs">{student.parentName}</div>
        <div className="text-slate-700 font-mono font-bold flex items-center gap-1 text-[10px]">
          <Phone className="w-3 h-3 text-emerald-600" />
          {student.parentPhone}
        </div>
        <div className="text-slate-600 text-[9px] mt-1 pt-1 border-t border-slate-200">
          📍 {student.address}
        </div>
      </div>

      {/* School Office Contact Helpline */}
      <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-200 text-[9px] space-y-0.5">
        <span className="font-extrabold text-amber-950 block">🏫 School Transport Office Contact</span>
        <div className="flex items-center justify-between font-mono font-bold text-amber-900 text-[9px]">
          <span>Helpline: +91 9176593129</span>
          <span>Admin: Saravanan</span>
        </div>
        <div className="text-[8px] text-amber-800 truncate">
          Campus: Essur Village, Cheyyar Circle, Tamil Nadu - 603310
        </div>
      </div>

      {/* Transport Regulations */}
      <div className="space-y-1 text-[8px] text-slate-600">
        <span className="font-extrabold text-slate-900 uppercase block text-[8px]">
          Transport Rules & Guidelines:
        </span>
        <ul className="list-disc pl-3 space-y-0.5 text-[8px]">
          <li>Student must scan RFID card on van POS terminal upon boarding.</li>
          <li>Pass is non-transferable and valid for 2026–2027 session only.</li>
          <li>If card is lost or damaged, report immediately to transport desk.</li>
        </ul>
      </div>

      {/* Barcode Graphic Footer */}
      <div className="pt-2 border-t border-slate-200 text-center space-y-1">
        <div className="flex justify-center items-center gap-0.5 h-6">
          {/* Simulated SVG Barcode lines */}
          {[2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,3,1,2,1,3,2,1,4,1,2].map((w, idx) => (
            <div
              key={idx}
              className="bg-slate-900 h-full"
              style={{ width: `${w * 1.2}px` }}
            />
          ))}
        </div>
        <div className="font-mono text-[9px] font-black text-slate-900 tracking-widest">
          *{student.rollNumber}*
        </div>
      </div>
    </div>
  );
};

/* HTML Generators for Clean Printing */
function renderCardFrontHTML(s: Student, v: Vehicle, photo: string | null) {
  return `
    <div style="width: 300px; height: 450px; border: 2px solid #f59e0b; border-radius: 16px; padding: 14px; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
      <div style="background: linear-gradient(to right, #d97706, #f59e0b, #b45309); color: #ffffff; padding: 10px; border-radius: 12px; text-align: center;">
        <div style="font-size: 11px; font-weight: 900; letter-spacing: -0.2px; text-transform: uppercase;">WISDOM NURSERY & PRIMARY SCHOOL</div>
        <div style="font-size: 8px; color: #fef3c7; font-weight: bold; margin-top: 2px;">ESSUR CAMPUS • ESTD 2012 • CBSE ROUTE #492</div>
        <div style="background: rgba(255,255,255,0.25); font-size: 7px; font-weight: 900; padding: 2px 6px; border-radius: 10px; display: inline-block; margin-top: 4px; text-transform: uppercase;">STUDENT TRANSPORT PASS 2026–2027</div>
      </div>

      <div style="display: flex; gap: 12px; align-items: center; margin: 8px 0;">
        <div style="width: 80px; height: 96px; border-radius: 10px; border: 2px solid #f59e0b; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center; shrink: 0;">
          ${
            photo
              ? `<img src="${photo}" style="width:100%; height:100%; object-fit:cover;" />`
              : `<div style="font-size:24px; color:#b45309; font-weight:900;">${s.name.slice(0, 2).toUpperCase()}</div>`
          }
        </div>
        <div style="flex: 1;">
          <div style="font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase;">Student Name</div>
          <div style="font-size: 14px; font-weight: 900; color: #0f172a; line-height: 1.2;">${s.name}</div>
          <div style="margin-top: 4px; display: flex; gap: 4px;">
            <span style="background: #0f172a; color: #fbbf24; font-family: monospace; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">${s.rollNumber}</span>
            <span style="background: #fef3c7; color: #78350f; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">${s.grade}</span>
          </div>
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; font-size: 9px; color: #1e293b;">
        <div style="font-weight: 900; color: #b45309; text-transform: uppercase; margin-bottom: 3px; font-size: 8px;">🚌 Route & Pickup Stop</div>
        <div style="font-weight: 900; font-size: 10px; margin-bottom: 2px;">${s.assignedRouteName}</div>
        <div style="display: flex; justify-content: space-between; font-size: 8px; color: #475569;">
          <span>Stop: <b>${s.pickupStopName}</b></span>
          <span>Dist: <b>${s.distanceKm} km</b></span>
        </div>
        <div style="border-top: 1px solid #cbd5e1; margin-top: 4px; padding-top: 4px; font-size: 8px;">
          Van: <b>${v?.registrationNumber || "TN-21-AZ-4921"}</b> | Driver: <b>${v?.driverName || "S. Kumar"}</b>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 7px; color: #64748b; font-weight: bold;">RFID TAG ID</div>
          <div style="font-family: monospace; font-size: 9px; font-weight: 900; color: #0f172a;">${s.rfidTagId}</div>
        </div>
        <div style="text-align: right; font-size: 7px; font-weight: 900; color: #059669;">OFFICIAL PASS</div>
      </div>
    </div>
  `;
}

function renderCardBackHTML(s: Student, v: Vehicle) {
  return `
    <div style="width: 300px; height: 450px; border: 2px solid #f59e0b; border-radius: 16px; padding: 14px; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
      <div style="background: #0f172a; color: #fbbf24; padding: 8px; border-radius: 10px; text-align: center; font-size: 9px; font-weight: 900; text-transform: uppercase;">
        EMERGENCY CONTACT & RULES
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px; font-size: 9px;">
        <div style="font-size: 7px; color: #64748b; font-weight: bold; text-transform: uppercase;">Parent / Guardian</div>
        <div style="font-weight: 900; font-size: 11px; color: #0f172a;">${s.parentName}</div>
        <div style="font-family: monospace; font-weight: bold; color: #047857; margin-top: 2px;">📞 ${s.parentPhone}</div>
        <div style="color: #475569; margin-top: 3px; font-size: 8px;">📍 ${s.address}</div>
      </div>

      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 6px; font-size: 8px; color: #78350f;">
        <div style="font-weight: 900;">🏫 School Transport Helpline</div>
        <div>Phone: +91 9176593129 | Admin: Mr. R. Saravanan</div>
        <div>Campus: Essur Village, Cheyyar Circle, TN - 603310</div>
      </div>

      <div style="font-size: 7px; color: #475569;">
        <b>Regulations:</b>
        <ul style="margin: 2px 0; padding-left: 12px;">
          <li>Must scan RFID card on van reader upon boarding.</li>
          <li>Valid for Academic Year 2026–2027 only.</li>
          <li>If found lost, return to Wisdom Primary School.</li>
        </ul>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; text-align: center;">
        <div style="font-family: monospace; font-weight: 900; font-size: 9px; letter-spacing: 2px; color: #0f172a;">*${s.rollNumber}*</div>
      </div>
    </div>
  `;
}
