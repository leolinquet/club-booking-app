import { generateVerificationEmail } from './email/resend.js';

const testUrl = 'http://localhost:5051/auth/verify?token=test123';
const result = generateVerificationEmail(testUrl, 'Test User');

console.log('Verification email structure:');
console.log('- Subject:', result.subject);
console.log('- Has HTML:', !!result.html);
console.log('- Has Text:', !!result.text);
console.log('- Keys:', Object.keys(result));