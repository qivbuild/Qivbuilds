// Har HTML page ke <head> me verification meta tags (admin se) khud lagata hai; admin/api ko noindex karta hai
let VC={t:0,v:null};
export async function onRequest({request,env,next}){
  const u=new URL(request.url),res=await next();
  const r=new Response(res.body,res);
  if(u.pathname.startsWith('/admin')||u.pathname.startsWith('/api')){r.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');return r}
  if(!(r.headers.get('content-type')||'').includes('text/html'))return r;
  let v={};if(VC.v&&Date.now()-VC.t<60000)v=VC.v;else{try{const x=await env.DB.prepare("SELECT v FROM settings WHERE k='verify'").first();v=JSON.parse(x?.v||'{}')}catch(e){}VC={t:Date.now(),v}}
  const M={google:'google-site-verification',bing:'msvalidate.01',facebook:'facebook-domain-verification',pinterest:'p:domain_verify',linkedin:'linkedin-verification',instagram:'instagram-verification'};
  const tags=Object.keys(M).filter(k=>v[k]).map(k=>`<meta name="${M[k]}" content="${String(v[k]).replace(/"/g,'')}">`).join('');
  return tags?new HTMLRewriter().on('head',{element(e){e.append(tags,{html:true})}}).transform(r):r;
}
