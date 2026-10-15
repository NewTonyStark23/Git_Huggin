// Massive AI Tool Library - Categorized with rankings

export interface LibraryTool {
  id: string;
  name: string;
  category: string;
  rank: number;
  description: string;
  features: string[];
  useCases: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  free: boolean;
  platform: 'github' | 'huggingface' | 'both';
  url: string;
  tags: string[];
  stars?: number;
  downloads?: number;
}

export const libraryCategories = [
  { id: 'all', name: 'All Tools', icon: '🌐' },
  { id: 'llm', name: 'Large Language Models', icon: '💬' },
  { id: 'image', name: 'Image Generation', icon: '🎨' },
  { id: 'audio', name: 'Audio & Speech', icon: '🎵' },
  { id: 'video', name: 'Video Generation', icon: '🎬' },
  { id: 'code', name: 'Code Generation', icon: '💻' },
  { id: 'vision', name: 'Computer Vision', icon: '👁️' },
  { id: 'nlp', name: 'Natural Language Processing', icon: '📝' },
  { id: 'translation', name: 'Translation', icon: '🌍' },
  { id: 'data', name: 'Data Science', icon: '📊' },
  { id: 'robotics', name: 'Robotics & Control', icon: '🤖' },
  { id: 'game', name: 'Game AI', icon: '🎮' },
  { id: 'music', name: 'Music Generation', icon: '🎼' },
  { id: '3d', name: '3D Generation', icon: '🧊' },
  { id: 'search', name: 'AI Search', icon: '🔍' },
];

export const libraryTools: LibraryTool[] = [
  // LLM Category
  {
    id: 'llama-3',
    name: 'Llama 3.1 405B',
    category: 'llm',
    rank: 1,
    description: 'Meta\'s most powerful open-source language model with 405 billion parameters. Excels at reasoning, coding, and multilingual tasks.',
    features: ['405B parameters', '128K context', 'Multilingual', 'Function calling', 'JSON mode', 'Open weights'],
    useCases: ['Enterprise chatbots', 'Complex reasoning', 'Code generation', 'Research', 'Content creation'],
    difficulty: 'advanced',
    free: true,
    platform: 'huggingface',
    url: 'https://huggingface.co/meta-llama/Meta-Llama-3.1-405B',
    tags: ['meta', 'open-source', 'flagship'],
    downloads: 2500000,
  },
  {
    id: 'gpt-4',
    name: 'GPT-4 Turbo',
    category: 'llm',
    rank: 2,
    description: 'OpenAI\'s most capable model with vision capabilities. Excels at complex reasoning, creative writing, and code generation.',
    features: ['Vision capabilities', '128K context', 'Function calling', 'JSON mode', 'System prompts'],
    useCases: ['Complex analysis', 'Creative writing', 'Code assistance', 'Vision tasks', 'Research'],
    difficulty: 'beginner',
    free: false,
    platform: 'both',
    url: 'https://platform.openai.com/docs/gpt-4',
    tags: ['openai', 'vision', 'premium'],
  },
  {
    id: 'claude-3',
    name: 'Claude 3.5 Sonnet',
    category: 'llm',
    rank: 3,
    description: 'Anthropic\'s balanced model offering strong performance across tasks with excellent safety and reliability.',
    features: ['200K context', 'Vision', 'Tool use', 'Constitutional AI', 'Fast inference'],
    useCases: ['Enterprise apps', 'Customer service', 'Document analysis', 'Code review'],
    difficulty: 'beginner',
    free: false,
    platform: 'both',
    url: 'https://www.anthropic.com/claude',
    tags: ['anthropic', 'safe', 'enterprise'],
  },

  // Image Generation
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    category: 'image',
    rank: 1,
    description: 'State-of-the-art open-source image generation model. Creates high-quality images from text prompts.',
    features: ['1024x1024 resolution', 'Multiple aspect ratios', 'Style control', 'Inpainting', 'Open source'],
    useCases: ['Art generation', 'Product design', 'Marketing materials', 'Concept art'],
    difficulty: 'intermediate',
    free: true,
    platform: 'huggingface',
    url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0',
    tags: ['stability', 'open-source', 'flagship'],
    downloads: 5000000,
  },
  {
    id: 'dalle-3',
    name: 'DALL-E 3',
    category: 'image',
    rank: 2,
    description: 'OpenAI\'s latest image generation model with exceptional prompt understanding and text rendering.',
    features: ['High detail', 'Text rendering', 'Prompt adherence', 'Safety filters', 'API access'],
    useCases: ['Marketing', 'Illustrations', 'Product mockups', 'Creative projects'],
    difficulty: 'beginner',
    free: false,
    platform: 'both',
    url: 'https://openai.com/dall-e-3',
    tags: ['openai', 'premium', 'text'],
  },

  // Audio & Speech
  {
    id: 'whisper',
    name: 'Whisper Large v3',
    category: 'audio',
    rank: 1,
    description: 'OpenAI\'s state-of-the-art speech recognition model. Supports 99 languages with excellent accuracy.',
    features: ['99 languages', 'High accuracy', 'Translation', 'Language detection', 'Timestamps'],
    useCases: ['Transcription', 'Subtitles', 'Voice commands', 'Meeting notes'],
    difficulty: 'beginner',
    free: true,
    platform: 'huggingface',
    url: 'https://huggingface.co/openai/whisper-large-v3',
    tags: ['openai', 'multilingual', 'transcription'],
    downloads: 8000000,
  },

  // Code Generation
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    category: 'code',
    rank: 1,
    description: 'AI-powered code completion tool integrated into popular IDEs. Suggests entire functions and code blocks.',
    features: ['Code completion', 'Function generation', 'Multi-language', 'IDE integration', 'Context-aware'],
    useCases: ['Code assistance', 'Learning', 'Prototyping', 'Documentation'],
    difficulty: 'beginner',
    free: false,
    platform: 'github',
    url: 'https://github.com/features/copilot',
    tags: ['github', 'ide', 'productivity'],
  },
];

export function getToolsByCategory(category: string): LibraryTool[] {
  if (category === 'all') {
    return libraryTools.sort((a, b) => a.rank - b.rank);
  }
  return libraryTools
    .filter(tool => tool.category === category)
    .sort((a, b) => a.rank - b.rank);
}

export function getTopRankedTools(category: string, limit: number = 5): LibraryTool[] {
  return getToolsByCategory(category).slice(0, limit);
}

export function getFreeTools(): LibraryTool[] {
  return libraryTools.filter(tool => tool.free).sort((a, b) => a.rank - b.rank);
}

export function searchLibrary(query: string): LibraryTool[] {
  const lowerQuery = query.toLowerCase();
  return libraryTools.filter(tool => 
    tool.name.toLowerCase().includes(lowerQuery) ||
    tool.description.toLowerCase().includes(lowerQuery) ||
    tool.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    tool.category.toLowerCase().includes(lowerQuery)
  );
}
