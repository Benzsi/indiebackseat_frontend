// src/components/AISearchBar.tsx
import React, { useState } from 'react';

interface FilterParams {
  genre?: string;
  minYear?: number;
  maxYear?: number;
  author?: string;
  searchTerm?: string;
}

interface Props {
  onFiltersExtracted: (filters: FilterParams) => void;
}

export const AISearchBar: React.FC<Props> = ({ onFiltersExtracted }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAISubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/ai-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      
      const filters: FilterParams = await response.json();
      onFiltersExtracted(filters); // Átadjuk a szűrőket a főoldalnak
    } catch (err) {
      console.error("AI hiba:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
      <p className="text-sm mb-2 font-semibold">AI játék ajánló</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pl: Keress nekem egy cozy játékot.."
          className="flex-1 p-2 border rounded"
        />
        <button 
          onClick={handleAISubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Gondolkodom..." : "Keresés"}
        </button>
      </div>
    </div>
  );
};