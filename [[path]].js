// Qivbuild API — Cloudflare Pages Function. Bindings: DB (D1), IMAGES (R2). Secret: ADMIN_PASSWORD
const H={'Content-Type':'application/json','Cache-Control':'no-store'};
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:H});
const E=new TextEncoder();
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const sha=async t=>hex(await crypto.subtle.digest('SHA-256',E.encode(t)));
const mac=async(k,m)=>{const key=await crypto.subtle.importKey('raw',E.encode(k),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,E.encode(m)))};
let ready=false;
async function init(db){if(ready)return;await db.batch([
 db.prepare('CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY,v TEXT)'),
 db.prepare('CREATE TABLE IF NOT EXISTS views(post_slug TEXT,platform TEXT,views INTEGER DEFAULT 0,PRIMARY KEY(post_slug,platform))'),
 db.prepare('CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,text TEXT,rating INTEGER,time INTEGER)'),
 db.prepare('CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,phone TEXT,message TEXT,time INTEGER)')]);ready=true}
const kvGet=async(db,k)=>{const r=await db.prepare('SELECT v FROM kv WHERE k=?').bind(k).first();return r?r.v:null};
const kvSet=(db,k,v)=>db.prepare('INSERT INTO kv(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(k,v).run();
async function secret(env){return (await kvGet(env.DB,'pass'))||(env.ADMIN_PASSWORD?await sha(env.ADMIN_PASSWORD):'')}
async function authed(req,env){const t=(req.headers.get('Authorization')||'').replace('Bearer ','');const [ts,sig]=t.split('.');const s=await secret(env);if(!s||!ts||!sig||Date.now()-(+ts)>2592e6)return false;return sig===await mac(s,ts)}
async function stash(o,env){ // data:image -> R2
 if(typeof o==='string'){const m=o.match(/^data:image\/([\w+]+);base64,([\s\S]+)$/);if(!m)return o;const ext=m[1].replace('+xml','');const bin=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));const key=(await sha(m[2])).slice(0,24)+'.'+ext;await env.IMAGES.put(key,bin,{httpMetadata:{contentType:'image/'+m[1]}});return '/api/image/'+key}
 if(Array.isArray(o)){for(let i=0;i<o.length;i++)o[i]=await stash(o[i],env);return o}
 if(o&&typeof o==='object'){for(const k in o)o[k]=await stash(o[k],env)}return o}
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const PRJ=['resident','commercial','industrial','town','banquet','market'];
const SVC=[['plan',['plan','drawing plan','blueprint physique']],['gray',['gray','gray structure','iron frame']],['interior',['interior','interior design','core sculpting']],['exterior',['exterior','exterior design','skin sculpting']],['renovation',['renovation','body rebirth']]];
function catKey(l){const n=norm(l);for(const p of PRJ)if(n.startsWith(p))return p;for(const [k,a] of SVC)if(a.includes(n))return k;return n.replace(/ /g,'-')}
const item=p=>({id:String(p.id),slug:p.slug,title:p.title,content:p.content,img:p.img||'',cat:catKey(p.picCat||p.cat),picCat:p.picCat||p.cat||'',contentCat:p.footCat||'',footerCat:p.footCat||'',bigCat:p.footCat||'',btn1:p.btn1||'Get in touch',url1:p.link1||'',btn2:p.btn2||'',url2:p.link2||'',date:p.date||''});
async function getData(env){const v=await kvGet(env.DB,'data');return v?JSON.parse(v):{}}
export async function onRequest({request,env,params}){
 try{
 if(!env.DB||!env.IMAGES)return J({error:'D1/R2 bindings missing: DB, IMAGES'},500);
 await init(env.DB);
 const path='/'+[].concat(params.path||[]).join('/'),m=request.method,u=new URL(request.url);
 if(path.startsWith('/image/')){const o=await env.IMAGES.get(path.slice(7));if(!o)return new Response('Not found',{status:404});return new Response(o.body,{headers:{'Content-Type':o.httpMetadata?.contentType||'image/webp','Cache-Control':'public,max-age=31536000,immutable'}})}
 if(path==='/data'||path==='/site-data'){const d=await getData(env);return J(d)}
 if(path==='/gallery'){const d=await getData(env);return J((d.gallery||[]).filter(p=>!p.deleted).map(item))}
 if(path==='/blog'){const d=await getData(env);return J((d.blogPosts||[]).filter(p=>!p.deleted).map(item))}
 if(path==='/partners'){const d=await getData(env);return J((d.partners||[]).filter(p=>!p.deleted))}
 if(path==='/views'){if(m==='POST'){const b=await request.json().catch(()=>({}));if(b.slug&&b.platform)await env.DB.prepare('INSERT INTO views(post_slug,platform,views) VALUES(?,?,1) ON CONFLICT(post_slug,platform) DO UPDATE SET views=views+1').bind(b.slug,b.platform).run();return J({ok:true})}
  const q=u.searchParams.get('slug');const r=q?await env.DB.prepare('SELECT platform,views FROM views WHERE post_slug=?').bind(q).all():await env.DB.prepare('SELECT post_slug,platform,views FROM views').all();return J(r.results)}
 if(path==='/reviews'){if(m==='POST'){const b=await request.json().catch(()=>({}));const n=String(b.name||'').slice(0,50),t=String(b.text||'').slice(0,1000);if(n&&t)await env.DB.prepare('INSERT INTO reviews(name,text,rating,time) VALUES(?,?,?,?)').bind(n,t,Math.min(5,Math.max(1,+b.rating||5)),Date.now()).run();return J({ok:true})}
  return J((await env.DB.prepare('SELECT name,text,rating,time FROM reviews ORDER BY id DESC LIMIT 200').all()).results)}
 if(path==='/contact'&&m==='POST'){let n,p,t;const ct=request.headers.get('content-type')||'';if(ct.includes('json')){const b=await request.json();n=b.name;p=b.phone;t=b.message}else{const f=await request.formData();n=f.get('name');p=f.get('phone');t=f.get('message')}
  await env.DB.prepare('INSERT INTO messages(name,phone,message,time) VALUES(?,?,?,?)').bind(String(n||'').slice(0,80),String(p||'').slice(0,40),String(t||'').slice(0,2000),Date.now()).run();return J({ok:true})}
 if(path==='/login'&&m==='POST'){const b=await request.json().catch(()=>({}));const s=await secret(env);if(!s)return J({error:'ADMIN_PASSWORD set nahi hai'},500);if(b.user!=='admin'||await sha(String(b.password||''))!==s)return J({error:'Galat username / password'},401);const ts=String(Date.now());return J({token:ts+'.'+await mac(s,ts)})}
 if(path.startsWith('/admin/')){
  if(!await authed(request,env))return J({error:'login'},401);
  if(path==='/admin/save'&&m==='POST'){const d=await stash(await request.json(),env);const s=JSON.stringify(d);if(s.length>1900000)return J({error:'Data bohat bara hai (2MB)'},413);await kvSet(env.DB,'data',s);return J({ok:true,data:d})}
  if(path==='/admin/messages')return J((await env.DB.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 200').all()).results);
  if(path==='/admin/password'&&m==='POST'){const b=await request.json();if(!b.password||b.password.length<6)return J({error:'Kam az kam 6 harf'},400);await kvSet(env.DB,'pass',await sha(b.password));return J({ok:true})}
 }
 return J({error:'not found'},404);
 }catch(e){return J({error:String(e&&e.message||e)},500)}}
