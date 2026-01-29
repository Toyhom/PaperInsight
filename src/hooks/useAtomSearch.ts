import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ResearchAtom } from './useCandidates';

export function useAtomSearch() {
    const [results, setResults] = useState<ResearchAtom[]>([]);
    const [searching, setSearching] = useState(false);

    const searchAtoms = async (query: string, typeFilter?: string) => {
        setSearching(true);
        let queryBuilder = supabase
            .from('research_atoms')
            .select(`
                id,
                type,
                content_en,
                paper_id,
                papers (
                    title,
                    pdf_url
                )
            `);
        
        if (typeFilter && typeFilter !== 'All') {
            queryBuilder = queryBuilder.eq('type', typeFilter);
        }

        if (query) {
            queryBuilder = queryBuilder.ilike('content_en', `%${query}%`);
        }

        const { data, error } = await queryBuilder.order('created_at', { ascending: false }).limit(20);

        if (error) {
            console.error(error);
        } else {
             const formatted = data.map((item: any) => ({
                ...item,
                papers: item.papers
            }));
            setResults(formatted);
        }
        setSearching(false);
    };

    return { results, searching, searchAtoms };
}
