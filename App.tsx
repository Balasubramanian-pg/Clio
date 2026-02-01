import React, { useState, useCallback, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { NotebookPreview } from './components/NotebookPreview';
import { Spinner } from './components/Spinner';
import { CursorFollower } from './components/CursorFollower';
import { convertScriptToNotebookCells } from './services/geminiService';
import { NotebookCell, NotebookStructure, ProcessingStatus, Tone } from './types';
import { Download, RefreshCw, BookOpen, Sparkles, AlertTriangle, Settings2, ChevronDown, FileJson, FileCode } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'idle' });
  const [cells, setCells] = useState<NotebookCell[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [originalFilename, setOriginalFilename] = useState<string>('');
  const [tone, setTone] = useState<Tone>('Beginner-friendly');
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const processFile = async (file: File) => {
    setStatus({ step: 'reading', message: 'Reading file...' });
    setOriginalFilename(file.name);
    setCells([]);
    setSelectedIndices([]);

    try {
      const text = await file.text();
      
      setStatus({ step: 'analyzing', message: 'Gemini is analyzing logic and writing documentation...' });
      
      const generatedCells = await convertScriptToNotebookCells(text, tone);
      
      setCells(generatedCells);
      // Select all cells by default, using indices since IDs are internal
      setSelectedIndices(generatedCells.map((_, i) => i));
      setStatus({ step: 'complete' });
    } catch (error: any) {
      console.error(error);
      
      let errorMsg: React.ReactNode = 'An unexpected error occurred.';
      let errorType: ProcessingStatus['errorType'] = 'unknown';

      // Check for GoogleGenAI specific error structures or messages
      const msg = error.message || error.toString();

      if (msg.includes('API key') || msg.includes('403') || msg.includes('401')) {
        errorMsg = (
          <span>
            Invalid API Key. Please ensure your API key is correctly configured. 
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline text-casper hover:text-merino ml-1">
              Get an API key here
            </a>.
          </span>
        );
        errorType = 'api_key';
      } else if (msg.includes('Network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
        errorMsg = (
           <span>
             Network error. Please check your internet connection. If the issue persists, check if your firewall blocks 
             <span className="font-mono bg-cello px-1 rounded ml-1">generativelanguage.googleapis.com</span>.
           </span>
        );
        errorType = 'network';
      } else if (msg.includes('candidate') || msg.includes('blocked') || msg.includes('SAFETY')) {
        errorMsg = (
          <span>
            The AI model refused to process this content due to safety settings. 
            <a href="https://ai.google.dev/gemini-api/docs/safety-settings" target="_blank" rel="noreferrer" className="underline text-casper hover:text-merino ml-1">
              Learn more about Safety Settings
            </a>.
          </span>
        );
        errorType = 'content';
      } else if (msg.includes('503')) {
        errorMsg = 'The service is currently overloaded. Please try again in a moment.';
        errorType = 'network';
      }

      setStatus({ 
        step: 'error', 
        message: errorMsg,
        errorType
      });
    }
  };

  const toggleCell = (id: string) => {
    const index = cells.findIndex(c => c.id === id);
    if (index === -1) return;

    setSelectedIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index].sort((a, b) => a - b)
    );
  };

  const handleReorder = (newCells: NotebookCell[]) => {
    setCells(newCells);
    const selectedIds = selectedIndices.map(i => cells[i]?.id).filter(Boolean);
    const newSelectedIndices = newCells
      .map((cell, index) => selectedIds.includes(cell.id) ? index : -1)
      .filter(i => i !== -1);
      
    setSelectedIndices(newSelectedIndices);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsDownloadMenuOpen(false);
  };

  const handleDownloadIpynb = useCallback(() => {
    if (cells.length === 0) return;
    const finalCells = cells.filter((_, index) => selectedIndices.includes(index));

    const notebook: NotebookStructure = {
      cells: finalCells,
      metadata: {
        kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
        language_info: {
          codemirror_mode: { name: "ipython", version: 3 },
          file_extension: ".py",
          mimetype: "text/x-python",
          name: "python",
          nbconvert_exporter: "python",
          pygments_lexer: "ipython3",
          version: "3.8.5"
        }
      },
      nbformat: 4,
      nbformat_minor: 4
    };

    const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' });
    downloadFile(blob, originalFilename.replace('.py', '.ipynb'));
  }, [cells, selectedIndices, originalFilename]);

  const handleDownloadPy = useCallback(() => {
    if (cells.length === 0) return;
    const finalCells = cells.filter((_, index) => selectedIndices.includes(index));

    let scriptContent = "# Generated by Script-to-Notebook AI\n\n";

    finalCells.forEach(cell => {
      if (cell.cell_type === 'markdown') {
        const commentedSource = cell.source
          .map(line => `# ${line.replace(/\n$/, '')}`)
          .join('\n');
        scriptContent += `# %% [markdown]\n${commentedSource}\n\n`;
      } else {
        const source = cell.source.join('');
        scriptContent += `# %%\n${source}\n\n`;
      }
    });

    const blob = new Blob([scriptContent], { type: 'text/x-python' });
    downloadFile(blob, originalFilename.replace('.py', '_documented.py'));
  }, [cells, selectedIndices, originalFilename]);

  const reset = () => {
    setCells([]);
    setStatus({ step: 'idle' });
    setOriginalFilename('');
    setSelectedIndices([]);
    setIsDownloadMenuOpen(false);
  };

  return (
    <div className="min-h-screen relative flex flex-col text-merino" onClick={() => setIsDownloadMenuOpen(false)}>
      <CursorFollower />

      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b-0 border-b-waikawa/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-chambray to-waikawa p-2 rounded-xl shadow-lg shadow-chambray/20">
              <BookOpen className="w-6 h-6 text-merino" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-merino to-casper">
              Script-to-Notebook AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {status.step === 'complete' && (
                <button 
                  onClick={reset}
                  className="text-sm font-medium text-waikawa hover:text-merino transition-colors flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4" /> Start Over
                </button>
             )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start pt-16 pb-20 px-4 sm:px-6 relative z-10">
        
        {/* Hero Section (only when idle) */}
        {status.step === 'idle' && (
          <div className="text-center max-w-3xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight text-merino">
              Turn messy scripts into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-casper to-chambray">beautiful notebooks</span>
            </h2>
            <p className="text-xl text-waikawa mb-10 leading-relaxed font-light">
              Upload your raw Python script. Our AI analyzes the logic, splits it into cells, 
              and writes professional Markdown documentation automatically.
            </p>
            
            {/* Tone Selection */}
            <div className="mb-8 flex items-center justify-center gap-3" onClick={e => e.stopPropagation()}>
              <div className="bg-cello/50 p-1.5 rounded-lg flex items-center gap-2 border border-waikawa/30">
                <Settings2 className="w-4 h-4 text-waikawa ml-2" />
                <span className="text-sm text-waikawa font-medium">Documentation Style:</span>
                <select 
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="bg-cello border-none text-casper text-sm font-semibold focus:ring-0 rounded cursor-pointer py-1 pr-8 focus:text-merino"
                >
                  <option value="Beginner-friendly">Beginner-friendly</option>
                  <option value="Academic">Academic</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Concise">Concise</option>
                </select>
              </div>
            </div>

            <FileUpload onFileSelect={processFile} />

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              {[
                { title: 'Smart Splitting', desc: 'Separates imports, functions, and execution logic automatically.' },
                { title: 'Auto-Documentation', desc: 'Writes clear explanations tailored to your selected audience.' },
                { title: 'Dependency Check', desc: 'Auto-generates pip install cells for missing libraries.' }
              ].map((feature, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl hover:bg-cello/80 transition-colors duration-300">
                  <div className="w-10 h-10 bg-chambray/20 rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-casper" />
                  </div>
                  <h3 className="text-lg font-semibold text-merino mb-2">{feature.title}</h3>
                  <p className="text-sm text-waikawa leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing State */}
        {(status.step === 'reading' || status.step === 'analyzing') && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-500">
            <Spinner size="lg" color="border-casper" />
            <h3 className="mt-8 text-2xl font-semibold text-merino">Processing your script</h3>
            <p className="mt-3 text-waikawa">{status.message}</p>
            
            {status.step === 'analyzing' && (
              <div className="mt-10 max-w-md w-full glass-card rounded-xl p-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-4 text-sm text-waikawa">
                    <div className="w-2.5 h-2.5 rounded-full bg-chambray shadow-[0_0_10px_rgba(59,91,140,0.5)]"></div>
                    <span>Reading syntax tree...</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-waikawa">
                    <div className="w-2.5 h-2.5 rounded-full bg-chambray animate-pulse"></div>
                    <span>Structuring logical blocks...</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-waikawa">
                    <div className="w-2.5 h-2.5 rounded-full bg-waikawa animate-pulse delay-300"></div>
                    <span>Writing {tone.toLowerCase()} documentation...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {status.step === 'error' && (
          <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-8 ring-1 ring-red-500/30">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-merino mb-2">Conversion Failed</h3>
            <p className="text-waikawa mb-8 max-w-md mx-auto leading-relaxed">{status.message}</p>
            <button 
              onClick={reset}
              className="px-8 py-3 bg-merino text-cello rounded-xl font-semibold hover:bg-white transition-all shadow-[0_0_20px_rgba(242,231,222,0.1)]"
            >
              Try Another File
            </button>
          </div>
        )}

        {/* Success/Preview State */}
        {status.step === 'complete' && cells.length > 0 && (
          <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
              <div>
                <h2 className="text-3xl font-bold text-merino flex items-center gap-3">
                  <Sparkles className="w-7 h-7 text-casper fill-casper/20" />
                  Notebook Ready
                </h2>
                <p className="text-waikawa mt-2">
                  Generated {cells.length} cells for <span className="font-mono text-casper bg-cello px-2 py-0.5 rounded border border-waikawa/20">{originalFilename}</span>
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="text-right hidden md:block">
                  <p className="text-xs text-waikawa font-medium uppercase tracking-wider mb-1">Selected Cells</p>
                  <p className="text-xl font-mono text-merino">{selectedIndices.length} / {cells.length}</p>
                </div>
                
                {/* Dual Export Dropdown */}
                <div className="relative" ref={downloadMenuRef}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsDownloadMenuOpen(!isDownloadMenuOpen); }}
                    disabled={selectedIndices.length === 0}
                    className={`
                      flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all
                      ${selectedIndices.length === 0 
                        ? 'bg-cello text-waikawa cursor-not-allowed' 
                        : 'bg-gradient-to-r from-chambray to-waikawa hover:from-chambray hover:to-chambray text-merino shadow-chambray/25'
                      }
                    `}
                  >
                    <Download className="w-5 h-5" />
                    Download
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDownloadMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-cello border border-waikawa/30 rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in-95">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDownloadIpynb(); }}
                        className="w-full text-left px-4 py-3 hover:bg-chambray/20 flex items-center gap-3 transition-colors"
                      >
                         <FileJson className="w-4 h-4 text-casper" />
                         <div>
                            <span className="block text-sm font-medium text-merino">Jupyter Notebook</span>
                            <span className="block text-xs text-waikawa">.ipynb format</span>
                         </div>
                      </button>
                      <div className="h-px bg-waikawa/20 mx-2" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDownloadPy(); }}
                        className="w-full text-left px-4 py-3 hover:bg-chambray/20 flex items-center gap-3 transition-colors"
                      >
                         <FileCode className="w-4 h-4 text-chambray" />
                         <div>
                            <span className="block text-sm font-medium text-merino">Python Script</span>
                            <span className="block text-xs text-waikawa">.py with # %% cells</span>
                         </div>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Preview Panel */}
            <NotebookPreview 
              cells={cells} 
              filename={originalFilename} 
              selectedIndices={selectedIndices}
              onToggleCell={toggleCell}
              onReorder={handleReorder}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-waikawa/20 py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-4 text-center text-waikawa text-sm font-light">
          <p>Powered by Google Gemini 2.5 Flash. All processing happens locally in your browser.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;