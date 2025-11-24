import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Database, Lock } from "lucide-react";

export function Hero() {
  return (
    <section className="relative py-20 sm:py-32 lg:py-40 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[100px] rounded-full -z-10 opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full -z-10 opacity-30 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Now live on Sui Testnet
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Your Passwords,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              Secured by Blockchain
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            The first password manager built on Sui blockchain with Seal
            encryption. Take control of your digital security with true
            decentralization and Walrus storage.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Button asChild size="lg" className="w-full sm:w-auto h-12 px-8 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105">
              <Link href="/dashboard" className="flex items-center gap-2">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-lg backdrop-blur-sm bg-background/50 hover:bg-background/80 transition-all duration-300"
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </div>

          <div className="mt-16 sm:mt-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <div className="relative rounded-2xl bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur-xl">
              <div className="rounded-xl bg-background/40 p-8 shadow-2xl">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-white/5 transition-colors">
                    <ShieldCheck className="h-8 w-8 text-primary mb-2 opacity-80" />
                    <div className="text-3xl font-bold text-foreground">100%</div>
                    <div className="text-sm font-medium text-muted-foreground mt-1">
                      Decentralized
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-white/5 transition-colors">
                    <Database className="h-8 w-8 text-primary mb-2 opacity-80" />
                    <div className="text-3xl font-bold text-foreground">Zero</div>
                    <div className="text-sm font-medium text-muted-foreground mt-1">
                      Central Authority
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-white/5 transition-colors">
                    <Lock className="h-8 w-8 text-primary mb-2 opacity-80" />
                    <div className="text-3xl font-bold text-foreground">∞</div>
                    <div className="text-sm font-medium text-muted-foreground mt-1">
                      Your Control
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
