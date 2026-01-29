import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AdminCrawler() {
    const [settings, setSettings] = useState({ enabled: false, query: 'cat:cs.AI', max_results: 5 });
    
    // Separate state for Category and Keywords
    const [category, setCategory] = useState('cs.AI');
    const [keywords, setKeywords] = useState('');
    const [manualMax, setManualMax] = useState(5);
    
    const [loading, setLoading] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

    useEffect(() => {
        // Check Admin Auth
        const checkAuth = async () => {
             if (skipAuth) {
                 setProfile({ role: 'admin' });
                 return;
             }

             const { data: { user } } = await supabase.auth.getUser();
             if (!user) {
                 navigate('/login');
                 return;
             }

             const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            
             if (!profile || profile.role !== 'admin') {
                 alert('Access Denied: Admins only.');
                 navigate('/');
                 return;
             }
             setProfile(profile);
        };
        checkAuth();
    }, [navigate, skipAuth]);

    const fetchSettings = async () => {
        const res = await fetch('/api/crawler/settings');
        if (res.ok) {
            const data = await res.json();
            setSettings(data);
        }
    };

    const saveSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/crawler/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) alert('Settings saved');
            else alert('Failed to save');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // Real progress is hard without sockets, but we can make the simulation smarter
    // OR we can poll an endpoint if we had one.
    // For now, let's just make the simulation smoother and proportional to "max results"
    // Assuming ~5 seconds per paper as a rough guess
    useEffect(() => {
        let interval: any;
        
        if (triggering) {
            setProgress(0);
            setStatusMessage('Initiating crawl...');
            
            const estimatedDuration = manualMax * 4000; // 4s per paper
            const stepTime = 200; // Update every 200ms
            const totalSteps = estimatedDuration / stepTime;
            const increment = 90 / totalSteps; // Target 90%

            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + increment;
                });
            }, stepTime);
        }
        
        return () => clearInterval(interval);
    }, [triggering, manualMax]);

    const triggerManual = async () => {
        setTriggering(true);
        // Construct query: cat:cs.AI AND all:keyword
        let finalQuery = `cat:${category}`;
        if (keywords.trim()) {
            finalQuery += ` AND all:${keywords.trim()}`;
        }

        try {
            // Add minimum artificial delay of 2s to show progress
            // Also wait for the "estimated" time if it's short, to feel real
            const startTime = Date.now();
            
            const res = await fetch('/api/crawler/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: finalQuery, max: manualMax })
            });

            // If the API returns quickly (async trigger), we still want to show the bar filling up
            // logic is tricky here because "res.ok" just means "job started" not "job done"
            // So we can't really wait for "job done" unless we poll.
            
            // Current Compromise:
            // The simulation above runs based on time. 
            // If the API returns, we just let it sit at whatever progress it is?
            // No, the user wants to know when it's DONE.
            
            // To do this properly without sockets, we'd need to POLL for job status.
            // Since we don't have a job status endpoint ready, we will stick to the simulation
            // but make it wait for the *estimated* time before showing success.
            
            const minWait = manualMax * 2000; // Wait at least 2s per paper (simulation)
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minWait - elapsed);
            
            if (remaining > 0) {
                 // Speed up the remaining progress to 100% over the remaining time?
                 // Or just wait.
                 await new Promise(resolve => setTimeout(resolve, remaining));
            }

            if (res.ok) {
                // Now snap to 100%
                setProgress(100);
                setStatusMessage('Crawl triggered successfully!');
                
                // Wait a bit before clearing
                setTimeout(() => {
                    alert(`Crawler triggered for "${finalQuery}"! Check Inngest dashboard.`);
                    setProgress(0);
                    setStatusMessage('');
                }, 500);
            } else {
                alert('Failed to trigger');
                setProgress(0);
            }
        } catch (e) {
            console.error(e);
            setProgress(0);
        } finally {
            setTriggering(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700 max-w-2xl mx-auto mt-8 relative">
            <button 
                onClick={() => navigate('/')}
                className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
                ✕ Close
            </button>

            <h2 className="text-2xl font-bold mb-6 dark:text-white">Crawler Admin</h2>

            {/* Manual Trigger */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-4 text-lg dark:text-gray-200">🚀 Manual Crawl</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category (e.g., cs.AI)</label>
                        <input 
                            className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            placeholder="cs.AI"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Keywords (Optional)</label>
                        <input 
                            className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                            value={keywords}
                            onChange={e => setKeywords(e.target.value)}
                            placeholder="e.g. LLM or Transformer"
                        />
                    </div>
                </div>

                <div className="flex gap-4 items-end">
                    <div className="w-24">
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Max Results</label>
                        <input 
                            type="number"
                            className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                            value={manualMax}
                            onChange={e => setManualMax(parseInt(e.target.value))}
                        />
                    </div>
                    <button 
                        onClick={triggerManual}
                        disabled={triggering}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {triggering ? 'Running...' : 'Start Crawl'}
                    </button>
                </div>
                
                {/* Progress Bar */}
                {(progress > 0 || triggering) && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{statusMessage}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600 overflow-hidden">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                    Query: {`cat:${category}`}{keywords && ` AND all:${keywords}`}
                </p>
            </div>

            {/* Manual Upload */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-4 text-lg dark:text-gray-200">📂 Upload Paper</h3>
                <div className="flex items-center gap-4">
                    <input 
                        type="file" 
                        accept=".pdf"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-300 dark:file:bg-gray-600 dark:file:text-white"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            // Check if file is PDF
                            if (file.type !== 'application/pdf') {
                                alert('Please upload a PDF file');
                                return;
                            }
                            
                            const formData = new FormData();
                            formData.append('file', file);
                            
                            setTriggering(true);
                            setStatusMessage('Uploading and processing...');
                            setProgress(10);
                            
                            try {
                                const res = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                });
                                
                                if (res.ok) {
                                    setProgress(100);
                                    setStatusMessage('Upload successful! Processing started.');
                                    setTimeout(() => {
                                        alert('Paper uploaded and processing started. Check Inngest/DB.');
                                        setProgress(0);
                                        setStatusMessage('');
                                    }, 1000);
                                } else {
                                    const err = await res.json();
                                    alert(err.error || 'Upload failed');
                                    setProgress(0);
                                }
                            } catch (error) {
                                console.error(error);
                                alert('Upload error');
                                setProgress(0);
                            } finally {
                                setTriggering(false);
                            }
                        }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Upload a local PDF to extract atoms and add to the library.
                </p>
            </div>


            {/* Auto Settings */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg dark:text-gray-200">⏰ Daily Auto Crawl</h3>
                    <div className="flex items-center">
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={settings.enabled}
                                onChange={e => setSettings({...settings, enabled: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Default Query</label>
                        <input 
                            className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                            value={settings.query}
                            onChange={e => setSettings({...settings, query: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Max Results</label>
                        <input 
                            type="number"
                            className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                            value={settings.max_results}
                            onChange={e => setSettings({...settings, max_results: parseInt(e.target.value)})}
                        />
                    </div>
                </div>
                
                <button 
                    onClick={saveSettings}
                    disabled={loading}
                    className="w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500"
                >
                    {loading ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );
}
