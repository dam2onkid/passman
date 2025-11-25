"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Wallet,
  Shield,
  Database,
  Users,
  Lock,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Wallet,
    title: "Connect Wallet",
    description:
      "Link your Sui wallet to get started with secure authentication",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    icon: Shield,
    title: "Create Vault",
    description: "Set up your encrypted storage vault on the blockchain",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    number: "03",
    icon: Database,
    title: "Store Passwords",
    description: "Add your credentials securely with Seal encryption",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    number: "04",
    icon: Users,
    title: "Setup Safe",
    description:
      "Add guardians and beneficiary for Social Recovery & Deadman Switch",
    gradient: "from-amber-500 to-orange-500",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Simple Setup
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Get Started in</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
              Four Simple Steps
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From wallet connection to full protection with Social Recovery and
            Deadman Switch—all in minutes.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }
                  }
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="relative text-center group"
                >
                  <div className="flex flex-col items-center">
                    {/* Step number with gradient */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={`relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} text-white text-2xl font-bold mb-6 shadow-xl`}
                    >
                      {step.number}
                      {/* Pulse effect */}
                      <motion.div
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.gradient} blur-xl`}
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.3,
                        }}
                      />
                    </motion.div>

                    {/* Icon */}
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 mb-6 group-hover:bg-white/20 transition-colors duration-300">
                      <Icon className="h-7 w-7 text-foreground" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
