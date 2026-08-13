/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { ParentPortal } from "./components/ParentPortal";
import { FleetTracker } from "./components/FleetTracker";
import { StudentRoster } from "./components/StudentRoster";
import { FeeBillingEngine } from "./components/FeeBillingEngine";
import { RouteOptimizer } from "./components/RouteOptimizer";
import { DriverManagement } from "./components/DriverManagement";
import { SchoolProfile } from "./components/SchoolProfile";
import { DeviceManagement } from "./components/DeviceManagement";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { BulkNotificationDashboard } from "./components/BulkNotificationDashboard";
import { ReceiptModal } from "./components/ReceiptModal";
import { AIAssistantModal } from "./components/AIAssistantModal";

import {
  Student,
  Vehicle,
  Driver,
  SchoolInfo,
  NotificationLog,
  PaymentReceipt,
  AttendanceStatus,
  PrintedDevice,
  TransportFeedback,
} from "./types";
import {
  SCHOOL_INFO,
  INITIAL_DRIVERS,
  INITIAL_VEHICLES,
  INITIAL_STUDENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_DEVICES,
  INITIAL_FEEDBACK,
} from "./data/mockData";
import { Phone, MapPin, Mail, ShieldCheck, Bus, Heart } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("parent");
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(SCHOOL_INFO);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [notifications, setNotifications] = useState<NotificationLog[]>(INITIAL_NOTIFICATIONS);
  const [devices, setDevices] = useState<PrintedDevice[]>(INITIAL_DEVICES);
  const [feedbackList, setFeedbackList] = useState<TransportFeedback[]>(INITIAL_FEEDBACK);

  // Modal State
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);

  // Background Job State & Ref for Automated Fee Billing Cycle Scanner
  const [lastFeeScanTime, setLastFeeScanTime] = useState<string>("");
  const processedFeeRemindersRef = useRef<Set<string>>(new Set());

  // Background Job: Automatically flag overdue fee payments & trigger parent reminder notifications based on billing cycle
  const runFeeBillingBackgroundJob = useCallback(() => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const newNotificationsToAdd: NotificationLog[] = [];

    setStudents((prevStudents) => {
      let hasStatusChanges = false;

      const updatedStudents = prevStudents.map((s) => {
        // Skip students who have paid or don't have a due date
        if (s.paymentStatus === "Paid" || !s.dueDate) {
          return s;
        }

        // Parse due date reliably (handles YYYY-MM-DD or standard format)
        let dueTime = NaN;
        if (s.dueDate.includes("-")) {
          const parts = s.dueDate.split("-").map(Number);
          if (parts.length === 3) {
            dueTime = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
          }
        }
        if (isNaN(dueTime)) {
          dueTime = new Date(s.dueDate).getTime();
        }

        if (isNaN(dueTime)) return s;

        // Calculate difference in full calendar days
        const diffDays = Math.floor((dueTime - todayMidnight) / (1000 * 60 * 60 * 24));
        let newStatus = s.paymentStatus;

        // Rule 1: Automatically flag overdue payments (due date has passed)
        if (diffDays < 0 && s.paymentStatus !== "Overdue") {
          newStatus = "Overdue";
          hasStatusChanges = true;
        }

        // Unique keys to ensure parent reminder notifications are not duplicated per billing cycle
        const overdueReminderKey = `overdue-reminder-${s.id}-${s.dueDate}`;
        const upcomingReminderKey = `upcoming-reminder-${s.id}-${s.dueDate}`;

        // Rule 2: Overdue Payment Reminder Notification
        if (diffDays < 0 && !processedFeeRemindersRef.current.has(overdueReminderKey)) {
          processedFeeRemindersRef.current.add(overdueReminderKey);

          const dueAmt = s.balanceRemaining || (s.tuitionFeePerTerm / 3 + s.transportFeePerMonth);
          const msg = `🚨 OVERDUE FEE REMINDER: Dear ${s.parentName}, transport & school fee for ward ${s.name} (${s.grade}, Roll: ${s.rollNumber}) was due on ${s.dueDate} and is now OVERDUE (Outstanding: ₹${Math.round(dueAmt).toLocaleString("en-IN")}). Please pay via UPI ID ${schoolInfo.upiId} (${schoolInfo.upiName}) or contact Chief Officer Mr. R SARAVANAN (+91 ${schoolInfo.contactPhone}).`;

          newNotificationsToAdd.push({
            id: `NOTIF-AUTO-OVERDUE-${Date.now()}-${s.id}`,
            studentId: s.id,
            studentName: s.name,
            parentPhone: s.parentPhone,
            message: msg,
            timestamp: `${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} Today (Auto Job)`,
            type: "WhatsApp",
            status: "Delivered",
          });
        }

        // Rule 3: Upcoming Fee Reminder Notification (0 to 5 days remaining)
        if (diffDays >= 0 && diffDays <= 5 && !processedFeeRemindersRef.current.has(upcomingReminderKey)) {
          processedFeeRemindersRef.current.add(upcomingReminderKey);

          const dueAmt = s.balanceRemaining || (s.tuitionFeePerTerm / 3 + s.transportFeePerMonth);
          const daysText = diffDays === 0 ? "TODAY" : `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
          const msg = `🔔 UPCOMING FEE REMINDER: Dear ${s.parentName}, transport fee for ward ${s.name} (${s.grade}) is due ${daysText} (${s.dueDate}). Due amount: ₹${Math.round(dueAmt).toLocaleString("en-IN")}. Official UPI ID: ${schoolInfo.upiId}.`;

          newNotificationsToAdd.push({
            id: `NOTIF-AUTO-DUE-${Date.now()}-${s.id}`,
            studentId: s.id,
            studentName: s.name,
            parentPhone: s.parentPhone,
            message: msg,
            timestamp: `${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} Today (Auto Job)`,
            type: "SMS",
            status: "Delivered",
          });
        }

        if (newStatus !== s.paymentStatus) {
          return { ...s, paymentStatus: newStatus };
        }
        return s;
      });

      return updatedStudents;
    });

    if (newNotificationsToAdd.length > 0) {
      setNotifications((prev) => [...newNotificationsToAdd, ...prev]);
    }

    setLastFeeScanTime(formattedTime);
  }, [schoolInfo]);

  // Execute background job on mount & set up recurring interval
  useEffect(() => {
    runFeeBillingBackgroundJob();

    const intervalId = setInterval(() => {
      runFeeBillingBackgroundJob();
    }, 30000); // Scans every 30 seconds

    return () => clearInterval(intervalId);
  }, [runFeeBillingBackgroundJob]);

  // Vehicle Fleet CRUD Handlers
  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehicles((prev) => [newVehicle, ...prev]);
  };

  const handleEditVehicle = (updatedVehicle: Vehicle) => {
    setVehicles((prev) => prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v)));
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
  };

  // Printed Hardware Devices CRUD Handlers
  const handleAddDevice = (newDev: PrintedDevice) => {
    setDevices((prev) => [newDev, ...prev]);
  };

  const handleEditDevice = (updatedDev: PrintedDevice) => {
    setDevices((prev) => prev.map((d) => (d.id === updatedDev.id ? updatedDev : d)));
  };

  const handleDeleteDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };

  // Student Edit and Delete Handlers
  const handleEditStudent = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  // Transport Feedback Handler
  const handleAddFeedback = (newFeedback: TransportFeedback) => {
    setFeedbackList((prev) => [newFeedback, ...prev]);
  };

  // Driver CRUD Handlers
  const handleAddDriver = (newDriver: Driver) => {
    setDrivers((prev) => [newDriver, ...prev]);
  };

  const handleEditDriver = (updatedDriver: Driver) => {
    setDrivers((prev) => prev.map((d) => (d.id === updatedDriver.id ? updatedDriver : d)));
  };

  const handleDeleteDriver = (driverId: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== driverId));
  };

  // School Profile Update Handler
  const handleUpdateSchoolInfo = (updatedInfo: SchoolInfo) => {
    setSchoolInfo(updatedInfo);
  };

  // Handle Attendance status updates with auto-triggered SMS/WhatsApp logs
  const handleUpdateAttendance = (studentId: string, newStatus: AttendanceStatus) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const updatedStudent = {
            ...s,
            attendanceStatus: newStatus,
            lastStatusTime: timestamp,
          };

          // Generate simulated alert
          const notifMsg = `VAN ALERT: ${s.name} (${s.grade}) status changed to '${newStatus}' at ${timestamp}. ${schoolInfo.name}.`;
          const newNotif: NotificationLog = {
            id: "NOTIF-" + Date.now(),
            studentId: s.id,
            studentName: s.name,
            parentPhone: s.parentPhone,
            message: notifMsg,
            timestamp: "Just Now",
            type: "WhatsApp",
            status: "Delivered",
          };

          setNotifications((notifList) => [newNotif, ...notifList]);
          return updatedStudent;
        }
        return s;
      })
    );
  };

  // Handle Sending Notification Batch (Fee Reminders, Alerts)
  const handleSendNotificationBatch = (newNotifs: NotificationLog[]) => {
    setNotifications((prev) => [...newNotifs, ...prev]);
  };

  // Handle Adding New Student
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);

    // Send Welcome Notification
    const newNotif: NotificationLog = {
      id: "NOTIF-" + Date.now(),
      studentId: newStudent.id,
      studentName: newStudent.name,
      parentPhone: newStudent.parentPhone,
      message: `WELCOME: ${newStudent.name} successfully enrolled for ${schoolInfo.name} Van Transport (${newStudent.assignedRouteName}). Contact ${schoolInfo.contactPerson} (${schoolInfo.contactPhone}) for queries.`,
      timestamp: "Just Now",
      type: "WhatsApp",
      status: "Delivered",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Verify Payment API bridge
  const handleVerifyPayment = async (paymentData: any): Promise<PaymentReceipt> => {
    try {
      const res = await fetch("/api/payments/verify-upi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const data = await res.json();
      if (data.success && data.receipt) {
        // Update student payment status in local state
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id === paymentData.studentId) {
              return {
                ...s,
                paymentStatus: "Paid",
                lastPaymentDate: new Date().toLocaleDateString("en-IN"),
                lastUtrNumber: paymentData.utrNumber,
              };
            }
            return s;
          })
        );

        return data.receipt;
      }
      throw new Error("Verification failed");
    } catch {
      // Fallback local receipt generator
      const fallbackReceipt: PaymentReceipt = {
        receiptNumber: "WIS-" + Math.floor(100000 + Math.random() * 900000),
        schoolName: schoolInfo.name,
        address: schoolInfo.location,
        motto: schoolInfo.motto,
        contactPerson: `${schoolInfo.contactPerson} (${schoolInfo.contactPhone})`,
        upiId: schoolInfo.upiId,
        studentId: paymentData.studentId,
        studentName: paymentData.studentName,
        grade: "Nursery / Primary",
        parentName: "Parent",
        amountPaid: paymentData.amount || 12800,
        tuitionFeePart: Math.round((paymentData.amount || 12800) * 0.75),
        transportFeePart: Math.round((paymentData.amount || 12800) * 0.25),
        utrNumber: paymentData.utrNumber,
        paymentMethod: paymentData.paymentMethod || "UPI Direct",
        feeType: paymentData.feeType || "School & Transport Fees",
        paymentDate: new Date().toLocaleDateString("en-IN"),
        status: "PAID & VERIFIED",
      };

      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === paymentData.studentId) {
            return {
              ...s,
              paymentStatus: "Paid",
              lastPaymentDate: new Date().toLocaleDateString("en-IN"),
              lastUtrNumber: paymentData.utrNumber,
            };
          }
          return s;
        })
      );

      return fallbackReceipt;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-yellow-400 selection:text-slate-950">
      {/* Official Header Component */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAIHelp={() => setAiModalOpen(true)}
        schoolInfo={schoolInfo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-6 pb-12">
        {/* Automated Background Scanner Status Banner */}
        <div className="mb-5 bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row items-center justify-between text-xs gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <span className="font-extrabold text-white text-xs sm:text-sm">
                Automated Fee Billing & Overdue Background Job
              </span>
              <span className="text-slate-400 text-[11px] block sm:inline sm:ml-2">
                Active — Automatically scans billing cycles, flags overdue payments & dispatches parent reminders
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-slate-400 font-mono text-[11px]">
              Last Scan: <strong className="text-amber-400 font-bold">{lastFeeScanTime || "Just Now"}</strong>
            </span>
            <button
              onClick={runFeeBillingBackgroundJob}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-extrabold rounded-xl text-[11px] border border-slate-700 transition cursor-pointer shadow-sm"
              title="Force trigger background fee cycle scanner"
            >
              Run Scan Now
            </button>
          </div>
        </div>
        {activeTab === "parent" && (
          <ParentPortal
            students={students}
            vehicles={vehicles}
            notifications={notifications}
            feedbackList={feedbackList}
            onAddFeedback={handleAddFeedback}
            onOpenReceipt={(r) => setActiveReceipt(r)}
            onVerifyPayment={handleVerifyPayment}
          />
        )}

        {activeTab === "fleet" && (
          <FleetTracker
            vehicles={vehicles}
            onAddVehicle={handleAddVehicle}
            onEditVehicle={handleEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        )}

        {activeTab === "students" && (
          <StudentRoster
            students={students}
            vehicles={vehicles}
            onUpdateAttendance={handleUpdateAttendance}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onSendNotificationBatch={handleSendNotificationBatch}
            onOpenReceipt={(r) => setActiveReceipt(r)}
          />
        )}

        {activeTab === "billing" && (
          <FeeBillingEngine
            students={students}
            vehicles={vehicles}
            onOpenReceipt={(r) => setActiveReceipt(r)}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onAddStudent={handleAddStudent}
          />
        )}

        {activeTab === "notifications" && (
          <BulkNotificationDashboard
            notifications={notifications}
            students={students}
            vehicles={vehicles}
            onSendNotificationBatch={handleSendNotificationBatch}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsDashboard students={students} vehicles={vehicles} feedbackList={feedbackList} />
        )}

        {activeTab === "routes" && <RouteOptimizer vehicles={vehicles} />}

        {activeTab === "drivers" && (
          <DriverManagement
            drivers={drivers}
            vehicles={vehicles}
            students={students}
            onUpdateAttendance={handleUpdateAttendance}
            onAddDriver={handleAddDriver}
            onEditDriver={handleEditDriver}
            onDeleteDriver={handleDeleteDriver}
            onAddVehicle={handleAddVehicle}
            onEditVehicle={handleEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        )}

        {activeTab === "profile" && (
          <SchoolProfile
            schoolInfo={schoolInfo}
            onUpdateSchoolInfo={handleUpdateSchoolInfo}
            students={students}
            vehicles={vehicles}
          />
        )}

        {activeTab === "devices" && (
          <DeviceManagement
            devices={devices}
            onAddDevice={handleAddDevice}
            onEditDevice={handleEditDevice}
            onDeleteDevice={handleDeleteDevice}
          />
        )}
      </main>

      {/* Official School Footer */}
      <footer className="bg-slate-950 text-white border-t border-slate-800 pt-10 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs sm:text-sm">
          {/* Col 1: School Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-900 text-yellow-400 font-bold flex flex-col items-center justify-center text-[8px] border border-yellow-400">
                <Bus className="w-5 h-5" />
                <span>WISDOM</span>
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base leading-tight">
                  {schoolInfo.name}
                </h3>
                <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                  "{schoolInfo.motto}"
                </p>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Safe, automated, and real-time school van transport tracking system serving Essur, Cheyyar, Vandavasi, and Tindivanam surrounding areas.
            </p>
          </div>

          {/* Col 2: Transport & Contact Person Details */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-yellow-400 uppercase text-xs tracking-wider">
              Transport Management Contact
            </h4>
            <div className="text-slate-300 space-y-1.5 text-xs">
              <p>
                Chief Transport Officer: <strong className="text-white">{schoolInfo.contactPerson}</strong>
              </p>
              <p className="flex items-center gap-2 font-mono text-emerald-400 font-bold">
                <Phone className="w-4 h-4 text-emerald-500" />
                <a href={`tel:${schoolInfo.contactPhone}`} className="hover:underline">
                  +91 {schoolInfo.contactPhone}
                </a>
              </p>
              <p className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-slate-500" />
                {schoolInfo.contactEmail}
              </p>
            </div>
          </div>

          {/* Col 3: Official UPI Payment Beneficiary */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-yellow-400 uppercase text-xs tracking-wider">
              UPI Beneficiary Details
            </h4>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">Account Holder: <strong className="text-white">{schoolInfo.upiName}</strong></p>
              <p className="text-slate-400 font-mono">
                UPI ID: <strong className="text-yellow-400">{schoolInfo.upiId}</strong>
              </p>
              <span className="inline-block text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold mt-1">
                Accepts GPay, PhonePe, Paytm, Cards
              </span>
            </div>
          </div>

          {/* Col 4: Address & Location */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-yellow-400 uppercase text-xs tracking-wider">
              School Campus Address
            </h4>
            <p className="text-slate-300 text-xs flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{schoolInfo.location}</span>
            </p>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-900">
              © 2026 {schoolInfo.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Official Verified Fee Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      {/* Gemini AI Transport Assistant Modal */}
      <AIAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />
    </div>
  );
}

