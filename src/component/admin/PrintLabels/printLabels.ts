const STYLE_ID = "dynamic-label-print-style";

export type PrintRotation = 0 | 90 | 180 | 270;

/**
 * Prints only the element with class "print-label-sheet", sized to the
 * given physical label dimensions. Works regardless of what admin layout
 * chrome (sidebar/header) is currently on screen.
 *
 * Some label printer drivers put the paper feed axis where the browser
 * expects the print-head axis (or vice versa), so output can come out
 * rotated 90°/270° no matter what @page size is requested. `rotationDeg`
 * compensates for that at the CSS level.
 */
export function printLabelSheet(
  widthMm: number,
  heightMm: number,
  rotationDeg: PrintRotation = 0,
) {
  let styleTag = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = STYLE_ID;
    document.head.appendChild(styleTag);
  }

  const swapped = rotationDeg === 90 || rotationDeg === 270;
  const pageWidth = swapped ? heightMm : widthMm;
  const pageHeight = swapped ? widthMm : heightMm;

  styleTag.innerHTML = `
    @media print {
      body * { visibility: hidden; }
      .print-label-sheet, .print-label-sheet * { visibility: visible; }

      .print-label-sheet {
        display: block !important;
        position: static !important;   /* was absolute + centered transform */
        margin: 0 !important;
        top: auto !important;
        left: auto !important;
        transform: none !important;
      }
      .print-label-sheet > div {
        display: block !important;
      }

      .print-label-sheet .label {
        margin: 0 auto !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        break-after: page !important;
        page-break-after: always !important;
        transform: rotate(${rotationDeg}deg) !important;  /* per-label now */
        transform-origin: center center !important;
      }
      .print-label-sheet .label:last-child {
        break-after: auto !important;
        page-break-after: auto !important;
      }

      @page { size: ${pageWidth}mm ${pageHeight}mm; margin: 0; }
    }
  `;

  const cleanup = () => {
    styleTag?.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  window.print();
}
