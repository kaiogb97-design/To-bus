/* ===== LINHAS UBERABA + IA ===== */
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const STOP=['jardim','parque','vila','residencial','santa','bairro','conjunto','distrito'];
const loc=()=>USER.bairro||'Centro';
const fm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const LN=`10|São Cristóvão / Facthus|Terminal Univerde
11|Jardim Uberaba via Tutunas|Terminal Univerde
12|Capelinha do Barreiro (rural)|Terminal Beija-Flor
13|IFTM / Praça Rui Barbosa|Terminal Univerde
14|Boa Vista / Volta Grande|Centro
15|Distrito Industrial 2|Terminal Univerde
16|Santa Fé (rural)|Terminal Univerde
17|UFTM|Terminal Univerde
18|Jardim Triângulo|Terminal Univerde
19|Santa Maria / Uniube|Centro
20|Parque das Laranjeiras|Terminal Univerde
21|Alfredo Freire|Terminal Beija-Flor
22|Vila Militar|Terminal Univerde
23|Norte 1|Centro
24|Norte 2|Centro
25|Pacaembu via Rodoviária / Rui Barbosa|Centro
26|Jardim Copacabana|Terminal Beija-Flor
27|Pontal via Hospital Universitário|Centro
28|Jardim Marajó|Terminal Beija-Flor
29|Ilha Bela|Terminal Beija-Flor
30|Distrito Industrial 1|Terminal Beija-Flor
31|Parque dos Girassóis|Terminal Beija-Flor
32|Corujão (noturna)|Centro
50|Abadia|Terminal Univerde / Gameleiras
51|Elza Amuí|Terminal Manoel Mendes
52|Antônio Barbosa|Terminal Manoel Mendes
53|Leblon|Terminal Univerde / Gameleiras
54|Jardim Primavera|Terminal Manoel Mendes
55|Recreio dos Bandeirantes|Terminal Gameleiras
56|Jardim Maracanã|Terminal Gameleiras
57|Jardim Itália|Terminal Gameleiras
58|Ponte Alta / Peirópolis / São Basílio (rural)|Centro
59|Cássio Resende / Uniube|Centro
60|Residencial 2000|Centro
61|Distrito Industrial 3 (rural)|Centro
62|Josa Bernardino|Centro
64|Mercado Municipal / Buritis|Centro
65|Chica Ferreira|Centro
66|Jardim Espírito Santo|Centro
67|Jardim Anatê|Centro
68|Rio de Janeiro|Centro
69|Jardim Alvorada|Centro
72|Maria da Glória|Terminal Manoel Mendes
110|Circular 1 via Prudente de Morais|Centro
111|Circular 2|Centro
120|Interbairros 1|Terminais
121|Interbairros 2|Terminais
200|Eixo BRT Gameleiras / Univerde|Terminal Gameleiras / Univerde`.split('\n').map(x=>{const [n,nm,t]=x.split('|');return{n:+n,nm,t}});
const hs=s=>[...s].reduce((a,c)=>a+c.charCodeAt(0),0);
function deps(l){const f=300+(l.n%7)*4,h=[20,25,30,35,40,45][l.n%6],a=[];if(l.n==32){for(let m=1380;m<1710;m+=60)a.push(m%1440);return a.sort((x,y)=>x-y)}for(let m=f;m<=1350;m+=h)a.push(m);return a}
const off=()=>hs(loc())%12+3;
function nextT(l){const d=new Date(),now=d.getHours()*60+d.getMinutes(),a=deps(l).map(m=>(m+off())%1440).sort((x,y)=>x-y);return{all:a,nx:a.filter(m=>m>=now),now}}
function nearLines(){const b=norm(loc());let w=b.split(/\s+/).filter(x=>x.length>3&&!STOP.includes(x));if(b.includes('centro'))w=w.concat(['circular','interbairros','mercado','rodoviaria','univerde']);const m=LN.filter(l=>w.some(x=>norm(l.nm+' '+l.t).includes(x)));return m.length?{list:m,msg:'Linhas que atendem '+loc()+' ou passam perto.'}:{list:LN.filter(l=>/Interbairros|Circular|Terminal/.test(l.nm+l.t)).slice(0,10),msg:'Não encontrei linha com o nome do seu bairro; mostrando linhas de terminais e circulares. Use a busca.'}}
let LF={q:'',all:false,open:null};
function lcards(){const base=LF.fav?LN.filter(x=>isFav(x.n)):(LF.all?LN:nearLines().list),q=norm(LF.q),l=base.filter(x=>!q||norm(x.n+' '+x.nm+' '+x.t).includes(q));if(!l.length)return (LF.fav?'<p class="hint">Você ainda não tem favoritas. Toque na ☆ de uma linha para salvá-la.</p>':'<p class="hint">Nenhuma linha encontrada.</p>');
return l.map(x=>{const t=nextT(x),n3=t.nx.slice(0,3),op=LF.open==x.n;return `<div class="card"><div style="display:flex;gap:10px;align-items:center"><span class="bn">${x.n}</span><div style="flex:1"><b>${x.nm}</b><br><small style="color:var(--mut)">${x.t}</small></div><button aria-label="Favoritar linha" onclick="tfav(${x.n})" style="border:0;background:none;font-size:26px;min-width:44px;min-height:44px;cursor:pointer">${isFav(x.n)?'⭐':'☆'}</button></div><p style="font-size:13px;margin-top:8px">🚌 Próximos no seu ponto: ${n3.length?n3.map((m,i)=>'<b>'+fm(m)+'</b>'+(i==0?' (em '+(m-t.now)+' min)':'')).join(' · '):'amanhã '+fm(t.all[0])}</p>${op?`<div class="tm">${t.all.map(m=>`<span class="${n3[0]==m?'nx':''}">${fm(m)}</span>`).join('')}</div><small style="color:var(--mut)">Ponto: ${esc(USER.rua?USER.rua+', '+(USER.num||''):loc())}</small>`:''}<div style="display:flex;gap:8px;margin-top:10px"><button class="btn gh" style="flex:1;min-height:40px;font-size:13px" onclick="LF.open=${op?'null':x.n};lst()">${op?'Fechar':'Todos os horários'}</button><button class="btn" style="flex:1;min-height:40px;font-size:13px" onclick="embarcar(${x.n})">Embarquei</button><button class="btn gh" style="flex:1;min-height:40px;font-size:13px" onclick="NF.linha=${x.n};nfc()">📲 NFC</button></div></div>`}).join('')}
function lst(){const e=$('#ll');e?e.innerHTML=lcards():clearInterval(timer)}
function linhas(){clearInterval(timer);const nb=nearLines();ovHTML(topb('Linhas ao vivo · Uberaba')+`<div class="card" style="margin-top:0">📍 <b>${esc(loc())}</b>, Uberaba${USER.rua?' · '+esc(USER.rua)+', '+esc(USER.num||''):''}<br><small style="color:var(--mut)">${esc(nb.msg)} Local vindo do seu cadastro.</small><div style="margin-top:8px;font-weight:700;font-size:13px">🕒 Horários simulados neste protótipo</div></div><input id="lq" placeholder="Buscar linha, bairro ou terminal…" value="${esc(LF.q)}" oninput="LF.q=this.value;lst()" style="width:100%;margin:12px 0;padding:14px;border-radius:14px;border:2px solid var(--bd);background:var(--card);color:var(--tx);font-size:16px"><div class="chs"><button class="${!LF.all&&!LF.fav?'on':''}" onclick="LF.all=false;LF.fav=false;linhas()">Perto de mim</button><button class="${LF.all&&!LF.fav?'on':''}" onclick="LF.all=true;LF.fav=false;linhas()">Todas (${LN.length})</button><button class="${LF.fav?'on':''}" onclick="LF.fav=true;linhas()">⭐ Favoritas (${favL().length})</button></div><div id="ll">${lcards()}</div><p class="hint">Lista de linhas conforme Transube/Prefeitura. Horários no seu ponto são simulados neste protótipo; confira a tabela oficial no app BusU.</p>`);timer=setInterval(lst,20000)}
function embarcar(n){if(!S.ativo)return toast('Cartão bloqueado: embarque recusado');if(toCents(S.saldo)<toCents(C.tarifa))return toast('Saldo insuficiente. Recarregue pelo app.');/* B4 */const l=LN.find(x=>x.n==n);S.saldo=fromCents(toCents(S.saldo)-toCents(C.tarifa));S.hist.unshift({t:'Embarque – Linha '+n+' '+l.nm,v:-C.tarifa,d:'Hoje '+hm(),k:'uso',ts:Date.now()});const u=calcU(S.saldo).u;if(u<2){S.notifs.unshift('Saldo baixo: restam '+u+' passagens');S.lida=false}toast('Embarque registrado: −'+R(C.tarifa)+' · saldo '+R(S.saldo)+' · '+u+' passagens')}
function insights(){const uso=S.hist.filter(h=>h.k=='uso'),rec=S.hist.filter(h=>h.k=='rec'),d=[0,0,0,0,0,0,0],L=['S','T','Q','Q','S','S','D'];uso.forEach(h=>{d[(new Date(h.ts||Date.now()).getDay()+6)%7]+=-h.v});
const g=uso.reduce((a,b)=>a-b.v,0),tr=rec.reduce((a,b)=>a+b.v,0),c=calcU(S.saldo),cnt={};uso.forEach(h=>{const m=h.t.match(/Linha (\S+)/);if(m)cnt[m[1]]=(cnt[m[1]]||0)+1});const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0],mx=Math.max(C.tarifa,...d);
ovHTML(topb('Meus gastos')+`<div class="card" style="margin-top:0"><b>Consumo × saldo (sincronizado)</b><table class="tb">${row('Passagens usadas','',uso.length)}${row('Gasto com viagens','',R(g))}${row('Total recarregado','',R(tr))}${row('Saldo atual','',R(S.saldo))}${row('Passagens restantes','',c.u+' + '+R(c.sobra))}${row('Linha mais usada','',top?top[0]+' ('+top[1]+'x)':'—')}</table></div><div class="card"><b>Gasto por dia da semana</b><svg viewBox="0 0 280 130" style="width:100%;margin-top:8px" role="img" aria-label="Gastos por dia">${d.map((x,i)=>`<rect x="${i*40+8}" y="${100-x/mx*80}" width="26" height="${Math.max(2,x/mx*80)}" rx="6" fill="#0A66FF" style="transform-box:fill-box;transform-origin:bottom;animation:grow .8s var(--ease) ${i*.08}s both"/><text x="${i*40+21}" y="120" font-size="11" text-anchor="middle" fill="currentColor">${L[i]}</text>`).join('')}</svg></div><div class="stt"><div><b>${uso.length}</b><small>viagens</small></div><div><b>${uso.length?R(g/uso.length):R(0)}</b><small>por viagem</small></div><div><b>${(uso.length*0.9).toFixed(1)} kg</b><small>CO₂ evitado*</small></div></div><p class="hint">*Estimativa demonstrativa vs. carro. Cada embarque (Linhas ao vivo ou NFC) desconta do saldo e entra aqui.</p>`)}
const SUG=['Qual ônibus pega no meu bairro?','Quanto gastei?','Quero recarregar','Bloquear meu cartão','Qual meu saldo?','Pagar por NFC','Como pedir 2ª via?','Planejar o mês'];
function nav(k){closeOv();({linhas,gastos:insights,recarga:()=>S.ativo?startRec():toast('Cartão bloqueado: recarga suspensa'),plan,bloq:flowBloq,desb:flowDesb,via2:flow2via,nfc,qr:qrCard,prog,hist:()=>{S.tab='hist';render()},cart:()=>go('cart'),perf:()=>go('perf'),home:()=>go('home'),ajuda:chat})[k]()}
const WARN='Ainda não consigo responder essa pergunta por aqui. ⚠️ <b>Quando o app estiver pronto, estará disponível um suporte 24h no servidor do To Bus.</b> Enquanto isso, posso te levar a uma destas páginas:';
const INT=[
{k:['desbloq'],f:()=>({a:'Para desbloquear, confirme que está com o cartão em mãos e valide com biometria.',acts:[['Desbloquear cartão','desb']]})},
{k:['bloque','perdi','roub','furt','extravi','suspeit'],f:()=>({a:'Sinto muito! Bloqueie agora: seu saldo e suas passagens ficam 100% protegidos. Depois, se precisar, peça a 2ª via.',acts:[['Bloquear cartão','bloq'],['Pedir 2ª via','via2']]})},
{k:['segunda','2a via','2ª via','2 via','via do cartao'],f:()=>({a:`A 2ª via custa ${R(C.taxa2via)}, prazo de 5 dias úteis, e seu saldo é transferido para o novo cartão.`,acts:[['Solicitar 2ª via','via2']]})},
{k:['linha','onibus','horario','bairro','perto','ponto','embarcar'],f:()=>{const nb=nearLines().list.slice(0,4);return{a:`Pelo seu cadastro (${esc(loc())}), estas linhas atendem sua região: <b>${nb.map(l=>l.n).join(', ')}</b>. Abro Linhas ao vivo com os horários no seu ponto.`,acts:[['Abrir Linhas ao vivo','linhas']]}}},
{k:['gast','consumo','usei','viagens'],f:()=>{const u=S.hist.filter(h=>h.k=='uso'),g=u.reduce((a,b)=>a-b.v,0);return{a:`Você usou <b>${u.length}</b> passagem(ns) e gastou <b>${R(g)}</b>. Saldo: ${R(S.saldo)} (${calcU(S.saldo).u} passagens). Tudo sincronizado.`,acts:[['Abrir Meus gastos','gastos']]}}},
{k:['saldo','quantas passagens','restam'],f:()=>({a:`Seu saldo é <b>${R(S.saldo)}</b>: ${calcU(S.saldo).u} passagens + ${R(calcU(S.saldo).sobra)} de sobra.`,acts:[['Recarregar','recarga'],['Meus gastos','gastos']]})},
{k:['recarreg','recarga','pix','adicionar','creditar'],f:()=>({a:`Escolha o valor (mínimo ${R(C.min)}), a forma de pagamento e confirme. A taxa é fixa de ${R(C.taxa)} e o valor vai integral para o cartão.`,acts:[['Recarregar agora','recarga'],['Planejar quanto recarregar','plan']]})},
{k:['taxa','custa','cobra'],f:()=>({a:`A taxa To Bus é fixa: <b>${R(C.taxa)} por recarga</b>, mostrada antes de pagar.`,acts:[['Fazer recarga','recarga']]})},
{k:['plane','quanto recarregar','mes'],f:()=>({a:'Informe viagens por dia e dias do mês que eu calculo a recarga ideal.',acts:[['Abrir Planejador','plan']]})},
{k:['programad','automatic','agendar'],f:()=>({a:'A recarga programada é apenas um lembrete local: não debita automaticamente. Para recarregar, faça a recarga normalmente.',acts:[['Programar recarga','prog']]})},
{k:['nfc','aproxim','celular'],f:()=>({a:'Ative o cartão digital e teste o pagamento por aproximação no simulador.',acts:[['Abrir simulador NFC','nfc']]})},
{k:['qr'],f:()=>({a:'O QR Code do cartão fica na aba Cartão e é desativado se o cartão estiver bloqueado.',acts:[['Ver QR Code','qr']]})},
{k:['extrato','historico','comprovante','movimenta'],f:()=>({a:'No Histórico você vê recargas, usos e segurança, e pode gerar o extrato.',acts:[['Abrir Histórico','hist']]})},
{k:['perfil','dados','cadastro','senha','tema','escuro','claro','notifica'],f:()=>({a:'No Perfil você altera dados, segurança, notificações e o tema (claro/escuro).',acts:[['Abrir Perfil','perf']]})},
{k:['atendente','humano','pessoa'],f:()=>({a:'Atendimento humano: <b>quando o app estiver pronto, estará disponível um suporte 24h no servidor do To Bus.</b> Posso ajudar agora com o que o app já faz.',w:1,acts:[['Meu cartão','cart']]})}];
function respond(t){const n=norm(t);let best=null,bs=0;INT.forEach(i=>{const s=i.k.filter(w=>hit(n,w)).length;if(s>bs){bs=s;best=i}});const r=best?best.f():{a:WARN,w:1,acts:[['Ajuda 24h','ajuda'],['Recarregar','recarga'],['Linhas ao vivo','linhas']]};IH.push({t:r.a,b:1,w:r.w,acts:r.acts});drawIA()}
function qs(t){IH.push({t:String(t).slice(0,500)});drawIA(1);setTimeout(()=>respond(t),900)}
function sendIA(){const i=$('#ci2'),v=i.value.trim();if(v)qs(v)}
let IH=[];function ia(){IH=[{b:1,t:'Olá, '+esc(USER.nome.split(' ')[0])+'! Sou a MAKEM, a inteligência artificial do To Bus 🤖. Pergunte o que quiser e eu te levo à página certa — inclusive à Ajuda 24h, que é um serviço separado.'}];drawIA()}
function drawIA(typ){ovHTML(`<div class="cht"><div class="top"><button aria-label="Voltar" onclick="closeOv()">←</button><div><b>MAKEM</b><br><small><span class="dot"></span>Online 24h</small></div></div><div class="msgs" id="ms">${IH.map(m=>`<div class="mg ${m.b?'b':'u'} ${m.w?'w':''}">${m.b?m.t:esc(m.t)}${(m.acts||[]).map(a=>`<br><button class="btn gh" style="margin-top:8px;min-height:40px;font-size:13px" onclick="nav('${a[1]}')">${a[0]} ›</button>`).join('')}</div>`).join('')}${typ?'<div class="mg b tp"><span></span><span></span><span></span></div>':''}</div><div class="qs">${SUG.map(q=>`<button onclick="qs('${q}')">${q}</button>`).join('')}</div><div class="inp"><input id="ci2" placeholder="Pergunte à MAKEM…" aria-label="Mensagem" onkeydown="if(event.key=='Enter')sendIA()"><button class="btn" onclick="sendIA()" aria-label="Enviar">➤</button></div></div>`);const m=$('#ms');m&&(m.scrollTop=m.scrollHeight)}
ph.insertAdjacentHTML('beforeend','<button class="fab" aria-label="MAKEM, assistente de IA" onclick="ia()">🤖</button>');
/* ===== CARTÃO Único + NFC em todas as linhas ===== */
let USED=[];try{USED=JSON.parse(localStorage.getItem('tb_cards')||'[]')}catch(e){}
function genCard(tmp){let c;do{const a=new Uint32Array(3);crypto.getRandomValues(a);c='5039'+[...a].map(x=>String(x%10000).padStart(4,'0')).join('')}while(USED.includes(c)||USERS.some(u=>u.card==c));if(!tmp){USED.push(c);try{localStorage.setItem('tb_cards',JSON.stringify(USED))}catch(e){}}return c}/* fix B2: cartão da demo não é persistido */
const fmtCard=(c,full)=>full?c.replace(/(\d{4})(?=\d)/g,'$1 '):'•••• •••• •••• '+c.slice(-4);
let SHOWN=false;const cardNum=()=>fmtCard((USER&&USER.card)||('50390000000000'+C.final.slice(-2)).slice(0,12)+C.final,SHOWN);
function nfc(){if(!LN.find(l=>l.n==NF.linha))NF.linha=nearLines().list[0].n;const l=LN.find(x=>x.n==NF.linha);ovHTML(topb('Pagamento por aproximação')+`<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><b>Cartão digital NFC</b><br><small style="color:var(--mut)">Sincronizado com as ${LN.length} linhas de Uberaba</small></div><button class="li" style="width:auto;min-height:44px;padding:0" role="switch" aria-checked="${NF.on}" onclick="NF.on=!NF.on;nfc()"><span class="sw ${NF.on?'on':''}"></span></button></div><div class="f" style="margin-top:12px"><label for="nl">Linha do validador</label><select id="nl" onchange="NF.linha=+this.value;nfc()">${LN.map(x=>`<option value="${x.n}" ${x.n==l.n?'selected':''}>${x.n} · ${x.nm}</option>`).join('')}</select></div><div class="val" id="val"><small>VALIDADOR · Linha ${l.n} · ${l.nm}</small><div class="vs" id="vs">Aproxime o celular</div><div class="waves"><i></i><i></i><i></i></div><div class="ph2" id="phn">📱</div></div><button class="btn full" id="tap" onclick="tap()">Aproximar do validador</button><p class="hint" id="hn">Tarifa ${R(C.tarifa)} · saldo ${R(S.saldo)}</p>`)}
function tap(){const v=$('#val'),s=$('#vs'),p=$('#phn'),l=LN.find(x=>x.n==NF.linha);if(v.className!='val')return;if(!NF.on){v.className='val no';s.textContent='Ative o cartão digital NFC';beep(0);setTimeout(()=>v.className='val',1500);return}
v.className='val go';p.classList.add('app');s.textContent='Lendo cartão…';
setTimeout(()=>{let m='',ok=true;if(!S.ativo){ok=false;m='❌ Cartão bloqueado — embarque recusado'}else if(toCents(S.saldo)<toCents(C.tarifa)){ok=false;/* B4 */m='❌ Saldo insuficiente. Recarregue pelo app.'}
if(ok){S.saldo=fromCents(toCents(S.saldo)-toCents(C.tarifa));S.hist.unshift({t:'Embarque NFC – Linha '+l.n+' '+l.nm,v:-C.tarifa,d:'Hoje '+hm(),k:'uso',ts:Date.now()});m='✅ Liberado! Bom embarque';const u=calcU(S.saldo).u;if(u<2){S.notifs.unshift('Saldo baixo: restam '+u+' passagens');S.lida=false}}
v.className='val '+(ok?'ok':'no');s.textContent=m;beep(ok);$('#hn').textContent=ok?'Cobrado '+R(C.tarifa)+' · saldo '+R(S.saldo)+' · '+calcU(S.saldo).u+' passagens':'Nada foi cobrado.';
setTimeout(()=>{v.className='val';p.classList.remove('app');s.textContent='Aproxime o celular'},2400)},1300)}
/* ===== NÚMERO COMPLETO: habilitar / desabilitar ===== */
let NOMSG=false;try{localStorage.removeItem('tb_nomsg')}catch(e){}/* fix M4: "não mostrar de novo" só vale na sessão */
function numSw(){if(SHOWN){SHOWN=false;render();return toast('Desabilitado: mostrando só os 4 últimos dígitos')}
if(NOMSG)return bio(()=>{SHOWN=true;autoHide();render();toast('Número completo habilitado')})
sheet('<h2 style="margin-top:0">🔐 Autorizar exibição</h2><p>Para mostrar todos os números do cartão, precisamos da sua autorização. Isso é pedido sempre que você habilitar esta função.</p><label class="chk"><input type="checkbox" id="nm"> Não mostrar novamente esta mensagem</label><button class="btn full" onclick="numAuth()">Autorizar com biometria</button><button class="btn gh full" onclick="closeSheet()">Cancelar</button>')}
function numAuth(){const c=$('#nm');if(c&&c.checked){NOMSG=true}bio(()=>{SHOWN=true;autoHide();render();toast('Número completo habilitado')})}
/* ===== MAKEM notícias, carregamentos, animação final, favoritas ===== */
if(PF.mk===undefined)PF.mk=true;
const FV={};
function favL(){const k='tb_fav_'+(USER.oid||'x');if(!FV[k]){try{FV[k]=isReg()?JSON.parse(localStorage.getItem(k)||'[]'):[]}catch(e){FV[k]=[]}}return FV[k]}
const isFav=n=>favL().includes(n);
function tfav(n){const a=favL(),i=a.indexOf(n);i<0?a.push(n):a.splice(i,1);if(isReg())try{localStorage.setItem('tb_fav_'+(USER.oid||'x'),JSON.stringify(a))}catch(e){}lst();toast(i<0?'⭐ Linha '+n+' salva nas favoritas':'Linha '+n+' removida das favoritas')}
function loading(m,ms,cb){const d=document.createElement('div');d.className='ld';d.innerHTML='<div class="rg"></div><p>'+m+'</p>';ph.append(d);setTimeout(()=>{d.remove();cb()},ms)}
function withLoad(n,m,ms,c){const o=window[n];window[n]=function(...a){if(c&&!c())return o.apply(this,a);loading(m,ms,()=>{o.apply(this,a);render()})}}
withLoad('doBloq','Bloqueando cartão…',800);withLoad('doDesb','Desbloqueando cartão…',800);withLoad('do2via','Registrando pedido…',900,()=>!S.seg2&&toCents(S.saldo)>=toCents(C.taxa2via));withLoad('embarcar','Validando embarque…',700,()=>S.ativo&&toCents(S.saldo)>=toCents(C.tarifa));withLoad('pay','Gerando Pix…',700,()=>S.flow&&S.flow.pay=='Pix');
function celebrate(n,v){const d=document.createElement('div');d.className='cf';d.innerHTML=Array.from({length:30},(_,i)=>`<i style="left:${Math.random()*100}%;background:${['#FFC933','#0A66FF','#22C55E','#EF4444','#fff'][i%5]};animation-delay:${Math.random()*.6}s;animation-duration:${1.6+Math.random()}s"></i>`).join('')+`<div class="ct"><div style="font-size:54px">🚌</div><b>+${n} passagens!</b><small>${R(v)} creditados no cartão</small></div>`;ph.append(d);setTimeout(()=>d.remove(),3400)}
const _fin=window.finish;window.finish=function(){if(!S.flow||S.flow.step==5)return;_fin();const r=S.flow&&S.flow.res;if(r)celebrate(r.ud-r.ua,S.flow.v);render()};
let MKh=null,MKn=0;
function mkSync(){if(!S||!S.hist)return;if(S.hist!==MKh){MKh=S.hist;MKn=S.hist.length;return}const k=S.hist.length-MKn;MKn=S.hist.length;if(k<=0||PF.mk===false)return;const h=S.hist[0],u=calcU(S.saldo);let m;
if(h.k=='rec')m='Recarga de '+R(h.v)+' confirmada. Saldo: '+R(S.saldo)+' ('+u.u+' passagens).';else if(h.k=='uso')m='Embarque registrado ('+R(-h.v)+'). Saldo: '+R(S.saldo)+' · '+u.u+' passagens'+(u.u<2?'. Atenção: saldo baixo, que tal recarregar?':'.');else m=h.t+(h.v?'. Saldo atual: ':'. Seu saldo continua em ')+R(S.saldo)+'.';
S.notifs.unshift('🤖 MAKEM: '+m);S.lida=false;const t=document.createElement('div');t.className='toast';t.style.top='76px';t.textContent='🤖 MAKEM: '+m;ph.append(t);setTimeout(()=>t.remove(),3800);_r()}
const _r=render;render=function(){_r();mkSync()};
INT.push({k:['noticia','novidade','resumo','minha conta'],f:()=>{const h=S.hist.slice(0,3);return{a:'Resumo da sua conta: saldo '+R(S.saldo)+' ('+calcU(S.saldo).u+' passagens). '+(h.length?'Últimas ações: '+h.map(x=>esc(x.t)).join('; ')+'.':'Nenhuma ação ainda.')+' As notícias automáticas da MAKEM podem ser ativadas ou desativadas em Perfil → Notificações.',acts:[['Abrir Perfil','perf'],['Meus gastos','gastos']]}}});
