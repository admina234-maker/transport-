import React, { useRef, useState } from "react";
import { X, Printer, CheckCircle2, ShieldCheck, Bus, Download, Loader2, FileText, QrCode, Copy, Check, ExternalLink, Smartphone, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PaymentReceipt } from "../types";
import { printElementById, printFormattedContent } from "../utils/printHelper";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface ReceiptModalProps {
  receipt: PaymentReceipt | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  if (!receipt) return null;

  const upiId = receipt.upiId || "rsaravanan102002-1@okhdfcbank";
  const upiName = receipt.schoolName || "Wisdom Nursery & Primary School";
  const noteText = `Wisdom Fee ${receipt.studentName} (${receipt.receiptNumber})`;
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    upiName
  )}&am=${receipt.amountPaid}&cu=INR&tn=${encodeURIComponent(noteText)}`;

  const handlePrint = () => {
    if (printableRef.current) {
      printFormattedContent(
        `School_Receipt_${receipt.receiptNumber}_${receipt.studentName.replace(/\s+/g, "_")}`,
        printableRef.current.innerHTML
      );
    } else {
      printElementById("printable-receipt-card", `School_Receipt_${receipt.receiptNumber}`);
    }
  };

  const handleDownloadPdf = async () => {
    if (!printableRef.current || !receipt) return;
    setIsGeneratingPdf(true);
    try {
      const element = printableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, Math.min(imgHeight, pageHeight));

      const sanitizedName = receipt.studentName.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `Wisdom_School_Receipt_${receipt.receiptNumber}_${sanitizedName}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation error:", err);
      // Fallback to window print if canvas fails
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Print-only CSS rules for perfect PDF printing */}
      <style>{`
        @media print {
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print, header, footer, nav {
            display: none !important;
          }
          .fixed {
            position: static !important;
            background: none !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          #printable-receipt-card {
            visibility: visible !important;
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: 1px solid #000000 !important;
            background: #ffffff !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Verified School Fee Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-black transition shadow cursor-pointer disabled:opacity-60"
              title="Generate and download formatted PDF invoice document"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Download className="w-4 h-4 text-slate-950" />
              )}
              {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition shadow cursor-pointer"
              title="Print to PDF or hardcopy printer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt-card" ref={printableRef} className="p-8 space-y-6 print:p-0">
          {/* Official Header */}
          <div className="border-b-2 border-yellow-500 pb-5 text-center relative">
            <div className="flex items-center justify-between mb-2">
              <div className="w-16 h-16 rounded-full bg-blue-900 text-yellow-400 font-bold flex flex-col items-center justify-center text-center p-1 border-2 border-yellow-400 shadow">
                <Bus className="w-8 h-8" />
                <span className="text-[7px] font-black uppercase">WISDOM</span>
              </div>

              <div className="text-center flex-1 px-2">
                <h2 className="text-xl sm:text-2xl font-black text-blue-950 uppercase tracking-tight">
                  {receipt.schoolName}
                </h2>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mt-0.5">
                  "{receipt.motto}"
                </p>
                <p className="text-xs font-semibold text-slate-600">{receipt.address}</p>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                  Chief Transport Officer & Admin: <strong>{receipt.contactPerson}</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-md">
                  PAID & VERIFIED
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Details Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs sm:text-sm grid grid-cols-2 gap-3">
            <div>
              <p className="text-slate-500 text-xs uppercase font-medium">Receipt Number</p>
              <p className="font-mono font-bold text-slate-900 text-base">{receipt.receiptNumber}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-medium">Date & Time</p>
              <p className="font-semibold text-slate-800">{receipt.paymentDate}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-medium">Student Name & Roll No</p>
              <p className="font-bold text-blue-950 text-base">{receipt.studentName}</p>
              <p className="text-xs text-slate-600 font-mono">Roll: {receipt.studentId}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-medium">Class / Grade</p>
              <p className="font-semibold text-slate-800">{receipt.grade || "Nursery / Primary"}</p>
            </div>
          </div>

          {/* Itemized Invoice Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Fee Particulars</th>
                  <th className="py-2.5 px-4 text-center">Period</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    School Term Tuition Fee
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">Current Term</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{(receipt.tuitionFeePart || (receipt.amountPaid * 0.75)).toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    Van Transport Fee (Distance Based)
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">Monthly / Term</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{(receipt.transportFeePart || (receipt.amountPaid * 0.25)).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-blue-950 text-white font-bold text-sm sm:text-base border-t-2 border-yellow-500">
                <tr>
                  <td className="py-3 px-4" colSpan={2}>
                    Total Amount Received
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-yellow-400 text-lg">
                    ₹{receipt.amountPaid.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Dynamic UPI Payment Request QR Code Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left Info & App Badges */}
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Instant UPI Payment QR Request
                </div>

                <h4 className="text-base font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                  <QrCode className="w-4.5 h-4.5 text-amber-400" />
                  Scan to Pay ₹{receipt.amountPaid.toLocaleString("en-IN")} via Phone
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Scan this QR code using <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong>, or <strong>BHIM</strong> to transfer fees directly to the school account.
                </p>

                {/* UPI VPA & Copy Button */}
                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <div className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">VPA:</span>
                    <span className="text-xs font-mono font-bold text-amber-300">{upiId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(upiId);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Deep Link Button for Mobile */}
                  <a
                    href={upiUri}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Open UPI App ↗
                  </a>
                </div>

                {/* App Badges */}
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-1.5 text-[10px] font-bold text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">GPay</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">PhonePe</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Paytm</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">BHIM UPI</span>
                </div>
              </div>

              {/* Right QR Canvas */}
              <div className="bg-white p-3 rounded-2xl border-2 border-amber-400 shadow-xl flex flex-col items-center justify-center flex-shrink-0">
                <QRCodeSVG
                  value={upiUri}
                  size={110}
                  level="M"
                  includeMargin={true}
                  fgColor="#020617"
                  bgColor="#ffffff"
                />
                <span className="text-[9px] font-black uppercase text-slate-900 font-mono mt-1 tracking-wider">
                  ₹{receipt.amountPaid.toLocaleString("en-IN")} • SCAN TO PAY
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method & UTR */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-emerald-950 font-bold">Payment Verified via UPI</p>
                <p className="text-emerald-700 font-mono text-xs">
                  Bank UTR / Ref No: <strong className="text-slate-900">{receipt.utrNumber}</strong>
                </p>
                <p className="text-slate-600 text-[11px]">UPI Beneficiary ID: {receipt.upiId}</p>
              </div>
            </div>

            <div className="text-right border-t sm:border-t-0 sm:border-l border-emerald-200 pt-2 sm:pt-0 sm:pl-4">
              <p className="text-slate-500 text-[11px]">Authorized Signatory</p>
              <div className="font-serif italic font-bold text-blue-950 text-sm mt-1">
                R. Saravanan
              </div>
              <p className="text-[10px] text-slate-600 font-semibold">Mr. R SARAVANAN, Admin</p>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center text-[10px] text-slate-500 space-y-1 pt-2 border-t border-slate-200">
            <p>This is a computer-generated official receipt for Wisdom Nursery and Primary School, Essur.</p>
            <p>For any transport or billing queries, contact Mr. R SARAVANAN at +91 9176593129.</p>
          </div>
        </div>

        {/* Modal Bottom Action Footer Bar (Hidden on Print) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <p className="text-xs text-slate-500 font-medium">
            📄 Click <strong>Download PDF</strong> for an official invoice file or <strong>Print Receipt</strong> to print directly.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-60"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Download className="w-4 h-4 text-slate-950" />
              )}
              {isGeneratingPdf ? "Generating..." : "Download as PDF"}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
