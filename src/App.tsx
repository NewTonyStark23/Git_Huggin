import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSystemSpecs, canRunModel, estimateVRAM } from './hooks/useSystemSpecs';
import { DefSpan } from './components/Tooltip';
import { allTools, getToolsByPlatform, type ToolDefinition } from './utils/toolsReference';
import { libraryTools, libraryCategories, getToolsByCategory, type LibraryTool } from './utils/libraryData';

// ============ TYPES ============
interface Note { id: string; title: string; content: string; date: string; }
interface DownloadItem { id: string; name: string; source: 'github' | 'huggingface'; url: string; size?: string; status: string; date: string; compatible?: boolean; }
type SkillLevel = 'beginner' | 'experienced' | 'advanced';
type ActivePage = 'dashboard' | 'library' | 'tools' | 'profiles' | 'cloud' | 'downloads' | 'uploads' | 'history' | 'local-llm' | 'browse-all' | 'installed';

interface ProjectTool { id: string; name: string; source: 'github' | 'huggingface' | 'tool'; url: string; type: string; description?: string; }
interface Project { id: string; name: string; description: string; tools: ProjectTool[]; notes: string; createdAt: string; }
interface ThemeConfig { primaryColor: string; secondaryColor: string; bgColor: string; cardBg: string; textColor: string; accentColor: string; backgroundPattern: string; metallicIntensity: number; }
interface LocalLLM { name: string; status: 'running' | 'stopped' | 'not-installed'; models?: string[]; port?: number; }
interface Toast { id: string; message: string; type: 'success' | 'info' | 'error'; }
interface InstalledTool { id: string; name: string; category: string; installedAt: string; size: string; command: string; status: 'installed' | 'downloading' | 'failed'; }

// ============ PREMIUM THEMES ============
const premiumThemes: Record<string, ThemeConfig> = {
  titanium: { primaryColor: '#94a3b8', secondaryColor: '#64748b', bgColor: '#0c0c14', cardBg: 'rgba(20, 20, 35, 0.85)', textColor: '#e2e8f0', accentColor: '#818cf8', backgroundPattern: 'metallic', metallicIntensity: 80 },
  obsidian: { primaryColor: '#a78bfa', secondaryColor: '#7c3aed', bgColor: '#050508', cardBg: 'rgba(15, 15, 25, 0.9)', textColor: '#f1f5f9', accentColor: '#c084fc', backgroundPattern: 'carbon', metallicIntensity: 60 },
  platinum: { primaryColor: '#cbd5e1', secondaryColor: '#94a3b8', bgColor: '#0f172a', cardBg: 'rgba(15, 23, 42, 0.85)', textColor: '#f8fafc', accentColor: '#38bdf8', backgroundPattern: 'brushed', metallicIntensity: 90 },
  roseGold: { primaryColor: '#fda4af', secondaryColor: '#e11d48', bgColor: '#0f0a0a', cardBg: 'rgba(25, 15, 18, 0.9)', textColor: '#fce7f3', accentColor: '#fb7185', backgroundPattern: 'metallic', metallicIntensity: 70 },
  midnight: { primaryColor: '#6366f1', secondaryColor: '#4f46e5', bgColor: '#020617', cardBg: 'rgba(2, 6, 23, 0.9)', textColor: '#e0e7ff', accentColor: '#a5b4fc', backgroundPattern: 'gradient', metallicIntensity: 50 },
};

// ============ TOAST NOTIFICATION ============
function ToastNotification({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);
  const bgColor = toast.type === 'success' ? 'from-green-600 to-emerald-600' : toast.type === 'error' ? 'from-red-600 to-rose-600' : 'from-blue-600 to-cyan-600';
  return <div className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium bg-gradient-to-r ${bgColor} animate-slide-in`}>{toast.message}</div>;
}

// ============ SIDEBAR PANEL ============
function SidebarPanel({ favorites, projects, savedTools, activeProject, setActiveProject, createProject, updateProject, deleteProject, updateProjectNotes, copyProjectTools, addToast }: {
  favorites: Record<string, any[]>; projects: Project[]; savedTools: any[]; activeProject: string | null;
  setActiveProject: (id: string | null) => void; createProject: (name: string, desc: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void; deleteProject: (id: string) => void;
  updateProjectNotes: (id: string, notes: string) => void; copyProjectTools: (id: string) => void;
  addToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<any>(null);
  const closeTimeoutRef = useRef<any>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; }
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    openTimeoutRef.current = setTimeout(() => { setIsHovered(true); openTimeoutRef.current = null; }, 150);
  };

  const handleMouseLeave = () => {
    if (openTimeoutRef.current) { clearTimeout(openTimeoutRef.current); openTimeoutRef.current = null; }
    if (isHovered) { closeTimeoutRef.current = setTimeout(() => { setIsHovered(false); closeTimeoutRef.current = null; }, 300); }
  };

  useEffect(() => { return () => { if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current); if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); }; }, []);

  // Group favorites by platform
  const allFavTools = Object.values(favorites).flat();
  const ghFavs = allFavTools.filter((t: any) => t.platform === 'github');
  const hfFavs = allFavTools.filter((t: any) => t.platform === 'huggingface');
  const bothFavs = allFavTools.filter((t: any) => t.platform === 'both' || !t.platform);

  // Group saved tools by category
  const groupedSaved = savedTools.reduce((acc: Record<string, any[]>, tool: any) => {
    const cat = tool.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {});

  return (
    <>
      {/* Hover Tab */}
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[9998] w-8 h-32 flex items-center justify-center cursor-pointer"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))', borderRight: '2px solid rgba(139,92,246,0.5)', borderRadius: '0 8px 8px 0' }}>
        <div className="text-white text-xs font-bold" style={{ writingMode: 'vertical-rl' }}>📋 Tools</div>
      </div>

      {/* Panel */}
      {isHovered && createPortal(
        <div ref={panelRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
          className="fixed left-0 top-0 h-full w-80 z-[9999] overflow-y-auto animate-slide-in"
          style={{ background: 'linear-gradient(180deg, rgba(15,15,25,0.98), rgba(10,10,18,0.98))', borderRight: '1px solid rgba(100,100,120,0.3)', boxShadow: '4px 0 20px rgba(0,0,0,0.5)' }}>
          <div className="p-4 space-y-6">
            {/* Favorites by Platform */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3">⭐ Favorites</h3>
              {allFavTools.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-4">No favorites yet. Hover tools in Library to add!</p>
              ) : (
                <div className="space-y-3">
                  {ghFavs.length > 0 && (
                    <div className="metallic-card rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-gray-300 mb-2">🐙 GitHub <span className="text-gray-500">({ghFavs.length})</span></h4>
                      {ghFavs.slice(0, 5).map((tool: any) => (
                        <div key={tool.id} className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-gray-300 truncate">{tool.name}</span>
                          <button type="button" onClick={() => window.open(tool.url, '_blank')} className="text-purple-400 hover:text-purple-300">↗</button>
                        </div>
                      ))}
                      {ghFavs.length > 5 && <p className="text-[10px] text-gray-500">+{ghFavs.length - 5} more...</p>}
                    </div>
                  )}
                  {hfFavs.length > 0 && (
                    <div className="metallic-card rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-yellow-300 mb-2">🤗 Hugging Face <span className="text-gray-500">({hfFavs.length})</span></h4>
                      {hfFavs.slice(0, 5).map((tool: any) => (
                        <div key={tool.id} className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-gray-300 truncate">{tool.name}</span>
                          <button type="button" onClick={() => window.open(tool.url, '_blank')} className="text-purple-400 hover:text-purple-300">↗</button>
                        </div>
                      ))}
                      {hfFavs.length > 5 && <p className="text-[10px] text-gray-500">+{hfFavs.length - 5} more...</p>}
                    </div>
                  )}
                  {bothFavs.length > 0 && (
                    <div className="metallic-card rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-blue-300 mb-2">🌐 Both <span className="text-gray-500">({bothFavs.length})</span></h4>
                      {bothFavs.slice(0, 5).map((tool: any) => (
                        <div key={tool.id} className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-gray-300 truncate">{tool.name}</span>
                          <button type="button" onClick={() => window.open(tool.url, '_blank')} className="text-purple-400 hover:text-purple-300">↗</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Projects */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">🛒 Projects</h3>
                <button type="button" onClick={() => {
                  const name = prompt('Project name:');
                  if (name) { const desc = prompt('Description (optional):') || ''; createProject(name, desc); addToast(`✅ Created: ${name}`, 'success'); }
                }} className="text-xs px-2 py-1 rounded bg-gradient-to-r from-purple-600 to-pink-600 text-white">+ New</button>
              </div>
              {projects.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-4">No projects yet. Click "+ New"!</p>
              ) : (
                <div className="space-y-2">
                  {projects.map(project => (
                    <div key={project.id} className={`metallic-card rounded-lg p-3 cursor-pointer ${activeProject === project.id ? 'ring-2 ring-purple-500' : ''}`}
                      onClick={() => setActiveProject(activeProject === project.id ? null : project.id)}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-semibold text-white">{project.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300">{project.tools.length} tools</span>
                      </div>
                      {project.description && <p className="text-[10px] text-gray-400">{project.description}</p>}

                      {activeProject === project.id && (
                        <div className="mt-2 pt-2 border-t border-gray-800 space-y-2" onClick={e => e.stopPropagation()}>
                          {/* Edit Name/Desc */}
                          <input type="text" value={project.name} onChange={e => updateProject(project.id, { name: e.target.value })}
                            placeholder="Project name" className="w-full px-2 py-1 bg-black/30 border border-gray-700 rounded text-[10px] text-white focus:border-purple-500 focus:outline-none" />
                          <input type="text" value={project.description} onChange={e => updateProject(project.id, { description: e.target.value })}
                            placeholder="Description" className="w-full px-2 py-1 bg-black/30 border border-gray-700 rounded text-[10px] text-white focus:border-purple-500 focus:outline-none" />

                          {/* Tools */}
                          {project.tools.length > 0 ? (
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-gray-500 font-semibold">Tools:</p>
                              {project.tools.slice(0, 3).map((tool: any) => (
                                <div key={tool.id} className="flex items-center justify-between text-[10px]">
                                  <span className="text-gray-300 truncate">{tool.name}</span>
                                  <button type="button" onClick={() => window.open(tool.url, '_blank')} className="text-purple-400 hover:text-purple-300">↗</button>
                                </div>
                              ))}
                              {project.tools.length > 3 && <p className="text-[10px] text-gray-500">+{project.tools.length - 3} more...</p>}
                            </div>
                          ) : <p className="text-[10px] text-gray-500">No tools yet</p>}

                          {/* Notes */}
                          <div>
                            <p className="text-[10px] text-gray-500 font-semibold mb-1">Notes:</p>
                            <textarea value={project.notes} onChange={e => updateProjectNotes(project.id, e.target.value)}
                              placeholder="Add notes..." className="w-full px-2 py-1 bg-black/30 border border-gray-700 rounded text-[10px] text-white h-16 resize-none focus:border-purple-500 focus:outline-none" />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1">
                            <button type="button" onClick={() => { copyProjectTools(project.id); addToast('📋 Copied!', 'success'); }}
                              className="flex-1 px-2 py-1 rounded text-[10px] text-white bg-gradient-to-r from-green-600 to-emerald-600">📋 Copy</button>
                            <button type="button" onClick={() => { if (confirm(`Delete "${project.name}"?`)) { deleteProject(project.id); addToast('🗑️ Deleted', 'info'); } }}
                              className="px-2 py-1 rounded text-[10px] text-red-400 metallic-button">🗑️</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Tools by Category */}
            {savedTools.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white mb-3">💾 Saved <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300">{savedTools.length}</span></h3>
                <div className="space-y-2">
                  {Object.entries(groupedSaved).map(([cat, tools]) => (
                    <div key={cat} className="metallic-card rounded-lg p-2">
                      <h4 className="text-[10px] font-semibold text-blue-300 mb-1 capitalize">
                        {libraryCategories.find(c => c.id === cat)?.icon || '📦'} {cat} <span className="text-gray-500">({(tools as any[]).length})</span>
                      </h4>
                      {(tools as any[]).slice(0, 3).map((tool: any) => (
                        <div key={tool.id} className="flex items-center justify-between text-[10px] py-0.5">
                          <span className="text-gray-300 truncate">{tool.name}</span>
                          <button type="button" onClick={() => window.open(tool.url, '_blank')} className="text-purple-400 hover:text-purple-300">↗</button>
                        </div>
                      ))}
                      {(tools as any[]).length > 3 && <p className="text-[10px] text-gray-500">+{(tools as any[]).length - 3} more...</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [showSetup, setShowSetup] = useLocalStorage('gh_setup_done', false);
  const [theme, setTheme] = useLocalStorage<ThemeConfig>('gh_theme', premiumThemes.titanium);
  const [notes, setNotes] = useLocalStorage<Note[]>('gh_notes', []);
  const [downloads, setDownloads] = useLocalStorage<DownloadItem[]>('gh_downloads', []);
  const [uploadItems, setUploadItems] = useLocalStorage<any[]>('gh_uploads', []);
  const [activePage, setActivePage] = useState<ActivePage>('library');
  const [skillLevel, setSkillLevel] = useLocalStorage<SkillLevel>('gh_skill_level', 'beginner');
  const [showCustomize, setShowCustomize] = useState(false);
  const [showToolDetail, setShowToolDetail] = useState<ToolDefinition | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Search state
  const [ghQuery, setGhQuery] = useState('');
  const [hfQuery, setHfQuery] = useState('');
  const [ghResults, setGhResults] = useState<any[]>([]);
  const [hfResults, setHfResults] = useState<any[]>([]);
  const [ghLoading, setGhLoading] = useState(false);
  const [hfLoading, setHfLoading] = useState(false);

  // Library state
  const [libraryCategory, setLibraryCategory] = useState('all');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [favorites, setFavorites] = useLocalStorage<Record<string, any[]>>('gh_favorites', {});
  const [savedTools, setSavedTools] = useLocalStorage<any[]>('gh_saved_tools', []);

  // Projects
  const [projects, setProjects] = useLocalStorage<Project[]>('gh_projects', []);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  // Installed Tools
  const [installedTools, setInstalledTools] = useLocalStorage<InstalledTool[]>('gh_installed_tools', []);

  // History
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('gh_search_history', []);
  const [usageStats, setUsageStats] = useLocalStorage('gh_usage_stats', { searches: 0, downloads: 0, lastActive: '' });

  const specs = useSystemSpecs();

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Project management
  const createProject = (name: string, description: string) => {
    const newProject: Project = { id: Date.now().toString(), name, description, tools: [], notes: '', createdAt: new Date().toLocaleDateString() };
    setProjects((prev: Project[]) => [...prev, newProject]);
    setActiveProject(newProject.id);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev: Project[]) => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects((prev: Project[]) => prev.filter(p => p.id !== id));
    if (activeProject === id) setActiveProject(null);
  };

  const updateProjectNotes = (id: string, notes: string) => {
    setProjects((prev: Project[]) => prev.map(p => p.id === id ? { ...p, notes } : p));
  };

  const addToProject = (tool: ProjectTool) => {
    if (activeProject) {
      setProjects((prev: Project[]) => prev.map(p => p.id === activeProject ? { ...p, tools: [...p.tools, tool] } : p));
    } else {
      const newProject: Project = { id: Date.now().toString(), name: `Project ${projects.length + 1}`, description: '', tools: [tool], notes: '', createdAt: new Date().toLocaleDateString() };
      setProjects((prev: Project[]) => [...prev, newProject]);
      setActiveProject(newProject.id);
    }
  };

  const copyProjectTools = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    let text = `# ${project.name}\n\n${project.description}\n\n## Tools (${project.tools.length})\n\n`;
    project.tools.forEach((tool, i) => { text += `${i + 1}. **${tool.name}** (${tool.source})\n   URL: ${tool.url}\n${tool.description ? `   ${tool.description}\n` : ''}\n`; });
    if (project.notes) text += `\n## Notes\n\n${project.notes}\n`;
    navigator.clipboard.writeText(text);
  };

  // Installation management
  const installTool = (tool: any) => {
    if (!tool.installCommand) {
      addToast('❌ No installation command available', 'error');
      return;
    }
    
    // Check if already installed
    const existing = installedTools.find(t => t.id === tool.id);
    if (existing) {
      addToast('⚠️ Tool already installed', 'info');
      return;
    }

    // Add to installed tools
    const newInstall: InstalledTool = {
      id: tool.id,
      name: tool.name,
      category: tool.category,
      installedAt: new Date().toLocaleDateString(),
      size: tool.size || 'Unknown',
      command: tool.installCommand,
      status: 'installed'
    };
    setInstalledTools((prev: InstalledTool[]) => [...prev, newInstall]);
    addToast(`✅ ${tool.name} installed successfully!`, 'success');
  };

  const uninstallTool = (toolId: string) => {
    const tool = installedTools.find(t => t.id === toolId);
    if (!tool) return;
    
    if (confirm(`Uninstall ${tool.name}?`)) {
      setInstalledTools((prev: InstalledTool[]) => prev.filter(t => t.id !== toolId));
      addToast(`🗑️ ${tool.name} uninstalled`, 'info');
    }
  };

  const isToolInstalled = (toolId: string) => {
    return installedTools.some(t => t.id === toolId);
  };

  // Search functions
  const searchGitHub = async (query: string) => {
    if (!query.trim()) return;
    setGhLoading(true);
    try {
      const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`);
      const data = await res.json();
      setGhResults((data.items || []).map((item: any) => ({ ...item, source: 'github' as const })));
      setUsageStats((prev: any) => ({ ...prev, searches: (prev.searches || 0) + 1, lastActive: new Date().toISOString() }));
      setSearchHistory((prev: string[]) => [query, ...prev.filter((q: string) => q !== query)].slice(0, 20));
    } catch { setGhResults([]); }
    setGhLoading(false);
  };

  const searchHuggingFace = async (query: string) => {
    if (!query.trim()) return;
    setHfLoading(true);
    try {
      const res = await fetch(`https://huggingface.co/api/models?search=${encodeURIComponent(query)}&sort=downloads&direction=-1&limit=20`);
      const data = await res.json();
      setHfResults((data || []).map((item: any) => ({ ...item, source: 'huggingface' as const, type: 'model' })));
    } catch { setHfResults([]); }
    setHfLoading(false);
  };

  const handleDownload = (item: any) => {
    const download: DownloadItem = { id: Date.now().toString(), name: item.full_name || item.id, source: item.source, url: item.html_url || `https://huggingface.co/${item.id}`, status: 'complete', date: new Date().toLocaleDateString() };
    setDownloads((p: DownloadItem[]) => [download, ...p]);
    setUsageStats((prev: any) => ({ ...prev, downloads: (prev.downloads || 0) + 1 }));
    window.open(download.url, '_blank');
    addToast('📥 Download started!', 'success');
  };

  const getBgStyle = (): React.CSSProperties => {
    const intensity = theme.metallicIntensity / 100;
    switch (theme.backgroundPattern) {
      case 'metallic': return { background: `radial-gradient(ellipse at 20% 50%, rgba(100,100,140,${0.05 * intensity}) 0%, ${theme.bgColor} 50%), ${theme.bgColor}` };
      case 'carbon': return { background: theme.bgColor, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,${0.01 * intensity}) 2px, rgba(255,255,255,${0.01 * intensity}) 4px)` };
      case 'brushed': return { background: `linear-gradient(135deg, ${theme.bgColor} 0%, rgba(30,30,50,${0.5 * intensity}) 50%, ${theme.bgColor} 100%)` };
      case 'gradient': return { background: `radial-gradient(ellipse at 50% 0%, rgba(99,102,241,${0.1 * intensity}) 0%, ${theme.bgColor} 60%)` };
      default: return { backgroundColor: theme.bgColor };
    }
  };

  if (!showSetup) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="metallic-card max-w-lg w-full p-8 rounded-2xl text-center">
          <div className="text-5xl mb-4">⚡</div>
          <h1 className="text-2xl font-bold text-gradient mb-4">Welcome to GIT HUGGIN</h1>
          <p className="text-gray-400 mb-6">Your unified dashboard for GitHub & Hugging Face</p>
          <button onClick={() => setShowSetup(true)} className="px-6 py-3 rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
            Get Started →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ ...getBgStyle(), color: theme.textColor }}>
      {/* Sidebar Panel */}
      <SidebarPanel favorites={favorites} projects={projects} savedTools={savedTools} activeProject={activeProject}
        setActiveProject={setActiveProject} createProject={createProject} updateProject={updateProject}
        deleteProject={deleteProject} updateProjectNotes={updateProjectNotes} copyProjectTools={copyProjectTools} addToast={addToast} />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b backdrop-blur-xl" style={{ borderColor: 'rgba(100,100,120,0.2)', background: 'rgba(10,10,18,0.9)' }}>
        <div className="max-w-[1600px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gradient">GIT HUGGIN</h1>
            <nav className="hidden md:flex items-center gap-1">
              {([
                { id: 'library', label: 'Library', icon: '📚' },
                { id: 'dashboard', label: 'Dashboard', icon: '⚡' },
                { id: 'installed', label: 'Installed', icon: '💾' },
                { id: 'browse-all', label: 'Browse All', icon: '🔍' },
                { id: 'tools', label: 'Tools', icon: '🔧' },
                { id: 'local-llm', label: 'Local LLM', icon: '🤖' },
                { id: 'cloud', label: 'Cloud', icon: '☁️' },
                { id: 'downloads', label: 'Downloads', icon: '📥' },
                { id: 'history', label: 'History', icon: '📊' },
              ] as { id: ActivePage; label: string; icon: string }[]).map(item => (
                <button key={item.id} onClick={() => setActivePage(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activePage === item.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <span className="mr-1">{item.icon}</span>{item.label}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                className="text-xs px-3 py-1.5 rounded-lg border bg-gray-900 border-gray-600 text-white">
                <option value="beginner">🌱 Beginner</option>
                <option value="experienced">⚡ Experienced</option>
                <option value="advanced">🔥 Advanced</option>
              </select>
              <button onClick={() => setShowCustomize(true)} className="metallic-button px-3 py-1.5 rounded-lg text-xs text-gray-300">🎨</button>
            </div>
          </div>
        </div>
      </header>

      {/* Customize Modal */}
      {showCustomize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowCustomize(false)}>
          <div className="metallic-card max-w-lg w-full p-6 rounded-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">🎨 Customize</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Themes</h3>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(premiumThemes).map(([name, t]) => (
                    <button key={name} onClick={() => setTheme(t)} className={`p-3 rounded-xl border text-center ${JSON.stringify(theme) === JSON.stringify(t) ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-700'}`} style={{ background: t.bgColor }}>
                      <div className="flex gap-1 justify-center mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: t.primaryColor }} />
                        <div className="w-3 h-3 rounded-full" style={{ background: t.accentColor }} />
                      </div>
                      <span className="text-xs text-white capitalize">{name.replace(/([A-Z])/g, ' $1')}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Background</h3>
                <div className="flex gap-2">
                  {['metallic', 'carbon', 'brushed', 'gradient'].map(p => (
                    <button key={p} onClick={() => setTheme({ ...theme, backgroundPattern: p })}
                      className={`px-3 py-1.5 rounded-lg text-xs capitalize ${theme.backgroundPattern === p ? 'bg-purple-600 text-white' : 'metallic-button text-gray-300'}`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setShowCustomize(false)} className="mt-6 w-full px-4 py-2.5 rounded-lg text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600">Done ✓</button>
          </div>
        </div>
      )}

      {/* Tool Detail Modal */}
      {showToolDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowToolDetail(null)}>
          <div className="metallic-card max-w-lg w-full p-6 rounded-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${showToolDetail.platform === 'github' ? 'bg-gray-700 text-gray-300' : 'bg-yellow-900/30 text-yellow-300'}`}>
                  {showToolDetail.platform === 'github' ? '🐙 GitHub' : '🤗 Hugging Face'}
                </span>
                <h2 className="text-xl font-bold text-white mt-2">{showToolDetail.name}</h2>
              </div>
              <button onClick={() => setShowToolDetail(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div><h3 className="text-sm font-semibold text-purple-300 mb-1">What is it?</h3><p className="text-sm text-gray-300">{showToolDetail.description}</p></div>
              <div><h3 className="text-sm font-semibold text-cyan-300 mb-1">When to use it?</h3><p className="text-sm text-gray-300">{showToolDetail.useCase}</p></div>
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full ${showToolDetail.free ? 'bg-green-900/30 text-green-300 border border-green-500/30' : 'bg-red-900/30 text-red-300 border border-red-500/30'}`}>{showToolDetail.free ? '🆓 Free' : '💰 Paid'}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300 capitalize">{showToolDetail.difficulty}</span>
              </div>
              {showToolDetail.url && (
                <button type="button" onClick={() => window.open(showToolDetail.url, '_blank')}
                  className="w-full px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
                  🌐 Open in {showToolDetail.platform === 'github' ? 'GitHub' : 'Hugging Face'} →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6 pl-12">

        {/* LIBRARY PAGE */}
        {activePage === 'library' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">📚 AI Tool Library</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {libraryCategories.map(cat => (
                <button key={cat.id} onClick={() => setLibraryCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${libraryCategory === cat.id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'metallic-button text-gray-300'}`}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getToolsByCategory(libraryCategory).map(tool => (
                <LibraryToolCard key={tool.id} tool={tool} uniqueKey={tool.id} hoveredKey={hoveredKey}
                  onHover={setHoveredKey} onLeave={() => setHoveredKey(null)}
                  favorites={favorites} setFavorites={setFavorites} savedTools={savedTools} setSavedTools={setSavedTools}
                  addToProject={addToProject} addToast={addToast}
                  installTool={installTool} uninstallTool={uninstallTool} isToolInstalled={isToolInstalled} />
              ))}
            </div>
          </div>
        )}

        {/* DASHBOARD PAGE */}
        {activePage === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">⚡ Dashboard</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="metallic-card rounded-xl p-4">
                <h3 className="font-bold text-white mb-3">🐙 GitHub Search</h3>
                <div className="flex gap-2">
                  <input type="text" value={ghQuery} onChange={e => setGhQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchGitHub(ghQuery)}
                    placeholder="Search repos..." className="flex-1 px-4 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm" />
                  <button onClick={() => searchGitHub(ghQuery)} disabled={ghLoading} className="px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600">
                    {ghLoading ? '⏳' : '🔍'}
                  </button>
                </div>
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {ghResults.map((item: any) => (
                    <div key={item.id} className="metallic-card rounded-lg p-3">
                      <h4 className="font-medium text-white text-sm">{item.full_name}</h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                      <div className="flex gap-2 mt-2 text-[10px] text-gray-500">
                        <span>⭐ {item.stargazers_count?.toLocaleString()}</span>
                        <span>{item.language}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleDownload(item)} className="flex-1 px-2 py-1 rounded text-[10px] text-white bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600">📥 Download</button>
                        <button type="button" onClick={() => window.open(item.html_url, '_blank')} className="px-2 py-1 rounded text-[10px] text-gray-400 bg-gray-800/50">↗</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="metallic-card rounded-xl p-4">
                <h3 className="font-bold text-white mb-3">🤗 Hugging Face Search</h3>
                <div className="flex gap-2">
                  <input type="text" value={hfQuery} onChange={e => setHfQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchHuggingFace(hfQuery)}
                    placeholder="Search models..." className="flex-1 px-4 py-2 bg-black/30 border border-gray-700 rounded-lg text-white text-sm" />
                  <button onClick={() => searchHuggingFace(hfQuery)} disabled={hfLoading} className="px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-yellow-800 to-yellow-900 border border-yellow-700/50">
                    {hfLoading ? '⏳' : '🔍'}
                  </button>
                </div>
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {hfResults.map((item: any) => (
                    <div key={item.id} className="metallic-card rounded-lg p-3">
                      <h4 className="font-medium text-white text-sm">{item.id}</h4>
                      <p className="text-xs text-gray-400 mt-1">{item.pipeline_tag || 'Model'}</p>
                      <div className="flex gap-2 mt-2 text-[10px] text-gray-500">
                        <span>⬇️ {item.downloads?.toLocaleString()}</span>
                        <span>❤️ {item.likes}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleDownload({ ...item, source: 'huggingface' })} className="flex-1 px-2 py-1 rounded text-[10px] text-white bg-gradient-to-r from-yellow-800 to-yellow-900 border border-yellow-700/50">📥 Download</button>
                        <button type="button" onClick={() => window.open(`https://huggingface.co/${item.id}`, '_blank')} className="px-2 py-1 rounded text-[10px] text-gray-400 bg-gray-800/50">↗</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOOLS PAGE */}
        {activePage === 'tools' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">🔧 Tool Encyclopedia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-3">🐙 GitHub Tools</h3>
                <div className="space-y-2">
                  {getToolsByPlatform('github').filter((t: ToolDefinition) => skillLevel === 'advanced' || t.difficulty === 'beginner' || (skillLevel === 'experienced' && t.difficulty !== 'advanced')).map((tool: ToolDefinition) => (
                    <button key={tool.name} onClick={() => setShowToolDetail(tool)} className="metallic-card rounded-lg p-3 text-left w-full hover:scale-[1.02] transition-all">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white text-sm">{tool.name}</h4>
                        <div className="flex gap-1">
                          {tool.free && <span className="text-[9px] px-1 py-0.5 rounded bg-green-900/20 text-green-400">Free</span>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tool.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-3">🤗 Hugging Face Tools</h3>
                <div className="space-y-2">
                  {getToolsByPlatform('huggingface').filter((t: ToolDefinition) => skillLevel === 'advanced' || t.difficulty === 'beginner' || (skillLevel === 'experienced' && t.difficulty !== 'advanced')).map((tool: ToolDefinition) => (
                    <button key={tool.name} onClick={() => setShowToolDetail(tool)} className="metallic-card rounded-lg p-3 text-left w-full hover:scale-[1.02] transition-all">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white text-sm">{tool.name}</h4>
                        <div className="flex gap-1">
                          {tool.free && <span className="text-[9px] px-1 py-0.5 rounded bg-green-900/20 text-green-400">Free</span>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tool.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOCAL LLM PAGE */}
        {activePage === 'local-llm' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">🤖 Local LLM Manager</h2>
            <div className="metallic-card rounded-xl p-5">
              <h3 className="font-bold text-white mb-3">Detected Local LLMs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="metallic-card rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white">Ollama</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-500/30">✗ Not Running</span>
                  </div>
                  <p className="text-sm text-gray-400">Ollama is not detected. Install from:</p>
                  <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="block mt-2 text-center px-3 py-2 rounded-lg text-xs text-white bg-gradient-to-r from-purple-600 to-pink-600">Download Ollama →</a>
                </div>
                <div className="metallic-card rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white">LM Studio</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-500/30">✗ Not Running</span>
                  </div>
                  <p className="text-sm text-gray-400">LM Studio is not detected. Install from:</p>
                  <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer" className="block mt-2 text-center px-3 py-2 rounded-lg text-xs text-white bg-gradient-to-r from-purple-600 to-pink-600">Download LM Studio →</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLOUD PAGE */}
        {activePage === 'cloud' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">☁️ Cloud Setup</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="metallic-card rounded-xl p-5">
                <h3 className="font-bold text-white mb-3">🆓 Free Options</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Hugging Face Spaces', desc: 'Free hosted apps with GPU access', link: 'https://huggingface.co/spaces' },
                    { name: 'Google Colab', desc: 'Free Jupyter notebooks with GPU', link: 'https://colab.research.google.com' },
                    { name: 'GitHub Codespaces', desc: '60hrs/month free cloud dev', link: 'https://github.com/codespaces' },
                  ].map(item => (
                    <div key={item.name} className="bg-black/20 rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white text-sm">{item.name}</h4>
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:text-purple-300">Open ↗</a>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="metallic-card rounded-xl p-5">
                <h3 className="font-bold text-white mb-3">💰 Paid Options</h3>
                <div className="space-y-3">
                  {[
                    { name: 'RunPod', desc: 'Affordable GPU cloud', link: 'https://runpod.io' },
                    { name: 'Vast.ai', desc: 'Cheap GPU rentals', link: 'https://vast.ai' },
                    { name: 'Lambda Labs', desc: 'On-demand GPU clouds', link: 'https://lambdalabs.com' },
                  ].map(item => (
                    <div key={item.name} className="bg-black/20 rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white text-sm">{item.name}</h4>
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:text-purple-300">Open ↗</a>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BROWSE ALL PAGE */}
        {activePage === 'browse-all' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">🔍 Browse All AI Tools</h2>
            <div className="metallic-card rounded-xl p-4">
              <div className="flex gap-2">
                <input type="text" placeholder="Search for AI models, tools, datasets..." className="flex-1 px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white" />
                <button className="px-6 py-3 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600">🔍 Search</button>
              </div>
            </div>
          </div>
        )}

        {/* INSTALLED TOOLS PAGE */}
        {activePage === 'installed' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">💾 Installed Tools</h2>
            {installedTools.length === 0 ? (
              <div className="metallic-card rounded-xl p-12 text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-gray-500">No tools installed yet. Go to Library to install tools!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {installedTools.map((tool: InstalledTool) => (
                  <div key={tool.id} className="metallic-card rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg">{tool.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">Category: {tool.category}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>📦 Size: {tool.size}</span>
                          <span>📅 Installed: {tool.installedAt}</span>
                        </div>
                        <div className="mt-2 p-2 bg-black/30 rounded border border-gray-800">
                          <p className="text-xs text-gray-400">Install Command:</p>
                          <code className="text-xs text-cyan-400">{tool.command}</code>
                        </div>
                      </div>
                      <button type="button" onClick={() => uninstallTool(tool.id)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 cursor-pointer active:scale-95">
                        🗑️ Uninstall
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DOWNLOADS PAGE */}
        {activePage === 'downloads' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">📥 Downloads</h2>
            {downloads.length === 0 ? (
              <div className="metallic-card rounded-xl p-12 text-center"><p className="text-4xl mb-3">📭</p><p className="text-gray-500">No downloads yet</p></div>
            ) : (
              <div className="space-y-2">
                {downloads.map((item: DownloadItem) => (
                  <div key={item.id} className="metallic-card rounded-xl p-3 flex items-center gap-4">
                    <span className="text-xl">{item.source === 'github' ? '🐙' : '🤗'}</span>
                    <div className="flex-1"><p className="font-medium text-white text-sm">{item.name}</p><p className="text-xs text-gray-500">{item.date}</p></div>
                    <button type="button" onClick={() => window.open(item.url, '_blank')} className="text-xs text-purple-400 hover:text-purple-300">Open ↗</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY PAGE */}
        {activePage === 'history' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-white">📊 History & Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="metallic-card rounded-xl p-5 text-center">
                <div className="text-3xl font-bold text-gradient">{usageStats.searches || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Total Searches</div>
              </div>
              <div className="metallic-card rounded-xl p-5 text-center">
                <div className="text-3xl font-bold text-gradient">{usageStats.downloads || 0}</div>
                <div className="text-xs text-gray-400 mt-1">Total Downloads</div>
              </div>
              <div className="metallic-card rounded-xl p-5 text-center">
                <div className="text-3xl font-bold text-gradient">{notes.length}</div>
                <div className="text-xs text-gray-400 mt-1">Notes Created</div>
              </div>
            </div>
            <div className="metallic-card rounded-xl p-5">
              <h3 className="font-bold text-white mb-3">🔍 Search History</h3>
              {searchHistory.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">No searches yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((q: string, i: number) => (
                    <button key={i} onClick={() => { setGhQuery(q); setHfQuery(q); setActivePage('dashboard'); searchGitHub(q); searchHuggingFace(q); }}
                      className="px-3 py-1.5 rounded-lg text-xs metallic-button text-gray-300">{q}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t py-6 text-center pl-12" style={{ borderColor: 'rgba(100,100,120,0.15)' }}>
        <p className="text-xs text-gray-600">GIT HUGGIN — Enterprise Unified Dashboard</p>
      </footer>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[10000] space-y-2">
        {toasts.map(toast => <ToastNotification key={toast.id} toast={toast} onRemove={removeToast} />)}
      </div>
    </div>
  );
}

// ============ LIBRARY TOOL CARD ============
function LibraryToolCard({ tool, uniqueKey, hoveredKey, onHover, onLeave, favorites, setFavorites, savedTools, setSavedTools, addToProject, addToast, installTool, uninstallTool, isToolInstalled }: {
  tool: LibraryTool; uniqueKey: string; hoveredKey: string | null; onHover: (key: string) => void; onLeave: () => void;
  favorites: Record<string, any[]>; setFavorites: (f: Record<string, any[]>) => void;
  savedTools: any[]; setSavedTools: (t: any[]) => void; addToProject: (t: any) => void;
  addToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  installTool: (t: any) => void; uninstallTool: (id: string) => void; isToolInstalled: (id: string) => boolean;
}) {
  const isHovered = hoveredKey === uniqueKey;
  const cardRef = useRef<HTMLDivElement>(null);
  const [panelCoords, setPanelCoords] = useState<{ left: number; top: number } | null>(null);
  const closeTimeoutRef = useRef<any>(null);
  const openTimeoutRef = useRef<any>(null);
  const hoveredKeyRef = useRef(hoveredKey);

  useEffect(() => { hoveredKeyRef.current = hoveredKey; }, [hoveredKey]);

  useLayoutEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const panelWidth = 384;
      const margin = 20;
      let left = rect.right + 10;
      let top = rect.top;
      if (left + panelWidth + margin > window.innerWidth) left = rect.left - panelWidth - 10;
      if (top + 600 > window.innerHeight - margin) top = window.innerHeight - 600 - margin;
      if (top < margin) top = margin;
      setPanelCoords({ left, top });
    } else { setPanelCoords(null); }
  }, [isHovered]);

  useEffect(() => { return () => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current); }; }, []);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; }
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    openTimeoutRef.current = setTimeout(() => { onHover(uniqueKey); openTimeoutRef.current = null; }, 150);
  };

  const handleMouseLeave = () => {
    if (openTimeoutRef.current) { clearTimeout(openTimeoutRef.current); openTimeoutRef.current = null; }
    if (hoveredKey === uniqueKey) {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => { if (hoveredKeyRef.current === uniqueKey) onLeave(); closeTimeoutRef.current = null; }, 300);
    }
  };

  const handlePanelMouseEnter = () => { if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; } };
  const handlePanelMouseLeave = () => { onLeave(); };

  useEffect(() => { if (hoveredKeyRef.current === uniqueKey && closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; } }, [isHovered, uniqueKey]);

  return (
    <div ref={cardRef} className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="metallic-card rounded-xl p-4 transition-all hover:scale-105 cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-gradient">#{tool.rank}</span>
              <h4 className="font-bold text-white">{tool.name}</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{tool.platform === 'github' ? '🐙' : tool.platform === 'huggingface' ? '🤗' : '🌐'}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${tool.difficulty === 'beginner' ? 'bg-green-900/30 text-green-400' : tool.difficulty === 'intermediate' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>{tool.difficulty}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${tool.type === 'online' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30' : tool.type === 'local' ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30' : 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/30'}`}>
                {tool.type === 'online' ? '☁️ Online' : tool.type === 'local' ? '💾 Local' : '🔄 Both'}
              </span>
            </div>
          </div>
          {tool.free && <span className="text-xs px-2 py-1 rounded-full bg-green-900/30 text-green-400 border border-green-500/30">🆓 Free</span>}
        </div>
        <p className="text-sm text-gray-300 line-clamp-2">{tool.description}</p>
        <div className="flex gap-2 mt-3">
          {tool.downloads && <span className="text-xs text-gray-500">⬇️ {tool.downloads.toLocaleString()}</span>}
          {tool.stars && <span className="text-xs text-gray-500">⭐ {tool.stars.toLocaleString()}</span>}
          {tool.size && <span className="text-xs text-gray-500">📦 {tool.size}</span>}
        </div>
      </div>

      {/* Hover Popup */}
      {isHovered && panelCoords && createPortal(
        <div className="fixed z-[9999] w-96 max-h-[80vh] overflow-y-auto metallic-card rounded-xl p-6 shadow-2xl animate-fade-in pointer-events-auto"
          style={{ left: `${panelCoords.left}px`, top: `${panelCoords.top}px`, pointerEvents: 'auto' }}
          onMouseEnter={handlePanelMouseEnter} onMouseLeave={handlePanelMouseLeave}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-gradient">#{tool.rank}</span>
                <h3 className="text-xl font-bold text-white">{tool.name}</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-400">{tool.platform === 'github' ? '🐙 GitHub' : tool.platform === 'huggingface' ? '🤗 Hugging Face' : '🌐 Both'}</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-sm text-gray-400">{libraryCategories.find(c => c.id === tool.category)?.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${tool.type === 'online' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30' : tool.type === 'local' ? 'bg-orange-900/30 text-orange-400 border border-orange-500/30' : 'bg-indigo-900/30 text-indigo-400 border border-indigo-500/30'}`}>
                  {tool.type === 'online' ? '☁️ Online' : tool.type === 'local' ? '💾 Local' : '🔄 Both'}
                </span>
              </div>
            </div>
            {tool.free && <span className="text-xs px-2 py-1 rounded-full bg-green-900/30 text-green-400 border border-green-500/30">🆓 Free</span>}
          </div>
          <div className="space-y-4">
            <div><h4 className="text-sm font-semibold text-purple-300 mb-2">📖 Description</h4><p className="text-sm text-gray-300">{tool.description}</p></div>
            <div><h4 className="text-sm font-semibold text-cyan-300 mb-2">✨ Key Features</h4>
              <ul className="space-y-1">{tool.features.map((f: string, i: number) => <li key={i} className="text-xs text-gray-300 flex items-center gap-2"><span className="text-cyan-400">•</span>{f}</li>)}</ul>
            </div>
            <div><h4 className="text-sm font-semibold text-green-300 mb-2">💡 Use Cases</h4>
              <ul className="space-y-1">{tool.useCases.map((u: string, i: number) => <li key={i} className="text-xs text-gray-300 flex items-center gap-2"><span className="text-green-400">•</span>{u}</li>)}</ul>
            </div>
            {tool.size && (
              <div className="bg-black/30 rounded-lg p-3 border border-gray-800">
                <p className="text-xs text-gray-400">📦 Size: <span className="text-white font-medium">{tool.size}</span></p>
                {tool.installCommand && <p className="text-xs text-gray-400 mt-1">⚙️ Install: <code className="text-cyan-400">{tool.installCommand}</code></p>}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={(e) => {
                e.stopPropagation();
                const category = tool.category;
                const currentFavorites = favorites[category] || [];
                const isFavorited = currentFavorites.some((t: any) => t.id === tool.id);
                if (isFavorited) { setFavorites({ ...favorites, [category]: currentFavorites.filter((t: any) => t.id !== tool.id) }); addToast(`Removed from ${category} favorites`, 'info'); }
                else { setFavorites({ ...favorites, [category]: [...currentFavorites, tool] }); addToast(`⭐ Added to ${category} favorites!`, 'success'); }
              }} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 cursor-pointer active:scale-95">⭐ Favorite</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setSavedTools([...savedTools, tool]); addToast('💾 Saved to collection!', 'success'); }}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 cursor-pointer active:scale-95">💾 Save</button>
              <button type="button" onClick={(e) => {
                e.stopPropagation();
                addToProject({ id: Date.now().toString(), name: tool.name, source: tool.platform === 'github' ? 'github' : 'huggingface', url: tool.url, type: tool.category, description: tool.description });
                addToast('🛒 Added to project!', 'success');
              }} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 cursor-pointer active:scale-95">🛒 Project</button>
            </div>
            {tool.type !== 'online' && (
              <div className="flex gap-2">
                {isToolInstalled(tool.id) ? (
                  <button type="button" onClick={(e) => { e.stopPropagation(); uninstallTool(tool.id); }}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 cursor-pointer active:scale-95">
                    🗑️ Uninstall
                  </button>
                ) : (
                  <button type="button" onClick={(e) => { e.stopPropagation(); installTool(tool); }}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 cursor-pointer active:scale-95">
                    📥 Install Locally
                  </button>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
