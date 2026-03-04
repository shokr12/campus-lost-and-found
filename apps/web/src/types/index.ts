export type UserRole = "ADMIN" | "MODERATOR" | "USER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type PostStatus = "lost" | "found";

export interface Post {
  id: string;
  userId: string;
  status: PostStatus;
  title: string;
  description: string;
  category: string;
  location: string;
  dateLostOrFound: string;
  photoUrl?: string;
  contactEncrypted?: string;
  isResolved: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ClaimStatus = "pending" | "accepted" | "rejected";

export interface Claim {
  id: string;
  postId: string;
  claimantUserId: string;
  message: string;
  verificationEncrypted?: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
  postTitle?: string;
  claimantName?: string;
}

export interface Report {
  id: string;
  postId: string;
  reporterUserId: string;
  reason: string;
  details?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
