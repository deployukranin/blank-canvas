/**
 * Production data placeholders.
 * All sample/mock arrays were intentionally emptied so the app starts clean.
 * Replace these with real database queries when wiring each feature to backend.
 */

export interface VideoIdea {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: 'active' | 'removed' | 'reported';
  authorName: string;
  createdAt: string;
  hasVoted?: boolean;
}

export interface DigitalSubscription {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  features: string[];
  popular?: boolean;
}

export interface VIPBenefit {
  icon: string;
  title: string;
  description: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
}

export interface FeedPost {
  id: string;
  type: 'announcement' | 'news' | 'exclusive';
  title: string;
  content: string;
  createdAt: string;
  isPinned?: boolean;
  authorUsername: string;
  authorAvatar?: string;
  authorId?: string;
}

export interface ForumComment {
  id: string;
  ideaId: string;
  content: string;
  authorUsername: string;
  authorAvatar?: string;
  authorId?: string;
  createdAt: string;
}

export interface ForumIdea {
  id: string;
  title: string;
  description: string;
  votes: number;
  authorUsername: string;
  authorAvatar?: string;
  authorId?: string;
  createdAt: string;
  commentsCount: number;
  comments?: ForumComment[];
}

// Empty arrays — production starts with no seeded content.
export const mockVideoIdeas: VideoIdea[] = [];
export const mockSubscriptions: DigitalSubscription[] = [];
export const mockVIPBenefits: VIPBenefit[] = [];
export const mockVideoCategories: CustomCategory[] = [];
export const mockAudioCategories: CustomCategory[] = [];
export const mockFeedPosts: FeedPost[] = [];
export const mockForumIdeas: ForumIdea[] = [];
