import 'dotenv/config';
import { tableExists } from './db.js';

(async ()=>{
  try{
    const ok = await tableExists('club_sports');
    console.log('tableExists club_sports ->', ok);
  }catch(e){
    console.error('err', e);
  }
  process.exit(0);
})();
