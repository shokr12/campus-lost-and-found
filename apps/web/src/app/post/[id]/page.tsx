"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Post, Claim, User } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import {
  MapPin,
  Calendar,
  Tag,
  Shield,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function PostDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [verificationInfo, setVerificationInfo] = useState("");
  const [showClaimForm, setShowClaimForm] = useState(false);

  const fetchData = async () => {
    try {
      const postRes = await apiClient.get<Post>(`/api/posts/${id}`);
      setPost(postRes.data);

      // If owner, fetch claims
      if (currentUser && postRes.data.userId === currentUser.id) {
        const claimsRes = await apiClient.get<Claim[]>(
          `/api/posts/${id}/claims`,
        );
        setClaims(claimsRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch post details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id, currentUser]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingClaim(true);
    try {
      await apiClient.post(`/api/posts/${id}/claims`, {
        message: claimMessage,
        verification_info: verificationInfo,
      });
      setShowClaimForm(false);
      alert("Claim submitted successfully!");
    } catch (err) {
      console.error("Failed to submit claim", err);
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleUpdateClaim = async (claimId: string, status: string) => {
    try {
      await apiClient.patch(`/api/claims/${claimId}`, { status });
      fetchData(); // Refresh to see updated status and post status
    } catch (err) {
      console.error("Failed to update claim", err);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  if (!post)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );

  const isOwner = currentUser?.id === post.userId;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />{" "}
            Back to Board
          </Button>

          {(currentUser?.role === "ADMIN" ||
            currentUser?.role === "MODERATOR") && (
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirm("Are you sure you want to delete this post?")) {
                  try {
                    await apiClient.delete(`/api/posts/${id}`);
                    router.push("/board");
                  } catch (err) {
                    console.error("Delete failed", err);
                  }
                }
              }}
              className="gap-2 rounded-full shadow-lg"
            >
              <Trash2 className="h-4 w-4" /> Delete Post
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Post Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="relative aspect-video w-full rounded-3xl border border-border bg-secondary overflow-hidden shadow-2xl">
              {post.photoUrl ? (
                <img
                  src={post.photoUrl}
                  alt={post.title}
                  onError={(e) => {
                    // If backend image fails, use mockup as fallback
                    (e.currentTarget as HTMLImageElement).src =
                      post.status === "lost"
                        ? "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800"
                        : "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800";
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center relative bg-muted/50">
                  <img
                    src={
                      post.status === "lost"
                        ? "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800"
                        : "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800"
                    }
                    className="h-full w-full object-cover opacity-60 grayscale-[50%]"
                    alt="placeholder"
                  />
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <Tag className="h-20 w-20 text-white/50" />
                  </div>
                </div>
              )}
              <div
                className={`absolute top-6 left-6 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg ${
                  post.status === "lost"
                    ? "bg-red-500 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {post.status}
              </div>
              {post.isResolved && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-white text-black px-8 py-4 rounded-2xl font-black text-2xl rotate-[-5deg] shadow-2xl border-4 border-primary">
                    RESOLVED
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  {post.category}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Reported{" "}
                  {post.createdAt
                    ? format(new Date(post.createdAt), "MMM d")
                    : "Unknown"}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">
                {post.title}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {post.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border">
                <div className="p-2 rounded-xl bg-background shadow-sm text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Location
                  </p>
                  <p className="font-semibold">{post.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border">
                <div className="p-2 rounded-xl bg-background shadow-sm text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Date
                  </p>
                  <p className="font-semibold">
                    {post.dateLostOrFound
                      ? format(new Date(post.dateLostOrFound), "MMMM d, yyyy")
                      : "No date provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="space-y-6">
            {!isOwner && !post.isResolved && (
              <div className="sticky top-24 p-8 rounded-3xl border border-border bg-card shadow-xl space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Is this yours?</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit a claim to contact the reporter
                  </p>
                </div>

                {!showClaimForm ? (
                  <Button
                    size="lg"
                    className="w-full h-14 rounded-full text-lg shadow-lg"
                    onClick={() => setShowClaimForm(true)}
                  >
                    Submit Claim
                  </Button>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onSubmit={handleClaimSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest">
                        Identifying Message
                      </label>
                      <textarea
                        required
                        className="w-full rounded-xl bg-secondary p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Tell the owner why this belongs to you..."
                        rows={3}
                        value={claimMessage}
                        onChange={(e) => setClaimMessage(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest">
                        Verification Info
                      </label>
                      <textarea
                        required
                        className="w-full rounded-xl bg-secondary p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Unique details only you would know (serial no, stickers, content)..."
                        rows={3}
                        value={verificationInfo}
                        onChange={(e) => setVerificationInfo(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submittingClaim}
                    >
                      {submittingClaim ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        "Confirm Submission"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setShowClaimForm(false)}
                    >
                      Cancel
                    </Button>
                  </motion.form>
                )}

                <div className="pt-6 border-t border-border flex items-start gap-4">
                  <Shield className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground leading-normal">
                    Your contact info and verification details are encrypted and
                    only shown to the owner if they accept your claim.
                  </p>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="sticky top-24 space-y-6">
                <div className="p-8 rounded-3xl border border-primary/20 bg-primary/5 space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" /> Incoming Claims
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Review claims to find the correct owner
                  </p>
                </div>

                <div className="space-y-4">
                  {claims.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-border text-center text-muted-foreground italic text-sm">
                      No claims yet...
                    </div>
                  ) : (
                    claims.map((claim) => (
                      <motion.div
                        key={claim.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 rounded-2xl border border-border bg-card shadow-md space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                              claim.status === "pending"
                                ? "bg-amber-100 text-amber-600"
                                : claim.status === "accepted"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-red-100 text-red-600"
                            }`}
                          >
                            {claim.status}
                          </span>
                        </div>

                        <p className="text-sm font-medium leading-relaxed">
                          &quot;{claim.message}&quot;
                        </p>

                        {claim.verificationEncrypted && (
                          <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                              Verification Proof
                            </p>
                            <p className="text-xs italic">
                              {claim.verificationEncrypted}
                            </p>
                          </div>
                        )}

                        {claim.status === "pending" && !post.isResolved && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              className="flex-1 gap-2 rounded-full"
                              onClick={() =>
                                handleUpdateClaim(claim.id, "accepted")
                              }
                            >
                              <CheckCircle2 className="h-4 w-4" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-2 rounded-full text-destructive"
                              onClick={() =>
                                handleUpdateClaim(claim.id, "rejected")
                              }
                            >
                              <XCircle className="h-4 w-4" /> Reject
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}

            {post.isResolved && !isOwner && (
              <div className="p-8 rounded-3xl border border-green-500/20 bg-green-500/5 text-center space-y-4">
                <CheckCircle2
                  className="h-12 w-12 text-green-500 mx-auto"
                  strokeWidth={1}
                />
                <h3 className="text-xl font-bold">
                  This item has been returned
                </h3>
                <p className="text-sm text-muted-foreground">
                  Thank you for being part of our community!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
