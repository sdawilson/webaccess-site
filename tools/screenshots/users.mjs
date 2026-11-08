const BASE='http://localhost:3100'; let cookie='';
async function call(m,p,b){const r=await fetch(BASE+p,{method:m,headers:{'Content-Type':'application/json','X-Requested-With':'webaccess',Cookie:cookie},body:b&&JSON.stringify(b)});const s=r.headers.get('set-cookie');if(s)cookie=s.split(';')[0];const t=await r.text();if(!r.ok)throw new Error(p+' '+t);return JSON.parse(t);}
await call('POST','/api/auth/login',{username:'admin',password:process.env.SEED_PW});
for (const [username,displayName,role] of [['rhughes','Rachel Hughes','admin'],['dokafor','Daniel Okafor','user'],['lmartin','Laura Martin','user'],['tbrennan','Tom Brennan','user'],['site.team','Site Team (shared)','user']])
  await call('POST','/api/users',{username,displayName,password:'Viewer-Pass-2026!',role});
console.log('ok');
