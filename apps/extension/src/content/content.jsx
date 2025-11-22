import React from "react";
import ReactDOM from "react-dom/client";
import AutofillUI from "./autofill-ui";
import "./content.css";

const PASSMAN_ICON_CLASS = "passman-autofill-icon";
const PASSMAN_CONTAINER_ID = "passman-autofill-container";

let autofillRoot = null;
let autofillContainer = null;

function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

function detectPasswordFields() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  const emailInputs = document.querySelectorAll('input[type="email"]');
  const textInputs = document.querySelectorAll(
    'input[type="text"][name*="user"], input[type="text"][name*="login"], input[type="text"][name*="email"]'
  );

  return {
    passwordInputs: Array.from(passwordInputs),
    usernameInputs: Array.from([...emailInputs, ...textInputs]),
  };
}

function injectPassmanIcon(inputElement) {
  if (inputElement.dataset.passmanInjected) return;

  inputElement.dataset.passmanInjected = "true";

  const icon = document.createElement("div");
  icon.className = PASSMAN_ICON_CLASS;
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  `;

  icon.style.position = "absolute";
  icon.style.right = "8px";
  icon.style.top = "50%";
  icon.style.transform = "translateY(-50%)";
  icon.style.cursor = "pointer";
  icon.style.zIndex = "10000";
  icon.style.padding = "4px";
  icon.style.display = "flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
  icon.style.borderRadius = "4px";
  icon.style.transition = "background-color 0.2s";

  icon.addEventListener("mouseenter", () => {
    icon.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
  });

  icon.addEventListener("mouseleave", () => {
    icon.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
  });

  icon.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showAutofillModal(inputElement);
  });

  const parent = inputElement.parentElement;
  const computedStyle = window.getComputedStyle(parent);

  if (computedStyle.position === "static") {
    parent.style.position = "relative";
  }

  parent.appendChild(icon);
}

function showAutofillModal(inputElement) {
  const domain = getDomainFromUrl(window.location.href);

  if (!autofillContainer) {
    autofillContainer = document.createElement("div");
    autofillContainer.id = PASSMAN_CONTAINER_ID;
    document.body.appendChild(autofillContainer);

    const shadowRoot = autofillContainer.attachShadow({ mode: "open" });
    const modalRoot = document.createElement("div");
    shadowRoot.appendChild(modalRoot);

    autofillRoot = ReactDOM.createRoot(modalRoot);
  }

  chrome.runtime.sendMessage(
    { action: "getPasswordsByDomain", domain },
    (response) => {
      if (response && autofillRoot) {
        autofillRoot.render(
          <AutofillUI
            domain={domain}
            targetInput={inputElement}
            onClose={closeAutofillModal}
            onFill={(credentials) => fillCredentials(inputElement, credentials)}
          />
        );
      }
    }
  );
}

function closeAutofillModal() {
  if (autofillRoot) {
    autofillRoot.render(null);
  }
}

function fillCredentials(targetInput, credentials) {
  const form = targetInput.closest("form");

  if (form) {
    const usernameInput = form.querySelector(
      'input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="login"], input[type="text"][name*="email"]'
    );
    const passwordInput = form.querySelector('input[type="password"]');

    if (usernameInput && credentials.username) {
      usernameInput.value = credentials.username;
      usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
      usernameInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (passwordInput && credentials.password) {
      passwordInput.value = credentials.password;
      passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
      passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  } else {
    targetInput.value = credentials.password || credentials.username || "";
    targetInput.dispatchEvent(new Event("input", { bubbles: true }));
    targetInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  closeAutofillModal();
}

function scanAndInjectIcons() {
  const { passwordInputs, usernameInputs } = detectPasswordFields();

  [...passwordInputs, ...usernameInputs].forEach((input) => {
    if (input.offsetParent !== null) {
      injectPassmanIcon(input);
    }
  });
}

const observer = new MutationObserver(() => {
  scanAndInjectIcons();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scanAndInjectIcons);
} else {
  scanAndInjectIcons();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fillForm") {
    const { credentials } = request;
    const { passwordInputs } = detectPasswordFields();

    if (passwordInputs.length > 0) {
      fillCredentials(passwordInputs[0], credentials);
    }
  }

  if (request.action === "pageLoaded") {
    scanAndInjectIcons();
  }
});

