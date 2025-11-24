import React, { useState, useEffect } from "react";

const AutofillUI = ({ domain, targetInput, onClose, onFill }) => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.runtime.sendMessage(
      { action: "getPasswordsByDomain", domain },
      (response) => {
        setLoading(false);
        if (response && response.vaultData) {
          setPasswords([]);
        }
      }
    );
  }, [domain]);

  const handleFill = (password) => {
    onFill({
      username: password.username || password.email || "",
      password: password.password || "",
    });
  };

  const handleOpenExtension = () => {
    chrome.runtime.sendMessage({ action: "openPopup" });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2147483647,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            Passman
          </h3>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "20px",
              padding: "0",
              color: "#666",
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            Loading passwords...
          </div>
        ) : passwords.length > 0 ? (
          <div>
            <p style={{ marginBottom: "12px", fontSize: "14px", color: "#666" }}>
              Select a password for {domain}:
            </p>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {passwords.map((password, index) => (
                <button
                  key={index}
                  onClick={() => handleFill(password)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginBottom: "8px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f9fafb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  <div style={{ fontWeight: 500, marginBottom: "4px" }}>
                    {password.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {password.username || password.email || "No username"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: "16px", fontSize: "14px", color: "#666" }}>
              No passwords found for {domain}.
            </p>
            <button
              onClick={handleOpenExtension}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 500,
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#2563eb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#3b82f6")
              }
            >
              Open Passman
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutofillUI;

