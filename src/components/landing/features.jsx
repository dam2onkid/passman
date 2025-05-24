import { Shield, Lock, Key, Share, Monitor, Code } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Blockchain Secured",
    description:
      "Your passwords are protected by Sui blockchain's cryptographic security",
  },
  {
    icon: Lock,
    title: "Seal Encryption",
    description: "Advanced encryption ensures only you can access your data",
  },
  {
    icon: Key,
    title: "You Own Your Data",
    description: "No central authority can access or control your passwords",
  },
  {
    icon: Share,
    title: "Secure Sharing",
    description: "Share passwords safely with time-limited access controls",
  },
  {
    icon: Monitor,
    title: "Access Anywhere",
    description: "Sync securely across all your devices and platforms",
  },
  {
    icon: Code,
    title: "Transparent & Open",
    description: "Open source code you can verify and trust",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for the Future of Security
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Experience password management reimagined with blockchain technology
            and true decentralization.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden border-0 bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-6">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
