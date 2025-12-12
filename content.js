// Rate limit function calls
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Check if an element should be ignored
function isExcluded(el) {
  // Ignore scripts, styles, inputs, images, etc.
  const tag = el.tagName.toLowerCase();
  if (['script', 'style', 'noscript', 'img', 'svg', 'iframe', 'input', 'textarea', 'select', 'button'].includes(tag)) {
    return true;
  }

  if (el.id === 'textflex-ui' || el.offsetParent === null) {
    return true;
  }
  return false;
}

// Get all text elements within a specific root node
function getTextElements(root = document.body) {

  const elements = [];

  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (isExcluded(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  const candidates = root.querySelectorAll('p, span, div, li, a, h1, h2, h3, h4, h5, h6, td, th, label, blockquote, pre, code');
  return Array.from(candidates).filter(el => !isExcluded(el));
}

// Restore original styles
function clearFontSizes() {
  const elements = document.querySelectorAll('[data-textflex-modified]');
  elements.forEach(el => {
    if (el.dataset.textflexOriginalSize) {
      el.style.fontSize = '';
      el.style.lineHeight = '';
      el.style.transition = '';
      delete el.dataset.textflexModified;
    }
  });
}

// Apply scaling
function applyScaling(root = document.body) {
  if (!window.textflexCurrentScale || window.textflexCurrentScale === 1) return;

  const scale = window.textflexCurrentScale;
  const elements = getTextElements(root);

  elements.forEach(el => {
    // 1. Capture Original State
    if (!el.dataset.textflexOriginalSize) {
      const computed = window.getComputedStyle(el);
      const fontSize = parseFloat(computed.fontSize);
      const lineHeight = parseFloat(computed.lineHeight); // might be NaN or "normal"

      // Filter out tiny text or invalid readings to prevent breaking icons/layout
      if (!fontSize || fontSize === 0) return;

      el.dataset.textflexOriginalSize = fontSize;
      if (!isNaN(lineHeight)) {
        el.dataset.textflexOriginalLineHeight = lineHeight;
      }
    }

    // 2. Mark as modified so we can track it
    el.dataset.textflexModified = "true";

    // 3. Apply Maths
    const originalSize = parseFloat(el.dataset.textflexOriginalSize);

    el.style.transition = 'font-size 0.2s ease, line-height 0.2s ease';
    el.style.fontSize = `${originalSize * scale}px`;

    if (el.dataset.textflexOriginalLineHeight) {
      const originalLH = parseFloat(el.dataset.textflexOriginalLineHeight);
      el.style.lineHeight = `${originalLH * scale}px`;
    } else {
      // Fallback for "normal" line-height to ensure readability when zoomed
      el.style.lineHeight = "1.5em";
    }
  });
}

window.textflexCurrentScale = 1;

// --- Main Execution Flow ---

// 1. Initial Load
chrome.storage.sync.get(['textflexDomainScales'], (data) => {
  const domain = window.location.hostname;
  const domainScales = data.textflexDomainScales || {};
  const savedScale = domainScales[domain];

  if (typeof savedScale === 'number' && savedScale !== 1) {
    window.textflexCurrentScale = savedScale;
    applyScaling(); // Initial run
  }
});

// 2. Message Listener
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'setFontSize') {
    window.textflexCurrentScale = msg.scale;
    // We don't need to "clear" everything, just re-apply. 
    // New scale replaces old inline styles instantly.
    if (msg.scale === 1) {
      clearFontSizes();
    } else {
      applyScaling();
    }
  }
  if (msg.action === 'resetFontSize') {
    window.textflexCurrentScale = 1;
    clearFontSizes();
  }
});

// 3. Optimized MutationObserver
const debouncedScale = debounce(() => {
  if (window.textflexCurrentScale && window.textflexCurrentScale !== 1) {
    applyScaling();
  }
}, 500); // Wait 500ms after DOM stops changing

const observer = new MutationObserver((mutations) => {
  // Quick check: did anything meaningful change?
  let shouldUpdate = false;
  for (const m of mutations) {
    if (m.addedNodes.length > 0) {
      shouldUpdate = true;
      break;
    }
  }
  if (shouldUpdate) {
    debouncedScale();
  }
});

observer.observe(document.body, { childList: true, subtree: true });