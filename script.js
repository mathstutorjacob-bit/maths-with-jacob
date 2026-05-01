/* ──────────────────────────────────────────────────────────────────────
   Maths with Jacob — form logic
   - Manages dynamic "tutee" blocks (add / remove)
   - Reveals the suburb field when "Your place" is selected
   - Submits the form to a Google Apps Script web app endpoint
   ────────────────────────────────────────────────────────────────────── */

/* ============================================================
   1. CONFIG  ── replace this with your deployed Apps Script URL
   ============================================================ */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxuKQ2aKwYbzpdR20Y-9DrpM0aqy2jVdlZwm3ETwWY_q7509dfKw8jLRxfQtcEN3cr2/exec';


/* ─── Element refs ─── */
const tuteeTemplate   = document.getElementById('tutee-template');
const tuteesContainer = document.getElementById('tutees-container');
const addTuteeBtn     = document.getElementById('add-tutee');
const form            = document.getElementById('eoi-form');
const statusEl        = document.getElementById('status');
const submitBtn       = document.getElementById('submit-btn');
const successPanel    = document.getElementById('success-panel');
const resubmitLink    = document.getElementById('resubmit-link');
const subUrbWrap      = document.getElementById('suburb-wrap');
const suburbInput     = document.getElementById('suburb');
const locationRadios  = form.querySelectorAll('input[name="location"]');

let tuteeCounter = 0;


/* ─── Tutee block helpers ──────────────────────────────────── */

function addTuteeBlock() {
  tuteeCounter += 1;
  const node = tuteeTemplate.content.firstElementChild.cloneNode(true);

  // Each tutee's "progression" radios need a unique name so
  // selecting an option in tutee 2 doesn't deselect tutee 1.
  node.querySelectorAll('input[type="radio"][data-tutee-field="progression"]')
      .forEach(r => { r.name = `progression-${tuteeCounter}`; });

  // Tag the block with its index for later collection
  node.dataset.index = tuteeCounter;

  // Wire up the remove button
  const removeBtn = node.querySelector('.remove-tutee');
  removeBtn.addEventListener('click', () => {
    node.remove();
    refreshTuteeNumbers();
  });

  tuteesContainer.appendChild(node);
  refreshTuteeNumbers();
}

function refreshTuteeNumbers() {
  const blocks = tuteesContainer.querySelectorAll('[data-tutee]');
  blocks.forEach((block, idx) => {
    const numEl = block.querySelector('.tutee-block__number');
    if (numEl) numEl.textContent = idx + 1;

    // Only show "Remove" if there's more than one block
    const removeBtn = block.querySelector('.remove-tutee');
    if (removeBtn) removeBtn.hidden = blocks.length <= 1;
  });
}

/* Start with one tutee block */
addTuteeBlock();
addTuteeBtn.addEventListener('click', addTuteeBlock);


/* ─── Conditional "suburb" field ───────────────────────────── */

function updateSuburbVisibility() {
  const yoursSelected = document.getElementById('loc-yours').checked;
  subUrbWrap.hidden = !yoursSelected;
  suburbInput.required = yoursSelected;
  if (!yoursSelected) suburbInput.value = '';
}

locationRadios.forEach(r => r.addEventListener('change', updateSuburbVisibility));


/* ─── Collect form data ────────────────────────────────────── */

function collectData() {
  const fd = new FormData(form);

  const tutees = Array.from(tuteesContainer.querySelectorAll('[data-tutee]')).map(block => {
    const get = (field) => {
      const el = block.querySelector(`[data-tutee-field="${field}"]`);
      return el ? el.value.trim() : '';
    };
    const getRadio = (field) => {
      const el = block.querySelector(`[data-tutee-field="${field}"]:checked`);
      return el ? el.value : '';
    };
    return {
      name:        get('name'),
      age:         get('age'),
      yearLevel:   get('yearLevel'),
      progression: getRadio('progression'),
      notes:       get('notes')
    };
  });

  return {
    contactName: (fd.get('contactName') || '').trim(),
    email:       (fd.get('email') || '').trim(),
    phone:       (fd.get('phone') || '').trim(),
    callTimes:   (fd.get('callTimes') || '').trim() || 'Anytime',
    location:    fd.get('location') || '',
    suburb:      (fd.get('suburb') || '').trim(),
    tutees:      tutees,
    submittedAt: new Date().toISOString()
  };
}


/* ─── Validation ──────────────────────────────────────────── */

function validate(data) {
  if (!data.contactName) return 'Please enter your name.';
  if (!data.email)       return 'Please enter your email address.';

  for (let i = 0; i < data.tutees.length; i++) {
    const t = data.tutees[i];
    const label = data.tutees.length > 1 ? `Student ${i + 1}` : 'the student';
    if (!t.name)        return `Please enter a name for ${label}.`;
    if (!t.age)         return `Please enter an age for ${label}.`;
    if (!t.yearLevel)   return `Please pick a year level for ${label}.`;
    if (!t.progression) return `Please indicate where ${label} is working at the moment.`;
  }

  if (!data.location)    return 'Please pick a preferred location.';
  if (data.location === 'Your place' && !data.suburb)
    return 'Please tell me which suburb your place is in.';

  return null;
}


/* ─── Submission ──────────────────────────────────────────── */

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.className = 'status';
  statusEl.textContent = '';

  const data = collectData();
  const error = validate(data);
  if (error) {
    statusEl.classList.add('status--error');
    statusEl.textContent = error;
    return;
  }

  if (APPS_SCRIPT_URL.startsWith('PASTE_')) {
    statusEl.classList.add('status--error');
    statusEl.textContent = 'Form not yet configured. (Site owner: paste your Apps Script URL into script.js.)';
    console.error('APPS_SCRIPT_URL has not been set in script.js');
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = 'Sending…';

  try {
    /* We deliberately do NOT set Content-Type. The browser will use
       text/plain;charset=UTF-8 which avoids a CORS preflight that
       Apps Script web apps don't always handle gracefully. The Apps
       Script reads the raw body via e.postData.contents. */
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      redirect: 'follow'
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { result: 'unknown' }; }

    if (parsed.result === 'success') {
      form.hidden = true;
      successPanel.hidden = false;
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      throw new Error(parsed.error || 'Unknown error');
    }
  } catch (err) {
    console.error(err);
    statusEl.classList.add('status--error');
    statusEl.textContent = 'Sorry — something went wrong sending your message. Please try again in a minute.';
  } finally {
    submitBtn.disabled = false;
  }
});

/* "Submit again" link in the success panel */
resubmitLink.addEventListener('click', (e) => {
  e.preventDefault();
  successPanel.hidden = true;
  form.hidden = false;
  form.reset();
  // Reset tutees to a single block
  tuteesContainer.innerHTML = '';
  tuteeCounter = 0;
  addTuteeBlock();
  updateSuburbVisibility();
  statusEl.textContent = '';
  statusEl.className = 'status';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
