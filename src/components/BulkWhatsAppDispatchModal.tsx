import React, { useState } from "react";
import {
  X,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Users,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  Zap,
  CreditCard,
  Building2
} from "lucide-react";
import { Student, Vehicle } from "../types";

interface BulkWhatsAppDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: Student[];
  vehicles: Vehicle[];
}

export const BulkWhatsAppDispatchModal: React.FC<BulkWhatsAppDispatchModalProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  vehicles,
}) => {
  const [msgTemplate, setMsgTemplate] = useState<"id_card" | "fee_alert" | "schedule" | "custom">("id_card");
  const [customText, setCustomText] = useState<string>("");
  const [sentStudentIds, setSentStudentIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  if (!isOpen || selectedStudents.length === 0) return null;

  const currentStudent = selectedStudents[currentIndex] || selectedStudents[0];
  const activeVehicle =
    vehicles.find((v) => v.id === currentStudent?.assignedVehicleId) ||
    vehicles.find((v) => v.routeName === currentStudent?.assignedRouteName) ||
    vehicles[0];

  const getFormattedMessageForStudent = (s: Student) => {
    const veh =
      vehicles.find((v) => v.id === s.assignedVehicleId) ||
      vehicles.find((v) => v.routeName === s.assignedRouteName) ||
      vehicles[0];

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://wisdomschool.edu.in";
    const portalUrl = `${baseUrl}/?studentId=${s.id}&tab=parent`;

    if (msgTemplate === "id_card") {
      return `🪪 *WISDOM NURSERY & PRIMARY SCHOOL - ESSUR CAMPUS*\n*OFFICIAL STUDENT TRANSPORT DIGITAL ID CARD*\n\nDear Parent (*${s.parentName}*),\n\nHere is the digital transport ID pass for your ward:\n👤 Student: *${s.name}* (Roll: *${s.rollNumber}*)\n🏫 Grade: ${s.grade}\n🚌 Route: *${s.assignedRouteName}*\n🚏 Stop: ${s.pickupStopName} (${s.distanceKm} km)\n🚐 Vehicle No: ${veh?.registrationNumber || "TN-21-AZ-4921"}\n🏷️ RFID Tag: ${s.rfidTagId}\n\n📱 View Live Parent Portal & Pass: ${portalUrl}\n\nFor transport queries, contact Chief Transport Desk: +91 9176593129.`;
    } else if (msgTemplate === "fee_alert") {
      return `💰 *WISDOM PRIMARY SCHOOL - TRANSPORT FEE REMINDER*\n\nDear Parent (*${s.parentName}*),\n\nTransport fee for *${s.name}* (Grade ${s.grade}, Roll ${s.rollNumber}) is currently pending.\n\n💵 Monthly Transport Fee: ₹${s.transportFeePerMonth}\n💳 Remaining Balance: ₹${s.balanceRemaining || s.transportFeePerMonth}\n📅 Due Date: ${s.dueDate || "31st July 2026"}\n\nClear fee instantly via UPI ID: *admissionschool493@okicici*\nParent Portal Link: ${portalUrl}\n\nThank you!`;
    } else if (msgTemplate === "schedule") {
      return `🚌 *WISDOM SCHOOL - VAN SCHEDULE & ROUTE NOTICE*\n\nDear Parent (*${s.parentName}*),\n\nPickup schedule for *${s.name}* on Route *${s.assignedRouteName}*:\n🚏 Pickup Point: ${s.pickupStopName}\n⏰ Morning Pickup: 07:45 AM\n👨‍✈️ Driver: ${veh?.driverName || "Mr. S. Kumar"} (${veh?.driverPhone || "9840123456"})\n\nPlease ensure student is at pickup stop 5 minutes prior.\nPortal: ${portalUrl}`;
    } else {
      return customText
        .replace(/{student_name}/g, s.name)
        .replace(/{roll_number}/g, s.rollNumber)
        .replace(/{parent_name}/g, s.parentName)
        .replace(/{grade}/g, s.grade)
        .replace(/{route}/g, s.assignedRouteName)
        .replace(/{stop}/g, s.pickupStopName)
        .replace(/{portal_link}/g, portalUrl);
    }
  };

  const currentMessageText = getFormattedMessageForStudent(currentStudent);

  // Send WhatsApp to current index parent
  const handleSendCurrentWhatsApp = () => {
    const cleanPhone = currentStudent.parentPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(currentMessageText)}`;
    
    window.open(url, "_blank");

    // Mark sent
    const updated = new Set(sentStudentIds);
    updated.add(currentStudent.id);
    setSentStudentIds(updated);

    // Auto advance if not at last
    if (currentIndex < selectedStudents.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Copy all contact list
  const handleCopyAllPhoneNumbers = () => {
    const list = selectedStudents
      .map((s) => `${s.name} (${s.parentName}): ${s.parentPhone}`)
      .join("\n");
    navigator.clipboard.writeText(list);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const sentCount = sentStudentIds.size;
  const progressPercent = Math.round((sentCount / selectedStudents.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono">
                  WhatsApp Direct Broadcaster
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  {selectedStudents.length} Parents Selected
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                Bulk Parent WhatsApp Dispatcher Queue
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

        {/* Progress Tracker Bar */}
        <div className="bg-emerald-950 text-white p-3 px-6 border-b border-emerald-800/60 flex items-center justify-between text-xs font-bold shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400">Queue Progress:</span>
            <span className="font-mono text-white text-sm">
              {sentCount} / {selectedStudents.length} Sent ({progressPercent}%)
            </span>
          </div>

          <div className="w-48 bg-emerald-900/80 rounded-full h-2.5 overflow-hidden border border-emerald-700">
            <div
              className="bg-emerald-400 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="p-6 bg-slate-50 overflow-y-auto flex-1 space-y-6">
          {/* Template Switcher */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
              1. Select Broadcast Message Template:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setMsgTemplate("id_card")}
                className={`p-2.5 rounded-xl text-xs font-bold transition text-left border flex flex-col items-start gap-1 cursor-pointer ${
                  msgTemplate === "id_card"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/40"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Digital ID Pass Link</span>
              </button>

              <button
                type="button"
                onClick={() => setMsgTemplate("fee_alert")}
                className={`p-2.5 rounded-xl text-xs font-bold transition text-left border flex flex-col items-start gap-1 cursor-pointer ${
                  msgTemplate === "fee_alert"
                    ? "bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-400/40"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Zap className="w-4 h-4 text-amber-600" />
                <span>Transport Fee Alert</span>
              </button>

              <button
                type="button"
                onClick={() => setMsgTemplate("schedule")}
                className={`p-2.5 rounded-xl text-xs font-bold transition text-left border flex flex-col items-start gap-1 cursor-pointer ${
                  msgTemplate === "schedule"
                    ? "bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-400/40"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Van Schedule Notice</span>
              </button>

              <button
                type="button"
                onClick={() => setMsgTemplate("custom")}
                className={`p-2.5 rounded-xl text-xs font-bold transition text-left border flex flex-col items-start gap-1 cursor-pointer ${
                  msgTemplate === "custom"
                    ? "bg-purple-50 border-purple-500 text-purple-950 ring-2 ring-purple-400/40"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span>Custom Message</span>
              </button>
            </div>

            {msgTemplate === "custom" && (
              <div className="pt-2 space-y-1.5">
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type custom text... Available variables: {student_name}, {roll_number}, {parent_name}, {grade}, {route}, {stop}, {portal_link}"
                  className="w-full h-24 p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 font-mono">
                  Supported placeholders: {"{student_name}"}, {"{parent_name}"}, {"{portal_link}"}
                </p>
              </div>
            )}
          </div>

          {/* Queue Focus Card: Current Selected Parent */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                  Current Parent Target ({currentIndex + 1} of {selectedStudents.length})
                </span>
                <h4 className="text-base font-extrabold text-white">
                  {currentStudent.parentName} • Ward: {currentStudent.name}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-extrabold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800 text-xs">
                  📞 {currentStudent.parentPhone}
                </span>

                {sentStudentIds.has(currentStudent.id) ? (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </span>
                )}
              </div>
            </div>

            {/* Live Message Preview Box */}
            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {currentMessageText}
            </div>

            {/* Trigger Button & Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold transition cursor-pointer"
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  disabled={currentIndex === selectedStudents.length - 1}
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold transition cursor-pointer"
                >
                  Next →
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSendCurrentWhatsApp}
                  className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-emerald-300"
                >
                  <Send className="w-4 h-4 fill-slate-950" />
                  <span>Send via WhatsApp Web Now</span>
                </button>
              </div>
            </div>
          </div>

          {/* Roster Target List Table */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Full Queue Roster ({selectedStudents.length} Recipients)
              </h5>
              <button
                type="button"
                onClick={handleCopyAllPhoneNumbers}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300 transition"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? "Copied Phone Numbers!" : "Copy All Phone List"}</span>
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              {selectedStudents.map((s, idx) => {
                const isCurrent = idx === currentIndex;
                const isSent = sentStudentIds.has(s.id);
                const txt = getFormattedMessageForStudent(s);

                return (
                  <div
                    key={s.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                      isCurrent ? "bg-amber-50/80 font-bold border-l-4 border-amber-500" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center border border-slate-200 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <strong className="text-slate-900 block truncate">{s.name} ({s.rollNumber})</strong>
                        <span className="text-[11px] text-slate-500 block truncate">Parent: {s.parentName} • 📞 {s.parentPhone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">{s.assignedRouteName}</span>
                      {isSent ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sent
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex(idx);
                            const cleanPhone = s.parentPhone.replace(/\D/g, "");
                            const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                            const url = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(txt)}`;
                            window.open(url, "_blank");
                            const updated = new Set(sentStudentIds);
                            updated.add(s.id);
                            setSentStudentIds(updated);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-sm cursor-pointer"
                        >
                          <Send className="w-3 h-3" /> WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500">
            Wisdom School Bulk WhatsApp Dispatch Engine • Academic Session 2026–27
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
