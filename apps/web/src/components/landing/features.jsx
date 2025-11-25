"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  Lock,
  Key,
  Share,
  Monitor,
  Code,
  Database,
  Timer,
  Users,
  Fingerprint,
  Globe,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Blockchain Secured",
    description:
      "Your passwords are protected by Sui blockchain's cryptographic security",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Lock,
    title: "Seal Encryption",
    description: "Advanced encryption ensures only you can access your data",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: Database,
    title: "Walrus Storage",
    description:
      "Decentralized storage on Walrus ensures your data is always available",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Timer,
    title: "Deadman Switch",
    description:
      "Automated protocol to transfer access to trusted beneficiaries",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Social Recovery",
    description:
      "Recover your vault through trusted guardians with multi-sig approval",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Key,
    title: "You Own Your Data",
    description: "No central authority can access or control your passwords",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Share,
    title: "Secure Sharing",
    description: "Share passwords safely with time-limited access controls",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Fingerprint,
    title: "Zero-Knowledge",
    description: "Your master password never leaves your device",
    gradient: "from-green-500 to-emerald-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

function FeatureCard({ feature, index }) {
  const Icon = feature.icon;

  return (
    <motion.div variants={itemVariants} className="group relative">
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl h-full hover:from-white/[0.12] hover:to-white/[0.06] transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-br from-white/20 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Glow effect on hover */}
        <div
          className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-all duration-700`}
        />

        <CardContent className="relative p-6 sm:p-8 z-10">
          {/* Icon container with gradient */}
          <motion.div
            className="relative mb-6"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div
              className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
            >
              <Icon className="h-7 w-7 text-white" />
            </div>
            {/* Pulse animation */}
            <motion.div
              className={`absolute inset-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} blur-xl`}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2,
              }}
            />
          </motion.div>

          <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
            {feature.title}
          </h3>
          <p className="text-muted-foreground leading-relaxed text-sm">
            {feature.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="features"
      className="py-24 sm:py-32 relative overflow-hidden"
      ref={ref}
    >
      {/* Enhanced Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      </div>

      {/* Floating orbs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px]"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Powerful Features
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Built for the</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-cyan-500">
              Future of Security
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience password management reimagined with blockchain technology
            and true decentralization. Your security, elevated.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mx-auto max-w-7xl"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
