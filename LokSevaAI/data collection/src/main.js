import './style.css';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase.js';

// ── Supabase client ────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── KrishiSetu MERN backend URL (for API calls & auth callback) ────
const KRISHISETU_URL = 'http://localhost:5000';
// ── React app URL — always at /app on the backend ────────────────
const KRISHISETU_APP_URL = 'http://localhost:5000/app';
// ── Landing page URL ───────────────────────────────────────────────
const LP_URL = 'http://localhost:5000';

// ── Auth guard ─────────────────────────────────────────────
// Handles two cases:
//  1. User already has a session (returning visitor)
//  2. OAuth redirect: URL has #access_token= hash (first login)
//     → Supabase SDK processes it async via onAuthStateChange
let currentUser = null;

function guardAuth() {
  return new Promise(async (resolve) => {
    // --- DEVELOPMENT MOCK BYPASS ---
    if (window.location.hash.includes('mock_bypass=true')) {
      currentUser = { email: 'farmer@krishisetu.com', id: 'mock-auth-id' };
      history.replaceState(null, '', window.location.pathname);
      resolve(true);
      return;
    }
    
    /* --- PRODUCTION SUPABASE AUTH ---
    // First, check if there's already a session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      currentUser = session.user;
      resolve(true);
      return;
    }

    // If URL has an access_token hash, wait for SIGNED_IN event
    const hasAuthHash = window.location.hash.includes('access_token');

    if (hasAuthHash) {
      // Supabase is processing the hash — listen for auth state change
      const timeout = setTimeout(() => {
        // Timeout after 5s → redirect to LP
        window.location.href = LP_URL;
        resolve(false);
      }, 5000);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          clearTimeout(timeout);
          subscription.unsubscribe();
          currentUser = session.user;
          // Clean up hash from URL without reloading
          history.replaceState(null, '', window.location.pathname);
          resolve(true);
        }
      });
    } else {
      // No session and no hash → not authenticated, send to LP
      window.location.href = LP_URL;
      resolve(false);
    }
    */
  });
}

// ── State ──────────────────────────────────────────────────
const formData = {
  full_name: '',
  phone: '',
  profession: '',
  income_bracket: null,
  domicile: '',
};

// ── Indian states list ─────────────────────────────────────
const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// ── Cell definitions ───────────────────────────────────────
const CELLS = [
  {
    id: 'phone',
    label: '01',
    question: 'Phone number',
    placeholder: '+91 98765 43210',
    type: 'tel',
    key: 'phone',
    validate: (v) => /^[+\d\s\-()]{10,15}$/.test(v.trim()) ? null : 'Enter a valid phone number',
  },
  {
    id: 'profession',
    label: '02',
    question: 'Profession',
    placeholder: 'e.g. Engineer, Teacher…',
    type: 'text',
    key: 'profession',
    validate: (v) => v.trim().length >= 2 ? null : 'Please enter your profession',
  },
  {
    id: 'income',
    label: '03',
    question: 'Annual income (INR)',
    placeholder: 'e.g. 600000',
    type: 'number',
    key: 'income_bracket',
    validate: (v) => v.trim() !== '' && !isNaN(Number(v)) ? null : 'Enter a valid income amount',
  },
  {
    id: 'state',
    label: '04',
    question: 'State / UT',
    placeholder: 'Select your state',
    type: 'select',
    key: 'domicile',
    validate: (v) => v.trim() !== '' ? null : 'Please select your state',
  },
];

// ── Render ─────────────────────────────────────────────────
function render() {
  document.getElementById('app').innerHTML = `
    <!-- ── Name Page ──────────────────────────────── -->
    <div class="page" id="name-page">
      <p class="name-label">Profile Setup</p>
      <div class="card-input-wrap">
        <div class="curved-box" id="name-box">
          <span class="box-question">Please enter your name</span>
          <input
            class="box-input"
            id="name-input"
            type="text"
            placeholder="Your full name…"
            autocomplete="name"
            autofocus
            spellcheck="false"
          />
          <span class="hint">Press Enter to continue</span>
          <div class="error-msg" id="name-error"></div>
        </div>
        <div class="progress-dots" id="name-dots">
          <div class="dot active-dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    </div>

    <!-- ── Cells Page ─────────────────────────────── -->
    <div class="page hidden" id="cells-page">
      <p class="cells-label" id="cells-greeting">Hello —</p>
      <div class="cells-row" id="cells-row">
        ${CELLS.map((cell, i) => buildCell(cell, i)).join('')}
      </div>
      <div class="progress-dots" id="cells-dots">
        <div class="dot done"></div>
        ${CELLS.map((_, i) => `<div class="dot" id="dot-${i}"></div>`).join('')}
      </div>
    </div>

    <!-- ── Success Page ───────────────────────────── -->
    <div class="page hidden" id="success-page">
      <div class="success-icon">
        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h1 class="success-title" id="success-name"></h1>
      <p class="success-sub">Your profile has been saved. Thank you.</p>
    </div>
  `;

  attachNameListeners();
}

// ── Build a single cell HTML ───────────────────────────────
function buildCell(cell, index) {
  const inputHTML = cell.type === 'select'
    ? `<select class="cell-input" id="input-${cell.id}" disabled>
        <option value="">— Select state —</option>
        ${STATES.map(s => `<option value="${s}">${s}</option>`).join('')}
       </select>`
    : `<input
        class="cell-input"
        id="input-${cell.id}"
        type="${cell.type}"
        placeholder="${cell.placeholder}"
        disabled
        spellcheck="false"
        autocomplete="off"
      />`;

  const arrowBefore = index > 0 ? `
    <div class="arrow-between" id="arrow-${index}">
      <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 14h16M16 8l6 6-6 6"/>
      </svg>
    </div>` : '';

  return `
    ${arrowBefore}
    <div class="cell" id="cell-${cell.id}">
      <div class="cell-check">
        <svg viewBox="0 0 16 16"><polyline points="3 8 7 12 13 4"/></svg>
      </div>
      <span class="cell-label">${cell.label}</span>
      <span class="cell-question">${cell.question}</span>
      ${inputHTML}
      <div class="error-msg" id="err-${cell.id}"></div>
    </div>`;
}

// ── Name page listeners ────────────────────────────────────
function attachNameListeners() {
  const input = document.getElementById('name-input');
  const errEl = document.getElementById('name-error');

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim();
      if (val.length < 2) {
        showError(errEl, 'Please enter your full name');
        return;
      }
      hideError(errEl);
      formData.full_name = val;
      transitionToCells(val);
    } else {
      hideError(errEl);
    }
  });
}

// ── Transition: Name → Cells ───────────────────────────────
function transitionToCells(name) {
  const namePage = document.getElementById('name-page');
  const cellsPage = document.getElementById('cells-page');
  const greeting = document.getElementById('cells-greeting');

  greeting.textContent = `Hello, ${name.split(' ')[0]} —`;

  namePage.classList.add('hidden');
  cellsPage.classList.remove('hidden');

  // Stagger reveal of cells
  CELLS.forEach((cell, i) => {
    const el = document.getElementById(`cell-${cell.id}`);
    setTimeout(() => {
      el.classList.add('revealed');
      // Also reveal arrows
      if (i > 0) {
        const arrow = document.getElementById(`arrow-${i}`);
        if (arrow) arrow.classList.add('visible');
      }
    }, 80 + i * 120);
  });

  // Activate first cell
  setTimeout(() => activateCell(0), 600);
}

// ── Activate a cell ────────────────────────────────────────
function activateCell(index) {
  if (index >= CELLS.length) {
    submitToSupabase();
    return;
  }

  const cell = CELLS[index];
  const el = document.getElementById(`cell-${cell.id}`);
  const inputEl = document.getElementById(`input-${cell.id}`);
  const dot = document.getElementById(`dot-${index}`);

  // Remove revealed, add active
  el.classList.remove('revealed');
  el.classList.add('active');
  if (dot) dot.classList.add('active-dot');

  // Enable input
  inputEl.removeAttribute('disabled');
  setTimeout(() => inputEl.focus(), 50);

  // Listen for Enter
  const handler = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = (cell.type === 'select')
        ? inputEl.value
        : inputEl.value;

      const err = cell.validate(val);
      const errEl = document.getElementById(`err-${cell.id}`);

      if (err) {
        showError(errEl, err);
        return;
      }
      hideError(errEl);

      // Save value
      if (cell.key === 'income_bracket') {
        formData[cell.key] = Number(val);
      } else {
        formData[cell.key] = val.trim();
      }

      // Mark completed
      el.classList.remove('active');
      el.classList.add('completed');
      inputEl.setAttribute('disabled', '');
      if (dot) {
        dot.classList.remove('active-dot');
        dot.classList.add('done');
      }

      inputEl.removeEventListener('keydown', handler);
      if (cell.type === 'select') {
        inputEl.removeEventListener('change', selectHandler);
      }

      // Move to next
      activateCell(index + 1);
    }
  };

  // For select, also support change event
  const selectHandler = (e) => {
    if (cell.type === 'select' && e.target.value) {
      // Simulate Enter after selection
      const synth = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      inputEl.dispatchEvent(synth);
    }
  };

  inputEl.addEventListener('keydown', handler);
  if (cell.type === 'select') {
    inputEl.addEventListener('change', selectHandler);
  }
}

// ── Submit to Supabase & Backend ─────────────────────────────────────
async function submitToSupabase() {
  console.log('Submitting to mock store:', formData);

  // --- DEVELOPMENT MOCK BYPASS ---
  // Store form data in local storage so the dashboard can access it
  localStorage.setItem('krishisetu_mock_user', JSON.stringify({
    ...formData,
    email: currentUser?.email || 'farmer@krishisetu.com',
    uid: currentUser?.id || 'mock-id'
  }));

  /* --- PRODUCTION SUPABASE & MONGODB ---
  try {
    const uid = currentUser?.id;
    const email = currentUser?.email;
    const { error } = await supabase
      .from('profiles')
      .upsert([
        {
          ...(uid ? { id: uid } : {}),
          full_name: formData.full_name,
          domicile: formData.domicile,
          profession: formData.profession,
          income_bracket: formData.income_bracket,
          last_known_location: formData.phone,
          is_onboarded: true,
        }
      ]);

    if (error) {
      console.error('Supabase error:', error);
    }

    // Pass data to MongoDB via Express Backend so WhatsApp sync works
    // Also stores email so MongoDB check-email can find returning users
    if (uid) {
       await fetch(`${KRISHISETU_URL}/api/users/upsert`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
               uid: uid,
               email: email,
               full_name: formData.full_name,
               phone: formData.phone,
               profession: formData.profession,
               income_bracket: formData.income_bracket,
               domicile: formData.domicile
           })
       });
    }

  } catch (err) {
    console.error('Network error:', err);
  }
  */

  showSuccess();
}

// ── Show success and redirect ──────────────────────────────
// Data Collection (5173) and MERN (3000) are different origins —
// localStorage is NOT shared. We pass the session tokens in the hash.
// We also pass ?from=datacollection so AuthCallback skips the
// is_onboarded check (we just saved it!) and goes straight to /dashboard.
async function showSuccess() {
  const cellsPage = document.getElementById('cells-page');
  const successPage = document.getElementById('success-page');
  const nameEl = document.getElementById('success-name');

  nameEl.textContent = `All done, ${formData.full_name.split(' ')[0]}.`;

  cellsPage.classList.add('hidden');
  successPage.classList.remove('hidden');

  // Wait briefly, then redirect
  setTimeout(async () => {
    // --- DEVELOPMENT MOCK BYPASS ---
    // Instead of tokens, we just redirect directly to the app bypassing the standard callback
    window.location.href = `${KRISHISETU_APP_URL}/auth/callback?mock_bypass=true&from=datacollection`;

    /* --- PRODUCTION SUPABASE ---
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        // Pass tokens cross-origin via URL hash → MERN AuthCallback handles it
        // ?from=datacollection tells AuthCallback to skip the is_onboarded check
        const hash = [
          `access_token=${session.access_token}`,
          `refresh_token=${session.refresh_token}`,
          `token_type=bearer`,
          `type=signup`,
        ].join('&');
        window.location.href = `${KRISHISETU_URL}/app/auth/callback?from=datacollection#${hash}`;
      } else {
        window.location.href = KRISHISETU_APP_URL;
      }
    } catch {
      window.location.href = KRISHISETU_APP_URL;
    }
    */
  }, 2200);
}

// ── Helpers ────────────────────────────────────────────────
function showError(el, msg) {
  el.textContent = msg;
  el.classList.add('show');
}

function hideError(el) {
  el.classList.remove('show');
}

// ── Boot ───────────────────────────────────────────────────
// Guard auth first, then check if user already exists in MongoDB.
// If yes → redirect straight to the app (skip the form).
// If no  → render the form (new user).
(async () => {
  const ok = await guardAuth();
  if (!ok) return;  // redirected to LP

  // --- DEVELOPMENT MOCK BYPASS ---
  // Completely skip checking if the user already submitted their data since there is no DB
  
  /* --- PRODUCTION MONGODB CHECK ---
  // Check DB: has this user already submitted their data?
  try {
    const email = currentUser?.email;
    if (email) {
      const res = await fetch(
        `${KRISHISETU_URL}/api/users/check-email?email=${encodeURIComponent(email)}`
      );
      if (res.ok) {
        const { exists } = await res.json();
        if (exists) {
          // Returning user — skip the form, pass tokens to React app via /auth/callback
          console.log('Returning user detected (MongoDB) — skipping data collection.');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const hash = [
              `access_token=${session.access_token}`,
              `refresh_token=${session.refresh_token}`,
              `token_type=bearer`,
              `type=recovery`,
            ].join('&');
            window.location.href = `${KRISHISETU_URL}/app/auth/callback#${hash}`;
          } else {
            window.location.href = KRISHISETU_APP_URL;
          }
          return;
        }
      }
    }
  } catch (err) {
    console.warn('DB check failed, showing form anyway:', err);
  }
  */

  render();

  // Pre-fill name from Google auth metadata
  if (currentUser) {
    const googleName =
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      '';
    if (googleName) {
      formData.full_name = googleName;
      const nameInput = document.getElementById('name-input');
      if (nameInput) {
        nameInput.value = googleName;
        nameInput.placeholder = googleName;
      }
    }
  }
})();
