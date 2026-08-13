import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Copy,
  Check,
  Download,
  Printer,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Building2,
  IndianRupee
} from "lucide-react";
import { SCHOOL_INFO } from "../data/mockData";
import { printFormattedContent } from "../utils/printHelper";

interface UpiPaymentQrCodeProps {
  studentName?: string;
  studentRoll?: string;
  grade?: string;
  amount: number;
  feeType?: string;
  upiId?: string;
  upiName?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const UpiPaymentQrCode: React.FC<UpiPaymentQrCodeProps> = ({
  studentName = "Wisdom Student",
  studentRoll,
  grade,
  amount: initialAmount,
  feeType = "School & Transport Term Fee",
  upiId = SCHOOL_INFO.upiId,
  upiName = SCHOOL_INFO.upiName,
  onClose,
  isModal = true,
}) => {
  const [customAmount, setCustomAmount] = useState<number>(initialAmount);
  const [copied, setCopied] = useState<boolean>(false);
  const [amountPreset, setAmountPreset] = useState<"term" | "monthly" | "custom">("term");
  const cardRef = useRef<HTMLDivElement>(null);

  // Build standard UPI Deep Link URL specification (RFC/NPCI compliant)
  // Format: upi://pay?pa=rsaravanan102002-1@okhdfcbank&pn=R%20Saravanan&am=12800&cu=INR&tn=Fee%20Payment
  const noteText = studentRoll
    ? `Wisdom Fee ${studentName} (${studentRoll})`
    : `Wisdom Fee ${studentName}`;

  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    upiName
  )}&am=${customAmount}&cu=INR&tn=${encodeURIComponent(noteText)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svgElement = cardRef.current?.querySelector("svg");
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
        downloadLink.download = `UPI_QR_${studentName.replace(/\s+/g, "_")}_INR${customAmount}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const content = (
    <div className="bg-[#f0f4f9] rounded-3xl p-6 text-slate-900 border border-slate-200/80 shadow-2xl max-w-md w-full space-y-5 animate-in fade-in zoom-in-95 duration-200">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-900 text-amber-400 rounded-xl font-bold flex items-center justify-center shadow-sm">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
              Instant UPI QR Payment
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Wisdom Nursery & Primary School
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition cursor-pointer"
            title="Close QR Modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Student & Fee Summary Tag */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">
            Payer Ward Details
          </span>
          <strong className="text-slate-900 font-bold text-sm block">{studentName}</strong>
          {grade && <span className="text-slate-500 text-[11px]">Grade: {grade}</span>}
          {studentRoll && <span className="text-slate-500 text-[11px] ml-2">Roll: {studentRoll}</span>}
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">
            Payment Amount
          </span>
          <span className="text-xl font-black font-mono text-emerald-700">
            ₹{customAmount.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full block mt-0.5">
            Auto-Encoded in QR
          </span>
        </div>
      </div>

      {/* Amount Selector Presets */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => {
            setAmountPreset("term");
            setCustomAmount(initialAmount);
          }}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition border cursor-pointer text-center ${
            amountPreset === "term"
              ? "bg-blue-900 text-white border-blue-900 shadow"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          Full Term (₹{initialAmount.toLocaleString("en-IN")})
        </button>

        <button
          onClick={() => {
            setAmountPreset("monthly");
            setCustomAmount(Math.round(initialAmount / 4));
          }}
          className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition border cursor-pointer text-center ${
            amountPreset === "monthly"
              ? "bg-blue-900 text-white border-blue-900 shadow"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          1 Month (₹{Math.round(initialAmount / 4).toLocaleString("en-IN")})
        </button>
      </div>

      {/* MATCHING REFERENCE UI: UPI QR CODE CARD CONTAINER */}
      <div className="flex flex-col items-center justify-center space-y-4 py-2">
        {/* Beneficiary Header: Initial Avatar + Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#37474f] text-white font-extrabold flex items-center justify-center text-lg shadow">
            {upiName.charAt(0)}
          </div>
          <span className="text-2xl font-semibold text-[#2c3e50] tracking-tight">
            {upiName}
          </span>
        </div>

        {/* White Rounded Box containing QR Code and UPI ID */}
        <div
          ref={cardRef}
          className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xl flex flex-col items-center space-y-4 w-full max-w-[320px]"
        >
          {/* QR Code with High Precision and Google Pay / UPI Center Overlay */}
          <div className="relative p-2 bg-white rounded-2xl flex items-center justify-center shadow-inner">
            <QRCodeSVG
              value={upiUri}
              size={210}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_%28GPay%29_Logo_%282018-2020%29.svg",
                x: undefined,
                y: undefined,
                height: 38,
                width: 38,
                excavate: true,
              }}
            />
          </div>

          {/* UPI ID Text display */}
          <div className="text-center pt-1 border-t border-slate-100 w-full">
            <p className="text-xs sm:text-sm font-mono text-slate-700 font-medium tracking-tight">
              UPI ID: <span className="font-bold text-slate-900 select-all">{upiId}</span>
            </p>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-slate-600 text-sm font-normal text-center pt-1">
          Scan to pay with any UPI app
        </p>
      </div>

      {/* Instant Action Bar */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <a
            href={upiUri}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-center flex items-center justify-center gap-1.5 transition shadow"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in UPI App
          </a>

          <button
            onClick={handleCopyUpi}
            className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-center flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            {copied ? "Copied ID!" : "Copy UPI ID"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownloadQR}
            className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            Download PNG
          </button>

          <button
            onClick={() => {
              const qrElem = cardRef.current;
              if (qrElem) {
                printFormattedContent(
                  `UPI_QR_Slip_${studentName.replace(/\s+/g, "_")}`,
                  `<div style="max-width: 380px; margin: 0 auto; text-align: center; border: 2px solid #0f172a; padding: 20px; border-radius: 16px;">
                    <h2 style="margin: 0 0 5px 0; color: #1e3a8a;">WISDOM NURSERY & PRIMARY SCHOOL</h2>
                    <p style="margin: 0 0 15px 0; font-size: 12px; color: #475569;">Fee Payment UPI QR Code</p>
                    <p style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">Student: ${studentName} ${studentRoll ? `(${studentRoll})` : ""}</p>
                    <p style="font-size: 18px; font-weight: bold; color: #047857; margin-bottom: 15px;">Amount: ₹${customAmount.toLocaleString("en-IN")}</p>
                    ${qrElem.innerHTML}
                    <p style="margin-top: 15px; font-size: 11px; color: #64748b;">Scan with Google Pay, PhonePe, Paytm, or BHIM</p>
                  </div>`
                );
              } else {
                window.focus();
                window.print();
              }
            }}
            className="py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-yellow-300" />
            Print QR Slip
          </button>
        </div>
      </div>

      {/* Bottom Safety Shield Badge */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Direct HDFC Bank settlement to Wisdom Primary Transport Account</span>
      </div>
    </div>
  );

  if (!isModal) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      {content}
    </div>
  );
};
