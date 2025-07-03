let currentScale = 1.00;
let extensionEnabled = true;

function updateDisplay() {
  document.getElementById("scaleDisplay").textContent = `${currentScale.toFixed(2)}x`;
}

function applyScale(scale) {
  if (!extensionEnabled) return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (s) => document.documentElement.style.setProperty('--textflex-scale', s),
      args: [scale]
    });
  });
}

function removeScale() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.documentElement.style.removeProperty('--textflex-scale')
    });
  });
}

document.getElementById("increase").addEventListener("click", () => {
  if (currentScale < 2.0) {
    currentScale += 0.02;
    currentScale = Math.round(currentScale * 100) / 100;
    updateDisplay();
    applyScale(currentScale);
  }
});

document.getElementById("decrease").addEventListener("click", () => {
  if (currentScale > 0.5) {
    currentScale -= 0.02;
    currentScale = Math.round(currentScale * 100) / 100;
    updateDisplay();
    applyScale(currentScale);
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  currentScale = 1.00;
  updateDisplay();
  removeScale();
});

document.getElementById("toggleExtension").addEventListener("change", (e) => {
  extensionEnabled = e.target.checked;
  if (!extensionEnabled) removeScale();
  else applyScale(currentScale);
});

updateDisplay();