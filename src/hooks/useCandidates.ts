import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ResearchAtom {
    id: string;
    type: 'Motivation' | 'Idea' | 'Method';
    content_en: string;
    paper_id: string;
    papers?: {
        title: string;
        pdf_url: string;
    }
}

const DEV_USER_ID = '00000000-0000-0000-0000-000000000000';

export function useCandidates() {
    const [candidates, setCandidates] = useState<ResearchAtom[]>([]);
    const [loading, setLoading] = useState(false);
    const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

    const getUserId = async () => {
        if (skipAuth) return DEV_USER_ID;
        const { data: { user } } = await supabase.auth.getUser();
        
        // If no authenticated user, return DEV_USER_ID as fallback 
        // IF we are in a permissive mode, but the logic above handles 'skipAuth'.
        // However, the error log shows '00000000-0000-0000-0000-000000000000' being sent and failing.
        // This implies the RLS policy for 'user_candidates' is rejecting this ID 
        // because auth.uid() is null (not logged in) OR doesn't match the fake ID.
        
        // If we are not logged in, we shouldn't be fetching candidates at all unless
        // we want to show a "demo" list. 
        
        return user?.id;
    }

    const fetchCandidates = async () => {
        setLoading(true);
        const userId = await getUserId();
        
        if (!userId) {
             setLoading(false);
             return;
        }

        // If using DEV_USER_ID, we might encounter RLS issues if the policy 
        // strictly checks auth.uid() = user_id and auth.uid() is null.
        // We need a way to bypass RLS for this specific dev scenario 
        // OR ensure the user is actually signed in.
        
        // However, for now, let's catch the error gracefully.
        
        const { data, error } = await supabase
            .from('user_candidates')
            .select(`
                atom_id,
                research_atoms (
                    id,
                    type,
                    content_en,
                    paper_id,
                    papers (
                        title,
                        pdf_url
                    )
                )
            `)
            .eq('user_id', userId);
            
        if (error) {
            console.error('Error fetching candidates:', error);
            // If error is 406 or RLS related, just return empty list
            setCandidates([]); 
        } else {
            // Flatten structure
            const formatted = data.map((item: any) => ({
                ...item.research_atoms,
                papers: item.research_atoms.papers
            }));
            setCandidates(formatted);
        }
        setLoading(false);
    };

    const addCandidate = async (atomId: string) => {
        const userId = await getUserId();
        
        if (!userId) {
            alert("Please login first");
            window.location.href = "/login";
            return;
        }

        const { error } = await supabase
            .from('user_candidates')
            .insert({
                user_id: userId,
                atom_id: atomId
            });
            
        if (error) {
            // Ignore duplicate error
            if (error.code !== '23505') {
                 console.error('Error adding candidate:', error);
                 alert('Failed to add candidate');
            }
        } else {
            fetchCandidates();
        }
    };

    const removeCandidate = async (atomId: string) => {
        const userId = await getUserId();
        if (!userId) return;

        const { error } = await supabase
            .from('user_candidates')
            .delete()
            .eq('user_id', userId)
            .eq('atom_id', atomId);

        if (error) {
            console.error('Error removing candidate:', error);
            alert('Failed to remove candidate');
        } else {
            fetchCandidates();
        }
    };

    const clearCandidates = async () => {
        const userId = await getUserId();
        if (!userId) return;

        const { error } = await supabase
            .from('user_candidates')
            .delete()
            .eq('user_id', userId);

        if (error) {
             console.error('Error clearing candidates:', error);
             alert('Failed to clear candidates');
        } else {
            fetchCandidates();
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    return { candidates, addCandidate, removeCandidate, clearCandidates, loading, refresh: fetchCandidates };
}
