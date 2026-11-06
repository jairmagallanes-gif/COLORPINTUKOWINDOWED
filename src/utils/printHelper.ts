/**
 * COLORLINK PINTUCO® - Print & PDF Helper
 * Ensures reliable printing across browsers, sandboxed iframes, and multi-page layouts.
 */

export interface PrintOptions {
  documentTitle?: string;
  fallbackFilename?: string;
  onSuccess?: () => void;
  onError?: (err: any) => void;
}

/**
 * Extracts and composes a complete HTML document from a DOM element,
 * embedding current stylesheets, fonts, and high-fidelity print CSS.
 */
export function generatePrintableHtml(
  element: HTMLElement,
  title: string = 'Documento Oficial Pintuco ColorLink'
): string {
  // Gather styles from document
  let styleTags = '';
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
    styleTags += node.outerHTML + '\n';
  });

  const customPrintCss = `
    <style>
      @page {
        size: A4 portrait;
        margin: 10mm 12mm;
      }
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box !important;
      }
      html, body {
        background-color: #ffffff !important;
        color: #0f172a !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        min-height: 100% !important;
      }
      .print\\:hidden, .no-print, button:not(.printable-element) {
        display: none !important;
      }
      .pintuco-print-root {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 16px !important;
        border: none !important;
        box-shadow: none !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        page-break-inside: auto !important;
      }
      tr {
        page-break-inside: avoid !important;
        page-break-after: auto !important;
      }
      img {
        max-width: 100% !important;
        height: auto !important;
      }
      /* Ensure colors, borders and badges stay vibrant */
      .bg-slate-900, .bg-indigo-950, .bg-\\[\\#2E3192\\], .bg-blue-900 {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    </style>
  `;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  ${styleTags}
  ${customPrintCss}
</head>
<body class="bg-white text-slate-900">
  <div class="pintuco-print-root">
    ${element.outerHTML}
  </div>
</body>
</html>`;
}

/**
 * Universal print function that works seamlessly both in standard browser tabs
 * and inside sandboxed iframes.
 */
export function printElement(
  elementOrId: HTMLElement | string,
  options: PrintOptions = {}
): boolean {
  const element = typeof elementOrId === 'string' 
    ? document.getElementById(elementOrId) 
    : elementOrId;

  if (!element) {
    console.warn(`Print target element not found: ${elementOrId}`);
    try {
      window.print();
      return true;
    } catch {
      return false;
    }
  }

  const title = options.documentTitle || 'Documento Pintuco ColorLink';

  // Strategy 1: Hidden clean iframe printing (isolates document from main page UI)
  try {
    const hiddenIframe = document.createElement('iframe');
    hiddenIframe.style.position = 'fixed';
    hiddenIframe.style.right = '0';
    hiddenIframe.style.bottom = '0';
    hiddenIframe.style.width = '0';
    hiddenIframe.style.height = '0';
    hiddenIframe.style.border = '0';
    hiddenIframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(hiddenIframe);

    const frameDoc = hiddenIframe.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(generatePrintableHtml(element, title));
      frameDoc.close();

      setTimeout(() => {
        try {
          hiddenIframe.contentWindow?.focus();
          hiddenIframe.contentWindow?.print();
          if (options.onSuccess) options.onSuccess();
        } catch (iframePrintErr) {
          console.warn('Iframe print failed (likely sandboxed without allow-modals), falling back:', iframePrintErr);
          fallbackToStandardPrint(element, title, options);
        } finally {
          setTimeout(() => {
            if (document.body.contains(hiddenIframe)) {
              document.body.removeChild(hiddenIframe);
            }
          }, 3000);
        }
      }, 300);

      return true;
    }
  } catch (err) {
    console.warn('Iframe creation failed, trying standard fallback:', err);
  }

  // Strategy 2: Direct standard print with targeted CSS visibility
  return fallbackToStandardPrint(element, title, options);
}

function fallbackToStandardPrint(
  element: HTMLElement,
  title: string,
  options: PrintOptions
): boolean {
  try {
    // Add temporary print isolation classes
    document.body.classList.add('is-pintuco-printing');
    element.classList.add('pintuco-active-print-target');
    const oldTitle = document.title;
    document.title = title;

    window.print();

    document.title = oldTitle;
    setTimeout(() => {
      document.body.classList.remove('is-pintuco-printing');
      element.classList.remove('pintuco-active-print-target');
      if (options.onSuccess) options.onSuccess();
    }, 1000);

    return true;
  } catch (err) {
    console.error('window.print() error:', err);
    if (options.onError) options.onError(err);
    // If window.print fails due to iframe sandbox, open clean standalone tab
    openInNewTabForPrint(element, title);
    return false;
  }
}

/**
 * Opens the document in a new standalone tab where browser security will
 * never restrict printing, and triggers print automatically.
 */
export function openInNewTabForPrint(
  elementOrId: HTMLElement | string,
  title: string = 'Documento Pintuco'
): void {
  const element = typeof elementOrId === 'string' 
    ? document.getElementById(elementOrId) 
    : elementOrId;

  if (!element) return;

  const htmlContent = generatePrintableHtml(element, title) + `
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.focus();
          window.print();
        }, 500);
      };
    </script>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  const newWindow = window.open(blobUrl, '_blank');
  if (!newWindow) {
    // If popup blocker intervened, trigger direct download of the print-ready HTML
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  }
}
