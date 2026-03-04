"use client";

import { Navbar } from "@/components/navbar";
import {
  Search,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  MessageSquare,
  ChevronDown,
  Info,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    category: "Getting Started",
    icon: <BookOpen className="h-5 w-5 text-blue-500" />,
    items: [
      {
        q: "How do I report a lost item?",
        a: "Go to the 'Lost & Found Board' and click 'Report New Item'. Provide a clear title, description, and location of where you last saw the item. Adding a photo significantly increases the chances of recovery.",
      },
      {
        q: "Is my personal data safe?",
        a: "Yes! Your contact information is stored using AES-256-GCM encryption. It is only shared when a claim is accepted by the owner, ensuring privacy for both parties.",
      },
    ],
  },
  {
    category: "Claiming & Security",
    icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
    items: [
      {
        q: "What happens after I file a claim?",
        a: "The person who found the item will receive a notification. They will review your claim and any verification details you provided. If they accept, you'll receive their contact information to arrange a pickup.",
      },
      {
        q: "How do I verify I am the rightful owner?",
        a: "When reporting a 'Found' item, we recommend leaving out one specific detail (like a serial number, a specific scratch, or the lock screen wallpaper). The claimant should provide this detail in their claim message.",
      },
    ],
  },
  {
    category: "Account & Moderation",
    icon: <HelpCircle className="h-5 w-5 text-purple-500" />,
    items: [
      {
        q: "How long do posts stay active?",
        a: "By default, posts stay active for 14 days. After this, they are automatically expired to keep the board fresh. You can always renew or delete your post from your profile page.",
      },
      {
        q: "What if I find a suspicious post?",
        a: "Every post has a 'Report' button. If you believe a post is spam, fraudulent, or violates campus policies, please report it. Our moderators review all reports within 24 hours.",
      },
    ],
  },
];

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleFaq = (idx: string) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              How can we <span className="text-primary italic">help you?</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Search our knowledge base or browse frequently asked questions to
              get back to what matters most.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative max-w-xl mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for articles, guides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </motion.div>
        </section>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            {
              title: "User Guide",
              desc: "Detailed walkthrough of the platform",
              icon: <BookOpen className="h-6 w-6" />,
              color: "bg-blue-500/10 text-blue-500",
            },
            {
              title: "Security Protocols",
              desc: "How we protect your hardware and data",
              icon: <ShieldCheck className="h-6 w-6" />,
              color: "bg-green-500/10 text-green-500",
            },
            {
              title: "Support Chat",
              desc: "Contact a campus moderator",
              icon: <MessageSquare className="h-6 w-6" />,
              color: "bg-orange-500/10 text-orange-500",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className="group flex flex-col p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all cursor-pointer"
            >
              <div className={`p-3 rounded-xl w-fit mb-4 ${card.color}`}>
                {card.icon}
              </div>
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                {card.title}
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-muted-foreground text-sm">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="max-w-4xl mx-auto space-y-16">
          {faqs.map((section, sectionIdx) => (
            <div key={section.category}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-secondary">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-bold">{section.category}</h2>
              </div>

              <div className="space-y-4">
                {section.items.map((item, itemIdx) => {
                  const currentId = `${sectionIdx}-${itemIdx}`;
                  const isOpen = openIndex === currentId;

                  return (
                    <div
                      key={item.q}
                      className={`rounded-2xl border transition-all ${
                        isOpen
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      <button
                        onClick={() => toggleFaq(currentId)}
                        className="w-full flex items-center justify-between p-5 text-left"
                      >
                        <span className="font-medium text-foreground">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`}
                        />
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 text-muted-foreground border-t border-primary/10 pt-4 mt-1">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-12 rounded-[2.5rem] bg-foreground text-background text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <HelpCircle className="h-64 w-64" />
          </div>

          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="bg-primary p-4 rounded-full">
                <Info className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Still need assistance?</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8 text-lg">
              Our campus support team is available Monday &mdash; Friday, 9am to
              6pm.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="rounded-full px-8 bg-white text-black hover:bg-zinc-200"
              >
                Contact Support
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 border-zinc-700 hover:bg-zinc-800"
              >
                Email Moderator
              </Button>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-border py-12 bg-secondary/30 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} CampusFound. Built with &hearts;
            for the community.
          </p>
        </div>
      </footer>
    </div>
  );
}
