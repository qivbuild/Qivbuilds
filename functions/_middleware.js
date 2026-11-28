// Har HTML page ke <head> me verification meta tags (admin se) khud lagata hai; admin/api ko noindex karta hai
let VC={t:0,s:null},HC={t:0,v:''};
// Admin ki settings (verify codes + By Owner page) 60 sec cache ke saath
async function getSettings(env){
  if(VC.s&&Date.now()-VC.t<60000)return VC.s;
  const o={};
  try{(await env.DB.prepare("SELECT k,v FROM settings WHERE k IN ('verify','byowner','about')").all()).results.forEach(x=>{try{o[x.k]=JSON.parse(x.v)}catch(e){}})}catch(e){}
  VC={t:Date.now(),s:o};return o}
// ---- By Owner page: admin ki pictures/text server par HTML mein daal deta hai ----
// Pehle yeh JavaScript se API ke baad lagti thi: layout hilta tha (CLS) aur LCP image HTML mein nazar nahi aati thi.
const bEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const bOk=u=>/^(\/media\/|https?:\/\/)/i.test(u||'');
const bRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function bSrcset(u){
  const m=/^(\/media\/img\/m-[a-z0-9]+)(?:-(480|800|2000))?\.webp$/.exec(u||'');
  if(!m)return '';
  if(!m[2])return `${m[1]}-480.webp 480w,${m[1]}-800.webp 800w,${u} 1280w,${m[1]}-2000.webp 2000w`;
  if(m[2]==='800')return `${m[1]}-480.webp 480w,${u} 800w`;
  return ''}
function ssrByowner(html,S){
  const B=S&&S.byowner;if(!B||typeof B!=='object'||typeof html!=='string')return html;
  const at=html.indexOf('id="p-byowner"');if(at<0)return html;
  const head=html.slice(0,at);let tail=html.slice(at);
  let headHit=true;
  if(B.head&&(B.head.title||B.head.text)){headHit=false;tail=tail.replace(/(<div class="sec"><h2>)([\s\S]*?)(<\/h2><p>)([\s\S]*?)(<\/p>)/,(m,a,h,b,p,c)=>{headHit=true;return a+(B.head.title?bEsc(B.head.title):h)+b+(B.head.text?bEsc(B.head.text):p)+c})}
  const cards=(B.cards||[]).filter(c=>c&&c.key);let hit=0;
  cards.forEach((c,ci)=>{
    const re=new RegExp('<div class="ph byowner-slider res-hero bo-empty" data-project="'+bRe(bEsc(c.key))+'"><span class="res-tag">([\\s\\S]*?)</span></div><div style="padding:1rem"><h3 style="margin:0.4rem 0">([\\s\\S]*?)</h3><p>([\\s\\S]*?)</p>');
    tail=tail.replace(re,(m,tag,h3,p)=>{
      hit++;
      let sl='<div class="ph byowner-slider res-hero bo-empty" data-project="'+bEsc(c.key)+'"><span class="res-tag">'+tag+'</span></div>';
      if(c.img&&bOk(c.img)){
        const ss=bSrcset(c.img),pr=ci===0?' fetchpriority="high"':ci>2?' loading="lazy"':'';
        sl='<div class="ph byowner-slider res-hero" data-project="'+bEsc(c.key)+'" data-fixed="1" style="background-image:none"><img alt="'+bEsc(((c.title||c.key)+' - Qivbuild').replace(/\s+/g,' '))+'" width="1728" height="1344" decoding="async"'+pr
          +(ss?' srcset="'+bEsc(ss)+'" sizes="(min-width:1280px) 31vw,(min-width:900px) 47vw,94vw" onerror="this.onerror=null;this.removeAttribute(\'srcset\');this.removeAttribute(\'sizes\');this.src=\''+bEsc(c.img)+'\'"':'')
          +' src="'+bEsc(c.img)+'"><span class="res-tag">'+tag+'</span></div>'}
      return sl+'<div style="padding:1rem"><h3 style="margin:0.4rem 0">'+(c.title?bEsc(c.title):h3)+'</h3><p>'+(c.text?bEsc(c.text):p)+'</p>'})});
  // Sab cards server par lag gaye to browser wala JS dobara kuch na badle
  if(headHit&&cards.length&&hit===cards.length)tail=tail.replace('id="p-byowner"','id="p-byowner" data-ssr="1"');
  return head+tail}
// Home ki pehli (hero) tasveer ko HTML ke saath hi preload karta hai taake LCP jaldi aaye
async function heroLink(env){
  if(HC.t&&Date.now()-HC.t<60000)return HC.v;
  let u='';
  try{const p=await env.DB.prepare("SELECT images FROM posts WHERE status='live' ORDER BY created DESC LIMIT 1").first();u=(JSON.parse(p?.images||'[]')[0])||'';
    if(!u){const c=await env.DB.prepare("SELECT img FROM categories WHERE img IS NOT NULL AND img!='' ORDER BY id LIMIT 1").first();u=c?.img||''}}catch(e){}
  let h='';
  if(typeof u==='string'&&/^(\/media\/img\/[\w.-]+|https:\/\/[^\s"'<>]+)$/.test(u)){
    const m=/^(\/media\/img\/m-[a-z0-9]+)\.webp$/.exec(u);
    h=m?`<link rel="preload" as="image" href="${u}" imagesrcset="${m[1]}-480.webp 480w,${m[1]}-800.webp 800w,${u} 1280w,${m[1]}-2000.webp 2000w" imagesizes="(min-width:900px) 60vw,100vw" fetchpriority="high">`:`<link rel="preload" as="image" href="${u}" fetchpriority="high">`}
  HC={t:Date.now(),v:h};return h}
// ---- About page: admin ka heading/text server par HTML mein (text badalne se layout nahi hilta) ----
function ssrAbout(html,S){
  const A=S&&S.about;if(!A||typeof A!=='object'||typeof html!=='string')return html;
  const at=html.indexOf('id="p-about"');if(at<0)return html;
  const head=html.slice(0,at);let tail=html.slice(at);
  if(A.head&&(A.head.title||A.head.text))tail=tail.replace(/(<div class="sec"[^>]*><h2>)([\s\S]*?)(<\/h2><p>)([\s\S]*?)(<\/p>)/,(m,a,h,b,p,c)=>a+(A.head.title?bEsc(A.head.title):h)+b+(A.head.text?bEsc(A.head.text):p)+c);
  (A.steps||[]).forEach((st,i)=>{
    if(!st||!(st.title||st.text)||!(i>=0&&i<20))return;
    const re=new RegExp('(<div class="abs" id="ab-'+i+'">[\\s\\S]*?<div class="abt">[\\s\\S]*?<h2>)([\\s\\S]*?)(</h2><p>)([\\s\\S]*?)(</p>)');
    tail=tail.replace(re,(m,a,h,b,p,c)=>a+(st.title?bEsc(st.title):h)+b+(st.text?bEsc(st.text):p)+c)});
  return head+tail}
export async function onRequest({request,env,next}){
  const u=new URL(request.url),res=await next();
  // Jo file/API maujood nahi, uske liye HTML (SPA fallback) ki jagah asli 404 do
  if((res.headers.get('content-type')||'').includes('text/html')){
    const pn=u.pathname;
    if(pn.startsWith('/api/'))return new Response('{"error":"not found"}',{status:404,headers:{'content-type':'application/json','cache-control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
    if(pn.startsWith('/.well-known/')||/\.(js|mjs|css|json|txt|xml|map|webmanifest)$/i.test(pn))return new Response('Not found',{status:404,headers:{'content-type':'text/plain;charset=utf-8','cache-control':'no-store'}});
  }
  let r;
  const pg=u.pathname.replace(/\.html$/,'').replace(/\/$/,''),ssr=pg==='/byowner'?ssrByowner:pg==='/about'?ssrAbout:null;
  if(ssr&&res.status===200&&(res.headers.get('content-type')||'').includes('text/html')){
    const t=ssr(await res.text(),await getSettings(env)),hd=new Headers(res.headers);
    ['content-length','etag','last-modified','content-encoding'].forEach(k=>hd.delete(k));
    hd.set('cache-control','public, max-age=60, stale-while-revalidate=300');
    r=new Response(t,{status:200,headers:hd})}
  else r=new Response(res.body,res);
  if(u.pathname.startsWith('/admin')||u.pathname.startsWith('/api')){r.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');return r}
  if(!(r.headers.get('content-type')||'').includes('text/html'))return r;
  const v=(await getSettings(env)).verify||{};
  const M={google:'google-site-verification',bing:'msvalidate.01',facebook:'facebook-domain-verification',pinterest:'p:domain_verify',linkedin:'linkedin-verification',instagram:'instagram-verification'};
  const tags=Object.keys(M).filter(k=>v[k]).map(k=>`<meta name="${M[k]}" content="${String(v[k]).replace(/"/g,'')}">`).join('');
  const home=u.pathname==='/'||u.pathname==='/index'||u.pathname==='/index.html',add=tags+(home?await heroLink(env):'');
  return add?new HTMLRewriter().on('head',{element(e){e.append(add,{html:true})}}).transform(r):r;
}
