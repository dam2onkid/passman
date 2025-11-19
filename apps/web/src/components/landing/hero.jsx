import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative py-20 sm:py-32 lg:py-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Your Passwords,{" "}
            <span className="text-primary">Secured by Blockchain</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            The first password manager built on Sui blockchain with Seal
            encryption. Take control of your digital security with true
            decentralization.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/dashboard" className="flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </div>

          <div className="mt-16 sm:mt-20">
            <div className="relative rounded-xl bg-muted/50 p-2 ring-1 ring-border">
              <div className="rounded-lg bg-background p-8 shadow-lg">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">100%</div>
                    <div className="text-sm text-muted-foreground">
                      Decentralized
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">Zero</div>
                    <div className="text-sm text-muted-foreground">
                      Central Authority
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">∞</div>
                    <div className="text-sm text-muted-foreground">
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
