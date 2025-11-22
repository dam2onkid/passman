chrome.runtime.onInstalled.addListener(() => {
  console.log("Passman extension installed");
});

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
    // Handle OAuth callback
    if (tab.url.includes("/auth/callback")) {
      console.log("[Service Worker] OAuth callback detected:", tab.url);
      chrome.storage.local.set({ pending_auth_url: tab.url }, () => {
        console.log("[Service Worker] Stored pending_auth_url");
        chrome.tabs.remove(tabId, () => {
          console.log("[Service Worker] Closed OAuth tab");
          // Show notification to user
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/passman.png",
            title: "Passman",
            message: "Login successful! Click the extension icon to continue.",
            priority: 2
          }, (notificationId) => {
            console.log("[Service Worker] Notification created:", notificationId);
          });
        });
      });
      return;
    }

    chrome.tabs.sendMessage(tabId, {
      action: "pageLoaded",
      url: tab.url,
    }).catch(() => {
      console.log("Content script not ready yet");
    });
  }
});

