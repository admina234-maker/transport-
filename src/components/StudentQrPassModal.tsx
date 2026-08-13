import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Building2,
  Users,
  Sparkles,
  Phone,
  Bus,
  CheckCircle2,
  Share2,
  Layers,
  ArrowRight
} from "lucide-react";
import { Student, Vehicle } from "../types";
import { SCHOOL_INFO } from "../data/mockData";
import { calculateStudentTotalBill } from "../utils/feeCalculator";
import { printFormattedContent } from "../utils/printHelper";

interface StudentQrPassModalProps {
  student: Student;
  students: Student[];
  vehicles: Vehicle[];
  onClose: () => void;
  onSelectStudent?: (student: Student) => void;
}

export const StudentQrPassModal: React.FC<StudentQrPassModalProps> = ({
  student,
  students,
  vehicles,
  onClose,
  onSelectStudent,
}) => {
  const [activeView, setActiveView] = useState<"single" | "bulk">("single");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("All");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [paymentPreset, setPaymentPreset] = useState<"term" | "monthly" | "custom">("term");

  const singleQrRef = useRef<HTMLDivElement>(null);

  const vehicle = vehicles.find((v) => v.id === student.assignedVehicleId) || vehicles[0];
  const bill = calculateStudentTotalBill(
    student.grade,
    student.distanceKm,
    vehicle?.type || "Van (14-Seater)"
  );

  const [customAmount, setCustomAmount] = useState<number>(bill.totalTermAmount);

  // Student specific online portal direct URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://wisdomschool.edu.in";
  const studentPortalUrl = `${baseUrl}/?studentId=${student.id}&tab=parent&roll=${encodeURIComponent(student.rollNumber)}`;

  // Instant NPCI Compliant UPI Deep Link String
  const noteText = `Wisdom Fee ${student.name} (${student.rollNumber})`;
  const upiUri = `upi://pay?pa=${encodeURIComponent(SCHOOL_INFO.upiId)}&pn=${encodeURIComponent(
    SCHOOL_INFO.upiName
  )}&am=${customAmount}&cu=INR&tn=${encodeURIComponent(noteText)}`;

  // Filtered students list for bulk view
  const bulkStudents = students.filter((s) => {
    if (selectedGradeFilter === "All") return true;
    return s.grade === selectedGradeFilter;
  });

  const handleCopyPortalUrl = () => {
    navigator.clipboard.writeText(studentPortalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(SCHOOL_INFO.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `Dear ${student.parentName}, Wisdom Nursery & Primary School (Essur) Payment Portal & UPI Fee Link for ward ${student.name} (${student.grade}, Roll: ${student.rollNumber}):\n\n🔗 Online Payment Portal: ${studentPortalUrl}\n\n💳 Direct UPI ID: ${SCHOOL_INFO.upiId} (${SCHOOL_INFO.upiName})\n💰 Amount Due: ₹${customAmount.toLocaleString("en-IN")}\n\nContact Admin Mr. R SARAVANAN at +91 9176593129 for queries. Thank you!`;
    const cleanPhone = student.parentPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleDownloadSingleQrPng = () => {
    const svgElement = singleQrRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 700;
      canvas.height = 700;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 75, 75, 550, 550);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR_Payment_Pass_${student.name.replace(/\s+/g, "_")}_${student.rollNumber}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintSingleQrPass = () => {
    const htmlContent = `
      <div style="max-width: 650px; margin: 0 auto; border: 4px solid #0f172a; border-radius: 20px; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: #ffffff; color: #0f172a;">
        <!-- Header -->
        <div style="text-align: center; border-b: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
          <div style="background: #0f172a; color: #fbbf24; font-size: 11px; font-weight: 900; letter-spacing: 1px; display: inline-block; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 8px;">
            Official Student Fee & Payment Portal Pass
          </div>
          <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0;">WISDOM NURSERY & PRIMARY SCHOOL</h1>
          <p style="font-size: 12px; color: #d97706; font-weight: 700; text-transform: uppercase; margin: 2px 0 0 0;">
            "${SCHOOL_INFO.motto}" | Essur, Cheyyar, Tamil Nadu
          </p>
        </div>

        <!-- Student Info Grid -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
          <div>
            <span style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; display: block;">Student Name</span>
            <strong style="font-size: 15px; color: #0f172a;">${student.name}</strong>
            <span style="display: block; color: #475569; font-weight: 600;">Grade: ${student.grade} | Roll: ${student.rollNumber}</span>
          </div>
          <div>
            <span style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; display: block;">Parent Contact</span>
            <strong style="font-size: 14px; color: #0f172a;">${student.parentName}</strong>
            <span style="display: block; color: #0284c7; font-family: monospace; font-weight: 700;">+91 ${student.parentPhone}</span>
          </div>
          <div>
            <span style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; display: block;">Van Route / Pickup Stop</span>
            <strong style="color: #0f172a;">${student.assignedRouteName}</strong>
            <span style="display: block; color: #64748b;">Stop: ${student.pickupStopName} (${student.distanceKm} km)</span>
          </div>
          <div>
            <span style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; display: block;">Term Fee Due Amount</span>
            <strong style="font-size: 18px; color: #047857; font-family: monospace;">₹${customAmount.toLocaleString("en-IN")}</strong>
            <span style="display: block; color: #64748b;">Status: ${student.paymentStatus}</span>
          </div>
        </div>

        <!-- QR Code Display Box -->
        <div style="text-align: center; background: #ffffff; border: 2px dashed #94a3b8; border-radius: 16px; padding: 20px; margin-bottom: 16px;">
          <div style="display: inline-block; padding: 12px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <svg width="220" height="220" viewBox="0 0 256 256" style="display: block; margin: 0 auto;">
              ${singleQrRef.current?.querySelector("svg")?.innerHTML || ""}
            </svg>
          </div>
          <p style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 10px 0 2px 0;">
            SCAN WITH ANY UPI APP (GPay, PhonePe, Paytm, BHIM) OR MOBILE CAMERA
          </p>
          <p style="font-size: 11px; color: #475569; margin: 0;">
            Automatically links to Student Payment Portal & encodes Ward Roll No: <strong>${student.rollNumber}</strong>
          </p>
        </div>

        <!-- Beneficiary & Payment Instructions -->
        <div style="background: #0f172a; color: #ffffff; border-radius: 12px; padding: 12px 16px; font-size: 11px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-b: 1px solid #334155; padding-bottom: 6px; margin-bottom: 6px;">
            <span>Official UPI Beneficiary: <strong style="color: #fbbf24;">${SCHOOL_INFO.upiName}</strong></span>
            <span>UPI ID: <strong style="color: #34d399; font-family: monospace;">${SCHOOL_INFO.upiId}</strong></span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>Chief Transport Officer: <strong>${SCHOOL_INFO.contactPerson}</strong></span>
            <span>Phone: <strong style="color: #fbbf24;">+91 ${SCHOOL_INFO.contactPhone}</strong></span>
          </div>
        </div>

        <div style="font-size: 10px; color: #64748b; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
          Direct Portal URL: ${studentPortalUrl} | Generated on ${new Date().toLocaleDateString("en-IN")}
        </div>
      </div>
    `;

    printFormattedContent(`Student QR Payment Pass - ${student.name} (${student.rollNumber})`, htmlContent);
  };

  const handlePrintBulkQrSheet = () => {
    const cardsHtml = bulkStudents
      .map((s) => {
        const v = vehicles.find((veh) => veh.id === s.assignedVehicleId) || vehicles[0];
        const b = calculateStudentTotalBill(s.grade, s.distanceKm, v?.type || "Van (14-Seater)");
        const upiStr = `upi://pay?pa=${encodeURIComponent(SCHOOL_INFO.upiId)}&pn=${encodeURIComponent(
          SCHOOL_INFO.upiName
        )}&am=${b.totalTermAmount}&cu=INR&tn=${encodeURIComponent(`Wisdom Fee ${s.name} (${s.rollNumber})`)}`;

        return `
          <div style="border: 2px solid #0f172a; border-radius: 12px; padding: 12px; background: #ffffff; page-break-inside: avoid; font-family: system-ui, sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
              <div>
                <strong style="font-size: 13px; color: #0f172a; display: block;">${s.name}</strong>
                <span style="font-size: 10px; color: #475569;">Grade: ${s.grade} | Roll: ${s.rollNumber}</span>
              </div>
              <span style="background: #0f172a; color: #fbbf24; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">WISDOM</span>
            </div>

            <div style="display: flex; gap: 10px; align-items: center;">
              <div style="width: 100px; height: 100px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px; text-align: center; background: #fff;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiStr)}" style="width: 100%; height: 100%;" alt="QR" />
              </div>
              <div style="font-size: 10px; color: #1e293b; line-height: 1.4;">
                <p style="margin: 0;"><strong>Parent:</strong> ${s.parentName}</p>
                <p style="margin: 0; color: #0284c7; font-weight: 700;">+91 ${s.parentPhone}</p>
                <p style="margin: 0;"><strong>Stop:</strong> ${s.pickupStopName}</p>
                <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: 900; color: #047857; font-family: monospace;">
                  Term Fee: ₹${b.totalTermAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #cbd5e1; font-size: 8px; color: #64748b; text-align: center;">
              UPI ID: ${SCHOOL_INFO.upiId} | Contact: +91 ${SCHOOL_INFO.contactPhone}
            </div>
          </div>
        `;
      })
      .join("");

    const sheetHtml = `
      <div style="padding: 10px;">
        <div style="text-align: center; margin-bottom: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">
          <h2 style="font-size: 18px; font-weight: 900; margin: 0; color: #0f172a;">WISDOM NURSERY & PRIMARY SCHOOL (ESSUR)</h2>
          <p style="font-size: 11px; color: #d97706; font-weight: 700; margin: 2px 0 0 0; uppercase;">STUDENT PAYMENT PORTAL QR CODES SHEET (${selectedGradeFilter} Students - Count: ${bulkStudents.length})</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          ${cardsHtml}
        </div>
      </div>
    `;

    printFormattedContent(`Student Payment QR Code Sheet - ${selectedGradeFilter} (${bulkStudents.length})`, sheetHtml);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-extrabold shadow-inner">
              <QrCode className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-yellow-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono">
                  Printable Payment Pass
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Roll: <strong className="text-amber-400">{student.rollNumber}</strong>
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                {student.name} — Student Payment Portal QR
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Print official payment QR pass, share direct portal link to parent, or download high-res PNG.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Bar */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center justify-between gap-2 px-5 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveView("single")}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                activeView === "single"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              Single Student Pass
            </button>

            <button
              onClick={() => setActiveView("bulk")}
              className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                activeView === "bulk"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Bulk Roster QR Sheet ({students.length})
            </button>
          </div>

          {onSelectStudent && students.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold hidden sm:inline">Select Ward:</span>
              <select
                value={student.id}
                onChange={(e) => {
                  const s = students.find((st) => st.id === e.target.value);
                  if (s && onSelectStudent) onSelectStudent(s);
                }}
                className="bg-white border border-slate-300 text-slate-800 rounded-lg text-xs py-1 px-2 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.grade})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 bg-slate-50/60 max-h-[75vh] overflow-y-auto">
          {activeView === "single" && (
            <div className="space-y-6">
              {/* Main Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* QR Code Graphic Box */}
                <div className="md:col-span-5 bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-md flex flex-col items-center justify-center text-center space-y-3">
                  <div
                    ref={singleQrRef}
                    className="p-3 bg-white border-2 border-amber-300 rounded-2xl shadow-inner relative group"
                  >
                    <QRCodeSVG
                      value={upiUri}
                      size={180}
                      level="H"
                      marginSize={2}
                      aria-label={`Payment QR Code for ${student.name}`}
                    />
                    <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/10 transition rounded-2xl flex items-center justify-center pointer-events-none">
                      <Sparkles className="w-6 h-6 text-yellow-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 font-mono inline-block">
                      Instant Payment & Portal Link
                    </span>
                    <p className="text-xs font-extrabold text-slate-800 mt-1">
                      Scan with GPay, PhonePe, Paytm or Camera
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Auto-encodes Ward Roll: <strong>{student.rollNumber}</strong>
                    </p>
                  </div>
                </div>

                {/* Ward Details & Fee Amount Selector */}
                <div className="md:col-span-7 space-y-4">
                  {/* Ward Details Box */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Payer Ward</span>
                        <strong className="text-base text-slate-900 font-extrabold block">{student.name}</strong>
                      </div>
                      <span className="bg-blue-100 text-blue-900 text-xs font-black px-2.5 py-1 rounded-lg border border-blue-200">
                        {student.grade}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 font-semibold block">Parent / Guardian:</span>
                        <strong className="text-slate-800">{student.parentName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Parent Phone:</span>
                        <strong className="text-blue-600 font-mono">+91 {student.parentPhone}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Pickup Stop & Van:</span>
                        <strong className="text-slate-800 truncate block">{student.pickupStopName} ({student.assignedRouteName})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Payment Status:</span>
                        <span className={`font-extrabold ${student.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"}`}>
                          {student.paymentStatus} ({student.dueDate || "Jul 28"})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fee Preset Buttons */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                      Configured Payment Amount:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPaymentPreset("term");
                          setCustomAmount(bill.totalTermAmount);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          paymentPreset === "term"
                            ? "bg-amber-500 text-slate-950 border-amber-600 shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300"
                        }`}
                      >
                        Full Term (₹{bill.totalTermAmount.toLocaleString("en-IN")})
                      </button>

                      <button
                        onClick={() => {
                          setPaymentPreset("monthly");
                          setCustomAmount(bill.transportMonthlyFee);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          paymentPreset === "monthly"
                            ? "bg-amber-500 text-slate-950 border-amber-600 shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300"
                        }`}
                      >
                        1 Month Van (₹{bill.transportMonthlyFee.toLocaleString("en-IN")})
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 font-mono text-xs">
                      <span className="text-slate-500 font-bold">QR Encoded Amount:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-emerald-700 text-base">₹</span>
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => {
                            setPaymentPreset("custom");
                            setCustomAmount(Number(e.target.value) || 0);
                          }}
                          className="w-24 bg-white border border-slate-300 rounded px-2 py-0.5 font-extrabold text-slate-900 text-right focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <button
                  onClick={handlePrintSingleQrPass}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold p-3 rounded-2xl text-xs transition flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  Print QR Slip
                </button>

                <button
                  onClick={handleDownloadSingleQrPng}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold p-3 rounded-2xl text-xs transition flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-200" />
                  Download PNG
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold p-3 rounded-2xl text-xs transition flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-200" />
                  WhatsApp Parent
                </button>

                <button
                  onClick={handleCopyPortalUrl}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold p-3 rounded-2xl text-xs transition flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  {copiedLink ? "Copied Link!" : "Copy Portal URL"}
                </button>
              </div>

              {/* Direct Link Banner */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Direct Student Payment Portal Link</span>
                  <a
                    href={studentPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-mono font-bold hover:underline truncate block"
                  >
                    {studentPortalUrl}
                  </a>
                </div>
                <a
                  href={studentPortalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition shrink-0 flex items-center gap-1 border border-blue-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Portal
                </a>
              </div>
            </div>
          )}

          {activeView === "bulk" && (
            <div className="space-y-4">
              {/* Bulk Header Controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Printable Student QR Code Roster Sheet</h4>
                  <p className="text-slate-500">
                    Generate printable QR cards for all students. Perfect for parent-teacher distribution or student handbooks.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedGradeFilter}
                    onChange={(e) => setSelectedGradeFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-extrabold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="All">All Grades ({students.length})</option>
                    {["LKG", "UKG", "Grade I", "Grade II", "Grade III", "Grade IV", "Grade V"].map((g) => (
                      <option key={g} value={g}>
                        {g} ({students.filter((st) => st.grade === g).length})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handlePrintBulkQrSheet}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow cursor-pointer shrink-0"
                  >
                    <Printer className="w-4 h-4 text-slate-950" />
                    Print Roster Sheet ({bulkStudents.length})
                  </button>
                </div>
              </div>

              {/* Grid Preview of Bulk Students */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                {bulkStudents.map((s) => {
                  const v = vehicles.find((veh) => veh.id === s.assignedVehicleId) || vehicles[0];
                  const b = calculateStudentTotalBill(s.grade, s.distanceKm, v?.type || "Van (14-Seater)");
                  const upiStr = `upi://pay?pa=${encodeURIComponent(SCHOOL_INFO.upiId)}&pn=${encodeURIComponent(
                    SCHOOL_INFO.upiName
                  )}&am=${b.totalTermAmount}&cu=INR&tn=${encodeURIComponent(`Wisdom Fee ${s.name} (${s.rollNumber})`)}`;

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        if (onSelectStudent) onSelectStudent(s);
                        setActiveView("single");
                      }}
                      className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 shadow-sm transition flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm truncate">{s.name}</span>
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-slate-200 shrink-0">
                            {s.grade}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">Roll: {s.rollNumber}</p>
                        <p className="text-[11px] text-slate-600">Parent: {s.parentName} (+91 {s.parentPhone})</p>
                        <p className="text-xs font-mono font-extrabold text-emerald-700">
                          Term Fee: ₹{b.totalTermAmount.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl group-hover:border-amber-400 transition shrink-0">
                        <QRCodeSVG value={upiStr} size={64} level="L" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Official Wisdom School UPI Beneficiary: <strong className="text-slate-900">{SCHOOL_INFO.upiId}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
