import { Wallet, Shield, Database, Globe } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Wallet,
    title: "Connect Wallet",
    description:
      "Link your Sui wallet to get started with secure authentication",
  },
  {
    number: "02",
    icon: Shield,
    title: "Create Vault",
    description: "Set up your encrypted storage vault on the blockchain",
  },
  {
    number: "03",
    icon: Database,
    title: "Store Passwords",
    description: "Add your credentials securely with Seal encryption",
  },
  {
    number: "04",
    icon: Globe,
    title: "Access Anywhere",
    description: "Retrieve your passwords from any device, anytime",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get started with Passman in four simple steps
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative text-center">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4">
                      {step.number}
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-background border mb-6">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Connector line for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-border transform -translate-y-1/2 z-0">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-border rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
