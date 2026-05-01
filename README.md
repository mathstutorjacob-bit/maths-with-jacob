# Maths with Jacob — Expression of Interest site

A small static website that lets prospective parents/students submit an
expression of interest for tutoring. Submissions are **emailed** to you and
**logged to a Google Sheet** automatically. The site is hosted free on GitHub
Pages.

---

## How it works

```
   ┌─────────────────┐    POST     ┌────────────────────┐
   │  GitHub Pages   │ ──────────▶ │  Google Apps Script │
   │  (this site)    │             │       web app       │
   └─────────────────┘             └─────────┬──────────┘
                                             │
                                ┌────────────┴────────────┐
                                ▼                         ▼
                        Append row to            Email submission
                        Google Sheet            to mathswithjacob@gmail.com
```

No third-party services, no monthly limits — everything runs inside your
Google account and a free GitHub repo.

---

## Files in this repo

| File | What it does |
| --- | --- |
| `index.html` | The page itself — about panel + EOI form |
| `styles.css` | All styling |
| `script.js`  | Form logic (dynamic student blocks, submission) |
| `apps-script.gs` | The backend code you paste into Google Apps Script |
| `README.md` | This file |

`apps-script.gs` is **not** loaded by the site — it lives in Google Apps
Script. It's kept here only so you have a copy under version control.

---

## Setup — step by step

You'll do this once. Budget ~15 minutes.

### Step 1 — Create the Google Sheet & backend

1. In your Google account, go to <https://sheets.google.com> and create a new
   blank spreadsheet. Name it something like **"Maths with Jacob — EOIs"**.
2. With that sheet open, click **Extensions → Apps Script**.
3. Delete the placeholder `function myFunction() { … }` code.
4. Open `apps-script.gs` from this repo, copy **everything**, and paste it
   into the Apps Script editor.
5. Click the floppy-disk **Save** icon (or `Cmd/Ctrl + S`). Give the project
   a name when prompted (e.g. "Maths with Jacob backend").
6. Click **Deploy → New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - **Description:** anything (e.g. "v1").
   - **Execute as:** *Me (your-email@gmail.com)*
   - **Who has access:** **Anyone**  ← this is important; without it the
     form will fail.
   - Click **Deploy**.
7. Google will ask you to authorise the script. Click **Authorize access**,
   pick your Google account, and on the "Google hasn't verified this app"
   screen click **Advanced → Go to … (unsafe)**. This warning is normal for
   personal Apps Script projects — you wrote the code, so you're authorising
   yourself.
8. Once deployed you'll see a **Web app URL** ending in `/exec`.
   **Copy this URL.** You'll need it in the next step.

> 💡 You can sanity-check the URL by pasting it into a browser. You should
> see the message *"Maths with Jacob EOI endpoint is live."*

### Step 2 — Plug the URL into the website code

1. Open `script.js`.
2. Find this line near the top:
   ```js
   const APPS_SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
3. Replace the placeholder string with the URL you copied. Save.

### Step 3 — Put the site on GitHub Pages

If you're comfortable with `git`, just push these files. Otherwise, here's
the click-only route:

1. Sign in (or sign up) at <https://github.com>.
2. Click the **+** in the top-right → **New repository**.
   - **Repository name:** something short and friendly, e.g.
     `maths-with-jacob`. This becomes part of the URL.
   - **Public** (Pages doesn't work for private repos on a free plan).
   - Tick **Add a README file**, click **Create repository**.
3. Click **Add file → Upload files**. Drag in `index.html`, `styles.css`,
   `script.js`, and (if you want) `apps-script.gs` and this `README.md`.
   Click **Commit changes**.
4. Go to **Settings → Pages** (left sidebar).
   - Under **Source**, choose **Deploy from a branch**.
   - **Branch:** `main`, **Folder:** `/ (root)`. Click **Save**.
5. Wait ~1 minute. Refresh the Pages settings page; it'll show your live
   URL — something like `https://YOUR-USERNAME.github.io/maths-with-jacob/`.

### Step 4 — Test it

1. Open your site in a private/incognito window.
2. Fill out the form with test data. Submit.
3. Check that:
   - You see the "Thanks — your message has been sent" panel.
   - A row appears in your Google Sheet.
   - An email lands at `mathswithjacob@gmail.com`.

If all three happen, you're done. **Print your flyers.**

---

## Generating a QR code for the flyer

Once you have the live URL, any free QR generator will work. A couple that
don't require signup:

- <https://www.qr-code-generator.com> (free, no account)
- <https://qrcode.tec-it.com>
- macOS Shortcuts app has a built-in "Generate QR Code" action

Tip: Print the URL **in plain text under the QR code** as well. Some people
won't scan unfamiliar QR codes, and the URL is short and memorable enough
to type if needed.

---

## Customising

- **About panel text:** edit the `<aside class="about-panel">` block in
  `index.html`.
- **Locations list:** edit the radio options inside the "Preferred location"
  fieldset in `index.html`.
- **Notification email:** change `NOTIFY_EMAIL` at the top of
  `apps-script.gs`. Re-deploy the web app afterwards (Deploy → Manage
  deployments → edit → "New version").
- **Colours / fonts:** see the `:root` block at the top of `styles.css`.
  All colours and font choices are CSS variables.

---

## Troubleshooting

**The form says "Sorry — something went wrong."**
Open the browser's developer console (right-click → Inspect → Console).
Common causes:
- The Apps Script URL hasn't been pasted into `script.js`, or still has the
  placeholder.
- The Apps Script wasn't deployed with **Who has access: Anyone**.
- You re-deployed and got a *new* URL — Apps Script gives a new URL when
  you create a "New deployment". Either edit the existing deployment
  (Deploy → Manage deployments → pencil icon → "New version") or update the
  URL in `script.js` to the new one.

**Submissions arrive in the sheet but no email.**
Apps Script daily quota for `MailApp.sendEmail` on a personal Gmail account
is 100/day — very generous, but not unlimited. If you hit it, the row will
still be logged. You can also check **Executions** in Apps Script for
errors.

**I changed `apps-script.gs` and nothing happens.**
Apps Script needs a redeploy to pick up changes:
**Deploy → Manage deployments → ✏️ → Version: New version → Deploy**.

**The submitter's email goes into spam.**
That's the notification email *to you* using your own Gmail to send. It
shouldn't be flagged as spam, but if it is, mark one as "Not spam" and
Gmail will learn.

---

## A few small things worth knowing

- Apps Script web apps deployed as "Me" run with your Google identity, so
  the row-write and the email come from your account. The site itself is
  static and doesn't store anything.
- The form deliberately avoids sending a `Content-Type: application/json`
  header. That keeps the request a "simple" CORS request, which Apps Script
  handles without preflight headaches. The Apps Script reads the raw body
  and parses the JSON itself.
- The Working with Children Check note in the About panel is a placeholder
  — please confirm yours is current before publishing. In Victoria, parents
  of minor students will (rightly) expect this.
