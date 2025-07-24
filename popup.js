let currentScale = 1.00;
let extensionEnabled = true;
let currentDomain = null;

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function updateDisplay() {
  document.getElementById("scaleDisplay").textContent = `${currentScale.toFixed(2)}x`;
  document.getElementById("scaleSlider").value = currentScale;
  document.getElementById("toggleExtension").checked = extensionEnabled;
  setControlsEnabled(extensionEnabled);
}

function setControlsEnabled(enabled) {
  document.getElementById("increase").disabled = !enabled;
  document.getElementById("decrease").disabled = !enabled;
  document.getElementById("scaleSlider").disabled = !enabled;
  document.getElementById("resetBtn").disabled = !enabled;
}

function sendScaleToContent(scale) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { action: 'setFontSize', scale });
  });
}

function sendResetToContent() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { action: 'resetFontSize' });
  });
}

function saveSettings() {
  if (!currentDomain) return;
  chrome.storage.sync.get(['textflexDomainScales'], (data) => {
    const domainScales = data.textflexDomainScales || {};
    domainScales[currentDomain] = currentScale;
    chrome.storage.sync.set({ textflexDomainScales: domainScales, textflexEnabled: extensionEnabled });
  });
}

function loadSettings(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    currentDomain = getDomainFromUrl(tab.url);
    chrome.storage.sync.get(['textflexDomainScales', 'textflexEnabled'], (data) => {
      const domainScales = data.textflexDomainScales || {};
      if (currentDomain && typeof domainScales[currentDomain] === 'number') {
        currentScale = domainScales[currentDomain];
      }
      if (typeof data.textflexEnabled === 'boolean') extensionEnabled = data.textflexEnabled;
      cb();
    });
  });
}

document.getElementById("increase").addEventListener("click", () => {
  if (currentScale < 2.0) {
    currentScale += 0.02;
    currentScale = Math.round(currentScale * 100) / 100;
    updateDisplay();
    if (extensionEnabled) sendScaleToContent(currentScale);
    saveSettings();
  }
});

document.getElementById("decrease").addEventListener("click", () => {
  if (currentScale > 0.5) {
    currentScale -= 0.02;
    currentScale = Math.round(currentScale * 100) / 100;
    updateDisplay();
    if (extensionEnabled) sendScaleToContent(currentScale);
    saveSettings();
  }
});

document.getElementById("scaleSlider").addEventListener("input", (e) => {
  currentScale = parseFloat(e.target.value);
  updateDisplay();
  if (extensionEnabled) sendScaleToContent(currentScale);
  saveSettings();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  currentScale = 1.00;
  updateDisplay();
  sendResetToContent();
  saveSettings();
});

document.getElementById("toggleExtension").addEventListener("change", (e) => {
  extensionEnabled = e.target.checked;
  updateDisplay();
  if (!extensionEnabled) {
    sendResetToContent();
    saveSettings();
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.reload(tab.id);
    });
  } else {
    sendScaleToContent(currentScale);
    saveSettings();
  }
});

loadSettings(updateDisplay);