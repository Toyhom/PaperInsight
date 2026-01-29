import React, { useState, useEffect } from 'react';
import { useAtomSearch } from '../hooks/useAtomSearch';

interface AtomSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (atomId: string) => void;
}

export function AtomSearchModal({ isOpen, onClose, onAdd }: AtomSearchModalProps) {
    const { results, searching, searchAtoms } = useAtomSearch();
    const [query, setQuery] = useState('');
    const [type, setType] = useState('All');

    // Debounce search
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                searchAtoms(query, type);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, query, type]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold dark:text-white">Search Research Atoms</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                        ✕
                    </button>
                </div>
                
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        className="flex-1 border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                        placeholder="Search keywords..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <select 
                        className="border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                        value={type} 
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        <option value="Motivation">Motivation</option>
                        <option value="Idea">Idea</option>
                        <option value="Method">Method</option>
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {searching ? (
                        <p className="text-center py-4 dark:text-gray-300">Searching...</p>
                    ) : results.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No atoms found.</p>
                    ) : (
                        results.map(atom => (
                            <div key={atom.id} className="border rounded p-3 hover:shadow-md transition dark:border-gray-600 dark:hover:bg-gray-750">
                                <div className="flex justify-between items-start">
                                    <span className={`px-2 py-0.5 rounded text-xs text-white ${
                                        atom.type === 'Motivation' ? 'bg-blue-500' :
                                        atom.type === 'Idea' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}>
                                        {atom.type}
                                    </span>
                                    <button 
                                        onClick={() => { onAdd(atom.id); }}
                                        className="text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                                    >
                                        Add
                                    </button>
                                </div>
                                <p className="mt-2 text-sm text-gray-800 dark:text-gray-200 line-clamp-3">
                                    {atom.content_en}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 italic">
                                    Source: {atom.papers?.title}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    {/* Added for debugging/verification */}
                                    ID: {atom.id.substring(0,8)}...
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
