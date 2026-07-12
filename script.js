document.addEventListener('DOMContentLoaded', () => {
  const revealEls = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => observer.observe(el));

  document.querySelectorAll('.stat').forEach((el, i) => {
    el.style.animationDelay = `${0.3 + i * 0.08}s`;
  });

  // Entity card (Ventures + Projects) pop-and-stay + particle generation
  document.querySelectorAll('.entity-card').forEach(card => {
    const layer = card.querySelector('.particle-layer');
    if (layer) {
      const count = 14;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        p.className = 'particle';
        const left = Math.random() * 100;
        const duration = 3 + Math.random() * 3;
        const delay = Math.random() * 5;
        const drift = (Math.random() * 30 - 15).toFixed(0) + 'px';
        p.style.left = `${left}%`;
        p.style.animationDuration = `${duration}s`;
        p.style.animationDelay = `${delay}s`;
        p.style.setProperty('--drift', drift);
        layer.appendChild(p);
      }
    }

    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-project]') && card.hasAttribute('data-project')) {
        // let the project-open handler (in projects.html) run instead of just popping
      }
      const alreadyPopped = card.classList.contains('popped');
      document.querySelectorAll('.entity-card.popped').forEach(c => {
        if (c !== card) c.classList.remove('popped');
      });
      card.classList.toggle('popped', !alreadyPopped);
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.entity-card')) {
      document.querySelectorAll('.entity-card.popped').forEach(c => c.classList.remove('popped'));
    }
  });

  // Clicking outside any venture card clears the popped state
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.venture-card')) {
      document.querySelectorAll('.venture-card.popped').forEach(c => c.classList.remove('popped'));
    }
  });
});

/* ===== Viewer count widget (auto-incrementing) =====
   Every hour, a random number between 1-20 is added automatically.
   Persisted in localStorage so it keeps climbing across visits. */
(function () {
  const COUNT_KEY = 'arnav_viewer_count';
  const TIME_KEY = 'arnav_viewer_last_update';
  const HOUR_MS = 60 * 60 * 1000;

  function getCount() {
    const stored = localStorage.getItem(COUNT_KEY);
    return stored === null ? 0 : parseInt(stored, 10);
  }

  function renderCount() {
    const el = document.getElementById('viewerNum');
    if (el) el.textContent = getCount().toLocaleString();
  }

  function maybeIncrement() {
    const now = Date.now();
    const last = parseInt(localStorage.getItem(TIME_KEY), 10) || 0;
    const elapsed = now - last;

    if (last === 0) {
      // first time ever loading — just start the clock, no increment yet
      localStorage.setItem(TIME_KEY, now);
      return;
    }

    if (elapsed >= HOUR_MS) {
      const hoursPassed = Math.floor(elapsed / HOUR_MS);
      let newCount = getCount();
      for (let i = 0; i < hoursPassed; i++) {
        newCount += Math.floor(Math.random() * 20) + 1; // random 1-20
      }
      localStorage.setItem(COUNT_KEY, newCount);
      localStorage.setItem(TIME_KEY, now);
    }
  }

  maybeIncrement();
  document.addEventListener('DOMContentLoaded', renderCount);

  // also check every few minutes in case the tab is left open long-term
  setInterval(() => {
    maybeIncrement();
    renderCount();
  }, 5 * 60 * 1000);
})();

/* ===== AUM ticker (auto-incrementing, USD -> INR) =====
   Every hour, a random $2-10 is added to the base USD figure,
   then converted to INR automatically at a fixed rate. */
(function () {
  const USD_KEY = 'arnav_aum_usd';
  const TIME_KEY = 'arnav_aum_last_update';
  const HOUR_MS = 60 * 60 * 1000;
  const BASE_USD = 248900;
  const USD_TO_INR = 83.4; // approximate fixed conversion rate

  function getUSD() {
    const stored = localStorage.getItem(USD_KEY);
    return stored === null ? BASE_USD : parseFloat(stored);
  }

  function renderAUM() {
    const usdEl = document.getElementById('aumUSD');
    const inrEl = document.getElementById('aumINR');
    if (!usdEl || !inrEl) return;

    const usd = getUSD();
    const inr = usd * USD_TO_INR;

    usdEl.textContent = '$' + Math.round(usd).toLocaleString('en-US');
    inrEl.textContent = '₹' + Math.round(inr).toLocaleString('en-IN');
  }

  function maybeIncrementAUM() {
    const now = Date.now();
    const last = parseInt(localStorage.getItem(TIME_KEY), 10) || 0;
    const elapsed = now - last;

    if (last === 0) {
      localStorage.setItem(TIME_KEY, now);
      return;
    }

    if (elapsed >= HOUR_MS) {
      const hoursPassed = Math.floor(elapsed / HOUR_MS);
      let usd = getUSD();
      for (let i = 0; i < hoursPassed; i++) {
        usd += Math.random() * (10 - 2) + 2; // random $2-10
      }
      localStorage.setItem(USD_KEY, usd);
      localStorage.setItem(TIME_KEY, now);
    }
  }

  maybeIncrementAUM();
  document.addEventListener('DOMContentLoaded', renderAUM);

  setInterval(() => {
    maybeIncrementAUM();
    renderAUM();
  }, 5 * 60 * 1000);
})();

/* ===== First-visit name capture + webhook =====
   Shown only once per browser (localStorage flag). Discloses on-screen
   that IP + basic network details will be stored before sending.
   Replace WEBHOOK_URL with your real Discord webhook URL. */
(function () {
  const SEEN_KEY = 'arnav_name_captured';
  const WEBHOOK_URL ='https://discord.com/api/webhooks/1523202142343528551/yo-PHLxsAqV0nUBjE6N31HuMqE6jHh4zUtLPSWrJbbuZ4mAL8gGMmzn9k1EReeTyyChw';

  const overlay = document.getElementById('nameModalOverlay');
  if (!overlay) return; // only runs on pages that include the modal (index.html)

  if (localStorage.getItem(SEEN_KEY)) return;

  overlay.classList.add('show');

  const input = document.getElementById('nameModalInput');
  const submitBtn = document.getElementById('nameModalSubmit');

  submitBtn.addEventListener('click', async () => {
    const name = input.value.trim();
    if (!name) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    let ip = 'unknown';
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      ip = ipData.ip;
    } catch (e) {
      // IP lookup failed, continue anyway
    }

    const payload = {
      content: null,
      embeds: [{
        title: 'New site visitor',
        color: 0x22e0ff,
        fields: [
          { name: 'Name', value: name, inline: true },
          { name: 'IP Address', value: ip, inline: true },
          { name: 'User Agent', value: navigator.userAgent.slice(0, 200) },
          { name: 'Language', value: navigator.language },
          { name: 'Screen', value: `${screen.width}x${screen.height}` },
          { name: 'Referrer', value: document.referrer || 'Direct' }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // webhook failed silently, don't block the visitor
    }

    localStorage.setItem(SEEN_KEY, '1');
    localStorage.setItem('arnav_visitor_name', name);
    overlay.classList.remove('show');
  });
})();