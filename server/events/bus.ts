import { EventEmitter } from 'events';

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

export type EventMap = {
  'order.paid': { orderId: string; customerId?: string };
  'shipment.created': { shipmentId: string; orderId: string; customerId?: string };
  'shipment.status.changed': { shipmentId: string; status: string; orderId?: string; customerId?: string };
};

type Handler<T> = (payload: T) => void | Promise<void>;

export function on<K extends keyof EventMap>(eventName: K, handler: Handler<EventMap[K]>) {
  emitter.on(eventName, handler as any);
}

export async function emit<K extends keyof EventMap>(eventName: K, payload: EventMap[K]) {
  emitter.emit(eventName, payload);
}
