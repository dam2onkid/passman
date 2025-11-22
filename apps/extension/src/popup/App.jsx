import React, { useEffect } from "react";
import { SuiProviders } from "@/lib/sui-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { PasswordManager } from "@/components/password-manager";
import { VaultSwitcher } from "@/components/vault-switcher";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { Toaster } from "@/components/ui/sonner";
import useVaultStore from "@/store/vault-store";

function App() {
  const { hydrate } = useVaultStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="passman-extension-theme">
      <SuiProviders>
        <div className="w-full h-full flex flex-col bg-background">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">Passman</h1>
              </div>
              <VaultSwitcher />
            </div>
            <WalletConnectButton />
          </header>

          <main className="flex-1 overflow-y-auto">
            <PasswordManager />
          </main>
        </div>
        <Toaster />
      </SuiProviders>
    </ThemeProvider>
  );
}

export default App;
