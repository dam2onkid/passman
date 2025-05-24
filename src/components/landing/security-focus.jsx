import { CheckCircle, Shield, Lock, Key, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const securityFeatures = [
  "End-to-end Seal encryption",
  "Sui blockchain immutability",
  "Zero-knowledge architecture",
  "Decentralized key management",
  "No central point of failure",
  "Cryptographic proof of integrity",
];

const comparisons = [
  {
    feature: "Data Ownership",
    traditional: "Company owns your data",
    passman: "You own your data completely",
  },
  {
    feature: "Access Control",
    traditional: "Company can access anytime",
    passman: "Only you have access",
  },
  {
    feature: "Server Dependency",
    traditional: "Relies on company servers",
    passman: "Decentralized blockchain",
  },
  {
    feature: "Single Point of Failure",
    traditional: "Yes - company servers",
    passman: "No - distributed network",
  },
];

export function SecurityFocus() {
  return (
    <section id="security" className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Uncompromising Security
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built on Sui blockchain with Seal encryption for maximum security
            and true decentralization
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Security Features */}
          <div>
            <div className="flex items-center mb-6">
              <Shield className="h-8 w-8 text-primary mr-3" />
              <h3 className="text-2xl font-bold text-foreground">
                Blockchain-Native Security
              </h3>
            </div>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              Unlike traditional password managers that rely on centralized
              servers, Passman leverages the Sui blockchain's cryptographic
              guarantees and Seal encryption to ensure your passwords are truly
              secure and under your control.
            </p>

            <div className="space-y-4">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Comparison */}
          <div>
            <Card className="border-0 bg-muted/50">
              <CardContent className="p-8">
                <h4 className="text-xl font-semibold text-foreground mb-6 text-center">
                  Passman vs Traditional Password Managers
                </h4>

                <div className="space-y-6">
                  {comparisons.map((comparison, index) => (
                    <div
                      key={index}
                      className="border-b border-border pb-4 last:border-b-0"
                    >
                      <div className="font-medium text-foreground mb-2">
                        {comparison.feature}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-muted-foreground">
                            {comparison.traditional}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-foreground font-medium">
                            {comparison.passman}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 bg-muted/30">
              <CardContent className="p-8">
                <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Seal Encryption
                </h4>
                <p className="text-muted-foreground text-sm">
                  Advanced encryption technology that ensures only you can
                  decrypt your data
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 bg-muted/30">
              <CardContent className="p-8">
                <Database className="h-12 w-12 text-primary mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Sui Blockchain
                </h4>
                <p className="text-muted-foreground text-sm">
                  Immutable, decentralized storage with cryptographic guarantees
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 bg-muted/30">
              <CardContent className="p-8">
                <Key className="h-12 w-12 text-primary mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Your Keys
                </h4>
                <p className="text-muted-foreground text-sm">
                  You control the private keys, ensuring true ownership of your
                  data
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
