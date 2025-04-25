
import jsPDF from 'jspdf';
import qrcode from 'qrcode-generator';
import { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer: {
    full_name: string | null;
    location: string | null;
    opt_id: string | null;
  } | null;
  seller: {
    full_name: string | null;
    location: string | null;
    opt_id: string | null;
  } | null;
};

export const generateOrdersPDF = (orders: Order[], baseUrl: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 100]
  });

  orders.forEach((order, index) => {
    if (index > 0) {
      doc.addPage([100, 100]);
    }

    // Generate QR code
    const qr = qrcode(0, 'M');
    qr.addData(`${baseUrl}/admin/orders/${order.id}`);
    qr.make();
    const qrImage = qr.createDataURL(4);

    // Add QR code
    doc.addImage(qrImage, 'PNG', 10, 10, 30, 30);

    // Add order details
    doc.setFontSize(10);
    doc.text(`Заказ: ${order.order_number}`, 10, 50);
    doc.text(`Продавец: ${order.seller?.full_name || 'Не указан'}`, 10, 57);
    doc.text(`ID прод.: ${order.seller?.opt_id || 'Не указан'}`, 10, 64);
    doc.text(`Покупатель: ${order.buyer?.full_name || 'Не указан'}`, 10, 71);
    doc.text(`ID пок.: ${order.buyer?.opt_id || 'Не указан'}`, 10, 78);
    doc.text(`Мест: ${order.place_number || '0'}`, 10, 85);
    doc.text(`Контейнер: ${order.container_number || 'Не указан'}`, 10, 92);
  });

  const date = new Date().toISOString().split('T')[0];
  doc.save(`orders_qr_${date}.pdf`);
};
