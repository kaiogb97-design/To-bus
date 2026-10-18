/* ===== FUNDAÇÃO (Parte 1: A1 A2 A4 A8 B1 B2 B3 M6) ===== */
const CONFIG={MODO_DEMO:true,API_URL:''};/* true = comportamento de demonstração idêntico ao original */
const safeId=p=>String(p).replace(/[^A-Za-z0-9-]/g,'');/* ids vão dentro de onclick: só [A-Za-z0-9-] */
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/`/g,'&#96;');/* fix A4 */
const escAttr=esc;/* fix B1 */
const toCents=v=>Math.round(+v*100),fromCents=c=>c/100,fmtBRL=c=>'R$ '+(c/100).toFixed(2).replace('.',',');/* usados na Parte 2 (FA6) */
const uuid=()=>{const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)};
const NOME_RE=/^[\p{L}][\p{L}\s'’-]*$/u;/* fix A4: só letras, espaço, apóstrofo e hífen */
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))),unb64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
/* Camada de serviço. Hoje: lógica local. Amanhã: trocar o corpo por fetch ao servidor sem mexer nas telas. */
const Api={
 /* Contrato servidor: POST /auth/biometria {challenge} -> {ok:boolean}; erros: 401 negado, 503 indisponível. Nunca aprovar por padrão. */
 verificarBiometria(){
  if(CONFIG.MODO_DEMO)return bioDemoSheet();/* C2: demo NUNCA aprova em silêncio: o usuário escolhe sucesso ou falha */
  if(!(window.PF&&PF.bio)||!window.PublicKeyCredential||!navigator.credentials||!USER||!USER.waId)return Promise.resolve(false);/* falha fechado */
  return navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:unb64(USER.waId)}],userVerification:'required',timeout:60000}}).then(c=>!!c,()=>false)
 },
 /* Mitigação de protótipo (A2): PBKDF2 no cliente. Correto = hash (Argon2/bcrypt) no servidor: POST /auth/login {id,senha} -> {token}. */
 async criarCredencial(pw){if(!(window.crypto&&crypto.subtle))throw new Error('nocrypto');const sal=crypto.getRandomValues(new Uint8Array(16));return{sal:b64(sal),it:210000,hash:await Api._kdf(pw,sal,210000)}},
 async _kdf(pw,sal,it){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);return b64(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:sal,iterations:it},k,256))},
 async verificarCredencial(u,pw){if(u.hash&&crypto.subtle){const h=await Api._kdf(pw,unb64(u.sal),u.it||210000);let d=h.length^u.hash.length;for(let i=0;i<h.length;i++)d|=h.charCodeAt(i)^(u.hash.charCodeAt(i)||0);return d===0}return u.senha!==undefined&&u.senha===pw},
 /* migração transparente: conta antiga (senha em texto) vira {sal,hash} e o campo antigo é apagado */
 async migrarCredencial(u,pw){if(u.senha!==undefined&&window.crypto&&crypto.subtle){const c=await Api.criarCredencial(pw);u.sal=c.sal;u.it=c.it;u.hash=c.hash;delete u.senha;saveU()}},
 /* C3: PIN guardado como credencial PBKDF2 (USER.pin={sal,it,hash}); comparação em tempo constante via verificarCredencial. Produção: validar no servidor. */
 async verificarPin(pin){const p=USER&&USER.pin;pin=String(pin==null?'':pin);if(!p||!p.hash||!/^\d{4}$/.test(pin))return false;return Api.verificarCredencial(p,pin)}
};
const verificarPin=pin=>Api.verificarPin(pin);
/* Contratos esperados do servidor (todos com token de sessão; erro padronizado {ok:false,erro:'offline'|'timeout'|'http_NNN'|'sem_servidor'}):
   POST /auth/login {id,senha}->{token,usuario}   POST /recarga {opId,valor,forma}->{protocolo,saldo} (credita só após webhook do PSP)
   POST /reembolso {opId,recargaId,motivo,respostas}->{decisao,valor}   POST /cartao/bloqueio {opId,motivo}   POST /cartao/segunda-via {opId,motivo}->{pedidoId}
   Embarque: só o validador do ônibus debita. Ao usar API_URL externa, ampliar connect-src da CSP. */
Api.req=async(path,body,ms)=>{if(!CONFIG.API_URL)return{ok:false,erro:'sem_servidor'};if(navigator.onLine===false)return{ok:false,erro:'offline'};const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||8000);try{const r=await fetch(CONFIG.API_URL+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{}),signal:c.signal,credentials:'omit'});return r.ok?{ok:true,dados:await r.json()}:{ok:false,erro:'http_'+r.status}}catch(e){return{ok:false,erro:e.name=='AbortError'?'timeout':'offline'}}finally{clearTimeout(t)}};/* fix FM8 */
Api.msgErro=r=>({offline:'Sem conexão. Tente novamente.',timeout:'O serviço demorou a responder. Tente novamente.',sem_servidor:'Serviço indisponível no momento.'}[r.erro]||'Não foi possível concluir. Tente novamente.');
Api.op=async(nome,body)=>{if(CONFIG.MODO_DEMO)return{ok:true,demo:true};const r=await Api.req(nome,Object.assign({opId:uuid()},body));if(!r.ok)toast(Api.msgErro(r));return r};
const vf=()=>CONFIG.MODO_DEMO||!!(USER&&USER.verificada);/* fix A8: selo "Conta verificada" */
let CB=null,BIO=null,TM=[],SHT=null,LAST=Date.now(),BADDEC=false,PCB=null,PINF={n:0,u:0},PBUSY=false,PC={s:1,a:'',n:''};
function later(fn,ms){const id=setTimeout(()=>{TM=TM.filter(x=>x!==id);fn()},ms);TM.push(id);return id}/* fix M3: timers de fluxo canceláveis */
function cancelTimers(){TM.forEach(clearTimeout);TM=[]}
function autoHide(){clearTimeout(SHT);SHT=setTimeout(()=>{SHOWN=false;render()},15000)}/* fix M4 */
function copyPix(b){const t=(document.querySelector('.code')||{}).textContent||'',ok=()=>{b.textContent='Copiado ✓'},fb=()=>{try{const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();const r=document.execCommand('copy');a.remove();r?ok():toast('Não foi possível copiar')}catch(e){toast('Não foi possível copiar')}};try{navigator.clipboard?navigator.clipboard.writeText(t).then(ok,fb):fb()}catch(e){fb()}}/* fix FM1 */
const lkGet=()=>{try{return JSON.parse(localStorage.getItem('tb_lk')||'{}')}catch(e){return{}}},lkSet=o=>{try{localStorage.setItem('tb_lk',JSON.stringify(o))}catch(e){}};
function lkFail(){const k=lkGet();k.n=(k.n||0)+1;if(k.n>=5)k.u=Date.now()+Math.min(1800000,60000*Math.pow(2,k.n-5));lkSet(k)}/* fix M1: bloqueio crescente e persistido */
const weakPw=(p,d)=>{const x=p.toLowerCase(),q=dg(p),seq=(a)=>[...p].every((c,i)=>i==0||c.charCodeAt(0)-p.charCodeAt(i-1)==a);return /^(.)\1*$/.test(p)||seq(1)||seq(-1)||['senha','senha123','password','qwerty','qwerty123','abc123','12345a','1q2w3e'].includes(x)||(q.length>=6&&(q===dg(d.cpf)||q===dg(d.nasc)||q===dg(d.nasc).slice(6)+dg(d.nasc).slice(4,6)+dg(d.nasc).slice(0,4)))};
const ageOf=n=>{const a=new Date(n),t=new Date();let y=t.getFullYear()-a.getFullYear();if(t.getMonth()<a.getMonth()||(t.getMonth()==a.getMonth()&&t.getDate()<a.getDate()))y--;return y};/* fix M8 */
const dayDiff=ts=>{const a=new Date(ts),n=new Date();return Math.round((new Date(n.getFullYear(),n.getMonth(),n.getDate())-new Date(a.getFullYear(),a.getMonth(),a.getDate()))/864e5)};
const fmtDataRel=ts=>{const d=dayDiff(ts);return d<=0?'Hoje '+new Date(ts).toTimeString().slice(0,5):d==1?'Ontem':'Há '+d+' dias'};/* fix FA5: mesmos textos de antes */
const dRel=h=>h.ts?fmtDataRel(h.ts):h.d,mes=h=>{const a=new Date(h.ts||Date.now()),n=new Date();return a.getMonth()==n.getMonth()&&a.getFullYear()==n.getFullYear()};
function fixTs(){if(!S||!S.hist)return;S.hist.forEach(h=>{if(h.ts)return;const m=(h.d||'').match(/^Hoje (\d\d):(\d\d)/);if(m){const x=new Date();x.setHours(+m[1],+m[2],0,0);h.ts=x>new Date()?+x-864e5:+x}else h.ts=Date.now()-rbDays(h.d||'')*864e5})}/* migra histórico antigo com data estimada */
const hit=(n,w)=>{w=norm(w).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(^|[^a-z0-9])'+w+(['via','mes','qr','pix','nfc'].includes(w)?'($|[^a-z0-9])':'')).test(n)};/* fix FM5 */
function resetDemo(){if(isReg()||!CONFIG.MODO_DEMO)return toast('Disponível apenas na demonstração');S=INIT();S.saldo=0;S.hist=[];render();toast('Demonstração reiniciada')}/* fix FA4 */
['pointerdown','keydown'].forEach(e=>document.addEventListener(e,()=>{LAST=Date.now()},true));
let IDLE_ID=null;
function startIdle(){clearInterval(IDLE_ID);LAST=Date.now();IDLE_ID=setInterval(()=>{if(USER&&isReg()&&!$('#auth')&&Date.now()-LAST>600000){LAST=Date.now();logout()}},30000)}/* fix M1 + E1: expira por inatividade (10 min); id guardado, logout() limpa, enter() reinicia */
/* ===== REGRAS (fonte única) ===== */
const TIPOS=['urb','est','rur'],TIPO_NM={urb:'Urbana',est:'Estudantil',rur:'Rural'};/* A1: tipos válidos de cartão */
const ruralCard=l=>Math.round(parseFloat(l.c.replace(',','.'))*100);/* tarifa de cartão da linha rural, em centavos */
const ruralMin=()=>Math.min(...TFD.rur.map(ruralCard));
function ruralLinha(){return USER&&USER.linhaRural?TFD.rur.find(l=>l.n==USER.linhaRural)||null:null}/* A4: linha rural preferida do usuário (opcional) */
function tarCents(){const t=(USER&&USER.tipo)||'urb';if(t!='rur')return (TFD[t]||TFD.urb).un;const l=ruralLinha();return l?ruralCard(l):ruralMin()}/* A4: sem constante solta 7,40 */
const tarVar=()=>!!(USER&&USER.tipo=='rur'&&!ruralLinha());/* true = tarifa é a menor entre as linhas; valores variam por linha */
const C={get tarifa(){return tarCents()/100},taxa:2,get max(){/* limite por categoria: 50 passagens (Urbana R$ 275,00 · Estudantil R$ 137,50); Rural segue R$ 200 */const t=(USER&&USER.tipo)||'urb';return t=='rur'?200:+((TFD[t]||TFD.urb).un*50/100).toFixed(2)}/* fix FA1: limite vem do cartão da conta, não da aba */,min:5.5,meta:20,final:'4821',taxa2via:10};
const R=v=>'R$ '+v.toFixed(2).replace('.',',');
const calcU=s=>{const c=toCents(s),t=toCents(C.tarifa),u=Math.floor(c/t);return{u,sobra:Math.max(0,fromCents(c-u*t))}};/* fix FA6: centavos inteiros */
const calcRecarga=v=>{const ns=fromCents(toCents(S.saldo)+toCents(v)),a=calcU(S.saldo),d=calcU(ns);return{total:v+C.taxa,pct:C.taxa/v*100,ns,a,d,cabe:fromCents(toCents(C.max)-toCents(S.saldo))}};
const hm=()=>new Date().toTimeString().slice(0,5);
const INIT=()=>({tab:'home',saldo:0,ativo:true,motivo:'',bloqHora:'',lida:false,seg2:false,
 notifs:['Seu saldo está baixo? Restam 7 passagens — tudo certo!','Novidade: NFC em breve'],
 hist:[{t:'Embarque – Linha 105',v:-5.5,d:'Ontem',k:'uso'},{t:'Recarga Pix',v:20,d:'Há 5 dias',k:'rec'},{t:'Embarque – Linha 201',v:-5.5,d:'Há 5 dias',k:'uso'}],
 flow:null,filtro:'tudo'});
let S=INIT(),timer=null;
const $=s=>document.querySelector(s),ph=$('#ph');
if(CONFIG.MODO_DEMO){ph.style.setProperty('--dbh','32px');ph.insertAdjacentHTML('afterbegin','<div class="demo-bn" role="note">Protótipo de demonstração — sem cobrança real e sem crédito financeiro real.</div>')}/* C1 */
/* ===== UTIL ===== */
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;ph.append(t);setTimeout(()=>t.remove(),3000)}
function sheet(h){closeSheet();const s=document.createElement('div');s.className='sheet';s.id='sh';s.innerHTML='<div>'+h+'</div>';s.onclick=e=>{if(e.target==s)closeSheet()};ph.append(s)}
function closeSheet(){BIO=null;CB=null;PCB=null;const s=$('#sh');s&&s.remove()}
function count(el,a,b){const t0=performance.now();(function f(t){const p=Math.min(1,(t-t0)/800);el.textContent=R(a+(b-a)*(1-Math.pow(1-p,3)));p<1&&requestAnimationFrame(f)})(t0)}
const row=(l,a,b)=>`<tr><td>${l}</td><td>${a}</td><td>${b}</td></tr>`;
const logo='<div class="logo">T<b>O</b> BUS</div><div class="sl">Seu transporte, mais rápido</div>';
const ico={home:'🏠',rec:'🧾',cart:'💳',perf:'👤'};
/* ===== SHELL ===== */
function render(){fixTs();saveS();ph.classList.toggle('blk',!S.ativo);
 $('#nav').innerHTML=[['home','Início'],['rec','Recargas'],['cart','Cartão'],['perf','Perfil']].map(([k,n])=>`<button class="${S.tab==k?'on':''}" aria-label="${n}" onclick="go('${k}')"><span style="font-size:22px">${ico[k]}</span>${n}</button>`).join('');
 $('#main').innerHTML=({home,rec,cart,perf,hist})[S.tab]();
 if(S.tab=='home'){const e=$('#sv');count(e,0,S.saldo)}
}
function go(t){S.tab=t;render()}
function pill(){const {u,sobra}=calcU(S.saldo);return `≈ ${u} passagens + ${R(sobra)}`}
