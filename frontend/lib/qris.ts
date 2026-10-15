import QRCode from 'qrcode';
import { formatRupiah } from './api';

export const QRIS_MERCHANT_NAME = 'KIMA FASHION AND ACCESSORIES';
export const QRIS_NMID = 'ID1026515373078';

// Gambar QR dari payload QRIS dinamis yang dibuat backend
export function qrisImage(payload: string) {
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 2, width: 640 });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Kartu QRIS siap simpan untuk pembeli di HP: nama merchant, nominal, QR, dan kode pesanan
export async function qrisCard(qrDataUrl: string, amount: number, orderCode: string) {
  const width = 720;
  const height = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#f78fb8';
  ctx.fillRect(0, 0, width, 16);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#3d3551';
  ctx.font = 'bold 34px Arial, sans-serif';
  ctx.fillText('QRIS', width / 2, 80);
  ctx.font = 'bold 30px Arial, sans-serif';
  ctx.fillText(QRIS_MERCHANT_NAME, width / 2, 130);
  ctx.font = '22px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`NMID: ${QRIS_NMID}`, width / 2, 168);

  ctx.drawImage(await loadImage(qrDataUrl), 80, 200, 560, 560);

  ctx.fillStyle = '#d94f8a';
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.fillText(formatRupiah(amount), width / 2, 840);
  ctx.fillStyle = '#64748b';
  ctx.font = '24px Arial, sans-serif';
  ctx.fillText(`Pesanan ${orderCode}`, width / 2, 890);
  ctx.fillText('Nominal sudah otomatis terisi saat di-scan', width / 2, 930);

  return canvas.toDataURL('image/png');
}
