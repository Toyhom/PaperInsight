import React, { useState } from 'react';
import { ResearchAtom } from '../hooks/useCandidates';
import ReactMarkdown from 'react-markdown';

interface SynthesisResultViewProps {
    content: string;
    inputAtoms: ResearchAtom[];
}

export function SynthesisResultView({ content, inputAtoms }: SynthesisResultViewProps) {
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedAtom, setSelectedAtom] = useState<ResearchAtom | null>(null);

    return (
        <div className="flex gap-4 relative">
            {/* Main Report */}
            <div className={`flex-1 transition-all ${historyOpen ? 'mr-64' : ''}`}>
                 <div className="prose dark:prose-invert max-w-none bg-white dark:bg-gray-900 p-8 rounded-lg shadow border dark:border-gray-800">
                    <ReactMarkdown>{content}</ReactMarkdown>
                    
                    <div className="mt-8 pt-8 border-t dark:border-gray-800">
                        <h3 className="text-lg font-bold mb-4">References</h3>
                        <div className="space-y-2">
                            {inputAtoms.map((atom, idx) => (
                                <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-semibold">[{idx + 1}]</span> {atom.papers?.title} 
                                    <a href={atom.papers?.pdf_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:underline">
                                        [PDF]
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* History / Atom Details Sidebar (Collapsible) */}
            <div className={`fixed right-0 top-20 bottom-0 bg-gray-50 dark:bg-gray-900 border-l dark:border-gray-800 transition-all duration-300 transform ${historyOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full'} overflow-hidden shadow-xl`}>
                <div className="p-4 h-full overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">Input Atoms</h3>
                        <button onClick={() => setHistoryOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                    </div>
                    
                    <div className="space-y-4">
                        {inputAtoms.map((atom, idx) => (
                            <div 
                                key={idx} 
                                className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700 cursor-pointer hover:border-blue-500"
                                onClick={() => setSelectedAtom(atom)}
                            >
                                <span className={`text-[10px] px-2 py-0.5 rounded text-white ${
                                    atom.type === 'Motivation' ? 'bg-blue-500' :
                                    atom.type === 'Idea' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}>
                                    {atom.type}
                                </span>
                                <p className="text-xs mt-2 line-clamp-3">{atom.content_en}</p>
                                <p className="text-[10px] text-gray-400 mt-1 truncate">{atom.papers?.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toggle Button */}
            {!historyOpen && (
                <button 
                    onClick={() => setHistoryOpen(true)}
                    className="fixed right-4 top-24 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border dark:border-gray-700 z-10"
                    title="View Input Atoms"
                >
                    <span className="text-xl">📜</span>
                </button>
            )}

            {/* Atom Detail Modal */}
            {selectedAtom && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                             <h3 className="font-bold text-lg">{selectedAtom.type} Details</h3>
                             <button onClick={() => setSelectedAtom(null)} className="text-gray-500">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase">English Content</h4>
                                <p className="text-sm dark:text-gray-200">{selectedAtom.content_en}</p>
                            </div>
                            {/* Assuming content_cn exists on type, if not need to add to interface */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase">Source Paper</h4>
                                <p className="text-sm font-medium">{selectedAtom.papers?.title}</p>
                                <a href={selectedAtom.papers?.pdf_url} target="_blank" className="text-xs text-blue-500 hover:underline">View PDF</a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
