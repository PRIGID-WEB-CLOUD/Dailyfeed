
'use server';

/**
 * @fileOverview An AI flow to recommend articles based on the content of a source article.
 *
 * - recommendArticles - A function that suggests relevant articles.
 * - RecommendArticlesInput - The input type for the function.
 * - RecommendArticlesOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Post } from '@/lib/types';

const ArticleInfoSchema = z.object({
  slug: z.string(),
  title: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
});

const RecommendArticlesInputSchema = z.object({
  sourceArticleContent: z.string().describe('The content of the source article to base recommendations on.'),
  sourceArticleTitle: z.string().describe('The title of the source article.'),
  sourceArticleSlug: z.string().describe('The slug of the source article.'),
  allArticles: z.array(ArticleInfoSchema).describe('A list of all available articles to choose from.'),
});
export type RecommendArticlesInput = z.infer<typeof RecommendArticlesInputSchema>;

const RecommendedArticleSchema = z.object({
  slug: z.string().describe('The slug of the recommended article.'),
  title: z.string().describe('The title of the recommended article.'),
  reason: z.string().describe('A brief reason why this article is recommended.'),
});

const RecommendArticlesOutputSchema = z.object({
  recommendations: z.array(RecommendedArticleSchema).describe('A list of recommended articles.'),
});
export type RecommendArticlesOutput = z.infer<typeof RecommendArticlesOutputSchema>;

async function getAllPosts(): Promise<Post[]> {
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, where('status', '==', 'Published'));
    const postsSnapshot = await getDocs(q);
    return postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
}


export async function recommendArticles(
  input: Omit<RecommendArticlesInput, 'allArticles'>
): Promise<RecommendArticlesOutput> {
  const allDbPosts = await getAllPosts();
  const allArticles = allDbPosts.map((post: Post) => ({
      slug: post.slug,
      title: post.title,
      category: post.category,
      tags: post.tags,
  }));
  
  const flowInput: RecommendArticlesInput = {
      ...input,
      allArticles,
  };

  return recommendArticlesFlow(flowInput);
}

const prompt = ai.definePrompt({
  name: 'recommendArticlesPrompt',
  input: { schema: RecommendArticlesInputSchema },
  output: { schema: RecommendArticlesOutputSchema },
  prompt: `You are a content recommendation engine for a blog. Your goal is to suggest relevant articles to a reader who has just finished reading a post.

Current Article Title: {{{sourceArticleTitle}}}
Current Article Content:
{{{sourceArticleContent}}}

Here is a list of all available articles:
{{#each allArticles}}
- Title: "{{this.title}}", Slug: "{{this.slug}}", Category: "{{this.category}}", Tags: [{{#each this.tags}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}]
{{/each}}

Based on the current article, recommend 3 other articles from the list that the reader would likely be interested in. Do not recommend the source article itself. For each recommendation, provide a short, compelling reason (one sentence) why the reader would enjoy it.
`,
});

const recommendArticlesFlow = ai.defineFlow(
  {
    name: 'recommendArticlesFlow',
    inputSchema: RecommendArticlesInputSchema,
    outputSchema: RecommendArticlesOutputSchema,
  },
  async (input) => {
     // Filter out the source article from the list of all articles
    const filteredArticles = input.allArticles.filter(
      (article) => article.slug !== input.sourceArticleSlug
    );
    const modifiedInput = { ...input, allArticles: filteredArticles };
    
    const { output } = await prompt(modifiedInput);
    return output!;
  }
);
