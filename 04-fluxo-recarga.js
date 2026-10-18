/* ===== RECARGA (fluxo) ===== */
function startRec(){BADDEC=false;S.flow={step:1,v:20,pay:'Pix'};ov()}
function ov(){let o=$('#ov');if(!o){o=document.createElement('div');o.id='ov';o.className='ov';ph.append(o)}
 const f=S.flow,st=f.step;o.innerHTML=`<div class="top">${st<5?`<button aria-label="Voltar" onclick="back()">←</button>`:''}<b>Recarga</b></div><div class="stp">${[1,2,3,4].map(i=>`<i class="${i<=Math.min(st,4)?'on':''}"></i>`).join('')}</div>`+steps[st]()}
function back(){const f=S.flow;clearInterval(timer);cancelTimers();if(f.step<=1)return closeOv();f.step=f.step==4?3:f.step-1;ov()}
function closeOv(){clearInterval(timer);cancelTimers();const o=$('#ov');o&&o.remove();S.flow=null;render()}
function setV(v){BADDEC=false;S.flow.v=v;S.flow.qn=0;ov()}function setVin(x){const t=String(x).trim().replace(',','.'),dec=(t.split('.')[1]||'').length;setV(Math.round((+t||0)*100)/100);if(dec>2||!/^\d*\.?\d*$/.test(t)){BADDEC=true;ov()}}/* fix FA6 */
function valInfo(v){/* B2: decimais<=2, v>=min, saldo+v<=max (teto vale para saldo+recarga, não para a recarga isolada) */
 if(BADDEC||Math.abs(v*100-Math.round(v*100))>1e-6)return 'Use no máximo 2 casas decimais';
 if(!isFinite(v))return 'Informe um valor válido';
 if(toCents(v)<toCents(C.min))return `Mínimo: ${R(C.min)}`;
 const cabe=toCents(C.max)-toCents(S.saldo);
 if(toCents(v)>cabe)return cabe<toCents(C.min)?`Limite de saldo atingido: só cabem ${R(fromCents(Math.max(0,cabe)))} (mínimo de recarga ${R(C.min)})`:`Você ainda pode adicionar ${R(fromCents(cabe))} (limite do cartão ${R(C.max)})`;
 return ''}
const steps={
1(){const f=S.flow,v=f.v,e=valInfo(v),c=e?null:calcRecarga(v),a=calcU(S.saldo);
return `<div class="card" style="margin-top:0"><b>Cartão selecionado</b><br>TO BUS •••• ${C.final} — <span class="${S.ativo?'pos':'neg'}">${S.ativo?'Cartão ativo':'Cartão bloqueado'}</span><br><small style="color:var(--mut)">Os créditos da recarga serão adicionados diretamente a este cartão.</small></div>${tfSec()}${tfQ()}<h2>1. Escolha quanto deseja recarregar</h2><div class="chs">${[5.5,10,11,20,30,50,100].map(x=>`<button class="${v==x?'on':''}" onclick="setV(${x})">${R(x).replace(',00','')}</button>`).join('')}</div>
<div style="margin:12px 0;display:flex;align-items:center;gap:10px"><button class="pill" onclick="setV(Math.max(0,+(${v}-${C.tarifa}).toFixed(2)))">−</button><span>${Math.round(v/C.tarifa*100)/100} passagens</span><button class="pill" onclick="setV(+(${v}+${C.tarifa}).toFixed(2))">+</button></div>
<input id="ov_in" type="number" inputmode="decimal" placeholder="Outro valor" value="${v}" style="width:100%;padding:14px;border-radius:14px;border:2px solid var(--bd);font-size:16px;background:var(--card);color:var(--tx)" onchange="setVin(this.value)">
<div class="err ${e?'shake':''}">${e}</div>
${c?`<div class="card"><b>Antes → Depois</b><table class="tb">${row('Saldo',R(S.saldo),R(c.ns)+' (+'+R(v)+')')}${row('Passagens',a.u,c.d.u+' (+'+(c.d.u-a.u)+')')}${row('Sobra',R(a.sobra),R(c.d.sobra))}${row('Meta',a.u+'/'+C.meta,c.d.u+'/'+C.meta)}${row('Espaço no limite',R(c.cabe),R(c.cabe-v))}</table><div class="bar"><i style="width:${c.ns/C.max*100}%"></i></div><small>${R(c.ns)} de ${R(C.max)}</small></div>
<div class="card"><table class="tb">${row('Valor da recarga','',R(v))}${row('Taxa To Bus','',R(C.taxa))}${row('<b>Total a pagar</b>','','<b>'+R(c.total)+'</b>')}</table><small style="color:var(--mut)">A taxa é fixa de ${R(C.taxa)}. Nesta recarga ela representa <b>${c.pct.toFixed(c.pct%1?2:0)}%</b>.<br>${[5.5,10,20].map(x=>R(x)+' → '+(C.taxa/x*100).toFixed(2).replace('.00','')+'%').join(' · ')} — recargas maiores diluem a taxa.</small></div>
${resumo(v,c)}<button class="btn full" onclick="S.flow.step=2;ov()">Continuar</button><button class="btn gh full" onclick="prog()">⏲ Programar recarga automática</button>`:''}`},
2(){const v=S.flow.v,t=R(v+C.taxa);
return `<h2 style="margin-top:0">Forma de pagamento</h2>${[['Pix','⚡','Aprovação em segundos'],['Cartão de crédito','💳','Sem parcelamento'],['Cartão de débito','💳',''],['Carteira digital','📱','Apple Pay / Google Pay']].map(([n,i,d])=>`<button class="opt ${S.flow.pay==n?'on':''}" onclick="S.flow.pay='${n}';ov()">${i} <b>${n}</b> <small>${d}</small><small>Você paga ${t} · Cai no cartão: ${R(v)}</small></button>`).join('')}<button class="btn full" onclick="S.flow.step=3;ov()">Revisar</button>`},
3(){const f=S.flow,c=calcRecarga(f.v),a=c.a;
return `<h2 style="margin-top:0">Revisão</h2><div class="card"><table class="tb">${row('Cartão','','final '+C.final)}${row('Creditado','',R(f.v))}${row('Taxa','',R(C.taxa))}${row('Total','','<b>'+R(c.total)+'</b>')}${row('Pagamento','',f.pay)}${row('Saldo',R(S.saldo),R(c.ns))}${row('Passagens',a.u,c.d.u)}${row('Data','',new Date().toLocaleDateString('pt-BR')+' '+hm())}</table></div>
<button class="btn full" onclick="pay()">Pagar ${R(c.total)}</button>`},
4(){const f=S.flow,c=calcRecarga(f.v),s=f.pixs||0;
return `<h2 style="margin-top:0">Pague com Pix</h2><p style="text-align:center;font-weight:800;font-size:24px">${R(c.total)}</p>${qr()}
<p class="hint" style="margin:6px 0">${QRNOTE} Não há cobrança real: use “Simular pagamento”.</p><p style="text-align:center">Expira em <b id="cd">10:00</b></p><div class="code">00020126580014br.gov.bcb.pix0136tobus-${f.v}-uberaba-mg5204000053039865802BR</div>
<button class="btn gh full" onclick="copyPix(this)">Copiar código</button>
<p style="font-size:13px;color:var(--mut);margin:10px 0">① Abra o app do banco ② Pix → Ler QR Code ou Copia e Cola ③ Confira ${R(c.total)} e confirme.<br>Seu crédito de ${R(f.v)} só entra após a confirmação. A taxa de ${R(C.taxa)} está incluída no total.</p>
<div class="tl"><p class="ok">Aguardando pagamento</p><p class="${s>=1?'ok':''}">Pagamento recebido</p><p class="${s>=2?'ok':''}">Crédito liberado no cartão</p></div>
<button class="btn full" onclick="simPix()">Simular pagamento</button><button class="btn gh full" onclick="closeOv()">Cancelar</button>`},
5(){const f=S.flow,c=f.res;
return `<div class="big">✅</div><h2 style="text-align:center">Recarga concluída!</h2><div class="card"><table class="tb">${row('Protocolo','',f.prot)}${row('Pagamento','',f.pay)}${row('Creditado','',R(f.v))}${row('Taxa','',R(C.taxa))}${row('Total pago','',R(f.v+C.taxa))}${row('Saldo',R(c.sa),'<span id="cs">'+R(c.sa)+'</span>')}${row('Passagens',c.ua,c.ud)}</table></div>
<button class="btn full" onclick="toast('Comprovante compartilhado ✓')">Compartilhar comprovante</button><button class="btn gh full" onclick="closeOv();S.tab='hist';render()">Ver no histórico</button><button class="btn gh full" onclick="closeOv()">Voltar ao início</button>`}};
const QRNOTE='Simulação visual — não é código Pix/EMV real.';
function qr(){let s='',n=21;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const fd=(x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13);let on=fd?(x%14<7&&y%14<7&&(x%14==0||x%14==6||y%14==0||y%14==6||(x%14>1&&x%14<5&&y%14>1&&y%14<5))):((x*7+y*13+x*y)%5<2);if(fd&&y>13)on=(x<7)&&(x==0||x==6||y==14||y==20||(x>1&&x<5&&y>15&&y<19));if(on)s+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}return `<svg class="qr" viewBox="0 0 21 21" role="img" aria-label="Ilustração de QR Code (simulação visual)">${s}</svg>`}
function pay(){const f=S.flow;if(f.pay=='Pix'){f.step=4;f.pixs=0;f.expired=false;ov();let t=600;timer=setInterval(()=>{t--;const e=$('#cd');if(e)e.textContent=Math.floor(t/60)+':'+String(t%60).padStart(2,'0');if(t<=0){clearInterval(timer);if(S.flow)S.flow.expired=true;toast('Pix expirado. Gere um novo.')}},1000);return}
 $('#ov').innerHTML='<div class="sp"></div><p style="text-align:center">Falando com seu banco…</p>';later(()=>{if(S.flow)finish()},1800)}
function simPix(){const f=S.flow;if(!f||f.pixs)return;if(f.expired)return toast('Pix expirado. Gere um novo.');f.pixs=1;ov();later(()=>{if(S.flow!==f)return;f.pixs=2;ov();later(()=>{if(S.flow===f)finish()},900)},1000)}/* fix FM3: toque duplo credita 1x */
function finish(){clearInterval(timer);const f=S.flow;if(!f)return;/* B3: revalida antes de creditar */const ve=valInfo(f.v)||(toCents(S.saldo)+toCents(f.v)>toCents(C.max)?'Limite de saldo excedido':'');if(ve){cancelTimers();toast(ve);f.step=1;ov();return}const sa=S.saldo,ua=calcU(sa).u;S.saldo=fromCents(toCents(sa)+toCents(f.v));const ud=calcU(S.saldo).u;
 f.res={sa,ua,ud};f.prot='TB-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+uuid().slice(0,6).toUpperCase();/* fix B3 */f.step=5;
 S.hist.unshift({t:'Recarga '+f.pay,v:f.v,d:'Hoje '+hm(),k:'rec'});S.notifs.unshift('Recarga confirmada: '+R(f.v));S.lida=false;ov();
 const e=$('#cs');e&&count(e,sa,S.saldo);toast('Recarga confirmada ✓')}
