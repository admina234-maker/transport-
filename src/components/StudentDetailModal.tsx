import React, { useState, useMemo } from "react";
import {
  X,
  User,
  Phone,
  MessageSquare,
  Bus,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Download,
  Send,
  Printer,
  ShieldCheck,
  QrCode,
  MapPin,
  TrendingUp,
  Award,
  Zap,
  Check,
  FileText
} from "lucide-react";
import { Student, Vehicle, NotificationLog, PaymentReceipt } from "../types";
import { calculateStudentTotalBill } from "../utils/feeCalculator";
import { SCHOOL_INFO } from "../data/mockData";

import { StudentDigitalIdCardModal } from "./StudentDigitalIdCardModal";

interface StudentDetailModalProps {
  student: Student | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onSendSingleAlert?: (student: Student) => void;
  onOpenReceipt?: (receipt: PaymentReceipt) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  vehicles,
  onClose,
  onSendSingleAlert,
  onOpenReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<"attendance" | "payments">("attendance");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("All");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  if (!student) return null;

  const assignedVehicle = vehicles.find((v) => v.id === student.assignedVehicleId) || vehicles[0];
  const billDetails = calculateStudentTotalBill(student.grade, student.distanceKm, assignedVehicle?.type || "Van (14-Seater)");

  const balance = student.balanceRemaining ?? (student.paymentStatus === "Paid" ? 0 : billDetails.totalTermAmount);
  const isPaid = student.paymentStatus === "Paid" || balance <= 0;

  // Generate realistic 20-day historical attendance log for this specific student
  const attendanceHistory = useMemo(() => {
    const records = [];
    const baseDate = new Date("2026-07-29"); // Anchor date

    for (let i = 0; i < 20; i++) {
      const dateObj = new Date(baseDate);
      dateObj.setDate(baseDate.getDate() - i);

      // Skip Sundays
      if (dateObj.getDay() === 0) continue;

      const dateStr = dateObj.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const dayName = dateObj.toLocaleDateString("en-IN", { weekday: "short" });

      // Deterministic realistic status derived from student.id + day offset
      const hash = (student.id.charCodeAt(student.id.length - 1) + i * 7) % 10;

      let status: "Boarded Pickup" | "Dropped at School" | "Boarded Return" | "Dropped Home" | "Absent";
      let morningTime = "07:52 AM";
      let eveningTime = "04:38 PM";
      let isOnTime = true;

      if (i === 0) {
        status = student.attendanceStatus || "Dropped at School";
        morningTime = student.lastStatusTime || "07:55 AM";
      } else if (hash === 9) {
        status = "Absent";
        morningTime = "Not Scanned";
        eveningTime = "Not Scanned";
        isOnTime = false;
      } else if (hash === 2) {
        status = "Boarded Return";
        morningTime = "08:08 AM";
        eveningTime = "04:25 PM";
        isOnTime = false; // Slight delay
      } else {
        status = "Dropped Home";
        morningTime = `07:${48 + (hash % 10)} AM`;
        eveningTime = `04:${32 + (hash % 12)} PM`;
      }

      records.push({
        id: `ATT-${student.id}-${i}`,
        date: dateStr,
        dayName,
        status,
        morningScan: morningTime,
        eveningScan: eveningTime,
        isOnTime,
        scannerDevice: `RFID-VAN-POS-${(assignedVehicle?.registrationNumber || "TN25").slice(-4)}`,
        driverName: assignedVehicle?.driverName || "Mr. S. Kumar",
      });
    }

    return records;
  }, [student, assignedVehicle]);

  // Compute attendance stats
  const totalDays = attendanceHistory.length;
  const presentDays = attendanceHistory.filter((r) => r.status !== "Absent").length;
  const absentDays = attendanceHistory.filter((r) => r.status === "Absent").length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // Filtered attendance records
  const filteredAttendance = attendanceHistory.filter((r) => {
    if (attendanceFilter === "All") return true;
    if (attendanceFilter === "Present") return r.status !== "Absent";
    if (attendanceFilter === "Absent") return r.status === "Absent";
    return r.status === attendanceFilter;
  });

  // Generate realistic payment ledger history for this student
  const paymentLedger = useMemo(() => {
    const items = [];
    
    // Recent payment if student paid or partially paid
    if (student.paymentStatus === "Paid" || student.paymentStatus === "Partially Paid" || student.lastPaymentDate) {
      items.push({
        id: `RCP-2026-07-${student.id.slice(-3)}`,
        receiptNo: `WIS-RCP-2026-${1000 + (student.id.charCodeAt(0) * 3) % 8000}`,
        date: student.lastPaymentDate || "22 Jul 2026",
        description: "July Transport Fee & Term II Tuition Installment",
        amountPaid: student.paymentStatus === "Paid" ? billDetails.totalTermAmount : Math.round(billDetails.totalTermAmount * 0.5),
        utr: student.lastUtrNumber || `9176593129-${Math.floor(100000 + Math.random() * 900000)}`,
        method: "UPI (Google Pay / PhonePe)",
        verifiedBy: SCHOOL_INFO.contactPerson,
        status: "Verified & Cleared",
        type: "Payment",
      });
    }

    // Previous Term payment (June 2026)
    items.push({
      id: `RCP-2026-06-${student.id.slice(-3)}`,
      receiptNo: `WIS-RCP-2026-${8000 + (student.id.charCodeAt(0) * 2) % 1500}`,
      date: "10 Jun 2026",
      description: "Term I Tuition & June Monthly Transport Pass",
      amountPaid: billDetails.totalTermAmount,
      utr: `UPI-JUNE-${Math.floor(100000 + Math.random() * 900000)}`,
      method: "UPI QR Scan",
      verifiedBy: SCHOOL_INFO.contactPerson,
      status: "Verified & Cleared",
      type: "Payment",
    });

    // Opening Demand Ledger
    items.push({
      id: `DEM-2026-06-${student.id.slice(-3)}`,
      receiptNo: `DEMAND-TERM-2026`,
      date: "01 Jun 2026",
      description: "Term I & II Academic Tuition + Transport Fleet Allocation",
      amountPaid: 0,
      totalDemand: billDetails.totalTermAmount * 2,
      utr: "N/A - System Demand",
      method: "School Ledger Demand",
      verifiedBy: "School Accounts Dept.",
      status: "Billed",
      type: "Demand",
    });

    return items;
  }, [student, billDetails]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(SCHOOL_INFO.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleTriggerAlertModal = () => {
    if (onSendSingleAlert) {
      onSendSingleAlert(student);
      setAlertSent(true);
      setTimeout(() => setAlertSent(false), 4000);
    }
  };

  const handleGenerateReceiptFromModal = (p: any) => {
    if (!onOpenReceipt) return;
    const receiptObj: PaymentReceipt = {
      receiptNumber: p.receiptNo,
      schoolName: SCHOOL_INFO.name,
      address: SCHOOL_INFO.location,
      motto: SCHOOL_INFO.motto,
      contactPerson: SCHOOL_INFO.contactPerson,
      upiId: SCHOOL_INFO.upiId,
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      parentName: student.parentName,
      amountPaid: p.amountPaid,
      tuitionFeePart: billDetails.tuitionTermFee,
      transportFeePart: billDetails.transportMonthlyFee,
      utrNumber: p.utr,
      paymentMethod: p.method,
      feeType: p.description,
      paymentDate: p.date,
      status: p.status,
    };
    onOpenReceipt(receiptObj);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Header Banner */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative border-b border-slate-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition cursor-pointer"
            title="Close Student Details Window"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg border-2 border-amber-200">
                {student.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full font-mono">
                    {student.grade} Class
                  </span>
                  <span className="bg-slate-800 text-slate-300 font-bold text-[11px] px-2.5 py-0.5 rounded-md font-mono border border-slate-700">
                    Roll No: {student.rollNumber}
                  </span>
                  <span className="bg-slate-800 text-amber-300 font-bold text-[11px] px-2.5 py-0.5 rounded-md font-mono border border-slate-700 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    Tag: {student.rfidTagId}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{student.name}</h2>
                <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Parent: <strong>{student.parentName}</strong> (+91 {student.parentPhone})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <button
                onClick={() => setShowIdCard(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow cursor-pointer border border-amber-300"
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-950" />
                Print ID Card
              </button>
              <a
                href={`tel:${student.parentPhone}`}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Parent
              </a>
              <a
                href={`https://wa.me/91${student.parentPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `🏫 *Wisdom School Student Update*\n\nDear Parent (${student.parentName}),\nAttendance & Fee Ledger details for *${student.name}* (${student.grade}):\n• RFID Boarding Status: ${student.attendanceStatus}\n• Outstanding Balance: ₹${balance.toLocaleString("en-IN")}\n• Official School UPI: ${SCHOOL_INFO.upiId}\n\nCampus Office: Mr. R SARAVANAN (${SCHOOL_INFO.contactPhone})`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-white" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Top Summary Metrics Strip */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
              30-Day Attendance Rate
            </span>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-black font-mono ${attendancePercentage >= 90 ? "text-emerald-600" : "text-amber-600"}`}>
                {attendancePercentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-500">{presentDays}/{totalDays} Days</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${attendancePercentage >= 90 ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
              Today's RFID Status
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                student.attendanceStatus === "Boarded Pickup" ? "bg-blue-100 text-blue-800" :
                student.attendanceStatus === "Dropped at School" ? "bg-emerald-100 text-emerald-800" :
                student.attendanceStatus === "Absent" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
              }`}>
                {student.attendanceStatus}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block mt-1">Scanned: {student.lastStatusTime}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
              Pending Fee Balance
            </span>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-black font-mono ${balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                ₹{balance.toLocaleString("en-IN")}
              </span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {student.paymentStatus}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block font-medium">Due: {student.dueDate || "End of Term"}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
              Assigned Route & Van
            </span>
            <div className="font-extrabold text-xs text-slate-900 truncate">
              {assignedVehicle?.registrationNumber} ({assignedVehicle?.type?.split(" ")[0]})
            </div>
            <span className="text-[10px] text-slate-500 block truncate">
              {student.pickupStopName} ({student.distanceKm} km)
            </span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-4 flex-shrink-0">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`pb-3 font-extrabold text-sm transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "attendance"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Historical Attendance Logs ({attendanceHistory.length} Days)
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-3 font-extrabold text-sm transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "payments"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Fee Payments & Ledger History
          </button>
        </div>

        {/* Modal Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
          {/* TAB 1: HISTORICAL ATTENDANCE LOGS */}
          {activeTab === "attendance" && (
            <div className="space-y-4">
              {/* Filter pills & Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    RFID Boarding & Dropped Time Logs
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {["All", "Present", "Absent"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setAttendanceFilter(f)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        attendanceFilter === f
                          ? "bg-slate-900 text-amber-400 border-slate-800"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {f} Records
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance Log Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Date & Day</th>
                        <th className="py-3 px-4">Morning Pick-up Scan</th>
                        <th className="py-3 px-4">Evening Drop-off Scan</th>
                        <th className="py-3 px-4">Boarding Status</th>
                        <th className="py-3 px-4">Van & Scanner Hardware</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {filteredAttendance.map((rec) => (
                        <tr key={rec.id} className="hover:bg-amber-50/40 transition">
                          <td className="py-3.5 px-4 font-bold">
                            <span className="block text-slate-900">{rec.date}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-mono">{rec.dayName}</span>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              {rec.morningScan}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-500" />
                              {rec.eveningScan}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase ${
                                rec.status === "Boarded Pickup"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : rec.status === "Dropped at School"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : rec.status === "Absent"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {rec.status === "Absent" ? (
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              )}
                              {rec.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500">
                            <div className="text-[11px] font-bold text-slate-800">{rec.scannerDevice}</div>
                            <div className="text-[10px] text-slate-400">Driver: {rec.driverName}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENTS & FEE LEDGER HISTORY */}
          {activeTab === "payments" && (
            <div className="space-y-5">
              {/* Fee Demand & Calculation Breakdown Box */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-5 rounded-2xl shadow-md border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                      Fee Structure & Slab Breakdown
                    </span>
                    <h3 className="text-base font-black text-white">
                      Class {student.grade} • Transport Distance {student.distanceKm} KM
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Calculated Term Amount</span>
                    <strong className="text-xl font-mono text-amber-400">{billDetails.formattedTotalTerm}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-bold">Academic Tuition Term Fee</span>
                    <strong className="text-emerald-400 font-mono text-sm block mt-0.5">{billDetails.formattedTuition}</strong>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-bold">Monthly Transport Fee</span>
                    <strong className="text-blue-400 font-mono text-sm block mt-0.5">{billDetails.formattedTransportMonthly} / mo</strong>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-bold">Remaining Outstanding Balance</span>
                    <strong className={`font-mono text-sm block mt-0.5 ${balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      ₹{balance.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                {/* Proactive UPI Quick Pay Strip */}
                {balance > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
                      <div>
                        <span className="font-bold text-amber-200">Proactive Payment Reminder</span>
                        <p className="text-[11px] text-slate-300">
                          Scan & Pay exact pending balance of ₹{balance.toLocaleString("en-IN")} via Official UPI ID:{" "}
                          <strong className="text-amber-300 font-mono">{SCHOOL_INFO.upiId}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleCopyUpi}
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1 w-full sm:w-auto whitespace-nowrap"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                        {copiedUpi ? "UPI Copied!" : "Copy UPI ID"}
                      </button>

                      <button
                        onClick={handleTriggerAlertModal}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1 w-full sm:w-auto whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {alertSent ? "Reminder Sent!" : "Send Fee Alert"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Ledger History Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-black text-slate-900 text-sm">Official Payment Receipts & Ledger Entries</h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Verified by {SCHOOL_INFO.contactPerson}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Receipt No & Date</th>
                        <th className="py-3 px-4">Fee Description</th>
                        <th className="py-3 px-4">Amount Paid</th>
                        <th className="py-3 px-4">Method & UTR</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {paymentLedger.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 font-bold">
                            <span className="block text-slate-900 font-mono">{p.receiptNo}</span>
                            <span className="text-[10px] text-slate-500">{p.date}</span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs truncate">
                            <span className="font-semibold text-slate-900 block">{p.description}</span>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-sm">
                            {p.amountPaid > 0 ? `₹${p.amountPaid.toLocaleString("en-IN")}` : "₹0 (Demand)"}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-[11px] font-semibold text-slate-800">{p.method}</div>
                            <div className="text-[10px] font-mono text-slate-500">UTR: {p.utr}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              {p.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {p.amountPaid > 0 && onOpenReceipt && (
                              <button
                                onClick={() => handleGenerateReceiptFromModal(p)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" />
                                Receipt
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Wisdom School Official Student Academic & Transport History Ledger</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>

      {/* Student Digital ID Card Modal */}
      {showIdCard && (
        <StudentDigitalIdCardModal
          isOpen={showIdCard}
          student={student}
          students={[student]}
          vehicles={vehicles}
          onClose={() => setShowIdCard(false)}
        />
      )}
    </div>
  );
};
