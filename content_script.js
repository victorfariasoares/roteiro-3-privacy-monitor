(function () {
  'use strict';
  if (window.self !== window.top) return;

  const detected = { canvas:false, webgl:false, audioContext:false };
  function report(type, payload) { try { browser.runtime.sendMessage({ type, ...payload }); } catch {} }

  // Canvas fingerprinting
  const _toDataURL    = HTMLCanvasElement.prototype.toDataURL;
  const _getImageData = CanvasRenderingContext2D.prototype.getImageData;
  HTMLCanvasElement.prototype.toDataURL = function(...a) {
    if (!detected.canvas) { detected.canvas=true; report('FINGERPRINT_DETECTED',{api:'canvas',method:'toDataURL'}); }
    return _toDataURL.apply(this,a);
  };
  CanvasRenderingContext2D.prototype.getImageData = function(...a) {
    if (!detected.canvas) { detected.canvas=true; report('FINGERPRINT_DETECTED',{api:'canvas',method:'getImageData'}); }
    return _getImageData.apply(this,a);
  };

  // WebGL fingerprinting
  const R=0x9246, V=0x9245;
  function patchWebGL(Ctx) {
    if (!Ctx) return;
    const _gp = Ctx.prototype.getParameter;
    Ctx.prototype.getParameter = function(p) {
      if (!detected.webgl && (p===R||p===V)) { detected.webgl=true; report('FINGERPRINT_DETECTED',{api:'webgl',method:'getParameter'}); }
      return _gp.apply(this,arguments);
    };
  }
  patchWebGL(window.WebGLRenderingContext);
  patchWebGL(window.WebGL2RenderingContext);

  // AudioContext fingerprinting
  const ACtx = window.AudioContext || window.webkitAudioContext;
  if (ACtx) {
    const _osc  = ACtx.prototype.createOscillator;
    const _comp = ACtx.prototype.createDynamicsCompressor;
    ACtx.prototype.createOscillator = function(...a) {
      if (!detected.audioContext) { detected.audioContext=true; report('FINGERPRINT_DETECTED',{api:'audioContext',method:'createOscillator'}); }
      return _osc.apply(this,a);
    };
    ACtx.prototype.createDynamicsCompressor = function(...a) {
      if (!detected.audioContext) { detected.audioContext=true; report('FINGERPRINT_DETECTED',{api:'audioContext',method:'createDynamicsCompressor'}); }
      return _comp.apply(this,a);
    };
  }

  // Web Storage
  function collectStorage() {
    const d = { localStorage:{}, sessionStorage:{}, indexedDB:[] };
    try { for (let i=0;i<localStorage.length;i++) { const k=localStorage.key(i); const v=localStorage.getItem(k)||''; d.localStorage[k]={value:v.substring(0,120),size:v.length}; } } catch {}
    try { for (let i=0;i<sessionStorage.length;i++) { const k=sessionStorage.key(i); const v=sessionStorage.getItem(k)||''; d.sessionStorage[k]={value:v.substring(0,120),size:v.length}; } } catch {}
    if (window.indexedDB && typeof indexedDB.databases==='function') {
      indexedDB.databases().then(dbs => { d.indexedDB=dbs.map(x=>({name:x.name,version:x.version})); report('STORAGE_DATA',{data:d}); }).catch(()=>report('STORAGE_DATA',{data:d}));
    } else { report('STORAGE_DATA',{data:d}); }
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(collectStorage,800));
  else setTimeout(collectStorage,800);

  // Tech Stack detection from DOM
  function detectTechStack() {
    const tech = {};
    function add(cat, name) { if (!tech[cat]) tech[cat]=[]; if (!tech[cat].includes(name)) tech[cat].push(name); }

    // Detect from script sources
    const scripts = [...document.querySelectorAll('script[src]')].map(s => s.src);
    for (const src of scripts) {
      if (/jquery[./]/i.test(src))            add('JavaScript','jQuery');
      if (/react[./\-]/i.test(src))           add('JavaScript','React');
      if (/vue[./\-]/i.test(src))             add('JavaScript','Vue.js');
      if (/angular[./\-]/i.test(src))         add('JavaScript','Angular');
      if (/bootstrap[./\-]/i.test(src))       add('CSS Framework','Bootstrap');
      if (/wp-content|wp-includes/i.test(src))add('CMS','WordPress');
      if (/gtag|google-analytics/i.test(src)) add('Analytics','Google Analytics');
      if (/fbevents|facebook.*pixel/i.test(src)) add('Publicidade','Facebook Pixel');
      if (/hotjar/i.test(src))                add('Analytics','Hotjar');
    }

    // Detect from meta tags
    const generator = document.querySelector('meta[name="generator"]');
    if (generator) {
      const content = generator.content || '';
      if (/wordpress/i.test(content))  add('CMS','WordPress');
      if (/drupal/i.test(content))     add('CMS','Drupal');
      if (/joomla/i.test(content))     add('CMS','Joomla');
      if (/wix/i.test(content))        add('CMS','Wix');
      if (/shopify/i.test(content))    add('E-commerce','Shopify');
      if (/squarespace/i.test(content))add('CMS','Squarespace');
    }

    // Detect from global JS variables
    if (window.jQuery || window.$?.fn?.jquery)  add('JavaScript','jQuery');
    if (window.React)                            add('JavaScript','React');
    if (window.Vue)                              add('JavaScript','Vue.js');
    if (window.angular)                          add('JavaScript','Angular');
    if (window.wp)                               add('CMS','WordPress');
    if (window.Shopify)                          add('E-commerce','Shopify');
    if (window.Wix)                              add('CMS','Wix');
    if (window.gtag || window.ga)               add('Analytics','Google Analytics');
    if (window.fbq)                              add('Publicidade','Facebook Pixel');
    if (window.hj)                               add('Analytics','Hotjar');
    if (window.mixpanel)                         add('Analytics','Mixpanel');
    if (window.amplitude)                        add('Analytics','Amplitude');
    if (window.dataLayer)                        add('Analytics','Google Tag Manager');
    if (window.Intercom)                         add('CRM/Chat','Intercom');
    if (window.HubSpotConversations)             add('CRM/Chat','HubSpot');
    if (window.zE || window.zEmbed)             add('CRM/Chat','Zendesk');
    if (window.Tawk_API)                         add('CRM/Chat','Tawk.to');
    if (window.crisp)                            add('CRM/Chat','Crisp Chat');
    if (window.Stripe)                           add('Pagamento','Stripe');
    if (window.PayPal)                           add('Pagamento','PayPal');

    if (Object.keys(tech).length > 0) report('TECH_STACK', { data: tech });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', detectTechStack);
  else detectTechStack();

  // Hijacking detection
  const SUSPICIOUS = [
    { re:/beef|hook\.js/i,           reason:'Possível BeEF hook (controle de browser)' },
    { re:/xss|inject/i,              reason:'Nome de script suspeito (XSS/inject)' },
    { re:/coinhive|coin-hive|miner/i,reason:'Possível criptominerador' },
    { re:/keylog/i,                  reason:'Possível keylogger' },
  ];
  new MutationObserver(mutations => {
    for (const m of mutations) for (const n of m.addedNodes) {
      if (n.nodeName!=='SCRIPT'||!n.src) continue;
      for (const {re,reason} of SUSPICIOUS) {
        if (re.test(n.src)) { report('HIJACKING_DETECTED',{data:{type:'suspicious_script',src:n.src.substring(0,100),reason,timestamp:Date.now()}}); break; }
      }
    }
  }).observe(document.documentElement,{childList:true,subtree:true});

  const _replace = window.location.replace.bind(window.location);
  window.location.replace = function(url) {
    if (url && !url.startsWith(window.location.origin) && !url.startsWith('/'))
      report('HIJACKING_DETECTED',{data:{type:'suspicious_redirect',target:url.substring(0,100),reason:'Redirecionamento externo via location.replace()',timestamp:Date.now()}});
    return _replace(url);
  };

  const _eval = window.eval; let evalCount = 0;
  window.eval = function(...a) {
    if (++evalCount <= 2) report('HIJACKING_DETECTED',{data:{type:'eval_usage',reason:'eval() detectado — técnica comum em scripts maliciosos',snippet:String(a[0]||'').substring(0,60),timestamp:Date.now()}});
    return _eval.apply(this,a);
  };
})();
