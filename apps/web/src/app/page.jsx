import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SecurityFocus } from "@/components/landing/security-focus";
import { SafeProtection } from "@/components/landing/safe-protection";
import { CallToAction } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <SafeProtection />
        <HowItWorks />
        <SecurityFocus />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
