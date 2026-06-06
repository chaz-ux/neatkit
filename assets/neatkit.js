/* ============================================================
   NEATKIT.TOOLS — Shared Utilities
   ============================================================ */

// ── TOAST ──────────────────────────────────────────────────
function nkToast(msg, duration = 2200) {
  const existing = document.querySelector('.nk-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'nk-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, duration);
}

// ── COPY TO CLIPBOARD ──────────────────────────────────────
async function nkCopy(text, btn = null, successMsg = 'Copied!') {
  try {
    await navigator.clipboard.writeText(text);
    nkToast(successMsg);
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied';
      btn.style.borderColor = 'var(--success)';
      btn.style.color = 'var(--success)';
      setTimeout(() => { btn.textContent = orig; btn.style.borderColor = ''; btn.style.color = ''; }, 1800);
    }
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    nkToast(successMsg);
  }
}

// ── FILE SIZE FORMATTER ────────────────────────────────────
function nkFormatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// ── NUMBER FORMATTER ───────────────────────────────────────
function nkFormatNum(n, decimals = 4) {
  if (isNaN(n) || n === null) return '—';
  if (Math.abs(n) >= 1e12 || (Math.abs(n) < 0.00001 && n !== 0)) return n.toExponential(3);
  return parseFloat(n.toPrecision(decimals + 2)).toLocaleString(undefined, { maximumSignificantDigits: decimals + 2 });
}

// ── DRAG & DROP SETUP ──────────────────────────────────────
function nkSetupDropZone(zoneEl, onFile, accept = null) {
  zoneEl.addEventListener('dragover', e => { e.preventDefault(); zoneEl.classList.add('drag-over'); });
  zoneEl.addEventListener('dragleave', e => { if (!zoneEl.contains(e.relatedTarget)) zoneEl.classList.remove('drag-over'); });
  zoneEl.addEventListener('drop', e => {
    e.preventDefault(); zoneEl.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (accept && !accept.some(t => file.type === t || file.name.endsWith(t.replace('*','')))) {
      nkToast('Unsupported file type'); return;
    }
    onFile(file);
  });
}

// ── LOADING STATE ──────────────────────────────────────────
function nkSetLoading(btn, loading, loadingText = 'Processing...') {
  if (loading) {
    btn._origText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
    btn.style.opacity = '0.7';
  } else {
    btn.textContent = btn._origText || btn.textContent;
    btn.disabled = false;
    btn.style.opacity = '';
  }
}

// ── I18N SKELETON ──────────────────────────────────────────
// Full implementation: load /locales/{lang}.json and replace data-i18n attrs
const nkI18n = {
  lang: navigator.language?.split('-')[0] || 'en',
  strings: {},
  async load(lang) {
    try {
      const r = await fetch(`/locales/${lang}.json`);
      if (!r.ok) return;
      this.strings = await r.json();
      this.apply();
    } catch { /* fallback to English */ }
  },
  t(key) { return this.strings[key] || key; },
  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (this.strings[key]) el.textContent = this.strings[key];
    });
  }
};

// ── SEO: UPDATE HEAD DYNAMICALLY ──────────────────────────
function nkSEO({ title, desc, path }) {
  document.title = title + ' — Neatkit';
  document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title + ' — Neatkit');
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', 'https://neatkit.tools' + path);
}

// ── DEBOUNCE ───────────────────────────────────────────────
function nkDebounce(fn, ms = 120) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── INIT STRUCTURED DATA (JSON-LD) ────────────────────────
function nkStructuredData(toolName, desc, url) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": toolName,
    "description": desc,
    "url": "https://neatkit.tools" + url,
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Web",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "author": { "@type": "Organization", "name": "Neatkit" }
  });
  document.head.appendChild(script);
}
