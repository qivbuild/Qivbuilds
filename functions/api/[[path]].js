const J=(d,s=200,cc='no-store')=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json','cache-control':cc}});
const enc=new TextEncoder(),b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
async function sig(env,t){const k=await crypto.subtle.importKey('raw',enc.encode(env.SESSION_SECRET||'x'),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64(await crypto.subtle.sign('HMAC',k,enc.encode(t)))}
async function authed(req,env){const c=(req.headers.get('cookie')||'').match(/qa=([^;]+)/);if(!c)return false;const[e,s]=c[1].split('.');return +e>Date.now()&&s===await sig(env,e)}
const slugify=s=>(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x';
function clean(h){return String(h||'').replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi,'').replace(/\son\w+="[^"]*"/gi,'').replace(/\son\w+='[^']*'/gi,'').replace(/javascript:/gi,'')}
const cut=h=>String(h||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,160);
const DEMO=[["Lucky Cement","OPC and SRC cement for foundations and slabs"],["DG Cement","High-strength cement for columns and structural concrete"],["Maple Leaf Cement","Cement for plaster masonry and finishing work"],["Bestway Cement","Cement for general construction work"],["Cherat Cement","Cement for structural and general concrete work"],["Amreli Steels","Grade 60 reinforcement bars for columns beams and slabs"],["Mughal Steel","High-tensile reinforcement steel for structural frames"],["Agha Steel","Reinforcement bars for earthquake-resistant structural design"],["Ittefaq Steel","Reinforcement bars in all standard sizes"],["Master Tiles","Floor wall and bathroom tiles in modern designs"],["Shabbir Tiles","Floor and wall tiles for interior finishing"],["Dadex Pipes","UPVC and PPR pipes for plumbing and sewerage"],["Popular Pipes","Water and gas supply pipes"],["Lahore Bricks","First-class bricks for load-bearing and partition walls"],["Golden Bricks","Quality bricks for straight true masonry walls"],["Berger Paints","Weather-resistant paint for interior and exterior walls"],["ICI Dulux Paints","Interior paint and finishes"],["Al-Hamd Sand & Bajri","Clean sand gravel and crush delivered to site"],["Master Sanitary","Sanitary ware taps and bathroom fittings"],["PEL Electric","Wires switches and electrical accessories for safe wiring"]];
async function partners(db){await db.prepare('CREATE TABLE IF NOT EXISTS partners(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,logo TEXT,link TEXT,content TEXT,sort INTEGER DEFAULT 0)').run();
  const done=await db.prepare("SELECT 1 FROM settings WHERE k='partners_seeded'").first();
  if(!done){const n=await db.prepare('SELECT COUNT(*) c FROM partners').first();if(!n.c)await db.batch(DEMO.map((d,i)=>db.prepare('INSERT INTO partners(name,logo,link,content,sort) VALUES(?,?,?,?,?)').bind(d[0],'','',d[1],i)));await db.prepare("INSERT INTO settings(k,v) VALUES('partners_seeded','1')").run()}
  return (await db.prepare('SELECT id,name,logo,link,content FROM partners ORDER BY sort,id').all()).results}
const okUrl=u=>/^(https?:\/\/|\/media\/)/i.test(u||'')?u:'';
export async function onRequest({request:req,env,params,next}){
  const p=[].concat(params.path||[]),m=req.method,db=env.DB;
  const A=()=>authed(req,env);
  if(p[0]==='login'&&m==='POST'){const b=await req.json().catch(()=>({}));if(!env.ADMIN_PASSWORD||b.password!==env.ADMIN_PASSWORD)return J({error:'Password ghalat hai'},401);
    const e=Date.now()+7*864e5;return new Response('{"ok":1}',{headers:{'content-type':'application/json','set-cookie':`qa=${e}.${await sig(env,String(e))}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`}})}
  if(p[0]==='logout')return new Response('{"ok":1}',{headers:{'set-cookie':'qa=; Path=/; Max-Age=0','content-type':'application/json'}});
  if(p[0]==='me')return J({ok:await A()});
  // ---------- public ----------
  if(p[0]==='partners'&&m==='GET')return J(await partners(db));
  if(p[0]==='categories'&&m==='GET')return J((await db.prepare('SELECT * FROM categories ORDER BY sort,id').all()).results);
  if(p[0]==='settings'&&m==='GET'){const o={};(await db.prepare('SELECT k,v FROM settings').all()).results.forEach(x=>{if(x.k!=='verify')try{o[x.k]=JSON.parse(x.v)}catch(e){o[x.k]=x.v}});return J(o,200,'public, max-age=30, stale-while-revalidate=120')}
  if((p[0]==='gallery'||p[0]==='blog')&&m==='GET'){
    const cats=(await db.prepare('SELECT * FROM categories').all()).results,ps=(await db.prepare("SELECT * FROM posts WHERE status='live' ORDER BY created DESC").all()).results,out=[];
    const split=q=>{const a=q.split('/');return{cat:a[0],sub:a[1]||'',sub2:a[2]||''}};
    const cu=c=>{const a=c.path.split('/');return c.link||`https://qivbuild.site/gallery?cat=${a[0]}`+(a[1]?`&sub=${a[1]}`:'')+(a[2]?`&sub2=${a[2]}`:'')};
    for(const x of ps){const cs=JSON.parse(x.cats||'[]'),im=JSON.parse(x.images||'[]'),first=cs[0]||'',c=cats.find(k=>k.path===first),s=split(first);
      out.push({id:'p'+x.id,type:'post',...s,title:x.title,content:cut(x.body),img:im[0]||'',images:im,url:`https://qivbuild.site/p/${x.slug}`+(p[0]==='blog'?'?src=blog':''),url1:`https://qivbuild.site/p/${x.slug}`,btn1:'Open Post',bigCat:s.cat,smallCat:s.sub,category:c?.name||'',slug:x.slug})}
    if(p[0]==='gallery')for(const c of cats)if(c.img)out.push({id:'c'+c.id,type:'category',...split(c.path),title:c.name,content:'',img:c.img,url1:cu(c),btn1:c.btn||'Open',url:cu(c),category:c.name});
    return J(out,200,'public, max-age=30, stale-while-revalidate=120')}
  // ---------- admin only ----------
  if(!(await A()))return ['categories','posts','settings','settings-all','upload','partners'].includes(p[0])?J({error:'Login required'},401):next();
  if(p[0]==='categories'){
    if(m==='POST'){const b=await req.json(),par=b.parent_id?await db.prepare('SELECT * FROM categories WHERE id=?').bind(b.parent_id).first():null,slug=slugify(b.slug||b.name),path=par?par.path+'/'+slug:slug;
      const mx=await db.prepare('SELECT COALESCE(MAX(sort),0)+1 n FROM categories').first();
      try{const r=await db.prepare('INSERT INTO categories(parent_id,path,slug,name,grp,sort,img,link,btn) VALUES(?,?,?,?,?,?,?,?,?)').bind(par?.id||null,path,slug,b.name,par?par.grp:(b.grp||'service'),mx.n,b.img||'',b.link||'',b.btn||'').run();return J({ok:1,id:r.meta.last_row_id})}catch(e){return J({error:'Ye category pehle se maujood hai'},409)}}
    if(m==='PUT'){const id=+p[1],b=await req.json(),o=await db.prepare('SELECT * FROM categories WHERE id=?').bind(id).first();if(!o)return J({error:'nf'},404);
      const slug=b.slug?slugify(b.slug):o.slug,np=o.path.split('/').slice(0,-1).concat(slug).join('/');
      if(np!==o.path){await db.prepare('UPDATE categories SET path=?||substr(path,?) WHERE path LIKE ?').bind(np,o.path.length+1,o.path+'/%').run();
        for(const x of (await db.prepare('SELECT id,cats FROM posts').all()).results){const c=JSON.parse(x.cats||'[]').map(k=>k===o.path?np:k.startsWith(o.path+'/')?np+k.slice(o.path.length):k);await db.prepare('UPDATE posts SET cats=? WHERE id=?').bind(JSON.stringify(c),x.id).run()}}
      await db.prepare('UPDATE categories SET name=?,slug=?,path=?,img=?,link=?,btn=? WHERE id=?').bind(b.name??o.name,slug,np,b.img??o.img,b.link??o.link,b.btn??o.btn,id).run();return J({ok:1})}
    if(m==='DELETE'){const o=await db.prepare('SELECT path FROM categories WHERE id=?').bind(+p[1]).first();if(o)await db.prepare('DELETE FROM categories WHERE path=? OR path LIKE ?').bind(o.path,o.path+'/%').run();return J({ok:1})}}
  if(p[0]==='posts'){
    if(m==='GET'){if(p[1])return J(await db.prepare('SELECT * FROM posts WHERE id=?').bind(+p[1]).first()||{});return J((await db.prepare('SELECT id,slug,title,cats,images,status,created FROM posts ORDER BY created DESC').all()).results)}
    if(m==='POST'||m==='PUT'){const b=await req.json(),v=[b.title||'Untitled',JSON.stringify(b.cats||[]),JSON.stringify(b.images||[]),clean(b.body),JSON.stringify((b.buttons||[]).slice(0,5)),b.slider==='corner'?'corner':'side',[100,80,50].includes(+b.width)?+b.width:100,b.indexed?1:0,b.status==='draft'?'draft':'live'];
      if(m==='POST'){let s=slugify(b.slug||b.title);if(await db.prepare('SELECT 1 FROM posts WHERE slug=?').bind(s).first())s+='-'+Date.now().toString(36);const r=await db.prepare('INSERT INTO posts(title,cats,images,body,buttons,slider,width,indexed,status,slug,created) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(...v,s,Date.now()).run();return J({ok:1,id:r.meta.last_row_id,slug:s})}
      await db.prepare('UPDATE posts SET title=?,cats=?,images=?,body=?,buttons=?,slider=?,width=?,indexed=?,status=? WHERE id=?').bind(...v,+p[1]).run();return J({ok:1})}
    if(m==='DELETE'){await db.prepare('DELETE FROM posts WHERE id=?').bind(+p[1]).run();return J({ok:1})}}
  if(p[0]==='partners'&&m==='PUT'){const a=(await req.json()).slice(0,20).filter(x=>x&&String(x.name||'').trim());
    await db.prepare('CREATE TABLE IF NOT EXISTS partners(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,logo TEXT,link TEXT,content TEXT,sort INTEGER DEFAULT 0)').run();
    await db.prepare("INSERT INTO settings(k,v) VALUES('partners_seeded','1') ON CONFLICT(k) DO NOTHING").run();
    await db.batch([db.prepare('DELETE FROM partners'),...a.map((x,i)=>db.prepare('INSERT INTO partners(name,logo,link,content,sort) VALUES(?,?,?,?,?)').bind(String(x.name).trim().slice(0,80),okUrl(x.logo),okUrl(x.link),String(x.content||'').slice(0,200),i))]);return J({ok:1})}
  if(p[0]==='settings-all'){const o={};(await db.prepare('SELECT k,v FROM settings').all()).results.forEach(x=>{try{o[x.k]=JSON.parse(x.v)}catch(e){o[x.k]=x.v}});return J(o)}
  if(p[0]==='settings'&&m==='PUT'){const b=await req.json();for(const k of Object.keys(b))await db.prepare('INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(k,JSON.stringify(b[k])).run();return J({ok:1})}
  if(p[0]==='upload'&&m==='POST'){const buf=await req.arrayBuffer();if(buf.byteLength>3e6)return J({error:'Image bohat bari hai'},413);const q=new URL(req.url).searchParams,g=q.get('g'),w=+q.get('w');let k=`img/${Date.now()}-${Math.random().toString(36).slice(2,8)}.webp`;if(g&&/^[a-z0-9]{6,20}$/.test(g)&&[480,800,1280,2000].includes(w))k=`img/m-${g}${w===1280?'':'-'+w}.webp`;await env.R2.put(k,buf,{httpMetadata:{contentType:'image/webp'}});return J({ok:1,url:'/media/'+k})}
  return next();
}
