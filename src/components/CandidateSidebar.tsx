import React, { useState } from 'react';
import { ResearchAtom } from '../hooks/useCandidates';
import { AtomSearchModal } from './AtomSearchModal';

interface CandidateSidebarProps {
    candidates: ResearchAtom[];
    onAdd: (atomId: string) => void;
    onRemove: (atomId: string) => void;
    onClear: () => void;
    onSynthesize: () => void;
}

export function CandidateSidebar({ candidates, onAdd, onRemove, onClear, onSynthesize }: CandidateSidebarProps) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedAtom, setSelectedAtom] = useState<ResearchAtom | null>(null);

    return (
        <div className="w-80 h-full border-r bg-gray-50 dark:bg-gray-900 flex flex-col p-4 shrink-0">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg dark:text-white">Candidates</h2>
                <div className="flex gap-2">
                    {candidates.length > 0 && (
                        <button 
                            onClick={() => {
                                if(window.confirm('Clear all candidates?')) onClear();
                            }}
                            className="text-xs text-red-500 hover:text-red-700"
                            title="Clear All"
                        >
                            Clear
                        </button>
                    )}
                    <button 
                        onClick={() => setModalOpen(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
                        title="Add Atom"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                {candidates.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center mt-10">
                        No atoms selected.<br/>Click + to add.
                    </p>
                ) : (
                    candidates.map((atom, idx) => (
                        <div 
                            key={`${atom.id}-${idx}`} 
                            className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border dark:border-gray-700 hover:border-blue-300 transition group relative cursor-pointer"
                            onClick={() => setSelectedAtom(atom)}
                        >
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(atom.id);
                                }}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove"
                            >
                                ✕
                            </button>
                             <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white ${
                                    atom.type === 'Motivation' ? 'bg-blue-500' :
                                    atom.type === 'Idea' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}>
                                    {atom.type}
                                </span>
                            </div>
                            <p className="text-xs text-gray-800 dark:text-gray-300 line-clamp-3">
                                {atom.content_en}
                            </p>
                             <p className="mt-2 text-[10px] text-gray-400 truncate">
                                {atom.papers?.title}
                            </p>
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={onSynthesize}
                disabled={candidates.length === 0}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:scale-[1.02] transition transform"
            >
                Synthesize
            </button>

            <AtomSearchModal 
                isOpen={isModalOpen} 
                onClose={() => setModalOpen(false)} 
                onAdd={onAdd}
            />

            {/* Atom Detail Modal */}
            {selectedAtom && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 shadow-2xl relative">
                        <button 
                            onClick={() => setSelectedAtom(null)} 
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                            ✕
                        </button>
                        
                        <div className="mb-4">
                            <span className={`px-2 py-1 rounded text-xs uppercase font-bold text-white ${
                                selectedAtom.type === 'Motivation' ? 'bg-blue-500' :
                                selectedAtom.type === 'Idea' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}>
                                {selectedAtom.type}
                            </span>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-1">Content</h4>
                                <p className="text-sm dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {selectedAtom.content_en}
                                </p>
                            </div>
                            
                            <div className="pt-4 border-t dark:border-gray-700">
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-1">Source Paper</h4>
                                <p className="text-sm font-medium dark:text-white mb-1">{selectedAtom.papers?.title}</p>
                                {selectedAtom.papers?.pdf_url && (
                                    <a 
                                        href={selectedAtom.papers.pdf_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                                    >
                                        📄 View PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
