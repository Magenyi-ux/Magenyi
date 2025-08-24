

import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateStudyFact } from '../services/geminiService';

const StudyFact: React.FC = () => {
    const [studyField] = useLocalStorage<string | null>('studyField', null);
    const [fact, setFact] = useState<string>('');
    const [isFading, setIsFading] = useState(true);
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (!studyField) {
            setFact('');
            return;
        }

        let isMounted = true;
        const fetchFact = async () => {
            if (!isMounted) return;
            try {
                const newFact = await generateStudyFact(studyField);
                if (isMounted) {
                    setFact(newFact);
                    setIsFading(false); // Fade in
                }
            } catch (error) {
                console.error("Failed to fetch study fact:", error);
            }
        };
        
        // Initial fetch
        if (isFirstRun.current) {
            fetchFact();
            isFirstRun.current = false;
        }

        const interval = setInterval(() => {
            if (!document.hidden) { // Don't cycle when tab is not visible
                setIsFading(true); // Fade out
                setTimeout(fetchFact, 500); // Fetch new fact after fade out animation
            }
        }, 5500); // 5s visible + 0.5s fade out

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [studyField]);

    if (!studyField || !fact) {
        return null;
    }

    return (
        <div className="relative hidden md:flex items-center gap-2 p-2 rounded-lg max-w-xs group cursor-help" title={fact}>
            <span className="text-xl flex-shrink-0">💡</span>
            <p className={`text-xs text-slate-700 transition-opacity duration-500 line-clamp-2 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                {fact}
            </p>
        </div>
    );
};

export default StudyFact;