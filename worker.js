// Cloudflare Worker - D1 + R2
// Bindings in wrangler.toml: DB (D1), IMAGES (R2)
export default {
 async fetch(req, env){
  const url=new URL(req.url);
  const cors={'Access-Control-Allow-Origin':'*','Content-Type':'application/json'};
  if(url.pathname==='/api/data'){
    try{ const r=await env.DB.prepare("SELECT * FROM posts ORDER BY id DESC").all(); return new Response(JSON.stringify({blogPosts:r.results,gallery:r.results}),{headers:cors}); }catch(e){ return new Response(JSON.stringify({blogPosts:[],gallery:[]}),{headers:cors}); }
  }
  if(url.pathname==='/api/views' && req.method==='POST'){ const b=await req.json().catch(()=>({})); try{ await env.DB.prepare("INSERT INTO views(post_slug,platform,views) VALUES(?,?,1) ON CONFLICT(post_slug,platform) DO UPDATE SET views=views+1").bind(b.slug||'',b.platform||'').run(); }catch(e){} return new Response(JSON.stringify({ok:true}),{headers:cors}); }
  if(url.pathname.startsWith('/api/image/')){ const key=url.pathname.replace('/api/image/',''); const obj=await env.IMAGES.get(key); if(!obj) return new Response('Not found',{status:404}); return new Response(obj.body,{headers:{'Content-Type':'image/webp','Cache-Control':'public,max-age=31536000'}}); }
  return new Response(JSON.stringify({ok:true,service:'qivbuild-worker'}),{headers:cors});
 }
};
