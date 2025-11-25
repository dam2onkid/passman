<div align="center">
  <img src="public/passman.png" alt="Passman Logo" width="128" height="128">

[![Watch Demo](https://img.shields.io/badge/Watch-Demo-red?style=flat-square&logo=youtube)](https://www.youtube.com/watch?v=HCZa7gmznTI)

# Passman

**The First Blockchain-Powered Password Manager**

_Your Passwords, Secured by Sui, Seal, and Walrus._

[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Sui](https://img.shields.io/badge/Sui-Blockchain-4285F4?style=flat-square&logo=sui)](https://sui.io/)
[![zkLogin](https://img.shields.io/badge/zkLogin-Enabled-green?style=flat-square)](https://sui.io/zklogin)
[![Walrus](https://img.shields.io/badge/Walrus-Storage-orange?style=flat-square)](https://walrus.site/)
[![Seal](https://img.shields.io/badge/Seal-Encryption-purple?style=flat-square)](https://docs.mystenlabs.com/)

</div>

## 🔐 Introduction

**Passman** represents the next evolution in digital security. By leveraging the **Sui** blockchain, **Walrus** decentralized storage, and **Seal** encryption, Passman offers a password management solution that is truly decentralized, secure, and user-friendly. Say goodbye to centralized data breaches and hello to complete ownership of your digital identity.

## 🏗️ Core Technologies

Passman is built upon a powerful stack of decentralized technologies designed to work seamlessly together:

### 💧 Sui Blockchain

The backbone of Passman. Sui provides the immutable ledger for your vault's metadata and access controls.

- **Ownership**: You own your data on-chain.
- **Speed**: Instant finality ensuring your updates are saved immediately.
- **Security**: Battle-tested consensus protecting your access rights.

### 🆔 zkLogin (Zero-Knowledge Login)

Web3 security with a Web2 experience.

- **Seamless Onboarding**: Login with your existing Google account. No need to manage complex seed phrases or private keys.
- **Privacy**: Leverages zero-knowledge proofs to verify your identity without revealing sensitive information on-chain.
- **Non-Custodial**: Even though you use Google to login, your keys are derived locally—Passman never sees your credentials.

### 🛡️ Seal Encryption

Advanced cryptographic protection for your secrets.

- **Threshold Cryptography**: Utilizes Mysten Labs' Seal technology to encrypt your data.
- **Distributed Trust**: Your encryption keys are never held by a single entity.
- **Client-Side**: All encryption and decryption happen directly on your device.

### 🦭 Walrus Decentralized Storage

Robust and efficient storage for your encrypted data.

- **Decentralized Blobs**: Your encrypted password vaults are stored as blobs on the Walrus decentralized storage network.
- **Cost-Effective**: Efficient storage for large encrypted payloads without clogging the main chain.
- **High Availability**: Redundant storage ensures your data is always accessible.

## 🛡️ Smart Vault Protection (Safe)

Passman introduces the **Safe** module - a unified security layer that protects your vault with two powerful mechanisms:

### 🤝 Social Recovery

Never lose access to your vault, even if you lose your keys.

- **Multi-Signature Protection**: Designate trusted guardians (friends, family, or other devices) who can help you recover access.
- **Threshold-Based**: Set a minimum number of guardian approvals required (e.g., 2 out of 3 guardians).
- **Decentralized Trust**: No single guardian can access your vault alone - they must collaborate.
- **Flexible Management**: Update your guardian list and threshold at any time.
- **Secure Process**: Guardians vote on-chain to approve recovery to a new owner address.

**How it works:**

1. Set up guardians when creating a Safe (or update them later)
2. If you lose access, request recovery through your guardians
3. Guardians vote to approve the new owner address
4. Once the threshold is met, ownership transfers automatically

### ⏰ Deadman Switch

Ensure your digital legacy is passed on to loved ones.

- **Automatic Inheritance**: Designate a beneficiary who inherits your vault after a period of inactivity.
- **Customizable Period**: Set the inactivity period (minimum 7 days) that suits your needs.
- **Heartbeat System**: Regular activity automatically resets the timer - no manual action needed.
- **Manual Heartbeat**: Explicitly record activity to reset the timer if desired.
- **Secure Transfer**: After the inactivity period expires, only the designated beneficiary can claim ownership.
- **Flexible Updates**: Change beneficiary or inactivity period at any time.

**How it works:**

1. Set up a beneficiary and inactivity period when creating a Safe
2. Your activity automatically resets the deadman timer
3. If inactive for the specified period, your beneficiary can claim the vault
4. Ownership transfers on-chain, giving them full control

### 🔐 Flash Loan Pattern

The Safe uses an innovative "flash loan" pattern to maintain security while allowing vault operations:

- **Temporary Access**: Borrow your vault capability (Cap) within a transaction.
- **Guaranteed Return**: The Cap must be returned before the transaction completes.
- **No Compromise**: Maintains all Safe protections while enabling normal vault operations.
- **Seamless UX**: Users interact with their vault normally - the Safe works behind the scenes.

### 🎛️ Flexible Configuration

- **Optional Features**: Enable social recovery, deadman switch, both, or neither.
- **Update Anytime**: Modify guardians, threshold, beneficiary, or inactivity period as needed.
- **Disable Safe**: Remove Safe protection and return to direct vault ownership at any time.
- **Event Tracking**: All Safe actions emit events for transparency and auditability.

## ⚙️ Technical Architecture

How it all comes together:

1.  **Authentication**: User logs in via **Google** using **zkLogin**. A temporary session key is created, and a stable Sui address is derived.
2.  **Encryption**: When you save a password, **Seal** encrypts the data client-side using threshold keys.
3.  **Storage**: The encrypted blob is uploaded to **Walrus**, returning a unique Blob ID.
4.  **Consensus**: The Blob ID and metadata are stored in a `Vault` object on **Sui**, linking your identity to your data.
5.  **Protection**: Optionally wrap your vault in a `Safe` to enable social recovery and/or deadman switch features.

## ✨ Key Features

- **100% Decentralized**: Zero reliance on centralized servers.
- **Smart Vault Protection (Safe)**: Advanced security mechanisms to protect your vault:
  - **Social Recovery**: Multi-signature recovery through trusted guardians
  - **Deadman Switch**: Automatic ownership transfer after owner inactivity
- **Vault Sharing**: Securely share password vaults with other users on the network.
- **Cross-Device Sync**: Access your passwords anywhere by simply logging into your Google account.
- **Modern UI**: A beautiful interface built with Next.js, React, and TailwindCSS.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/passman.git
    cd passman
    ```

2.  **Install dependencies**

    ```bash
    pnpm install
    ```

3.  **Configure Environment**
    Create a `.env.local` file based on `.env.example` and add your Enoki API key and other configuration.

4.  **Run Development Server**

    ```bash
    pnpm dev
    ```

5.  **Explore**
    Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📂 Project Structure

```
passman/
├── apps/
│   ├── extension/       # Browser extension (Chrome/Edge)
│   │   ├── src/
│   │   │   ├── background/    # Service worker
│   │   │   ├── components/    # React components
│   │   │   ├── content/        # Content scripts & autofill UI
│   │   │   ├── hooks/          # Custom hooks (useZkLogin, useSeal, etc.)
│   │   │   ├── lib/            # Core logic (Enoki, Sui providers)
│   │   │   ├── popup/          # Extension popup UI
│   │   │   └── store/          # State management (Zustand)
│   │   └── manifest.json
│   ├── move/            # Sui Move smart contracts
│   │   ├── sources/     # Contract source files
│   │   │   ├── vault.move   # Core vault & item management
│   │   │   ├── safe.move    # Social recovery & deadman switch
│   │   │   ├── share.move   # Secure vault sharing
│   │   │   └── utils.move   # Helper utilities
│   │   └── tests/       # Contract tests
│   └── web/             # Next.js web application
│       └── src/
│           ├── app/            # Next.js App Router
│           ├── components/     # React components
│           ├── hooks/          # Custom hooks
│           ├── lib/            # Core logic
│           └── store/         # State management
├── packages/
│   ├── config/          # Shared ESLint configuration
│   └── utils/           # Shared utilities for Walrus/Sui
│       └── src/
│           ├── walrus-client.js
│           ├── construct-move-call.js
│           └── ...
├── docs/                # Documentation
│   ├── features.md
│   └── smart-contract-design.md
└── scripts/             # Build & migration scripts
```

## 🤝 Contributing

We welcome contributions from the community! Whether it's fixing bugs, improving documentation, or adding new features for Walrus/Seal integrations.

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <p>Built with ❤️ on <b>Sui</b></p>
</div>
