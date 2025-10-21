// Quick utility to generate a strong NEXTAUTH_SECRET
const crypto = require('crypto');
const b64 = crypto.randomBytes(32).toString('base64');
console.log(b64);
