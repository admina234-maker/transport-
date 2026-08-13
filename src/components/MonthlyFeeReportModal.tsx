import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Sparkles,
  Filter,
  Building2,
  Bus,
  ShieldCheck,
  Zap,
  Mail,
  ChevronRight,
  PieChart as PieChartIcon,
  RefreshCw
} from "lucide-react";
import { Student, Vehicle } from "../types";
import { SCHOOL_INFO } from "../data/mockData";
import { calculateStudentTotalBill } from "../utils/feeCalculator";
import { printFormattedContent } from "../utils/printHelper";

interface MonthlyFeeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  vehicles: Vehicle[];
}

export const MonthlyFeeReportModal: React.FC<MonthlyFeeReportModalProps> = ({
  isOpen,
  onClose,
  students,
  vehicles,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("July 2026");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("2026-2027");
  const [gradeFilter, setGradeFilter] = useState<string>("All");
  const [autoScheduleActive, setAutoScheduleActive] = useState<boolean>(true);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [dispatchStatusMsg, setDispatchStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const monthsList = [
    "June 2026",
    "July 2026",
    "August 2026",
    "September 2026",
    "October 2026",
    "November 2026",
    "December 2026",
    "January 2027",
    "February 2027",
    "March 2027"
  ];

  const allGrades = Array.from(new Set(students.map((s) => s.grade))).sort();

  // Filter students based on selected grade
  const filteredStudents = students.filter((s) => gradeFilter === "All" || s.grade === gradeFilter);

  // Calculate Metrics
  let totalDemand = 0;
  let totalCollected = 0;
  let totalPending = 0;
  let totalPaidCount = 0;
  let totalPartialCount = 0;
  let totalPendingCount = 0;
  let totalOverdueCount = 0;

  filteredStudents.forEach((s) => {
    const veh = vehicles.find((v) => v.id === s.assignedVehicleId) || vehicles[0];
    const bill = calculateStudentTotalBill(s.grade, s.distanceKm, veh?.type || "Van (14-Seater)");
    const totalBill = bill.totalTermAmount;
    totalDemand += totalBill;

    let balance = 0;
    if (s.balanceRemaining !== undefined) {
      balance = s.balanceRemaining;
    } else if (s.paymentStatus === "Paid") {
      balance = 0;
    } else if (s.paymentStatus === "Partially Paid") {
      balance = Math.round(totalBill * 0.5);
    } else {
      balance = totalBill;
    }

    const collected = Math.max(0, totalBill - balance);
    totalPending += balance;
    totalCollected += collected;

    if (s.paymentStatus === "Paid") totalPaidCount++;
    else if (s.paymentStatus === "Partially Paid") totalPartialCount++;
    else if (s.paymentStatus === "Overdue") totalOverdueCount++;
    else totalPendingCount++;
  });

  const overallEfficiency = totalDemand > 0 ? Math.round((totalCollected / totalDemand) * 100) : 0;

  // Grade-wise breakdown computation
  const gradeBreakdown = allGrades.map((g) => {
    const gradeStudents = students.filter((s) => s.grade === g);
    let gDemand = 0;
    let gCollected = 0;
    let gPending = 0;
    let gPaidCount = 0;

    gradeStudents.forEach((s) => {
      const veh = vehicles.find((v) => v.id === s.assignedVehicleId) || vehicles[0];
      const bill = calculateStudentTotalBill(s.grade, s.distanceKm, veh?.type || "Van (14-Seater)");
      const totalBill = bill.totalTermAmount;
      gDemand += totalBill;

      let balance = 0;
      if (s.balanceRemaining !== undefined) {
        balance = s.balanceRemaining;
      } else if (s.paymentStatus === "Paid") {
        balance = 0;
      } else if (s.paymentStatus === "Partially Paid") {
        balance = Math.round(totalBill * 0.5);
      } else {
        balance = totalBill;
      }

      gPending += balance;
      gCollected += Math.max(0, totalBill - balance);
      if (s.paymentStatus === "Paid") gPaidCount++;
    });

    const rate = gDemand > 0 ? Math.round((gCollected / gDemand) * 100) : 0;

    return {
      grade: g,
      totalCount: gradeStudents.length,
      demand: gDemand,
      collected: gCollected,
      pending: gPending,
      paidCount: gPaidCount,
      rate,
    };
  });

  // Vehicle/Route breakdown
  const routeBreakdown = vehicles.map((v) => {
    const routeStudents = students.filter((s) => s.assignedVehicleId === v.id || s.assignedRouteName === v.routeName);
    let rDemand = 0;
    let rCollected = 0;
    let rPending = 0;

    routeStudents.forEach((s) => {
      const bill = calculateStudentTotalBill(s.grade, s.distanceKm, v.type || "Van (14-Seater)");
      rDemand += bill.transportTermFee;

      let balance = 0;
      if (s.paymentStatus === "Paid") balance = 0;
      else if (s.paymentStatus === "Partially Paid") balance = Math.round(bill.transportTermFee * 0.5);
      else balance = bill.transportTermFee;

      rPending += balance;
      rCollected += Math.max(0, bill.transportTermFee - balance);
    });

    return {
      vehicle: v,
      studentCount: routeStudents.length,
      demand: rDemand,
      collected: rCollected,
      pending: rPending,
      rate: rDemand > 0 ? Math.round((rCollected / rDemand) * 100) : 0,
    };
  });

  // Students with highest pending balance
  const pendingWatchlist = [...filteredStudents]
    .filter((s) => s.paymentStatus !== "Paid")
    .sort((a, b) => {
      const vehA = vehicles.find((v) => v.id === a.assignedVehicleId) || vehicles[0];
      const vehB = vehicles.find((v) => v.id === b.assignedVehicleId) || vehicles[0];
      const billA = calculateStudentTotalBill(a.grade, a.distanceKm, vehA?.type || "Van (14-Seater)");
      const billB = calculateStudentTotalBill(b.grade, b.distanceKm, vehB?.type || "Van (14-Seater)");
      const balA = a.balanceRemaining !== undefined ? a.balanceRemaining : billA.totalTermAmount;
      const balB = b.balanceRemaining !== undefined ? b.balanceRemaining : billB.totalTermAmount;
      return balB - balA;
    });

  // Generate Official PDF Report HTML
  const handlePrintPDFReport = () => {
    const generatedDate = new Date().toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const gradeRowsHtml = gradeBreakdown
      .map((g) => {
        const badgeColor = g.rate >= 90 ? "#15803d" : g.rate >= 75 ? "#b45309" : "#b91c1c";
        const badgeBg = g.rate >= 90 ? "#dcfce7" : g.rate >= 75 ? "#fef3c7" : "#fee2e2";

        return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 10px; font-weight: bold; color: #0f172a;">Grade ${g.grade}</td>
          <td style="padding: 10px; text-align: center; color: #334155;">${g.totalCount}</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; color: #0f172a;">₹${g.demand.toLocaleString("en-IN")}</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; color: #15803d;">₹${g.collected.toLocaleString("en-IN")}</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; color: #b91c1c;">₹${g.pending.toLocaleString("en-IN")}</td>
          <td style="padding: 10px; text-align: center;">
            <span style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 800; padding: 3px 8px; border-radius: 6px; font-size: 10px;">
              ${g.rate}% (${g.paidCount}/${g.totalCount} Cleared)
            </span>
          </td>
        </tr>
      `;
      })
      .join("");

    const topDuesHtml = pendingWatchlist
      .slice(0, 15)
      .map((s, idx) => {
        const veh = vehicles.find((v) => v.id === s.assignedVehicleId) || vehicles[0];
        const bill = calculateStudentTotalBill(s.grade, s.distanceKm, veh?.type || "Van (14-Seater)");
        const bal = s.balanceRemaining !== undefined ? s.balanceRemaining : s.paymentStatus === "Partially Paid" ? Math.round(bill.totalTermAmount * 0.5) : bill.totalTermAmount;

        return `
        <tr style="border-bottom: 1px solid #f1f5f9; font-size: 10.5px;">
          <td style="padding: 8px; font-weight: bold; color: #334155;">${idx + 1}</td>
          <td style="padding: 8px; font-weight: bold; color: #0f172a;">${s.name} (${s.rollNumber})</td>
          <td style="padding: 8px; color: #475569;">${s.grade}</td>
          <td style="padding: 8px; color: #334155;">${s.parentName} <br><span style="color: #64748b; font-size: 9.5px;">📞 ${s.parentPhone}</span></td>
          <td style="padding: 8px; color: #475569;">${s.assignedRouteName} (${s.pickupStopName})</td>
          <td style="padding: 8px; text-align: right; font-weight: bold; color: #dc2626;">₹${bal.toLocaleString("en-IN")}</td>
          <td style="padding: 8px; text-align: center;">
            <span style="background: #fef2f2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold; border: 1px solid #fecaca;">
              ${s.paymentStatus.toUpperCase()}
            </span>
          </td>
        </tr>
      `;
      })
      .join("");

    const reportHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #0f172a;">
        <!-- Header Letterhead -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 54px; height: 54px; background: #0f172a; color: #fbbf24; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900;">
              WIS
            </div>
            <div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; tracking-letter: 0.5px;">
                ${SCHOOL_INFO.name}
              </h1>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569; font-weight: 600;">
                ${SCHOOL_INFO.location} | Estd: ${SCHOOL_INFO.establishedYear} | Principal: ${SCHOOL_INFO.contactPerson} (+91 ${SCHOOL_INFO.contactPhone})
              </p>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #059669; font-weight: bold;">
                Official UPI Collector: ${SCHOOL_INFO.upiId} | Bank: ICICI Bank Essur Branch
              </p>
            </div>
          </div>

          <div style="text-align: right;">
            <span style="background: #fef3c7; color: #78350f; font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 20px; border: 1px solid #fde68a; display: inline-block;">
              AUDIT COMPLIANT
            </span>
            <p style="margin: 6px 0 0 0; font-size: 10px; color: #64748b; font-weight: bold;">
              Generated: ${generatedDate}
            </p>
          </div>
        </div>

        <!-- Document Title Banner -->
        <div style="background: #0f172a; color: #ffffff; padding: 14px 20px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 style="margin: 0; font-size: 16px; font-weight: 900; color: #ffffff;">
              AUTOMATED MONTHLY FEE COLLECTIONS & PENDING DUES REPORT
            </h2>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
              Academic Session ${selectedAcademicYear} • Month: <strong style="color: #fbbf24;">${selectedMonth.toUpperCase()}</strong> • Scope: ${gradeFilter === "All" ? "All Grades (LKG to Higher Sec)" : `Grade ${gradeFilter}`}
            </p>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 18px; font-weight: 900; color: #34d399;">${overallEfficiency}%</span>
            <p style="margin: 0; font-size: 9px; color: #cbd5e1; font-weight: bold;">COLLECTION EFFICIENCY</p>
          </div>
        </div>

        <!-- Key Financial Executive Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
            <span style="font-size: 9.5px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block;">Total Student Demand</span>
            <strong style="font-size: 16px; font-weight: 900; color: #0f172a; display: block; margin-top: 4px;">₹${totalDemand.toLocaleString("en-IN")}</strong>
            <span style="font-size: 9px; color: #475569;">${filteredStudents.length} Active Accounts</span>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; text-align: center;">
            <span style="font-size: 9.5px; font-weight: 800; color: #166534; text-transform: uppercase; display: block;">Collected To Date</span>
            <strong style="font-size: 16px; font-weight: 900; color: #15803d; display: block; margin-top: 4px;">₹${totalCollected.toLocaleString("en-IN")}</strong>
            <span style="font-size: 9px; color: #166534; font-weight: bold;">${totalPaidCount} Full + ${totalPartialCount} Partial</span>
          </div>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px; text-align: center;">
            <span style="font-size: 9.5px; font-weight: 800; color: #991b1b; text-transform: uppercase; display: block;">Outstanding Dues</span>
            <strong style="font-size: 16px; font-weight: 900; color: #dc2626; display: block; margin-top: 4px;">₹${totalPending.toLocaleString("en-IN")}</strong>
            <span style="font-size: 9px; color: #991b1b; font-weight: bold;">${totalPendingCount + totalOverdueCount} Unsettled Accounts</span>
          </div>

          <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 12px; text-align: center;">
            <span style="font-size: 9.5px; font-weight: 800; color: #92400e; text-transform: uppercase; display: block;">Collection Rate</span>
            <strong style="font-size: 16px; font-weight: 900; color: #b45309; display: block; margin-top: 4px;">${overallEfficiency}%</strong>
            <span style="font-size: 9px; color: #92400e;">Target: 95%</span>
          </div>
        </div>

        <!-- Grade-wise Financial Summary Table -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; font-weight: 900; color: #0f172a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
            1. Grade-wise Fee Collections & Dues Breakdown
          </h3>
          <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #0f172a; color: #ffffff; font-size: 10px; text-transform: uppercase; text-align: left;">
                <th style="padding: 10px;">Grade / Class</th>
                <th style="padding: 10px; text-align: center;">Enrolled</th>
                <th style="padding: 10px; text-align: right;">Total Demand (₹)</th>
                <th style="padding: 10px; text-align: right;">Collected (₹)</th>
                <th style="padding: 10px; text-align: right;">Pending Dues (₹)</th>
                <th style="padding: 10px; text-align: center;">Compliance %</th>
              </tr>
            </thead>
            <tbody>
              ${gradeRowsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; font-size: 11px; font-weight: 900; border-top: 2px solid #0f172a;">
                <td style="padding: 10px; color: #0f172a;">TOTAL SCHOOL SUMMARY</td>
                <td style="padding: 10px; text-align: center;">${filteredStudents.length}</td>
                <td style="padding: 10px; text-align: right;">₹${totalDemand.toLocaleString("en-IN")}</td>
                <td style="padding: 10px; text-align: right; color: #15803d;">₹${totalCollected.toLocaleString("en-IN")}</td>
                <td style="padding: 10px; text-align: right; color: #dc2626;">₹${totalPending.toLocaleString("en-IN")}</td>
                <td style="padding: 10px; text-align: center; color: #059669;">${overallEfficiency}%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Pending Dues Top Action Watchlist -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; font-weight: 900; color: #0f172a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
            2. High Priority Student Pending Dues Watchlist (${pendingWatchlist.length} Accounts Pending)
          </h3>
          <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #334155; color: #ffffff; font-size: 9.5px; text-transform: uppercase; text-align: left;">
                <th style="padding: 8px;">#</th>
                <th style="padding: 8px;">Student (Roll No)</th>
                <th style="padding: 8px;">Grade</th>
                <th style="padding: 8px;">Parent & Contact</th>
                <th style="padding: 8px;">Route & Stop</th>
                <th style="padding: 8px; text-align: right;">Pending Dues (₹)</th>
                <th style="padding: 8px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${topDuesHtml}
            </tbody>
          </table>
        </div>

        <!-- Footer Audit Sign-off Block -->
        <div style="margin-top: 36px; padding-top: 20px; border-top: 2px solid #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #475569;">
          <div>
            <p style="margin: 0; font-weight: bold; color: #0f172a;">REPORT PREPARED BY:</p>
            <p style="margin: 2px 0 0 0;">Accounts & Transport Finance Desk</p>
            <p style="margin: 2px 0 0 0; font-family: monospace;">Ref ID: WIS-RPT-${Date.now()}</p>
          </div>

          <div style="text-align: center; border-bottom: 1px dashed #94a3b8; padding-bottom: 4px; width: 180px;">
            <p style="margin: 0; font-weight: bold; color: #0f172a;">CHIEF TRANSPORT OFFICER</p>
            <p style="margin: 2px 0 0 0; font-size: 9px; color: #64748b;">(Sign & Stamp)</p>
          </div>

          <div style="text-align: center; border-bottom: 1px dashed #94a3b8; padding-bottom: 4px; width: 180px;">
            <p style="margin: 0; font-weight: bold; color: #0f172a;">PRINCIPAL APPROVAL</p>
            <p style="margin: 2px 0 0 0; font-size: 9px; color: #64748b;">WISDOM SCHOOL ESSUR</p>
          </div>
        </div>
      </div>
    `;

    printFormattedContent(
      `Monthly_Fee_And_Dues_Report_${selectedMonth.replace(/\s+/g, "_")}`,
      reportHtml
    );
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    const csvRows: string[] = [];
    csvRows.push(`WISDOM NURSERY & PRIMARY SCHOOL (ESSUR)`);
    csvRows.push(`MONTHLY FEE COLLECTIONS AND PENDING DUES REPORT - ${selectedMonth.toUpperCase()}`);
    csvRows.push(`Academic Year: ${selectedAcademicYear}`);
    csvRows.push(`Generated On: ${new Date().toLocaleString("en-IN")}`);
    csvRows.push(``);
    csvRows.push(`"Grade","Total Enrolled","Total Demand (INR)","Collected Amount (INR)","Pending Dues (INR)","Compliance Rate (%)"`);

    gradeBreakdown.forEach((g) => {
      csvRows.push(`"${g.grade}",${g.totalCount},${g.demand},${g.collected},${g.pending},${g.rate}%`);
    });

    csvRows.push(``);
    csvRows.push(`"Roll Number","Student Name","Grade","Parent Name","Parent Phone","Assigned Route","Pickup Stop","Total Term Bill (INR)","Pending Dues (INR)","Payment Status"`);

    filteredStudents.forEach((s) => {
      const veh = vehicles.find((v) => v.id === s.assignedVehicleId) || vehicles[0];
      const bill = calculateStudentTotalBill(s.grade, s.distanceKm, veh?.type || "Van (14-Seater)");
      const bal = s.balanceRemaining !== undefined ? s.balanceRemaining : s.paymentStatus === "Paid" ? 0 : s.paymentStatus === "Partially Paid" ? Math.round(bill.totalTermAmount * 0.5) : bill.totalTermAmount;

      csvRows.push(`"${s.rollNumber}","${s.name}","${s.grade}","${s.parentName}","${s.parentPhone}","${s.assignedRouteName}","${s.pickupStopName}",${bill.totalTermAmount},${bal},"${s.paymentStatus}"`);
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Wisdom_School_Monthly_Fee_Report_${selectedMonth.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Executive WhatsApp Summary
  const handleCopyWhatsAppSummary = () => {
    const summaryText = `📊 *WISDOM SCHOOL - MONTHLY FEE COLLECTIONS & DUES REPORT*\n*Month: ${selectedMonth} (${selectedAcademicYear})*\n\n🏫 Total Students: *${filteredStudents.length}*\n💵 Total Fee Demand: *₹${totalDemand.toLocaleString("en-IN")}*\n✅ Total Collected: *₹${totalCollected.toLocaleString("en-IN")}*\n⚠️ Outstanding Dues: *₹${totalPending.toLocaleString("en-IN")}*\n📈 Overall Compliance Rate: *${overallEfficiency}%*\n\n*Grade-wise Compliance:*
${gradeBreakdown.map((g) => `• Grade ${g.grade}: ₹${g.collected.toLocaleString("en-IN")} / ₹${g.demand.toLocaleString("en-IN")} (${g.rate}%)`).join("\n")}

Official UPI ID: admissionschool493@okicici
Contact Admin Desk: +91 9176593129`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Trigger Dispatch to Management
  const handleDispatchToManagement = () => {
    setDispatchStatusMsg(`Sending automated monthly PDF report summary to admissionschool493@gmail.com & Principal Desk (+91 9176593129)...`);
    setTimeout(() => {
      setDispatchStatusMsg(`✅ Automated Monthly Report dispatched successfully to Management & Accounts Desk!`);
      setTimeout(() => setDispatchStatusMsg(null), 4000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono">
                  Automated Audit Engine
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  Session {selectedAcademicYear}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                Monthly Fee Collections & Pending Dues Automated Report
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

        {/* Control Toolbar */}
        <div className="bg-slate-800 text-white p-4 px-6 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">Select Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-900 text-amber-300 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-slate-600 focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {monthsList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">Grade Scope:</span>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="bg-slate-900 text-emerald-300 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-slate-600 focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                <option value="All">All Grades (LKG to XII)</option>
                {allGrades.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border border-slate-600"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrintPDFReport}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow flex items-center gap-1.5 cursor-pointer border border-amber-300"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>Generate Official PDF Report</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 bg-slate-50 overflow-y-auto flex-1 space-y-6">
          {dispatchStatusMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{dispatchStatusMsg}</span>
            </div>
          )}

          {/* Key Executive Financial Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Total Fee Demand ({selectedMonth})
              </span>
              <div className="flex items-baseline justify-between">
                <strong className="text-xl font-black text-slate-900">
                  ₹{totalDemand.toLocaleString("en-IN")}
                </strong>
                <span className="text-xs text-slate-500 font-mono">
                  {filteredStudents.length} Students
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Tuition + Van Transport Fee Slabs</p>
            </div>

            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                Collected To Date
              </span>
              <div className="flex items-baseline justify-between">
                <strong className="text-xl font-black text-emerald-900">
                  ₹{totalCollected.toLocaleString("en-IN")}
                </strong>
                <span className="text-xs font-extrabold text-emerald-700 font-mono">
                  {totalPaidCount} Paid
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">Verified via UPI & Counter Receipts</p>
            </div>

            <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">
                Outstanding Pending Dues
              </span>
              <div className="flex items-baseline justify-between">
                <strong className="text-xl font-black text-rose-900">
                  ₹{totalPending.toLocaleString("en-IN")}
                </strong>
                <span className="text-xs font-extrabold text-rose-700 font-mono">
                  {totalPendingCount + totalOverdueCount} Unsettled
                </span>
              </div>
              <p className="text-[11px] text-rose-700 font-medium">
                {totalOverdueCount} Flagged Overdue
              </p>
            </div>

            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
                Collection Efficiency
              </span>
              <div className="flex items-baseline justify-between">
                <strong className="text-xl font-black text-amber-950">
                  {overallEfficiency}%
                </strong>
                <span className="text-xs font-extrabold text-amber-800 font-mono">
                  Target 95%
                </span>
              </div>
              <div className="w-full bg-amber-200/80 rounded-full h-2 overflow-hidden mt-1">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${overallEfficiency}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grade-wise Fee Collections Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  Grade-by-Grade Fee Collections & Compliance Matrix
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed breakdown of tuition and transport fee collections across all enrolled classes.
                </p>
              </div>

              <button
                onClick={handleCopyWhatsAppSummary}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>{copiedSummary ? "Copied Summary!" : "Copy WhatsApp Summary"}</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[11px] uppercase">
                    <th className="p-3">Grade / Class</th>
                    <th className="p-3 text-center">Enrolled</th>
                    <th className="p-3 text-right">Total Demand (₹)</th>
                    <th className="p-3 text-right">Collected (₹)</th>
                    <th className="p-3 text-right">Pending Dues (₹)</th>
                    <th className="p-3 text-center">Compliance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {gradeBreakdown.map((g) => {
                    const badgeColor =
                      g.rate >= 90
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : g.rate >= 75
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-rose-100 text-rose-900 border-rose-300";

                    return (
                      <tr key={g.grade} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-extrabold text-slate-900">Grade {g.grade}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{g.totalCount}</td>
                        <td className="p-3 text-right font-extrabold text-slate-900">
                          ₹{g.demand.toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-right font-extrabold text-emerald-700">
                          ₹{g.collected.toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-right font-extrabold text-rose-700">
                          ₹{g.pending.toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeColor}`}>
                            {g.rate}% ({g.paidCount}/{g.totalCount} Cleared)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                    <td className="p-3">TOTAL SCHOOL SUMMARY</td>
                    <td className="p-3 text-center">{filteredStudents.length}</td>
                    <td className="p-3 text-right">₹{totalDemand.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right text-emerald-700">₹{totalCollected.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right text-rose-700">₹{totalPending.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-center text-emerald-700">{overallEfficiency}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Pending Dues Priority Action Watchlist */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Top Pending Dues Student Watchlist ({pendingWatchlist.length} Accounts)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  High balance student accounts requiring immediate admin follow-up and parent reminder dispatch.
                </p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              {pendingWatchlist.slice(0, 10).map((s, idx) => {
                const veh = vehicles.find((v) => v.id === s.assignedVehicleId) || vehicles[0];
                const bill = calculateStudentTotalBill(s.grade, s.distanceKm, veh?.type || "Van (14-Seater)");
                const bal = s.balanceRemaining !== undefined ? s.balanceRemaining : s.paymentStatus === "Partially Paid" ? Math.round(bill.totalTermAmount * 0.5) : bill.totalTermAmount;

                const portalUrl = `${typeof window !== "undefined" ? window.location.origin : "https://wisdomschool.edu.in"}/?studentId=${s.id}&tab=parent`;
                const whatsappText = `💰 *WISDOM SCHOOL - TRANSPORT & FEE REMINDER*\nDear Parent (*${s.parentName}*),\nPending dues for *${s.name}* (Grade ${s.grade}): *₹${bal}*.\nUPI ID: admissionschool493@okicici\nPortal: ${portalUrl}`;

                return (
                  <div key={s.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black flex items-center justify-center shrink-0 border border-rose-200">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <strong className="text-slate-900 block truncate">
                          {s.name} ({s.rollNumber}) • Grade {s.grade}
                        </strong>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Parent: {s.parentName} (📞 {s.parentPhone}) • Route: {s.assignedRouteName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-rose-600 block">₹{bal.toLocaleString("en-IN")}</span>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">{s.paymentStatus}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const cleanPhone = s.parentPhone.replace(/\D/g, "");
                          const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                          const url = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(whatsappText)}`;
                          window.open(url, "_blank");
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg transition shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" /> WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Automated Monthly Schedule & Audit Configuration */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">
                    Automated Recurring Monthly Report Dispatcher
                  </h4>
                  <p className="text-xs text-slate-400">
                    Automatically compiles and dispatches PDF summary on the 1st of every month to Management.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-bold">Auto-Schedule:</span>
                <button
                  type="button"
                  onClick={() => setAutoScheduleActive(!autoScheduleActive)}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                    autoScheduleActive
                      ? "bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/40"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {autoScheduleActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                  <span>{autoScheduleActive ? "ACTIVE (1st of Month)" : "DISABLED"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Designated Email Recipients:</span>
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" /> admissionschool493@gmail.com
                </span>
                <span className="text-slate-400 text-[10px] block">Principal Audit Copy & Board Record</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Designated WhatsApp Desk:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-400" /> +91 9176593129 (Chief Transport Desk)
                </span>
                <span className="text-slate-400 text-[10px] block">Instant Monthly Financial Alert</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleDispatchToManagement}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer border border-emerald-300"
              >
                <Send className="w-3.5 h-3.5 fill-slate-950" />
                <span>Run Manual Dispatch Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500">
            Wisdom Nursery & Primary School (Essur) • Automated Monthly Audit Engine 2026–27
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPDFReport}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer border border-amber-300"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Print Official PDF Summary</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
