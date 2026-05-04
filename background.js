chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  }
});

async function getConfig() {
  const stored = await chrome.storage.local.get([
    "notionToken",
    "notionDatabaseId",
    "anthropicKey"
  ]);

  if (!stored.notionToken || !stored.notionDatabaseId || !stored.anthropicKey) {
    throw new Error("Setup incomplete. Click the extension icon and open Settings.");
  }

  return stored;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "logJob") {
    handleLogJob(message.pageText, message.pageUrl)
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (message.action === "openOptions") {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }
});

async function handleLogJob(pageText, pageUrl) {
  const config = await getConfig();
  const duplicate = await checkDuplicate(pageUrl, config);
  if (duplicate) {
    throw new Error("Already logged this job on " + duplicate);
  }
  const jobData = await extractWithClaude(pageText, pageUrl, config);
  await saveToNotion(jobData, pageUrl, config);
  return jobData;
}

async function checkDuplicate(pageUrl, config) {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${config.notionDatabaseId}/query`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        filter: {
          property: "Job URL",
          url: { equals: pageUrl }
        }
      })
    }
  );

  const data = await response.json();
  if (data.results && data.results.length > 0) {
    const date = data.results[0].properties["Application Date"]?.date?.start;
    return date || "unknown date";
  }
  return null;
}

async function extractWithClaude(pageText, pageUrl, config) {
  const prompt = `Extract job application details from the following job listing page text. Return ONLY valid JSON with no markdown, no backticks, no explanation.

Return this exact structure:
{
  "job_title": "exact job title",
  "company_name": "company name",
  "location_type": "Remote" or "Hybrid" or "On-site" or "Unknown",
  "salary_range": "salary range as written, or empty string if not mentioned",
  "company_website": "company website URL if mentioned, otherwise empty string",
  "job_description": "a 3-5 sentence summary of the role and key requirements"
}

Page URL: ${pageUrl}

Page text:
${pageText.slice(0, 8000)}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("Claude API error: " + err);
  }

  const data = await response.json();
  const raw = data.content[0].text;
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

async function saveToNotion(jobData, pageUrl, config) {
  const today = new Date().toISOString().split("T")[0];

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    },
    body: JSON.stringify({
      parent: { database_id: config.notionDatabaseId },
      properties: {
        "Position": {
          title: [{ text: { content: jobData.job_title || "" } }]
        },
        "Company": {
          rich_text: [{ text: { content: jobData.company_name || "" } }]
        },
        "Status": {
          select: { name: "Applied" }
        },
        "Application Date": {
          date: { start: today }
        },
        "Location Type": {
          select: { name: jobData.location_type || "Unknown" }
        },
        "Salary range": {
          rich_text: [{ text: { content: jobData.salary_range || "" } }]
        },
        "Company Website": {
          url: jobData.company_website || null
        },
        "Job Description": {
          rich_text: [{ text: { content: jobData.job_description || "" } }]
        },
        "Job URL": {
          url: pageUrl || null
        }
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error("Notion error: " + JSON.stringify(err));
  }

  return response.json();
}