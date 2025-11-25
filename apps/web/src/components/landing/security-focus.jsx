"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  CheckCircle,
  Shield,
  Lock,
  Key,
  Database,
  Users,
  Clock,
  Heart,
  ShieldCheck,
  Zap,
  ArrowRight,
  Vote,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const securityFeatures = [
  { text: "End-to-end Seal encryption", icon: Lock },
  { text: "Sui blockchain immutability", icon: Shield },
  { text: "Walrus decentralized storage", icon: Database },
  { text: "Zero-knowledge architecture", icon: Key },
  { text: "Social Recovery protection", icon: Users },
  { text: "Deadman Switch inheritance", icon: Clock },
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
    feature: "Storage",
    traditional: "Centralized servers",
    passman: "Walrus Decentralized Storage",
  },
  {
    feature: "Account Recovery",
    traditional: "Email-based (vulnerable)",
    passman: "Guardian-based multi-sig",
  },
  {
    feature: "Digital Legacy",
    traditional: "Lost forever",
    passman: "Deadman Switch transfer",
  },
];

const techCards = [
  {
    icon: Lock,
    title: "Seal Encryption",
    description:
      "Advanced encryption technology that ensures only you can decrypt your data",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Database,
    title: "Walrus Storage",
    description:
      "Immutable, decentralized blob storage ensures data availability",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Users,
    title: "Social Recovery",
    description:
      "Multi-guardian system with threshold voting for secure recovery",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Clock,
    title: "Deadman Switch",
    description:
      "Automated inheritance protocol for your digital legacy",
    gradient: "from-amber-500 to-orange-500",
  },
];

export function SecurityFocus() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section
      ref={containerRef}
      id="security"
      className="py-24 sm:py-32 relative overflow-hidden"
    >
      {/* Enhanced Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <motion.div
          style={{ y }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]"
        />
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], [-30, 30]) }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"
        />
      </div>

      {/* Diagonal stripe pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.03] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,currentColor_10px,currentColor_11px)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={
              isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }
            }
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-500">
              Military-Grade Security
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Uncompromising</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500">
              Security Architecture
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built on Sui blockchain with Seal encryption, Walrus storage, and
            advanced protection mechanisms for maximum security.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-20">
          {/* Left Column - Security Features */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">
                  Blockchain-Native Security
                </h3>
                <p className="text-sm text-muted-foreground">
                  Built from the ground up for Web3
                </p>
              </div>
            </div>

            <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
              Unlike traditional password managers that rely on centralized
              servers, Passman leverages the Sui blockchain's cryptographic
              guarantees, Walrus decentralized storage, and smart contract-based
              protection to ensure your passwords are truly secure.
            </p>

            <div className="space-y-4">
              {securityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={
                      isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                    }
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                      <Icon className="h-5 w-5 text-emerald-500" />
                    </div>
                    <span className="text-foreground font-medium">
                      {feature.text}
                    </span>
                    <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Column - Comparison */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="border-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Header gradient */}
              <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500" />

              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-xl font-bold text-foreground">
                    Passman vs Traditional
                  </h4>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-500"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Web3 Native
                  </Badge>
                </div>

                <div className="space-y-6">
                  {comparisons.map((comparison, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={
                        isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                      }
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="relative"
                    >
                      <div className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {comparison.feature}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {comparison.traditional}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                          <span className="text-sm text-foreground font-medium">
                            {comparison.passman}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Technical Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {techCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group"
              >
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl h-full hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-500">
                  {/* Gradient glow */}
                  <div
                    className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${card.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700`}
                  />

                  <CardContent className="relative p-6 text-center">
                    <motion.div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg mb-5 mx-auto`}
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </motion.div>

                    <h4 className="text-lg font-bold text-foreground mb-3">
                      {card.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
