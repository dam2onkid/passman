"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  Shield,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const features = [
  { icon: Shield, text: "Blockchain Security" },
  { icon: Users, text: "Social Recovery" },
  { icon: Clock, text: "Deadman Switch" },
];

export function CallToAction() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/5 to-background" />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -z-10"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-5xl"
        >
          {/* Main CTA Card */}
          <div className="relative rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 p-1 shadow-2xl overflow-hidden">
            {/* Gradient border animation */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary via-blue-500 to-cyan-500 opacity-20" />

            <div className="relative rounded-[22px] bg-background/80 backdrop-blur-xl p-8 sm:p-12 lg:p-16">
              {/* Badge */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={
                  isInView
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0.8, opacity: 0 }
                }
                transition={{ delay: 0.2 }}
                className="flex justify-center mb-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Start Your Journey
                  </span>
                </div>
              </motion.div>

              {/* Heading */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-center mb-6">
                <span className="text-foreground">Ready to Secure Your</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-cyan-400">
                  Digital Legacy?
                </span>
              </h2>

              <p className="mx-auto max-w-2xl text-lg sm:text-xl leading-relaxed text-muted-foreground text-center mb-10">
                Join the future of password management with blockchain security,
                Social Recovery, and Deadman Switch protection.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={
                        isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                      }
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {feature.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto h-14 px-10 text-lg font-semibold shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-blue-600"
                >
                  <Link href="/dashboard" className="flex items-center gap-3">
                    Get Started Free
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-14 px-10 text-lg font-semibold backdrop-blur-md bg-white/5 border-white/20 hover:bg-white/10"
                >
                  <Link
                    href="https://github.com/nicefiction/passman"
                    target="_blank"
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="h-5 w-5" />
                    View Documentation
                  </Link>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Open source</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Self-custodial</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
