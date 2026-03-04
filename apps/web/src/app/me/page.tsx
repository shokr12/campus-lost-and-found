"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Post, Claim } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  User,
  Package,
  FileText,
  CheckCircle2,
  Clock,
  Settings,
  LogOut,
  Loader2,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";

export default function UserDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "claims">("posts");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, claimsRes] = await Promise.all([
          apiClient.get<Post[]>("/api/posts?my=true"),
          apiClient.get<Claim[]>("/api/me/claims"),
        ]);
        setPosts(postsRes.data);
        setClaims(claimsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  if (authLoading || (loading && !posts.length))
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  if (!user)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1>Please login to view your dashboard</h1>
        <Link href="/login">
          <Button className="mt-4">Login</Button>
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar / Profile Info */}
          <div className="lg:col-span-1 space-y-8">
            <div className="p-8 rounded-3xl border border-border bg-card shadow-lg text-center space-y-4">
              <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User className="h-12 w-12" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <span className="mt-2 inline-block px-2 py-0.5 rounded-full bg-secondary text-[10px] font-black uppercase tracking-widest">
                  {user.role}
                </span>
              </div>
              <div className="pt-4 flex flex-col gap-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 rounded-xl"
                >
                  <Settings className="h-4 w-4" /> Edit Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 rounded-xl text-destructive"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("posts")}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${
                  activeTab === "posts"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card border border-border hover:bg-secondary"
                }`}
              >
                <Package className="h-5 w-5" />
                <span className="font-bold">My Reported Items</span>
                <span className="ml-auto bg-black/10 px-2 py-0.5 rounded-md text-xs">
                  {posts.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("claims")}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${
                  activeTab === "claims"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card border border-border hover:bg-secondary"
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="font-bold">My Active Claims</span>
                <span className="ml-auto bg-black/10 px-2 py-0.5 rounded-md text-xs">
                  {claims.length}
                </span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              {activeTab === "posts" ? "My Reported Items" : "My Active Claims"}
            </h1>

            {activeTab === "posts" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <Link key={post.id} href={`/post/${post.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-5 rounded-3xl border border-border bg-card shadow-md flex items-center gap-4 group"
                    >
                      <div className="h-20 w-20 rounded-2xl bg-secondary overflow-hidden shrink-0">
                        {post.photoUrl ? (
                          <img
                            src={post.photoUrl}
                            alt={post.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center opacity-20">
                            <Tag className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                              post.status === "lost"
                                ? "bg-red-500 text-white"
                                : "bg-green-500 text-white"
                            }`}
                          >
                            {post.status}
                          </span>
                          {post.isResolved && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest">
                              Resolved
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold truncate group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {post.createdAt
                            ? format(new Date(post.createdAt), "MMM d, yyyy")
                            : "Unknown"}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
                {posts.length === 0 && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl">
                    <p className="text-muted-foreground">
                      You haven&apos;t reported any items yet.
                    </p>
                    <Link href="/post/new">
                      <Button variant="outline" className="mt-4">
                        Report an Item
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-6 rounded-3xl border border-border bg-card shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-2xl ${
                          claim.status === "pending"
                            ? "bg-amber-100 text-amber-600"
                            : claim.status === "accepted"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                        }`}
                      >
                        {claim.status === "pending" ? (
                          <Clock className="h-5 w-5" />
                        ) : claim.status === "accepted" ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <LogOut className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                          Claim for Post ID
                        </p>
                        <Link
                          href={`/post/${claim.postId}`}
                          className="font-bold hover:text-primary transition-colors underline underline-offset-4"
                        >
                          View Original Post
                        </Link>
                        <p className="text-sm text-muted-foreground mt-2">
                          &quot;{claim.message}&quot;
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {claim.createdAt
                          ? format(new Date(claim.createdAt), "MMM d")
                          : "Unknown"}
                      </p>
                      <span
                        className={`text-xs font-black uppercase tracking-widest mt-1 inline-block ${
                          claim.status === "pending"
                            ? "text-amber-500"
                            : claim.status === "accepted"
                              ? "text-green-500"
                              : "text-red-500"
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>
                  </div>
                ))}
                {claims.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
                    <p className="text-muted-foreground">
                      You haven&apos;t submitted any claims yet.
                    </p>
                    <Link href="/board">
                      <Button variant="outline" className="mt-4">
                        Browse Board
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
