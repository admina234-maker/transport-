import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Edit2,
  CheckCircle2,
  Bus,
  Users,
  QrCode,
  Award,
  Save,
  X,
  Copy,
  Check,
  Download,
  Printer,
  ExternalLink,
  IndianRupee,
  Sparkles,
  CreditCard,
  Share2
} from "lucide-react";
import { SchoolInfo, Student, Vehicle } from "../types";
import { StudentQrPassModal } from "./StudentQrPassModal";
// @ts-ignore
import schoolUpiPosterImg from "../assets/images/school_upi_qr_poster_1784894046728.jpg";

interface SchoolProfileProps {
  schoolInfo: SchoolInfo;
  onUpdateSchoolInfo: (updated: SchoolInfo) => void;
  students?: Student[];
  vehicles?: Vehicle[];
}

export const SchoolProfile: React.FC<SchoolProfileProps> = ({
  schoolInfo,
  onUpdateSchoolInfo,
  students = [],
  vehicles = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SchoolInfo>(schoolInfo);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Student Payment Portal QR Modal State
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<Student | null>(null);

  // UPI QR Code State & Handlers
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrAmount, setQrAmount] = useState<number>(3500);
  const [presetType, setPresetType] = useState<"term" | "monthly" | "fullYear" | "custom">("term");
  const qrRef = useRef<HTMLDivElement>(null);

  // NPCI standard UPI URI
  const noteText = `${schoolInfo.name} Parent Fee Deposit`;
  const upiUri = `upi://pay?pa=${encodeURIComponent(
    schoolInfo.upiId
  )}&pn=${encodeURIComponent(
    schoolInfo.upiName
  )}&am=${qrAmount}&cu=INR&tn=${encodeURIComponent(noteText)}`;

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(schoolInfo.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleDownloadQrPng = () => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 500, 500);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${schoolInfo.name.replace(/\s+/g, "_")}_UPI_Payment_QR.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintQrPoster = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${schoolInfo.name} - Official UPI Fee Payment Poster</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background: #fff; color: #0f172a; }
            .poster { border: 8px solid #0f172a; border-radius: 24px; padding: 30px; max-width: 500px; margin: 0 auto; background: #fafafa; }
            .title { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
            .motto { font-size: 13px; font-weight: 700; color: #d97706; text-transform: uppercase; margin-bottom: 20px; }
            .vpa-box { background: #0f172a; color: #10b981; padding: 12px; border-radius: 12px; font-family: monospace; font-size: 18px; font-weight: bold; margin: 20px 0; }
            .foot { font-size: 11px; color: #64748b; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="poster">
            <div style="font-size: 10px; font-weight: 900; background: #f59e0b; color: #000; display: inline-block; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">Official School Fee Standee</div>
            <div class="title">${schoolInfo.name}</div>
            <div class="motto">"${schoolInfo.motto}"</div>
            <p>Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)</p>
            <div class="vpa-box">${schoolInfo.upiId}</div>
            <p><strong>Beneficiary:</strong> ${schoolInfo.upiName}</p>
            <p><strong>Configured Amount:</strong> ₹${qrAmount.toLocaleString("en-IN")}</p>
            <div class="foot">Please enter Student Name & Admission Roll No in payment note.</div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchoolInfo(formData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="bg-yellow-400 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider">
            Official Institution Settings
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1">School Profile & Transport Admin</h2>
          <p className="text-xs text-slate-400">
            Manage school credentials, contact officer numbers, location address, and UPI payment details.
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => {
              setFormData(schoolInfo);
              setIsEditing(true);
            }}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit School Profile
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 border border-slate-700"
          >
            <X className="w-4 h-4" />
            Cancel Editing
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl text-emerald-900 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          School Profile and Transport Contact credentials updated successfully across the entire system!
        </div>
      )}

      {isEditing ? (
        /* EDIT FORM MODE */
        <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-6">
          <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Edit Institution Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">School Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">School Motto</label>
              <input
                type="text"
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-bold text-slate-700">Campus Location / Address</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Chief Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Contact Designation / Title</label>
              <input
                type="text"
                value={formData.contactTitle}
                onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Official Contact Phone (10-digits)</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Official Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">UPI Beneficiary Name</label>
              <input
                type="text"
                value={formData.upiName}
                onChange={(e) => setFormData({ ...formData, upiName: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">UPI VPA ID</label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Total Students Count</label>
              <input
                type="number"
                value={formData.totalStudents}
                onChange={(e) => setFormData({ ...formData, totalStudents: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Transport Fleet Count</label>
              <input
                type="number"
                value={formData.transportFleetCount}
                onChange={(e) => setFormData({ ...formData, transportFleetCount: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Profile Changes
            </button>
          </div>
        </form>
      ) : (
        /* READ-ONLY VIEW MODE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main School Badge Card */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-xl border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-200 p-1 shadow-lg flex items-center justify-center flex-shrink-0">
                <div className="w-full h-full bg-blue-950 rounded-2xl flex flex-col items-center justify-center text-center p-1 border border-yellow-400/50">
                  <Bus className="w-8 h-8 text-yellow-400" />
                  <span className="text-[9px] font-black tracking-widest text-white uppercase mt-0.5">WISDOM</span>
                </div>
              </div>

              <div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Established Year {schoolInfo.establishedYear}
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{schoolInfo.name}</h3>
                <p className="text-xs font-bold text-amber-600 tracking-wider uppercase mt-0.5">
                  "{schoolInfo.motto}"
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {schoolInfo.location}
                </p>
              </div>
            </div>

            {/* Administrator & Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 border border-slate-800 shadow">
                <span className="text-amber-400 text-[10px] uppercase font-bold tracking-wider block">
                  Chief Transport Administrator
                </span>
                <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-yellow-400" />
                  {schoolInfo.contactPerson}
                </h4>
                <p className="text-slate-300 text-xs font-medium">{schoolInfo.contactTitle}</p>
                <div className="pt-2 flex items-center gap-2">
                  <a
                    href={`tel:${schoolInfo.contactPhone}`}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call {schoolInfo.contactPhone}
                  </a>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl space-y-2 text-slate-900">
                <span className="text-blue-800 text-[10px] uppercase font-bold tracking-wider block">
                  Official Communication Channel
                </span>
                <p className="font-extrabold text-sm flex items-center gap-2 text-blue-950">
                  <Mail className="w-4 h-4 text-blue-600" />
                  {schoolInfo.contactEmail}
                </p>
                <p className="text-slate-600 text-xs">
                  Direct parent inquiries, transport fee clearance, and school admission logs.
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Enrolled Students</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{schoolInfo.totalStudents}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Transport Fleet Count</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{schoolInfo.transportFleetCount} Vans/Buses</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Location Code</span>
                <span className="text-sm font-extrabold text-emerald-800 block mt-1">Essur (ஈசூர் - 603310)</span>
              </div>
            </div>

            {/* Wisdom Nursery & Primary School Live Campus Map Embed */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl space-y-0">
              <div className="p-4 bg-slate-950 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-400 animate-bounce" />
                  <div>
                    <h4 className="font-extrabold text-white text-sm sm:text-base">
                      Wisdom Nursery & Primary School Campus Google Map
                    </h4>
                    <p className="text-xs text-slate-400">
                      Isur Chunambedu Road, Essur - 603310 (ஈசூர் - 603310) | GPS: 12.3036° N, 79.8615° E
                    </p>
                  </div>
                </div>
                <a
                  href="https://maps.google.com/?q=12.3036078,79.8615042"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Get Directions
                </a>
              </div>
              <div className="w-full h-80 relative bg-slate-800">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3898.180805162009!2d79.8615042!3d12.303607800000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a53138de836231f%3A0xffcfb08b54f87691!2sWisdom%20nursery%20and%20primary%20school!5e0!3m2!1sen!2sin!4v1785154735752!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="Wisdom Nursery and Primary School Campus Location"
                />
              </div>
            </div>
          </div>

          {/* UPI Billing Credentials Preview Box */}
          <div className="lg:col-span-4 bg-slate-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="bg-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  UPI Payment Setup
                </span>
                <QrCode className="w-5 h-5 text-yellow-400" />
              </div>

              <h4 className="font-black text-lg text-white">Fee Deposit Credentials</h4>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">UPI Beneficiary Name</span>
                  <span className="text-sm font-extrabold text-yellow-400">{schoolInfo.upiName}</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Official UPI VPA ID</span>
                  <span className="text-sm font-mono font-bold text-emerald-400 select-all block mt-0.5">
                    {schoolInfo.upiId}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
              <p>
                <strong>Auto Fee Receipts:</strong> All UPI payments submitted by parents with UTR reference numbers are verified against this beneficiary profile.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Student Specific Payment Portal QR Code Generator Section */}
      {students && students.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
                <QrCode className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="bg-yellow-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded font-mono">
                  Student Specific QR Pass Generator
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  Printable Student Payment Portal QR Passes
                </h3>
                <p className="text-xs text-slate-400">
                  Generate student-specific payment portal links & UPI QR passes for individual students or bulk class sheets.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedStudentForQr(students[0])}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
            >
              <QrCode className="w-4 h-4 text-slate-950" />
              Open QR Pass Generator
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {students.slice(0, 3).map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedStudentForQr(s)}
                className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-700/80 hover:border-amber-400/80 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div>
                  <span className="text-[10px] text-amber-400 font-extrabold font-mono uppercase block">{s.rollNumber}</span>
                  <strong className="text-sm text-white font-extrabold block group-hover:text-amber-300 transition">{s.name}</strong>
                  <span className="text-slate-400 text-[11px] font-medium">{s.grade} | Parent: {s.parentName}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-slate-950 transition shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render Student QR Pass Modal */}
      {selectedStudentForQr && (
        <StudentQrPassModal
          student={selectedStudentForQr}
          students={students}
          vehicles={vehicles}
          onClose={() => setSelectedStudentForQr(null)}
          onSelectStudent={(s) => setSelectedStudentForQr(s)}
        />
      )}
    </div>
  );
};
