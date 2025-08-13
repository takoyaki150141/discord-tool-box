// SPDX-License-Identifier: AGPL-3.0-only
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "login") {
    document.body.appendChild(document.createElement("iframe")).contentWindow.localStorage.token = `"${message.token}"`;
    location.href = "/channels/@me";
  }
  if (message.action === "getToken") {
    let token = null;
    try {
      token = localStorage.getItem("token")?.replace(/"/g, "");
    } catch {}
    if (!token) {
      let wpRequire;
      window.webpackChunkdiscord_app.push([
        [Math.random()],
        {},
        (req) => {
          wpRequire = req;
        }
      ]);
      for (let m in wpRequire.c) {
        try {
          let mod = wpRequire.c[m].exports;
          if (mod && typeof mod === "object") {
            for (let key in mod) {
              if (mod[key] && typeof mod[key].getToken === "function") {
                token = mod[key].getToken();
              }
            }
          }
        } catch {}
      }
    }
    browser.runtime.sendMessage({
      token: token || "Token not found"
    });
  }

});
