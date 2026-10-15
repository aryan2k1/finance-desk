/** Shared Finance Desk API v1. All times are ISO UTC, null means unavailable. */
export type Category = 'economy' | 'finance' | 'technology' | 'breaking';
export interface StorySource { id: string; name: string; url: string; role: 'evidence' | 'related'; publishedAt: string | null; branding?: { imageUrl: string; link: string } }
export interface Story {
  id: string; title: string; category: Category; publishedAt: string; updatedAt: string; preview: string;
  brief: { mode: 'sourced' | 'limited'; intro: string; facts: Array<{text: string; sourceIds: string[]}>; significance?: string; watchNext?: string; limitation?: string };
  sources: StorySource[];
}
export interface StoriesResponse { stories: Story[]; total: number; page: number; pageSize: number; lastRefreshAt: string | null; nextRefreshAt: string | null }
export interface Quote { symbol: string; name: string; price: number | null; change: number | null; changePercent: number | null; currency: 'USD'; quotedAt: string | null; status: 'available' | 'unavailable' | 'stale' }
export interface QuotesResponse { quotes: Quote[]; provider: string; lastRefreshAt: string | null; limitation: string | null }
export interface SourceStatus {
  id: string; name: string; url: string; category: Category;
  status: 'healthy' | 'error' | 'disabled' | 'pending';
  permissions: { fetch: boolean; display: boolean; summarise: boolean; retentionDays: number };
  lastCheckedAt: string | null; lastSuccessAt: string | null; error: string | null;
  note: string; termsUrl: string;
}
export interface SourceStatusResponse {
  sources: SourceStatus[];
  lastRefreshAt: string | null; nextRefreshAt: string | null;
  schedule: { status: 'active' | 'not_configured'; note: string };
  access: { mode: 'private' | 'local_preview'; note: string };
}
export interface ApiError { error: string }
