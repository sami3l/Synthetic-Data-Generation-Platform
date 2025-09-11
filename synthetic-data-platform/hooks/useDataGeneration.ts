// hooks/useDataGeneration.ts
import { useState } from 'react';
import { authService } from '@/services/api/authService';

export const useDataGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateData = async (requestId: number) => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await authService.generateData(requestId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateData, isGenerating, error };
};