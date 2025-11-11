// MCP server: carpihogar-ai-actions
// This server exposes actionable tools for the main AI agent.

export * as ProductsSearch from './tools/products/searchProducts';
export * as ProductsGet from './tools/products/getProduct';

export * as CartAdd from './tools/cart/addToCart';
export * as CartRemove from './tools/cart/removeFromCart';
export * as CartView from './tools/cart/viewCart';
export * as CartUpdateQty from './tools/cart/updateQty';

export * as CustomerGetProfile from './tools/customer/getProfile';
export * as CustomerSaveAddress from './tools/customer/saveAddress';
export * as CustomerListAddresses from './tools/customer/listAddresses';

export * as OrderCreate from './tools/order/createOrder';
export * as OrderSavePaymentProof from './tools/order/savePaymentProof';
export * as OrderSendToken from './tools/order/sendToken';
export * as OrderValidateToken from './tools/order/validateToken';

export * as ShippingGetOptions from './tools/shipping/getShippingOptions';
export * as ShippingEstimateETA from './tools/shipping/estimateETA';
export * as ShippingTrackOrder from './tools/shipping/trackOrder';

export * as WhatsAppSendMessage from './tools/whatsapp/sendMessage';

\nexport * as VoiceTTS from './tools/voice/tts';\nexport * as VoiceSTT from './tools/voice/stt';\n
