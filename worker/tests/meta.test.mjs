import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { enviarEventoLead } from '../src/meta.js';
import { getLeads } from '../src/rutas/leads.js';
import { postRegistro } from '../src/rutas/registro.js';

const common = readFileSync(new URL('../../public/assets/js/common.js', import.meta.url), 'utf8');
async function navegador(path = '/', id = '123456') {
  const calls = [], storage = new Map();
  const location = new URL('https://example.com' + path);
  const store = { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) };
  const context = { URL, URLSearchParams, location, console, fetch: async () => ({ok:true,json:async()=>({meta:{pixel_id:id}})}),
    history:{replaceState:(_,__,path)=>{location.href=new URL(path,location).href;}},
    document:{referrer:'',addEventListener(){},createElement:()=>({}),getElementsByTagName:()=>[{parentNode:{insertBefore(){}}}]},
    localStorage:store,sessionStorage:store, CCC_CONFIG:{},fbq:(...args)=>calls.push(args) };
  context.window=context;
  vm.runInNewContext(common,context);
  await context.CCC.contenido();
  return {context,calls,storage};
}
test('Pixel lee sitio.json, PageView único, ViewContent solo landing y Lead deduplicado',async()=>{
  const {context,calls}=await navegador();
  context.CCC.pixel({meta:{pixel_id:'123456'}});
  assert.equal(calls.filter(x=>x[1]==='PageView').length,1);
  assert.equal(calls.filter(x=>x[1]==='ViewContent').length,1);
  assert.equal(calls.find(x=>x[0]==='init')[1],'123456');
  assert.equal(context.fbqLead('evento-1'),true);
  assert.equal(context.fbqLead('evento-1'),false);
  assert.equal(calls.find(x=>x[1]==='Lead')[3].eventID,'evento-1');
  const other=await navegador('/gracias/');
  assert.equal(other.calls.filter(x=>x[1]==='ViewContent').length,0);
  assert.equal(other.calls.filter(x=>x[1]==='PageView').length,1);
});
test('ID vacío o inválido desactiva Pixel; token privado no queda en URL ni atribución',async()=>{
  for(const id of ['', 'invalido']) {
    const {context,calls}=await navegador('/',id);
    assert.equal(calls.length,0);assert.equal(context.fbqLead('e'),false);
  }
  const {context,storage}=await navegador('/biblioteca/?t=privado');
  assert.equal(context.CCC.tokenUrl,'privado');
  assert.equal(context.location.search,'');
  assert.equal([...storage.values()].some(x=>x.includes('privado')),false);
});
test('CAPI usa alias FB, hash de contacto, ID compartido y URL sin parámetros privados',async()=>{
  const original=globalThis.fetch; let sent;
  globalThis.fetch=async(url,options)=>{sent={url,...options};return new Response('{}');};
  try {
    const result=await enviarEventoLead({FB_PIXEL_ID:'123',FB_CAPI_TOKEN:'secreto-prueba',SITE_URL:'https://example.com',FB_TEST_EVENT_CODE:'TEST'},
      {email:'TEST@example.com',whatsapp:'9981234567',eventId:'evento-1',pagina:'https://example.com/?t=privado',utm_campaign:'privado'},new Request('https://example.com'));
    assert.equal(result.enviado,true);
    const payload=JSON.parse(sent.body), event=payload.data[0];
    assert.equal(event.event_name,'Lead');assert.equal(event.event_id,'evento-1');
    assert.match(event.user_data.em[0],/^[a-f0-9]{64}$/);
    assert.equal(event.event_source_url,'https://example.com');
    assert.equal(sent.headers.authorization,'Bearer secreto-prueba');
    assert.equal(sent.url.includes('secreto-prueba'),false);
    assert.equal(sent.body.includes('privado'),false);
    assert.equal(payload.test_event_code,'TEST');
    assert.equal((await enviarEventoLead({}, {}, new Request('https://example.com'))).motivo,'sin_configurar');
    globalThis.fetch=async()=>new Response('{}',{status:400});
    assert.equal((await enviarEventoLead({META_PIXEL_ID:'123',META_ACCESS_TOKEN:'x'}, {}, new Request('https://example.com'))).motivo,'error_meta');
  } finally {globalThis.fetch=original;}
});
test('Exportación exige clave, no revela tokens, soporta CSV seguro y JSON',async()=>{
  const row={id:1,nombre:'=2+2',whatsapp:'9981234567',email:'test@example.invalid',origen:'ig',created_at:'2026-09-28',evento_id:'e'};
  const env={ADMIN_KEY:'clave',ADMIN_TOKEN:'admin',DB:{prepare(sql){assert.equal(sql.includes('token'),false);return{all:async()=>({results:[row]})};}}};
  assert.equal((await getLeads(new Request('https://example.com/api/leads'),env)).status,401);
  assert.equal((await getLeads(new Request('https://example.com/api/leads?key=wrong'),env)).status,401);
  const csv=await getLeads(new Request('https://example.com/api/leads?key=clave&format=csv'),env);
  assert.equal(csv.headers.get('cache-control'),'no-store');assert.match(await csv.text(),/"'=2\+2"/);
  const json=await getLeads(new Request('https://example.com/api/leads',{headers:{authorization:'Bearer admin'}}),env);
  assert.equal((await json.json()).leads[0].origen,'ig');
});
test('Registro nuevo devuelve ID; duplicado no modifica datos ni genera otra conversión',async()=>{
  const old=globalThis.caches;
  globalThis.caches={default:{match:async()=>null,put:async()=>{}}};
  let exists=false, inserts=0, eventStored;
  const env={TOKEN_SECRETO:'solo-pruebas',SITE_URL:'https://example.com',DB:{prepare(sql){return{
    bind(...args){if(sql.includes('INSERT INTO registros'))eventStored=args[15];return this;},
    first:async()=>exists?{id:7}:null,
    run:async()=>{inserts++;return{meta:{last_row_id:7}};}
  };}}};
  const body={nombre:'Prueba',email:'prueba@example.invalid',whatsapp:'9981234567',edad:40,consentimiento:true,eventId:'evento-1'};
  const req=()=>new Request('https://example.com/api/registro',{method:'POST',body:JSON.stringify(body)});
  try{
    const first=await(await postRegistro(req(),env)).json();
    assert.equal(eventStored,'evento-1');assert.equal(first.nuevo,true);assert.equal(first.evento_id,'evento-1');assert.equal(inserts,1);
    exists=true;
    const duplicate=await postRegistro(req(),env);
    assert.equal(duplicate.status,503);assert.equal(inserts,1);assert.equal((await duplicate.json()).token,undefined);
  }finally{globalThis.caches=old;}
});
