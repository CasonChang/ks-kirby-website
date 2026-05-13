"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

export default function SearchBar({ placeholder = "搜尋...", onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <motion.input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-3 bg-kirby-white/80 backdrop-blur-sm border border-kirby-pink-light rounded-full text-kirby-pink-dark placeholder-kirby-pink-dark/40 focus:outline-none focus:ring-2 focus:ring-kirby-pink-main/40 transition-all shadow-sm"
          whileFocus={{ scale: 1.02, boxShadow: "0 0 20px rgba(255,143,171,0.3)" }}
        />
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-kirby-pink-main/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        {/* Clear Button */}
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-kirby-pink-light/40 hover:bg-kirby-pink-main/40 text-kirby-pink-dark transition-colors"
            >
              ✕
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}