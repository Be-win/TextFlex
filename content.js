// Helper: get all text elements
function getTextElements(root = document.body) {
  return Array.from(root.querySelectorAll('p, span, div, li, a, h1, h2, h3, h4, h5, h6'));
}

// Remove all inline font-size styles set by the extension
function clearFontSizes() {
  getTextElements().forEach(el => {
    if (el.dataset.textflexOriginalSize) {
      el.style.fontSize = '';
      el.style.transition = '';
      delete el.dataset.textflexOriginalSize;
    }
  });
}

// Set font size based on the default computed size
function setFontSize(scale) {
  getTextElements().forEach(el => {
    // Always get the computed style from the page as it loads
    const computed = window.getComputedStyle(el).fontSize;
    if (!el.dataset.textflexOriginalSize) {
      el.dataset.textflexOriginalSize = computed;
    }
    const original = parseFloat(el.dataset.textflexOriginalSize);
    el.style.transition = 'font-size 0.05s linear'; // much faster transition
    el.style.fontSize = (original * scale) + 'px';
  });
}

// Reset font size to default
function resetFontSize() {
  getTextElements().forEach(el => {
    if (el.dataset.textflexOriginalSize) {
      el.style.fontSize = '';
      el.style.transition = '';
      delete el.dataset.textflexOriginalSize;
    }
  });
}

window.textflexCurrentScale = 1;

// Helper: get domain
function getDomain() {
  return window.location.hostname;
}

// On page load, check for saved scale for this domain
chrome.storage.sync.get(['textflexDomainScales'], (data) => {
  const domain = getDomain();
  const domainScales = data.textflexDomainScales || {};
  const savedScale = domainScales[domain];
  if (typeof savedScale === 'number' && savedScale !== 1) {
    window.textflexCurrentScale = savedScale;
    clearFontSizes();
    setFontSize(savedScale);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'setFontSize') {
    window.textflexCurrentScale = msg.scale;
    clearFontSizes(); // Remove all previous scaling
    setFontSize(msg.scale); // Apply new scaling from default
  }
  if (msg.action === 'resetFontSize') {
    window.textflexCurrentScale = 1;
    resetFontSize();
  }
});

// MutationObserver for dynamic content
const observer = new MutationObserver(() => {
  if (window.textflexCurrentScale && window.textflexCurrentScale !== 1) {
    clearFontSizes();
    setFontSize(window.textflexCurrentScale);
  }
});
observer.observe(document.body, { childList: true, subtree: true });