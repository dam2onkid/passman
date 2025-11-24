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

## ⚙️ Technical Architecture

How it all comes together:

1.  **Authentication**: User logs in via **Google** using **zkLogin**. A temporary session key is created, and a stable Sui address is derived.
2.  **Encryption**: When you save a password, **Seal** encrypts the data client-side using threshold keys.
3.  **Storage**: The encrypted blob is uploaded to **Walrus**, returning a unique Blob ID.
4.  **Consensus**: The Blob ID and metadata are stored in a `Vault` object on **Sui**, linking your identity to your data.

## ✨ Key Features

- **100% Decentralized**: Zero reliance on centralized servers.
- **Deadman Switch**: Set up a trusted contact to inherit access to your vault after a period of inactivity.
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
src/
├── app/                 # Next.js App Router
├── components/          # React Components
├── hooks/               # Custom Hooks (useZkLogin, useSeal, etc.)
├── lib/                 # Core Logic (Enoki, Sui Providers)
├── store/               # State Management (Zustand)
└── packages/
    └── utils/           # Shared utilities for Walrus/Sui
```

## 🤝 Contributing

We welcome contributions from the community! Whether it's fixing bugs, improving documentation, or adding new features for Walrus/Seal integrations.

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <p>Built with ❤️ on <b>Sui</b></p>
</div>
