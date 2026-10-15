import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const stories = sqliteTable('stories', {
 id: text('id').primaryKey(), category: text('category').notNull(), publishedAt: text('published_at').notNull(), updatedAt: text('updated_at').notNull(), score: integer('score').notNull(), data: text('data').notNull(),
}, t => [index('idx_stories_category_published').on(t.category,t.publishedAt),index('idx_stories_score').on(t.score)]);
export const articles = sqliteTable('articles', { id:text('id').primaryKey(), url:text('url').notNull().unique(), sourceId:text('source_id').notNull(), storyId:text('story_id').notNull(), publishedAt:text('published_at').notNull(), data:text('data').notNull() });
export const sourceState = sqliteTable('source_state',{ id:text('id').primaryKey(), lastAttempt:text('last_attempt'), lastSuccess:text('last_success'), error:text('error'), itemCount:integer('item_count').notNull().default(0) });
export const quotes = sqliteTable('quotes',{symbol:text('symbol').primaryKey(),data:text('data').notNull()});
export const refreshRuns = sqliteTable('refresh_runs',{id:text('id').primaryKey(),startedAt:text('started_at').notNull(),finishedAt:text('finished_at'),status:text('status').notNull(),data:text('data')});
export const locks = sqliteTable('locks',{id:text('id').primaryKey(),expiresAt:text('expires_at').notNull(),owner:text('owner').notNull()});
export const briefVersions = sqliteTable('brief_versions', {
 id:integer('id').primaryKey({autoIncrement:true}),storyId:text('story_id').notNull(),createdAt:text('created_at').notNull(),expiresAt:text('expires_at').notNull(),fingerprint:text('fingerprint').notNull(),data:text('data').notNull(),
}, t=>[index('idx_brief_versions_story_id').on(t.storyId,t.id),index('idx_brief_versions_expires').on(t.expiresAt)]);
export const valuationLessons = sqliteTable('valuation_lessons',{date:text('date').primaryKey(),symbol:text('symbol').notNull(),createdAt:text('created_at').notNull(),data:text('data').notNull()});
export const valuationAttempts = sqliteTable('valuation_attempts',{id:integer('id').primaryKey({autoIncrement:true}),date:text('date').notNull(),attemptedAt:text('attempted_at').notNull(),status:text('status').notNull(),reason:text('reason')},t=>[index('idx_valuation_attempts_date').on(t.date,t.id)]);
