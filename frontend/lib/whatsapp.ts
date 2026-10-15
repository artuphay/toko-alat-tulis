import { Order } from '../types';
import { formatRupiah } from './api';

// Ubah nomor pembeli (08xx, +62xx, 62xx) ke format internasional untuk wa.me
export function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('8')) return '62' + digits;
  return digits;
}

// Link wa.me gratis: membuka WhatsApp admin dengan pesan siap kirim ke pembeli
export function whatsAppLink(phone: string, message: string) {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
}

export function shippedMessage(order: Order, trackingNumber: string) {
  const items = order.items.map((it) => `• ${it.quantity}x ${it.productName}`).join('\n');
  return [
    `Halo ${order.recipientName} 👋`,
    '',
    `Pesanan Kima *${order.orderCode}* sudah kami kirim! 🎀`,
    '',
    `No. resi: *${trackingNumber}*`,
    '',
    'Isi paket:',
    items,
    `Total barang: ${formatRupiah(order.totalAmount)}`,
    '',
    'Ongkir dibayar langsung ke kurir saat paket diterima (COD ongkir).',
    '',
    'Terima kasih sudah belanja di Kima Little Collection 💖',
  ].join('\n');
}

export function paidMessage(order: Order) {
  return [
    `Halo ${order.recipientName} 👋`,
    '',
    `Pembayaran pesanan Kima *${order.orderCode}* sebesar ${formatRupiah(order.totalAmount)} sudah kami terima. 🎀`,
    'Pesanan sedang dikemas, nomor resi akan kami kabari setelah paket dikirim.',
    '',
    'Terima kasih! 💖',
  ].join('\n');
}
