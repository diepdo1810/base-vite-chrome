import type { ArticleSuggestion } from '../types/article-suggestions'

export const defaultArticleSuggestions: ArticleSuggestion[] = [
  {
    id: 'summarize',
    title: 'Summarize this article for me.',
    prompt: 'Please provide a concise summary of the key points from this article.',
    icon: '📝',
  },
  {
    id: 'explain',
    title: 'Explain this article in simple terms.',
    prompt: 'Please explain this article in simple, easy-to-understand language.',
    icon: '💡',
  },
  {
    id: 'key-points',
    title: 'What are the main takeaways?',
    prompt: 'What are the main takeaways and key points from this article?',
    icon: '🎯',
  },
  {
    id: 'questions',
    title: 'Generate questions about this article.',
    prompt: 'Generate thoughtful questions that could help me better understand this article.',
    icon: '❓',
  },
  {
    id: 'related-topics',
    title: 'What related topics should I explore?',
    prompt: 'Based on this article, what related topics or concepts should I explore to deepen my understanding?',
    icon: '🔗',
  },
  {
    id: 'critique',
    title: 'Provide a critical analysis.',
    prompt: 'Please provide a critical analysis of this article, including its strengths, weaknesses, and any potential biases.',
    icon: '🔍',
  },
]
