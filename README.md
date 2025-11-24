<div align="center">
  <img src="public/passman.png" alt="Passman Logo" width="128" height="128">

[![Watch Demo](https://img.shields.io/badge/Watch-Demo-red?style=flat-square&logo=youtube)](https://www.youtube.com/watch?v=HCZa7gmznTI)

# Passman

**The First Blockchain-Powered Password Manager**

_Your Passwords, Secured by Blockchain_

[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Sui Blockchain](https://img.shields.io/badge/Sui-Blockchain-4285F4?style=flat-square)](https://sui.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>

## 🔐 About Passman

Passman is a revolutionary password manager built on the Sui blockchain with Seal encryption technology. It provides true decentralization for your digital security, ensuring that you have complete control over your passwords without relying on any central authority.

### ✨ Key Features

- **🔗 Blockchain-Powered**: Built on Sui blockchain for ultimate security and decentralization
- **🔒 Seal Encryption**: Advanced encryption using Mysten Labs' Seal technology
- **🌐 100% Decentralized**: No central servers or authorities controlling your data
- **🎨 Modern UI**: Beautiful, responsive interface built with React and TailwindCSS
- **🔄 Real-time Sync**: Seamless synchronization across all your devices
- **🛡️ Zero-Knowledge**: Your passwords are encrypted and only you have access

### 🛠️ Tech Stack

- **Frontend**: Next.js 15.3.1, React 19.0.0
- **Blockchain**: Sui Network with @mysten/sui SDK
- **Encryption**: @mysten/seal for advanced cryptographic operations
- **Styling**: TailwindCSS 4 with Radix UI components
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd passman
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Run the development server**

   ```bash
   pnpm dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see Passman in action.

### Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint for code quality

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   ├── landing/        # Landing page components
│   └── ui/             # Base UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── store/              # Zustand state management
└── constants/          # Application constants
```

## 🔒 Security Features

- **Blockchain Immutability**: Your encrypted data is stored on the immutable Sui blockchain
- **Client-Side Encryption**: All encryption happens on your device before data leaves
- **No Central Point of Failure**: Decentralized architecture eliminates single points of failure
- **Open Source**: Transparent and auditable codebase

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Sui Network](https://sui.io/)
- [Mysten Labs](https://mystenlabs.com/)
- [Next.js Documentation](https://nextjs.org/docs)

---

<div align="center">
  <p>Built with ❤️ for a decentralized future</p>
</div>
