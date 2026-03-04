"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Report, User, Post, Claim } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  Trash2,
  CheckCircle,
  Users,
  Loader2,
  Info,
  LayoutDashboard,
  ClipboardList,
  Search,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tab = "reports" | "posts" | "claims";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allClaims, setAllClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("reports");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, postsRes, claimsRes] = await Promise.all([
        apiClient.get<Report[]>("/api/admin/reports"),
        apiClient.get<Post[]>("/api/posts?includeExpired=true"),
        apiClient.get<Claim[]>("/api/admin/claims"),
      ]);
      setReports(reportsRes.data);
      setPosts(postsRes.data);
      setAllClaims(claimsRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !authLoading &&
      (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR"))
    ) {
      router.push("/");
      return;
    }
    if (user) fetchData();
  }, [user, authLoading]);

  const handleCleanup = async () => {
    if (
      !confirm(
        "Are you sure you want to cleanup all expired posts? This cannot be undone.",
      )
    )
      return;
    setCleaningUp(true);
    try {
      await apiClient.post("/api/admin/cleanup-expired");
      fetchData();
      alert("Cleanup successful!");
    } catch (err) {
      console.error("Cleanup failed", err);
    } finally {
      setCleaningUp(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await apiClient.delete(`/api/posts/${id}`);
      fetchData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    // For now, we don't have a specific report-resolve endpoint,
    // but we can simulate it or just update the local state if the backend supported it.
    // Let's assume there's a PATCH /api/reports/{id}
    try {
      // await apiClient.patch(`/api/reports/${reportId}`, { resolved: true });
      // alert("Report marked as resolved");
      fetchData();
    } catch (err) {
      console.error("Resolve failed", err);
    }
  };

  if (authLoading || (loading && posts.length === 0 && reports.length === 0 && allClaims.length === 0))
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );

  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR"))
    return null;

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredClaims = allClaims.filter(
    (c) =>
      c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.claimantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.postTitle?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="p-5 rounded-[2.5rem] bg-primary text-white shadow-2xl shadow-primary/20">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tighter">
                Control Center
              </h1>
              <p className="text-muted-foreground font-semibold flex items-center gap-2">
                Logged in as{" "}
                <span className="text-primary uppercase tracking-widest text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {user.role}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchData}
              className="rounded-full gap-2 border-2"
            >
              <LayoutDashboard className="h-4 w-4" /> Refresh Data
            </Button>
            <Button
              variant="destructive"
              onClick={handleCleanup}
              disabled={cleaningUp || user.role !== "ADMIN"}
              className="rounded-full gap-2 shadow-xl hover:shadow-red-500/20"
            >
              {cleaningUp ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Cleanup Database
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            {
              label: "Active Reports",
              val: reports.filter((r) => !r.resolvedAt).length,
              icon: AlertTriangle,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
            {
              label: "Total Claims",
              val: allClaims.length,
              icon: MessageSquare,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Resolved Items",
              val: posts.filter((p) => p.isResolved).length,
              icon: CheckCircle,
              color: "text-green-500",
              bg: "bg-green-500/10",
            },
            {
              label: "Pending Tasks",
              val:
                reports.filter((r) => !r.resolvedAt).length +
                allClaims.filter((c) => c.status === "pending").length,
              icon: Info,
              color: "text-primary",
              bg: "bg-primary/10",
            },
          ].map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label}
              className="p-8 rounded-[2rem] border-2 border-border bg-card shadow-sm hover:shadow-xl transition-all group"
            >
              <div
                className={`p-3 w-fit rounded-2xl mb-4 ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">
                {stat.label}
              </p>
              <p className="text-4xl font-black">{stat.val}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Interface */}
        <div className="space-y-8">
          {/* Tabs & Search */}
          <div className="flex flex-col md:flex-row justify-between gap-6 items-center">
            <div className="bg-secondary/50 p-1.5 rounded-full flex border-2 border-border overflow-hidden">
              <button
                onClick={() => setActiveTab("reports")}
                className={`px-8 py-2.5 rounded-full text-sm font-black transition-all ${activeTab === "reports" ? "bg-white dark:bg-card shadow-lg text-primary scale-105" : "text-muted-foreground hover:text-foreground"}`}
              >
                Reports ({reports.length})
              </button>
              <button
                onClick={() => setActiveTab("claims")}
                className={`px-8 py-2.5 rounded-full text-sm font-black transition-all ${activeTab === "claims" ? "bg-white dark:bg-card shadow-lg text-primary scale-105" : "text-muted-foreground hover:text-foreground"}`}
              >
                Claims ({allClaims.length})
              </button>
              <button
                onClick={() => setActiveTab("posts")}
                className={`px-8 py-2.5 rounded-full text-sm font-black transition-all ${activeTab === "posts" ? "bg-white dark:bg-card shadow-lg text-primary scale-105" : "text-muted-foreground hover:text-foreground"}`}
              >
                Posts ({posts.length})
              </button>
            </div>

            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search board records..."
                className="w-full bg-white dark:bg-card border-2 border-border rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-card border-2 border-border rounded-[3rem] overflow-hidden shadow-2xl relative">
            <AnimatePresence mode="wait">
              {activeTab === "reports" ? (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="min-h-[400px]"
                >
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-secondary/30 border-b-2 border-border">
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Post Reference
                        </th>
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Report Reason
                        </th>
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Timestamp
                        </th>
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground text-right">
                          Moderation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reports.map((report) => (
                        <tr
                          key={report.id}
                          className="hover:bg-primary/[0.02] transition-colors"
                        >
                          <td className="px-8 py-6">
                            <Link
                              href={`/post/${report.postId}`}
                              className="group flex items-center gap-3"
                            >
                              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-xs">
                                IMG
                              </div>
                              <div>
                                <p className="text-sm font-black group-hover:text-primary transition-colors">
                                  Post ID: {report.postId.slice(0, 8)}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                  View Details{" "}
                                  <ExternalLink className="inline h-2 w-2" />
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-600 font-black text-[10px] uppercase tracking-tighter">
                                {report.reason}
                              </span>
                              <p className="text-xs text-muted-foreground italic truncate max-w-xs">
                                {report.details}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-xs font-medium text-muted-foreground">
                            {format(new Date(report.createdAt), "MMM d, HH:mm")}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full font-bold text-xs px-5 border-2 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                            >
                              Resolve
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reports.length === 0 && (
                    <EmptyState text="No active reports. Community is behaving!" />
                  )}
                </motion.div>
              ) : activeTab === "claims" ? (
                <motion.div
                  key="claims"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="min-h-[400px]"
                >
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-secondary/30 border-b-2 border-border">
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Item / Post
                        </th>
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Claimant
                        </th>
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Status
                        </th>
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground text-right">
                          Message
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredClaims.map((claim) => (
                        <tr
                          key={claim.id}
                          className="hover:bg-primary/[0.02] transition-colors"
                        >
                          <td className="px-8 py-6">
                            <Link href={`/post/${claim.postId}`} className="group">
                              <p className="text-sm font-black group-hover:text-primary transition-colors">
                                {claim.postTitle || `Post ${claim.postId.slice(0, 8)}`}
                              </p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">
                                ID: {claim.id.slice(0, 8)}
                              </p>
                            </Link>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-3 w-3 text-primary" />
                              </div>
                              <span className="text-xs font-bold">
                                {claim.claimantName || "Student"}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                claim.status === "accepted"
                                  ? "bg-green-100 text-green-600"
                                  : claim.status === "rejected"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-amber-100 text-amber-600"
                              }`}
                            >
                              {claim.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right text-xs font-medium text-muted-foreground italic truncate max-w-[200px]">
                            &quot;{claim.message}&quot;
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredClaims.length === 0 && (
                    <EmptyState text="No claims found in system." />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="min-h-[400px]"
                >
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-secondary/30 border-b-2 border-border">
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Item Info
                        </th>
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Category
                        </th>
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                          Status
                        </th>
                        <th className="px-8 py-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPosts.map((post) => (
                        <tr
                          key={post.id}
                          className="hover:bg-primary/[0.02] transition-colors"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-secondary overflow-hidden shadow-inner flex shrink-0">
                                {post.photoUrl ? (
                                  <img
                                    src={post.photoUrl}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="m-auto text-xs opacity-20">
                                    <Info />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black truncate">
                                  {post.title}
                                </p>
                                <p className="max-w-[200px] text-xs text-muted-foreground truncate">
                                  {post.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-xs">
                            <span className="font-black uppercase tracking-widest text-primary/70">
                              {post.category}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${post.isResolved ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"}`}
                              />
                              <span className="text-[10px] font-black uppercase tracking-tighter">
                                {post.isResolved ? "Resolved" : "Active"}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex gap-2 justify-end">
                              <Link href={`/post/${post.id}`}>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="rounded-full hover:bg-primary/10 transition-colors"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPosts.length === 0 && (
                    <EmptyState text="No posts found matching your search." />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-32 text-center">
      <div className="mx-auto w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
        <Search className="h-10 w-10 text-muted-foreground/30" />
      </div>
      <p className="text-muted-foreground font-semibold italic text-lg">
        {text}
      </p>
    </div>
  );
}
