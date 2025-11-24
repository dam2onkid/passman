"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSuiWallet } from "@/hooks/use-sui-wallet";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { isConnected } = useSuiWallet();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    } else {
      setChecking(false);
    }
  }, [isConnected, router]);

  if (isConnected || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Image
              src="/passman.svg"
              alt="Passman"
              width={32}
              height={32}
              className="h-8 w-8"
            />
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Connect your wallet or sign in with Google to access your vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WalletConnectButton isSidebar={false} />
        </CardContent>
      </Card>
    </div>
  );
}
