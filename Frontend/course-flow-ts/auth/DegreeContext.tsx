import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export type DegreeOption = {
    id: string;
    name: string;
    type: 'MAJOR' | 'MINOR';
};

interface DegreeContextType {
    majors: DegreeOption[];
    minors: DegreeOption[];
    getDegreeName: (id: string) => string;
    isLoadingDegrees: boolean;
}

const DegreeContext = createContext<DegreeContextType | undefined>(undefined);

export const DegreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [majors, setMajors] = useState<DegreeOption[]>([]);
    const [minors, setMinors] = useState<DegreeOption[]>([]);
    const [isLoadingDegrees, setIsLoadingDegrees] = useState(true);

    useEffect(() => {
        const fetchDegrees = async () => {
            try {
                const response = await api.get('/degree/available');
                const data: DegreeOption[] = response.data;

                console.log("Fetched Degrees:", data.length);

                setMajors(data.filter(d => d.type === 'MAJOR'));
                setMinors(data.filter(d => d.type === 'MINOR'));
            } catch (error) {
                console.error("Failed to fetch degree list", error);
            } finally {
                setIsLoadingDegrees(false);
            }
        };

        fetchDegrees();
    }, []);

    const getDegreeName = (id: string) => {
        const degree = [...majors, ...minors].find(d => d.id === id);
        return degree ? degree.name : id;
    };

    return (
        <DegreeContext.Provider value={{ majors, minors, getDegreeName, isLoadingDegrees }}>
            {children}
        </DegreeContext.Provider>
    );
};

export const useDegrees = () => {
    const context = useContext(DegreeContext);
    if (!context) throw new Error('useDegrees must be used within a DegreeProvider');
    return context;
};