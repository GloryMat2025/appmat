import { decodeEnvBase64, tryDecodeEnvBase64 } from './decode-secret.js';

process.env.TEST_B64 = Buffer.from('hello world').toString('base64');

console.log('tryDecodeEnvBase64:', tryDecodeEnvBase64('TEST_B64'));
console.log('decodeEnvBase64:', decodeEnvBase64('TEST_B64'));
