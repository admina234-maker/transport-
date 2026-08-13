import React, { useState } from "react";
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Receipt,
  UserCheck,
  CreditCard,
  ChevronRight,
  BellRing,
  Camera,
  AlertTriangle,
  Wallet,
  Zap,
  Sparkles,
  ShieldAlert,
  Star,
  ThumbsUp,
  Send,
  MessageSquareQuote,
  Heart,
  Smile,
  Check,
  Filter,
  X
} from "lucide-react";
import { Student, Vehicle, NotificationLog, PaymentReceipt, TransportFeedback, FeedbackCategory } from "../types";
import { SCHOOL_INFO } from "../data/mockData";
import { calculateStudentTotalBill } from "../utils/feeCalculator";
import { UpiPaymentQrCode } from "./UpiPaymentQrCode";
import { CameraQrScanner } from "./CameraQrScanner";

interface ParentPortalProps {
  students: Student[];
  vehicles: Vehicle[];
  notifications: NotificationLog[];
  feedbackList?: TransportFeedback[];
  onAddFeedback?: (feedback: TransportFeedback) => void;
  onOpenReceipt: (receipt: PaymentReceipt) => void;
  onVerifyPayment: (paymentData: any) => Promise<PaymentReceipt>;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  students,
  vehicles,
  notifications,
  feedbackList = [],
  onAddFeedback,
  onOpenReceipt,
  onVerifyPayment,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || "STU-1001"
  );
  const [utrInput, setUtrInput] = useState<string>("");
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>("");
  const [isSubmittingUtr, setIsSubmittingUtr] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);

  // Parent Transport Feedback Module State
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>("Safety & Driving");
  const [feedbackComments, setFeedbackComments] = useState<string>("");
  const [selectedQuickTags, setSelectedQuickTags] = useState<string[]>([]);
  const [feedbackSuccessToast, setFeedbackSuccessToast] = useState<string | null>(null);

  const toggleQuickTag = (tag: string) => {
    setSelectedQuickTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const student = students.find((s) => s.id === selectedStudentId) || students[0];
  const vehicle = vehicles.find((v) => v.id === student?.assignedVehicleId) || vehicles[0];

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const formattedComments = feedbackComments.trim()
      ? (selectedQuickTags.length > 0 ? `[${selectedQuickTags.join(", ")}] ${feedbackComments.trim()}` : feedbackComments.trim())
      : (selectedQuickTags.length > 0 ? `[${selectedQuickTags.join(", ")}] Transport rating submitted by parent.` : "Parent transport rating submitted.");

    const newFeedback: TransportFeedback = {
      id: `FB-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      vehicleId: vehicle?.id || "VAN-01",
      routeName: vehicle?.routeName || "Route 1",
      driverName: vehicle?.driverName || "Driver",
      rating: feedbackRating,
      category: feedbackCategory,
      comments: formattedComments,
      submittedAt: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) + " at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    if (onAddFeedback) {
      onAddFeedback(newFeedback);
    }

    setFeedbackComments("");
    setSelectedQuickTags([]);
    setFeedbackSuccessToast(
      `Thank you, ${student.parentName}! Your ${feedbackRating}-star transport feedback for ${student.name}'s route (${vehicle?.driverName}) has been submitted successfully.`
    );
  };

  const billDetails = student
    ? calculateStudentTotalBill(
        student.grade,
        student.distanceKm,
        vehicle?.type || "Van (14-Seater)"
      )
    : null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(SCHOOL_INFO.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const calculateDueDaysInfo = (dueDateStr?: string) => {
    if (!dueDateStr) return { text: "Regular Billing Cycle", isOverdue: false, days: 0 };
    const today = new Date("2026-07-29"); // App anchor date
    const due = new Date(dueDateStr);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`, isOverdue: true, days: diffDays };
    } else if (diffDays === 0) {
      return { text: "Due Today (29 Jul)", isOverdue: false, days: 0 };
    } else {
      return { text: `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}`, isOverdue: false, days: diffDays };
    }
  };

  const handleQuickFillOutstanding = () => {
    const outstanding = student?.balanceRemaining ?? billDetails?.totalTermAmount ?? 0;
    setPaymentAmountInput(outstanding.toString());
    const el = document.getElementById("upi-payment-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrInput.trim()) {
      alert("Please enter the 12-digit UPI Bank Reference / UTR Number");
      return;
    }

    setIsSubmittingUtr(true);
    try {
      const amountToPay = paymentAmountInput
        ? parseFloat(paymentAmountInput)
        : billDetails?.totalTermAmount || 12800;

      const receipt = await onVerifyPayment({
        studentId: student.id,
        studentName: student.name,
        amount: amountToPay,
        utrNumber: utrInput.trim(),
        paymentMethod: "UPI Direct Transfer",
        feeType: "Tuition & Van Transport Term Fee",
      });

      setIsSubmittingUtr(false);
      setUtrInput("");
      onOpenReceipt(receipt);
    } catch (err) {
      setIsSubmittingUtr(false);
      alert("Verification failed. Please try again or contact Mr. R Saravanan.");
    }
  };

  const currentStop = vehicle?.stops[vehicle?.currentStopIndex || 0];
  const nextStop = vehicle?.stops[(vehicle?.currentStopIndex || 0) + 1] || currentStop;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Boarded Pickup":
        return "bg-blue-500 text-white border-blue-600";
      case "Dropped at School":
        return "bg-emerald-600 text-white border-emerald-700";
      case "Boarded Return":
        return "bg-amber-500 text-white border-amber-600";
      case "Dropped Home":
        return "bg-green-600 text-white border-green-700";
      default:
        return "bg-slate-200 text-slate-800 border-slate-300";
    }
  };

  return (
    <div id="parent-portal" className="space-y-6 pb-12">
      {/* Student Selector Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-blue-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-yellow-400 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              Wisdom Parent Mobile Dashboard
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-1">Student Transport Tracking</h2>
            <p className="text-xs text-blue-200">
              Real-time van location, RFID boarding status & instant UPI fee payment
            </p>
          </div>

          {/* Student Dropdown Switcher */}
          <div className="bg-slate-900/80 p-2 rounded-xl border border-blue-700/50 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">Select Ward</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer w-full"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name} ({s.grade}) - {s.pickupStopName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PROACTIVE VISUAL BALANCE INDICATOR BANNER */}
      {(() => {
        const dueInfo = calculateDueDaysInfo(student?.dueDate);
        const balance = student?.balanceRemaining ?? (student?.paymentStatus === "Paid" ? 0 : billDetails?.totalTermAmount ?? 0);
        const totalTerm = billDetails?.totalTermAmount || 12800;
        const paidAmount = Math.max(0, totalTerm - balance);
        const paidPercent = totalTerm > 0 ? Math.min(100, Math.round((paidAmount / totalTerm) * 100)) : 100;
        const isPending = balance > 0 || student?.paymentStatus !== "Paid";

        if (isPending) {
          const isOverdue = dueInfo.isOverdue || student?.paymentStatus === "Overdue";
          return (
            <div
              className={`rounded-2xl p-4 sm:p-5 shadow-xl border text-white transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isOverdue
                  ? "bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 border-rose-500/80"
                  : "bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 border-amber-500/80"
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 w-full">
                <div className={`p-3 rounded-2xl flex-shrink-0 ${isOverdue ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                  {isOverdue ? <ShieldAlert className="w-7 h-7 animate-pulse" /> : <Wallet className="w-7 h-7 animate-bounce" />}
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isOverdue ? "bg-rose-500 text-white" : "bg-amber-400 text-slate-950"}`}>
                      ⚡ Proactive Payment Encouragement Alert
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${isOverdue ? "bg-rose-900/60 text-rose-300 border-rose-700" : "bg-amber-900/60 text-amber-200 border-amber-700"}`}>
                      {dueInfo.text}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                    {student?.name}'s Outstanding Balance:{" "}
                    <span className={isOverdue ? "text-rose-400 font-mono" : "text-amber-300 font-mono"}>
                      ₹{balance.toLocaleString()}
                    </span>
                  </h3>

                  {/* Visual Balance Progress Scale */}
                  <div className="space-y-1 max-w-xl">
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>Paid: ₹{paidAmount.toLocaleString()} ({paidPercent}%)</span>
                      <span className={isOverdue ? "text-rose-300" : "text-amber-300"}>
                        Remaining Balance: ₹{balance.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden border border-slate-700/50 flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${paidPercent}%` }}
                        title={`Paid: ₹${paidAmount}`}
                      />
                      <div
                        className={`h-full transition-all duration-500 animate-pulse ${isOverdue ? "bg-rose-500" : "bg-amber-400"}`}
                        style={{ width: `${100 - paidPercent}%` }}
                        title={`Due: ₹${balance}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleQuickFillOutstanding}
                  className="px-4 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xl transition cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  Pay ₹{balance.toLocaleString()} via UPI
                </button>
                <span className="text-[10px] text-slate-400 text-center font-medium">
                  Zero Convenience Fee • Instant Verification
                </span>
              </div>
            </div>
          );
        }

        return (
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/50 rounded-2xl p-4 sm:p-5 shadow-xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 flex-shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-slate-950" /> Account Fully Clear
                  </span>
                  <span className="text-xs text-emerald-300 font-bold">Term Fee Verified</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  {student?.name}'s Tuition & Transport Balance: <span className="text-emerald-400 font-mono">₹0</span>
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  All transport and tuition term dues are settled. Active RFID Live Pass validated.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickFillOutstanding}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              View Fee Summary
            </button>
          </div>
        );
      })()}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Live Van Tracker & RFID Status */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Bus Location & Countdown Card */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <Bus className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {vehicle?.routeName || "Route 1"}
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Vehicle: <strong className="text-slate-800">{vehicle?.registrationNumber}</strong> ({vehicle?.type})
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live GPS
              </span>
            </div>

            {/* GPS Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Speed</span>
                <span className="text-lg font-black text-slate-900">{vehicle?.speedKmH || 38} <span className="text-xs font-normal">km/h</span></span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">ETA to Pickup</span>
                <span className="text-lg font-black text-emerald-600 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> 4 Mins
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Driver</span>
                <span className="text-xs font-bold text-slate-900 truncate block">{vehicle?.driverName}</span>
                <a href={`tel:${vehicle?.driverPhone}`} className="text-[11px] text-blue-600 font-bold hover:underline">
                  📞 {vehicle?.driverPhone}
                </a>
              </div>
            </div>

            {/* Animated Route Progress Bar */}
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 mb-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Next Stop: {nextStop?.stopName}
                </span>
                <span className="text-slate-300">{nextStop?.scheduledTimeMorning}</span>
              </div>

              <div className="relative pt-2 pb-1">
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-1000 w-3/4" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
                  <span>Start: {vehicle?.stops[0]?.stopName}</span>
                  <span className="text-yellow-400 font-bold">● Van Position</span>
                  <span>School Gate</span>
                </div>
              </div>
            </div>

            {/* Wisdom Nursery & Primary School Live Campus Google Map Embed */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
              <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 animate-bounce" />
                  <div>
                    <h4 className="text-xs font-black text-amber-400">Wisdom Nursery & Primary School Live Location</h4>
                    <p className="text-[10px] text-slate-300">Isur Chunambedu Road, Essur - 603310 (ஈசூர் - 603310) | GPS: 12.3036° N, 79.8615° E</p>
                  </div>
                </div>
                <a
                  href="https://maps.google.com/?q=12.3036078,79.8615042"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-lg text-[10px] font-black transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Maps
                </a>
              </div>
              <div className="relative w-full h-64 bg-slate-200">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3898.180805162009!2d79.8615042!3d12.303607800000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a53138de836231f%3A0xffcfb08b54f87691!2sWisdom%20nursery%20and%20primary%20school!5e0!3m2!1sen!2sin!4v1785154735752!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Wisdom Nursery and Primary School Live Google Map Location"
                />
              </div>
            </div>
          </div>

          {/* Student RFID Boarding Card */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center font-black text-slate-900 text-lg shadow">
                  {student?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">{student?.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Class: <strong className="text-slate-800">{student?.grade}</strong> | Roll: {student?.rollNumber}
                  </p>
                </div>
              </div>

              <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${getStatusColor(student?.attendanceStatus || "")}`}>
                {student?.attendanceStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-[11px] font-medium block">Pickup Point</span>
                <strong className="text-slate-900 font-bold block">{student?.pickupStopName}</strong>
                <span className="text-slate-500 text-[11px]">{student?.distanceKm} km from Wisdom School</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-[11px] font-medium block">Last RFID Scan</span>
                <strong className="text-emerald-700 font-bold block">{student?.lastStatusTime}</strong>
                <span className="text-slate-500 text-[11px]">Tag ID: {student?.rfidTagId}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 text-[11px] font-medium block">Term Dues & Balance</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <strong className={`text-sm font-black ${(student?.balanceRemaining ?? 0) > 0 ? "text-amber-600" : "text-emerald-700"}`}>
                    {(student?.balanceRemaining ?? 0) > 0 ? `₹${(student?.balanceRemaining ?? 0).toLocaleString()} Due` : "₹0 Clear"}
                  </strong>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                    student?.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" :
                    student?.paymentStatus === "Overdue" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {student?.paymentStatus}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  Due: {student?.dueDate || "End of Term"}
                </span>
              </div>
            </div>

            {/* Direct Emergency Contact Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-semibold">
                <Phone className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Transport Manager: <strong>{SCHOOL_INFO.contactPerson}</strong> ({SCHOOL_INFO.contactPhone})</span>
              </div>
              <a
                href={`tel:${SCHOOL_INFO.contactPhone}`}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded-lg text-xs transition whitespace-nowrap"
              >
                Call Now
              </a>
            </div>
          </div>

          {/* Live Notification Logs Feed */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base mb-3 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-indigo-600" />
              Recent Parent WhatsApp / SMS Alerts
            </h3>

            <div className="space-y-3">
              {notifications
                .filter((n) => n.studentId === student?.id || n.studentName === student?.name)
                .map((notif) => (
                  <div key={notif.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start gap-3">
                    <span className="p-1.5 bg-green-100 text-green-700 rounded-lg flex-shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4" />
                    </span>
                    <div className="flex-1 space-y-1">
                      <p className="text-slate-800 font-medium leading-relaxed">{notif.message}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                        <span>{notif.timestamp}</span>
                        <span className="bg-green-100 text-green-800 px-1.5 py-0.2 rounded font-bold">{notif.type}</span>
                        <span className="text-emerald-600 font-bold">✓ {notif.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Secure Online UPI Payment & Fee Portal */}
        <div id="upi-payment-section" className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Wisdom Online Payment Gateway</h3>
                  <p className="text-xs text-slate-500 font-medium">Official UPI Fee Pay for {student?.name}</p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                Zero Convenience Fee
              </span>
            </div>

            {/* Total Fee Itemized Summary */}
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Tuition Fee ({student?.grade})</span>
                <span className="font-mono font-semibold">{billDetails?.formattedTuition}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Van Transport Fee ({student?.distanceKm} km slab)</span>
                <span className="font-mono font-semibold">{billDetails?.formattedTransportTerm}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>GPS Live Alert Charge</span>
                <span className="font-mono font-semibold">₹150</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-sm sm:text-base font-bold">
                <span className="text-yellow-400">Total Term Amount</span>
                <span className="text-yellow-400 font-mono text-lg">{billDetails?.formattedTotalTerm}</span>
              </div>

              {(student?.balanceRemaining ?? 0) > 0 && (
                <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Unpaid Balance Remaining
                  </span>
                  <span className="font-mono text-sm text-amber-300">₹{(student?.balanceRemaining).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Proactive One-Tap Payment Chip */}
            {(student?.balanceRemaining ?? 0) > 0 && (
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-yellow-500/15 border border-amber-400/40 p-3 rounded-xl flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/20 text-amber-600 rounded-lg">
                    <Zap className="w-4 h-4 fill-amber-500 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Proactive Early Payment</span>
                    <span className="text-[10px] text-slate-600 font-semibold block">Quick-fill exact pending balance of ₹{(student?.balanceRemaining).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFillOutstanding}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow transition cursor-pointer whitespace-nowrap"
                >
                  Fill ₹{(student?.balanceRemaining).toLocaleString()}
                </button>
              </div>
            )}

            {/* Official UPI Payment Box with Mr. R Saravanan's Details */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                    Beneficiary Account
                  </span>
                  <h4 className="font-black text-slate-900 text-base mt-1">{SCHOOL_INFO.upiName}</h4>
                  <p className="text-xs text-slate-600 font-mono flex items-center gap-1 mt-0.5">
                    UPI ID: <strong className="text-slate-900 select-all">{SCHOOL_INFO.upiId}</strong>
                  </p>
                </div>

                <button
                  onClick={handleCopyUpi}
                  className="p-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  title="Copy UPI ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedUpi ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Direct UPI Apps Quick Buttons */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase block">
                  Click to Pay via Installed UPI App:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <a
                    href={`upi://pay?pa=${SCHOOL_INFO.upiId}&pn=${encodeURIComponent(
                      SCHOOL_INFO.upiName
                    )}&am=${billDetails?.totalTermAmount || 12800}&cu=INR&tn=${encodeURIComponent(
                      `Wisdom Fee ${student?.name} ${student?.rollNumber}`
                    )}`}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-center flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    Google Pay / GPay
                  </a>
                  <a
                    href={`upi://pay?pa=${SCHOOL_INFO.upiId}&pn=${encodeURIComponent(
                      SCHOOL_INFO.upiName
                    )}&am=${billDetails?.totalTermAmount || 12800}&cu=INR&tn=${encodeURIComponent(
                      `Wisdom Fee ${student?.name} ${student?.rollNumber}`
                    )}`}
                    className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-center flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    PhonePe / Paytm
                  </a>
                </div>
              </div>

              {/* QR Code Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold p-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-yellow-400" />
                  Show UPI QR Code
                </button>

                <button
                  type="button"
                  onClick={() => setShowCameraScanner(true)}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold p-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-300 animate-pulse" />
                  Scan QR with Camera
                </button>
              </div>
            </div>

            {/* Form: Submit UTR & Generate Verified Receipt */}
            <form onSubmit={handlePaySubmit} className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-extrabold text-slate-900 block">
                Step 2: Enter 12-Digit Bank UTR / Ref No. After Payment
              </label>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="e.g. 420192837102 (12-digit UTR)"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  maxLength={16}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                <input
                  type="number"
                  placeholder={`Amount Paid (Default: ₹${billDetails?.totalTermAmount || 12800})`}
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingUtr}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmittingUtr ? (
                  "Verifying Transaction..."
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    Verify Payment & Issue Official Receipt
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* PARENT TRANSPORT SERVICE FEEDBACK & RATINGS MODULE */}
      <div id="transport-feedback-module" className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-6">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl border border-amber-200/80">
              <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-300">
                  Parent Voice & Quality Assurance
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  Assigned Route: <strong className="text-slate-900">{vehicle?.routeName}</strong>
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                Transport Service Feedback & Ratings
              </h3>
              <p className="text-xs text-slate-500">
                Rate driver punctuality, vehicle safety & cleanliness for <strong>{student?.name}</strong>'s van service ({vehicle?.driverName})
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-500 font-extrabold block">Avg Transport Rating</span>
              <div className="flex items-center gap-1 font-black text-slate-900 text-base">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>
                  {feedbackList.length > 0
                    ? (
                        feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length
                      ).toFixed(1)
                    : "4.8"}{" "}
                  / 5.0
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200">
              {feedbackList.length} Parent Review{feedbackList.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Success Alert Toast Banner */}
        {feedbackSuccessToast && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold animate-in fade-in duration-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{feedbackSuccessToast}</span>
            </div>
            <button
              onClick={() => setFeedbackSuccessToast(null)}
              className="text-emerald-800 hover:text-emerald-950 font-bold p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2-Column Grid: Form on Left (7 cols), Submitted History on Right (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Submission Form */}
          <form onSubmit={handleFeedbackSubmit} className="lg:col-span-7 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-amber-600" />
              Submit Rating & Comments for {student?.name}
            </h4>

            {/* Ward Context info banner */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-amber-300">
                <span>🚌 {vehicle?.routeName}</span>
                <span className="text-slate-300 font-mono text-[11px]">{vehicle?.registrationNumber}</span>
              </div>
              <div className="text-slate-300 flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                <span>Driver: <strong>{vehicle?.driverName}</strong></span>
                <span>Pickup Stop: <strong>{student?.pickupStopName}</strong></span>
              </div>
            </div>

            {/* Interactive Star Rating Selector */}
            <div>
              <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                1. Overall Transport Service Rating <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded-lg hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || feedbackRating) >= star
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-300 fill-slate-100"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-black text-slate-800 sm:ml-2">
                  {feedbackRating === 5 && "⭐ 5 - Excellent (Highly Satisfied)"}
                  {feedbackRating === 4 && "⭐ 4 - Very Good (Satisfied)"}
                  {feedbackRating === 3 && "⭐ 3 - Average (Needs Minor Tweaks)"}
                  {feedbackRating === 2 && "⭐ 2 - Below Average (Issues Noticed)"}
                  {feedbackRating === 1 && "⭐ 1 - Poor (Requires Immediate Check)"}
                </span>
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                2. Primary Feedback Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {(
                  [
                    "Safety & Driving",
                    "Punctuality",
                    "Vehicle Cleanliness",
                    "Staff Courtesy",
                    "General Feedback",
                  ] as FeedbackCategory[]
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFeedbackCategory(cat)}
                    className={`p-2.5 rounded-xl border font-bold text-left transition cursor-pointer ${
                      feedbackCategory === cat
                        ? "bg-amber-400 border-amber-500 text-slate-950 shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {cat === "Safety & Driving" && "🛡️ Safety & Driving"}
                    {cat === "Punctuality" && "⏱️ Punctuality"}
                    {cat === "Vehicle Cleanliness" && "🧹 Cleanliness"}
                    {cat === "Staff Courtesy" && "🤝 Staff Courtesy"}
                    {cat === "General Feedback" && "💬 General Feedback"}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Compliment / Concern Tag Pills */}
            <div>
              <label className="text-xs font-extrabold text-slate-800 block mb-1.5">
                3. Quick Feedback Highlights (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Punctual Pickup & Drop",
                  "Gentle Driver Speeds",
                  "Polite Conductor / Helper",
                  "Clean Seats & Ventilation",
                  "Timely WhatsApp SMS Alerts",
                  "Safe Boarding Assistance",
                  "Accurate GPS Location",
                ].map((tag) => {
                  const isSelected = selectedQuickTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleQuickTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? "bg-slate-900 text-amber-300 border border-slate-800"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-amber-400" /> : "+"}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments Textarea */}
            <div>
              <label className="text-xs font-extrabold text-slate-800 block mb-1">
                4. Detailed Comments or Suggestions
              </label>
              <textarea
                rows={3}
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder={`Share your experience regarding ${student?.name}'s school transport journey, driver punctuality, or suggestions for school transport management...`}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-slate-950" />
              Submit Transport Feedback
            </button>
          </form>

          {/* Right Side: Submitted Feedback History for Ward / Route */}
          <div className="lg:col-span-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-200/80 pb-2">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  Recent Parent Reviews ({feedbackList.length})
                </h4>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Feed
                </span>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {feedbackList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">
                    No feedback recorded yet. Be the first to submit feedback!
                  </p>
                ) : (
                  feedbackList.map((fb) => (
                    <div
                      key={fb.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= fb.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-200 fill-slate-100"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-amber-200">
                          {fb.category}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                        "{fb.comments}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
                        <span>
                          👤 <strong>{fb.parentName}</strong> ({fb.studentName})
                        </span>
                        <span className="font-mono text-slate-400">{fb.submittedAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-950 space-y-0.5 mt-2">
              <span className="font-extrabold block">💡 School Transport Assurance:</span>
              <p className="text-amber-900 leading-snug">
                All submitted ratings are directly summarized into our <strong>Analytics Dashboard</strong> for Chief Transport Officer Mr. R Saravanan to evaluate monthly driver performance & fleet safety.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Scan-Ready UPI QR Code Modal Display */}
      {showQrModal && (
        <UpiPaymentQrCode
          studentName={student?.name || "Wisdom Student"}
          studentRoll={student?.rollNumber}
          grade={student?.grade}
          amount={billDetails?.totalTermAmount || 12800}
          feeType="School Tuition & Transport Term Fee"
          onClose={() => setShowQrModal(false)}
          isModal={true}
        />
      )}

      {/* Camera Hardware QR Scanner Modal */}
      {showCameraScanner && (
        <CameraQrScanner
          defaultStudentName={student?.name || "Wisdom Student"}
          onScanSuccess={(scanned) => {
            if (scanned.amount) {
              setPaymentAmountInput(scanned.amount.toString());
            }
          }}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
    </div>
  );
};
