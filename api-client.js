(function () {
  "use strict";
  const config = window.LOVAR_CONFIG || {};
  const apiUrl = String(config.API_URL || "").trim();
  let counter = 0;

  function encodePayload(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = "";
    bytes.forEach(function (b) { binary += String.fromCharCode(b); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function call(method, args) {
    return new Promise(function (resolve, reject) {
      if (!apiUrl || apiUrl.indexOf("PASTE_") >= 0) {
        reject(new Error("Store connection is not configured. Check api-config.js."));
        return;
      }
      let url;
      try {
        url = new URL(apiUrl);
        if (url.protocol !== "https:" || !/script\.google\.com$/.test(url.hostname) || !/\/exec$/.test(url.pathname)) {
          throw new Error("API_URL must be a deployed Google Apps Script /exec URL.");
        }
      } catch (err) { reject(err); return; }

      const callbackName = "__lovar_jsonp_" + Date.now() + "_" + (++counter);
      const script = document.createElement("script");
      let finished = false;
      const timeout = window.setTimeout(function () {
        finish(new Error("Google Apps Script timed out. Check deployment access and Script Properties."));
      }, 30000);

      function cleanup() {
        window.clearTimeout(timeout);
        try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }
      function finish(error, result) {
        if (finished) return;
        finished = true;
        cleanup();
        if (error) reject(error); else resolve(result);
      }

      window[callbackName] = function (response) {
        if (!response || response.ok !== true) {
          finish(new Error(response && response.error ? response.error : "Invalid response from Google Sheets."));
        } else finish(null, response.result);
      };
      script.onerror = function () {
        finish(new Error("Could not load the Google Apps Script response. Check that the Web App is deployed for Anyone."));
      };
      url.searchParams.set("rpc", "1");
      url.searchParams.set("origin", window.location.origin);
      url.searchParams.set("callback", callbackName);
      url.searchParams.set("payload", encodePayload({method:String(method), args:Array.isArray(args) ? args : []}));
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  window.LovarApi = { call: call };
})();
