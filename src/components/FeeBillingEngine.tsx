import React, { useState } from "react";
import {
  CreditCard,
  Calculator,
  Receipt,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ShieldCheck,
  Send,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Fuel,
  Wrench,
  Users,
  FileText,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  CheckCircle,
  Filter,
  QrCode,
  Camera,
  Pencil,
  Trash2,
  Search,
  X,
  Plus,
  AlertTriangle,
  Save,
  Edit,
  Copy,
  ExternalLink,
  Smartphone,
  Play,
  Check,
  History,
  Calendar,
  User,
  Wallet,
  ArrowRight,
  Printer
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Student, PaymentReceipt, Vehicle, PaymentStatus } from "../types";
import { SCHOOL_INFO } from "../data/mockData";
import { calculateStudentTotalBill, calculateMonthlyTransportFee, DEFAULT_FEE_SLABS, VEHICLE_TYPE_MULTIPLIERS } from "../utils/feeCalculator";
import { UpiPaymentQrCode } from "./UpiPaymentQrCode";
import { CameraQrScanner } from "./CameraQrScanner";
import { MonthlyFeeReportModal } from "./MonthlyFeeReportModal";

interface FeeBillingEngineProps {
  students: Student[];
  vehicles: Vehicle[];
  onOpenReceipt: (receipt: PaymentReceipt) => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  onAddStudent?: (newStudent: Student) => void;
}

export interface PaymentHistoryRecord {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  feeType: string;
  tuitionPaid: number;
  transportPaid: number;
  totalPaid: number;
  paymentMethod: "UPI (GPay/PhonePe)" | "Cash at Counter" | "Bank NEFT/IMPS" | "Demand Draft";
  utrNumber: string;
  status: "Verified & Cleared" | "Pending Clearance" | "Partially Settled";
  collectedBy: string;
  remarks?: string;
}

const generateInitialStudentHistory = (student: Student, vehicles: Vehicle[]): PaymentHistoryRecord[] => {
  const vehicle = vehicles.find((v) => v.id === student.assignedVehicleId) || vehicles[0];
  const bill = calculateStudentTotalBill(student.grade, student.distanceKm, vehicle?.type || "Van (14-Seater)");

  const records: PaymentHistoryRecord[] = [];

  // Term 1 2025-26
  records.push({
    id: `HIST-${student.id}-1`,
    receiptNumber: `WIS-2025-${Math.floor(100000 + Math.random() * 900000)}`,
    paymentDate: "12 Jun 2025",
    feeType: "Term 1 Tuition & Van Pass (2025-26)",
    tuitionPaid: bill.tuitionTermFee,
    transportPaid: bill.transportTermFee,
    totalPaid: bill.totalTermAmount,
    paymentMethod: "UPI (GPay/PhonePe)",
    utrNumber: `418290${Math.floor(100000 + Math.random() * 900000)}`,
    status: "Verified & Cleared",
    collectedBy: "Mr. R SARAVANAN (Admin)",
    remarks: "Full Term 1 Fee Cleared via HDFC UPI",
  });

  // Term 2 2025-26
  records.push({
    id: `HIST-${student.id}-2`,
    receiptNumber: `WIS-2025-${Math.floor(100000 + Math.random() * 900000)}`,
    paymentDate: "10 Nov 2025",
    feeType: "Term 2 Tuition & Van Transport Fee (2025-26)",
    tuitionPaid: bill.tuitionTermFee,
    transportPaid: bill.transportTermFee,
    totalPaid: bill.totalTermAmount,
    paymentMethod: student.paymentStatus === "Paid" ? "UPI (GPay/PhonePe)" : "Cash at Counter",
    utrNumber: student.lastUtrNumber || `420192${Math.floor(100000 + Math.random() * 900000)}`,
    status: "Verified & Cleared",
    collectedBy: "School Billing Desk (Essur)",
    remarks: "Receipt Issued & Logged in Register",
  });

  // Term 3 2025-26 if status is Paid or Partially Paid
  if (student.paymentStatus === "Paid") {
    records.push({
      id: `HIST-${student.id}-3`,
      receiptNumber: `WIS-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentDate: student.lastPaymentDate || "15 Mar 2026",
      feeType: "Term 3 Final Installment & Transport Pass (2025-26)",
      tuitionPaid: bill.tuitionTermFee,
      transportPaid: bill.transportTermFee,
      totalPaid: bill.totalTermAmount,
      paymentMethod: "UPI (GPay/PhonePe)",
      utrNumber: student.lastUtrNumber || `423891${Math.floor(100000 + Math.random() * 900000)}`,
      status: "Verified & Cleared",
      collectedBy: "Mr. R SARAVANAN (Admin)",
      remarks: "Full Term 3 Settlement Confirmed",
    });
  } else if (student.paymentStatus === "Partially Paid") {
    records.push({
      id: `HIST-${student.id}-3`,
      receiptNumber: `WIS-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentDate: student.lastPaymentDate || "02 Apr 2026",
      feeType: "Term 3 Partial Advance Fee Settlement",
      tuitionPaid: Math.floor(bill.tuitionTermFee / 2),
      transportPaid: Math.floor(bill.transportTermFee / 2),
      totalPaid: Math.floor(bill.totalTermAmount / 2),
      paymentMethod: "Cash at Counter",
      utrNumber: "CASH-REC-" + Math.floor(1000 + Math.random() * 9000),
      status: "Partially Settled",
      collectedBy: "School Office Desk",
      remarks: "Part payment received; balance pending",
    });
  }

  return records;
};

const MONTHLY_FINANCIAL_DATA = [
  { month: "Jun", expectedCollection: 145000, actualCollection: 141000, transportExpenditure: 98000, fuelCost: 48000, salaryCost: 32000, maintenanceCost: 12000, insuranceTollCost: 6000 },
  { month: "Jul", expectedCollection: 148000, actualCollection: 144000, transportExpenditure: 102000, fuelCost: 51000, salaryCost: 32000, maintenanceCost: 13000, insuranceTollCost: 6000 },
  { month: "Aug", expectedCollection: 148000, actualCollection: 146500, transportExpenditure: 99500, fuelCost: 49500, salaryCost: 32000, maintenanceCost: 12000, insuranceTollCost: 6000 },
  { month: "Sep", expectedCollection: 152000, actualCollection: 145000, transportExpenditure: 112000, fuelCost: 52000, salaryCost: 32000, maintenanceCost: 22000, insuranceTollCost: 6000 },
  { month: "Oct", expectedCollection: 152000, actualCollection: 149000, transportExpenditure: 101000, fuelCost: 50000, salaryCost: 32000, maintenanceCost: 13000, insuranceTollCost: 6000 },
  { month: "Nov", expectedCollection: 155000, actualCollection: 151000, transportExpenditure: 104000, fuelCost: 52500, salaryCost: 32000, maintenanceCost: 13500, insuranceTollCost: 6000 },
  { month: "Dec", expectedCollection: 155000, actualCollection: 152500, transportExpenditure: 106000, fuelCost: 53000, salaryCost: 32000, maintenanceCost: 15000, insuranceTollCost: 6000 },
  { month: "Jan", expectedCollection: 158000, actualCollection: 154000, transportExpenditure: 118000, fuelCost: 54000, salaryCost: 32000, maintenanceCost: 24000, insuranceTollCost: 8000 },
  { month: "Feb", expectedCollection: 158000, actualCollection: 156000, transportExpenditure: 105000, fuelCost: 53500, salaryCost: 32000, maintenanceCost: 13500, insuranceTollCost: 6000 },
  { month: "Mar", expectedCollection: 162000, actualCollection: 158500, transportExpenditure: 108000, fuelCost: 55000, salaryCost: 32000, maintenanceCost: 15000, insuranceTollCost: 6000 },
  { month: "Apr", expectedCollection: 162000, actualCollection: 160000, transportExpenditure: 110000, fuelCost: 56000, salaryCost: 32000, maintenanceCost: 16000, insuranceTollCost: 6000 },
  { month: "May", expectedCollection: 120000, actualCollection: 116000, transportExpenditure: 75000, fuelCost: 32000, salaryCost: 32000, maintenanceCost: 7000, insuranceTollCost: 4000 },
];

export const FeeBillingEngine: React.FC<FeeBillingEngineProps> = ({
  students,
  vehicles,
  onOpenReceipt,
  onEditStudent,
  onDeleteStudent,
  onAddStudent,
}) => {
  const [filterPayment, setFilterPayment] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chartViewMode, setChartViewMode] = useState<"overview" | "expenseBreakdown" | "efficiency">("overview");
  const [chartType, setChartType] = useState<"revenueBar" | "composed" | "groupedBar" | "stackedExpense">("revenueBar");
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(10); // Default to April (160k vs March 158.5k)
  const [qrModalData, setQrModalData] = useState<{
    studentName: string;
    studentRoll?: string;
    grade?: string;
    amount: number;
    feeType?: string;
  } | null>(null);
  const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);

  // Edit & Delete & Add Modal States
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Automated Monthly Fee Collection & Dues Report Modal State
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState<boolean>(false);

  // Automated WhatsApp Payment Reminder Engine States
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [whatsAppTargetFilter, setWhatsAppTargetFilter] = useState<"Overdue" | "All Unpaid">("Overdue");
  const [sentWhatsAppIds, setSentWhatsAppIds] = useState<string[]>([]);
  const [isBulkTriggering, setIsBulkTriggering] = useState<boolean>(false);
  const [customWhatsAppMessage, setCustomWhatsAppMessage] = useState<string>(
    `Hello {ParentName}, Wisdom Nursery & Primary School (Essur) urgent fee notice: The term transport & tuition fees for your ward {StudentName} ({Grade}, Roll: {RollNumber}) are {Status}. Total Due: {TotalAmount}. Please transfer via UPI to {UpiId} (R Saravanan) or contact Chief Transport Officer Mr. R SARAVANAN at +91 9176593129. Thank you!`
  );

  // Early Bird Fee Discount Reminders Engine States
  const [showEarlyBirdModal, setShowEarlyBirdModal] = useState<boolean>(false);
  const [earlyBirdDiscountPct, setEarlyBirdDiscountPct] = useState<number>(5); // Default 5% discount
  const [earlyBirdDeadlineDate, setEarlyBirdDeadlineDate] = useState<string>("15 Aug 2026");
  const [earlyBirdTargetFilter, setEarlyBirdTargetFilter] = useState<"Pending & Overdue" | "All Unpaid" | "Pending Only">("Pending & Overdue");
  const [sentEarlyBirdIds, setSentEarlyBirdIds] = useState<string[]>([]);
  const [isEarlyBirdBulkTriggering, setIsEarlyBirdBulkTriggering] = useState<boolean>(false);
  const [customEarlyBirdMessage, setCustomEarlyBirdMessage] = useState<string>(
    `Dear {ParentName}, Wisdom Nursery & Primary School (Essur) Special Early Bird Offer! Pay term fees for {StudentName} ({Grade}, Roll: {RollNumber}) before {DeadlineDate} and enjoy a {DiscountPct}% Early Bird Fee Discount! Original Term Fee: {TotalAmount}. Early Bird Discounted Payable: {DiscountedAmount} (You Save {SavingsAmount}). Pay via UPI to 9176593129@ybl (R Saravanan) or contact Admin Mr. R SARAVANAN at +91 9176593129. Thank you!`
  );

  // Student Payment History Engine States
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [studentHistories, setStudentHistories] = useState<Record<string, PaymentHistoryRecord[]>>({});
  const [showAddHistoryForm, setShowAddHistoryForm] = useState<boolean>(false);
  const [newHistoryData, setNewHistoryData] = useState<{
    feeType: string;
    paymentDate: string;
    tuitionPaid: number;
    transportPaid: number;
    paymentMethod: "UPI (GPay/PhonePe)" | "Cash at Counter" | "Bank NEFT/IMPS" | "Demand Draft";
    utrNumber: string;
    remarks: string;
    updateStatusToPaid: boolean;
  }>({
    feeType: "Academic Year Term Fee Settlement",
    paymentDate: new Date().toISOString().split("T")[0],
    tuitionPaid: 12000,
    transportPaid: 2400,
    paymentMethod: "UPI (GPay/PhonePe)",
    utrNumber: "",
    remarks: "Manual entry logged by admin desk",
    updateStatusToPaid: true,
  });

  const getStudentHistoryRecords = (student: Student): PaymentHistoryRecord[] => {
    if (studentHistories[student.id]) {
      return studentHistories[student.id];
    }
    const initial = generateInitialStudentHistory(student, vehicles);
    setStudentHistories((prev) => ({ ...prev, [student.id]: initial }));
    return initial;
  };

  const handleOpenStudentHistory = (student: Student) => {
    getStudentHistoryRecords(student);
    const vehicle = vehicles.find((v) => v.id === student.assignedVehicleId) || vehicles[0];
    const bill = calculateStudentTotalBill(student.grade, student.distanceKm, vehicle?.type || "Van (14-Seater)");

    setNewHistoryData({
      feeType: `Term 3 Fee Settlement (${student.grade})`,
      paymentDate: new Date().toISOString().split("T")[0],
      tuitionPaid: bill.tuitionTermFee,
      transportPaid: bill.transportTermFee,
      paymentMethod: "UPI (GPay/PhonePe)",
      utrNumber: `42${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      remarks: "Received via UPI / Office Counter",
      updateStatusToPaid: true,
    });
    setShowAddHistoryForm(false);
    setHistoryStudent(student);
  };

  const handleAddHistoricalPayment = (student: Student) => {
    const totalPaid = Number(newHistoryData.tuitionPaid) + Number(newHistoryData.transportPaid);
    if (totalPaid <= 0) {
      alert("Please enter a valid tuition or transport payment amount.");
      return;
    }

    const newRecord: PaymentHistoryRecord = {
      id: `HIST-${student.id}-${Date.now()}`,
      receiptNumber: `WIS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentDate: newHistoryData.paymentDate || new Date().toLocaleDateString("en-IN"),
      feeType: newHistoryData.feeType || "Fee Settlement",
      tuitionPaid: Number(newHistoryData.tuitionPaid),
      transportPaid: Number(newHistoryData.transportPaid),
      totalPaid: totalPaid,
      paymentMethod: newHistoryData.paymentMethod,
      utrNumber: newHistoryData.utrNumber || `UTR-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      status: "Verified & Cleared",
      collectedBy: "Mr. R SARAVANAN (Admin)",
      remarks: newHistoryData.remarks,
    };

    const currentRecords = studentHistories[student.id] || generateInitialStudentHistory(student, vehicles);
    const updatedRecords = [newRecord, ...currentRecords];

    setStudentHistories((prev) => ({ ...prev, [student.id]: updatedRecords }));

    if (newHistoryData.updateStatusToPaid && onEditStudent) {
      onEditStudent({
        ...student,
        paymentStatus: "Paid",
        lastPaymentDate: newHistoryData.paymentDate,
        lastUtrNumber: newRecord.utrNumber,
      });
    }

    setShowAddHistoryForm(false);
    setActionSuccessMsg(`Recorded payment receipt ${newRecord.receiptNumber} (₹${totalPaid.toLocaleString("en-IN")}) for ${student.name}!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleGenerateReceiptForHistory = (student: Student, record: PaymentHistoryRecord) => {
    const receipt: PaymentReceipt = {
      receiptNumber: record.receiptNumber,
      schoolName: SCHOOL_INFO.name,
      address: SCHOOL_INFO.location,
      motto: SCHOOL_INFO.motto,
      contactPerson: `${SCHOOL_INFO.contactPerson} (${SCHOOL_INFO.contactPhone})`,
      upiId: SCHOOL_INFO.upiId,
      studentId: student.rollNumber,
      studentName: student.name,
      grade: student.grade,
      parentName: student.parentName,
      amountPaid: record.totalPaid,
      tuitionFeePart: record.tuitionPaid,
      transportFeePart: record.transportPaid,
      utrNumber: record.utrNumber,
      paymentMethod: record.paymentMethod,
      feeType: record.feeType,
      paymentDate: record.paymentDate,
      status: record.status.toUpperCase(),
    };

    onOpenReceipt(receipt);
  };

  // Form data state for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    rollNumber: string;
    grade: string;
    parentName: string;
    parentPhone: string;
    pickupStopName: string;
    distanceKm: number;
    paymentStatus: PaymentStatus;
    assignedVehicleId: string;
    lastPaymentDate: string;
    lastUtrNumber: string;
  }>({
    name: "",
    rollNumber: "",
    grade: "LKG",
    parentName: "",
    parentPhone: "",
    pickupStopName: "",
    distanceKm: 5,
    paymentStatus: "Pending",
    assignedVehicleId: vehicles[0]?.id || "",
    lastPaymentDate: new Date().toLocaleDateString("en-IN"),
    lastUtrNumber: "",
  });

  // Summary financial health metrics
  const totalAnnualCollection = MONTHLY_FINANCIAL_DATA.reduce((sum, item) => sum + item.actualCollection, 0);
  const totalAnnualExpected = MONTHLY_FINANCIAL_DATA.reduce((sum, item) => sum + item.expectedCollection, 0);
  const totalAnnualExpenditure = MONTHLY_FINANCIAL_DATA.reduce((sum, item) => sum + item.transportExpenditure, 0);
  const totalFuelCost = MONTHLY_FINANCIAL_DATA.reduce((sum, item) => sum + item.fuelCost, 0);
  const totalSalaryCost = MONTHLY_FINANCIAL_DATA.reduce((sum, item) => sum + item.salaryCost, 0);
  const totalMaintenanceCost = MONTHLY_FINANCIAL_DATA.reduce((sum, item) => sum + item.maintenanceCost, 0);
  const totalInsuranceTollCost = MONTHLY_FINANCIAL_DATA.reduce((sum, item) => sum + item.insuranceTollCost, 0);

  const totalAnnualSurplus = totalAnnualCollection - totalAnnualExpenditure;
  const operatingMarginPct = ((totalAnnualSurplus / totalAnnualCollection) * 100).toFixed(1);
  const collectionEfficiencyPct = ((totalAnnualCollection / totalAnnualExpected) * 100).toFixed(1);

  // Month-over-Month Revenue Growth Calculations
  const currentFinancialMonth = MONTHLY_FINANCIAL_DATA[selectedMonthIndex] || MONTHLY_FINANCIAL_DATA[MONTHLY_FINANCIAL_DATA.length - 1];
  const previousFinancialMonth = selectedMonthIndex > 0 ? MONTHLY_FINANCIAL_DATA[selectedMonthIndex - 1] : null;

  const momGrowthDiff = previousFinancialMonth
    ? currentFinancialMonth.actualCollection - previousFinancialMonth.actualCollection
    : 0;

  const momGrowthPct = previousFinancialMonth && previousFinancialMonth.actualCollection > 0
    ? ((momGrowthDiff / previousFinancialMonth.actualCollection) * 100).toFixed(2)
    : "0.00";

  const totalCollected = students
    .filter((s) => s.paymentStatus === "Paid")
    .reduce((sum, s) => {
      const v = vehicles.find((v) => v.id === s.assignedVehicleId) || vehicles[0];
      const bill = calculateStudentTotalBill(s.grade, s.distanceKm, v?.type || "Van (14-Seater)");
      return sum + bill.totalTermAmount;
    }, 0);

  const totalPending = students
    .filter((s) => s.paymentStatus === "Pending" || s.paymentStatus === "Overdue" || s.paymentStatus === "Partially Paid")
    .reduce((sum, s) => {
      const v = vehicles.find((v) => v.id === s.assignedVehicleId) || vehicles[0];
      const bill = calculateStudentTotalBill(s.grade, s.distanceKm, v?.type || "Van (14-Seater)");
      return sum + bill.totalTermAmount;
    }, 0);

  // Current Month Paid vs Pending Transport Fee Aggregations (July 2026)
  const currentMonthFeeStats = students.reduce(
    (acc, s) => {
      const v = vehicles.find((v) => v.id === s.assignedVehicleId) || vehicles[0];
      const monthlyTransportFee = calculateMonthlyTransportFee(s.distanceKm, v?.type || "Van (14-Seater)");

      if (s.paymentStatus === "Paid") {
        acc.paidAmount += monthlyTransportFee;
        acc.paidCount += 1;
      } else if (s.paymentStatus === "Pending") {
        acc.pendingAmount += monthlyTransportFee;
        acc.pendingCount += 1;
      } else if (s.paymentStatus === "Overdue") {
        acc.overdueAmount += monthlyTransportFee;
        acc.overdueCount += 1;
      } else if (s.paymentStatus === "Partially Paid") {
        acc.partialAmount += Math.round(monthlyTransportFee * 0.5);
        acc.pendingAmount += Math.round(monthlyTransportFee * 0.5);
        acc.partialCount += 1;
      }
      acc.totalMonthlyTarget += monthlyTransportFee;
      acc.totalStudents += 1;
      return acc;
    },
    {
      paidAmount: 0,
      paidCount: 0,
      pendingAmount: 0,
      pendingCount: 0,
      overdueAmount: 0,
      overdueCount: 0,
      partialAmount: 0,
      partialCount: 0,
      totalMonthlyTarget: 0,
      totalStudents: 0,
    }
  );

  const currentMonthPaidPct = currentMonthFeeStats.totalMonthlyTarget > 0
    ? ((currentMonthFeeStats.paidAmount / currentMonthFeeStats.totalMonthlyTarget) * 100).toFixed(1)
    : "0";

  const currentMonthPendingPct = currentMonthFeeStats.totalMonthlyTarget > 0
    ? (((currentMonthFeeStats.pendingAmount + currentMonthFeeStats.overdueAmount) / currentMonthFeeStats.totalMonthlyTarget) * 100).toFixed(1)
    : "0";

  const currentMonthPieChartData = [
    { name: "Paid Transport Fees", value: currentMonthFeeStats.paidAmount, count: currentMonthFeeStats.paidCount, color: "#10b981" },
    { name: "Pending Fees", value: currentMonthFeeStats.pendingAmount, count: currentMonthFeeStats.pendingCount, color: "#f59e0b" },
    { name: "Overdue Fees", value: currentMonthFeeStats.overdueAmount, count: currentMonthFeeStats.overdueCount, color: "#ef4444" },
    { name: "Partially Paid", value: currentMonthFeeStats.partialAmount, count: currentMonthFeeStats.partialCount, color: "#3b82f6" },
  ].filter((item) => item.value > 0);

  // Route-wise Paid vs Pending transport fee comparison for current month
  const routePaidPendingData = vehicles.map((v) => {
    const routeStudents = students.filter((s) => s.assignedVehicleId === v.id);
    let paid = 0;
    let pending = 0;
    routeStudents.forEach((s) => {
      const fee = calculateMonthlyTransportFee(s.distanceKm, v.type);
      if (s.paymentStatus === "Paid") {
        paid += fee;
      } else if (s.paymentStatus === "Partially Paid") {
        paid += Math.round(fee * 0.5);
        pending += Math.round(fee * 0.5);
      } else {
        pending += fee;
      }
    });
    return {
      routeName: v.routeName.split("(")[0].trim() || v.registrationNumber,
      vehicleId: v.id,
      regNumber: v.registrationNumber,
      Paid: paid,
      Pending: pending,
      Total: paid + pending,
      studentsCount: routeStudents.length,
    };
  });

  const filteredStudents = students.filter((s) => {
    const matchesFilter = filterPayment === "All" || s.paymentStatus === filterPayment;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.parentName.toLowerCase().includes(q) ||
      s.pickupStopName.toLowerCase().includes(q) ||
      s.grade.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // Modal Action Handlers
  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      grade: student.grade,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      pickupStopName: student.pickupStopName,
      distanceKm: student.distanceKm,
      paymentStatus: student.paymentStatus,
      assignedVehicleId: student.assignedVehicleId,
      lastPaymentDate: student.lastPaymentDate || new Date().toLocaleDateString("en-IN"),
      lastUtrNumber: student.lastUtrNumber || "",
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const vehicle = vehicles.find((v) => v.id === formData.assignedVehicleId) || vehicles[0];
    const updated: Student = {
      ...editingStudent,
      name: formData.name,
      rollNumber: formData.rollNumber,
      grade: formData.grade,
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      pickupStopName: formData.pickupStopName,
      distanceKm: Number(formData.distanceKm) || 0,
      paymentStatus: formData.paymentStatus,
      assignedVehicleId: formData.assignedVehicleId,
      assignedRouteName: vehicle?.routeName || "Route 1",
      lastPaymentDate: formData.lastPaymentDate,
      lastUtrNumber: formData.lastUtrNumber,
    };

    if (onEditStudent) {
      onEditStudent(updated);
    }
    setEditingStudent(null);
    setActionSuccessMsg(`Updated student fee record for "${formData.name}".`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleConfirmDelete = () => {
    if (!deletingStudent) return;
    if (onDeleteStudent) {
      onDeleteStudent(deletingStudent.id);
    }
    setActionSuccessMsg(`Deleted student fee record for "${deletingStudent.name}".`);
    setDeletingStudent(null);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      rollNumber: `WIS-2026-${Math.floor(100 + Math.random() * 900)}`,
      grade: "LKG",
      parentName: "",
      parentPhone: "9876543210",
      pickupStopName: "Essur Bus Stop",
      distanceKm: 5,
      paymentStatus: "Pending",
      assignedVehicleId: vehicles[0]?.id || "",
      lastPaymentDate: new Date().toLocaleDateString("en-IN"),
      lastUtrNumber: "",
    });
    setShowAddModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.id === formData.assignedVehicleId) || vehicles[0];
    const newStudent: Student = {
      id: "STU-" + Date.now(),
      name: formData.name,
      rollNumber: formData.rollNumber,
      grade: formData.grade,
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      address: `${formData.pickupStopName}, Essur`,
      pickupStopName: formData.pickupStopName,
      distanceKm: Number(formData.distanceKm) || 0,
      assignedVehicleId: formData.assignedVehicleId,
      assignedRouteName: vehicle?.routeName || "Route 1",
      tuitionFeePerTerm: 12000,
      transportFeePerMonth: calculateMonthlyTransportFee(Number(formData.distanceKm) || 0, vehicle?.type || "Van (14-Seater)"),
      paymentStatus: formData.paymentStatus,
      lastPaymentDate: formData.lastPaymentDate,
      lastUtrNumber: formData.lastUtrNumber,
      attendanceStatus: "Boarded Pickup",
      lastStatusTime: "08:15 AM",
      rfidTagId: "RFID-" + Math.floor(1000 + Math.random() * 9000),
    };

    if (onAddStudent) {
      onAddStudent(newStudent);
    }
    setShowAddModal(false);
    setActionSuccessMsg(`Added new student fee record for "${formData.name}".`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // WhatsApp Automated Reminder Helpers
  const getTargetedWhatsAppStudents = () => {
    if (whatsAppTargetFilter === "Overdue") {
      return students.filter((s) => s.paymentStatus === "Overdue");
    }
    return students.filter((s) => s.paymentStatus === "Overdue" || s.paymentStatus === "Pending" || s.paymentStatus === "Partially Paid");
  };

  const formatWhatsAppText = (student: Student) => {
    const vehicle = vehicles.find((v) => v.id === student.assignedVehicleId) || vehicles[0];
    const bill = calculateStudentTotalBill(student.grade, student.distanceKm, vehicle?.type || "Van (14-Seater)");

    return customWhatsAppMessage
      .replace(/{ParentName}/g, student.parentName)
      .replace(/{StudentName}/g, student.name)
      .replace(/{Grade}/g, student.grade)
      .replace(/{RollNumber}/g, student.rollNumber)
      .replace(/{Status}/g, student.paymentStatus.toUpperCase())
      .replace(/{TotalAmount}/g, bill.formattedTotalTerm)
      .replace(/{UpiId}/g, SCHOOL_INFO.upiId);
  };

  const triggerSingleWhatsApp = (student: Student) => {
    const text = formatWhatsAppText(student);
    const cleanPhone = student.parentPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    if (!sentWhatsAppIds.includes(student.id)) {
      setSentWhatsAppIds((prev) => [...prev, student.id]);
    }
  };

  const triggerBatchWhatsApp = () => {
    const targeted = getTargetedWhatsAppStudents();
    if (targeted.length === 0) return;
    setIsBulkTriggering(true);

    targeted.forEach((student, index) => {
      setTimeout(() => {
        triggerSingleWhatsApp(student);
        if (index === targeted.length - 1) {
          setIsBulkTriggering(false);
          setActionSuccessMsg(`Triggered automated WhatsApp reminders to ${targeted.length} parents (Contact Admin: 9176593129)!`);
          setTimeout(() => setActionSuccessMsg(null), 5000);
        }
      }, index * 1200);
    });
  };

  const copyWhatsAppLogsToClipboard = () => {
    const targeted = getTargetedWhatsAppStudents();
    const log = targeted
      .map((student, i) => {
        const text = formatWhatsAppText(student);
        return `[${i + 1}] Parent: ${student.parentName} (${student.parentPhone}) | Student: ${student.name} (${student.grade}) | Status: ${student.paymentStatus}\nMessage: ${text}\n`;
      })
      .join("\n--------------------------------------------------\n");

    navigator.clipboard.writeText(
      `WISDOM NURSERY & PRIMARY SCHOOL (ESSUR)\nAUTOMATED OVERDUE PAYMENT REMINDER LOGS (Contact Admin: +91 9176593129)\nGenerated: ${new Date().toLocaleString()}\nTotal Reminders: ${targeted.length}\n\n` + log
    );

    setActionSuccessMsg("Copied all WhatsApp reminder logs to clipboard!");
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Early Bird Discount Helper Functions
  const calculateEarlyBird = (student: Student) => {
    const vehicle = vehicles.find((v) => v.id === student.assignedVehicleId) || vehicles[0];
    const bill = calculateStudentTotalBill(student.grade, student.distanceKm, vehicle?.type || "Van (14-Seater)");
    const originalTotal = bill.totalTermAmount;
    const savingsAmount = Math.round((originalTotal * earlyBirdDiscountPct) / 100);
    const discountedAmount = Math.max(0, originalTotal - savingsAmount);

    return {
      originalTotal,
      savingsAmount,
      discountedAmount,
      formattedOriginal: bill.formattedTotalTerm,
      formattedSavings: `₹${savingsAmount.toLocaleString("en-IN")}`,
      formattedDiscounted: `₹${discountedAmount.toLocaleString("en-IN")}`,
    };
  };

  const getTargetedEarlyBirdStudents = () => {
    if (earlyBirdTargetFilter === "Pending Only") {
      return students.filter((s) => s.paymentStatus === "Pending");
    }
    if (earlyBirdTargetFilter === "Pending & Overdue") {
      return students.filter((s) => s.paymentStatus === "Pending" || s.paymentStatus === "Overdue");
    }
    return students.filter((s) => s.paymentStatus === "Pending" || s.paymentStatus === "Overdue" || s.paymentStatus === "Partially Paid");
  };

  const formatEarlyBirdText = (student: Student) => {
    const eb = calculateEarlyBird(student);
    return customEarlyBirdMessage
      .replace(/{ParentName}/g, student.parentName)
      .replace(/{StudentName}/g, student.name)
      .replace(/{Grade}/g, student.grade)
      .replace(/{RollNumber}/g, student.rollNumber)
      .replace(/{DeadlineDate}/g, earlyBirdDeadlineDate)
      .replace(/{DiscountPct}/g, earlyBirdDiscountPct.toString())
      .replace(/{TotalAmount}/g, eb.formattedOriginal)
      .replace(/{DiscountedAmount}/g, eb.formattedDiscounted)
      .replace(/{SavingsAmount}/g, eb.formattedSavings)
      .replace(/{UpiId}/g, SCHOOL_INFO.upiId)
      .replace(/{AdminPhone}/g, SCHOOL_INFO.contactPhone);
  };

  const triggerSingleEarlyBird = (student: Student) => {
    const text = formatEarlyBirdText(student);
    const cleanPhone = student.parentPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");

    if (!sentEarlyBirdIds.includes(student.id)) {
      setSentEarlyBirdIds((prev) => [...prev, student.id]);
    }

    const eb = calculateEarlyBird(student);
    setActionSuccessMsg(`Triggered Early Bird ${earlyBirdDiscountPct}% Discount Notice for ${student.name} (Payable: ${eb.formattedDiscounted}, Saves ${eb.formattedSavings})!`);
    setTimeout(() => setActionSuccessMsg(null), 4500);
  };

  const triggerBatchEarlyBird = () => {
    const targeted = getTargetedEarlyBirdStudents();
    if (targeted.length === 0) return;
    setIsEarlyBirdBulkTriggering(true);

    targeted.forEach((student, index) => {
      setTimeout(() => {
        triggerSingleEarlyBird(student);
        if (index === targeted.length - 1) {
          setIsEarlyBirdBulkTriggering(false);
          setActionSuccessMsg(`Triggered Early Bird Discount notifications to ${targeted.length} parent WhatsApp accounts!`);
          setTimeout(() => setActionSuccessMsg(null), 5000);
        }
      }, index * 1200);
    });
  };

  const copyEarlyBirdLogsToClipboard = () => {
    const targeted = getTargetedEarlyBirdStudents();
    const log = targeted
      .map((student, i) => {
        const text = formatEarlyBirdText(student);
        const eb = calculateEarlyBird(student);
        return `[${i + 1}] Parent: ${student.parentName} (+91 ${student.parentPhone}) | Student: ${student.name} (${student.grade})\nOriginal: ${eb.formattedOriginal} | Early Bird Discount (${earlyBirdDiscountPct}%): ${eb.formattedDiscounted} (Save ${eb.formattedSavings})\nMessage: ${text}\n`;
      })
      .join("\n--------------------------------------------------\n");

    navigator.clipboard.writeText(
      `WISDOM NURSERY & PRIMARY SCHOOL (ESSUR)\nEARLY BIRD FEE DISCOUNT NOTIFICATIONS (Deadline: ${earlyBirdDeadlineDate}, Discount: ${earlyBirdDiscountPct}%)\nAdmin Contact: +91 9176593129 (R Saravanan)\nGenerated: ${new Date().toLocaleString()}\nTargeted Parents: ${targeted.length}\n\n` + log
    );

    setActionSuccessMsg("Copied all Early Bird Discount reminder logs to clipboard!");
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleSendReminder = (student: Student) => {
    triggerSingleWhatsApp(student);
  };

  const handleGenerateReceiptClick = (student: Student) => {
    const vehicle = vehicles.find((v) => v.id === student.assignedVehicleId) || vehicles[0];
    const bill = calculateStudentTotalBill(student.grade, student.distanceKm, vehicle?.type || "Van (14-Seater)");

    const receipt: PaymentReceipt = {
      receiptNumber: "WIS-" + Math.floor(100000 + Math.random() * 900000),
      schoolName: SCHOOL_INFO.name,
      address: SCHOOL_INFO.location,
      motto: SCHOOL_INFO.motto,
      contactPerson: `${SCHOOL_INFO.contactPerson} (${SCHOOL_INFO.contactPhone})`,
      upiId: SCHOOL_INFO.upiId,
      studentId: student.rollNumber,
      studentName: student.name,
      grade: student.grade,
      parentName: student.parentName,
      amountPaid: bill.totalTermAmount,
      tuitionFeePart: bill.tuitionTermFee,
      transportFeePart: bill.transportTermFee,
      utrNumber: student.lastUtrNumber || "420192837102",
      paymentMethod: "UPI Transfer / Online Gateway",
      feeType: "Tuition Fee + Van Transport Fee",
      paymentDate: student.lastPaymentDate || new Date().toLocaleDateString("en-IN"),
      status: "PAID & VERIFIED",
    };

    onOpenReceipt(receipt);
  };

  const handleDownloadMonthlyReport = () => {
    const reportMonth = "July 2026";
    const reportDate = new Date().toISOString().slice(0, 10);

    const csvRows: string[] = [];

    // Title & Header Information
    csvRows.push(`WISDOM NURSERY & PRIMARY SCHOOL (ESSUR)`);
    csvRows.push(`MONTHLY FEE & TRANSPORT PAYMENT STATUS REPORT - ${reportMonth.toUpperCase()}`);
    csvRows.push(`Report Generated Date: ${new Date().toLocaleString("en-IN")}`);
    csvRows.push(`Admin Desk Contact: ${SCHOOL_INFO.contactPerson} (+91 ${SCHOOL_INFO.contactPhone})`);
    csvRows.push(`Official School UPI ID: ${SCHOOL_INFO.upiId}`);
    csvRows.push(``);

    // Summary Financial Totals
    const totalStudentsCount = students.length;
    const paidStudentsCount = students.filter((s) => s.paymentStatus === "Paid").length;
    const pendingStudentsCount = students.filter((s) => s.paymentStatus === "Pending").length;
    const overdueStudentsCount = students.filter((s) => s.paymentStatus === "Overdue").length;
    const partialStudentsCount = students.filter((s) => s.paymentStatus === "Partially Paid").length;

    let totalDemandFee = 0;
    let totalPendingBalance = 0;
    let totalCollectedToDate = 0;

    students.forEach((s) => {
      const v = vehicles.find((veh) => veh.id === s.assignedVehicleId) || vehicles[0];
      const bill = calculateStudentTotalBill(s.grade, s.distanceKm, v?.type || "Van (14-Seater)");
      const totalBill = bill.totalTermAmount;
      totalDemandFee += totalBill;

      let bal = 0;
      if (s.balanceRemaining !== undefined) {
        bal = s.balanceRemaining;
      } else if (s.paymentStatus === "Paid") {
        bal = 0;
      } else if (s.paymentStatus === "Partially Paid") {
        bal = Math.round(totalBill * 0.5);
      } else {
        bal = totalBill;
      }

      totalPendingBalance += bal;
      totalCollectedToDate += Math.max(0, totalBill - bal);
    });

    csvRows.push(`--- MONTHLY EXECUTIVE SUMMARY METRICS ---`);
    csvRows.push(`Total Students Enrolled,${totalStudentsCount}`);
    csvRows.push(`Paid Accounts Count,${paidStudentsCount}`);
    csvRows.push(`Pending Accounts Count,${pendingStudentsCount}`);
    csvRows.push(`Overdue Accounts Count,${overdueStudentsCount}`);
    csvRows.push(`Partially Settled Accounts Count,${partialStudentsCount}`);
    csvRows.push(`Total Term & Transport Fee Demand (INR),${totalDemandFee}`);
    csvRows.push(`Total Fees Collected To Date (INR),${totalCollectedToDate}`);
    csvRows.push(`Total Outstanding Pending Balance (INR),${totalPendingBalance}`);
    csvRows.push(``);

    // Column Headers
    csvRows.push(`"Roll Number","Student Name","Grade / Class","Parent Name","Parent Phone","Pickup Stop","Distance (KM)","Assigned Vehicle / Route","Monthly Transport Fee (INR)","Tuition Term Fee (INR)","Total Term Amount (INR)","Outstanding Balance (INR)","Payment Status","Due Date","Last Payment Date","UTR / Reference No"`);

    // Data Rows
    students.forEach((s) => {
      const v = vehicles.find((veh) => veh.id === s.assignedVehicleId) || vehicles[0];
      const bill = calculateStudentTotalBill(s.grade, s.distanceKm, v?.type || "Van (14-Seater)");

      let bal = 0;
      if (s.balanceRemaining !== undefined) {
        bal = s.balanceRemaining;
      } else if (s.paymentStatus === "Paid") {
        bal = 0;
      } else if (s.paymentStatus === "Partially Paid") {
        bal = Math.round(bill.totalTermAmount * 0.5);
      } else {
        bal = bill.totalTermAmount;
      }

      const row = [
        `"${s.rollNumber}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.grade}"`,
        `"${s.parentName.replace(/"/g, '""')}"`,
        `"${s.parentPhone}"`,
        `"${s.pickupStopName.replace(/"/g, '""')}"`,
        s.distanceKm,
        `"${(v?.registrationNumber || '')} - ${(v?.routeName || s.assignedRouteName || '').replace(/"/g, '""')}"`,
        bill.transportMonthlyFee,
        bill.tuitionTermFee,
        bill.totalTermAmount,
        bal,
        `"${s.paymentStatus}"`,
        `"${s.dueDate || '2026-07-31'}"`,
        `"${s.lastPaymentDate || 'N/A'}"`,
        `"${s.lastUtrNumber || 'N/A'}"`,
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Monthly_Fee_And_Pending_Balance_Report_July_2026_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setActionSuccessMsg(`Successfully generated and downloaded Monthly Fee & Pending Balance Report CSV (${students.length} student records)!`);
    setTimeout(() => setActionSuccessMsg(null), 4500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider">
            Automated Billing Engine
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">School Fees & Distance Transport Billing</h2>
          <p className="text-xs text-slate-400">
            Automated fee calculation based on pickup distance (km) and vehicle category multipliers.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold flex-wrap sm:flex-nowrap">
          <div className="bg-emerald-950 border border-emerald-800 p-3 rounded-xl">
            <span className="text-emerald-400 text-[10px] uppercase block">Total Fees Collected</span>
            <span className="text-emerald-300 font-mono text-base">₹{totalCollected.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-amber-950 border border-amber-800 p-3 rounded-xl">
            <span className="text-amber-400 text-[10px] uppercase block">Pending Collections</span>
            <span className="text-amber-300 font-mono text-base">₹{totalPending.toLocaleString("en-IN")}</span>
          </div>
          <button
            onClick={() => setShowMonthlyReportModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-3 rounded-xl transition flex items-center gap-2 shadow-lg cursor-pointer border border-amber-300 whitespace-nowrap"
            title="Generate Official Monthly PDF Report of Fee Collections and Pending Dues Across All Student Grades"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            Monthly PDF Fee Report
          </button>
          <button
            onClick={handleDownloadMonthlyReport}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-3 rounded-xl transition flex items-center gap-2 shadow cursor-pointer border border-slate-700 whitespace-nowrap text-xs"
            title="Download CSV Summary Report of All Student Payment Statuses & Pending Balances"
          >
            <Download className="w-4 h-4 text-slate-300" />
            Export CSV
          </button>
        </div>
      </div>

      {/* FINANCIAL HEALTH & MONTHLY COLLECTION VS EXPENDITURE TRENDS (RECHARTS) */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full border border-emerald-300 font-mono flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                Financial Health Analytics
              </span>
              <span className="bg-blue-100 text-blue-800 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full font-mono">
                Academic Year 2025–26
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Monthly Collection Trends vs. Transport Expenditure
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive financial breakdown comparing monthly student transport collections against fleet operating expenditures (fuel, salaries, servicing & permits).
            </p>
          </div>

          {/* Interactive Controls */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
              <button
                onClick={() => setChartViewMode("overview")}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  chartViewMode === "overview"
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Collections vs Expenditure
              </button>
              <button
                onClick={() => setChartViewMode("expenseBreakdown")}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  chartViewMode === "expenseBreakdown"
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Expense Breakdown
              </button>
            </div>

            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-xs text-slate-800 cursor-pointer shadow-sm"
            >
              <option value="revenueBar">Monthly Revenue Trends (Bar Chart)</option>
              <option value="composed">Composed Area & Line</option>
              <option value="groupedBar">Revenue vs Expenditure Bar Chart</option>
              <option value="stackedExpense">Stacked Expense Breakdown</option>
            </select>
          </div>
        </div>

        {/* 4 Financial Health KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 p-4 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider">
              <span>Total Collections</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-950 block">
              ₹{totalAnnualCollection.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold pt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{collectionEfficiencyPct}% Collection Efficiency</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200/80 p-4 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-rose-800 font-extrabold text-[10px] uppercase tracking-wider">
              <span>Transport Expenditure</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <span className="text-xl sm:text-2xl font-black font-mono text-rose-950 block">
              ₹{totalAnnualExpenditure.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-rose-700 font-semibold pt-0.5">
              <Fuel className="w-3.5 h-3.5 text-rose-600" />
              <span>₹{totalFuelCost.toLocaleString("en-IN")} Fuel/Diesel</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 p-4 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-blue-800 font-extrabold text-[10px] uppercase tracking-wider">
              <span>Net Financial Surplus</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xl sm:text-2xl font-black font-mono text-blue-950 block">
              +₹{totalAnnualSurplus.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-blue-700 font-semibold pt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
              <span>+{operatingMarginPct}% Net Operating Surplus</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-slate-50 border border-purple-200/80 p-4 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center justify-between text-purple-800 font-extrabold text-[10px] uppercase tracking-wider">
              <span>Financial Health</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="bg-emerald-600 text-white font-black text-xs uppercase px-2.5 py-1 rounded-full shadow font-mono">
                HEALTHY / SURPLUS
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block pt-1 font-medium">
              30.2% Reserve for Fleet Overhauls
            </span>
          </div>
        </div>

        {/* Recharts Main Visualization Container */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-inner border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h4 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              {chartType === "revenueBar" && "Monthly Transport Fee Revenue Trends (Actual Collection vs Expected Target)"}
              {chartType === "composed" && (chartViewMode === "overview" ? "Monthly Transport Collections vs. Operating Expenditures" : "Monthly Expense Breakdown")}
              {chartType === "groupedBar" && "Monthly Revenue vs. Transport Operating Expenditure"}
              {chartType === "stackedExpense" && "Monthly Operating Expense Itemization Breakdown"}
            </h4>

            <span className="text-[11px] font-mono text-slate-400">
              Currency in INR (₹) | Wisdom School Fleet Analytics
            </span>
          </div>

          {/* Main Grid: Recharts Chart + Monthly Revenue Growth Display Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Recharts Chart Component */}
            <div className="lg:col-span-8 h-72 sm:h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "revenueBar" ? (
                  <BarChart
                    data={MONTHLY_FINANCIAL_DATA}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    onClick={(state) => {
                      if (state && state.activeTooltipIndex !== undefined) {
                        setSelectedMonthIndex(state.activeTooltipIndex);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="actualRevGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                      </linearGradient>
                      <linearGradient id="expectedRevGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                      formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString("en-IN")}`, name]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                    <Bar dataKey="actualCollection" name="Actual Transport Revenue Collected (₹)" fill="url(#actualRevGradient)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expectedCollection" name="Expected Target Revenue (₹)" fill="url(#expectedRevGradient)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : chartType === "composed" ? (
                  <ComposedChart data={MONTHLY_FINANCIAL_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="expGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />

                    {chartViewMode === "overview" && (
                      <>
                        <Area type="monotone" dataKey="actualCollection" name="Actual Collections (₹)" fill="url(#colGradient)" stroke="#10b981" strokeWidth={3} />
                        <Bar dataKey="transportExpenditure" name="Total Expenditure (₹)" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={20} />
                        <Line type="monotone" dataKey="expectedCollection" name="Target Expected Collection" stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                      </>
                    )}

                    {chartViewMode === "expenseBreakdown" && (
                      <>
                        <Bar dataKey="fuelCost" name="Fuel / Diesel (₹)" stackId="exp" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="salaryCost" name="Driver & Helper Salaries (₹)" stackId="exp" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="maintenanceCost" name="Maintenance & Repairs (₹)" stackId="exp" fill="#ec4899" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="insuranceTollCost" name="Insurance, Permits & Tolls (₹)" stackId="exp" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                        <Line type="monotone" dataKey="actualCollection" name="Actual Revenue (₹)" stroke="#10b981" strokeWidth={3} />
                      </>
                    )}
                  </ComposedChart>
                ) : chartType === "groupedBar" ? (
                  <BarChart data={MONTHLY_FINANCIAL_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                    <Bar dataKey="actualCollection" name="Actual Fee Collection (₹)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="transportExpenditure" name="Transport Expenditure (₹)" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={MONTHLY_FINANCIAL_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5e1", fontSize: 11 }} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                    <Bar dataKey="fuelCost" name="Fuel & Diesel" stackId="exp" fill="#f59e0b" />
                    <Bar dataKey="salaryCost" name="Driver Salaries" stackId="exp" fill="#3b82f6" />
                    <Bar dataKey="maintenanceCost" name="Maintenance & Repairs" stackId="exp" fill="#ec4899" />
                    <Bar dataKey="insuranceTollCost" name="Insurance & Tolls" stackId="exp" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Monthly Revenue Growth Percentage Display Card */}
            <div className="lg:col-span-4 bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Monthly Revenue Growth</span>
                </div>
                <select
                  value={selectedMonthIndex}
                  onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-300 focus:outline-none cursor-pointer"
                >
                  {MONTHLY_FINANCIAL_DATA.map((item, idx) => (
                    <option key={item.month} value={idx}>
                      {item.month} {idx > 0 ? `vs ${MONTHLY_FINANCIAL_DATA[idx - 1].month}` : "(Initial)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Big MoM Growth Percentage Display */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                  <span>Growth ({currentFinancialMonth.month} vs {previousFinancialMonth ? previousFinancialMonth.month : "Base"})</span>
                  <span className="text-amber-400 font-mono">MoM Comparison</span>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className={`text-3xl font-black font-mono ${
                      Number(momGrowthPct) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {Number(momGrowthPct) >= 0 ? `+${momGrowthPct}%` : `${momGrowthPct}%`}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      Number(momGrowthPct) >= 0
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-rose-950 text-rose-300 border border-rose-800"
                    }`}
                  >
                    {Number(momGrowthPct) >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    {momGrowthDiff >= 0
                      ? `+₹${Math.abs(momGrowthDiff).toLocaleString("en-IN")}`
                      : `-₹${Math.abs(momGrowthDiff).toLocaleString("en-IN")}`}
                  </span>
                </div>
              </div>

              {/* Month Comparison Revenue Values */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    {currentFinancialMonth.month} Revenue
                  </span>
                  <strong className="text-emerald-400 font-mono text-sm block">
                    ₹{currentFinancialMonth.actualCollection.toLocaleString("en-IN")}
                  </strong>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Target: ₹{currentFinancialMonth.expectedCollection.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    {previousFinancialMonth ? previousFinancialMonth.month : "Base"} Revenue
                  </span>
                  <strong className="text-slate-300 font-mono text-sm block">
                    ₹{previousFinancialMonth ? previousFinancialMonth.actualCollection.toLocaleString("en-IN") : "0"}
                  </strong>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Prior Month Base
                  </span>
                </div>
              </div>

              {/* Quick MoM Trend History Mini Selector */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>MoM Growth History</span>
                  <span>Trend (%)</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {MONTHLY_FINANCIAL_DATA.slice(1).map((item, idx) => {
                    const prev = MONTHLY_FINANCIAL_DATA[idx];
                    const diff = item.actualCollection - prev.actualCollection;
                    const pct = ((diff / prev.actualCollection) * 100).toFixed(1);
                    const isSelected = idx + 1 === selectedMonthIndex;
                    return (
                      <button
                        key={item.month}
                        onClick={() => setSelectedMonthIndex(idx + 1)}
                        className={`w-full flex items-center justify-between p-1.5 rounded-lg text-[11px] font-mono transition cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                            : "bg-slate-900/50 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <span>{prev.month} → {item.month}</span>
                        <span className={Number(pct) >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {Number(pct) >= 0 ? `+${pct}%` : `${pct}%`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Anticipated Transport Expenditure Breakdown Itemization */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Annual Transport Expenditure Breakdown Category Itemization
            </span>
            <span className="text-slate-500 font-mono text-[11px] normal-case">
              Total Budget: ₹{totalAnnualExpenditure.toLocaleString("en-IN")}
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-amber-500" />
                  Fuel & Diesel
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                  {((totalFuelCost / totalAnnualExpenditure) * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-base font-black font-mono text-slate-900 block">
                ₹{totalFuelCost.toLocaleString("en-IN")}
              </span>
              <p className="text-[10px] text-slate-500">6 Vehicles, approx. 420 km total daily route coverage</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" />
                  Staff Payroll
                </span>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                  {((totalSalaryCost / totalAnnualExpenditure) * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-base font-black font-mono text-slate-900 block">
                ₹{totalSalaryCost.toLocaleString("en-IN")}
              </span>
              <p className="text-[10px] text-slate-500">6 Driver salaries + van helper monthly allowances</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-pink-500" />
                  Servicing & Maintenance
                </span>
                <span className="text-[10px] font-mono font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-md">
                  {((totalMaintenanceCost / totalAnnualExpenditure) * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-base font-black font-mono text-slate-900 block">
                ₹{totalMaintenanceCost.toLocaleString("en-IN")}
              </span>
              <p className="text-[10px] text-slate-500">Quarterly oil changes, tire replacement, brake overhauls</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  Insurance & Permits
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                  {((totalInsuranceTollCost / totalAnnualExpenditure) * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-base font-black font-mono text-slate-900 block">
                ₹{totalInsuranceTollCost.toLocaleString("en-IN")}
              </span>
              <p className="text-[10px] text-slate-500">Annual TN RTO fitness certificates, commercial insurance & tolls</p>
            </div>
          </div>
        </div>
      </div>

      {/* CURRENT MONTH PAID VS. PENDING TRANSPORT FEES RECHARTS DASHBOARD */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full border border-amber-300 font-mono flex items-center gap-1">
                <PieChartIcon className="w-3 h-3 text-amber-600" />
                Current Month Collection Status
              </span>
              <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full font-mono">
                Active Billing Cycle
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Paid vs. Pending Transport Fee Analysis
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time Recharts breakdown comparing paid, pending, and overdue student van transport fees for the current month across all routes.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setFilterPayment("Pending")}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Filter Pending ({currentMonthFeeStats.pendingCount + currentMonthFeeStats.overdueCount})
            </button>
            <button
              onClick={() => setFilterPayment("Paid")}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Filter Paid ({currentMonthFeeStats.paidCount})
            </button>
            <button
              onClick={() => setFilterPayment("All")}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-slate-600" />
              View All
            </button>
          </div>
        </div>

        {/* Top 3 Metric Summary Pill Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider block">
                Total Monthly Target
              </span>
              <span className="text-xl font-black font-mono text-white mt-0.5 block">
                ₹{currentMonthFeeStats.totalMonthlyTarget.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-slate-400">{currentMonthFeeStats.totalStudents} Active Van Transport Students</span>
            </div>
            <div className="p-3 bg-slate-800 text-amber-400 rounded-xl border border-slate-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider block">
                Paid Transport Fees
              </span>
              <span className="text-xl font-black font-mono text-emerald-950 mt-0.5 block">
                ₹{currentMonthFeeStats.paidAmount.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {currentMonthPaidPct}% Collected ({currentMonthFeeStats.paidCount} Students)
              </span>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-amber-900 font-extrabold text-[10px] uppercase tracking-wider block">
                Pending & Overdue Fees
              </span>
              <span className="text-xl font-black font-mono text-amber-950 mt-0.5 block">
                ₹{(currentMonthFeeStats.pendingAmount + currentMonthFeeStats.overdueAmount).toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                {currentMonthPendingPct}% Pending ({currentMonthFeeStats.pendingCount + currentMonthFeeStats.overdueCount} Students)
              </span>
            </div>
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Grid for Recharts: Left = Donut Chart Share, Right = Route-wise Paid vs Pending Stacked Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Recharts Donut Pie Chart */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-amber-400" />
                Fee Payment Status Share
              </h4>
              <span className="text-[10px] font-mono text-slate-400">Current Billing Cycle</span>
            </div>

            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentMonthPieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {currentMonthPieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `₹${Number(val).toLocaleString("en-IN")} (${item.payload.count} students)`,
                      item.payload.name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Overlay Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Collected</span>
                <span className="text-lg font-black font-mono text-emerald-400">{currentMonthPaidPct}%</span>
              </div>
            </div>

            {/* Custom Interactive Legend Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {currentMonthPieChartData.map((item) => (
                <div key={item.name} className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="truncate">
                    <span className="text-[11px] font-bold text-slate-200 block truncate">{item.name}</span>
                    <span className="font-mono font-extrabold text-white text-[11px]">
                      ₹{item.value.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">({item.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Route-wise Paid vs Pending Stacked/Grouped Bar Chart */}
          <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Route Breakdown: Paid vs. Pending Fees
              </h4>
              <span className="text-[10px] font-mono text-slate-400">By Vehicle Route</span>
            </div>

            <div className="h-64 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routePaidPendingData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="routeName"
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5e1", fontSize: 10 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5e1", fontSize: 10 }}
                    tickFormatter={(v) => `₹${v/1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any, name: any) => [`₹${Number(val).toLocaleString("en-IN")}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                  <Bar dataKey="Paid" name="Paid Fees (₹)" stackId="route" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Pending" name="Pending / Overdue Fees (₹)" stackId="route" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-medium pt-1 border-t border-slate-800">
              Hover over route bars to inspect exact paid collections and outstanding balances per vehicle.
            </p>
          </div>
        </div>
      </div>

      {/* Distance Slabs & Multipliers Configuration Reference Box */}
      <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
        <div>
          <h4 className="font-extrabold text-slate-900 mb-2 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            Distance Slabs (Base Fee Rules)
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2">Distance Range</th>
                  <th className="p-2 text-right">Base Monthly Transport Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DEFAULT_FEE_SLABS.map((slab, i) => (
                  <tr key={i}>
                    <td className="p-2 font-semibold text-slate-800">{slab.minKm} - {slab.maxKm} km</td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">₹{slab.monthlyFee} / mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="font-extrabold text-slate-900 mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-600" />
            Vehicle Category Tier Multipliers
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2">Vehicle Category</th>
                  <th className="p-2 text-right">Tier Multiplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(VEHICLE_TYPE_MULTIPLIERS).map(([vType, mult]) => (
                  <tr key={vType}>
                    <td className="p-2 font-semibold text-slate-800">{vType}</td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">{mult}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Student Billing Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden space-y-4 p-5">
        {/* Action Success Toast Notification */}
        {actionSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              Automated Invoices & Payment Ledger ({filteredStudents.length} of {students.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter by payment status, edit billing profiles, record fee updates, or generate receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs w-full lg:w-auto">
            {/* Real-time Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, roll, stop..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-8 py-1.5 font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Select Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none text-xs cursor-pointer"
              >
                <option value="All">All Invoices ({students.length})</option>
                <option value="Paid">Paid Only ({students.filter((s) => s.paymentStatus === "Paid").length})</option>
                <option value="Pending">Pending Only ({students.filter((s) => s.paymentStatus === "Pending").length})</option>
                <option value="Overdue">Overdue Only ({students.filter((s) => s.paymentStatus === "Overdue").length})</option>
                <option value="Partially Paid">Partially Paid ({students.filter((s) => s.paymentStatus === "Partially Paid").length})</option>
              </select>
            </div>

            <button
              onClick={handleDownloadMonthlyReport}
              className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Download CSV Summary Report of All Student Payment Statuses & Pending Balances for Current Month"
            >
              <Download className="w-3.5 h-3.5 text-indigo-200" />
              Download Monthly Report
            </button>

            <button
              onClick={() => setShowEarlyBirdModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Manage & Trigger Early Bird Fee Discount WhatsApp Reminders"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              Early Bird Offers ({students.filter((s) => s.paymentStatus !== "Paid").length} Unpaid)
            </button>

            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Trigger Automated WhatsApp Web Reminders for Overdue Payments (Contact 9176593129)"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
              WhatsApp Reminders ({students.filter((s) => s.paymentStatus === "Overdue").length} Overdue)
            </button>

            <button
              onClick={() => setShowCameraScanner(true)}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Scan UPI QR Code using Device Camera"
            >
              <Camera className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              Scan QR
            </button>

            <button
              onClick={handleOpenAddModal}
              className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Add New Student Fee Record"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Record
            </button>
          </div>
        </div>

        {/* Early Bird Fee Discount Incentive Banner */}
        {(() => {
          const unpaidStudents = students.filter((s) => s.paymentStatus !== "Paid");
          const totalPotentialSavings = unpaidStudents.reduce((sum, s) => {
            const eb = calculateEarlyBird(s);
            return sum + eb.savingsAmount;
          }, 0);

          if (unpaidStudents.length === 0) return null;

          return (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border-2 border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-sm shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-amber-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wide">
                      Early Bird Fee Incentive Active
                    </span>
                    <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      {earlyBirdDiscountPct}% Discount offer until {earlyBirdDeadlineDate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-1">
                    Offer early bird incentives to <strong>{unpaidStudents.length} unpaid students</strong>. Total potential parent savings:{" "}
                    <strong className="text-amber-900 font-mono font-extrabold text-sm">₹{totalPotentialSavings.toLocaleString("en-IN")}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowEarlyBirdModal(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-yellow-200" />
                Trigger Early Bird Reminders ({unpaidStudents.length})
              </button>
            </div>
          );
        })()}

        {/* Payment Status Quick Filter Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Filter:</span>
          <button
            onClick={() => setFilterPayment("All")}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 text-xs ${
              filterPayment === "All"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Students ({students.length})
          </button>

          <button
            onClick={() => setFilterPayment("Paid")}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 text-xs ${
              filterPayment === "Paid"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid ({students.filter((s) => s.paymentStatus === "Paid").length})
          </button>

          <button
            onClick={() => setFilterPayment("Pending")}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 text-xs ${
              filterPayment === "Pending"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending ({students.filter((s) => s.paymentStatus === "Pending").length})
          </button>

          <button
            onClick={() => setFilterPayment("Overdue")}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 text-xs ${
              filterPayment === "Overdue"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Overdue ({students.filter((s) => s.paymentStatus === "Overdue").length})
          </button>

          <button
            onClick={() => setFilterPayment("Partially Paid")}
            className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 text-xs ${
              filterPayment === "Partially Paid"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Partially Paid ({students.filter((s) => s.paymentStatus === "Partially Paid").length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Student & Grade</th>
                <th className="py-3 px-4">Pickup Stop & KM</th>
                <th className="py-3 px-4 text-center">Tuition Fee</th>
                <th className="py-3 px-4 text-center">Van Transport Fee</th>
                <th className="py-3 px-4 text-right">Total Term Bill</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    No student billing records match the filter criteria "{filterPayment}"
                    {searchQuery ? ` and search "${searchQuery}"` : ""}.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const vehicle = vehicles.find((v) => v.id === student.assignedVehicleId) || vehicles[0];
                  const bill = calculateStudentTotalBill(
                    student.grade,
                    student.distanceKm,
                    vehicle?.type || "Van (14-Seater)"
                  );
                  const eb = calculateEarlyBird(student);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenStudentHistory(student)}
                          className="font-extrabold text-slate-900 hover:text-indigo-600 transition flex items-center gap-1.5 group text-left cursor-pointer"
                          title="Click to view student payment history ledger"
                        >
                          <span>{student.name}</span>
                          <History className="w-3.5 h-3.5 text-indigo-500 opacity-60 group-hover:opacity-100 transition" />
                        </button>
                        <div className="text-[11px] text-slate-500">
                          {student.grade} | Roll: {student.rollNumber}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{student.pickupStopName}</div>
                        <div className="text-[11px] text-slate-500">{student.distanceKm} km from school</div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        {bill.formattedTuition}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-900">
                        {bill.formattedTransportMonthly} / mo
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-extrabold text-slate-900 text-base">
                          {bill.formattedTotalTerm}
                        </div>
                        {student.paymentStatus !== "Paid" && (
                          <div className="text-[10px] text-amber-700 font-extrabold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5 inline-block font-mono">
                            Early Bird: {eb.formattedDiscounted} (-{eb.formattedSavings})
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            student.paymentStatus === "Paid"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : student.paymentStatus === "Pending"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : student.paymentStatus === "Overdue"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-blue-100 text-blue-800 border-blue-300"
                          }`}
                        >
                          {student.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {student.paymentStatus !== "Paid" && (
                            <button
                              onClick={() => triggerSingleEarlyBird(student)}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2 py-1.5 rounded-lg text-xs transition flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
                              title={`Notify Early Bird ${earlyBirdDiscountPct}% Discount (Save ${eb.formattedSavings})`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                              Notify
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenStudentHistory(student)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1.5 rounded-lg text-xs transition flex items-center gap-1 shadow-sm cursor-pointer"
                            title="View Full Payment History & Ledger for this student"
                          >
                            <History className="w-3.5 h-3.5 text-indigo-200" />
                            History
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold p-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Edit Student Fee Ledger Entry"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingStudent(student)}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold p-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                            title="Delete Student Fee Ledger Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              setQrModalData({
                                studentName: student.name,
                                studentRoll: student.rollNumber,
                                grade: student.grade,
                                amount: bill.totalTermAmount,
                                feeType: "Tuition & Transport Term Fee",
                              })
                            }
                            className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-2 py-1.5 rounded-lg text-xs transition flex items-center gap-1 shadow-sm cursor-pointer"
                            title="Generate Dynamic UPI QR Code for Payment"
                          >
                            <QrCode className="w-3.5 h-3.5 text-yellow-300" />
                            QR
                          </button>

                          <button
                            onClick={() => handleGenerateReceiptClick(student)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-1.5 rounded-lg text-xs transition flex items-center gap-1 shadow-sm cursor-pointer"
                            title="View/Print Receipt"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleSendReminder(student)}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold p-1.5 rounded-lg text-xs transition cursor-pointer"
                            title="Send WhatsApp Payment Reminder"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Fee Ledger Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  Fee Billing Ledger Management
                </span>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-400" />
                  Edit Fee Record: {editingStudent.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Roll / Admission Number</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Grade / Class</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pre-KG">Pre-KG</option>
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                    <option value="Grade I">Grade I</option>
                    <option value="Grade II">Grade II</option>
                    <option value="Grade III">Grade III</option>
                    <option value="Grade IV">Grade IV</option>
                    <option value="Grade V">Grade V</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Parent Name</label>
                  <input
                    type="text"
                    required
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Parent Phone (WhatsApp)</label>
                  <input
                    type="text"
                    required
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pickup Stop Name</label>
                  <input
                    type="text"
                    required
                    value={formData.pickupStopName}
                    onChange={(e) => setFormData({ ...formData, pickupStopName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Distance from School (KM)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formData.distanceKm}
                    onChange={(e) => setFormData({ ...formData, distanceKm: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Vehicle Route</label>
                  <select
                    value={formData.assignedVehicleId}
                    onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.routeName} ({v.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Last Payment / UTR Reference</label>
                  <input
                    type="text"
                    value={formData.lastUtrNumber}
                    onChange={(e) => setFormData({ ...formData, lastUtrNumber: e.target.value })}
                    placeholder="e.g. 420192837102"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Calculated Monthly Transport Fee Preview */}
              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-center justify-between text-xs mt-2">
                <div>
                  <span className="font-extrabold text-indigo-900 block">Calculated Transport Fee:</span>
                  <span className="text-[11px] text-indigo-700">
                    Based on {formData.distanceKm} km distance & selected vehicle type
                  </span>
                </div>
                <strong className="text-base font-mono font-black text-indigo-950">
                  ₹
                  {calculateMonthlyTransportFee(
                    formData.distanceKm,
                    vehicles.find((v) => v.id === formData.assignedVehicleId)?.type || "Van (14-Seater)"
                  ).toLocaleString("en-IN")}{" "}
                  / mo
                </strong>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer transition flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Student Fee Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                  New Student Onboarding
                </span>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Add Student Fee & Transport Record
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. K. Ananya"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Roll / Admission Number</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Grade / Class</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Pre-KG">Pre-KG</option>
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                    <option value="Grade I">Grade I</option>
                    <option value="Grade II">Grade II</option>
                    <option value="Grade III">Grade III</option>
                    <option value="Grade IV">Grade IV</option>
                    <option value="Grade V">Grade V</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Initial Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Parent Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S. Kumar"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Parent Phone (WhatsApp)</label>
                  <input
                    type="text"
                    required
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pickup Stop Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Essur Main Junction"
                    value={formData.pickupStopName}
                    onChange={(e) => setFormData({ ...formData, pickupStopName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Distance from School (KM)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formData.distanceKm}
                    onChange={(e) => setFormData({ ...formData, distanceKm: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Assigned Transport Vehicle</label>
                  <select
                    value={formData.assignedVehicleId}
                    onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.routeName} ({v.type} - Reg: {v.registrationNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer transition flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Payment History & Billing Ledger Modal */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-extrabold text-lg shadow-inner">
                  <User className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-indigo-400/30">
                      Student Payment History Ledger
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Roll: <strong className="text-amber-400">{historyStudent.rollNumber}</strong>
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-0.5 flex items-center gap-2">
                    {historyStudent.name}
                    <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                      {historyStudent.grade}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Parent: <strong className="text-slate-200">{historyStudent.parentName}</strong> (+91 {historyStudent.parentPhone}) | Stop: <strong className="text-slate-200">{historyStudent.pickupStopName}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleSendReminder(historyStudent)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
                <button
                  onClick={() => setHistoryStudent(null)}
                  className="text-slate-400 hover:text-white transition p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body Content */}
            <div className="p-5 sm:p-6 space-y-6 text-xs sm:text-sm bg-slate-50/50">
              {/* Key Metrics Cards */}
              {(() => {
                const records = getStudentHistoryRecords(historyStudent);
                const totalPaidLifetime = records.reduce((sum, r) => sum + r.totalPaid, 0);
                const vehicle = vehicles.find((v) => v.id === historyStudent.assignedVehicleId) || vehicles[0];
                const bill = calculateStudentTotalBill(historyStudent.grade, historyStudent.distanceKm, vehicle?.type || "Van (14-Seater)");

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                        Total Paid Lifetime
                      </div>
                      <div className="text-lg font-extrabold text-emerald-800 font-mono">
                        ₹{totalPaidLifetime.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-slate-400">Across {records.length} payment receipts</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                        Term 3 Current Bill
                      </div>
                      <div className="text-lg font-extrabold text-slate-900 font-mono">
                        {bill.formattedTotalTerm}
                      </div>
                      <div className="text-[10px] text-slate-400">Tuition: {bill.formattedTuition} | Van: {bill.formattedTransportTerm}</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Payment Status
                      </div>
                      <div>
                        <span
                          className={`inline-block text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            historyStudent.paymentStatus === "Paid"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : historyStudent.paymentStatus === "Pending"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : historyStudent.paymentStatus === "Overdue"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-blue-100 text-blue-800 border-blue-300"
                          }`}
                        >
                          {historyStudent.paymentStatus}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Last UTR: {historyStudent.lastUtrNumber || "N/A"}</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        Last Payment Date
                      </div>
                      <div className="text-sm font-extrabold text-slate-800 font-mono">
                        {historyStudent.lastPaymentDate || records[0]?.paymentDate || "N/A"}
                      </div>
                      <div className="text-[10px] text-slate-400">Recorded on school register</div>
                    </div>
                  </div>
                );
              })()}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    Historical Transaction Records ({getStudentHistoryRecords(historyStudent).length})
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddHistoryForm(!showAddHistoryForm)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showAddHistoryForm ? "Cancel Manual Entry" : "Record New Historical Payment"}
                  </button>

                  <button
                    onClick={() => handleGenerateReceiptClick(historyStudent)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-300" />
                    Print Current Receipt
                  </button>
                </div>
              </div>

              {/* Record New Historical Payment Form (Collapsible) */}
              {showAddHistoryForm && (
                <div className="bg-indigo-50/80 border-2 border-indigo-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                    <h5 className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      Record Historical Payment Entry for {historyStudent.name}
                    </h5>
                    <span className="text-[11px] text-indigo-700 font-mono">Ref: {historyStudent.rollNumber}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">Fee Description / Term</label>
                      <input
                        type="text"
                        value={newHistoryData.feeType}
                        onChange={(e) => setNewHistoryData({ ...newHistoryData, feeType: e.target.value })}
                        placeholder="e.g. Term 3 Tuition & Van Pass"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">Payment Date</label>
                      <input
                        type="date"
                        value={newHistoryData.paymentDate}
                        onChange={(e) => setNewHistoryData({ ...newHistoryData, paymentDate: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">Payment Method</label>
                      <select
                        value={newHistoryData.paymentMethod}
                        onChange={(e) => setNewHistoryData({ ...newHistoryData, paymentMethod: e.target.value as any })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="UPI (GPay/PhonePe)">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="Cash at Counter">Cash at Counter (School Desk)</option>
                        <option value="Bank NEFT/IMPS">Bank Transfer (NEFT / IMPS)</option>
                        <option value="Demand Draft">Demand Draft / Cheque</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">Tuition Fee Paid (₹)</label>
                      <input
                        type="number"
                        value={newHistoryData.tuitionPaid}
                        onChange={(e) => setNewHistoryData({ ...newHistoryData, tuitionPaid: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">Transport Fee Paid (₹)</label>
                      <input
                        type="number"
                        value={newHistoryData.transportPaid}
                        onChange={(e) => setNewHistoryData({ ...newHistoryData, transportPaid: Number(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">UTR / Bank Ref Number</label>
                      <input
                        type="text"
                        value={newHistoryData.utrNumber}
                        onChange={(e) => setNewHistoryData({ ...newHistoryData, utrNumber: e.target.value })}
                        placeholder="e.g. 420192837102"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-950">
                      <input
                        type="checkbox"
                        checked={newHistoryData.updateStatusToPaid}
                        onChange={(e) => setNewHistoryData({ ...newHistoryData, updateStatusToPaid: e.target.checked })}
                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      Update Student Billing Status to "Paid" on saving this entry
                    </label>

                    <button
                      onClick={() => handleAddHistoricalPayment(historyStudent)}
                      className="bg-indigo-700 hover:bg-indigo-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      Save Payment Entry (₹{(Number(newHistoryData.tuitionPaid) + Number(newHistoryData.transportPaid)).toLocaleString("en-IN")})
                    </button>
                  </div>
                </div>
              )}

              {/* Historical Payments Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">Receipt # & Date</th>
                        <th className="py-3 px-4">Fee Description</th>
                        <th className="py-3 px-4 text-center">Tuition</th>
                        <th className="py-3 px-4 text-center">Transport</th>
                        <th className="py-3 px-4 text-right">Total Paid</th>
                        <th className="py-3 px-4">Payment Method & Ref</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Receipt Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {getStudentHistoryRecords(historyStudent).map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900 font-mono text-xs">{record.receiptNumber}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{record.paymentDate}</div>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-800">
                            <div>{record.feeType}</div>
                            {record.remarks && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5">{record.remarks}</div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-slate-700 font-bold">
                            ₹{record.tuitionPaid.toLocaleString("en-IN")}
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-blue-900 font-bold">
                            ₹{record.transportPaid.toLocaleString("en-IN")}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 text-base">
                            ₹{record.totalPaid.toLocaleString("en-IN")}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs">{record.paymentMethod}</div>
                            <div className="text-[10px] font-mono text-slate-500">UTR: {record.utrNumber}</div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {record.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleGenerateReceiptForHistory(historyStudent, record)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
                              title="View or Print official receipt for this historical transaction"
                            >
                              <Receipt className="w-3.5 h-3.5 text-indigo-200" />
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Officially verified student payment history register — Wisdom Nursery & Primary School (Essur)
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-sm"
              >
                Close History Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Student Fee Record</h3>
                <p className="text-xs text-slate-500">Confirm permanent deletion from ledger</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Are you sure you want to delete the fee ledger entry for{" "}
              <strong className="text-slate-900">{deletingStudent.name}</strong> (Roll:{" "}
              <span className="font-mono">{deletingStudent.rollNumber}</span>)? This will remove their billing record
              and transport profile from the active ledger.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs rounded-xl font-bold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-xl font-bold cursor-pointer transition flex items-center gap-1.5 shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automated WhatsApp Payment Reminders Engine Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-700 text-emerald-200 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border border-emerald-600">
                    WhatsApp Web Integration
                  </span>
                  <span className="text-xs font-mono font-bold text-yellow-300">
                    Admin Contact: +91 9176593129
                  </span>
                </div>
                <h3 className="text-lg font-extrabold flex items-center gap-2 mt-1">
                  <MessageSquare className="w-5 h-5 text-emerald-300" />
                  Automated Overdue WhatsApp Payment Reminders
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Send payment notices directly to parents' WhatsApp using existing contact numbers and Mr. R SARAVANAN (+91 9176593129) support details.
                </p>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-emerald-200 hover:text-white transition p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              {/* Filter Tabs & Target Summary */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-xs">Target Audience:</span>
                  <button
                    onClick={() => setWhatsAppTargetFilter("Overdue")}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      whatsAppTargetFilter === "Overdue"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    Overdue Only ({students.filter((s) => s.paymentStatus === "Overdue").length})
                  </button>
                  <button
                    onClick={() => setWhatsAppTargetFilter("All Unpaid")}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      whatsAppTargetFilter === "All Unpaid"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    All Unpaid ({students.filter((s) => s.paymentStatus === "Overdue" || s.paymentStatus === "Pending" || s.paymentStatus === "Partially Paid").length})
                  </button>
                </div>

                <div className="text-xs font-mono font-extrabold text-slate-900 bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-300">
                  Targeted: {getTargetedWhatsAppStudents().length} Parents
                </div>
              </div>

              {/* Message Template Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Customizable WhatsApp Reminder Template
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Use tags: <code className="bg-slate-100 text-slate-700 px-1 rounded">{'{ParentName}'}</code> <code className="bg-slate-100 text-slate-700 px-1 rounded">{'{StudentName}'}</code> <code className="bg-slate-100 text-slate-700 px-1 rounded">{'{TotalAmount}'}</code>
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={customWhatsAppMessage}
                  onChange={(e) => setCustomWhatsAppMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
                />
              </div>

              {/* Global Batch Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-2 border-y border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerBatchWhatsApp}
                    disabled={isBulkTriggering || getTargetedWhatsAppStudents().length === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    {isBulkTriggering ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Triggering Sequence...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        Trigger All Automated WhatsApp Reminders ({getTargetedWhatsAppStudents().length})
                      </>
                    )}
                  </button>

                  <button
                    onClick={copyWhatsAppLogsToClipboard}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Copy all generated reminder texts to clipboard"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                    Copy All Logs
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 font-medium">
                  Logged Sent: <span className="font-bold text-emerald-700 font-mono">{sentWhatsAppIds.length}</span> / {getTargetedWhatsAppStudents().length}
                </div>
              </div>

              {/* Individual Student Overdue List */}
              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                {getTargetedWhatsAppStudents().length === 0 ? (
                  <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold">No parents in the selected target group!</p>
                    <p className="text-xs text-slate-400 mt-1">All student fees in this view are up-to-date.</p>
                  </div>
                ) : (
                  getTargetedWhatsAppStudents().map((student) => {
                    const vehicle = vehicles.find((v) => v.id === student.assignedVehicleId) || vehicles[0];
                    const bill = calculateStudentTotalBill(student.grade, student.distanceKm, vehicle?.type || "Van (14-Seater)");
                    const isSent = sentWhatsAppIds.includes(student.id);

                    return (
                      <div
                        key={student.id}
                        className={`p-3 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isSent
                            ? "bg-emerald-50/60 border-emerald-200"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">{student.parentName}</span>
                            <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                              +91 {student.parentPhone}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                student.paymentStatus === "Overdue"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {student.paymentStatus}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            Student: <strong className="text-slate-800">{student.name}</strong> ({student.grade}) | Roll:{" "}
                            <span className="font-mono text-slate-700">{student.rollNumber}</span> | Due:{" "}
                            <strong className="text-rose-700 font-mono">{bill.formattedTotalTerm}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {isSent && (
                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-lg">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Triggered
                            </span>
                          )}

                          <button
                            onClick={() => triggerSingleWhatsApp(student)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Send WhatsApp (9176593129)
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Officially configured with Administrator Phone: <strong>+91 9176593129</strong> (R Saravanan)
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Early Bird Fee Discount Reminders Modal */}
      {showEarlyBirdModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-extrabold text-lg shadow-inner">
                  <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-400/30">
                      Early Bird Fee Incentive Engine
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Admin Contact: <strong className="text-amber-400">+91 9176593129</strong>
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-0.5">
                    Early Bird Fee Discount Reminders
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Prompt parents with pre-formatted WhatsApp reminders offering time-sensitive discounts for early term fee settlement.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEarlyBirdModal(false)}
                className="text-slate-400 hover:text-white transition p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 text-xs sm:text-sm bg-slate-50/50">
              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    Discount Percentage (%)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[5, 8, 10, 12].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setEarlyBirdDiscountPct(pct)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          earlyBirdDiscountPct === pct
                            ? "bg-amber-500 text-slate-950 border-amber-600 shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    Early Bird Deadline Date
                  </label>
                  <input
                    type="text"
                    value={earlyBirdDeadlineDate}
                    onChange={(e) => setEarlyBirdDeadlineDate(e.target.value)}
                    placeholder="e.g. 15 Aug 2026"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    Target Student Group
                  </label>
                  <select
                    value={earlyBirdTargetFilter}
                    onChange={(e) => setEarlyBirdTargetFilter(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs cursor-pointer"
                  >
                    <option value="Pending & Overdue">Pending & Overdue Students</option>
                    <option value="All Unpaid">All Unpaid (Pending, Overdue, Partial)</option>
                    <option value="Pending Only">Pending Students Only</option>
                  </select>
                </div>
              </div>

              {/* Early Bird Incentive Summary Banner */}
              {(() => {
                const targeted = getTargetedEarlyBirdStudents();
                const totalOrig = targeted.reduce((sum, s) => sum + calculateEarlyBird(s).originalTotal, 0);
                const totalDisc = targeted.reduce((sum, s) => sum + calculateEarlyBird(s).discountedAmount, 0);
                const totalSave = targeted.reduce((sum, s) => sum + calculateEarlyBird(s).savingsAmount, 0);

                return (
                  <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-indigo-500/15 border-2 border-amber-300 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center shadow-sm">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Targeted Parents</div>
                      <div className="text-lg font-extrabold text-slate-900 mt-0.5">{targeted.length} Students</div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Standard Fees</div>
                      <div className="text-lg font-extrabold text-slate-800 font-mono mt-0.5">₹{totalOrig.toLocaleString("en-IN")}</div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Early Bird Total</div>
                      <div className="text-lg font-extrabold text-indigo-900 font-mono mt-0.5">₹{totalDisc.toLocaleString("en-IN")}</div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Parent Savings</div>
                      <div className="text-lg font-extrabold text-amber-900 font-mono mt-0.5">₹{totalSave.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Template Editor Box */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-extrabold text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                    Pre-formatted Early Bird WhatsApp Message Template
                  </label>
                  <span className="text-[10px] text-slate-500">Auto-filled dynamically per student</span>
                </div>

                <textarea
                  value={customEarlyBirdMessage}
                  onChange={(e) => setCustomEarlyBirdMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="text-slate-400 font-medium mr-1">Available Tags:</span>
                  {["{ParentName}", "{StudentName}", "{Grade}", "{RollNumber}", "{DeadlineDate}", "{DiscountPct}", "{TotalAmount}", "{DiscountedAmount}", "{SavingsAmount}", "{UpiId}", "{AdminPhone}"].map((tag) => (
                    <span key={tag} className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono border border-amber-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Targeted Student List ({getTargetedEarlyBirdStudents().length})
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyEarlyBirdLogsToClipboard}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                    Copy Discount Logs
                  </button>

                  <button
                    onClick={triggerBatchEarlyBird}
                    disabled={isEarlyBirdBulkTriggering || getTargetedEarlyBirdStudents().length === 0}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-yellow-200 fill-current" />
                    {isEarlyBirdBulkTriggering
                      ? "Triggering Sequence..."
                      : `Notify All Targeted Parents (${getTargetedEarlyBirdStudents().length})`}
                  </button>
                </div>
              </div>

              {/* Targeted Students List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {getTargetedEarlyBirdStudents().length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-medium">
                    No students match the current Early Bird filter "{earlyBirdTargetFilter}".
                  </div>
                ) : (
                  getTargetedEarlyBirdStudents().map((student) => {
                    const eb = calculateEarlyBird(student);
                    const isSent = sentEarlyBirdIds.includes(student.id);

                    return (
                      <div
                        key={student.id}
                        className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">{student.parentName}</span>
                            <span className="text-xs text-slate-500 font-mono">(+91 {student.parentPhone})</span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                student.paymentStatus === "Overdue"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {student.paymentStatus}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                            <span>Student: <strong className="text-slate-800">{student.name}</strong> ({student.grade})</span>
                            <span className="text-slate-300">|</span>
                            <span>Std Fee: <strong className="text-slate-700 font-mono">{eb.formattedOriginal}</strong></span>
                            <span className="text-slate-300">|</span>
                            <span className="text-indigo-900 font-extrabold font-mono">
                              Early Bird ({earlyBirdDiscountPct}% Off): {eb.formattedDiscounted}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-1.5 py-0.5 rounded font-mono">
                              Save {eb.formattedSavings}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {isSent && (
                            <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-300">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Notified
                            </span>
                          )}

                          <button
                            onClick={() => triggerSingleEarlyBird(student)}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Notify (WhatsApp)
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Early Bird reminders pre-configured for Administrator Mr. R SARAVANAN (+91 9176593129, UPI: 9176593129@ybl)
              </div>
              <button
                onClick={() => setShowEarlyBirdModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-sm"
              >
                Close Engine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic UPI Payment QR Code Modal */}
      {qrModalData && (
        <UpiPaymentQrCode
          studentName={qrModalData.studentName}
          studentRoll={qrModalData.studentRoll}
          grade={qrModalData.grade}
          amount={qrModalData.amount}
          feeType={qrModalData.feeType}
          onClose={() => setQrModalData(null)}
          isModal={true}
        />
      )}

      {/* Camera Hardware QR Scanner Modal */}
      {showCameraScanner && (
        <CameraQrScanner
          onClose={() => setShowCameraScanner(false)}
        />
      )}

      {/* Monthly Automated Fee Collections & Dues Report Modal */}
      <MonthlyFeeReportModal
        isOpen={showMonthlyReportModal}
        onClose={() => setShowMonthlyReportModal(false)}
        students={students}
        vehicles={vehicles}
      />
    </div>
  );
};
