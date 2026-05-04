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

  if (!siteName) {
    siteInfo.innerHTML = `<p class="unsupported">Not a supported job site.<br>Open a LinkedIn, Ashby, or Greenhouse listing.</p>`;
    return;
  }

  siteInfo.innerHTML = `<span class="site-badge">${siteName}</span>`;
  actionArea.innerHTML = `
  <button id="logBtn">Log this job</button>
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
            btn.textContent = "Try again";
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