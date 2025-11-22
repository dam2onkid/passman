# Passman Browser Extension

A Chrome extension for Passman - Sui-based password manager with auto-fill capabilities.

## Features

- 🔐 Secure password management on Sui blockchain
- 🔄 Auto-fill credentials on websites
- 🗂️ Multiple vault support
- 👛 Sui wallet integration
- 🎨 Beautiful UI with shadcn components

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Chrome browser

### Installation

From the monorepo root:

```bash
pnpm install
```

### Development Mode

```bash
cd apps/extension
pnpm dev
```

This will:
1. Start Vite dev server with HMR
2. Build the extension in watch mode
3. Output to `dist/` directory

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `apps/extension/dist` directory

### Build for Production

```bash
pnpm build
```

## Extension Structure

```
apps/extension/
├── manifest.json          # Extension manifest (V3)
├── vite.config.js        # Vite configuration with CRXJS
├── src/
│   ├── popup/            # Popup UI (main interface)
│   │   ├── main.jsx      # Entry point
│   │   ├── App.jsx       # Main app component
│   │   └── styles.css    # Global styles
│   ├── content/          # Content scripts (injected into pages)
│   │   ├── content.jsx   # Main content script
│   │   ├── content.css   # Content script styles
│   │   └── autofill-ui.jsx # Auto-fill modal
│   ├── background/       # Service worker
│   │   └── service-worker.js
│   ├── components/       # Shared React components
│   ├── hooks/           # React hooks
│   ├── store/           # State management (Zustand)
│   └── lib/             # Utilities
└── public/
    └── icons/           # Extension icons
```

## How It Works

### Popup UI
- Click extension icon to open popup
- Connect wallet via Sui wallet adapter
- Browse and manage passwords by vault
- View password details, copy credentials

### Auto-fill
- Extension detects password/username fields on web pages
- Passman icon appears next to input fields
- Click icon to see matching passwords for current domain
- Select password to auto-fill form

### Architecture
- **Popup**: Main UI running in extension popup
- **Content Script**: Injected into web pages, detects forms
- **Background Service Worker**: Handles messaging between popup and content scripts
- **Storage**: Uses `chrome.storage.local` for vault persistence

## Security

- Passwords encrypted using Mysten Seal on Sui blockchain
- Private keys never leave your device
- Content script runs in isolated context
- Auto-fill only on user explicit action

## Technologies

- React 19
- Vite + CRXJS
- Tailwind CSS
- shadcn/ui components
- Zustand (state management)
- Mysten Sui SDK
- Mysten Wallet Adapter

## Troubleshooting

### Extension not loading
- Make sure you built the extension (`pnpm dev` or `pnpm build`)
- Check that you loaded the `dist` directory, not the `src` directory
- Check Chrome console for errors

### Auto-fill not working
- Check that extension has necessary permissions
- Verify content script is injected (check DevTools > Sources)
- Check background service worker logs (chrome://extensions > background page)

### Wallet connection issues
- Make sure you have a Sui wallet extension installed
- Check that wallet is unlocked
- Verify network matches (testnet/mainnet)

## Icons

Extension requires three icon sizes (16x16, 48x48, 128x128). See `public/icons/README.md` for generation instructions.

## License

Same as parent project

