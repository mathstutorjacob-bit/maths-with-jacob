/* ──────────────────────────────────────────────────────────────────────
   Maths with Jacob — form logic
   ────────────────────────────────────────────────────────────────────── */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxuKQ2aKwYbzpdR20Y-9DrpM0aqy2jVdlZwm3ETwWY_q7509dfKw8jLRxfQtcEN3cr2/exec';

/* ─── Element refs ─── */
const tuteeQuickTemplate    = document.getElementById('tutee-quick-template');
const tuteeDetailTemplate   = document.getElementById('tutee-detail-template');
const tuteesQuickContainer  = document.getElementById('tutees-quick-container');
const tuteesDetailContainer = document.getElementById('tutees-detail-container');
const addTuteeBtn           = document.getElementById('add-tutee');
const form                  = document.getElementById('eoi-form');
const formIntro             = document.getElementById('form-intro');
const statusEl              = document.getElementById('status');
const submitBtn             = document.getElementById('submit-btn');
const successPanel          = document.getElementById('success-panel');
const resubmitLink          = document.getElementById('resubmit-link');
const suburbWrap            = document.getElementById('suburb-wrap');
const suburbInput           = document.getElementById('suburb');
const locationRadios        = form.querySelectorAll('input[name="location"]');
const phoneInput            = document.getElementById('phone');
const callTimeWrap          = document.getElementById('call-time-wrap');

let tuteeCounter = 0;

/* ─── Phone → call-time reveal ─── */
function updateCallTimeVisibility() {
  const hasPhone = phoneInput.value.trim() !== '';
  callTimeWrap.hidden = !hasPhone;
  if (!hasPhone) {
    form.querySelectorAll('input[name="callTime"]').forEach(r => { r.checked = false; });
  }
}

phoneInput.addEventListener('input', updateCallTimeVisibility);

/* ─── Tutee block management ─── */

function addTuteeBlock() {
  tuteeCounter += 1;
  const idx = tuteeCounter;

  /* Quick block (section 1) */
  const quickNode = tuteeQuickTemplate.content.firstElementChild.cloneNode(true);
  quickNode.dataset.index = idx;
  quickNode.querySelector('.remove-tutee').addEventListener('click', () => removeTuteeBlock(idx));
  tuteesQuickContainer.appendChild(quickNode);

  /* Detail block (section 2) */
  const detailNode = tuteeDetailTemplate.content.firstElementChild.cloneNode(true);
  detailNode.dataset.index = idx;
  detailNode.querySelectorAll('[data-tutee-field="progression"]')
    .forEach(r => { r.name = `progression-${idx}`; });

  const goalOtherCheck = detailNode.querySelector('[data-tutee-field="goal-other-check"]');
  const goalOtherWrap  = detailNode.querySelector('[data-goal-other-wrap]');
  goalOtherCheck.addEventListener('change', () => {
    goalOtherWrap.hidden = !goalOtherCheck.checked;
  });

  tuteesDetailContainer.appendChild(detailNode);

  refreshTuteeNumbers();
}

function removeTuteeBlock(idx) {
  const quickBlock  = tuteesQuickContainer.querySelector(`[data-index="${idx}"]`);
  const detailBlock = tuteesDetailContainer.querySelector(`[data-index="${idx}"]`);
  if (quickBlock)  quickBlock.remove();
  if (detailBlock) detailBlock.remove();
  refreshTuteeNumbers();
}

function refreshTuteeNumbers() {
  const quickBlocks  = tuteesQuickContainer.querySelectorAll('[data-tutee-quick]');
  const detailBlocks = tuteesDetailContainer.querySelectorAll('[data-tutee-detail]');
  const count = quickBlocks.length;

  quickBlocks.forEach((block, idx) => {
    const numEl = block.querySelector('.tutee-block__number');
    if (numEl) numEl.textContent = idx + 1;
    const removeBtn = block.querySelector('.remove-tutee');
    if (removeBtn) removeBtn.hidden = count <= 1;
  });

  detailBlocks.forEach((block, idx) => {
    const numEl = block.querySelector('.tutee-block__number');
    if (numEl) numEl.textContent = idx + 1;
  });
}

/* Start with one tutee block */
addTuteeBlock();
addTuteeBtn.addEventListener('click', addTuteeBlock);

/* ─── Suburb reveal ─── */
function updateSuburbVisibility() {
  const yoursSelected = document.getElementById('loc-yours').checked;
  suburbWrap.hidden    = !yoursSelected;
  suburbInput.required = yoursSelected;
  if (!yoursSelected) suburbInput.value = '';
}

locationRadios.forEach(r => r.addEventListener('change', updateSuburbVisibility));

/* ─── Collapsible panels ─── */
document.querySelectorAll('.collapsible-panel__toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    const body = document.getElementById(toggle.getAttribute('aria-controls'));
    if (body) body.hidden = expanded;
  });
});

/* ─── Collect form data ─── */
function collectData() {
  const fd = new FormData(form);

  const tutees = Array.from(tuteesQuickContainer.querySelectorAll('[data-tutee-quick]')).map(quickBlock => {
    const idx         = quickBlock.dataset.index;
    const detailBlock = tuteesDetailContainer.querySelector(`[data-index="${idx}"]`);

    const getFrom = (block, field) => {
      if (!block) return '';
      const el = block.querySelector(`[data-tutee-field="${field}"]`);
      return el ? el.value.trim() : '';
    };
    const getRadioFrom = (block, field) => {
      if (!block) return '';
      const el = block.querySelector(`[data-tutee-field="${field}"]:checked`);
      return el ? el.value : '';
    };

    const goals = detailBlock
      ? Array.from(detailBlock.querySelectorAll('[data-tutee-field="goal"]:checked')).map(cb => cb.value)
      : [];
    const goalOtherCheck = detailBlock
      ? detailBlock.querySelector('[data-tutee-field="goal-other-check"]')
      : null;
    if (goalOtherCheck && goalOtherCheck.checked) goals.push('Other');
    const goalOtherText = getFrom(detailBlock, 'goalOtherText');

    return {
      name:          getFrom(quickBlock, 'name'),
      yearLevel:     getFrom(quickBlock, 'yearLevel'),
      progression:   getRadioFrom(detailBlock, 'progression'),
      notes:         getFrom(detailBlock, 'notes'),
      goals:         goals,
      goalOtherText: goalOtherText
    };
  });

  const phone    = (fd.get('phone') || '').trim();
  const callTime = !callTimeWrap.hidden ? (fd.get('callTime') || '') : '';

  return {
    contactName: (fd.get('contactName') || '').trim(),
    email:       (fd.get('email') || '').trim(),
    phone:       phone,
    callTime:    callTime,
    location:    fd.get('location') || '',
    suburb:      (fd.get('suburb') || '').trim(),
    tutees:      tutees,
    submittedAt: new Date().toISOString()
  };
}

/* ─── Validation ─── */
function validate(data) {
  if (!data.contactName) return 'Please enter your name.';
  if (!data.email)       return 'Please enter your email address.';

  for (let i = 0; i < data.tutees.length; i++) {
    const t     = data.tutees[i];
    const label = data.tutees.length > 1 ? `Student ${i + 1}` : 'the student';
    if (!t.name)      return `Please enter a name for ${label}.`;
    if (!t.yearLevel) return `Please pick a year level for ${label}.`;
  }

  if (data.location === 'Your place' && !data.suburb)
    return 'Please tell me which suburb your place is in.';

  return null;
}

/* ─── Submission ─── */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.className   = 'status';
  statusEl.textContent = '';

  const data  = collectData();
  const error = validate(data);
  if (error) {
    statusEl.classList.add('status--error');
    statusEl.textContent = error;
    return;
  }

  if (APPS_SCRIPT_URL.startsWith('PASTE_')) {
    statusEl.classList.add('status--error');
    statusEl.textContent = 'Form not yet configured. (Site owner: paste your Apps Script URL into script.js.)';
    return;
  }

  submitBtn.disabled   = true;
  statusEl.textContent = 'Sending…';

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method:   'POST',
      body:     JSON.stringify(data),
      redirect: 'follow'
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);

    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { result: 'unknown' }; }

    if (parsed.result === 'success') {
      formIntro.hidden    = true;
      form.hidden         = true;
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

/* ─── "Submit again" link ─── */
resubmitLink.addEventListener('click', (e) => {
  e.preventDefault();

  successPanel.hidden = true;
  formIntro.hidden    = false;
  form.hidden         = false;
  form.reset();

  /* Reset tutees */
  tuteesQuickContainer.innerHTML  = '';
  tuteesDetailContainer.innerHTML = '';
  tuteeCounter = 0;
  addTuteeBlock();

  /* Reset call-time */
  callTimeWrap.hidden = true;

  updateSuburbVisibility();
  statusEl.textContent = '';
  statusEl.className   = 'status';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
