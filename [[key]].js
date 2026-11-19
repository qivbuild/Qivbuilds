export async function onRequest({params,env}){
  const k=[].concat(params.key).join('/');const o=await env.R2.get(k);
  if(!o)return new Response('Not found',{status:404});
  return new Response(o.body,{headers:{'content-type':o.httpMetadata?.contentType||'image/webp','cache-control':'public,max-age=31536000,immutable'}});
}
