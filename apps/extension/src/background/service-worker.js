chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPasswords") {
    chrome.storage.local.get(["vault-storage"], (result) => {
      const vaultData = result["vault-storage"];
      sendResponse({ vaultData });
    });
    return true;
  }

  if (request.action === "getPasswordsByDomain") {
    const { domain } = request;
    chrome.storage.local.get(["vault-storage"], async (result) => {
      const vaultData = result["vault-storage"];
      if (vaultData) {
        sendResponse({ vaultData, domain });
      } else {
        sendResponse({ vaultData: null, domain });
      }
    });
    return true;
  }

  if (request.action === "fillCredentials") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "fillForm",
          credentials: request.credentials,
        });
      }
    });
    return true;
  }

  if (request.action === "openPopup") {
    chrome.action.openPopup();
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    // Handle OAuth callback - Google redirects to base URL format: https://<extension-id>.chromiumapp.org/
    const extensionId = chrome.runtime.id;
    const expectedRedirectUrl = `https://${extensionId}.chromiumapp.org/`;
    if (tab.url.startsWith(expectedRedirectUrl)) {
      chrome.storage.local.set({ pending_auth_url: tab.url }, () => {
        chrome.tabs.remove(tabId, () => {
          // Show notification to user
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/passman.png",
            title: "Passman",
            message: "Login successful! Click the extension icon to continue.",
            priority: 2,
          });
        });
      });
      return;
    }

    chrome.tabs
      .sendMessage(tabId, {
        action: "pageLoaded",
        url: tab.url,
      })
      .catch(() => {});
  }
});
