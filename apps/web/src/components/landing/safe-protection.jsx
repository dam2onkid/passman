"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  Clock,
  Heart,
  Vote,
  UserCheck,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Zap,
  Infinity,
  ShieldCheck,
} from "lucide-react";

const safeFeatures = [
  {
    icon: Users,
    title: "Social Recovery",
    subtitle: "Never Lose Access",
    description:
      "Designate trusted guardians who can help recover your vault through multi-signature approval. Even if you lose your keys, your data stays safe.",
    color: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/20",
    details: [
      "Multi-guardian support",
      "Customizable threshold",
      "On-chain voting",
      "Instant recovery execution",
    ],
  },
  {
    icon: Clock,
    title: "Deadman Switch",
    subtitle: "Digital Legacy",
    description:
      "Automatically transfer vault access to your beneficiary after a period of inactivity. Ensure your digital assets are passed on securely.",
    color: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/20",
    details: [
      "Configurable inactivity period",
      "Heartbeat confirmation",
      "Beneficiary designation",
      "Automatic transfer",
    ],
  },
  {
    icon: Heart,
    title: "Activity Heartbeat",
    subtitle: "Stay in Control",
    description:
      "Simple one-click confirmation that resets the deadman timer. Stay active, stay secure, and maintain full control over your vault.",
    color: "from-rose-500 to-pink-500",
    bgGlow: "bg-rose-500/20",
    details: [
      "One-click reset",
      "Activity tracking",
      "Timer visualization",
      "Email reminders",
    ],
  },
  {
    icon: Vote,
    title: "Guardian Voting",
    subtitle: "Democratic Security",
    description:
      "Guardians vote to approve recovery requests. The threshold-based system ensures no single guardian can compromise your vault.",
    color: "from-violet-500 to-purple-500",
    bgGlow: "bg-violet-500/20",
    details: [
      "Transparent voting",
      "Progress tracking",
      "Vote verification",
      "Threshold protection",
    ],
  },
];

const recoveryProcess = [
  {
    step: 1,
    title: "Guardian Initiates",
    description: "A guardian proposes recovery to a new owner address",
    icon: Users,
  },
  {
    step: 2,
    title: "Guardians Vote",
    description: "Other guardians review and cast their votes on-chain",
    icon: Vote,
  },
  {
    step: 3,
    title: "Threshold Reached",
    description: "Once enough guardians approve, recovery is ready",
    icon: CheckCircle2,
  },
  {
    step: 4,
    title: "Ownership Transferred",
    description: "Vault Cap is transferred to the new owner securely",
    icon: ShieldCheck,
  },
];

const stats = [
  { value: "100%", label: "On-Chain Security", icon: Shield },
  { value: "M-of-N", label: "Multi-Sig Protection", icon: Users },
  { value: "7-730", label: "Days Configurable", icon: Clock },
  { value: "∞", label: "Guardian Flexibility", icon: Infinity },
];

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: "easeOut" }}
      className="group relative"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl h-full hover:from-white/10 hover:to-white/5 transition-all duration-500">
        {/* Glow effect */}
        <div
          className={`absolute -top-20 -right-20 w-40 h-40 ${feature.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
        />

        {/* Gradient border effect */}
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
        />

        <CardContent className="relative p-8 space-y-6">
          {/* Icon with gradient background */}
          <div className="relative">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg shadow-primary/20`}
            >
              <Icon className="h-8 w-8 text-white" />
            </div>
            <motion.div
              className={`absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} blur-xl opacity-40`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="text-xs font-medium border-white/20 text-muted-foreground"
            >
              {feature.subtitle}
            </Badge>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">
              {feature.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>

          {/* Feature details */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/10">
            {feature.details.map((detail, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ delay: index * 0.15 + idx * 0.1 + 0.3 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                <span>{detail}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RecoveryTimeline() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="relative">
      {/* Connection line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden lg:block" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {recoveryProcess.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative text-center"
            >
              {/* Step number with icon */}
              <div className="relative inline-flex flex-col items-center">
                <motion.div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Icon className="h-8 w-8 text-primary" />
                </motion.div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg">
                  {step.step}
                </div>
              </div>

              <h4 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h4>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {step.description}
              </p>

              {/* Arrow for desktop */}
              {index < recoveryProcess.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full -translate-x-1/2 z-10">
                  <ArrowRight className="h-5 w-5 text-primary/50 mx-auto" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function SafeProtection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section
      ref={containerRef}
      id="safe-protection"
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <motion.div
          style={{ y }}
          className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
          className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px]"
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Advanced Protection
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Safe Protection</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-cyan-500">
              Beyond Traditional Security
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Lock your vault in a Smart Contract Safe with Social Recovery and
            Deadman Switch. Your digital legacy, protected on-chain.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-center hover:border-primary/30 transition-colors">
                  <Icon className="h-6 w-6 text-primary mx-auto mb-3 opacity-70" />
                  <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-24">
          {safeFeatures.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Recovery Process Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              How Social Recovery Works
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A transparent, on-chain process that ensures your vault can always
              be recovered by your trusted guardians.
            </p>
          </div>
          <RecoveryTimeline />
        </motion.div>

        {/* Bottom CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-24"
        >
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-amber-500/10" />
            <CardContent className="relative p-8 sm:p-12 text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <Zap className="h-5 w-5 text-primary animate-pulse" />
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Protect Your Digital Legacy Today
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Set up Social Recovery and Deadman Switch in minutes. Ensure
                your passwords and digital assets are never lost, even in the
                most unexpected circumstances.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>No monthly fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Fully on-chain</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Your keys, your control</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

