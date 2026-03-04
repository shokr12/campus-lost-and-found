"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import {
  Camera,
  MapPin,
  Calendar,
  Tag,
  Info,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "lost",
    category: "other",
    location: "",
    date_lost_or_found: new Date().toISOString().split("T")[0],
    contact_info: "",
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (photo) data.append("photo", photo);

    try {
      await apiClient.post("/api/posts", data);
      setSuccess(true);
      setTimeout(() => router.push("/board"), 2000);
    } catch (err) {
      console.error("Failed to create post", err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold">Successfully Reported!</h1>
          <p className="text-muted-foreground">
            Redirecting you to the board...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              Report Item
            </h1>
            <p className="text-muted-foreground mt-2">
              Help the community by providing as many details as possible
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Status & Photo Segment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Status
                  </label>
                  <div className="flex gap-2">
                    {["lost", "found"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: s })}
                        className={`flex-1 py-3 rounded-xl border-2 transition-all font-bold ${
                          formData.status === s
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-transparent bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Category
                  </label>
                  <select
                    className="w-full h-12 rounded-xl bg-secondary px-4 font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="books">Books</option>
                    <option value="IDs">IDs & Cards</option>
                    <option value="accessories">Accessories</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Photo
                </label>
                <div
                  onClick={() =>
                    document.getElementById("photo-input")?.click()
                  }
                  className="aspect-video w-full rounded-2xl border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-all overflow-hidden relative"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground font-medium">
                        Click to upload image
                      </span>
                    </>
                  )}
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
              </div>
            </div>

            {/* Core Info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Item Title
                </label>
                <input
                  required
                  placeholder="e.g. Blue Hydro Flask, Silver MacBook Pro"
                  className="w-full h-12 rounded-xl bg-secondary px-4 font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide identifying features, brand, stickers, or unique markings..."
                  className="w-full rounded-xl bg-secondary p-4 font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      required
                      placeholder="e.g. Student Union, Library Layer 2"
                      className="w-full h-12 rounded-xl bg-secondary pl-12 pr-4 font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      required
                      type="date"
                      className="w-full h-12 rounded-xl bg-secondary pl-12 pr-4 font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                      value={formData.date_lost_or_found}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date_lost_or_found: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <label className="text-sm font-bold uppercase tracking-wider text-primary">
                    Secure Contact Info
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  This information will be encrypted and only shared with
                  verified claimants you approve.
                </p>
                <input
                  placeholder="e.g. Phone number or Personal Email"
                  className="w-full h-12 rounded-xl bg-background px-4 font-medium border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.contact_info}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_info: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                className="flex-1 h-14 rounded-full text-lg shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Publish Report"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-full"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
