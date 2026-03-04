"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import { Search, MapPin, ShieldCheck, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32">
          {/* Background pattern */}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>

          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6"
              >
                Safe and Verified Campus Network
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl"
              >
                Reuniting You with Your <br />
                <span className="text-primary italic">Lost Belongings</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 max-w-2xl text-xl text-muted-foreground"
              >
                The official community-driven lost and found board for our
                campus. Report found items or search for what you&apos;ve
                misplaced with ease and security.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 flex flex-wrap justify-center gap-4"
              >
                <Link href="/board">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full">
                    Browse Board <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/post/new">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 px-8 text-lg rounded-full"
                  >
                    Report Found Item
                  </Button>
                </Link>
              </motion.div>

              {/* Stats/Features */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl"
              >
                {[
                  {
                    icon: Search,
                    title: "Smart Search",
                    desc: "Filter by category, location, and date",
                  },
                  {
                    icon: MapPin,
                    title: "Live Locations",
                    desc: "Pinpoint where items were last seen",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Verified Claims",
                    desc: "Our system ensures items return to owners",
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border transition-all hover:shadow-lg"
                  >
                    <div className="p-3 rounded-xl bg-primary/10 text-primary mb-4">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
