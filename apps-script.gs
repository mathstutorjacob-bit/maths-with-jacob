/**
 * Maths with Jacob — Expression of Interest backend
 * ──────────────────────────────────────────────────
 * Receives form submissions from the GitHub Pages site,
 * appends a row to this spreadsheet, and emails Jacob.
 *
 * Setup steps are in the README. In short:
 *   1.  Open the Google Sheet you want submissions written to.
 *   2.  Extensions → Apps Script. Replace the default code with this file.
 *   3.  Deploy → New deployment → Web app
 *         · Execute as:    Me
 *         · Who has access: Anyone
 *   4.  Copy the web-app URL it gives you, paste it into script.js
 *       on the website (the APPS_SCRIPT_URL constant).
 *
 * On first submission, the script writes a header row automatically.
 */

const NOTIFY_EMAIL = 'mathswithjacob+eoi@gmail.com';

const HEADERS = [
  'Submitted at',
  'Contact name',
  'Email',
  'Phone',
  'Best contact times',
  '# of students',
  'Student details',
  'Preferred location',
  'Suburb (if "your place")'
];

/**
 * Form POST handler.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // First-run: write headers if the sheet is empty.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length)
           .setFontWeight('bold')
           .setBackground('#f7f1e3');
      sheet.setFrozenRows(1);
    }

    const tuteeText = (data.tutees || []).map((t, i) =>
      `Student ${i + 1}: ${t.name}` +
      `\n  Age: ${t.age}` +
      `\n  Year level: ${t.yearLevel}` +
      `\n  Currently working: ${t.progression}` +
      (t.notes ? `\n  Notes: ${t.notes}` : '')
    ).join('\n\n');

    sheet.appendRow([
      new Date(),
      data.contactName || '',
      data.email || '',
      data.phone || '',
      data.callTimes || '',
      (data.tutees || []).length,
      tuteeText,
      data.location || '',
      data.suburb || ''
    ]);

    // Auto-fit a couple of useful columns
    sheet.autoResizeColumn(2); // Contact name
    sheet.autoResizeColumn(3); // Email

    sendEmail_(data, tuteeText);

    return jsonOut_({ result: 'success' });

  } catch (err) {
    console.error(err);
    return jsonOut_({ result: 'error', error: String(err) });
  }
}

/**
 * Optional: a simple GET endpoint so you can sanity-check the deployment
 * by visiting the URL in a browser.
 */
function doGet() {
  return ContentService
    .createTextOutput('Maths with Jacob EOI endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Sends the notification email to Jacob.
 */
function sendEmail_(data, tuteeText) {
  const subject = `New tutoring EOI — ${data.contactName || 'unknown contact'}`;

  const body =
    `New expression of interest submitted via the website.\n` +
    `─────────────────────────────────────────────\n\n` +
    `Contact: ${data.contactName}\n` +
    `Email: ${data.email}\n` +
    (data.phone     ? `Phone: ${data.phone}\n` : '') +
    `Best times to reach them: ${data.callTimes}\n\n` +
    `Number of students: ${(data.tutees || []).length}\n\n` +
    `${tuteeText}\n\n` +
    `─────────────────────────────────────────────\n` +
    `Preferred location: ${data.location}` +
    (data.suburb ? ` (suburb: ${data.suburb})` : '') + `\n\n` +
    `Submitted: ${new Date().toString()}\n`;

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    body: body,
    replyTo: data.email || NOTIFY_EMAIL
  });
}

/**
 * Helper: return a JSON response.
 */
function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
