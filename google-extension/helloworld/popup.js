document.getElementById("fetch-text").addEventListener("click", () => {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
  
      // Send message to the content script
      chrome.tabs.sendMessage(activeTab.id, { action: "getText" }, (response) => {
        if (response && response.text) {
          // Send the text to the background script
          chrome.runtime.sendMessage({ action: "sendText", text: response.text });
        }
      });
    });
  });
  