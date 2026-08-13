import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  FileCheck,
  Check,
  Info,
  RefreshCw,
  Users,
  Bus,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Student, Vehicle } from "../types";
import { calculateMonthlyTransportFee } from "../utils/feeCalculator";

interface StudentExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  existingStudents: Student[];
  onImportStudents: (importedStudents: Student[]) => void;
}

interface ParsedRecord {
  id: string;
  originalRowNumber: number;
  rollNumber: string;
  name: string;
  grade: string;
  parentName: string;
  parentPhone: string;
  address: string;
  pickupStopName: string;
  distanceKm: number;
  vehicleMatch: Vehicle | null;
  assignedRouteName: string;
  tuitionFeePerTerm: number;
  transportFeePerMonth: number;
  paymentStatus: "Paid" | "Pending" | "Overdue" | "Partially Paid";
  dueDate: string;
  balanceRemaining: number;
  rfidTagId: string;
  isValid: boolean;
  warnings: string[];
  errors: string[];
  isSelected: boolean;
}

export const StudentExcelImportModal: React.FC<StudentExcelImportModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  existingStudents,
  onImportStudents,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState<string>("");
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [importFilter, setImportFilter] = useState<"all" | "valid" | "warning" | "invalid">("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Roll Number": "WIS-2026-101",
        "Student Name": "R. Vignesh",
        "Grade / Class": "Grade III",
        "Parent Name": "M. Ramanathan",
        "Parent Phone": "9840123456",
        "Address": "No. 12 Main Road, Essur",
        "Pickup Stop": "Essur Bus Stop",
        "Distance (km)": 4.5,
        "Assigned Vehicle / Route": vehicles[0]?.registrationNumber || "TN-21-AZ-4921",
        "Tuition Fee per Term": 15000,
        "Transport Fee per Month": 800,
        "Payment Status": "Pending",
        "Due Date": "2026-08-31",
        "Balance Remaining": 800,
        "RFID Tag ID": "RFID-881290",
      },
      {
        "Roll Number": "WIS-2026-102",
        "Student Name": "K. Ananya",
        "Grade / Class": "LKG",
        "Parent Name": "S. Karthik",
        "Parent Phone": "9876543210",
        "Address": "Near Pillaiyar Temple, Cheyyar",
        "Pickup Stop": "Cheyyar Clock Tower",
        "Distance (km)": 8.0,
        "Assigned Vehicle / Route": vehicles[1]?.registrationNumber || "TN-21-BY-5012",
        "Tuition Fee per Term": 12000,
        "Transport Fee per Month": 1200,
        "Payment Status": "Paid",
        "Due Date": "2026-08-31",
        "Balance Remaining": 0,
        "RFID Tag ID": "RFID-992341",
      },
      {
        "Roll Number": "WIS-2026-103",
        "Student Name": "M. Divya",
        "Grade / Class": "Grade V",
        "Parent Name": "G. Murugan",
        "Parent Phone": "9443388771",
        "Address": "Chunambedu Junction, Essur",
        "Pickup Stop": "Chunambedu Arch",
        "Distance (km)": 12.5,
        "Assigned Vehicle / Route": vehicles[0]?.registrationNumber || "TN-21-AZ-4921",
        "Tuition Fee per Term": 16000,
        "Transport Fee per Month": 1600,
        "Payment Status": "Overdue",
        "Due Date": "2026-07-28",
        "Balance Remaining": 1600,
        "RFID Tag ID": "RFID-771102",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for nice layout
    worksheet["!cols"] = [
      { wch: 15 }, // Roll Number
      { wch: 20 }, // Student Name
      { wch: 15 }, // Grade
      { wch: 20 }, // Parent Name
      { wch: 15 }, // Parent Phone
      { wch: 25 }, // Address
      { wch: 20 }, // Pickup Stop
      { wch: 14 }, // Distance
      { wch: 25 }, // Assigned Vehicle
      { wch: 20 }, // Tuition Fee
      { wch: 22 }, // Transport Fee
      { wch: 15 }, // Payment Status
      { wch: 12 }, // Due Date
      { wch: 18 }, // Balance Remaining
      { wch: 15 }, // RFID Tag
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students Import Template");

    // Add Instructions sheet
    const instructions = [
      { "Instruction": "Welcome to Wisdom Primary School Student Roster Excel Importer!" },
      { "Instruction": "1. Keep column headers exactly as given in the first sheet or use similar column names." },
      { "Instruction": "2. Required fields: 'Student Name', 'Grade', 'Parent Phone'." },
      { "Instruction": "3. 'Assigned Vehicle / Route' can match Van Reg Number (e.g. TN-21-AZ-4921) or Route Name." },
      { "Instruction": "4. If 'Transport Fee' is left blank, it will be automatically calculated based on Distance." },
      { "Instruction": "5. You can upload .xlsx, .xls, or .csv files directly." },
    ];
    const instructionSheet = XLSX.utils.json_to_sheet(instructions);
    instructionSheet["!cols"] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, instructionSheet, "Instructions");

    XLSX.writeFile(workbook, "Wisdom_School_Student_Import_Template.xlsx");
  };

  // Helper to normalize object keys
  const getFieldValue = (row: any, aliases: string[]): any => {
    const keys = Object.keys(row);
    for (const alias of aliases) {
      const match = keys.find((k) => k.trim().toLowerCase().replace(/[^a-z0-9]/g, "") === alias.toLowerCase().replace(/[^a-z0-9]/g, ""));
      if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== "") {
        return row[match];
      }
    }
    return undefined;
  };

  // Process File Reading
  const handleFileChange = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);
    setImportSuccessCount(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!jsonData || jsonData.length === 0) {
          alert("The uploaded Excel or CSV file contains no data rows.");
          setIsProcessing(false);
          return;
        }

        const parsed: ParsedRecord[] = jsonData.map((row: any, idx: number) => {
          const warnings: string[] = [];
          const errors: string[] = [];

          // 1. Roll Number
          const rawRoll = getFieldValue(row, ["rollnumber", "rollno", "roll_no", "regno", "student id", "id"]);
          const rollNumber = rawRoll ? String(rawRoll).trim() : `WIS-2026-${Math.floor(100 + Math.random() * 900)}`;

          // 2. Student Name
          const rawName = getFieldValue(row, ["studentname", "name", "full name", "fullname", "student_name", "child name"]);
          const name = rawName ? String(rawName).trim() : "";
          if (!name) {
            errors.push("Missing student name");
          }

          // 3. Grade / Class
          const rawGrade = getFieldValue(row, ["grade", "class", "gradeclass", "standard", "sec"]);
          let grade = rawGrade ? String(rawGrade).trim() : "Grade I";
          if (!["LKG", "UKG", "Grade I", "Grade II", "Grade III", "Grade IV", "Grade V"].includes(grade)) {
            // Default or normalize grade
            if (grade.toLowerCase().includes("nursery") || grade.toLowerCase().includes("pre")) grade = "LKG";
            else if (grade.toLowerCase().includes("lkg")) grade = "LKG";
            else if (grade.toLowerCase().includes("ukg")) grade = "UKG";
            else if (grade.includes("1") || grade.toLowerCase().includes("i")) grade = "Grade I";
            else if (grade.includes("2") || grade.toLowerCase().includes("ii")) grade = "Grade II";
            else if (grade.includes("3") || grade.toLowerCase().includes("iii")) grade = "Grade III";
            else if (grade.includes("4") || grade.toLowerCase().includes("iv")) grade = "Grade IV";
            else if (grade.includes("5") || grade.toLowerCase().includes("v")) grade = "Grade V";
            else {
              warnings.push(`Grade '${grade}' normalized to 'Grade I'`);
              grade = "Grade I";
            }
          }

          // 4. Parent Name
          const rawParentName = getFieldValue(row, ["parentname", "father name", "guardian", "parent_name", "parent"]);
          const parentName = rawParentName ? String(rawParentName).trim() : "Parent / Guardian";

          // 5. Parent Phone
          const rawPhone = getFieldValue(row, ["parentphone", "phone", "mobile", "contact", "parent_phone", "mobile number"]);
          let parentPhone = rawPhone ? String(rawPhone).replace(/\D/g, "") : "";
          if (!parentPhone || parentPhone.length < 10) {
            warnings.push("Phone number formatted to standard 10 digits");
            parentPhone = parentPhone.padEnd(10, "0").slice(0, 10) || "9876543210";
          }

          // 6. Address
          const rawAddress = getFieldValue(row, ["address", "location", "area", "village"]);
          const address = rawAddress ? String(rawAddress).trim() : "Main Road, Essur - 603310";

          // 7. Pickup Stop
          const rawStop = getFieldValue(row, ["pickupstop", "stop", "pickup stop", "landmark", "bus stop"]);
          const pickupStopName = rawStop ? String(rawStop).trim() : "Essur Central Bus Stop";

          // 8. Distance (km)
          const rawDist = getFieldValue(row, ["distance", "distancekm", "distance (km)", "dist"]);
          let distanceKm = rawDist ? parseFloat(String(rawDist)) : 5.0;
          if (isNaN(distanceKm) || distanceKm <= 0) {
            distanceKm = 5.0;
            warnings.push("Defaulted distance to 5.0 km");
          }

          // 9. Assigned Vehicle / Route
          const rawVehicle = getFieldValue(row, ["assigned vehicle", "vehicle", "route", "van", "bus", "assigned vehicle / route"]);
          let matchedVehicle: Vehicle | null = null;

          if (rawVehicle) {
            const searchStr = String(rawVehicle).toLowerCase().trim();
            matchedVehicle =
              vehicles.find(
                (v) =>
                  v.registrationNumber.toLowerCase().includes(searchStr) ||
                  v.routeName.toLowerCase().includes(searchStr) ||
                  v.id.toLowerCase() === searchStr
              ) || null;
          }

          if (!matchedVehicle && vehicles.length > 0) {
            matchedVehicle = vehicles[0];
            warnings.push(`Assigned to primary fleet van (${vehicles[0].registrationNumber})`);
          }

          const assignedRouteName = matchedVehicle ? matchedVehicle.routeName : "Route 1 - Essur Express";

          // 10. Fees calculation
          const rawTuition = getFieldValue(row, ["tuition fee", "tuitionfee", "tuition"]);
          const tuitionFeePerTerm = rawTuition ? parseFloat(String(rawTuition)) : 15000;

          const rawTransportFee = getFieldValue(row, ["transport fee", "transportfee", "van fee", "bus fee"]);
          let transportFeePerMonth = rawTransportFee ? parseFloat(String(rawTransportFee)) : 0;

          if (!transportFeePerMonth || isNaN(transportFeePerMonth)) {
            transportFeePerMonth = calculateMonthlyTransportFee(
              distanceKm,
              matchedVehicle ? matchedVehicle.type : "Van (14-Seater)"
            );
          }

          // 11. Payment Status
          const rawStatus = getFieldValue(row, ["payment status", "status", "payment"]);
          let paymentStatus: "Paid" | "Pending" | "Overdue" | "Partially Paid" = "Pending";
          if (rawStatus) {
            const st = String(rawStatus).toLowerCase();
            if (st.includes("paid") && !st.includes("part")) paymentStatus = "Paid";
            else if (st.includes("overdue")) paymentStatus = "Overdue";
            else if (st.includes("part")) paymentStatus = "Partially Paid";
          }

          // 12. Due Date
          const rawDueDate = getFieldValue(row, ["due date", "duedate", "due"]);
          const dueDate = rawDueDate ? String(rawDueDate).trim() : "2026-08-31";

          // 13. Balance Remaining
          const rawBalance = getFieldValue(row, ["balance", "balance remaining", "balance_remaining"]);
          let balanceRemaining = rawBalance !== undefined && rawBalance !== "" ? parseFloat(String(rawBalance)) : undefined;

          if (balanceRemaining === undefined || isNaN(balanceRemaining)) {
            balanceRemaining = paymentStatus === "Paid" ? 0 : paymentStatus === "Partially Paid" ? Math.round(transportFeePerMonth * 0.5) : transportFeePerMonth;
          }

          // 14. RFID Tag ID
          const rawRfid = getFieldValue(row, ["rfid", "rfid tag id", "rfid_tag", "rfidtag"]);
          const rfidTagId = rawRfid ? String(rawRfid).trim() : `RFID-${Math.floor(100000 + Math.random() * 900000)}`;

          const isValid = errors.length === 0;

          return {
            id: `STU-IMP-${idx}-${Date.now()}`,
            originalRowNumber: idx + 2, // Accounting for header row
            rollNumber,
            name,
            grade,
            parentName,
            parentPhone,
            address,
            pickupStopName,
            distanceKm,
            vehicleMatch: matchedVehicle,
            assignedRouteName,
            tuitionFeePerTerm,
            transportFeePerMonth,
            paymentStatus,
            dueDate,
            balanceRemaining,
            rfidTagId,
            isValid,
            warnings,
            errors,
            isSelected: isValid,
          };
        });

        setParsedRecords(parsed);
      } catch (err) {
        console.error("Error parsing spreadsheet file:", err);
        alert("Failed to parse the uploaded spreadsheet. Please check the file format (.xlsx, .xls, or .csv).");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const toggleSelectRecord = (id: string) => {
    setParsedRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isSelected: !r.isSelected } : r))
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    setParsedRecords((prev) =>
      prev.map((r) => (r.isValid ? { ...r, isSelected: checked } : r))
    );
  };

  // Filtered records for table view
  const filteredRecords = parsedRecords.filter((r) => {
    if (importFilter === "valid" && (!r.isValid || r.warnings.length > 0)) return false;
    if (importFilter === "warning" && (r.warnings.length === 0 || !r.isValid)) return false;
    if (importFilter === "invalid" && r.isValid) return false;

    if (searchFilter.trim() !== "") {
      const q = searchFilter.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.rollNumber.toLowerCase().includes(q) ||
        r.parentName.toLowerCase().includes(q) ||
        r.pickupStopName.toLowerCase().includes(q) ||
        r.grade.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedCount = parsedRecords.filter((r) => r.isSelected).length;
  const validCount = parsedRecords.filter((r) => r.isValid).length;
  const warningCount = parsedRecords.filter((r) => r.isValid && r.warnings.length > 0).length;
  const invalidCount = parsedRecords.filter((r) => !r.isValid).length;

  // Execute Batch Import into State
  const handleConfirmImport = () => {
    const selectedToImport = parsedRecords.filter((r) => r.isSelected && r.isValid);

    if (selectedToImport.length === 0) {
      alert("Please select at least one valid student record to import.");
      return;
    }

    const newStudentObjects: Student[] = selectedToImport.map((r) => {
      const assignedVeh = r.vehicleMatch || vehicles[0];
      return {
        id: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        rollNumber: r.rollNumber,
        name: r.name,
        grade: r.grade,
        parentName: r.parentName,
        parentPhone: r.parentPhone,
        address: r.address,
        pickupStopName: r.pickupStopName,
        distanceKm: r.distanceKm,
        assignedVehicleId: assignedVeh?.id || "VEH-1",
        assignedRouteName: assignedVeh?.routeName || r.assignedRouteName,
        tuitionFeePerTerm: r.tuitionFeePerTerm,
        transportFeePerMonth: r.transportFeePerMonth,
        paymentStatus: r.paymentStatus,
        dueDate: r.dueDate,
        balanceRemaining: r.balanceRemaining,
        attendanceStatus: "Absent",
        lastStatusTime: "Not Scanned Today",
        rfidTagId: r.rfidTagId,
        latitude: 12.3069 + (Math.random() - 0.5) * 0.05,
        longitude: 79.8562 + (Math.random() - 0.5) * 0.05,
      };
    });

    onImportStudents(newStudentObjects);
    setImportSuccessCount(newStudentObjects.length);

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono">
                  Batch Excel / CSV Importer
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  XLSX • XLS • CSV Supported
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                Import Student Transport Roster from Excel
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

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Actions: File Upload & Template Download */}
          {importSuccessCount === null ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* File Dropzone (8 cols) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`md:col-span-8 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                  dragOver
                    ? "border-emerald-500 bg-emerald-50/50"
                    : fileName
                    ? "border-emerald-400 bg-slate-50"
                    : "border-slate-300 hover:border-slate-400 bg-slate-50/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {isProcessing ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>

                <div>
                  {fileName ? (
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 text-sm flex items-center justify-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        {fileName}
                      </p>
                      <p className="text-xs text-slate-500">Click or drag another file to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 text-sm">
                        Drag & Drop your Excel file (.xlsx, .csv) here
                      </p>
                      <p className="text-xs text-slate-500">or click to browse from your device</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Download Box (4 cols) */}
              <div className="md:col-span-4 bg-amber-50/80 p-5 rounded-2xl border border-amber-200 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider bg-amber-200 px-2 py-0.5 rounded-md inline-block">
                    Standard Excel Format
                  </span>
                  <h4 className="font-extrabold text-amber-950 text-sm mt-1">
                    Need the Excel Template?
                  </h4>
                  <p className="text-xs text-amber-800/90 mt-0.5">
                    Download our formatted sample sheet with pre-configured headers for error-free importing.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer w-full"
                >
                  <Download className="w-4 h-4" />
                  Download Sample Template (.xlsx)
                </button>
              </div>
            </div>
          ) : (
            /* Success Feedback Banner */
            <div className="bg-emerald-50 border border-emerald-300 p-8 rounded-3xl text-center space-y-3 my-4 animate-scale-in">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="text-2xl font-black text-slate-900">
                Successfully Imported {importSuccessCount} Students!
              </h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                All valid student records, route assignments, RFID IDs, and fee balances have been merged into the Wisdom School Transport Roster.
              </p>
            </div>
          )}

          {/* Parsed Data Preview & Validation Section */}
          {parsedRecords.length > 0 && importSuccessCount === null && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              {/* Summary KPIs & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-extrabold text-slate-900 mr-2">Parsed Summary:</span>
                  <span className="bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg">
                    Total: {parsedRecords.length}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Valid: {validCount}
                  </span>
                  {warningCount > 0 && (
                    <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Warnings: {warningCount}
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Invalid: {invalidCount}
                    </span>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  {(["all", "valid", "warning", "invalid"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setImportFilter(f)}
                      className={`px-2.5 py-1 rounded-lg capitalize transition cursor-pointer ${
                        importFilter === f
                          ? "bg-slate-900 text-white font-black"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search parsed records by student name, roll number, stop, grade..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-[340px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 text-[11px] uppercase font-black text-slate-700">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCount === validCount && validCount > 0}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Parent Details</th>
                      <th className="p-3">Pickup Stop & Dist</th>
                      <th className="p-3">Assigned Route / Van</th>
                      <th className="p-3 text-right">Transport Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                          No records match the current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r) => (
                        <tr
                          key={r.id}
                          className={`hover:bg-slate-50 transition ${
                            !r.isValid ? "bg-rose-50/50" : r.isSelected ? "bg-emerald-50/30" : ""
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              disabled={!r.isValid}
                              checked={r.isSelected}
                              onChange={() => toggleSelectRecord(r.id)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-30"
                            />
                          </td>

                          <td className="p-3">
                            {!r.isValid ? (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Invalid
                              </span>
                            ) : r.warnings.length > 0 ? (
                              <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 w-fit" title={r.warnings.join(", ")}>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Validated
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Ready
                              </span>
                            )}
                          </td>

                          <td className="p-3 font-mono font-bold text-slate-700">{r.rollNumber}</td>

                          <td className="p-3">
                            <strong className="text-slate-900 font-bold block">{r.name || "—"}</strong>
                            {r.errors.length > 0 && (
                              <span className="text-[10px] text-rose-600 font-bold block">{r.errors.join(", ")}</span>
                            )}
                          </td>

                          <td className="p-3">
                            <span className="bg-slate-200 text-slate-900 font-extrabold text-[10px] px-2 py-0.5 rounded">
                              {r.grade}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="text-slate-900 font-bold">{r.parentName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">📱 {r.parentPhone}</div>
                          </td>

                          <td className="p-3">
                            <div className="text-slate-900 font-bold">{r.pickupStopName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">📍 {r.distanceKm} km</div>
                          </td>

                          <td className="p-3">
                            <span className="bg-blue-50 text-blue-900 font-bold text-[11px] px-2 py-1 rounded border border-blue-200 block truncate max-w-[180px]">
                              🚌 {r.assignedRouteName}
                            </span>
                          </td>

                          <td className="p-3 text-right font-mono font-black text-slate-900">
                            ₹{r.transportFeePerMonth.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {parsedRecords.length > 0 && importSuccessCount === null && (
              <span>
                Selected: <strong className="text-slate-900">{selectedCount}</strong> / {validCount} valid students ready for import.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>

            {parsedRecords.length > 0 && importSuccessCount === null && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={selectedCount === 0}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black px-6 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Import {selectedCount} Selected Students
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
