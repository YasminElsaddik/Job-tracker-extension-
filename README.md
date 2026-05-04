# Job-tracker-extension-
A Chrome extension that logs job applications to Notion in one click. Supports LinkedIn, Ashby, Greenhouse, and Y Combinator. Uses Claude AI to auto-extract job title, company, location, salary, and role summary. Open source so add your own API keys and start tracking.
Built by [Yasmin](https://github.com/YasminElsaddik) because job applications get lost across emails, LinkedIn's "Applied" tab, and browser history. This keeps everything in one clean Notion table.

---

## What it does

- Reads the job listing page you're currently on
- Uses Claude AI (claude-haiku) to extract: job title, company, location type, salary range, company website, and a summary of the job description
- Creates a new row in your Notion database automatically
- Sets status to "Applied" and logs today's date
- Works on LinkedIn, Ashby, Y combinator, and Greenhouse

---

## Setup

### 1. Notion database

Create a Notion database with these exact column names and types:

| Column | Type |
|---|---|
| Position | Title |
| Company | Text |
| Status | Select (options: Applied, Response, Interview Scheduled, Rejected) |
| Application Date | Date |
| Location Type | Select (options: Remote, Hybrid, On-site) |
| Salary range | Text |
| Company Website | URL |
| Job Description | Text |

Then:
- Go to `notion.so/profile/integrations` → create a new integration called "Job Tracker"
- Copy the secret token (starts with `ntn_...`)
- Open your database → `···` menu → Connections → add your integration
- Copy your database ID from the URL (the string before `?v=`)

### 2. Anthropic API key

- Go to `console.anthropic.com`
- Add billing credit (minimum $5 — lasts a very long time at ~$0.002 per extraction)
- Go to API Keys → Create Key → copy it

### 3. Configure the extension

Open `background.js` and fill in your keys at the top:

```javascript
const CONFIG = {
  anthropicKey: "YOUR_ANTHROPIC_API_KEY",
  notionToken: "YOUR_NOTION_TOKEN",
  notionDatabaseId: "YOUR_NOTION_DATABASE_ID"
};
```

### 4. Load into Chrome

1. Go to `chrome://extensions`
2. Turn on "Developer mode" (top right toggle)
3. Click "Load unpacked" → select this folder
4. Pin the extension to your toolbar

---

## How to use

1. Open any job listing on LinkedIn, Ashby, or Greenhouse
2. Click the Job Tracker icon in your Chrome toolbar
3. Click "Log this job"
4. Check your Notion database — the row appears in a few seconds

---

## Adding more job sites

To support additional job boards, add the domain to two places in `manifest.json`:

```json
"host_permissions": [
  "https://*.newjobsite.com/*"
],
"content_scripts": [
  {
    "matches": ["https://*.newjobsite.com/*"]
  }
]
```

And add it to the `SUPPORTED_SITES` object in `popup.js`:

```javascript
const SUPPORTED_SITES = {
  "linkedin.com": "LinkedIn",
  "ashbyhq.com": "Ashby",
  "greenhouse.io": "Greenhouse",
  "newjobsite.com": "New Job Site"
};
```

---

## Contributing

Contributions are welcome! Some ideas if you want to build on this:

- Support for more job boards (Lever, Workday, Indeed, etc.)
- Auto-detect if you've already logged a job (duplicate prevention)
- A status update shortcut — right-click a Notion row to move it to "Interview Scheduled"
- A popup dashboard showing your application stats

To contribute: fork the repo, make your changes, and open a pull request. Please test on at least one job listing before submitting.

---

## Cost

The Anthropic API costs roughly $0.001–0.003 per job extraction. Logging 100 jobs costs about $0.20.

---

## License

MIT — free to use, modify, and share.
