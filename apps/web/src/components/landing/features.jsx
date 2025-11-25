import { Shield, Lock, Key, Share, Monitor, Code, Database, Timer, Users } from "lucide-react";
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
    icon: Database,
    title: "Walrus Storage",
    description: "Decentralized storage on Walrus ensures your data is always available and censorship-resistant",
  },
  {
    icon: Timer,
    title: "Deadman Switch",
    description: "Automated protocol to transfer access to trusted beneficiaries if you become inactive",
  },
  {
    icon: Users,
    title: "Social Recovery",
    description: "Recover your vault through trusted guardians with multi-signature approval",
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
    <section id="features" className="py-20 sm:py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Built for the Future of Security
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Experience password management reimagined with blockchain technology
            and true decentralization.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="group relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-black/20 dark:hover:bg-black/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                      <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
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
