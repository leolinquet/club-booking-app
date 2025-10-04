#!/usr/bin/env node
import db from './db.js';
import bcrypt from 'bcryptjs';

(async function(){
  try {
    const user = await db.prepare('SELECT id, username, display_name, email, password_hash FROM users WHERE LOWER(username)=LOWER($1) LIMIT 1').get('leolinquet');
    console.log('user:', user);
    if (!user) {
      console.log('No user found for leolinquet');
      process.exit(0);
    }
    if (!user.password_hash) {
      console.log('User has no password_hash');
      process.exit(0);
    }
    console.log('bcrypt compare 1234 ->', bcrypt.compareSync('1234', user.password_hash));
    console.log('bcrypt compare 12345 ->', bcrypt.compareSync('12345', user.password_hash));
  } catch (e) {
    console.error('Error', e && e.stack ? e.stack : e);
    process.exit(1);
  }
  process.exit(0);
})();
