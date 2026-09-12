/**
 * Survey PDF generation - web port.
 *
 * buildSurveyPdfHtml() below is the mobile implementation copied verbatim, so the
 * document layout, fields and styling are unchanged. Two platform pieces differ:
 *
 *  - Logo: loaded from the root app's bundled Hapyjoimage.png and encoded with the
 *    canvas-based imageManipulator, replacing expo-asset + expo-image-manipulator.
 *
 *  - Output: expo-print's printToFileAsync() rasterised the HTML into a PDF file.
 *    No browser API writes a PDF to disk, so printSurveyToPdf() renders the same
 *    HTML in a hidden iframe and opens the browser's print dialog, where the user
 *    saves it as PDF (or prints it). The document is identical; the user chooses
 *    the destination. lib/sharing treats the returned sentinel as already
 *    delivered, so the existing share-after-generate flow needs no changes.
 */

import { manipulateAsync, SaveFormat } from '@/field-ops/lib/imageManipulator';
import logoUrl from '@/assets/Hapyjoimage.png';

/**
 * Returned by printSurveyToPdf: the document has already been handed to the user
 * through the print dialog, so lib/sharing.shareAsync() treats this as a no-op.
 */
export const PRINT_COMPLETED_URI = 'hapyjo-print://completed';

let cachedLogoBase64: string | null = null;

async function getLogoBase64(): Promise<string> {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    // Resize to 2x display size (360px) so the logo stays sharp when shown at 180px
    // in the PDF. PNG with compress 1 keeps edges crisp (no blur).
    const manipulated = await manipulateAsync(
      logoUrl,
      [{ resize: { width: 360 } }],
      {
        compress: 1,
        format: SaveFormat.PNG,
        base64: true,
      }
    );

    const base64 = manipulated.base64 ?? '';
    if (!base64) return '';

    const approxBytes = (base64.length * 3) / 4;
    const MAX_BYTES = 280 * 1024;
    if (approxBytes > MAX_BYTES) return '';

    cachedLogoBase64 = base64;
    return base64;
  } catch {
    return '';
  }
}

export interface SurveyPdfData {
  survey: {
    id: string;
    siteId: string;
    surveyDate: string;
    volumeM3: number;
    status: string;
    surveyorId: string;
    createdAt: string;
    approvedById?: string | null;
    approvedAt?: string | null;
  };
  siteName: string;
  surveyorName: string;
  approvedByName?: string | null;
  /** Optional: from create flow (before/after counts, surface, triangles, etc.) */
  calculation?: {
    beforePoints: number;
    afterPoints: number;
    surfaceUtile?: number;
    triangleCount?: number;
    totalFill?: number;
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNumber(value: number): string {
  try {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return value.toFixed(2);
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export async function buildSurveyPdfHtml(data: SurveyPdfData): Promise<string> {
  const logoBase64 = await getLogoBase64();
  const logoImg = logoBase64
    ? `<img src="data:image/png;base64,${logoBase64}" width="180" height="56" style="display:block;object-fit:contain" alt="HAPYJO LTD" />`
    : '<h2 style="margin:0;font-size:20px;font-weight:700;color:#2563eb;">HAPYJO LTD</h2>';

  const s = data.survey;
  const createdAtFormatted = formatDateTime(s.createdAt);
  const approvedAtFormatted = s.approvedAt ? formatDateTime(s.approvedAt) : '—';
  const generatedAt = formatDateTime(new Date().toISOString());

  const tableStyle = 'width:100%;border-collapse:collapse;margin-top:8px;';
  const thStyle = 'text-align:left;padding:8px 12px;background:#f1f5f9;font-weight:600;color:#475569;border:1px solid #e2e8f0;';
  const tdStyle = 'padding:8px 12px;border:1px solid #e2e8f0;color:#334155;';

  const calcRows =
    data.calculation != null
      ? `
    <tr><td style="${tdStyle}">Before points</td><td style="${tdStyle}">${data.calculation.beforePoints}</td></tr>
    <tr><td style="${tdStyle}">After points</td><td style="${tdStyle}">${data.calculation.afterPoints}</td></tr>
    ${data.calculation.surfaceUtile != null ? `<tr><td style="${tdStyle}">Surface utile (m²)</td><td style="${tdStyle}">${formatNumber(data.calculation.surfaceUtile)}</td></tr>` : ''}
    ${data.calculation.triangleCount != null ? `<tr><td style="${tdStyle}">Triangles</td><td style="${tdStyle}">${data.calculation.triangleCount}</td></tr>` : ''}
    ${(data.calculation.totalFill ?? 0) > 0 ? `<tr><td style="${tdStyle}">Fill volume (m³)</td><td style="${tdStyle}">${formatNumber(data.calculation.totalFill!)}</td></tr>` : ''}
  `
      : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Earthwork Survey Report – HAPYJO LTD</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; font-size: 13px; color: #334155; padding: 24px 20px; margin: 0; background:#f8fafc; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #2563eb; }
    h1 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.04em; }
    h2 { font-size: 14px; font-weight: 600; color: #0f172a; margin: 18px 0 6px 0; }
    .meta { font-size: 10px; color: #64748b; }
    .section-label { font-size: 11px; font-weight: 600; color:#475569; text-transform: uppercase; letter-spacing: 0.06em; margin-top:16px; }
    .section { margin-bottom: 8px; }
    table { ${tableStyle} }
    th { ${thStyle} }
    td { ${tdStyle} }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; display:flex; justify-content:space-between; gap:12px; }
    .sign-row { display:flex; gap:32px; margin-top:18px; }
    .sign-block { flex:1; font-size:11px; color:#475569; }
    .sign-line { margin-top:24px; border-top:1px solid #cbd5f5; height:1px; }
  </style>
</head>
<body>
  <div class="header">
    <div>${logoImg}</div>
    <div style="text-align:right;">
      <div class="meta">EARTHWORK VOLUME SURVEY REPORT</div>
      <div class="meta">Generated: ${escapeHtml(generatedAt)}</div>
    </div>
  </div>

  <h1>Earthwork volume survey</h1>
  <div class="meta" style="margin-bottom:12px;">
    Site: <strong>${escapeHtml(data.siteName)}</strong> • Survey date: <strong>${escapeHtml(s.surveyDate)}</strong>
  </div>

  <div class="section">
    <div class="section-label">1. Project / site information</div>
    <table>
      <tr><th style="${thStyle}">Field</th><th style="${thStyle}">Value</th></tr>
      <tr><td style="${tdStyle}">Site name</td><td style="${tdStyle}">${escapeHtml(data.siteName)}</td></tr>
      <tr><td style="${tdStyle}">Survey date</td><td style="${tdStyle}">${escapeHtml(s.surveyDate)}</td></tr>
      <tr><td style="${tdStyle}">Surveyor</td><td style="${tdStyle}">${escapeHtml(data.surveyorName)}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-label">2. Survey & volume summary</div>
    <table>
    <tr><th style="${thStyle}">Field</th><th style="${thStyle}">Value</th></tr>
    <tr><td style="${tdStyle}">Survey date</td><td style="${tdStyle}">${escapeHtml(s.surveyDate)}</td></tr>
    <tr><td style="${tdStyle}">Calculated volume (m³)</td><td style="${tdStyle}"><strong>${formatNumber(s.volumeM3)}</strong></td></tr>
    <tr><td style="${tdStyle}">Status</td><td style="${tdStyle}">${escapeHtml(s.status)}</td></tr>
    <tr><td style="${tdStyle}">Surveyor</td><td style="${tdStyle}">${escapeHtml(data.surveyorName)}</td></tr>
    <tr><td style="${tdStyle}">Submitted at</td><td style="${tdStyle}">${escapeHtml(createdAtFormatted)}</td></tr>
    <tr><td style="${tdStyle}">Approved by</td><td style="${tdStyle}">${data.approvedByName ? escapeHtml(data.approvedByName) : '—'}</td></tr>
    <tr><td style="${tdStyle}">Approved at</td><td style="${tdStyle}">${escapeHtml(approvedAtFormatted)}</td></tr>
  </table>
  </div>

  ${
    calcRows
      ? `
  <div class="section">
    <div class="section-label">3. Calculation details</div>
    <table>
      <tr><th style="${thStyle}">Parameter</th><th style="${thStyle}">Value</th></tr>
      ${calcRows}
    </table>
  </div>`
      : ''
  }

  <div class="section">
    <div class="section-label">4. Sign-off</div>
    <div class="sign-row">
      <div class="sign-block">
        Surveyor: <strong>${escapeHtml(data.surveyorName)}</strong>
        <div class="sign-line"></div>
      </div>
      <div class="sign-block">
        Approved by: <strong>${data.approvedByName ? escapeHtml(data.approvedByName) : '________________'}</strong>
        <div class="sign-line"></div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>HAPYJO LTD – Civil engineering earthwork survey report.</span>
    <span>Generated: ${escapeHtml(generatedAt)}</span>
  </div>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Renders the survey document and opens the browser's print dialog so the user can
 * save it as a PDF. Resolves once printing has been initiated.
 *
 * An iframe is used (rather than a popup) so no pop-up blocker can intervene and
 * the current app state is untouched.
 */
export async function printSurveyToPdf(data: SurveyPdfData): Promise<string> {
  const html = await buildSurveyPdfHtml(data);

  // Professional, descriptive document title, e.g.
  // Hapyjo_SiteA_2025-03-15_Survey_ABC123 - browsers use it as the default
  // "Save as PDF" filename, matching the mobile file name.
  const safeSite = data.siteName
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const safeDate = data.survey.surveyDate.replace(/[^0-9-]/g, '');
  const shortId = data.survey.id.slice(0, 8);
  const fileNameParts = ['Hapyjo', safeSite || 'Site', safeDate || 'Survey', shortId || 'Report'];
  const fileName = fileNameParts.filter(Boolean).join('_');

  await printHtmlDocument(html, fileName);
  return PRINT_COMPLETED_URI;
}

/** Prints an HTML string via a hidden iframe, using `title` as the document name. */
function printHtmlDocument(html: string, title: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Printing is not available.'));
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    let settled = false;
    const cleanup = () => {
      // Remove only after the print dialog has been dismissed, or Safari cancels it.
      setTimeout(() => iframe.remove(), 1000);
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    iframe.onload = () => {
      try {
        const frameWindow = iframe.contentWindow;
        const frameDoc = iframe.contentDocument;
        if (!frameWindow || !frameDoc) {
          throw new Error('Could not prepare the document for printing.');
        }
        // The browser uses document.title as the default saved filename.
        frameDoc.title = title;
        frameWindow.focus();
        frameWindow.print();
        finish();
      } catch (e) {
        if (settled) return;
        settled = true;
        cleanup();
        reject(e instanceof Error ? e : new Error('Printing failed.'));
      }
    };

    document.body.appendChild(iframe);
    const frameDoc = iframe.contentDocument;
    if (!frameDoc) {
      iframe.remove();
      reject(new Error('Could not prepare the document for printing.'));
      return;
    }
    // srcdoc would also work, but write() gives a synchronous, same-origin document.
    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();
  });
}
