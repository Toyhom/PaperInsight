import React, { useState, useEffect } from 'react';
import { CandidateSidebar } from '../components/CandidateSidebar';
import { useCandidates } from '../hooks/useCandidates';
import { SynthesisResultView } from '../components/SynthesisResultView';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const { candidates, addCandidate, removeCandidate, clearCandidates, loading } = useCandidates();
    const [synthesisResult, setSynthesisResult] = useState('');
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const navigate = useNavigate();
    const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

    useEffect(() => {
        if (skipAuth) {
            setUser({ email: 'dev@local', id: '00000000-0000-0000-0000-000000000000' });
            fetchHistory('00000000-0000-0000-0000-000000000000');
        } else {
            supabase.auth.getUser().then(({ data: { user } }) => {
                setUser(user);
                if (user) fetchHistory(user.id);
            });
        }
    }, [skipAuth]);

    const fetchHistory = async (userId: string) => {
        const { data } = await supabase
            .from('synthesis_reports')
            .select('id, created_at, result_markdown, input_atoms')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (data) setHistory(data);
    };

    const loadReport = (report: any) => {
        setSynthesisResult(report.result_markdown);
        // We could also restore the input atoms visually if needed, but for now just showing content
        setShowHistory(false);
    };

    const handleLogout = async () => {
        if (!skipAuth) {
            await supabase.auth.signOut();
        }
        setUser(null);
        window.location.reload();
    };

    const handleSynthesize = async () => {
        setIsSynthesizing(true);
        setSynthesisResult('');
        
        try {
            let userId;
            if (skipAuth) {
                userId = '00000000-0000-0000-0000-000000000000';
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id;
            }
            
            const atomIds = candidates.map(c => c.id);

            const response = await fetch('/api/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    atomIds,
                    userId
                })
            });

            if (!response.ok) {
                const err = await response.json();
                alert(err.error || 'Synthesis failed');
                setIsSynthesizing(false);
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) return;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '');
                        if (dataStr === '[DONE]') break;
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.content) {
                                setSynthesisResult(prev => prev + data.content);
                            }
                        } catch (e) {
                            // console.error(e);
                        }
                    }
                }
            }

        } catch (error) {
            console.error(error);
            alert('Error calling synthesis API');
        } finally {
            setIsSynthesizing(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
            {/* Left Sidebar */}
            <CandidateSidebar 
                candidates={candidates} 
                onAdd={addCandidate} 
                onRemove={removeCandidate}
                onClear={clearCandidates}
                onSynthesize={handleSynthesize}
            />

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto p-8 relative">
                 <div className="absolute top-4 right-4 flex gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {skipAuth ? 'Dev Mode (No Auth)' : user.email}
                            </span>
                            {!skipAuth && (
                                <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
                            )}
                            <button 
                                onClick={() => setShowHistory(true)} 
                                className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 mr-2"
                            >
                                History
                            </button>
                            <button 
                                onClick={() => navigate('/admin')} 
                                className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                            >
                                Admin
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => navigate('/login')} 
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        >
                            Login
                        </button>
                    )}
                </div>

                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Synthesis Report</h1>
                    
                    {synthesisResult ? (
                        <SynthesisResultView 
                            content={synthesisResult} 
                            inputAtoms={candidates} 
                        />
                    ) : isSynthesizing ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 animate-pulse">Synthesizing Research Idea...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                            <p className="text-lg">Select atoms from the sidebar and click Synthesize.</p>
                        </div>
                    )}
                </div>
                {/* History Modal */}
                {showHistory && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl h-[70vh] flex flex-col p-6 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold dark:text-white">Synthesis History</h2>
                                <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-3">
                                {history.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No history found.</p>
                                ) : (
                                    history.map(item => (
                                        <div 
                                            key={item.id} 
                                            className="border rounded p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-750 cursor-pointer"
                                            onClick={() => loadReport(item)}
                                        >
                                            <p className="text-sm font-semibold dark:text-gray-200">
                                                {new Date(item.created_at).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                {item.result_markdown.substring(0, 100)}...
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
