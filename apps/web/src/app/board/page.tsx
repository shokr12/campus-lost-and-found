"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Post } from "@/types";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Tag,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import Link from "next/link";

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (status) params.append("status", status);
      if (search) params.append("q", search);

      const res = await apiClient.get<Post[]>(
        `/api/posts?${params.toString()}`,
      );
      setPosts(res.data);
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [category, status]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Lost & Found Board
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse and search for items across campus
            </p>
          </div>

          <Link href="/post/new">
            <Button className="rounded-full shadow-lg">Report New Item</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="sticky top-20 z-40 flex flex-wrap items-center gap-3 bg-background/95 backdrop-blur py-4 border-b border-border mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchPosts()}
              className="h-10 w-full sm:w-64 rounded-xl border border-input bg-secondary/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="h-10 rounded-xl border border-input bg-secondary/50 px-3 text-sm focus:outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>

            <select
              className="h-10 rounded-xl border border-input bg-secondary/50 px-3 text-sm focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
              <option value="IDs">IDs & Cards</option>
              <option value="accessories">Accessories</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Board Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-[400px] rounded-2xl bg-secondary animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="aspect-[4/3] w-full bg-secondary relative overflow-hidden">
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
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
                        <Tag className="h-10 w-10 text-white/50" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${
                      post.status === "lost"
                        ? "bg-red-500 text-white"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {post.status}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg line-clamp-1">
                      {post.title}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
                    {post.description}
                  </p>

                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{post.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {post.dateLostOrFound
                          ? format(
                              new Date(post.dateLostOrFound),
                              "MMM d, yyyy",
                            )
                          : "No date provided"}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/post/${post.id}`}
                  className="absolute inset-0 z-10"
                >
                  <span className="sr-only">View Details</span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="p-6 rounded-full bg-secondary mb-4">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">No items found</h2>
            <p className="text-muted-foreground mt-2">
              Try adjusting your filters or search terms
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-full"
              onClick={() => {
                setCategory("");
                setStatus("");
                setSearch("");
                fetchPosts();
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
