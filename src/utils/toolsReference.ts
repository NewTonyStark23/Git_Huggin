export interface ToolDefinition {
  name: string;
  platform: 'github' | 'huggingface' | 'both';
  category: string;
  description: string;
  useCase: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  free: boolean;
  url?: string;
}

export const allTools: ToolDefinition[] = [
  // GitHub Tools
  { name: 'Repositories', platform: 'github', category: 'Core', description: 'A project workspace where all your files, code, and history live.', useCase: 'Store code, collaborate, share projects.', difficulty: 'beginner', free: true },
  { name: 'Gists', platform: 'github', category: 'Core', description: 'Quick code snippets or notes you can share instantly.', useCase: 'Share quick scripts, save config snippets.', difficulty: 'beginner', free: true, url: 'https://gist.github.com' },
  { name: 'Issues', platform: 'github', category: 'Project Management', description: 'Bug reports, feature requests, and task tracking.', useCase: 'Report bugs, request features, track progress.', difficulty: 'beginner', free: true },
  { name: 'Pull Requests', platform: 'github', category: 'Collaboration', description: 'A proposal to merge your changes.', useCase: 'Contribute to open source, propose changes.', difficulty: 'intermediate', free: true },
  { name: 'Actions', platform: 'github', category: 'Automation', description: 'Automated workflows that run on events.', useCase: 'Auto-test, build, and deploy code.', difficulty: 'intermediate', free: true },
  { name: 'GitHub Pages', platform: 'github', category: 'Hosting', description: 'Free website hosting from your repo.', useCase: 'Host portfolios, docs, demos for free.', difficulty: 'beginner', free: true, url: 'https://pages.github.com' },
  { name: 'Projects', platform: 'github', category: 'Project Management', description: 'Kanban boards to organize issues and PRs.', useCase: 'Plan sprints, track development.', difficulty: 'intermediate', free: true },
  { name: 'Wikis', platform: 'github', category: 'Documentation', description: 'Built-in documentation system.', useCase: 'Write detailed docs, create guides.', difficulty: 'beginner', free: true },
  { name: 'Discussions', platform: 'github', category: 'Community', description: 'Forum for Q&A and community chat.', useCase: 'Community support, brainstorming.', difficulty: 'beginner', free: true },
  { name: 'Packages', platform: 'github', category: 'Distribution', description: 'Host and share software packages.', useCase: 'Publish npm packages, Docker images.', difficulty: 'intermediate', free: true },
  { name: 'Codespaces', platform: 'github', category: 'Development', description: 'Cloud-based development environments.', useCase: 'Code from any device, quick setup.', difficulty: 'intermediate', free: false },
  { name: 'Copilot', platform: 'github', category: 'AI', description: 'AI coding assistant that suggests code.', useCase: 'Write code faster, learn new languages.', difficulty: 'beginner', free: false },
  { name: 'Security', platform: 'github', category: 'Security', description: 'Tools to find vulnerabilities.', useCase: 'Scan for vulnerabilities, manage secrets.', difficulty: 'advanced', free: true },
  { name: 'Dependabot', platform: 'github', category: 'Security', description: 'Auto-updates dependencies.', useCase: 'Keep packages updated, fix vulnerabilities.', difficulty: 'intermediate', free: true },
  { name: 'Releases', platform: 'github', category: 'Distribution', description: 'Package code into downloadable versions.', useCase: 'Distribute software, create changelogs.', difficulty: 'intermediate', free: true },
  { name: 'Organizations', platform: 'github', category: 'Teams', description: 'Group accounts for companies/teams.', useCase: 'Team collaboration, shared ownership.', difficulty: 'intermediate', free: true },
  { name: 'Sponsors', platform: 'github', category: 'Monetization', description: 'Get paid to maintain open source.', useCase: 'Fund development, support creators.', difficulty: 'beginner', free: true },
  { name: 'GitHub CLI', platform: 'github', category: 'Tools', description: 'Command-line tool for GitHub.', useCase: 'Manage GitHub from terminal.', difficulty: 'advanced', free: true },
  { name: 'Git LFS', platform: 'github', category: 'Storage', description: 'Store large files without bloating repo.', useCase: 'Track large binaries, game assets.', difficulty: 'intermediate', free: false },
  { name: 'Webhooks', platform: 'github', category: 'Integration', description: 'Automatic notifications to other services.', useCase: 'Trigger deployments, notify Slack.', difficulty: 'advanced', free: true },
  { name: 'API', platform: 'github', category: 'Integration', description: 'Programmatic access to GitHub data.', useCase: 'Build custom integrations, automate.', difficulty: 'advanced', free: true },
  { name: 'SSH Keys', platform: 'github', category: 'Security', description: 'Secure connection without passwords.', useCase: 'Push/pull code securely.', difficulty: 'intermediate', free: true },
  { name: 'Branches', platform: 'github', category: 'Core', description: 'Parallel versions of your code.', useCase: 'Feature development, experiments.', difficulty: 'beginner', free: true },
  { name: 'Commits', platform: 'github', category: 'Core', description: 'Saved snapshots of your changes.', useCase: 'Track changes, undo mistakes.', difficulty: 'beginner', free: true },
  { name: 'Forks', platform: 'github', category: 'Collaboration', description: 'Your own copy of a project.', useCase: 'Contribute to open source.', difficulty: 'beginner', free: true },
  { name: 'Stars', platform: 'github', category: 'Social', description: 'Like/favorite a repo.', useCase: 'Bookmark repos, show support.', difficulty: 'beginner', free: true },
  { name: 'Watch', platform: 'github', category: 'Social', description: 'Get notifications about a repo.', useCase: 'Stay updated on changes.', difficulty: 'beginner', free: true },
  { name: 'Templates', platform: 'github', category: 'Productivity', description: 'Pre-made repo structures.', useCase: 'Quick project setup.', difficulty: 'beginner', free: true },

  // Hugging Face Tools
  { name: 'Models', platform: 'huggingface', category: 'Core', description: 'Pre-trained AI programs for various tasks.', useCase: 'Use AI without training from scratch.', difficulty: 'beginner', free: true, url: 'https://huggingface.co/models' },
  { name: 'Datasets', platform: 'huggingface', category: 'Core', description: 'Collections of data for training AI.', useCase: 'Train models, research, benchmark.', difficulty: 'beginner', free: true, url: 'https://huggingface.co/datasets' },
  { name: 'Spaces', platform: 'huggingface', category: 'Hosting', description: 'Hosted demo apps to try AI models.', useCase: 'Try AI models, showcase work.', difficulty: 'beginner', free: true, url: 'https://huggingface.co/spaces' },
  { name: 'Inference API', platform: 'huggingface', category: 'API', description: 'Run AI models via HTTP requests.', useCase: 'Add AI to apps, test models.', difficulty: 'intermediate', free: true },
  { name: 'Inference Endpoints', platform: 'huggingface', category: 'API', description: 'Dedicated servers for models.', useCase: 'Production AI apps, high-traffic.', difficulty: 'advanced', free: false },
  { name: 'AutoTrain', platform: 'huggingface', category: 'Training', description: 'Train AI models without coding.', useCase: 'Custom AI without ML expertise.', difficulty: 'beginner', free: false },
  { name: 'Gradio', platform: 'huggingface', category: 'UI', description: 'Python library for ML web interfaces.', useCase: 'Create demos, build interfaces.', difficulty: 'intermediate', free: true },
  { name: 'Streamlit', platform: 'huggingface', category: 'UI', description: 'Python framework for data apps.', useCase: 'Data dashboards, ML demos.', difficulty: 'intermediate', free: true },
  { name: 'Transformers', platform: 'huggingface', category: 'Library', description: 'Main Python library for AI models.', useCase: 'Use any HF model in Python.', difficulty: 'intermediate', free: true },
  { name: 'Diffusers', platform: 'huggingface', category: 'Library', description: 'Library for image/video generation.', useCase: 'Generate images, build image AI.', difficulty: 'intermediate', free: true },
  { name: 'Tokenizers', platform: 'huggingface', category: 'Library', description: 'Fast text processing library.', useCase: 'Preprocess text for models.', difficulty: 'advanced', free: true },
  { name: 'PEFT', platform: 'huggingface', category: 'Training', description: 'Parameter-Efficient Fine-Tuning.', useCase: 'Fine-tune LLMs on consumer GPUs.', difficulty: 'advanced', free: true },
  { name: 'Accelerate', platform: 'huggingface', category: 'Training', description: 'Run training on any hardware.', useCase: 'Scale training, distributed training.', difficulty: 'advanced', free: true },
  { name: 'Datasets Library', platform: 'huggingface', category: 'Library', description: 'Download and process datasets.', useCase: 'Load training data, explore datasets.', difficulty: 'intermediate', free: true },
  { name: 'Hub API', platform: 'huggingface', category: 'API', description: 'Programmatic access to HF.', useCase: 'Automate uploads, build integrations.', difficulty: 'advanced', free: true },
  { name: 'SafeTensors', platform: 'huggingface', category: 'Format', description: 'Secure file format for models.', useCase: 'Store and share models safely.', difficulty: 'intermediate', free: true },
  { name: 'GGUF', platform: 'huggingface', category: 'Format', description: 'Compressed format for consumer hardware.', useCase: 'Run LLMs locally on laptops.', difficulty: 'intermediate', free: true },
  { name: 'ONNX', platform: 'huggingface', category: 'Format', description: 'Universal model format.', useCase: 'Deploy models anywhere.', difficulty: 'advanced', free: true },
  { name: 'Pipelines', platform: 'huggingface', category: 'Library', description: 'Pre-built chains for AI inference.', useCase: 'Quick AI tasks, prototyping.', difficulty: 'beginner', free: true },
  { name: 'Embeddings', platform: 'huggingface', category: 'Concept', description: 'Converting text into number vectors.', useCase: 'Search, recommendations, RAG.', difficulty: 'intermediate', free: true },
  { name: 'Quantization', platform: 'huggingface', category: 'Optimization', description: 'Compressing models for less memory.', useCase: 'Run large models on small hardware.', difficulty: 'advanced', free: true },
  { name: 'Fine-Tuning', platform: 'huggingface', category: 'Training', description: 'Training a model further on your data.', useCase: 'Custom AI for your domain.', difficulty: 'advanced', free: true },
  { name: 'Collections', platform: 'huggingface', category: 'Organization', description: 'Group related models/datasets.', useCase: 'Curate resources, organize projects.', difficulty: 'beginner', free: true },
  { name: 'Organizations', platform: 'huggingface', category: 'Teams', description: 'Team accounts for companies.', useCase: 'Team collaboration, shared models.', difficulty: 'intermediate', free: true },
  { name: 'Discussions', platform: 'huggingface', category: 'Community', description: 'Community tabs for Q&A.', useCase: 'Ask questions, report issues.', difficulty: 'beginner', free: true },
  { name: 'Likes', platform: 'huggingface', category: 'Social', description: 'Favorite models/datasets.', useCase: 'Bookmark resources, discover trending.', difficulty: 'beginner', free: true },
  { name: 'TensorBoard', platform: 'huggingface', category: 'Monitoring', description: 'Visualize training progress.', useCase: 'Monitor training, debug issues.', difficulty: 'intermediate', free: true },
  { name: 'Webhooks', platform: 'huggingface', category: 'Integration', description: 'Get notified when repos change.', useCase: 'Auto-deploy, sync with tools.', difficulty: 'advanced', free: true },
  { name: 'Access Tokens', platform: 'huggingface', category: 'Security', description: 'API keys for programmatic access.', useCase: 'API access, automated uploads.', difficulty: 'intermediate', free: true },
  { name: 'Docker Spaces', platform: 'huggingface', category: 'Hosting', description: 'Run any Docker container as a Space.', useCase: 'Custom apps, complex dependencies.', difficulty: 'advanced', free: true },
  { name: 'Static Spaces', platform: 'huggingface', category: 'Hosting', description: 'Host simple HTML/JS apps.', useCase: 'Simple demos, landing pages.', difficulty: 'beginner', free: true },
  { name: 'ZeroGPU', platform: 'huggingface', category: 'Hosting', description: 'Free GPU access for Spaces.', useCase: 'GPU-powered demos, free AI hosting.', difficulty: 'intermediate', free: true },
];

export function getToolsByPlatform(platform: 'github' | 'huggingface'): ToolDefinition[] {
  return allTools.filter(t => t.platform === platform || t.platform === 'both');
}

export function getToolsByCategory(category: string): ToolDefinition[] {
  return allTools.filter(t => t.category === category);
}

export function getToolsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): ToolDefinition[] {
  return allTools.filter(t => t.difficulty === difficulty);
}
