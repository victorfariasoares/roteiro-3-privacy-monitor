'use strict';

// Abre sidebar ao clicar no ícone da barra de ferramentas
browser.browserAction.onClicked.addListener(() => {
  browser.sidebarAction.toggle();
});

const tabData = {};

function initTab(tabId, url = '') {
  tabData[tabId] = {
    pageUrl: url,
    thirdPartyDomains: {},
    cookies: { firstParty:[], thirdParty:[], session:[], persistent:[], supercookies:[] },
    fingerprinting: { canvas:false, webgl:false, audioContext:false },
    cookieSyncing: [],
    hijacking: [],
    storage: { localStorage:{}, sessionStorage:{}, indexedDB:[] },
    securityHeaders: null,
    techStack: {},
    privacyScore: 100
  };
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') initTab(tabId, tab.url || '');
});
browser.tabs.onRemoved.addListener((tabId) => { delete tabData[tabId]; });

function getHostname(url) { try { return new URL(url).hostname; } catch { return null; } }
function getBaseDomain(h) { if (!h) return null; const p=h.split('.'); return p.length>=2?p.slice(-2).join('.'):h; }
function isThirdParty(reqUrl, pageUrl) { return getBaseDomain(getHostname(reqUrl)) !== getBaseDomain(getHostname(pageUrl)); }

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    const { tabId, url, type } = details;
    if (tabId < 0 || !tabData[tabId]) return {};
    const pageUrl = tabData[tabId].pageUrl;
    if (!pageUrl || pageUrl.startsWith('about:') || pageUrl.startsWith('moz-extension:')) return {};
    if (isThirdParty(url, pageUrl)) {
      const domain = getHostname(url);
      if (domain) {
        if (!tabData[tabId].thirdPartyDomains[domain]) tabData[tabId].thirdPartyDomains[domain] = [];
        tabData[tabId].thirdPartyDomains[domain].push({ url: url.length>120?url.substring(0,120)+'…':url, type, timestamp:Date.now() });
        detectCookieSyncing(url, domain, tabId, pageUrl);
      }
    }
    return {};
  },
  { urls:['<all_urls>'] }, ['blocking']
);

const SYNC_PARAMS = new Set(['uid','uuid','id','user_id','userid','pid','ppid','gdpr_consent','redir','redirect','sync']);
function detectCookieSyncing(url, domain, tabId, pageUrl) {
  try {
    for (const [key, value] of new URL(url).searchParams.entries()) {
      if (value.includes('http') && value.length > 20) {
        tabData[tabId].cookieSyncing.push({ from:getHostname(pageUrl), to:domain, param:key, value:value.substring(0,40)+'…', reason:'URL redirect com ID embutido', timestamp:Date.now() });
        return;
      }
      if (SYNC_PARAMS.has(key.toLowerCase()) && value.length >= 8) {
        tabData[tabId].cookieSyncing.push({ from:getHostname(pageUrl), to:domain, param:key, value:value.substring(0,30), reason:'Parâmetro de ID suspeito', timestamp:Date.now() });
        return;
      }
    }
  } catch {}
}

const SEC_HEADERS = {
  'content-security-policy':    { name:'Content-Security-Policy (CSP)',    importance:'critical', attack:'XSS',              what:'Define quais scripts podem ser carregados. Sem ele, código JS injetado por atacante tem controle total da página.' },
  'x-frame-options':            { name:'X-Frame-Options',                  importance:'high',     attack:'Clickjacking',     what:'Impede que a página seja embutida em iframe. Sem ele, atacantes podem sobrepor elementos invisíveis para enganar cliques.' },
  'x-content-type-options':     { name:'X-Content-Type-Options',           importance:'medium',   attack:'MIME Sniffing',     what:'Impede que o browser adivinhe o tipo de arquivo. Um .txt malicioso poderia ser executado como JavaScript.' },
  'strict-transport-security':  { name:'HSTS',                             importance:'high',     attack:'SSL Stripping/MITM',what:'Força HTTPS. Sem ele, um atacante em posição de interceptação pode rebaixar a conexão para HTTP e ler tudo.' },
  'referrer-policy':            { name:'Referrer-Policy',                  importance:'medium',   attack:'Vazamento de URL',  what:'Controla o que é enviado ao navegar para outro site. URLs com tokens ou dados sensíveis podem vazar.' },
  'permissions-policy':         { name:'Permissions-Policy',               importance:'medium',   attack:'Acesso a hardware', what:'Restringe câmera, microfone e geolocalização. Sem ele, scripts de terceiros podem solicitar essas permissões.' },
  'cross-origin-opener-policy': { name:'Cross-Origin-Opener-Policy (COOP)',importance:'low',      attack:'Cross-Origin',      what:'Isola o contexto da janela. Protege contra ataques que exploram compartilhamento de memória entre origens.' },
};

const TECH_FROM_HEADERS = [
  { header:'server',           pattern:/nginx/i,        cat:'Servidor Web', name:'Nginx' },
  { header:'server',           pattern:/apache/i,       cat:'Servidor Web', name:'Apache' },
  { header:'server',           pattern:/iis/i,          cat:'Servidor Web', name:'Microsoft IIS' },
  { header:'server',           pattern:/cloudflare/i,   cat:'Servidor Web', name:'Cloudflare' },
  { header:'server',           pattern:/litespeed/i,    cat:'Servidor Web', name:'LiteSpeed' },
  { header:'server',           pattern:/openresty/i,    cat:'Servidor Web', name:'OpenResty' },
  { header:'x-powered-by',     pattern:/php/i,          cat:'Linguagem',    name:'PHP' },
  { header:'x-powered-by',     pattern:/asp\.net/i,     cat:'Framework',    name:'ASP.NET' },
  { header:'x-powered-by',     pattern:/express/i,      cat:'Framework',    name:'Express.js (Node.js)' },
  { header:'x-powered-by',     pattern:/next\.js/i,     cat:'Framework',    name:'Next.js' },
  { header:'x-powered-by',     pattern:/django/i,       cat:'Framework',    name:'Django (Python)' },
  { header:'x-powered-by',     pattern:/rails/i,        cat:'Framework',    name:'Ruby on Rails' },
  { header:'x-generator',      pattern:/wordpress/i,    cat:'CMS',          name:'WordPress' },
  { header:'x-generator',      pattern:/drupal/i,       cat:'CMS',          name:'Drupal' },
  { header:'x-generator',      pattern:/joomla/i,       cat:'CMS',          name:'Joomla' },
  { header:'x-shopify-stage',  pattern:/.*/,            cat:'E-commerce',   name:'Shopify' },
  { header:'x-wix-request-id', pattern:/.*/,            cat:'CMS',          name:'Wix' },
  { header:'x-drupal-cache',   pattern:/.*/,            cat:'CMS',          name:'Drupal' },
  { header:'x-wordpress-cache',pattern:/.*/,            cat:'CMS',          name:'WordPress' },
  { header:'cf-cache-status',  pattern:/.*/,            cat:'CDN/Proxy',    name:'Cloudflare' },
  { header:'x-amz-cf-id',      pattern:/.*/,            cat:'CDN/Proxy',    name:'Amazon CloudFront' },
  { header:'x-varnish',        pattern:/.*/,            cat:'CDN/Proxy',    name:'Varnish Cache' },
  { header:'x-cache',          pattern:/fastly/i,       cat:'CDN/Proxy',    name:'Fastly' },
];

browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    const { tabId, url, responseHeaders, type } = details;
    if (tabId < 0 || !tabData[tabId] || !responseHeaders) return {};
    const pageUrl = tabData[tabId].pageUrl;
    const isMain  = type === 'main_frame';
    const isThird = isThirdParty(url, pageUrl);
    const domain  = getHostname(url);

    const headerMap = {};
    for (const h of responseHeaders) headerMap[h.name.toLowerCase()] = h.value || '';

    if (isMain) {
      const result = {};
      for (const [key, info] of Object.entries(SEC_HEADERS)) {
        result[key] = { ...info, present: key in headerMap, value: headerMap[key]?.substring(0,100) || null };
      }
      tabData[tabId].securityHeaders = result;
    }

    if (isMain || !isThird) {
      for (const rule of TECH_FROM_HEADERS) {
        const val = headerMap[rule.header];
        if (val && rule.pattern.test(val)) {
          const cat = rule.cat;
          if (!tabData[tabId].techStack[cat]) tabData[tabId].techStack[cat] = new Set();
          tabData[tabId].techStack[cat].add(rule.name);
        }
      }
    }

    for (const h of responseHeaders) {
      const name = h.name.toLowerCase();
      if (name === 'set-cookie') {
        const raw = h.value || '';
        const isSession = !raw.toLowerCase().includes('expires=') && !raw.toLowerCase().includes('max-age=');
        const obj = { domain, raw:raw.substring(0,120), isThirdParty:isThird, isSession, timestamp:Date.now() };
        if (isThird) tabData[tabId].cookies.thirdParty.push(obj);
        else         tabData[tabId].cookies.firstParty.push(obj);
        if (isSession) tabData[tabId].cookies.session.push(obj);
        else           tabData[tabId].cookies.persistent.push(obj);
      }
      if (name === 'strict-transport-security') {
        const m = (h.value||'').match(/max-age=(\d+)/i);
        if (m && parseInt(m[1]) > 31536000)
          tabData[tabId].cookies.supercookies.push({ type:'HSTS Supercookie', domain, detail:h.value });
      }
      if (name === 'etag' && isThird)
        tabData[tabId].cookies.supercookies.push({ type:'ETag Supercookie', domain, detail:(h.value||'').substring(0,50) });
    }
    return {};
  },
  { urls:['<all_urls>'] }, ['responseHeaders']
);

function calculatePrivacyScore(data) {
  let score = 100;
  score -= Math.min(Object.keys(data.thirdPartyDomains).length * 3, 30);
  score -= Math.min(data.cookies.thirdParty.length * 5, 20);
  if (data.fingerprinting.canvas)       score -= 15;
  if (data.fingerprinting.webgl)        score -= 15;
  if (data.fingerprinting.audioContext) score -= 10;
  score -= Math.min(data.cookieSyncing.length  * 10, 20);
  score -= Math.min(data.cookies.supercookies.length * 10, 20);
  score -= Math.min(data.hijacking.length      * 20, 40);
  if (data.securityHeaders) {
    const vals = Object.values(data.securityHeaders);
    score -= vals.filter(h => !h.present && h.importance==='critical').length * 10;
    score -= vals.filter(h => !h.present && h.importance==='high').length     * 5;
  }
  return Math.max(0, Math.round(score));
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender?.tab ? sender.tab.id : message.tabId;
  switch (message.type) {
    case 'FINGERPRINT_DETECTED':
      if (tabData[tabId]) tabData[tabId].fingerprinting[message.api] = true; break;
    case 'STORAGE_DATA':
      if (tabData[tabId]) tabData[tabId].storage = message.data; break;
    case 'HIJACKING_DETECTED':
      if (tabData[tabId]) tabData[tabId].hijacking.push(message.data); break;
    case 'TECH_STACK':
      if (tabData[tabId] && message.data) {
        for (const [cat, items] of Object.entries(message.data)) {
          if (!tabData[tabId].techStack[cat]) tabData[tabId].techStack[cat] = new Set();
          for (const item of items) tabData[tabId].techStack[cat].add(item);
        }
      }
      break;
    case 'GET_DATA': {
      const data = tabData[message.tabId];
      if (data) {
        const s = { ...data, techStack: Object.fromEntries(Object.entries(data.techStack||{}).map(([k,v])=>[k,[...v]])) };
        s.privacyScore = calculatePrivacyScore(s);
        sendResponse({ success:true, data:s });
      } else { sendResponse({ success:false }); }
      return true;
    }
  }
  return true;
});
