/**
 * Print Utility Helper
 * Provides bulletproof printing across web browsers, pop-up blockers, and iframe sandboxes.
 */

export function printFormattedContent(title: string, htmlContent: string) {
  // Method 1: Try opening a clean popup window designed for printing
  try {
    const printWindow = window.open("", "_blank", "width=850,height=1000,scrollbars=yes,resizable=yes");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body {
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 24px;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              @media print {
                body { padding: 0; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div className="no-print" style="margin-bottom: 20px; text-align: right;">
              <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; font-size: 14px;">
                🖨️ Click Here to Print / Save as PDF
              </button>
            </div>
            ${htmlContent}
            <script>
              window.addEventListener('load', function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 400);
              });
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }
  } catch (err) {
    console.warn("Pop-up window blocked by browser, falling back to hidden iframe print:", err);
  }

  // Method 2: Hidden IFrame printing inside current document
  try {
    let iframe = document.getElementById("wisdom-print-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "wisdom-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0px";
      iframe.style.height = "0px";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body {
                background: #ffffff !important;
                color: #0f172a !important;
                padding: 16px;
                font-family: system-ui, -apple-system, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 500);
      return;
    }
  } catch (e) {
    console.warn("Iframe print fallback error:", e);
  }

  // Method 3: Standard window.print()
  window.focus();
  window.print();
}

/**
 * Direct print of an HTML element by ref or element ID
 */
export function printElementById(elementId: string, title = "School Transport Document") {
  const elem = document.getElementById(elementId);
  if (!elem) {
    window.focus();
    window.print();
    return;
  }
  printFormattedContent(title, elem.innerHTML);
}
