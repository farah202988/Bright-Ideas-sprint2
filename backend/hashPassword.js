import bcryptjs from 'bcryptjs';

const password = 'Admin@123';
const hash = await bcryptjs.hash(password, 10);
console.log('Hash:', hash);