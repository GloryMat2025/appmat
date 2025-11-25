import { decodeEnvBase64, tryDecodeEnvBase64 } from './scripts/decode-secret.js';

process.env.TEST_B64 = Buffer.from('hello world').toString('base64');

console.log('tryDecodeEnvBase64:', tryDecodeEnvBase64('TEST_B64')); // expect 'hello world'
console.log('decodeEnvBase64:', decodeEnvBase64('TEST_B64')); // expect 'hello world'
