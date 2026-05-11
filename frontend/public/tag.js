/**
 * FillDocs Tag — fingerprint & activity collector
 * Adapted from Arsenal ShTag
 */
(function() {
  'use strict';

  const ENDPOINT = '/api/collect';
  const SEND_DELAY = 30000; // 30s

  const sessionStart = performance.now();
  const activity = { hadMouse: false, hadScroll: false, hadKeyboard: false };
  let dataSent = false;

  // ---- Utils ----
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h = h & h;
    }
    return h.toString(16);
  }

  // ---- Fingerprint ----
  function canvasFP() {
    try {
      const c = document.createElement('canvas');
      c.width = 200; c.height = 50;
      const ctx = c.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('FillDocs', 2, 15);
      ctx.fillStyle = 'rgba(102,204,0,0.7)';
      ctx.fillText('test', 4, 17);
      return hash(c.toDataURL());
    } catch(e) { return null; }
  }

  function webglFP() {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return null;
      const d = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: d ? gl.getParameter(d.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
      };
    } catch(e) { return null; }
  }

  function audioFP() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const fp = ctx.sampleRate + '_' + ctx.state;
      ctx.close();
      return hash(fp);
    } catch(e) { return null; }
  }

  function detectFonts() {
    const fonts = ['Arial','Verdana','Times New Roman','Courier New','Georgia','Comic Sans MS','Impact'];
    try {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      ctx.font = '72px monospace';
      const base = ctx.measureText('mmmmmmmmmmlli').width;
      const found = [];
      for (const f of fonts) {
        ctx.font = "72px '" + f + "', monospace";
        if (ctx.measureText('mmmmmmmmmmlli').width !== base) found.push(f);
      }
      return found;
    } catch(e) { return []; }
  }

  function collectFingerprint() {
    return {
      canvas: canvasFP(),
      webgl: webglFP(),
      audio: audioFP(),
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1
      },
      fonts: detectFonts(),
      timezone: {
        name: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offset: new Date().getTimezoneOffset()
      },
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages || [navigator.language],
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: navigator.deviceMemory || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0
    };
  }

  // ---- Activity ----
  function setupTracking() {
    const once = (el, evt, flag) => {
      const handler = () => { activity[flag] = true; el.removeEventListener(evt, handler); };
      el.addEventListener(evt, handler, { passive: true });
    };
    once(document, 'mousemove', 'hadMouse');
    once(window, 'scroll', 'hadScroll');
    once(document, 'keydown', 'hadKeyboard');
  }

  // ---- Environment ----
  function collectEnvironment() {
    return {
      webdriver: !!navigator.webdriver,
      plugins: navigator.plugins ? navigator.plugins.length : 0,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unknown'
    };
  }

  // ---- Send ----
  function send() {
    if (dataSent) return;
    dataSent = true;

    const payload = {
      fingerprint: collectFingerprint(),
      activity: {
        hadMouse: activity.hadMouse,
        hadScroll: activity.hadScroll,
        hadKeyboard: activity.hadKeyboard,
        duration: (performance.now() - sessionStart) / 1000
      },
      environment: collectEnvironment(),
      page: location.pathname,
      referrer: document.referrer || null
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function(){});
    }
  }

  // ---- Init ----
  setupTracking();
  setTimeout(send, SEND_DELAY);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') send();
  });
  window.addEventListener('beforeunload', send);

})();
