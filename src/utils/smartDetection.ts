// Smart detection and installation system for GitHub/HuggingFace items

export interface InstallableItem {
  name: string;
  type: 'ollama-model' | 'python-package' | 'node-package' | 'cli-tool' | 'model-files' | 'repository';
  installMethod: string;
  installCommand: string;
  downloadUrl?: string;
  requirements?: string[];
}

// Detect if a GitHub repo is installable
export function detectGitHubInstallable(repo: any): InstallableItem | null {
  const name = repo.name?.toLowerCase() || '';
  const description = repo.description?.toLowerCase() || '';
  const topics = repo.topics?.map((t: string) => t.toLowerCase()) || [];
  
  // Check for Ollama models
  if (name.includes('ollama') || description.includes('ollama') || topics.includes('ollama')) {
    return {
      name: repo.name,
      type: 'ollama-model',
      installMethod: 'Ollama',
      installCommand: `ollama pull ${name.replace('-ollama', '').replace('ollama-', '')}`,
      downloadUrl: repo.html_url,
      requirements: ['Ollama installed']
    };
  }
  
  // Check for Python packages
  if (topics.includes('python') || topics.includes('pip') || name.includes('py') || 
      repo.language === 'Python' || description.includes('pip install')) {
    return {
      name: repo.name,
      type: 'python-package',
      installMethod: 'pip',
      installCommand: `pip install ${name}`,
      downloadUrl: repo.html_url,
      requirements: ['Python 3.7+']
    };
  }
  
  // Check for Node packages
  if (topics.includes('node') || topics.includes('npm') || topics.includes('javascript') ||
      repo.language === 'JavaScript' || repo.language === 'TypeScript') {
    return {
      name: repo.name,
      type: 'node-package',
      installMethod: 'npm',
      installCommand: `npm install ${name}`,
      downloadUrl: repo.html_url,
      requirements: ['Node.js']
    };
  }
  
  // Check for CLI tools
  if (topics.includes('cli') || topics.includes('tool') || description.includes('command line') ||
      description.includes('cli tool')) {
    return {
      name: repo.name,
      type: 'cli-tool',
      installMethod: 'Download & Install',
      installCommand: `git clone ${repo.clone_url} && cd ${name}`,
      downloadUrl: repo.html_url,
      requirements: ['Git']
    };
  }
  
  // Default: just a repository
  return {
    name: repo.name,
    type: 'repository',
    installMethod: 'Clone',
    installCommand: `git clone ${repo.clone_url}`,
    downloadUrl: repo.html_url
  };
}

// Detect if a HuggingFace model is installable
export function detectHuggingFaceInstallable(model: any): InstallableItem | null {
  const name = model.id || model.modelId || '';
  const tags = model.tags?.map((t: string) => t.toLowerCase()) || [];
  const pipeline = model.pipeline_tag?.toLowerCase() || '';
  
  // Check for GGUF models (Ollama compatible)
  if (tags.includes('gguf') || name.toLowerCase().includes('gguf')) {
    return {
      name: name,
      type: 'ollama-model',
      installMethod: 'Ollama',
      installCommand: `ollama pull ${name.split('/')[1] || name}`,
      downloadUrl: `https://huggingface.co/${name}`,
      requirements: ['Ollama installed']
    };
  }
  
  // Check for common model types
  if (pipeline.includes('text-generation') || pipeline.includes('text2text-generation') ||
      tags.includes('llm') || tags.includes('language-model')) {
    return {
      name: name,
      type: 'model-files',
      installMethod: 'Download Model',
      installCommand: `huggingface-cli download ${name}`,
      downloadUrl: `https://huggingface.co/${name}`,
      requirements: ['huggingface-hub', 'Python 3.8+']
    };
  }
  
  // Check for diffusion models
  if (pipeline.includes('text-to-image') || tags.includes('diffusion') || tags.includes('stable-diffusion')) {
    return {
      name: name,
      type: 'model-files',
      installMethod: 'Download Model',
      installCommand: `huggingface-cli download ${name}`,
      downloadUrl: `https://huggingface.co/${name}`,
      requirements: ['huggingface-hub', 'diffusers', 'Python 3.8+']
    };
  }
  
  // Default: model files
  return {
    name: name,
    type: 'model-files',
    installMethod: 'Download Model',
    installCommand: `huggingface-cli download ${name}`,
    downloadUrl: `https://huggingface.co/${name}`,
    requirements: ['huggingface-hub']
  };
}

type SkillLevel = 'beginner' | 'experienced' | 'advanced';

// Generate installation instructions
export function generateInstallInstructions(item: InstallableItem, skillLevel: SkillLevel): string {
  const instructions: string[] = [];
  
  instructions.push(`# Installing ${item.name}`);
  instructions.push(`# Method: ${item.installMethod}`);
  instructions.push('');
  
  if (item.requirements && item.requirements.length > 0) {
    instructions.push('# Requirements:');
    item.requirements.forEach(req => {
      instructions.push(`# - ${req}`);
    });
    instructions.push('');
  }
  
  if (skillLevel === 'beginner') {
    instructions.push('# Easy Installation (Beginner):');
    instructions.push('# 1. Copy the command below');
    instructions.push('# 2. Open your terminal/command prompt');
    instructions.push('# 3. Paste and press Enter');
    instructions.push('');
  }
  
  instructions.push('# Installation Command:');
  instructions.push(item.installCommand);
  instructions.push('');
  
  if (item.type === 'ollama-model') {
    instructions.push('# After installation, run:');
    instructions.push(`ollama run ${item.name.split('/')[1] || item.name}`);
  } else if (item.type === 'python-package') {
    instructions.push('# After installation, import in Python:');
    instructions.push(`import ${item.name.replace(/-/g, '_')}`);
  } else if (item.type === 'node-package') {
    instructions.push('# After installation, require in Node:');
    instructions.push(`const ${item.name.replace(/-/g, '_')} = require('${item.name}');`);
  }
  
  if (item.downloadUrl) {
    instructions.push('');
    instructions.push('# More info:');
    instructions.push(`# ${item.downloadUrl}`);
  }
  
  return instructions.join('\n');
}

// Simulate installation (in browser, we can't actually run commands)
export async function simulateInstallation(item: InstallableItem): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Installation command ready: ${item.installCommand}\n\nTo install:\n1. Open terminal\n2. Run: ${item.installCommand}\n3. Follow any additional prompts`
      });
    }, 1000);
  });
}
