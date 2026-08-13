import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Bus,
  ShieldAlert,
  X,
  BellRing,
  Send,
  AlertCircle,
  DollarSign,
  Calendar,
  Zap,
  Smartphone,
  Sparkles,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Info,
  Edit,
  Trash2,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Download,
  ArrowUpRight,
  Award,
  Layers,
  Sparkle,
  QrCode,
  Printer,
  MapPin,
  Navigation,
  Camera,
  FileCheck,
  CreditCard,
  FileSpreadsheet
} from "lucide-react";
import * as XLSX from "xlsx";
import { Student, AttendanceStatus, Vehicle, NotificationLog, StudentDocument, PaymentReceipt } from "../types";
import { calculateMonthlyTransportFee } from "../utils/feeCalculator";
import { StudentQrPassModal } from "./StudentQrPassModal";
import { StudentPickupMapPreview } from "./StudentPickupMapPreview";
import { StudentDocumentModal } from "./StudentDocumentModal";
import { StudentDetailModal } from "./StudentDetailModal";
import { StudentExcelImportModal } from "./StudentExcelImportModal";
import { StudentDigitalIdCardModal } from "./StudentDigitalIdCardModal";
import { BulkWhatsAppDispatchModal } from "./BulkWhatsAppDispatchModal";

interface StudentRosterProps {
  students: Student[];
  vehicles: Vehicle[];
  onUpdateAttendance: (studentId: string, newStatus: AttendanceStatus) => void;
  onAddStudent: (newStudent: Student) => void;
  onEditStudent?: (updatedStudent: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onSendNotificationBatch?: (logs: NotificationLog[]) => void;
  onOpenReceipt?: (receipt: PaymentReceipt) => void;
}

export const StudentRoster: React.FC<StudentRosterProps> = ({
  students,
  vehicles,
  onUpdateAttendance,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onSendNotificationBatch,
  onOpenReceipt,
}) => {
  // Navigation View State
  const [activeTab, setActiveTab] = useState<"roster" | "analytics">("roster");

  // Analytics Controls State
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<"7d" | "14d">("7d");
  const [chartType, setChartType] = useState<"lines" | "bars" | "area">("lines");
  const [selectedGradeForTrend, setSelectedGradeForTrend] = useState<string>("All");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterGrade, setFilterGrade] = useState<string>("All");
  const [filterRoute, setFilterRoute] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showIdCardModal, setShowIdCardModal] = useState<boolean>(false);
  const [showBulkWhatsAppModal, setShowBulkWhatsAppModal] = useState<boolean>(false);
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);
  const [qrPassStudent, setQrPassStudent] = useState<Student | null>(null);
  const [docModalStudent, setDocModalStudent] = useState<Student | null>(null);
  const [detailModalStudent, setDetailModalStudent] = useState<Student | null>(null);
  const [selectedRosterStudentIds, setSelectedRosterStudentIds] = useState<Set<string>>(new Set());

  const toggleSelectRosterStudent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = new Set(selectedRosterStudentIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedRosterStudentIds(updated);
  };

  const handleSelectAllFilteredRoster = (filtered: Student[]) => {
    if (selectedRosterStudentIds.size === filtered.length) {
      setSelectedRosterStudentIds(new Set());
    } else {
      setSelectedRosterStudentIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const handleUpdateStudentPhoto = (studentId: string, photoDataUrl: string) => {
    const target = students.find((s) => s.id === studentId);
    if (target && onEditStudent) {
      const existingDocs = target.documents || [];
      const newDoc: StudentDocument = {
        id: `DOC-ID-CARD-${Date.now()}`,
        title: "Official Transport Digital ID Card Photo",
        category: "Transport ID Card",
        dataUrl: photoDataUrl,
        capturedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        notes: "Uploaded via Digital ID Card Generator",
      };
      // Replace existing Transport ID Card doc or append
      const updatedDocs = [newDoc, ...existingDocs.filter((d) => d.category !== "Transport ID Card")];
      onEditStudent({ ...target, documents: updatedDocs });
    }
  };

  const handleExportRosterToExcel = () => {
    const exportData = students.map((s) => ({
      "Roll Number": s.rollNumber,
      "Student Name": s.name,
      "Grade": s.grade,
      "Parent Name": s.parentName,
      "Parent Phone": s.parentPhone,
      "Address": s.address,
      "Pickup Stop": s.pickupStopName,
      "Distance (km)": s.distanceKm,
      "Assigned Route": s.assignedRouteName,
      "Tuition Fee per Term": s.tuitionFeePerTerm,
      "Transport Fee per Month": s.transportFeePerMonth,
      "Payment Status": s.paymentStatus,
      "Due Date": s.dueDate || "",
      "Balance Remaining": getStudentBalance(s),
      "Attendance Status": s.attendanceStatus,
      "RFID Tag ID": s.rfidTagId,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 14 },
      { wch: 25 },
      { wch: 18 },
      { wch: 22 },
      { wch: 15 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Wisdom Student Transport Roster");
    XLSX.writeFile(
      workbook,
      `Wisdom_School_Student_Roster_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const handleImportStudentsBulk = (newStudentsList: Student[]) => {
    newStudentsList.forEach((s) => {
      onAddStudent(s);
    });
  };

  const handleSaveStudentDocuments = (studentId: string, docs: StudentDocument[]) => {
    const target = students.find((s) => s.id === studentId);
    if (target && onEditStudent) {
      const updated = { ...target, documents: docs };
      onEditStudent(updated);
      if (docModalStudent?.id === studentId) {
        setDocModalStudent(updated);
      }
    }
  };

  // Automated Notification Trigger Settings State
  const [dueDaysThreshold, setDueDaysThreshold] = useState<number>(7); // Default alert due within 7 days
  const [balanceThreshold, setBalanceThreshold] = useState<number>(0); // Default balance >= 0
  const [channelType, setChannelType] = useState<"WhatsApp" | "SMS" | "Both">("WhatsApp");
  const [filterAlertsOnly, setFilterAlertsOnly] = useState<boolean>(false);
  const [sentLogsSummary, setSentLogsSummary] = useState<NotificationLog[] | null>(null);
  const [singleAlertSuccess, setSingleAlertSuccess] = useState<string | null>(null);

  // New / Edit student form state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("LKG");
  const [newParentName, setNewParentName] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");
  const [newStopName, setNewStopName] = useState("");
  const [newDistanceKm, setNewDistanceKm] = useState<number>(5.0);
  const [newVehicleId, setNewVehicleId] = useState(vehicles[0]?.id || "");
  const [newLat, setNewLat] = useState<number>(12.3069);
  const [newLng, setNewLng] = useState<number>(79.8562);

  const ALL_GRADES = ["LKG", "UKG", "Grade I", "Grade II", "Grade III", "Grade IV", "Grade V"];

  const gradeColors: Record<string, string> = {
    LKG: "#f59e0b",
    UKG: "#3b82f6",
    "Grade I": "#10b981",
    "Grade II": "#8b5cf6",
    "Grade III": "#ec4899",
    "Grade IV": "#06b6d4",
    "Grade V": "#f97316",
    Overall: "#eab308",
  };

  // Compute live grade attendance statistics from prop
  const gradeLiveStats = useMemo(() => {
    return ALL_GRADES.map((grade) => {
      const gradeStudents = students.filter((s) => s.grade === grade);
      const total = gradeStudents.length || 1;
      const present = gradeStudents.filter((s) => s.attendanceStatus !== "Absent").length;
      const absent = gradeStudents.filter((s) => s.attendanceStatus === "Absent").length;
      const rate = Math.round((present / total) * 100);

      return {
        grade,
        total: gradeStudents.length,
        present,
        absent,
        rate,
      };
    });
  }, [students]);

  // Compute historical daily student attendance percentage trends across school grades
  const dailyAttendanceTrends = useMemo(() => {
    const historicalPoints = [
      { date: "Jul 13", LKG: 92, UKG: 94, "Grade I": 97, "Grade II": 95, "Grade III": 96, "Grade IV": 91, "Grade V": 98 },
      { date: "Jul 14", LKG: 90, UKG: 96, "Grade I": 98, "Grade II": 93, "Grade III": 95, "Grade IV": 93, "Grade V": 97 },
      { date: "Jul 15", LKG: 95, UKG: 95, "Grade I": 99, "Grade II": 96, "Grade III": 97, "Grade IV": 94, "Grade V": 98 },
      { date: "Jul 16", LKG: 93, UKG: 93, "Grade I": 96, "Grade II": 94, "Grade III": 94, "Grade IV": 92, "Grade V": 96 },
      { date: "Jul 17", LKG: 88, UKG: 91, "Grade I": 95, "Grade II": 92, "Grade III": 93, "Grade IV": 89, "Grade V": 95 },
      { date: "Jul 20", LKG: 94, UKG: 97, "Grade I": 98, "Grade II": 96, "Grade III": 97, "Grade IV": 95, "Grade V": 99 },
      { date: "Jul 21", LKG: 93, UKG: 95, "Grade I": 99, "Grade II": 95, "Grade III": 96, "Grade IV": 93, "Grade V": 97 },
      { date: "Jul 22", LKG: 96, UKG: 98, "Grade I": 100, "Grade II": 97, "Grade III": 98, "Grade IV": 96, "Grade V": 98 },
      { date: "Jul 23", LKG: 91, UKG: 94, "Grade I": 97, "Grade II": 94, "Grade III": 95, "Grade IV": 92, "Grade V": 96 },
    ];

    // Build real-time point for today Jul 24 based on actual roster state
    const todayGradeRates: Record<string, number> = {};
    gradeLiveStats.forEach((st) => {
      todayGradeRates[st.grade] = st.rate;
    });

    const todayPoint = {
      date: "Jul 24 (Today)",
      LKG: todayGradeRates["LKG"] ?? 93,
      UKG: todayGradeRates["UKG"] ?? 95,
      "Grade I": todayGradeRates["Grade I"] ?? 98,
      "Grade II": todayGradeRates["Grade II"] ?? 95,
      "Grade III": todayGradeRates["Grade III"] ?? 96,
      "Grade IV": todayGradeRates["Grade IV"] ?? 92,
      "Grade V": todayGradeRates["Grade V"] ?? 97,
    };

    const combined = [...historicalPoints, todayPoint];
    const subset = analyticsTimeframe === "7d" ? combined.slice(-7) : combined;

    return subset.map((pt) => {
      const sum = pt.LKG + pt.UKG + pt["Grade I"] + pt["Grade II"] + pt["Grade III"] + pt["Grade IV"] + pt["Grade V"];
      const overall = Math.round(sum / 7);
      return {
        ...pt,
        Overall: overall,
      };
    });
  }, [gradeLiveStats, analyticsTimeframe]);

  // Attendance status distribution data for Pie Chart
  const statusBreakdownData = useMemo(() => {
    let boardedPickup = 0;
    let droppedSchool = 0;
    let boardedReturn = 0;
    let droppedHome = 0;
    let absent = 0;

    students.forEach((s) => {
      if (s.attendanceStatus === "Boarded Pickup") boardedPickup++;
      else if (s.attendanceStatus === "Dropped at School") droppedSchool++;
      else if (s.attendanceStatus === "Boarded Return") boardedReturn++;
      else if (s.attendanceStatus === "Dropped Home") droppedHome++;
      else absent++;
    });

    const list = [
      { name: "Boarded Van", value: boardedPickup, color: "#3b82f6" },
      { name: "Dropped at School", value: droppedSchool, color: "#10b981" },
      { name: "Return Van", value: boardedReturn, color: "#f59e0b" },
      { name: "Dropped Home", value: droppedHome, color: "#22c55e" },
      { name: "Absent", value: absent, color: "#f43f5e" },
    ];

    return list.filter((i) => i.value > 0);
  }, [students]);

  // Attendance Summary Metrics
  const overallAttendancePercentage = useMemo(() => {
    if (students.length === 0) return 96;
    const present = students.filter((s) => s.attendanceStatus !== "Absent").length;
    return Math.round((present / students.length) * 100);
  }, [students]);

  const bestAttendingGrade = useMemo(() => {
    if (gradeLiveStats.length === 0) return { grade: "Grade I", rate: 98 };
    let best = gradeLiveStats[0];
    gradeLiveStats.forEach((st) => {
      if (st.rate > best.rate) best = st;
    });
    return best;
  }, [gradeLiveStats]);
  const openEditModal = (stu: Student) => {
    setEditingStudent(stu);
    setNewName(stu.name);
    setNewGrade(stu.grade);
    setNewParentName(stu.parentName);
    setNewParentPhone(stu.parentPhone);
    setNewStopName(stu.pickupStopName);
    setNewDistanceKm(stu.distanceKm);
    setNewVehicleId(stu.assignedVehicleId || vehicles[0]?.id || "");
    setNewLat(stu.latitude || 12.3069);
    setNewLng(stu.longitude || 79.8562);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const assignedVeh = vehicles.find((v) => v.id === newVehicleId) || vehicles[0];
    const calculatedFee = calculateMonthlyTransportFee(newDistanceKm, assignedVeh.multiplier);

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        name: newName.trim(),
        grade: newGrade,
        parentName: newParentName.trim(),
        parentPhone: newParentPhone.trim(),
        pickupStopName: newStopName.trim(),
        distanceKm: newDistanceKm,
        assignedVehicleId: assignedVeh.id,
        assignedRouteName: assignedVeh.routeName,
        transportFeePerMonth: calculatedFee,
        latitude: newLat,
        longitude: newLng,
      };
      if (onEditStudent) onEditStudent(updated);
      setEditingStudent(null);
    } else {
      const newStudentObj: Student = {
        id: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        rollNumber: `WIS-2026-${Math.floor(100 + Math.random() * 900)}`,
        name: newName.trim(),
        grade: newGrade,
        parentName: newParentName.trim(),
        parentPhone: newParentPhone.trim(),
        address: `${newStopName}, Isur Chunambedu Road, Essur - 603310`,
        pickupStopName: newStopName.trim(),
        distanceKm: newDistanceKm,
        assignedVehicleId: assignedVeh.id,
        assignedRouteName: assignedVeh.routeName,
        tuitionFeePerTerm: 16000,
        transportFeePerMonth: calculatedFee,
        paymentStatus: "Pending",
        dueDate: "2026-07-28",
        balanceRemaining: calculatedFee,
        attendanceStatus: "Boarded Pickup",
        lastStatusTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        rfidTagId: `RFID-${Math.floor(100000 + Math.random() * 900000)}`,
        latitude: newLat,
        longitude: newLng,
      };
      onAddStudent(newStudentObj);
      setShowAddModal(false);
    }

    setNewName("");
    setNewParentName("");
    setNewParentPhone("");
    setNewStopName("");
    setNewDistanceKm(5.0);
    setNewLat(12.3069);
    setNewLng(79.8562);
  };

  // Helper calculations for student fee alert evaluation
  const getDaysUntilDue = (s: Student): number => {
    if (s.dueDate) {
      const today = new Date("2026-07-24T00:00:00");
      const due = new Date(`${s.dueDate}T00:00:00`);
      return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
    if (s.paymentStatus === "Paid") return 17;
    if (s.paymentStatus === "Overdue") return -4;
    if (s.paymentStatus === "Partially Paid") return 5;
    return 4; // Pending
  };

  const getStudentBalance = (s: Student): number => {
    if (s.balanceRemaining !== undefined) return s.balanceRemaining;
    if (s.paymentStatus === "Paid") return 0;
    if (s.paymentStatus === "Partially Paid") return Math.round(s.transportFeePerMonth * 0.5);
    return s.transportFeePerMonth;
  };

  const isStudentAlertable = (s: Student) => {
    const balance = getStudentBalance(s);
    const days = getDaysUntilDue(s);

    if (s.paymentStatus === "Paid" && balance <= 0) return false;

    const meetsBalance = balance >= balanceThreshold;
    const meetsDueWindow = days <= dueDaysThreshold; // Due within threshold days OR overdue (days <= 0)

    return meetsBalance && meetsDueWindow;
  };

  // Matched students for trigger engine
  const matchedAlertStudents = students.filter(isStudentAlertable);
  const matchedTotalBalance = matchedAlertStudents.reduce((sum, s) => sum + getStudentBalance(s), 0);

  // Filtered students for grid view
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentPhone.includes(searchQuery) ||
      s.pickupStopName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade = filterGrade === "All" || s.grade === filterGrade;
    const matchesRoute = filterRoute === "All" || s.assignedVehicleId === filterRoute;
    const matchesAlertOnly = !filterAlertsOnly || isStudentAlertable(s);

    return matchesSearch && matchesGrade && matchesRoute && matchesAlertOnly;
  });

  // Action Handler: Fire Automated Bulk Fee Alerts
  const handleTriggerBulkAlerts = () => {
    if (matchedAlertStudents.length === 0) return;

    const newLogs: NotificationLog[] = [];
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    matchedAlertStudents.forEach((s) => {
      const balance = getStudentBalance(s);
      const days = getDaysUntilDue(s);
      const dueText = days < 0 ? `OVERDUE by ${Math.abs(days)} days` : `DUE IN ${days} DAYS (${s.dueDate || "Jul 28"})`;

      const msg = `TRANSPORT FEE ALERT: Dear ${s.parentName}, Wisdom School transport fee balance of ₹${balance.toLocaleString("en-IN")} for ${s.name} (${s.grade}) is ${dueText}. Pay via UPI ID: rsaravanan102002-1@okhdfcbank or contact Chief Transport Officer Mr. R SARAVANAN (9176593129).`;

      if (channelType === "WhatsApp" || channelType === "Both") {
        newLogs.push({
          id: `NOTIF-WA-${Date.now()}-${s.id}`,
          studentId: s.id,
          studentName: s.name,
          parentPhone: s.parentPhone,
          message: msg,
          timestamp: nowTime + " Today",
          type: "WhatsApp",
          status: "Delivered",
        });
      }

      if (channelType === "SMS" || channelType === "Both") {
        newLogs.push({
          id: `NOTIF-SMS-${Date.now()}-${s.id}`,
          studentId: s.id,
          studentName: s.name,
          parentPhone: s.parentPhone,
          message: msg,
          timestamp: nowTime + " Today",
          type: "SMS",
          status: "Delivered",
        });
      }
    });

    if (onSendNotificationBatch) {
      onSendNotificationBatch(newLogs);
    }
    setSentLogsSummary(newLogs);
  };

  // Action Handler: Fire Single Student Instant Alert
  const handleTriggerSingleAlert = (s: Student) => {
    const balance = getStudentBalance(s);
    const days = getDaysUntilDue(s);
    const dueText = days < 0 ? `OVERDUE by ${Math.abs(days)} days` : `DUE IN ${days} DAYS (${s.dueDate || "Jul 28"})`;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const msg = `TRANSPORT FEE REMINDER: Dear ${s.parentName}, transport fee balance of ₹${balance.toLocaleString("en-IN")} for ${s.name} (${s.grade}) is ${dueText}. Pay via UPI: rsaravanan102002-1@okhdfcbank. Contact 9176593129 for queries.`;

    const singleLog: NotificationLog = {
      id: `NOTIF-SINGLE-${Date.now()}-${s.id}`,
      studentId: s.id,
      studentName: s.name,
      parentPhone: s.parentPhone,
      message: msg,
      timestamp: nowTime + " Today",
      type: "WhatsApp",
      status: "Delivered",
    };

    if (onSendNotificationBatch) {
      onSendNotificationBatch([singleLog]);
    }

    setSingleAlertSuccess(s.name);
    setTimeout(() => {
      setSingleAlertSuccess(null);
    }, 4000);
  };

  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newParentPhone) return;

    const selectedVehicle = vehicles.find((v) => v.id === newVehicleId) || vehicles[0];
    const computedTransportFee = calculateMonthlyTransportFee(
      newDistanceKm,
      selectedVehicle.type
    );

    const createdStudent: Student = {
      id: "STU-" + Math.floor(1000 + Math.random() * 9000),
      rollNumber: "WIS-2025-" + Math.floor(100 + Math.random() * 900),
      name: newName,
      grade: newGrade,
      parentName: newParentName || "Parent",
      parentPhone: newParentPhone,
      address: `${newStopName}, Essur Area`,
      pickupStopName: newStopName || "Essur Stop",
      distanceKm: newDistanceKm,
      assignedVehicleId: selectedVehicle.id,
      assignedRouteName: selectedVehicle.routeName,
      tuitionFeePerTerm: 12000,
      transportFeePerMonth: computedTransportFee,
      paymentStatus: "Pending",
      dueDate: "2026-07-31",
      balanceRemaining: computedTransportFee,
      attendanceStatus: "Absent",
      lastStatusTime: "Not Scanned Today",
      rfidTagId: "RFID-" + Math.floor(100000 + Math.random() * 900000),
    };

    onAddStudent(createdStudent);
    setShowAddModal(false);
    setNewName("");
    setNewParentPhone("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Stats Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-600 text-white font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider">
            RFID Boarding & Fee Notification Engine
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-yellow-400" />
            Student Transport Roster & Fee Reminders
          </h2>
          <p className="text-xs text-slate-400">
            Real-time RFID boarding scans, automated transport fee balance triggers, and instant parent notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setIdCardStudent(students[0] || null);
              setShowIdCardModal(true);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer border border-amber-300"
            title="Generate & Print Student Transport Digital ID Cards"
          >
            <CreditCard className="w-4 h-4 text-slate-950" />
            <span>Digital ID Cards</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer border border-emerald-400/40"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Import Excel / CSV List</span>
          </button>

          <button
            onClick={handleExportRosterToExcel}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-md flex items-center gap-1.5 cursor-pointer border border-slate-700"
            title="Export Current Roster to Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs Bar */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold shadow-xl">
        <button
          onClick={() => setActiveTab("roster")}
          className={`flex-1 py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "roster"
              ? "bg-yellow-400 text-slate-950 font-black shadow-lg"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Roster & Fee Reminders</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "analytics"
              ? "bg-yellow-400 text-slate-950 font-black shadow-lg"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-950" />
          <span>Grade Attendance Trends & Analytics</span>
          <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase font-mono">
            D3 / Recharts
          </span>
        </button>
      </div>

      {/* Toast Alert Feedback for Single Student Alert */}
      {singleAlertSuccess && (
        <div className="bg-emerald-900 text-emerald-100 border border-emerald-500 p-4 rounded-2xl flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Automated Fee Alert Triggered!</p>
              <p className="text-xs text-emerald-200">
                Personalized WhatsApp transport fee reminder sent to parent of <strong>{singleAlertSuccess}</strong>. Visible in Parent Portal logs.
              </p>
            </div>
          </div>
          <button onClick={() => setSingleAlertSuccess(null)} className="text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: STUDENT ROSTER & AUTOMATED FEE NOTIFICATION ENGINE */}
      {activeTab === "roster" && (
        <>
          {/* AUTOMATED TRANSPORT FEE NOTIFICATION TRIGGER PANEL */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
            {/* Panel Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl flex-shrink-0">
                  <BellRing className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full font-mono">
                      Automated Trigger Rule
                    </span>
                    <span className="bg-emerald-900/80 text-emerald-300 border border-emerald-700 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      Active Rule: Due ≤ {dueDaysThreshold} Days or Balance ≥ ₹{balanceThreshold}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    Transport Fee Balance & Due Date Notification Trigger
                  </h3>
                  <p className="text-xs text-slate-400">
                    Automatically scans roster & alerts parents when transport fee balance is due within 7 days or exceeds threshold.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setQrPassStudent(students[0] || null)}
                  className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xl cursor-pointer"
                  title="Generate & Print Student Payment Portal QR Passes"
                >
                  <QrCode className="w-4 h-4 text-slate-950" />
                  Print Payment QR Passes
                </button>

                <button
                  onClick={handleTriggerBulkAlerts}
                  disabled={matchedAlertStudents.length === 0}
                  className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xl cursor-pointer ${
                    matchedAlertStudents.length > 0
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Fire Automated Alerts to {matchedAlertStudents.length} Parents
                </button>
              </div>
            </div>

            {/* Trigger Criteria Control Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
              {/* Due Window Threshold Selector */}
              <div className="md:col-span-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-2">
                <label className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  1. Fee Due Window Threshold:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[3, 5, 7, 10, 14].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDueDaysThreshold(days)}
                      className={`px-2.5 py-1.5 rounded-lg font-extrabold text-[11px] transition cursor-pointer border ${
                        dueDaysThreshold === days
                          ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      ≤ {days} Days
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  Triggers for parents whose transport fees are due within <strong>{dueDaysThreshold} days</strong> or overdue.
                </p>
              </div>

              {/* Minimum Fee Balance Threshold Selector */}
              <div className="md:col-span-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-2">
                <label className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  2. Min Fee Balance Threshold:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0, 500, 1000, 1500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBalanceThreshold(amt)}
                      className={`px-2.5 py-1.5 rounded-lg font-extrabold text-[11px] transition cursor-pointer border ${
                        balanceThreshold === amt
                          ? "bg-emerald-400 text-slate-950 border-emerald-300 shadow-sm"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      {amt === 0 ? "All Pending (>₹0)" : `≥ ₹${amt.toLocaleString("en-IN")}`}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  Only alerts if unpaid balance is equal to or greater than <strong>₹{balanceThreshold}</strong>.
                </p>
              </div>

              {/* Channel & View Filter */}
              <div className="md:col-span-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-2 flex flex-col justify-between">
                <div>
                  <label className="font-extrabold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                    3. Notification Channel:
                  </label>
                  <div className="flex items-center gap-1.5 mt-2">
                    {(["WhatsApp", "SMS", "Both"] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setChannelType(ch)}
                        className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition cursor-pointer border ${
                          channelType === ch
                            ? "bg-blue-500 text-white border-blue-400 shadow-sm"
                            : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                        }`}
                      >
                        {ch === "WhatsApp" ? "📱 WhatsApp" : ch === "SMS" ? "💬 SMS" : "🚀 Both"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">Filter Roster Display:</span>
                  <button
                    type="button"
                    onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition cursor-pointer border ${
                      filterAlertsOnly
                        ? "bg-amber-400 text-slate-950 border-amber-300"
                        : "bg-slate-900 text-slate-300 border-slate-700"
                    }`}
                  >
                    {filterAlertsOnly ? "Showing Matched Only" : "Show All Students"}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Matched Parents Summary Ribbon */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-sm border border-amber-500/40">
                  {matchedAlertStudents.length}
                </div>
                <div>
                  <p className="font-extrabold text-white text-sm">
                    {matchedAlertStudents.length} Parents Match Automated Alert Criteria
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Transport fee due within <strong>{dueDaysThreshold} days</strong> or pending balance ≥ <strong>₹{balanceThreshold}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Outstanding Balance</span>
                  <span className="text-amber-400 font-mono font-black text-base">
                    ₹{matchedTotalBalance.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Trigger Mode</span>
                  <span className="text-emerald-400 font-bold text-xs">Auto-Personalized SMS/WhatsApp</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs sm:text-sm">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search student name, roll number, stop, or parent phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 font-semibold text-slate-800"
              >
                <option value="All">All Grades (Nursery - Grade V)</option>
                <option value="LKG">LKG</option>
                <option value="UKG">UKG</option>
                <option value="Grade I">Grade I</option>
                <option value="Grade II">Grade II</option>
                <option value="Grade IV">Grade IV</option>
                <option value="Grade V">Grade V</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={filterRoute}
                onChange={(e) => setFilterRoute(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 font-semibold text-slate-800"
              >
                <option value="All">All Van Routes</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} ({v.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Action Toolbar */}
          <div className="bg-slate-900 text-white p-3 px-5 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-bold">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSelectAllFilteredRoster(filteredStudents)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={filteredStudents.length > 0 && selectedRosterStudentIds.size === filteredStudents.length}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                />
                <span>Select All ({filteredStudents.length})</span>
              </button>

              <span className="text-amber-400 font-extrabold font-mono">
                {selectedRosterStudentIds.size} Selected
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={selectedRosterStudentIds.size === 0}
                onClick={() => setShowBulkWhatsAppModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold px-3.5 py-1.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer border border-emerald-400/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Bulk WhatsApp ({selectedRosterStudentIds.size})</span>
              </button>

              <button
                type="button"
                disabled={selectedRosterStudentIds.size === 0}
                onClick={() => {
                  const selected = students.filter((s) => selectedRosterStudentIds.has(s.id));
                  if (selected.length > 0) {
                    setIdCardStudent(selected[0]);
                    setShowIdCardModal(true);
                  }
                }}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black px-3.5 py-1.5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer border border-amber-300"
              >
                <Printer className="w-3.5 h-3.5 text-slate-950" />
                <span>Bulk Print ID Cards ({selectedRosterStudentIds.size})</span>
              </button>

              {selectedRosterStudentIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRosterStudentIds(new Set())}
                  className="text-slate-400 hover:text-white underline text-[11px] px-2 py-1 cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Student Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((s) => {
              const daysLeft = getDaysUntilDue(s);
              const balance = getStudentBalance(s);
              const alertable = isStudentAlertable(s);
              const isSelected = selectedRosterStudentIds.has(s.id);

              return (
                <div
                  key={s.id}
                  onClick={() => setDetailModalStudent(s)}
                  className={`bg-white rounded-2xl p-5 shadow-md border transition space-y-4 cursor-pointer hover:shadow-xl hover:border-blue-400 group relative ${
                    isSelected ? "ring-2 ring-amber-400 bg-amber-50/20 border-amber-300" : alertable ? "border-amber-300 ring-2 ring-amber-400/20" : "border-slate-200"
                  }`}
                >
                  {/* Card Top: Selection Checkbox, Student Identity & Attendance Pill */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectRosterStudent(s.id, e as unknown as React.MouseEvent)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                      />
                      <div className="w-10 h-10 rounded-full bg-blue-900 text-yellow-400 font-extrabold flex items-center justify-center text-sm shadow group-hover:scale-105 transition shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base group-hover:text-blue-700 transition flex items-center gap-1.5">
                          {s.name}
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 opacity-0 group-hover:opacity-100 transition">
                            History & Ledger ↗
                          </span>
                        </h4>
                        <p className="text-xs font-semibold text-slate-500">
                          Class: <strong className="text-slate-800">{s.grade}</strong> | {s.rollNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          s.attendanceStatus === "Boarded Pickup"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : s.attendanceStatus === "Dropped at School"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        {s.attendanceStatus}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(s);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Edit Student Information"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteStudent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete student record for '${s.name}'?`)) {
                              onDeleteStudent(s.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Student Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fee Due & Balance Alert Trigger Badge */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold ${
                      s.paymentStatus === "Paid" && balance === 0
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : daysLeft < 0
                        ? "bg-rose-50 border-rose-200 text-rose-950"
                        : daysLeft <= dueDaysThreshold
                        ? "bg-amber-50 border-amber-200 text-amber-950"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {s.paymentStatus === "Paid" && balance === 0 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : daysLeft < 0 ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 animate-pulse" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      )}

                      <div>
                        <span className="block text-[11px]">
                          {s.paymentStatus === "Paid" && balance === 0
                            ? "Fee Status: Fully Paid"
                            : daysLeft < 0
                            ? `Overdue by ${Math.abs(daysLeft)} Days (${s.dueDate})`
                            : `Fee Due in ${daysLeft} Days (${s.dueDate || "Jul 28"})`}
                        </span>
                        <span className="block text-[10px] text-slate-500 font-mono">
                          Transport Fee Balance: <strong>₹{balance.toLocaleString("en-IN")}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Printable Digital ID Card Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIdCardStudent(s);
                          setShowIdCardModal(true);
                        }}
                        title="View & Print Digital Transport ID Card"
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black flex items-center gap-1 transition shadow cursor-pointer flex-shrink-0"
                      >
                        <CreditCard className="w-3 h-3 text-slate-950" />
                        ID Card
                      </button>

                      {/* Student Camera Digital Records Vault Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocModalStudent(s);
                        }}
                        title="Capture or Inspect Student Transport ID Card & Medical Records with Device Camera"
                        className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition shadow cursor-pointer flex-shrink-0"
                      >
                        <Camera className="w-3 h-3 text-amber-300" />
                        Docs ({s.documents?.length || 0})
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrPassStudent(s);
                        }}
                        title="Generate & Print Payment Portal QR Pass for Student"
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-[10px] font-black flex items-center gap-1 transition shadow cursor-pointer flex-shrink-0"
                      >
                        <QrCode className="w-3 h-3 text-amber-400" />
                        QR Pass
                      </button>

                      {/* Instant Individual Alert Trigger Button */}
                      {s.paymentStatus !== "Paid" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriggerSingleAlert(s);
                          }}
                          title="Send Instant WhatsApp/SMS Fee Reminder"
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black flex items-center gap-1 transition shadow cursor-pointer flex-shrink-0"
                        >
                          <Send className="w-3 h-3" />
                          Alert
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Student Pickup & Contact Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold block flex items-center justify-between">
                          Pickup Stop
                          <span className="text-emerald-700 font-mono font-bold">{s.distanceKm} km</span>
                        </span>
                        <strong className="text-slate-900 font-bold block truncate">{s.pickupStopName}</strong>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(s);
                          }}
                          title="Verify Route & Adjust GPS Pickup Pin on Leaflet Map"
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-md flex items-center gap-1 border border-blue-200 transition cursor-pointer"
                        >
                          <MapPin className="w-3 h-3 text-blue-600" />
                          Verify Route
                        </button>
                        <a
                          href={`https://wa.me/91${s.parentPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `🏫 *Wisdom School Campus Van Live Track*\n\nDear Parent (${s.parentName}),\nYour child *${s.name}* (${s.grade}) pickup location is *${s.pickupStopName}* (${s.distanceKm} km).\n\n📍 *Live GPS Pin:* https://maps.google.com/?q=${s.latitude || 12.3069},${s.longitude || 79.8562}\n🚌 Status: ${s.attendanceStatus}\n🏫 Campus: Isur Chunambedu Road, Essur - 603310`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Send Live GPS Pickup Location via WhatsApp to Parent"
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] rounded-md flex items-center gap-1 transition shadow-sm cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3 fill-white" />
                          WA Live
                        </a>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">Parent Contact</span>
                        <strong className="text-slate-900 font-bold block truncate">{s.parentName}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                        <a href={`tel:${s.parentPhone}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 font-bold text-[11px] hover:underline font-mono">
                          📞 {s.parentPhone}
                        </a>
                        <a
                          href={`tel:${s.parentPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          title={`Quick Call ${s.parentName} (${s.parentPhone})`}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-md flex items-center gap-1 transition shadow-sm cursor-pointer"
                        >
                          <Phone className="w-3 h-3" />
                          Quick Call
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Driver 1-Tap Attendance Marker Controls */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">
                      Tap to Scan RFID / Update Status:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateAttendance(s.id, "Boarded Pickup");
                        }}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-center transition cursor-pointer"
                      >
                        🚌 Boarded Van
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateAttendance(s.id, "Dropped at School");
                        }}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-center transition cursor-pointer"
                      >
                        🏫 Dropped School
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateAttendance(s.id, "Boarded Return");
                        }}
                        className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-center transition cursor-pointer"
                      >
                        🚌 Return Van
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateAttendance(s.id, "Dropped Home");
                        }}
                        className="p-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-center transition cursor-pointer"
                      >
                        🏡 Dropped Home
                      </button>
                    </div>
                  </div>

                  {/* Explicit View Full History & Payment Ledger Button */}
                  <div className="pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailModalStudent(s);
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm border border-slate-800 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      View Historical Attendance & Fee Ledger
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TAB 2: DATA VISUALIZATION - GRADE ATTENDANCE TRENDS & RECHARTS ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Key KPI Stats Header Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Overall Attendance Rate
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> +2.1%
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {overallAttendancePercentage}%
                </span>
                <span className="text-xs text-slate-400">7-Day Moving Avg</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${overallAttendancePercentage}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Highest Attending Grade
                </span>
                <Award className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-emerald-400">
                  {bestAttendingGrade.grade}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {bestAttendingGrade.rate}% Rate
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Highest daily RFID boarding compliance this term.
              </p>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Today's RFID Scans
                </span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-blue-400 font-mono">
                  {students.filter((s) => s.attendanceStatus !== "Absent").length} / {students.length}
                </span>
                <span className="text-xs text-slate-400">Students Boarded</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {students.filter((s) => s.attendanceStatus === "Absent").length} marked absent or pending pickup today.
              </p>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Van Route Compliance
                </span>
                <Bus className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-purple-400 font-mono">
                  98.4%
                </span>
                <span className="text-xs text-slate-400">Stop On-Time</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Van pickup scans performed at designated stops.
              </p>
            </div>
          </div>

          {/* Visualization Controls Toolbar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
                <Sliders className="w-4 h-4" /> Chart Controls:
              </span>

              {/* Chart Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setChartType("lines")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                    chartType === "lines"
                      ? "bg-amber-400 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Grade Trend Lines
                </button>
                <button
                  onClick={() => setChartType("bars")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                    chartType === "bars"
                      ? "bg-amber-400 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Grade Bar Comparison
                </button>
                <button
                  onClick={() => setChartType("area")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                    chartType === "area"
                      ? "bg-amber-400 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Overall Volume Area
                </button>
              </div>

              {/* Timeframe Selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setAnalyticsTimeframe("7d")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    analyticsTimeframe === "7d"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setAnalyticsTimeframe("14d")}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    analyticsTimeframe === "14d"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Last 14 Days
                </button>
              </div>
            </div>

            {/* Grade Filter Pill Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Grade Filter:</span>
              <button
                onClick={() => setSelectedGradeForTrend("All")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer border ${
                  selectedGradeForTrend === "All"
                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
                }`}
              >
                All Grades
              </button>
              {ALL_GRADES.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGradeForTrend(g)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                    selectedGradeForTrend === g
                      ? "bg-amber-400 text-slate-950 border-amber-300 font-black"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* MAIN D3 / RECHARTS GRAPH CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Primary Chart Container */}
            <div className="lg:col-span-8 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    Daily Student Attendance Percentage Trends by Grade
                  </h3>
                  <p className="text-xs text-slate-400">
                    Plotting historical daily boarding trends (%) across LKG, UKG, and Grades I through V.
                  </p>
                </div>
                <span className="text-[10px] bg-slate-800 text-amber-300 px-2.5 py-1 rounded-full font-mono border border-slate-700">
                  {selectedGradeForTrend === "All" ? "Showing All 7 Grades + Overall" : `Showing ${selectedGradeForTrend}`}
                </span>
              </div>

              <div className="h-[360px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "lines" ? (
                    <LineChart data={dailyAttendanceTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis domain={[80, 100]} unit="%" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#090d16",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
                        }}
                        formatter={(value: any, name: any) => [`${value}%`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />

                      {selectedGradeForTrend === "All" ? (
                        <>
                          {ALL_GRADES.map((grade) => (
                            <Line
                              key={grade}
                              type="monotone"
                              dataKey={grade}
                              stroke={gradeColors[grade] || "#3b82f6"}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 6 }}
                            />
                          ))}
                          <Line
                            type="monotone"
                            dataKey="Overall"
                            stroke="#eab308"
                            strokeWidth={3}
                            strokeDasharray="4 4"
                            dot={{ r: 4, fill: "#eab308" }}
                          />
                        </>
                      ) : (
                        <>
                          <Line
                            type="monotone"
                            dataKey={selectedGradeForTrend}
                            stroke={gradeColors[selectedGradeForTrend] || "#3b82f6"}
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="Overall"
                            stroke="#64748b"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                          />
                        </>
                      )}
                    </LineChart>
                  ) : chartType === "bars" ? (
                    <BarChart data={gradeLiveStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="grade" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} unit="%" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#090d16",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                        formatter={(value: any) => [`${value}% Attendance`, "Rate"]}
                      />
                      <Bar dataKey="rate" name="Today's Attendance Rate %" radius={[8, 8, 0, 0]}>
                        {gradeLiveStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={gradeColors[entry.grade] || "#3b82f6"} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart data={dailyAttendanceTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis domain={[80, 100]} unit="%" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#090d16",
                          borderColor: "#334155",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Overall"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#overallGrad)"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Secondary Attendance Status Distribution Donut Chart & Insights */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                    <PieChartIcon className="w-4 h-4 text-emerald-400" />
                    Current Status Breakdown
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Real-Time RFID</span>
                </div>

                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#090d16",
                          borderColor: "#334155",
                          borderRadius: "10px",
                          color: "#fff",
                          fontSize: "11px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                  {statusBreakdownData.map((st) => (
                    <div key={st.name} className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }} />
                      <span className="text-slate-300 truncate">{st.name}:</span>
                      <strong className="text-white ml-auto">{st.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights Card */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-2 text-xs">
                <h4 className="font-extrabold text-amber-400 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  Fleet Attendance Analytics Insights
                </h4>
                <ul className="space-y-2 text-slate-300 text-[11px] list-disc list-inside">
                  <li>
                    <strong>Grade I & UKG</strong> lead with an average of <span className="text-emerald-400 font-bold">98.5%</span> attendance rate over 14 days.
                  </li>
                  <li>
                    Peak morning boarding RFID scans occur between <strong>7:38 AM and 7:52 AM</strong> across Essur & Cheyyar routes.
                  </li>
                  <li>
                    Parent fee reminder notifications increased Friday attendance by <span className="text-amber-300 font-bold">+3.2%</span>.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Grade-by-Grade Detailed Attendance Breakdown Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  School Grade Attendance Matrix & Trend Comparison
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive breakdown of total enrollment, present count, absent count, and daily trend percentage per grade.
                </p>
              </div>

              <button
                onClick={() => alert("Downloading CSV Grade Attendance Analytics Report...")}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Analytics CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-extrabold">Grade / Class</th>
                    <th className="py-3 px-4 font-extrabold">Enrolled Students</th>
                    <th className="py-3 px-4 font-extrabold">Present Today</th>
                    <th className="py-3 px-4 font-extrabold">Absent Today</th>
                    <th className="py-3 px-4 font-extrabold">Attendance Rate (%)</th>
                    <th className="py-3 px-4 font-extrabold">7-Day Trend</th>
                    <th className="py-3 px-4 font-extrabold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {gradeLiveStats.map((st) => (
                    <tr key={st.grade} className="hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4 font-extrabold text-white flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: gradeColors[st.grade] || "#3b82f6" }}
                        />
                        {st.grade}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{st.total} Students</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{st.present} Boarded</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-400">{st.absent} Absent</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-400 w-10 text-right">{st.rate}%</span>
                          <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${st.rate}%`,
                                backgroundColor: gradeColors[st.grade] || "#3b82f6",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold font-mono">
                        ↗ +1.8%
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setFilterGrade(st.grade);
                            setActiveTab("roster");
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          View Roster
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Sent Notifications Log & Confirmation Summary */}
      {sentLogsSummary && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Automated Fee Reminders Delivered!</h3>
                  <p className="text-xs text-slate-400">
                    {sentLogsSummary.length} notifications generated & logged to Parent Portal.
                  </p>
                </div>
              </div>
              <button onClick={() => setSentLogsSummary(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {sentLogsSummary.map((log) => (
                <div key={log.id} className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {log.studentName} ({log.parentPhone})
                    </span>
                    <span className="bg-emerald-900/80 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-700">
                      {log.type} {log.status}
                    </span>
                  </div>
                  <p className="text-slate-200 font-mono text-[11px] leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    {log.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Parents can view these reminders in the <strong>Parent Portal</strong>.
              </span>
              <button
                onClick={() => setSentLogsSummary(null)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Student */}
      {(showAddModal || editingStudent) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-500" />
                  {editingStudent ? `Edit Student: ${editingStudent.name}` : "Enroll New Student for Van Transport"}
                </h3>
                <p className="text-xs text-slate-500">
                  Verify pickup stop GPS coordinates, van route distance, and monthly transport fee assignment.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Student Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. K. Rahul"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Class / Grade</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                    <option value="Grade I">Grade I</option>
                    <option value="Grade II">Grade II</option>
                    <option value="Grade III">Grade III</option>
                    <option value="Grade IV">Grade IV</option>
                    <option value="Grade V">Grade V</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Transport Vehicle</label>
                  <select
                    value={newVehicleId}
                    onChange={(e) => setNewVehicleId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} ({v.type}) - {v.routeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Parent Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. R. Karthik"
                    value={newParentName}
                    onChange={(e) => setNewParentName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Parent Mobile (WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9840123456"
                    value={newParentPhone}
                    onChange={(e) => setNewParentPhone(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pickup Stop Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Essur Junction"
                    value={newStopName}
                    onChange={(e) => setNewStopName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Route Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 4.5"
                    value={newDistanceKm}
                    onChange={(e) => setNewDistanceKm(parseFloat(e.target.value) || 0.5)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-extrabold text-slate-900"
                  />
                </div>
              </div>

              {/* Leaflet Interactive Route Verification Map Preview Component */}
              <div className="pt-2">
                <label className="font-extrabold text-slate-800 block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600 animate-bounce" />
                    Leaflet Route Map Verification & Pickup GPS Pin:
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    (Drag green pin or click map to update GPS coordinates)
                  </span>
                </label>

                <StudentPickupMapPreview
                  pickupLat={newLat}
                  pickupLng={newLng}
                  stopName={newStopName || "Pickup Location"}
                  studentName={newName || "Student"}
                  assignedVehicle={vehicles.find((v) => v.id === newVehicleId)}
                  onChangeLocation={(lat, lng, calculatedKm) => {
                    setNewLat(lat);
                    setNewLng(lng);
                    if (calculatedKm) {
                      setNewDistanceKm(calculatedKm);
                    }
                  }}
                  distanceKm={newDistanceKm}
                  parentPhone={newParentPhone}
                />
              </div>

              {/* Digital Records & Camera Vault Shortcut in Edit Form */}
              {editingStudent && (
                <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-amber-400 animate-pulse" />
                    <div>
                      <h5 className="font-extrabold text-xs text-white">Student Digital Records & Camera Vault</h5>
                      <p className="text-[10px] text-slate-400">
                        {editingStudent.documents?.length || 0} digital records stored for {editingStudent.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocModalStudent(editingStudent)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-950" />
                    Open Camera Vault
                  </button>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-xl text-sm transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5 text-amber-300" />
                  Save Student & Verify Route Fee (₹{calculateMonthlyTransportFee(newDistanceKm, vehicles.find((v) => v.id === newVehicleId)?.type || "Van (14-Seater)")}/mo)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student QR Pass Modal */}
      {qrPassStudent && (
        <StudentQrPassModal
          student={qrPassStudent}
          students={students}
          vehicles={vehicles}
          onClose={() => setQrPassStudent(null)}
          onSelectStudent={(st) => setQrPassStudent(st)}
        />
      )}

      {/* Student Digital Document Camera & ID Vault Modal */}
      {docModalStudent && (
        <StudentDocumentModal
          student={docModalStudent}
          onClose={() => setDocModalStudent(null)}
          onSaveStudentDocuments={handleSaveStudentDocuments}
        />
      )}

      {/* Student Detailed Historical Attendance & Fee Ledger History Modal */}
      {detailModalStudent && (
        <StudentDetailModal
          student={detailModalStudent}
          vehicles={vehicles}
          onClose={() => setDetailModalStudent(null)}
          onSendSingleAlert={handleTriggerSingleAlert}
          onOpenReceipt={onOpenReceipt}
        />
      )}

      {/* Batch Student Excel / CSV Import Modal */}
      <StudentExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        vehicles={vehicles}
        existingStudents={students}
        onImportStudents={handleImportStudentsBulk}
      />

      {/* Printable Digital ID Card Modal */}
      <StudentDigitalIdCardModal
        isOpen={showIdCardModal}
        student={idCardStudent}
        students={selectedRosterStudentIds.size > 0 ? students.filter((s) => selectedRosterStudentIds.has(s.id)) : students}
        vehicles={vehicles}
        onClose={() => setShowIdCardModal(false)}
        onSelectStudent={(s) => setIdCardStudent(s)}
        onUpdateStudentPhoto={handleUpdateStudentPhoto}
      />

      {/* Bulk WhatsApp Direct Dispatcher Modal */}
      <BulkWhatsAppDispatchModal
        isOpen={showBulkWhatsAppModal}
        onClose={() => setShowBulkWhatsAppModal(false)}
        selectedStudents={students.filter((s) => selectedRosterStudentIds.has(s.id))}
        vehicles={vehicles}
      />
    </div>
  );
};
