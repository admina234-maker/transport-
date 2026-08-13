import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  Download,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Users,
  Zap,
  Info,
  DollarSign,
  Copy,
  Check,
  RotateCcw,
  BellRing,
  Radio
} from "lucide-react";
import { NotificationLog, Student, Vehicle } from "../types";

interface BulkNotificationDashboardProps {
  notifications: NotificationLog[];
  students: Student[];
  vehicles: Vehicle[];
  onSendNotificationBatch: (logs: NotificationLog[]) => void;
}

export const BulkNotificationDashboard: React.FC<BulkNotificationDashboardProps> = ({
  notifications,
  students,
  vehicles,
  onSendNotificationBatch,
}) => {
  // Filters State
  const [selectedChannel, setSelectedChannel] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Bulk Dispatch Modal & Form State
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [targetGroup, setTargetGroup] = useState<string>("all"); // 'all', 'overdue', 'grade', 'route'
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("LKG");
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>(vehicles[0]?.routeName || "");
  const [dispatchType, setDispatchType] = useState<"WhatsApp" | "SMS" | "Both">("WhatsApp");
  const [dispatchCategory, setDispatchCategory] = useState<"Fee Reminder" | "Boarding Alert" | "Attendance" | "Emergency" | "General Broadcast">("General Broadcast");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [isSendingBatch, setIsSendingBatch] = useState<boolean>(false);
  const [sendingProgress, setSendingProgress] = useState<number>(0);
  const [lastBatchResult, setLastBatchResult] = useState<{ total: number; success: number; failed: number } | null>(null);

  // Copy notification ID feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick Message Templates
  const TEMPLATES = [
    {
      title: "🚨 Heavy Rain / Weather Delay Notice",
      category: "Emergency" as const,
      text: "WEATHER ALERT: Dear Parents, due to heavy morning rain in Cheyyar/Essur area, school vans may run 10-15 mins behind schedule. Drivers are navigating safely. Contact Chief Officer Mr. R SARAVANAN (9176593129) for live updates.",
    },
    {
      title: "💰 Overdue Transport Fee Reminder",
      category: "Fee Reminder" as const,
      text: "FEE REMINDER: Dear Parent, monthly transport fee for your ward is pending. Kindly clear payment via UPI ID admissionschool493@okicici or cash at school office to keep van pass active.",
    },
    {
      title: "🚌 Route Schedule & Driver Shift Notice",
      category: "General Broadcast" as const,
      text: "VAN SCHEDULE UPDATE: Morning pickup timings for Route 1 (Essur - Cheyyar) shifted 5 mins earlier starting tomorrow. Please ensure student is ready at pickup stop on time.",
    },
    {
      title: "🏫 Parent-Teacher Meeting Invitation",
      category: "General Broadcast" as const,
      text: "NOTICE: Parent-Teacher Interaction scheduled for this Saturday at Wisdom School Campus. Transport services available for attending parents. Please confirm attendance.",
    },
  ];

  // Calculated Metrics
  const metrics = useMemo(() => {
    const total = notifications.length;
    const delivered = notifications.filter((n) => n.status === "Delivered").length;
    const sent = notifications.filter((n) => n.status === "Sent").length;
    const failed = notifications.filter((n) => n.status === "Failed").length;
    const pending = notifications.filter((n) => n.status === "Pending").length;

    const successRate = total > 0 ? Math.round(((delivered + sent) / total) * 100) : 100;

    // Channel stats
    const whatsapp = notifications.filter((n) => n.type === "WhatsApp");
    const whatsappTotal = whatsapp.length;
    const whatsappDelivered = whatsapp.filter((n) => n.status === "Delivered" || n.status === "Sent").length;
    const whatsappRate = whatsappTotal > 0 ? Math.round((whatsappDelivered / whatsappTotal) * 100) : 100;

    const sms = notifications.filter((n) => n.type === "SMS");
    const smsTotal = sms.length;
    const smsDelivered = sms.filter((n) => n.status === "Delivered" || n.status === "Sent").length;
    const smsRate = smsTotal > 0 ? Math.round((smsDelivered / smsTotal) * 100) : 100;

    // Estimated costs (SMS ₹0.15, WhatsApp ₹0.35)
    const totalCost = notifications.reduce((sum, n) => {
      const cost = n.channelCost ?? (n.type === "WhatsApp" ? 0.35 : 0.15);
      return sum + cost;
    }, 0);

    return {
      total,
      delivered,
      sent,
      failed,
      pending,
      successRate,
      whatsappTotal,
      whatsappDelivered,
      whatsappRate,
      smsTotal,
      smsDelivered,
      smsRate,
      totalCost: totalCost.toFixed(2),
    };
  }, [notifications]);

  // Target Recipients Filter Calculation
  const targetRecipients = useMemo(() => {
    if (targetGroup === "all") {
      return students;
    }
    if (targetGroup === "overdue") {
      return students.filter((s) => s.paymentStatus === "Overdue" || (s.balanceRemaining && s.balanceRemaining > 0));
    }
    if (targetGroup === "grade") {
      return students.filter((s) => s.grade === selectedGradeFilter);
    }
    if (targetGroup === "route") {
      return students.filter((s) => s.assignedRouteName === selectedRouteFilter);
    }
    return students;
  }, [students, targetGroup, selectedGradeFilter, selectedRouteFilter]);

  // Filtered Notifications List
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (selectedChannel !== "All" && n.type !== selectedChannel) return false;
      if (selectedStatus !== "All" && n.status !== selectedStatus) return false;
      if (selectedCategory !== "All" && n.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = n.studentName.toLowerCase().includes(q);
        const matchPhone = n.parentPhone.includes(q);
        const matchMsg = n.message.toLowerCase().includes(q);
        const matchReason = n.failureReason?.toLowerCase().includes(q) || false;
        if (!matchName && !matchPhone && !matchMsg && !matchReason) return false;
      }
      return true;
    });
  }, [notifications, selectedChannel, selectedStatus, selectedCategory, searchQuery]);

  // Handle Bulk Dispatch Simulation
  const handleExecuteDispatch = () => {
    if (!customMessage.trim()) {
      alert("Please enter a message content or select a template to broadcast.");
      return;
    }
    if (targetRecipients.length === 0) {
      alert("No student recipients match the selected target group filter.");
      return;
    }

    setIsSendingBatch(true);
    setSendingProgress(10);

    // Simulate batch network latency with progress steps
    const interval = setInterval(() => {
      setSendingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setSendingProgress(100);

      const now = new Date();
      const timeString = `${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} Today`;

      const newLogs: NotificationLog[] = [];
      let successCount = 0;
      let failCount = 0;

      targetRecipients.forEach((stu, idx) => {
        // Determine channel type
        const actualType = dispatchType === "Both" ? (idx % 2 === 0 ? "WhatsApp" : "SMS") : dispatchType;

        // Simulate rare delivery failure (e.g., 8% chance due to network coverage/invalid number)
        const isFailure = idx === 3 || (Math.random() < 0.08 && targetRecipients.length > 5);

        if (isFailure) {
          failCount++;
        } else {
          successCount++;
        }

        const log: NotificationLog = {
          id: `NOTIF-BULK-${Date.now()}-${idx}`,
          studentId: stu.id,
          studentName: stu.name,
          parentPhone: stu.parentPhone,
          message: customMessage.replace("{studentName}", stu.name).replace("{grade}", stu.grade),
          timestamp: timeString,
          type: actualType,
          status: isFailure ? "Failed" : "Delivered",
          failureReason: isFailure
            ? actualType === "WhatsApp"
              ? "WhatsApp Number Unregistered / Subscriber Opted Out"
              : "Telecom Carrier Timeout / Subscriber Out of Coverage Area"
            : undefined,
          category: dispatchCategory,
          channelCost: actualType === "WhatsApp" ? 0.35 : 0.15,
          carrierName: actualType === "WhatsApp" ? "WhatsApp Business Cloud API" : "Airtel / Jio DLT Gateway",
          deliveredAt: isFailure ? undefined : timeString,
          grade: stu.grade,
          routeName: stu.assignedRouteName,
        };

        newLogs.push(log);
      });

      onSendNotificationBatch(newLogs);
      setIsSendingBatch(false);
      setSendingProgress(0);
      setLastBatchResult({ total: targetRecipients.length, success: successCount, failed: failCount });
      setShowDispatchModal(false);
      setCustomMessage("");
    }, 1200);
  };

  // Retry Failed Message with fallback channel
  const handleRetryFailedLog = (log: NotificationLog) => {
    const fallbackType = log.type === "WhatsApp" ? "SMS" : "WhatsApp";
    const now = new Date();
    const timeString = `${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} Today (Retry)`;

    const retriedLog: NotificationLog = {
      ...log,
      id: `NOTIF-RETRY-${Date.now()}`,
      type: fallbackType,
      status: "Delivered",
      failureReason: undefined,
      timestamp: timeString,
      deliveredAt: timeString,
      channelCost: fallbackType === "WhatsApp" ? 0.35 : 0.15,
      carrierName: fallbackType === "WhatsApp" ? "WhatsApp Business Cloud API (Fallback)" : "Airtel DLT Gateway (Fallback)",
    };

    onSendNotificationBatch([retriedLog]);
    alert(`Successfully re-sent notification to ${log.studentName}'s parent (${log.parentPhone}) via fallback channel: ${fallbackType}.`);
  };

  // Bulk Retry All Failed Messages
  const handleBulkRetryAllFailed = () => {
    const failedLogs = notifications.filter((n) => n.status === "Failed");
    if (failedLogs.length === 0) {
      alert("No failed notifications found to retry.");
      return;
    }

    const now = new Date();
    const timeString = `${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} Today (Bulk Retry)`;

    const retriedBatch: NotificationLog[] = failedLogs.map((log, idx) => {
      const fallbackType = log.type === "WhatsApp" ? "SMS" : "WhatsApp";
      return {
        ...log,
        id: `NOTIF-RETRY-BULK-${Date.now()}-${idx}`,
        type: fallbackType,
        status: "Delivered",
        failureReason: undefined,
        timestamp: timeString,
        deliveredAt: timeString,
        channelCost: fallbackType === "WhatsApp" ? 0.35 : 0.15,
        carrierName: fallbackType === "WhatsApp" ? "WhatsApp Cloud API (Fallback)" : "Jio DLT Gateway (Fallback)",
      };
    });

    onSendNotificationBatch(retriedBatch);
    alert(`Successfully retried ${failedLogs.length} failed notifications using SMS/WhatsApp fallback channels!`);
  };

  // Export CSV Audit Report
  const handleExportCSV = () => {
    if (filteredNotifications.length === 0) {
      alert("No records to export.");
      return;
    }

    const headers = ["Notification ID", "Student Name", "Grade", "Parent Phone", "Channel", "Status", "Category", "Carrier", "Timestamp", "Message", "Failure Reason"];
    const rows = filteredNotifications.map((n) => [
      n.id,
      `"${n.studentName}"`,
      `"${n.grade || ""}"`,
      `"${n.parentPhone}"`,
      n.type,
      n.status,
      `"${n.category || ""}"`,
      `"${n.carrierName || ""}"`,
      `"${n.timestamp}"`,
      `"${n.message.replace(/"/g, '""')}"`,
      `"${n.failureReason || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Wisdom_School_Notification_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy log text snippet
  const handleCopyLog = (log: NotificationLog) => {
    const text = `[Wisdom School Notification Log]\nID: ${log.id}\nStudent: ${log.studentName}\nPhone: ${log.parentPhone}\nType: ${log.type}\nStatus: ${log.status}\nTime: ${log.timestamp}\nMessage: ${log.message}`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 flex-shrink-0">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Bulk Notification & Communication Dashboard
              </h2>
              <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-400 font-extrabold text-[11px] rounded-full border border-emerald-500/30 uppercase flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> DLT & Meta API Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Real-time delivery status monitoring, channel success rates, and automated SMS & WhatsApp parent broadcast dispatcher.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setShowDispatchModal(true)}
            className="flex-1 md:flex-none px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 text-amber-300" />
            Send Bulk Parent Broadcast
          </button>
        </div>
      </div>

      {/* Batch Dispatch Result Alert Banner */}
      {lastBatchResult && (
        <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <strong className="text-white font-bold">Bulk Broadcast Completed Successfully!</strong>
              <span className="block text-emerald-300 text-xs">
                Dispatched to {lastBatchResult.total} parent numbers | Delivered: {lastBatchResult.success} | Failed: {lastBatchResult.failed}
              </span>
            </div>
          </div>
          <button
            onClick={() => setLastBatchResult(null)}
            className="text-emerald-400 hover:text-white p-1 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KEY DELIVERY PERFORMANCE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Success Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Overall Delivery Success
            </span>
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{metrics.successRate}%</span>
              <span className="text-xs text-slate-500 font-bold">({metrics.delivered + metrics.sent} / {metrics.total} msgs)</span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.successRate}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>Delivered: <strong className="text-emerald-600">{metrics.delivered}</strong></span>
            <span>Failed: <strong className="text-rose-600">{metrics.failed}</strong></span>
          </p>
        </div>

        {/* Metric 2: WhatsApp Cloud API Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              WhatsApp Business API
            </span>
            <span className="p-2 bg-green-100 text-green-700 rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{metrics.whatsappRate}%</span>
              <span className="text-xs text-slate-500 font-bold">({metrics.whatsappDelivered}/{metrics.whatsappTotal} sent)</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-green-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.whatsappRate}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>Avg Latency: <strong className="text-slate-700">1.2s</strong></span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Meta API
            </span>
          </p>
        </div>

        {/* Metric 3: SMS Telecom Gateway */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              SMS Telecom DLT Gateway
            </span>
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Smartphone className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{metrics.smsRate}%</span>
              <span className="text-xs text-slate-500 font-bold">({metrics.smsDelivered}/{metrics.smsTotal} sent)</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.smsRate}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>DLT Template Compliant</span>
            <span className="text-blue-700 font-bold">Airtel / Jio</span>
          </p>
        </div>

        {/* Metric 4: Telecom Gateway Expenses & Failures */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Gateway Expense & Failures
            </span>
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">₹{metrics.totalCost}</span>
              <span className="text-xs text-slate-500 font-bold">Est. Gateway Fees</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 font-medium">
              Failed Messages Queue: <strong className="text-rose-600 font-black">{metrics.failed}</strong>
            </p>
          </div>

          {metrics.failed > 0 ? (
            <button
              onClick={handleBulkRetryAllFailed}
              className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[11px] rounded-xl border border-rose-200 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Bulk Retry {metrics.failed} Failed via Fallback
            </button>
          ) : (
            <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All dispatched messages healthy
            </div>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="font-extrabold text-slate-900 text-sm">Delivery Log Audit Filters:</span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search student, parent phone or msg..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Export Delivery Audit CSV Report"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Channel Select */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Communication Channel</label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-800"
            >
              <option value="All">All Channels (WhatsApp & SMS)</option>
              <option value="WhatsApp">💬 WhatsApp Business API Only</option>
              <option value="SMS">📱 Telecom SMS DLT Only</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Delivery Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-800"
            >
              <option value="All">All Delivery Statuses</option>
              <option value="Delivered">✅ Delivered to Device</option>
              <option value="Sent">📤 Sent to Gateway</option>
              <option value="Failed">❌ Delivery Failed</option>
              <option value="Pending">⏳ Pending Queue</option>
            </select>
          </div>

          {/* Category Select */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">Message Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-800"
            >
              <option value="All">All Categories</option>
              <option value="Fee Reminder">💰 Fee Reminders</option>
              <option value="Boarding Alert">🚌 Van Boarding / RFID</option>
              <option value="Attendance">📋 Student Attendance</option>
              <option value="Emergency">🚨 Emergency / Delay Notices</option>
              <option value="General Broadcast">📢 General Broadcasts</option>
            </select>
          </div>
        </div>
      </div>

      {/* NOTIFICATION LOGS AUDIT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm sm:text-base">
              Dispatched Message Audit Log ({filteredNotifications.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredNotifications.length} of {notifications.length} records
          </span>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">No Notification Logs Match Current Filters</p>
            <p className="text-xs text-slate-500">Try resetting the search bar or category filters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-4">Channel & ID</th>
                  <th className="p-3.5">Student & Parent</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Message Content</th>
                  <th className="p-3.5">Status & Delivery Time</th>
                  <th className="p-3.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredNotifications.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      {/* Channel & ID */}
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1.5 rounded-lg text-white font-extrabold text-[10px] flex items-center gap-1 ${
                              log.type === "WhatsApp" ? "bg-green-600" : "bg-blue-600"
                            }`}
                          >
                            {log.type === "WhatsApp" ? <MessageSquare className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                            {log.type}
                          </span>
                          <div>
                            <span className="font-mono text-[10px] text-slate-400 block">{log.id}</span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                              {log.carrierName || (log.type === "WhatsApp" ? "WhatsApp API" : "Telecom DLT")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Student & Parent */}
                      <td className="p-3.5">
                        <strong className="text-slate-900 font-bold block">{log.studentName}</strong>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span>{log.grade || "Student"}</span>
                          <span>•</span>
                          <span className="font-mono">{log.parentPhone}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {log.category || "General"}
                        </span>
                      </td>

                      {/* Message Content */}
                      <td className="p-3.5 max-w-xs">
                        <p className="line-clamp-2 text-slate-800 leading-relaxed font-sans text-xs">
                          {log.message}
                        </p>
                        {log.failureReason && (
                          <div className="mt-1 text-[10px] font-bold text-rose-600 bg-rose-50 p-1 rounded border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span>{log.failureReason}</span>
                          </div>
                        )}
                      </td>

                      {/* Status & Delivery Time */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          {log.status === "Delivered" && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-extrabold text-[11px] border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Delivered
                            </span>
                          )}
                          {log.status === "Sent" && (
                            <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-extrabold text-[11px] border border-blue-200">
                              <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                              Sent / In Flight
                            </span>
                          )}
                          {log.status === "Failed" && (
                            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-extrabold text-[11px] border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Failed
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {log.timestamp}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {log.status === "Failed" && (
                            <button
                              onClick={() => handleRetryFailedLog(log)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer"
                              title="Retry failed message via fallback channel"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Retry
                            </button>
                          )}

                          <button
                            onClick={() => handleCopyLog(log)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                            title="Copy details to clipboard"
                          >
                            {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <a
                            href={`https://wa.me/91${log.parentPhone.replace(/\D/g, "")}?text=${encodeURIComponent(log.message)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition cursor-pointer"
                            title="Open direct WhatsApp chat with parent"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: BULK PARENT BROADCAST DISPATCHER */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    Dispatch Bulk Parent Message Broadcast
                  </h3>
                  <p className="text-xs text-slate-500">
                    Send automated SMS & WhatsApp notifications to parent mobile numbers via DLT approved gateways.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            {/* Target Group Selector */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="font-extrabold text-slate-800 block mb-1">Target Parent Recipient Group</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetGroup("all")}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-center transition ${
                      targetGroup === "all"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    All Parents ({students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetGroup("overdue")}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-center transition ${
                      targetGroup === "overdue"
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Fee Overdue ({students.filter((s) => s.paymentStatus === "Overdue" || (s.balanceRemaining && s.balanceRemaining > 0)).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetGroup("grade")}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-center transition ${
                      targetGroup === "grade"
                        ? "bg-blue-600 text-white border-blue-600 shadow"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    By Grade / Class
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetGroup("route")}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-center transition ${
                      targetGroup === "route"
                        ? "bg-purple-600 text-white border-purple-600 shadow"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    By Van Route
                  </button>
                </div>
              </div>

              {/* Specific Sub-Filters */}
              {targetGroup === "grade" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Specific Grade</label>
                  <select
                    value={selectedGradeFilter}
                    onChange={(e) => setSelectedGradeFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    {["LKG", "UKG", "Grade I", "Grade II", "Grade III", "Grade IV", "Grade V"].map((g) => (
                      <option key={g} value={g}>
                        {g} ({students.filter((s) => s.grade === g).length} students)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetGroup === "route" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Specific Van Route</label>
                  <select
                    value={selectedRouteFilter}
                    onChange={(e) => setSelectedRouteFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.routeName}>
                        {v.routeName} ({students.filter((s) => s.assignedRouteName === v.routeName).length} students)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target Count Confirmation Badge */}
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-700 font-bold">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Target Recipients Matched:
                </span>
                <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full">
                  {targetRecipients.length} Parents
                </span>
              </div>

              {/* Dispatch Channel & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dispatch Channel</label>
                  <select
                    value={dispatchType}
                    onChange={(e) => setDispatchType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="WhatsApp">💬 WhatsApp Business API (High Delivery Rate)</option>
                    <option value="SMS">📱 Telecom SMS DLT Gateway</option>
                    <option value="Both">⚡ Dual Broadcast (WhatsApp + SMS)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={dispatchCategory}
                    onChange={(e) => setDispatchCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="General Broadcast">📢 General Broadcast</option>
                    <option value="Emergency">🚨 Emergency / Delay Alert</option>
                    <option value="Fee Reminder">💰 Fee Reminder</option>
                    <option value="Boarding Alert">🚌 Van Boarding Notice</option>
                    <option value="Attendance">📋 Student Attendance</option>
                  </select>
                </div>
              </div>

              {/* Quick Template Picker */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Quick Message Template Preset</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomMessage(tmpl.text);
                        setDispatchCategory(tmpl.category);
                      }}
                      className="text-left p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition space-y-1"
                    >
                      <strong className="text-xs font-bold text-slate-900 block truncate">{tmpl.title}</strong>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{tmpl.text}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message Input */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Broadcast Message Content</label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type official notification message to parents... (Tip: use {studentName} and {grade} for dynamic parent personalization)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Dynamic Tags: <code>&#123;studentName&#125;</code>, <code>&#123;grade&#125;</code></span>
                  <span>{customMessage.length} Characters</span>
                </div>
              </div>

              {/* Sending Progress Bar */}
              {isSendingBatch && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                    <span>Dispatched via Telecom Gateway...</span>
                    <span>{sendingProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${sendingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Dispatch Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSendingBatch || !customMessage.trim()}
                  onClick={handleExecuteDispatch}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl text-sm transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  {isSendingBatch
                    ? "Dispatching Messages to Gateway..."
                    : `Confirm & Broadcast to ${targetRecipients.length} Parent Numbers`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
