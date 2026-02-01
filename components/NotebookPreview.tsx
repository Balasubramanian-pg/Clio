import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { NotebookCell } from '../types';
import { Terminal, FileText, CheckCircle2, Circle, GripVertical, ChevronDown, ChevronRight, Layers, List } from 'lucide-react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';

interface CellItemProps {
  cell: NotebookCell;
  index: number;
  dragEnabled?: boolean;
  selected: boolean;
  onToggle: (id: string) => void;
}

const CellItem: React.FC<CellItemProps> = ({ cell, index, dragEnabled = false, selected, onToggle }) => {
  return (
    <div className={`group relative transition-all duration-300 ${!selected ? 'opacity-50 blur-[1px] hover:blur-0 hover:opacity-80' : 'opacity-100'}`}>
      {/* Cell Header & Toggle */}
      <div className="flex items-center justify-between mb-2 select-none">
        <div className="flex items-center gap-2">
          {dragEnabled && (
             <div className="cursor-grab active:cursor-grabbing text-waikawa hover:text-casper p-1 rounded">
               <GripVertical className="w-4 h-4" />
             </div>
          )}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onToggle(cell.id)}
          >
            {cell.cell_type === 'code' ? (
              <span className="text-xs font-mono text-casper flex items-center gap-1 uppercase tracking-wider">
                <Terminal className="w-3 h-3 text-chambray" /> Code [{index}]
              </span>
            ) : (
              <span className="text-xs font-mono text-merino flex items-center gap-1 uppercase tracking-wider">
                <FileText className="w-3 h-3 text-waikawa" /> Markdown
              </span>
            )}
          </div>
        </div>
        
        <button 
          className={`transition-colors duration-200 ${selected ? 'text-chambray' : 'text-waikawa hover:text-casper'}`}
          onClick={() => onToggle(cell.id)}
        >
          {selected ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>
      </div>

      {/* Cell Content */}
      <div className={`
        rounded-lg overflow-hidden border transition-all duration-200
        ${cell.cell_type === 'code' 
          ? 'bg-[#1e1e1e] border-waikawa/30 shadow-md' 
          : 'bg-cello/40 border-waikawa/20 text-merino p-4'
        }
        ${!selected && 'grayscale'}
      `}>
        {cell.cell_type === 'code' ? (
          <div className="text-sm">
            <SyntaxHighlighter
              language="python"
              style={vscDarkPlus}
              customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
              wrapLongLines={true}
            >
              {cell.source.join('')}
            </SyntaxHighlighter>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:text-merino prose-headings:text-casper prose-a:text-chambray prose-code:text-casper">
            <ReactMarkdown>
              {cell.source.join('')}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

interface NotebookPreviewProps {
  cells: NotebookCell[];
  filename: string;
  selectedIndices: number[];
  onToggleCell: (id: string) => void;
  onReorder: (newCells: NotebookCell[]) => void;
}

export const NotebookPreview: React.FC<NotebookPreviewProps> = ({ 
  cells, 
  filename, 
  selectedIndices, 
  onToggleCell,
  onReorder
}) => {
  const [viewMode, setViewMode] = useState<'linear' | 'grouped'>('linear');
  const [groupsExpanded, setGroupsExpanded] = useState({ code: true, markdown: true });

  // Filter cells for grouped view
  const codeCells = cells.filter(c => c.cell_type === 'code');
  const markdownCells = cells.filter(c => c.cell_type === 'markdown');

  const getCellIndex = (id: string) => cells.findIndex(c => c.id === id);
  const isSelected = (id: string) => selectedIndices.includes(getCellIndex(id));

  return (
    <div className="w-full glass-panel rounded-xl overflow-hidden shadow-2xl flex flex-col h-[800px]">
      <div className="bg-cello/80 backdrop-blur-md border-b border-waikawa/20 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>
          <span className="ml-4 text-sm font-medium text-casper truncate max-w-[200px]">{filename.replace('.py', '.ipynb')}</span>
          <div className="w-px h-4 bg-waikawa/30 mx-2" />
           <div className="flex items-center bg-cello rounded-lg p-1 border border-waikawa/30">
            <button
              onClick={() => setViewMode('linear')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'linear' ? 'bg-chambray text-merino shadow-sm' : 'text-waikawa hover:text-casper'}`}
              title="Linear View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grouped' ? 'bg-chambray text-merino shadow-sm' : 'text-waikawa hover:text-casper'}`}
              title="Grouped View"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="text-xs text-casper font-medium px-2 py-1 bg-cello rounded border border-waikawa/20 whitespace-nowrap">
          {selectedIndices.length} / {cells.length} Cells Selected
        </div>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-cello/30">
        {viewMode === 'linear' ? (
          <Reorder.Group axis="y" values={cells} onReorder={onReorder} className="space-y-6">
            {cells.map((cell, index) => (
              <Reorder.Item key={cell.id} value={cell}>
                 <CellItem 
                   cell={cell} 
                   index={index} 
                   dragEnabled={true} 
                   selected={selectedIndices.includes(index)} 
                   onToggle={onToggleCell}
                 />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="space-y-8">
            {/* Markdown Group */}
            <div className="space-y-4">
               <button 
                onClick={() => setGroupsExpanded(prev => ({...prev, markdown: !prev.markdown}))}
                className="flex items-center gap-2 w-full text-left text-sm font-semibold text-merino uppercase tracking-wider pb-2 border-b border-waikawa/30 hover:text-casper transition-colors"
               >
                 {groupsExpanded.markdown ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                 Markdown Cells ({markdownCells.length})
               </button>
               <AnimatePresence>
                 {groupsExpanded.markdown && (
                   <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-6 overflow-hidden"
                   >
                     {markdownCells.map(cell => (
                       <CellItem 
                         key={cell.id} 
                         cell={cell} 
                         index={getCellIndex(cell.id)} 
                         selected={isSelected(cell.id)}
                         onToggle={onToggleCell}
                       />
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* Code Group */}
            <div className="space-y-4">
               <button 
                onClick={() => setGroupsExpanded(prev => ({...prev, code: !prev.code}))}
                className="flex items-center gap-2 w-full text-left text-sm font-semibold text-casper uppercase tracking-wider pb-2 border-b border-waikawa/30 hover:text-merino transition-colors"
               >
                 {groupsExpanded.code ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                 Code Cells ({codeCells.length})
               </button>
               <AnimatePresence>
                 {groupsExpanded.code && (
                   <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-6 overflow-hidden"
                   >
                     {codeCells.map(cell => (
                       <CellItem 
                         key={cell.id} 
                         cell={cell} 
                         index={getCellIndex(cell.id)} 
                         selected={isSelected(cell.id)}
                         onToggle={onToggleCell}
                       />
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
