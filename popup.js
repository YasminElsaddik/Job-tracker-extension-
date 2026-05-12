const SUPPORTED_SITES = {
  "linkedin.com": "LinkedIn",
  "ashbyhq.com": "Ashby",
  "greenhouse.io": "Greenhouse",
  "workatastartup.com": "Y Combinator"
};

function getSiteName(url) {
  for (const [domain, name] of Object.entries(SUPPORTED_SITES)) {
    if (url.includes(domain)) return name;
  }
  return null;
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const siteName = getSiteName(tab.url);
  const siteInfo = document.getElementById("site-info");
  const actionArea = document.getElementById("action-area");
  const status = document.getElementById("status");

  if (siteName) {
    siteInfo.innerHTML = `<span class="site-badge">${siteName}</span>`;
  } else {
    siteInfo.innerHTML = `
      <div style="background: var(--color-bg-subtle, #f5f5f3); border-radius: 8px; padding: 10px 12px; margin-bottom: 14px;">
        <p style="font-size: 12px; color: #555; margin: 0 0 2px;">Site not auto-detected</p>
        <p style="font-size: 11px; color: #999; margin: 0;">May be powered by Ashby, Greenhouse, or Lever</p>
      </div>`;
  }

  const buttonLabel = siteName ? "Log this job" : "Log anyway";

  actionArea.innerHTML = `
    <button id="logBtn">${buttonLabel}</button>
    <div style="text-align:center; margin-top: 12px;">
      <a href="#" id="settingsLink" style="font-size:12px; color:#aaa; text-decoration:none;">Settings</a>
    </div>`;

  document.getElementById("settingsLink").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ action: "openOptions" });
  });

  document.getElementById("logBtn").addEventListener("click", async () => {
    const btn = document.getElementById("logBtn");
    btn.disabled = true;
    status.className = "loading";
    status.textContent = "Reading page...";

    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText
      });

      const pageText = result.result;
      const pageUrl = tab.url;

      status.textContent = "Extracting job details...";

      chrome.runtime.sendMessage(
        { action: "logJob", pageText, pageUrl },
        (response) => {
          if (response.success) {
            status.className = "success";
            status.textContent = "Saved to Notion!";
            btn.textContent = "Logged ✓";
          } else {
            status.className = "error";
            status.textContent = "Error: " + response.error;
            btn.disabled = false;
            btn.textContent = buttonLabel;
          }
        }
      );
    } catch (err) {
      status.className = "error";
      status.textContent = "Could not read page. Try refreshing.";
      btn.disabled = false;
    }
  });
}

init();