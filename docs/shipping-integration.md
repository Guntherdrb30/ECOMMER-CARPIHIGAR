# Shipping Integration (Carpihogar)

Flow: order(paid) -> createShipment -> provider -> tracking -> notify

## Endpoints
- POST /api/webhooks/payments/verified { orderId, verified:true }
- GET /api/shipping/track?orderId=...
- Admin:
  - GET /api/shipping/admin/list
  - POST /api/shipping/admin/update-status { shipmentId, status }

## Events
- order.paid -> shipment.created -> shipment.status.changed

## Test locally
1. Mark last order paid: `ts-node scripts/demoPaidToShipment.ts`
2. Check DB Shipping created
3. Track: GET /api/shipping/track?orderId=...

## ManyChat/WhatsApp
- Use lib/whatsapp.ts (sendWhatsAppText) to send notifications in server/shipping/notify.ts.
- Configure MANYCHAT_API_KEY, MANYCHAT_BASE_URL, MANYCHAT_SEND_PATH.
