import pollinationsService from '~/services/pollinations'
import type { GeneratedText, PollinationsResponse, PollinationsTextParams } from '~/types/pollinations'

export async function generateArticleAIResponse({
  messages,
  model = 'openai',
  jsonMode = false,
  seed,
}: PollinationsTextParams): Promise<PollinationsResponse<GeneratedText>> {
  return pollinationsService.generateText({ messages, model, jsonMode, seed })
}

export function createArticlePrompt(messageText: string, content: string, url: string): string {
  const lowerText = messageText.toLowerCase()
  let taskDescription = ''
  if (lowerText.includes('summarize') || lowerText.includes('tóm tắt')) {
    taskDescription = 'summarize this article in a clear and concise way'
  }
  else if (lowerText.includes('explain') || lowerText.includes('giải thích')) {
    taskDescription = 'explain this article in simple terms that anyone can understand'
  }
  else if (lowerText.includes('takeaways') || lowerText.includes('điểm chính')) {
    taskDescription = 'identify the main takeaways and key points from this article'
  }
  else if (lowerText.includes('questions') || lowerText.includes('câu hỏi')) {
    taskDescription = 'generate thoughtful questions about this article to help readers think deeper'
  }
  else if (lowerText.includes('related topics') || lowerText.includes('chủ đề liên quan')) {
    taskDescription = 'suggest related topics and areas for further exploration based on this article'
  }
  else if (lowerText.includes('critical analysis') || lowerText.includes('phân tích phê bình')) {
    taskDescription = 'provide a critical analysis of this article, including strengths, weaknesses, and different perspectives'
  }
  else if (lowerText.includes('ask about this article')) {
    taskDescription = 'provide an overview of what you can help with regarding this article and offer suggestions for different types of analysis'
  }
  else {
    taskDescription = 'help with the following request about this article'
  }
  return `\nBased on the following article, please ${taskDescription}.\n\nArticle URL: ${url}\nArticle Content:\n${content}\n\nUser Request: ${messageText}\n\nPlease provide a helpful and comprehensive response in Vietnamese. Use proper formatting with bullet points, emojis, and clear structure to make your response engaging and easy to read.`
}
