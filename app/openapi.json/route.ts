import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || '';
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Carpihogar AI Actions',
      version: '1.0.0',
      description: 'Endpoints para orquestar el asistente, flujo de compra, voz y tracking.'
    },
    servers: baseUrl ? [{ url: baseUrl }] : [],
    paths: {
      '/api/flow/purchase/step': {
        post: {
          summary: 'Ejecuta un paso del flujo de compra',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    step: { type: 'string', enum: ['start','ensureAddress','shipping','createOrder','sendToken','validateToken','submitPayment'] },
                    input: { type: 'object', additionalProperties: true }
                  },
                  required: ['step']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Resultado del flujo',
              content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } }
            }
          }
        }
      },
      '/api/voice/tts': {
        get: {
          summary: 'Texto a voz (audio/webm) por querystring',
          parameters: [
            { name: 'text', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'voice', in: 'query', required: false, schema: { type: 'string', default: 'sofia' } }
          ],
          responses: { '200': { description: 'Audio', content: { 'audio/webm': { schema: { type: 'string', format: 'binary' } } } } }
        },
        post: {
          summary: 'Texto a voz (audio/webm) por JSON',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { text: { type: 'string' }, voice: { type: 'string', default: 'sofia' } }, required: ['text'] } } } },
          responses: { '200': { description: 'Audio', content: { 'audio/webm': { schema: { type: 'string', format: 'binary' } } } } }
        }
      },
      '/api/voice/stt': {
        post: {
          summary: 'Voz a texto',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: { file: { type: 'string', format: 'binary' } },
                  required: ['file']
                }
              }
            }
          },
          responses: { '200': { description: 'Texto transcrito', content: { 'application/json': { schema: { type: 'object', properties: { text: { type: 'string' } } } } } } }
        }
      },
      '/api/whatsapp/send-token': {
        post: {
          summary: 'Envía token de confirmación por WhatsApp',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { orderId: { type: 'string' }, phone: { type: 'string' } }, required: ['orderId','phone'] } } } },
          responses: { '200': { description: 'Resultado', content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } } }
        }
      },
      '/api/shipping/track': {
        get: {
          summary: 'Consulta tracking de envío',
          parameters: [
            { name: 'orderId', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'shipmentId', in: 'query', required: false, schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Tracking', content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } } }
        }
      },
      '/api/assistant/upload-proof': {
        post: {
          summary: 'Sube imagen de comprobante de pago y extrae datos',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] }
              }
            }
          },
          responses: { '200': { description: 'Extracción', content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } } }
        }
      }
    }
  } as any;

  return NextResponse.json(spec);
}

