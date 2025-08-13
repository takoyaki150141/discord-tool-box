// SPDX-License-Identifier: AGPL-3.0-only
let toastTimer = null;

function showToast(msg, ms = 1800) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
    toastTimer = null;
  }, ms);
}

function openNameModal(defaultValue, callback) {
  const modal = document.getElementById("nameModal");
  const input = document.getElementById("nameInput");
  modal.style.display = "block";
  input.value = defaultValue || "";
  input.focus();
  const close = () => {
    modal.style.display = "none";
  };
  document.getElementById("nameOk").onclick = () => {
    close();
    callback(input.value.trim() || defaultValue);
  };
  document.getElementById("nameCancel").onclick = close;
  document.getElementById("nameModalBg").onclick = close;
}

function isDiscordUrl(url) {
  return /^https?:\/\/(canary\.|ptb\.)?discord\.com/.test(url);
}
document.getElementById("saveBtn").addEventListener("click", () => {
  browser.tabs.query({
    active: true,
    currentWindow: true
  }).then(tabs => {
    if (!tabs.length || !isDiscordUrl(tabs[0].url)) {
      showToast("Discordを開いてください");
      return;
    }
    browser.tabs.sendMessage(tabs[0].id, {
      action: "getToken"
    });
  });
});
browser.runtime.onMessage.addListener((msg) => {
  if (msg.token && msg.token !== "Token not found") {
    openNameModal("New Account", (name) => {
      if (name) {
        saveAccount(name, msg.token);
        showToast(`保存しました: ${name}`);
      }
    });
  } else {
    showToast("取得できませんでした");
  }
});
async function saveAccount(username, token) {
  let stored = await browser.storage.local.get("accounts");
  let accounts = stored.accounts || [];
  if (!accounts.find(acc => acc.token === token)) {
    accounts.push({
      username,
      token
    });
    await browser.storage.local.set({
      accounts
    });
  }
  renderAccounts();
}
async function renderAccounts() {
  const listEl = document.getElementById("tokenList");
  listEl.innerHTML = "";
  let stored = await browser.storage.local.get("accounts");
  let accounts = stored.accounts || [];

  accounts.forEach((acc, idx) => {
    const div = document.createElement("div");
    div.className = "user-item";

    const loginBtn = document.createElement("button");
    loginBtn.textContent = acc.username;
    loginBtn.className = "username-btn";
    loginBtn.addEventListener("click", () => {
      browser.tabs.query({
        active: true,
        currentWindow: true
      }).then(tabs => {
        if (!tabs.length || !isDiscordUrl(tabs[0].url)) {
          showToast("Discordを開いてください");
          return;
        }
        browser.tabs.sendMessage(tabs[0].id, {
          action: "login",
          token: acc.token
        });
        showToast(`ログイン中: ${acc.username}`);
      });
    });

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "コピー";
    copyBtn.className = "small-btn copy-btn";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(acc.token).then(() => {
        showToast(`コピーしました: ${acc.username}`);
      });
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "削除";
    delBtn.className = "small-btn del-btn";
    delBtn.addEventListener("click", async () => {
      accounts.splice(idx, 1);
      await browser.storage.local.set({
        accounts
      });
      renderAccounts();
      showToast(`削除しました: ${acc.username}`);
    });

    div.appendChild(loginBtn);
    div.appendChild(copyBtn);
    div.appendChild(delBtn);
    listEl.appendChild(div);
  });
}

renderAccounts();
