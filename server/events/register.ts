import { on } from './bus';
import { notifyShipmentCreated, notifyShipmentStatus } from '@/server/shipping/notify';

on('shipment.created', async ({ shipmentId, orderId, customerId }) => {
  await notifyShipmentCreated({ customerId, orderId, provider: 'DELIVERY' });
});

on('shipment.status.changed', async ({ shipmentId, status, orderId, customerId }) => {
  await notifyShipmentStatus({ customerId, status });
});
