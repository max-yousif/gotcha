import QRCode from 'qrcode';

/** QR-code als SVG-pad (één eenheid per module) met een stille zone van 4 modules rondom. */
export function qrPath(text: string): { size: number; path: string } {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const quiet = 4;
  let path = '';
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (qr.modules.get(row, col)) path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
    }
  }
  return { size: n + 2 * quiet, path };
}
