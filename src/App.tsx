import { useState, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSystemSpecs, canRunModel, estimateVRAM } from './hooks/useSystemSpecs';
import { DefSpan } from './components/Tooltip';

// Types
interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
  font: string;
  borderRadius: string;
  backgroundPattern: string;
}

interface DownloadItem {
  id: string;
  name: string;
  source: 'github' | 'huggingface';
  url: string;
  size?: string;
  status: 'queued' | 'downloading' | 'complete' | 'failed';
  date: string;
  compatible?: boolean;
}

// Default themes
const defaultTheme: ThemeConfig = {
  primaryColor: '#8b5cf6',
  secondaryColor: '#ec4899',
  bgColor: '#0f0f1a',
  cardBg: '#1a1a2e',
  textColor: '#e2e8f0',
  accentColor: '#06b6d4',
  font: 'Inter',
  borderRadius: '12px',
  backgroundPattern: 'gradient',
};

const presetThemes: Record<string, ThemeConfig> = {
  cyberpunk: { ...defaultTheme, primaryColor: '#f59e0b', secondaryColor: '#ef4444', bgColor: '#0a0a0f', cardBg: '#1a1a2e', accentColor: '#22d3ee', backgroundPattern: 'grid' },
  ocean: { ...defaultTheme, primaryColor: '#0ea5e9', secondaryColor: '#06b6d4', bgColor: '#0c1222', cardBg: '#162032', accentColor: '#38bdf8', backgroundPattern: 'waves' },
  forest: { ...defaultTheme, primaryColor: '#22c55e', secondaryColor: '#84cc16', bgColor: '#0a1a0f', cardBg: '#142814', accentColor: '#4ade80', backgroundPattern: 'dots' },
  sunset: { ...defaultTheme, primaryColor: '#f97316', secondaryColor: '#ef4444', bgColor: '#1a0a0a', cardBg: '#2e1a1a', accentColor: '#fb923c', backgroundPattern: 'gradient' },
  myspace: { ...defaultTheme, primaryColor: '#a855f7', secondaryColor: '#ec4899', bgColor: '#1a0533', cardBg: '#2d1052', accentColor: '#d946ef', backgroundPattern: 'stars' },
};

// Setup Wizard Component
function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [githubToken, setGithubToken] = useLocalStorage('gh_token', '');
  const [hfToken, setHfToken] = useLocalStorage('hf_token', '');
  const [githubUser, setGithubUser] = useLocalStorage('gh_username', '');
  const [hfUser, setHfUser] = useLocalStorage('hf_username', '');

  const steps = [
    {
      title: '👋 Welcome to GIT HUGGIN!',
      content: (
        <div className="space-y-4">
          <p className="text-lg">Your unified dashboard for GitHub & Hugging Face.</p>
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-4">
            <h3 className="font-bold text-purple-300 mb-2">What is this?</h3>
            <p>This tool combines GitHub and Hugging Face into one easy-to-use page. Browse repos, download models, manage your projects - all in one place!</p>
          </div>
          <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-xl p-4">
            <h3 className="font-bold text-cyan-300 mb-2">First Time Setup</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Step 1: Enter your usernames (optional but recommended)</li>
              <li>Step 2: Add API tokens for full access (optional)</li>
              <li>Step 3: Customize your dashboard</li>
              <li>Step 4: Start exploring!</li>
            </ul>
          </div>
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4">
            <h3 className="font-bold text-green-300 mb-2">💡 Tip</h3>
            <p className="text-sm">If you're already logged into GitHub or Hugging Face in your browser, you can skip tokens for public repos. Tokens are only needed for private repos and uploads.</p>
          </div>
        </div>
      ),
    },
    {
      title: '🔑 Accounts & Tokens',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Enter your usernames and optional API tokens. Tokens give access to private repos and uploads.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">GitHub Username</label>
              <input
                type="text"
                value={githubUser}
                onChange={(e) => setGithubUser(e.target.value)}
                placeholder="your-username"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500"
              />
              <label className="block text-sm font-medium text-gray-300 mt-3">GitHub Token (optional)</label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500">Create at: GitHub → Settings → Developer Settings → Personal Access Tokens</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Hugging Face Username</label>
              <input
                type="text"
                value={hfUser}
                onChange={(e) => setHfUser(e.target.value)}
                placeholder="your-username"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500"
              />
              <label className="block text-sm font-medium text-gray-300 mt-3">Hugging Face Token (optional)</label>
              <input
                type="password"
                value={hfToken}
                onChange={(e) => setHfToken(e.target.value)}
                placeholder="hf_xxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500"
              />
              <p className="text-xs text-gray-500">Create at: Hugging Face → Settings → Access Tokens</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '🎨 Customize Your Dashboard',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Pick a theme or customize everything. You can always change this later!</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(presetThemes).map(([name, theme]) => (
              <button
                key={name}
                onClick={() => {
                  localStorage.setItem('gh_theme', JSON.stringify(theme));
                }}
                className="p-3 rounded-xl border-2 border-gray-600 hover:border-purple-500 transition-all"
                style={{ background: theme.bgColor }}
              >
                <div className="flex gap-1 mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ background: theme.primaryColor }} />
                  <div className="w-4 h-4 rounded-full" style={{ background: theme.secondaryColor }} />
                  <div className="w-4 h-4 rounded-full" style={{ background: theme.accentColor }} />
                </div>
                <span className="text-sm capitalize text-white">{name}</span>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: '🚀 You\'re All Set!',
      content: (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-purple-300">Welcome to GIT HUGGIN!</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p>✅ <strong>Browse</strong> - Search GitHub repos & HuggingFace models</p>
            <p>✅ <strong>Download</strong> - One-click downloads with compatibility checks</p>
            <p>✅ <strong>Upload</strong> - Manage your uploads in one place</p>
            <p>✅ <strong>Notes</strong> - Keep track of tools for future projects</p>
            <p>✅ <strong>Customize</strong> - Make it yours with themes & layouts</p>
          </div>
          <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4">
            <h4 className="font-bold text-yellow-300 mb-2">💡 Quick Tips</h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
              <li>Hover over any <span className="border-b border-dashed border-purple-400">technical term</span> to see what it means</li>
              <li>Green checkmarks mean the item fits your PC specs</li>
              <li>Free tools are prioritized and marked with 🆓</li>
              <li>Your notes and settings are saved automatically</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-purple-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="mb-4">
          <div className="flex gap-2 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all ${i <= step ? 'bg-purple-500' : 'bg-gray-700'}`}
              />
            ))}
          </div>
          <h2 className="text-2xl font-bold text-white">{steps[step].title}</h2>
        </div>
        <div className="py-4">{steps[step].content}</div>
        <div className="flex justify-between pt-4 border-t border-gray-700">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            className={`px-4 py-2 rounded-lg ${step > 0 ? 'bg-gray-700 text-white hover:bg-gray-600' : 'opacity-0 pointer-events-none'}`}
          >
            ← Back
          </button>
          <button
            onClick={() => {
              if (step < steps.length - 1) setStep(step + 1);
              else onComplete();
            }}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 font-medium"
          >
            {step === steps.length - 1 ? 'Start Exploring 🚀' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Notes Panel Component
function NotesPanel({ notes, setNotes, isOpen, setIsOpen }: {
  notes: Note[];
  setNotes: (notes: Note[] | ((prev: Note[]) => Note[])) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const addNote = () => {
    if (!newTitle.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      date: new Date().toLocaleDateString(),
    };
    setNotes((prev: Note[]) => [note, ...prev]);
    setNewTitle('');
    setNewContent('');
  };

  const deleteNote = (id: string) => {
    setNotes((prev: Note[]) => prev.filter(n => n.id !== id));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-purple-600 text-white px-2 py-4 rounded-l-lg hover:bg-purple-500 transition-all shadow-lg"
      >
        📝 {isOpen ? '→' : '←'}
      </button>
      <div className={`fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-purple-500/30 z-30 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 h-full flex flex-col">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            📝 Notes
            <span className="text-xs bg-purple-600 px-2 py-0.5 rounded-full">{notes.length}</span>
          </h3>
          
          {/* Add Note Form */}
          <div className="mb-3 space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Tool info, project ideas, links..."
              className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 h-20 resize-none"
            />
            <button
              onClick={addNote}
              className="w-full px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500"
            >
              + Add Note
            </button>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {notes.map(note => (
              <div key={note.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 group">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-white text-sm">{note.title}</h4>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
                {note.content && (
                  <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{note.content}</p>
                )}
                <span className="text-xs text-gray-600 mt-1 block">{note.date}</span>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-8">No notes yet. Add one above!</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Customize Panel
function CustomizePanel({ theme, setTheme, isOpen, setIsOpen }: {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
      <div className="bg-gray-900 border border-purple-500/30 rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-4">🎨 Customize Dashboard</h2>
        
        {/* Preset Themes */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Preset Themes</h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(presetThemes).map(([name, t]) => (
              <button
                key={name}
                onClick={() => setTheme(t)}
                className="p-2 rounded-lg border-2 border-gray-700 hover:border-purple-500 transition-all text-center"
                style={{ background: t.bgColor }}
              >
                <div className="flex gap-1 justify-center mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: t.primaryColor }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: t.secondaryColor }} />
                </div>
                <span className="text-xs text-white capitalize">{name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-400">Custom Colors</h3>
          {[
            { key: 'primaryColor', label: 'Primary' },
            { key: 'secondaryColor', label: 'Secondary' },
            { key: 'bgColor', label: 'Background' },
            { key: 'cardBg', label: 'Card Background' },
            { key: 'accentColor', label: 'Accent' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="text-sm text-gray-300 w-24">{label}</label>
              <input
                type="color"
                value={(theme as any)[key]}
                onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
              <span className="text-xs text-gray-500">{(theme as any)[key]}</span>
            </div>
          ))}
        </div>

        {/* Border Radius */}
        <div className="mt-4">
          <label className="text-sm text-gray-400 block mb-1">Border Radius</label>
          <input
            type="range"
            min="0"
            max="24"
            value={parseInt(theme.borderRadius)}
            onChange={(e) => setTheme({ ...theme, borderRadius: `${e.target.value}px` })}
            className="w-full"
          />
          <span className="text-xs text-gray-500">{theme.borderRadius}</span>
        </div>

        {/* Background Pattern */}
        <div className="mt-4">
          <label className="text-sm text-gray-400 block mb-2">Background Pattern</label>
          <div className="flex gap-2">
            {['gradient', 'grid', 'dots', 'waves', 'stars'].map(p => (
              <button
                key={p}
                onClick={() => setTheme({ ...theme, backgroundPattern: p })}
                className={`px-3 py-1 rounded text-xs capitalize ${theme.backgroundPattern === p ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="mt-6 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500"
        >
          Done ✓
        </button>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  // State
  const [showSetup, setShowSetup] = useLocalStorage('gh_setup_done', false);
  const [theme, setTheme] = useLocalStorage<ThemeConfig>('gh_theme', defaultTheme);
  const [notes, setNotes] = useLocalStorage<Note[]>('gh_notes', []);
  const [downloads, setDownloads] = useLocalStorage<DownloadItem[]>('gh_downloads', []);
  const [activeTab, setActiveTab] = useState<'browse' | 'downloads' | 'uploads' | 'specs'>('browse');
  const [browseSource, setBrowseSource] = useState<'all' | 'github' | 'huggingface'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadItems, setUploadItems] = useLocalStorage<any[]>('gh_uploads', []);
  
  const specs = useSystemSpecs();

  // Search GitHub
  const searchGitHub = useCallback(async (query: string) => {
    try {
      const token = localStorage.getItem('gh_token');
      const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' };
      if (token && token !== '""') headers['Authorization'] = `token ${JSON.parse(token)}`;
      
      const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`, { headers });
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        id: item.id,
        name: item.full_name,
        description: item.description || 'No description',
        stars: item.stargazers_count,
        forks: item.forks_count,
        language: item.language,
        url: item.html_url,
        source: 'github' as const,
        size: `${(item.size / 1024).toFixed(1)} MB`,
        sizeGB: (item.size / 1024 / 1024),
        topics: item.topics || [],
        license: item.license?.spdx_id || 'None',
        free: true,
        updatedAt: item.updated_at,
      }));
    } catch {
      return [];
    }
  }, []);

  // Search Hugging Face
  const searchHuggingFace = useCallback(async (query: string) => {
    try {
      const token = localStorage.getItem('hf_token');
      const headers: Record<string, string> = {};
      if (token && token !== '""') headers['Authorization'] = `Bearer ${JSON.parse(token)}`;
      
      // Search models
      const modelRes = await fetch(`https://huggingface.co/api/models?search=${encodeURIComponent(query)}&sort=downloads&direction=-1&limit=15`, { headers });
      const models = await modelRes.json();
      
      // Search datasets
      const datasetRes = await fetch(`https://huggingface.co/api/datasets?search=${encodeURIComponent(query)}&sort=downloads&direction=-1&limit=10`, { headers });
      const datasets = await datasetRes.json();

      const modelItems = (models || []).map((item: any) => ({
        id: `hf-m-${item.id}`,
        name: item.id || item.modelId,
        description: item.tags?.slice(0, 3).join(', ') || 'AI Model',
        downloads: item.downloads || 0,
        likes: item.likes || 0,
        url: `https://huggingface.co/${item.id}`,
        source: 'huggingface' as const,
        type: 'model',
        tags: item.tags || [],
        pipeline: item.pipeline_tag || 'unknown',
        library: item.library_name || 'unknown',
        sizeGB: estimateModelSize(item),
        free: true,
        updatedAt: item.lastModified,
      }));

      const datasetItems = (datasets || []).map((item: any) => ({
        id: `hf-d-${item.id}`,
        name: item.id,
        description: item.tags?.slice(0, 3).join(', ') || 'Dataset',
        downloads: item.downloads || 0,
        likes: item.likes || 0,
        url: `https://huggingface.co/datasets/${item.id}`,
        source: 'huggingface' as const,
        type: 'dataset',
        tags: item.tags || [],
        free: true,
        updatedAt: item.lastModified,
      }));

      return [...modelItems, ...datasetItems];
    } catch {
      return [];
    }
  }, []);

  // Estimate model size from params
  function estimateModelSize(model: any): number {
    const params = model.safetensors?.total || model.safetensors?.parameters;
    if (params) {
      // Rough: 1B params ≈ 2GB (fp16) or 4GB (fp32)
      return (params / 1e9) * 2;
    }
    // Default estimate
    const tags = (model.tags || []).join(' ').toLowerCase();
    if (tags.includes('7b') || tags.includes('7B')) return 14;
    if (tags.includes('13b') || tags.includes('13B')) return 26;
    if (tags.includes('70b') || tags.includes('70B')) return 140;
    return 2; // Default small model
  }

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResults([]);

    let allResults: any[] = [];
    
    if (browseSource === 'all' || browseSource === 'github') {
      const ghResults = await searchGitHub(searchQuery);
      allResults = [...allResults, ...ghResults];
    }
    
    if (browseSource === 'all' || browseSource === 'huggingface') {
      const hfResults = await searchHuggingFace(searchQuery);
      allResults = [...allResults, ...hfResults];
    }

    // Sort: free first, then by stars/downloads
    allResults.sort((a, b) => {
      if (a.free !== b.free) return b.free ? 1 : -1;
      const aScore = a.stars || a.downloads || 0;
      const bScore = b.stars || b.downloads || 0;
      return bScore - aScore;
    });

    setResults(allResults);
    setLoading(false);
  };

  // Download handler
  const handleDownload = (item: any) => {
    const download: DownloadItem = {
      id: Date.now().toString(),
      name: item.name,
      source: item.source,
      url: item.url,
      size: item.size || 'Unknown',
      status: 'complete',
      date: new Date().toLocaleDateString(),
      compatible: item.sizeGB ? canRunModel(specs, item.sizeGB) : undefined,
    };
    setDownloads((prev: DownloadItem[]) => [download, ...prev]);
    // Open in new tab for actual download
    window.open(item.url, '_blank');
  };

  // Background pattern styles
  const getBackgroundStyle = () => {
    const base = { backgroundColor: theme.bgColor };
    switch (theme.backgroundPattern) {
      case 'grid':
        return { ...base, backgroundImage: `linear-gradient(${theme.primaryColor}11 1px, transparent 1px), linear-gradient(90deg, ${theme.primaryColor}11 1px, transparent 1px)`, backgroundSize: '40px 40px' };
      case 'dots':
        return { ...base, backgroundImage: `radial-gradient(${theme.primaryColor}33 1px, transparent 1px)`, backgroundSize: '20px 20px' };
      case 'waves':
        return { ...base, backgroundImage: `repeating-linear-gradient(45deg, ${theme.primaryColor}08, ${theme.primaryColor}08 10px, transparent 10px, transparent 20px)` };
      case 'stars':
        return { ...base, backgroundImage: `radial-gradient(${theme.accentColor}22 1px, transparent 1px), radial-gradient(${theme.secondaryColor}15 1px, transparent 1px)`, backgroundSize: '50px 50px, 30px 30px', backgroundPosition: '0 0, 25px 25px' };
      default:
        return { ...base, backgroundImage: `linear-gradient(135deg, ${theme.bgColor}, ${theme.cardBg})` };
    }
  };

  // Show setup wizard on first visit
  if (!showSetup) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <SetupWizard onComplete={() => setShowSetup(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white transition-all duration-300" style={{ ...getBackgroundStyle(), fontFamily: theme.font, color: theme.textColor }}>
      {/* Notes Panel */}
      <NotesPanel notes={notes} setNotes={setNotes} isOpen={showNotes} setIsOpen={setShowNotes} />
      
      {/* Customize Panel */}
      <CustomizePanel theme={theme} setTheme={setTheme} isOpen={showCustomize} setIsOpen={setShowCustomize} />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b backdrop-blur-xl" style={{ borderColor: `${theme.primaryColor}33`, backgroundColor: `${theme.bgColor}ee` }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                GIT HUGGIN
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/30">v1.0</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomize(true)}
                className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
                title="Customize dashboard"
              >
                🎨 Customize
              </button>
              <button
                onClick={() => setShowSetup(false)}
                className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
                title="View setup guide again"
              >
                ❓ Help
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* System Specs Bar */}
        <div className="mb-4 p-3 rounded-xl border flex flex-wrap items-center gap-4 text-xs" style={{ backgroundColor: `${theme.cardBg}`, borderColor: `${theme.primaryColor}33` }}>
          <span className="flex items-center gap-1">
            <span className="text-gray-400">CPU:</span>
            <span className="text-white">{specs.cpuCores} cores</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-gray-400">RAM:</span>
            <span className="text-white">{specs.ramGB ? `${specs.ramGB} GB` : 'N/A'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-gray-400">GPU:</span>
            <span className="text-white truncate max-w-[200px]">{specs.gpuInfo}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-gray-400">VRAM:</span>
            <span className="text-white">{estimateVRAM(specs.gpuInfo) ? `${estimateVRAM(specs.gpuInfo)} GB` : 'Estimating...'}</span>
          </span>
          {specs.hasWebGPU && (
            <span className="px-2 py-0.5 bg-green-600/30 text-green-300 rounded-full border border-green-500/30">WebGPU ✓</span>
          )}
          <span className="ml-auto text-gray-500">🟢 Green checks = compatible with your PC</span>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-800/50 p-1 rounded-xl w-fit">
          {[
            { id: 'browse', label: '🔍 Browse & Download', def: 'Search and download repos, models, and datasets' },
            { id: 'downloads', label: '📥 Downloads', def: 'Your download history' },
            { id: 'uploads', label: '📤 Uploads', def: 'Manage your uploaded projects' },
            { id: 'specs', label: '💻 System Info', def: 'Your computer specifications' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title={tab.def}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search repos, models, datasets..."
                  className="w-full px-4 py-3 rounded-xl border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ backgroundColor: theme.cardBg, borderColor: `${theme.primaryColor}44` }}
                />
              </div>
              <div className="flex gap-1">
                {(['all', 'github', 'huggingface'] as const).map(src => (
                  <button
                    key={src}
                    onClick={() => setBrowseSource(src)}
                    className={`px-3 py-2 rounded-lg text-sm capitalize transition-all ${browseSource === src ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                  >
                    {src === 'all' ? '🌐 All' : src === 'github' ? '🐙 GitHub' : '🤗 HF'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
              >
                {loading ? '⏳ Searching...' : '🔍 Search'}
              </button>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-gray-500 py-1">Quick search:</span>
              {[
                { label: 'LLM', query: 'large language model' },
                { label: 'Image Gen', query: 'image generation' },
                { label: 'Code', query: 'code assistant' },
                { label: 'Stable Diffusion', query: 'stable diffusion' },
                { label: 'Whisper', query: 'whisper speech' },
                { label: 'BERT', query: 'bert nlp' },
                { label: '🆓 Free Tools', query: 'free open source' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    setSearchQuery(item.query);
                    // Trigger search directly
                    setLoading(true);
                    setResults([]);
                    (async () => {
                      let allResults: any[] = [];
                      if (browseSource === 'all' || browseSource === 'github') {
                        const ghResults = await searchGitHub(item.query);
                        allResults = [...allResults, ...ghResults];
                      }
                      if (browseSource === 'all' || browseSource === 'huggingface') {
                        const hfResults = await searchHuggingFace(item.query);
                        allResults = [...allResults, ...hfResults];
                      }
                      allResults.sort((a, b) => {
                        if (a.free !== b.free) return b.free ? 1 : -1;
                        const aScore = a.stars || a.downloads || 0;
                        const bScore = b.stars || b.downloads || 0;
                        return bScore - aScore;
                      });
                      setResults(allResults);
                      setLoading(false);
                    })();
                  }}
                  className="px-2 py-1 rounded-md text-xs bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border border-transparent hover:border-purple-500/30"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Results */}
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin text-4xl mb-3">⏳</div>
                <p className="text-gray-400">Searching across platforms...</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((item) => {
                  const compatible = item.sizeGB ? canRunModel(specs, item.sizeGB) : null;
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-xl group"
                      style={{ backgroundColor: theme.cardBg, borderColor: `${theme.primaryColor}33`, borderRadius: theme.borderRadius }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm truncate group-hover:text-purple-300 transition-colors">
                            {item.source === 'github' ? '🐙' : '🤗'} {item.name}
                          </h3>
                          {compatible !== null && (
                            <span className={`inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full ${compatible ? 'bg-green-600/20 text-green-300 border border-green-500/30' : 'bg-red-600/20 text-red-300 border border-red-500/30'}`}>
                              {compatible ? '✓ Compatible' : '✗ May be too large'}
                            </span>
                          )}
                        </div>
                        {item.free && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-600/20 text-green-300 border border-green-500/30 shrink-0 ml-2">🆓 Free</span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.source === 'github' ? (
                          <>
                            {item.language && <span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-300">{item.language}</span>}
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">⭐ {item.stars?.toLocaleString()}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">🍴 {item.forks?.toLocaleString()}</span>
                            {item.license !== 'None' && <span className="text-xs px-2 py-0.5 rounded bg-yellow-600/20 text-yellow-300">📜 {item.license}</span>}
                          </>
                        ) : (
                          <>
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-600/20 text-purple-300 capitalize">{item.type}</span>
                            {item.pipeline && item.pipeline !== 'unknown' && <span className="text-xs px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-300">{item.pipeline}</span>}
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">⬇️ {item.downloads?.toLocaleString()}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">❤️ {item.likes}</span>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(item)}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
                        >
                          📥 Download
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                        >
                          🔗 Open
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && results.length === 0 && searchQuery && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-3">🔍</p>
                <p>No results found. Try a different search term.</p>
              </div>
            )}

            {!loading && results.length === 0 && !searchQuery && (
              <div className="text-center py-16">
                <p className="text-6xl mb-4">🚀</p>
                <h2 className="text-xl font-bold text-white mb-2">Start Exploring!</h2>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  Search for <DefSpan term="repo">repositories</DefSpan>, <DefSpan term="model">AI models</DefSpan>, or <DefSpan term="dataset">datasets</DefSpan> across GitHub and Hugging Face — all in one place.
                </p>
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-3">Try searching for:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['llama', 'stable diffusion', 'whisper', 'react', 'python', 'transformers', 'image generation', 'code assistant'].map(q => (
                      <button
                        key={q}
                        onClick={() => {
                          setSearchQuery(q);
                          setTimeout(() => {
                            const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                            if (input) {
                              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                              nativeInputValueSetter?.call(input, q);
                              input.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                          }, 50);
                        }}
                        className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all text-sm border border-gray-700 hover:border-purple-500/50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                    <p className="text-2xl mb-2">🐙</p>
                    <h3 className="font-bold text-white text-sm">GitHub</h3>
                    <p className="text-xs text-gray-400 mt-1">Code repos, tools, libraries</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                    <p className="text-2xl mb-2">🤗</p>
                    <h3 className="font-bold text-white text-sm">Hugging Face</h3>
                    <p className="text-xs text-gray-400 mt-1">AI models, datasets, demos</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                    <p className="text-2xl mb-2">✨</p>
                    <h3 className="font-bold text-white text-sm">Unified</h3>
                    <p className="text-xs text-gray-400 mt-1">Everything in one dashboard</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Downloads Tab */}
        {activeTab === 'downloads' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">📥 Download History</h2>
            {downloads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-3">📭</p>
                <p>No downloads yet. Browse and download some repos or models!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {downloads.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border" style={{ backgroundColor: theme.cardBg, borderColor: `${theme.primaryColor}22` }}>
                    <span className="text-2xl">{item.source === 'github' ? '🐙' : '🤗'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.date} • {item.size}</p>
                    </div>
                    {item.compatible !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.compatible ? 'bg-green-600/20 text-green-300' : 'bg-yellow-600/20 text-yellow-300'}`}>
                        {item.compatible ? '✓ Fits your PC' : '⚠ Check specs'}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'complete' ? 'bg-green-600/20 text-green-300' : 'bg-yellow-600/20 text-yellow-300'}`}>
                      {item.status}
                    </span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:text-purple-300">
                      Open ↗
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Uploads Tab */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">📤 Upload Manager</h2>
            <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.cardBg, borderColor: `${theme.primaryColor}33` }}>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Add an Upload</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  id="upload-name"
                  placeholder="Project name"
                  className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm placeholder-gray-500"
                />
                <select
                  id="upload-source"
                  className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm"
                >
                  <option value="github">GitHub</option>
                  <option value="huggingface">Hugging Face</option>
                </select>
                <input
                  type="text"
                  id="upload-url"
                  placeholder="Repo/Model URL"
                  className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm placeholder-gray-500 md:col-span-2"
                />
                <textarea
                  id="upload-desc"
                  placeholder="Description / Notes"
                  className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm placeholder-gray-500 md:col-span-2 h-20 resize-none"
                />
              </div>
              <button
                onClick={() => {
                  const name = (document.getElementById('upload-name') as HTMLInputElement)?.value;
                  const source = (document.getElementById('upload-source') as HTMLSelectElement)?.value;
                  const url = (document.getElementById('upload-url') as HTMLInputElement)?.value;
                  const desc = (document.getElementById('upload-desc') as HTMLTextAreaElement)?.value;
                  if (name && url) {
                    setUploadItems((prev: any[]) => [{ id: Date.now().toString(), name, source, url, description: desc, date: new Date().toLocaleDateString(), status: 'active' }, ...prev]);
                    (document.getElementById('upload-name') as HTMLInputElement).value = '';
                    (document.getElementById('upload-url') as HTMLInputElement).value = '';
                    (document.getElementById('upload-desc') as HTMLTextAreaElement).value = '';
                  }
                }}
                className="mt-3 px-4 py-2 rounded-lg text-sm text-white font-medium"
                style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
              >
                + Add Upload
              </button>
            </div>

            {uploadItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-3">📦</p>
                <p>No uploads tracked yet. Add your projects above!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {uploadItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border" style={{ backgroundColor: theme.cardBg, borderColor: `${theme.primaryColor}22` }}>
                    <span className="text-2xl">{item.source === 'github' ? '🐙' : '🤗'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:text-purple-300">
                      View ↗
                    </a>
                    <button
                      onClick={() => setUploadItems((prev: any[]) => prev.filter((i: any) => i.id !== item.id))}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* System Specs Tab */}
        {activeTab === 'specs' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">💻 Your System</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.cardBg, borderColor: `${theme.primaryColor}33` }}>
                <h3 className="font-bold text-white mb-3">Hardware</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">CPU Cores</span>
                    <span className="text-white">{specs.cpuCores}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">RAM</span>
                    <span className="text-white">{specs.ramGB ? `${specs.ramGB} GB` : 'Not detectable'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">GPU</span>
                    <span className="text-white text-right max-w-[200px] truncate">{specs.gpuInfo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. VRAM</span>
                    <span className="text-white">{estimateVRAM(specs.gpuInfo) ? `${estimateVRAM(specs.gpuInfo)} GB` : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">WebGPU</span>
                    <span className={specs.hasWebGPU ? 'text-green-400' : 'text-gray-500'}>{specs.hasWebGPU ? '✓ Available' : '✗ Not available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Screen</span>
                    <span className="text-white">{specs.screenRes}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.cardBg, borderColor: `${theme.primaryColor}33` }}>
                <h3 className="font-bold text-white mb-3">What You Can Run</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { name: 'Small models (< 2GB)', size: 2, icon: '✅' },
                    { name: 'Medium models (2-8GB)', size: 8, icon: estimateVRAM(specs.gpuInfo) && estimateVRAM(specs.gpuInfo)! >= 8 ? '✅' : '⚠️' },
                    { name: 'Large models (8-16GB)', size: 16, icon: estimateVRAM(specs.gpuInfo) && estimateVRAM(specs.gpuInfo)! >= 16 ? '✅' : '❌' },
                    { name: 'XL models (16-24GB)', size: 24, icon: estimateVRAM(specs.gpuInfo) && estimateVRAM(specs.gpuInfo)! >= 24 ? '✅' : '❌' },
                    { name: '7B parameter LLMs', size: 14, icon: canRunModel(specs, 14) ? '✅' : '⚠️' },
                    { name: '13B parameter LLMs', size: 26, icon: canRunModel(specs, 26) ? '✅' : '❌' },
                    { name: 'Stable Diffusion', size: 7, icon: canRunModel(specs, 7) ? '✅' : '⚠️' },
                    { name: 'Whisper (speech)', size: 3, icon: canRunModel(specs, 3) ? '✅' : '✅' },
                  ].map(item => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-gray-300">{item.icon} {item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-blue-900/20 border-blue-500/30">
              <h3 className="font-bold text-blue-300 mb-2">💡 Recommendations</h3>
              <p className="text-sm text-gray-300">
                Based on your system ({specs.cpuCores} cores, {specs.ramGB || '?'}GB RAM, {specs.gpuInfo !== 'Unknown' ? specs.gpuInfo : 'GPU info unavailable'}), 
                we recommend starting with <DefSpan term="quantization">quantized</DefSpan> models in <DefSpan term="gguf">GGUF format</DefSpan> for local use. 
                For larger models, try Hugging Face <DefSpan term="space">Spaces</DefSpan> which run in the cloud for free!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t py-4 text-center text-xs text-gray-600" style={{ borderColor: `${theme.primaryColor}22` }}>
        <p>GIT HUGGIN — Unified GitHub & Hugging Face Dashboard</p>
        <p className="mt-1">
          <DefSpan term="repo">Repos</DefSpan> • <DefSpan term="model">Models</DefSpan> • <DefSpan term="dataset">Datasets</DefSpan> • <DefSpan term="space">Spaces</DefSpan> — All in one place
        </p>
      </footer>
    </div>
  );
}
