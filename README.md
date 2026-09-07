# Job Tracker Extension

A Chrome extension that logs job applications to Notion in one click — and automatically updates your tracker when you get interview invites or rejections via email.

Built by [Yasmin](https://github.com/YasminElsaddik) because job applications get lost across emails, LinkedIn's "Applied" tab, and browser history. This keeps everything in one clean Notion table.

---

## What it does

- Reads the job listing page you're currently on
- Uses Claude AI (claude-haiku) to extract: job title, company, location type, salary range, company website, and a summary of the job description
- Creates a new row in your Notion database automatically
- Sets status to "Applied" and logs today's date
- Works on LinkedIn, Ashby, Greenhouse, and Y Combinator
- Works on any custom careers page powered by Ashby, Greenhouse, or Lever via "Log anyway"
- Checks for duplicates so you never log the same job twice
- **Bonus:** A Gmail script that watches your inbox and automatically updates your Notion status when you get interview invites or rejections

---

## Setup

### 1. Notion database

Create a Notion database with these exact column names and types:

| Column | Type |
|---|---|
| Position | Title |
| Company | Text |
| Status | Select (options: Applied, Interview Scheduled, Rejected) |
| Application Date | Date |
| Location Type | Select (options: Remote, Hybrid, On-site) |
| Salary range | Text |
| Company Website | URL |
| Job Description | Text |
| Job URL | URL |

Then:
- Go to `notion.so/profile/integrations` → create a new integration called "Job Tracker"
- Copy the secret token (starts with `ntn_...`)
- Open your database → `···` menu → Connections → add your integration
- Copy your database ID from the URL (the string before `?v=`)

### 2. Anthropic API key

- Go to `console.anthropic.com`
- Add billing credit (minimum $5 — lasts a very long time at ~$0.002 per extraction)
- Go to API Keys → Create Key → copy it

### 3. Load the extension into Chrome

1. Download or clone this repo
2. Go to `chrome://extensions` in Chrome
3. Turn on "Developer mode" (top right toggle)
4. Click "Load unpacked" → select the extension folder
5. Pin the extension to your toolbar

### 4. Configure your keys

1. Click the Job Tracker icon in your toolbar
2. Click "Settings" at the bottom of the popup
3. Enter your Notion token, database ID, and Anthropic API key
4. Click Save — your keys are stored locally on your device only

---

## How to use

### Logging a job
1. Open any job listing on LinkedIn, Ashby, Greenhouse, or Y Combinator
2. Click the Job Tracker icon in your Chrome toolbar
3. Click "Log this job"
4. Check your Notion database — the row appears in a few seconds

### On unsupported sites
Some companies host their own careers pages powered by Ashby, Greenhouse, or Lever. On these sites the popup will show "Site not auto-detected" — click "Log anyway" to extract and log the job as normal.

---

## Gmail email sync (optional)

Automatically updates your Notion status when you receive interview invites or rejections in Gmail — no manual changes needed.

### Setup

1. Go to `script.google.com` → New project → name it "Job Tracker Email Sync"
2. Delete the default code and paste in the contents of `gmail-sync.js` from this repo
3. Fill in your Anthropic key and Notion token at the top of the file
4. Click the clock icon (Triggers) → Add Trigger:
   - Function: `checkNewEmails`
   - Event source: Time-driven
   - Type: Minutes timer
   - Interval: Every 15 minutes
5. Authorize the script when prompted — click Advanced → Go to Job Tracker Email Sync → Allow

### How it works

- Runs every 15 minutes in the background
- Reads unread emails from the last 24 hours
- Uses Claude AI to detect if an email is job-related and what the status should be
- Finds the matching row in Notion by company name and updates the Status field
- If multiple rows match the same company, adds a "Job Tracker - Review Needed" Gmail label so you can handle it manually
- If no Notion row exists and the email arrived after May 1 2025, creates a new row automatically
- Emails before May 1 2025 are skipped silently

---

## Adding more job sites

Add the domain to two places in `manifest.json`:

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
  "workatastartup.com": "Y Combinator",
  "newjobsite.com": "New Job Site"
};
```

---

## Contributing

Contributions are welcome! Some ideas if you want to build on this:
- A popup dashboard showing your application stats
- Better email matching logic (match by company + job title for more precision)
- A status update shortcut — right-click a Notion row to move it to "Interview Scheduled"

To contribute: fork the repo, make your changes, and open a pull request. Please test on at least one job listing before submitting.

---

## Cost

The Anthropic API costs roughly $0.001–0.003 per job extraction. Logging 100 jobs costs about $0.20. The Gmail sync uses the same API at the same rate — one call per job-related email.

---

## License

MIT — free to use, modify, and share.
