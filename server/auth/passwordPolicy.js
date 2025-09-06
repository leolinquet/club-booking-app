// server/auth/passwordPolicy.js
export function validatePassword(pw){
  if (typeof pw !== 'string') return {ok:false, error:'Invalid password'};
  if (pw.length < 5) return {ok:false, error:'Password must be at least 5 characters'};
  if (!/[A-Z]/.test(pw)) return {ok:false, error:'Password must include an uppercase letter'};
  if (!/\d/.test(pw)) return {ok:false, error:'Password must include a number'};
  return {ok:true};
}
