import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";

export function CallToAction() {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Ready to secure your passwords?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Join the future of password management with blockchain security and
            true ownership. Get started today and take control of your digital
            security.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto text-lg px-8 py-6"
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                Get Started Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-lg px-8 py-6"
            >
              <Link
                href="https://github.com/dam2onkid/passman"
                className="flex items-center gap-2"
              >
                <BookOpen className="h-5 w-5" />
                View Documentation
              </Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Open source</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
