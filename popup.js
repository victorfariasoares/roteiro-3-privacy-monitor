'use strict';

const TRACKERS = {
  'google-analytics.com': {name:'Google Analytics',cat:'Análise de comportamento',desc:'Registra cada clique, página visitada e tempo de permanência.',risk:'medium'},
  'analytics.google.com': {name:'Google Analytics',cat:'Análise de comportamento',desc:'Registra cada clique, página visitada e tempo de permanência.',risk:'medium'},
  'googletagmanager.com': {name:'Google Tag Manager',cat:'Gerenciador de rastreadores',desc:'Carrega dezenas de outros rastreadores de uma vez.',risk:'medium'},
  'googlesyndication.com':{name:'Google AdSense',cat:'Publicidade',desc:'Rede de anúncios do Google. Usa seu histórico para personalizar anúncios.',risk:'high'},
  'doubleclick.net':      {name:'Google DoubleClick',cat:'Publicidade',desc:'Sistema de rastreamento de anúncios do Google. Um dos maiores rastreadores do mundo.',risk:'high'},
  '2mdn.net':             {name:'DoubleClick (Google)',cat:'Publicidade',desc:'Servidor de anúncios do Google.',risk:'high'},
  'gstatic.com':          {name:'Google Static CDN',cat:'Infraestrutura',desc:'Servidor de arquivos do Google. Geralmente inofensivo.',risk:'low'},
  'google.com':           {name:'Google',cat:'Infraestrutura',desc:'Serviços gerais do Google.',risk:'low'},
  'facebook.com':         {name:'Facebook Pixel',cat:'Publicidade',desc:'Rastreia suas ações em sites fora do Facebook para criar perfil publicitário.',risk:'high'},
  'facebook.net':         {name:'Facebook SDK',cat:'Publicidade',desc:'Monitora comportamento mesmo sem você estar logado no Facebook.',risk:'high'},
  'adnxs.com':            {name:'AppNexus (Microsoft)',cat:'Publicidade',desc:'Uma das maiores plataformas de compra de anúncios. Rastreia entre milhares de sites.',risk:'high'},
  'rubiconproject.com':   {name:'Rubicon Project',cat:'Publicidade',desc:'Negocia seus dados com dezenas de compradores em tempo real.',risk:'high'},
  'pubmatic.com':         {name:'PubMatic',cat:'Publicidade',desc:'Leiloa seu perfil para anunciantes enquanto a página carrega.',risk:'high'},
  'criteo.com':           {name:'Criteo (Retargeting)',cat:'Publicidade',desc:'Te mostra anúncios de produtos que você viu em outros sites.',risk:'high'},
  'taboola.com':          {name:'Taboola',cat:'Conteúdo patrocinado',desc:'Conteúdo "recomendado" baseado no seu perfil de navegação.',risk:'medium'},
  'outbrain.com':         {name:'Outbrain',cat:'Conteúdo patrocinado',desc:'Rastreia o que você lê para sugerir mais conteúdo pago.',risk:'medium'},
  'seedtag.com':          {name:'Seedtag',cat:'Publicidade contextual',desc:'Analisa o conteúdo da página para exibir anúncios relacionados.',risk:'medium'},
  'scorecardresearch.com':{name:'Comscore/Scorecard',cat:'Métricas de audiência',desc:'Coleta dados demográficos e de comportamento.',risk:'medium'},
  'permutive.com':        {name:'Permutive',cat:'Segmentação',desc:'Classifica você em categorias e vende para anunciantes.',risk:'high'},
  'hotjar.com':           {name:'Hotjar',cat:'Gravação de sessão',desc:'Grava tudo: onde você clica, move o mouse e digita.',risk:'high'},
  'segment.com':          {name:'Segment',cat:'Coleta de dados',desc:'Agrega seus dados e distribui para dezenas de ferramentas.',risk:'high'},
  'cloudflare.com':       {name:'Cloudflare CDN',cat:'Infraestrutura',desc:'Rede de distribuição de conteúdo. Geralmente seguro.',risk:'low'},
  'amazonaws.com':        {name:'Amazon AWS',cat:'Infraestrutura',desc:'Servidores da Amazon.',risk:'low'},
  'youtube.com':          {name:'YouTube (Google)',cat:'Vídeo/Publicidade',desc:'Vídeos incorporados permitem que o Google rastreie o que você assiste.',risk:'medium'},
  'twitter.com':          {name:'Twitter/X',cat:'Redes sociais',desc:'Botões de compartilhar informam suas visitas ao Twitter.',risk:'medium'},
  'onetrust.com':         {name:'OneTrust (LGPD)',cat:'Consentimento',desc:'Gerencia o popup de cookies (LGPD/GDPR).',risk:'low'},
  'openx.com':            {name:'OpenX',cat:'Publicidade',desc:'Constrói perfis de audiência cruzando dados de vários sites.',risk:'high'},
};

function getTrackerInfo(d) {
  if (!d) return null;
  if (TRACKERS[d]) return TRACKERS[d];
  const p = d.split('.');
  for (let i=1;i<p.length-1;i++) { const b=p.slice(i).join('.'); if (TRACKERS[b]) return TRACKERS[b]; }
  return null;
}

const $=(id)=>document.getElementById(id);
function setText(id,t){const e=$(id);if(e)e.textContent=t;}
function toggle(id){const e=$(id);if(e)e.classList.toggle('open');}
window.toggle=toggle;

const TYPE_LABEL={script:'Script',image:'Imagem',sub_frame:'iframe',xmlhttprequest:'XHR',stylesheet:'CSS',font:'Fonte',media:'Mídia',beacon:'Beacon',ping:'Ping'};
const TYPE_CLS={script:'script',image:'image',sub_frame:'iframe',xmlhttprequest:'xhr',beacon:'beacon',ping:'beacon'};
function typeTag(t){const cls=TYPE_CLS[t]||'other';const lbl=TYPE_LABEL[t]||t||'?';return `<span class="tag tag-${cls}">${lbl}</span>`;}

const RISK_COLOR={high:'var(--red)',medium:'var(--yellow)',low:'var(--green)'};
const RISK_LABEL={high:'ALTO RISCO',medium:'MÉDIO',low:'SEGURO'};

function getScoreColor(s){return s>=80?'var(--green)':s>=60?'var(--yellow)':s>=40?'var(--orange)':'var(--red)';}
function getGrade(s){
  if(s>=85)return{label:'✓ EXCELENTE',color:'var(--green)'};
  if(s>=70)return{label:'↑ BOM',color:'var(--green)'};
  if(s>=55)return{label:'~ RAZOÁVEL',color:'var(--yellow)'};
  if(s>=35)return{label:'↓ RUIM',color:'var(--orange)'};
  return{label:'✗ CRÍTICO',color:'var(--red)'};
}

function renderScore(score){
  const c=getScoreColor(score),g=getGrade(score);
  const n=$('score-num');n.textContent=score;n.style.color=c;
  const a=$('score-arc');a.style.stroke=c;a.style.strokeDashoffset=188.5-(score/100)*188.5;
  const ge=$('score-grade');ge.textContent=g.label;ge.style.color=g.color;ge.style.borderColor=g.color;
}

function renderThirdParty(domains){
  const entries=Object.entries(domains);
  setText('badge-3p',entries.length);setText('stat-3p',entries.length);
  const badge=$('badge-3p');
  badge.className='section-badge '+(entries.length>5?'danger':entries.length>0?'warn':'ok');
  const body=$('body-3p');
  if(!entries.length){body.innerHTML=`<div class="explain">✅ Nenhum domínio externo detectado.</div>`;return;}
  const highRisk=entries.filter(([d])=>{const t=getTrackerInfo(d);return t&&t.risk==='high';}).length;
  let html=`<div class="explain">Esta página contactou <strong>${entries.length} domínios externos</strong>.${highRisk?` <span style="color:var(--red)">⚠ ${highRisk} de alto risco.</span>`:''}</div>`;
  const sorted=entries.sort(([da,ra],[db,rb])=>{
    const o={high:0,medium:1,low:2};const ta=getTrackerInfo(da);const tb=getTrackerInfo(db);
    const a=o[ta?.risk]??3;const b=o[tb?.risk]??3;return a!==b?a-b:rb.length-ra.length;
  });
  for(const [domain,requests] of sorted){
    const t=getTrackerInfo(domain);const types=[...new Set(requests.map(r=>r.type))];const tags=types.map(typeTag).join('');
    const rc=t?RISK_COLOR[t.risk]||'var(--muted)':'var(--muted)';
    html+=`<div class="item"><div class="item-icon">🌐</div><div class="item-main">
      <div class="item-domain">${escHtml(domain)}</div>
      ${t?`<div class="tracker-name"><span>${escHtml(t.name)}</span><span class="risk-badge" style="background:${rc}22;color:${rc};border-color:${rc}">${RISK_LABEL[t.risk]||''}</span></div>
          <div class="tracker-desc">${escHtml(t.desc)}</div>
          <div class="item-meta">${tags} · ${escHtml(t.cat)} · ${requests.length} req.</div>`
         :`<div class="item-meta">${tags} · domínio externo · ${requests.length} req.</div>`}
    </div></div>`;
  }
  body.innerHTML=html;
}

// ── Security Headers ──────────────────────────────────────────
const IMP_COLOR={critical:'var(--red)',high:'var(--orange)',medium:'var(--yellow)',low:'var(--muted)'};
const IMP_LABEL={critical:'CRÍTICO',high:'ALTO',medium:'MÉDIO',low:'BAIXO'};

function renderSecurityHeaders(sh){
  const body=$('body-sh');const badge=$('badge-sh');
  if(!sh){body.innerHTML=`<div class="explain">Navegue para um site para ver a análise de headers.</div>`;badge.textContent='—';return;}

  const all=Object.values(sh);
  const present=all.filter(h=>h.present).length;
  const missing=all.filter(h=>!h.present);
  const critMissing=missing.filter(h=>h.importance==='critical').length;
  const highMissing=missing.filter(h=>h.importance==='high').length;

  badge.textContent=`${present}/${all.length}`;
  badge.className='section-badge '+(critMissing>0?'danger':highMissing>0?'warn':present===all.length?'ok':'');

  let html=`<div class="explain">
    Security Headers são instruções que o servidor envia ao navegador para <strong>ativar proteções</strong>.
    Cada header faltando é uma defesa desativada — um vetor de ataque possível.
    ${critMissing?`<br><span style="color:var(--red)">⚠ ${critMissing} header crítico faltando.</span>`:''}
  </div>`;

  html+=`<div class="sh-score">
    <span style="font-size:16px">${present===all.length?'🛡':critMissing>0?'🚨':'⚠'}</span>
    <span>${present} de ${all.length} headers implementados</span>
    <span style="margin-left:auto;font-weight:700;color:${critMissing>0?'var(--red)':present===all.length?'var(--green)':'var(--yellow)'}">${present===all.length?'Completo':critMissing>0?'Crítico':'Incompleto'}</span>
  </div>`;

  html+=`<div class="sh-grid">`;
  // Missing headers first
  for(const [key,h] of Object.entries(sh).sort(([,a],[,b])=>{
    const o={critical:0,high:1,medium:2,low:3};return o[a.importance]-o[b.importance];
  })){
    const color=h.present?'var(--green)':IMP_COLOR[h.importance];
    html+=`<div class="sh-row ${h.present?'present':'missing'}">
      <div class="sh-icon">${h.present?'✅':'❌'}</div>
      <div class="sh-main">
        <div class="sh-name">${escHtml(h.name)}</div>
        ${!h.present?`<div class="sh-attack" style="color:${color}">Vetor: <strong>${escHtml(h.attack)}</strong> · Severidade: ${IMP_LABEL[h.importance]}</div>
          <div class="sh-what">${escHtml(h.what)}</div>
          <span class="sh-toggle" onclick="this.previousElementSibling.style.display=this.previousElementSibling.style.display==='none'?'block':'none';this.textContent=this.textContent==='▼ ver detalhes'?'▲ ocultar':'▼ ver detalhes'">▼ ver detalhes</span>`
        :`<div class="sh-attack" style="color:var(--green)">Protege contra: ${escHtml(h.attack)}${h.value?` · <code style="font-family:var(--font-mono);font-size:9px">${escHtml(h.value.substring(0,40))}</code>`:''}</div>`}
      </div>
    </div>`;
  }
  html+=`</div>`;
  body.innerHTML=html;
}

// ── Tech Stack ─────────────────────────────────────────────────
const TECH_COLORS={
  'Servidor Web':   {bg:'#1c2f5e',color:'#79b8ff'},
  'CMS':            {bg:'#2d1e2d',color:'#d2a8ff'},
  'Framework':      {bg:'#1e2d22',color:'#7ee787'},
  'Linguagem':      {bg:'#2d2a1e',color:'#e6c37a'},
  'JavaScript':     {bg:'#2d2820',color:'#ffa657'},
  'CSS Framework':  {bg:'#1a2040',color:'#79c0ff'},
  'Analytics':      {bg:'#1c2128',color:'#8b949e'},
  'Publicidade':    {bg:'#3d0c0c',color:'#ffa198'},
  'E-commerce':     {bg:'#1e2d22',color:'#56d364'},
  'CDN/Proxy':      {bg:'#0d1a2d',color:'#58a6ff'},
  'CRM/Chat':       {bg:'#2d1e2d',color:'#bc8cff'},
  'Pagamento':      {bg:'#1a2010',color:'#3fb950'},
};

function renderTechStack(ts){
  const body=$('body-ts');const badge=$('badge-ts');
  const entries=Object.entries(ts||{});
  const total=entries.reduce((s,[,v])=>s+v.length,0);
  badge.textContent=total?`${total} techs`:'—';

  if(!total){
    body.innerHTML=`<div class="explain">Navegue para uma página para detectar o stack tecnológico.</div>`;
    return;
  }

  body.innerHTML=`<div class="explain">
    Stack detectado via <strong>reconhecimento passivo</strong> (headers HTTP, scripts e variáveis JS) —
    a mesma técnica usada por ferramentas como WhatWeb e BuiltWith, mas sem enviar nenhuma requisição extra.
  </div>`;

  let html=`<div class="tech-grid">`;
  for(const [cat,items] of entries.sort()){
    html+=`<div class="tech-cat-label">${escHtml(cat)}</div>`;
    for(const name of items){
      const c=TECH_COLORS[cat]||{bg:'#1c2128',color:'#8b949e'};
      html+=`<span class="tech-chip" style="background:${c.bg};color:${c.color};border-color:${c.color}40">${escHtml(name)}</span>`;
    }
  }
  html+=`</div>`;
  body.innerHTML+=html;
}

const FP_INFO={
  canvas:       {icon:'🖼',name:'Canvas',      tech:'toDataURL / getImageData',      plain:'Desenha formas invisíveis e analisa o resultado pixel a pixel. Diferenças de GPU tornam o resultado único para seu dispositivo.'},
  webgl:        {icon:'⬡',name:'WebGL',        tech:'getParameter(RENDERER/VENDOR)', plain:'Lê o modelo exato da sua placa de vídeo. Identifica seu dispositivo de forma quase única.'},
  audioContext: {icon:'🔊',name:'AudioContext', tech:'createOscillator / compressor',  plain:'Gera um som inaudível e mede como seu hardware o processa. Cada placa de som produz resultados ligeiramente diferentes.'},
};

function renderFingerprinting(fp){
  const detected=['canvas','webgl','audioContext'].filter(k=>fp[k]);
  const count=detected.length;
  const badge=$('badge-fp');badge.textContent=`${count}/3`;
  badge.className='section-badge '+(count>=2?'danger':count===1?'warn':'ok');
  setText('stat-fp',count);
  let html=`<div class="explain">${count===0?'✅ Nenhuma técnica de fingerprinting detectada.':`⚠ ${count} técnica${count>1?'s':''} de fingerprinting. Esta página pode te identificar mesmo limpando cookies ou usando modo privado.`}</div><div class="fp-grid">`;
  for(const key of ['canvas','webgl','audioContext']){
    const i=FP_INFO[key];const det=fp[key];
    html+=`<div class="fp-card ${det?'detected':'clean'}"><span class="fp-icon">${i.icon}</span><span class="fp-name">${i.name}</span><div class="fp-state">${det?'⚠ DETECTADO':'✓ Não usado'}</div></div>`;
  }
  html+=`</div>`;
  for(const key of detected){
    const i=FP_INFO[key];
    html+=`<div class="detail-block"><div class="detail-title">${i.icon} ${i.name} Fingerprinting</div><div class="detail-tech">API: <code>${escHtml(i.tech)}</code></div><div class="detail-plain">${escHtml(i.plain)}</div></div>`;
  }
  $('body-fp').innerHTML=html;
}

function renderCookies(cookies){
  const total=cookies.firstParty.length+cookies.thirdParty.length;
  setText('stat-ck',total);
  const badge=$('badge-ck');badge.textContent=total;
  badge.className='section-badge '+(cookies.thirdParty.length>3?'danger':total>0?'warn':'ok');
  $('ck-1p').querySelector('.n').textContent=cookies.firstParty.length;
  $('ck-3p').querySelector('.n').textContent=cookies.thirdParty.length;
  $('ck-sess').querySelector('.n').textContent=cookies.session.length;
  $('ck-pers').querySelector('.n').textContent=cookies.persistent.length;
  const ckEx=$('ck-explain');
  if(ckEx){
    let t=total===0?'✅ Nenhum cookie detectado.':`<strong>1ª parte</strong>: do site (geralmente ok). <strong>3ª parte</strong>: de outros domínios, usados para rastreamento. <strong>Persistentes</strong>: ficam após fechar o browser.`;
    if(cookies.thirdParty.length>5)t+=` <span style="color:var(--red)">⚠ ${cookies.thirdParty.length} cookies de 3ª parte é acima do normal.</span>`;
    ckEx.innerHTML=`<div class="explain">${t}</div>`;
  }
  const se=$('ck-supercookies');
  if(cookies.supercookies.length>0){
    let h=`<div class="detail-block danger-block"><div class="detail-title">⚠ Supercookies (${cookies.supercookies.length})</div><div class="detail-plain">Sobrevivem à limpeza de cookies — mesmo apagando tudo, continuam te identificando.</div>`;
    for(const sc of cookies.supercookies)h+=`<div class="item"><div class="item-icon">🔐</div><div class="item-main"><div class="item-domain">${escHtml(sc.domain)}</div><div class="item-meta">${escHtml(sc.type)}</div></div></div>`;
    se.innerHTML=h+`</div>`;
  }else{se.innerHTML='';}
}

function renderStorage(storage){
  const lsK=Object.keys(storage.localStorage||{});const ssK=Object.keys(storage.sessionStorage||{});const idb=storage.indexedDB||[];
  const total=lsK.length+ssK.length+idb.length;
  const badge=$('badge-st');badge.textContent=total;badge.className='section-badge '+(total>5?'warn':total>0?'':'ok');
  const body=$('body-st');
  if(!total){body.innerHTML=`<div class="explain">✅ Nenhum dado armazenado localmente.</div>`;return;}
  let html=`<div class="explain">Sites guardam dados no browser além de cookies. Podem incluir IDs de rastreamento persistentes.</div>`;
  if(lsK.length){html+=`<div class="storage-group"><div class="storage-group-title">💾 localStorage (${lsK.length})</div>`;for(const k of lsK){const e=storage.localStorage[k];html+=`<div class="storage-key">${escHtml(k)}</div><div class="storage-val">${escHtml(e.value)} <span style="color:var(--blue)">(${e.size}B)</span></div>`;}html+=`</div>`;}
  if(ssK.length){html+=`<div class="storage-group"><div class="storage-group-title">⏱ sessionStorage (${ssK.length})</div>`;for(const k of ssK){const e=storage.sessionStorage[k];html+=`<div class="storage-key">${escHtml(k)}</div><div class="storage-val">${escHtml(e.value)} <span style="color:var(--blue)">(${e.size}B)</span></div>`;}html+=`</div>`;}
  if(idb.length){html+=`<div class="storage-group"><div class="storage-group-title">🗃 IndexedDB (${idb.length})</div>`;for(const d of idb)html+=`<div class="item"><div class="item-icon">🗃</div><div class="item-main"><div class="item-domain">${escHtml(d.name)}</div><div class="item-meta">v${d.version}</div></div></div>`;html+=`</div>`;}
  body.innerHTML=html;
}

function renderCookieSyncing(events){
  const badge=$('badge-cs');badge.textContent=events.length;badge.className='section-badge '+(events.length>0?'danger':'ok');
  const body=$('body-cs');
  if(!events.length){body.innerHTML=`<div class="explain">✅ Nenhuma sincronização de IDs entre rastreadores.</div>`;return;}
  let html=`<div class="explain"><strong>Cookie syncing</strong>: dois rastreadores trocam seu ID para unificar seu perfil entre empresas diferentes.</div>`;
  for(const ev of events)html+=`<div class="item"><div class="item-icon">🔄</div><div class="item-main"><div class="item-domain">${escHtml(ev.from)} → <span style="color:var(--red)">${escHtml(ev.to)}</span></div><div class="item-meta">Param: <code style="color:var(--purple)">${escHtml(ev.param)}</code></div><div class="tracker-desc">${escHtml(ev.reason)}</div></div></div>`;
  body.innerHTML=html;
}

function renderHijacking(events){
  const badge=$('badge-hj');badge.textContent=events.length;badge.className='section-badge '+(events.length>0?'danger':'ok');
  const body=$('body-hj');
  if(!events.length){body.innerHTML=`<div class="explain">✅ Nenhuma tentativa de hijacking detectada.</div>`;return;}
  let html=`<div class="explain"><strong>Browser Hijacking</strong>: código malicioso tentando controlar seu navegador (redirects, scripts suspeitos, eval()).</div>`;
  const icons={eval_usage:'⚙',suspicious_redirect:'↪',suspicious_script:'⚠'};
  for(const ev of events)html+=`<div class="item"><div class="item-icon">${icons[ev.type]||'⚠'}</div><div class="item-main"><div class="item-domain" style="color:var(--red)">${escHtml(ev.type)}</div><div class="tracker-desc">${escHtml(ev.reason)}</div>${ev.snippet?`<div class="item-meta" style="font-family:var(--font-mono);font-size:10px">${escHtml(ev.snippet)}</div>`:''}</div></div>`;
  body.innerHTML=html;
}

function renderRecommendations(data){
  const tips=[];const tp=Object.keys(data.thirdPartyDomains).length;const fp=data.fingerprinting;const ck=data.cookies;const sh=data.securityHeaders;
  if(tp>10)     tips.push({icon:'🛡',text:'Instale o <strong>uBlock Origin</strong> — bloqueará a maioria desses rastreadores automaticamente.',level:'high'});
  else if(tp>3) tips.push({icon:'🛡',text:'Considere o <strong>uBlock Origin</strong> para bloquear rastreadores de publicidade.',level:'medium'});
  if(fp.canvas||fp.webgl||fp.audioContext) tips.push({icon:'🔬',text:'Ative proteção contra fingerprinting: em <code>about:config</code> defina <code>privacy.resistFingerprinting = true</code>.',level:'high'});
  if(ck.thirdParty.length>5) tips.push({icon:'🍪',text:'Ative bloqueio de cookies de rastreamento: <strong>Configurações → Privacidade → Proteção Aprimorada → Strict</strong>.',level:'high'});
  if(ck.supercookies.length) tips.push({icon:'🔐',text:'Supercookies detectados. A extensão <strong>Privacy Badger</strong> da EFF pode ajudar a bloqueá-los.',level:'high'});
  if(data.cookieSyncing.length) tips.push({icon:'🔄',text:'Use <strong>Firefox Multi-Account Containers</strong> para isolar sites e impedir cruzamento de dados entre domínios.',level:'high'});
  if(sh){
    const critMissing=Object.values(sh).filter(h=>!h.present&&h.importance==='critical');
    if(critMissing.length) tips.push({icon:'🔒',text:`Este site não implementou headers de segurança críticos (${critMissing.map(h=>h.name).join(', ')}). Como usuário, pouco pode ser feito — mas você pode <strong>reportar ao responsável</strong>.`,level:'high'});
  }
  if(!tips.length) tips.push({icon:'✅',text:'Esta página parece relativamente segura. Continue navegando normalmente.',level:'ok'});
  const lc={high:'var(--red)',medium:'var(--yellow)',ok:'var(--green)'};
  $('body-rec').innerHTML=tips.map(t=>`<div class="rec-item" style="border-left-color:${lc[t.level]||'var(--border)'}"><span class="rec-icon">${t.icon}</span><div class="rec-text">${t.text}</div></div>`).join('');
}

function escHtml(s){if(!s)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

let currentTabId=null;
let openSections=new Set();

async function loadData(){
  
  try{
    const [tab]=await browser.tabs.query({active:true,currentWindow:true});
    if(!tab)return;
    currentTabId=tab.id;
    const url=tab.url||'';
    $('page-url').textContent=url.length>38?url.substring(0,38)+'…':url;
    $('page-url').title=url;

    const r=await browser.runtime.sendMessage({type:'GET_DATA',tabId:tab.id});
    if(!r||!r.success){
      $('loading').style.display='block';$('main').style.display='none';
      $('loading').textContent='Sem dados. Recarregue a página.';return;
    }
    const d=r.data;

    // Save open sections before re-render
    if($('main').style.display!=='none'){
      ['sec-3p','sec-sh','sec-ts','sec-fp','sec-ck','sec-st','sec-cs','sec-hj','sec-rec'].forEach(id=>{
        if($(id)?.classList.contains('open')) openSections.add(id); else openSections.delete(id);
      });
    }

    renderScore(d.privacyScore);
    renderThirdParty(d.thirdPartyDomains);
    renderSecurityHeaders(d.securityHeaders);
    renderTechStack(d.techStack);
    renderFingerprinting(d.fingerprinting);
    renderCookies(d.cookies);
    renderStorage(d.storage);
    renderCookieSyncing(d.cookieSyncing);
    renderHijacking(d.hijacking);
    renderRecommendations(d);

    $('loading').style.display='none';$('main').style.display='block';
    const m=$('main');

    // First load: auto-open critical sections
    if(openSections.size===0){
      if(Object.keys(d.thirdPartyDomains).length>0) openSections.add('sec-3p');
      if(d.fingerprinting.canvas||d.fingerprinting.webgl||d.fingerprinting.audioContext) openSections.add('sec-fp');
      if(d.hijacking.length>0) openSections.add('sec-hj');
      if(d.privacyScore<50) openSections.add('sec-rec');
      if(d.securityHeaders&&Object.values(d.securityHeaders).some(h=>!h.present&&h.importance==='critical')) openSections.add('sec-sh');
    }
    // Restore open sections
    openSections.forEach(id=>{const e=$(id);if(e&&!e.classList.contains('open'))e.classList.add('open');});

  }catch(err){console.error(err);}
}



['sec-3p','sec-sh','sec-ts','sec-fp','sec-ck','sec-st','sec-cs','sec-hj','sec-rec'].forEach(id=>{
  const s=$(id);if(!s)return;
  s.querySelector('.section-header')?.addEventListener('click',()=>toggle(id));
});

$('btn-refresh').addEventListener('click',()=>{openSections.clear();loadData();});
loadData();
