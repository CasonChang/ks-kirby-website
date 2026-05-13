"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getEnglishEntries, type EnglishEntry } from "@/lib/data";
import SearchBar from "@/components/SearchBar";

const categories = ["all", "noun", "adjective", "verb"] as const;

const stagger = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export default function EnglishPage() {
  const entries = getEnglishEntries();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        !search ||
        e.word.toLowerCase().includes(search.toLowerCase()) ||
        e.meaning.includes(search) ||
        e.example.toLowerCase().includes(search.toLowerCase()) ||
        e.notes.includes(search);
      const matchCat = activeCategory === "all" || e.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [entries, search, activeCategory]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <header className="text-center mb-10">
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-kirby-pink-main mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🇬🇧 英文學習
        </motion.h1>
        <motion.p
          className="text-kirby-pink-dark/60 text-lg mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          Let&apos;s learn English together!
        </motion.p>

        <div className="space-y-4">
          <SearchBar
            placeholder="搜尋單字、意思或例句..."
            onSearch={setSearch}
          />
          <div className="flex justify-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-kirby-pink-main text-white shadow-md"
                    : "bg-kirby-white/60 text-kirby-pink-dark/60 hover:bg-kirby-pink-light/30"
                }`}
              >
                {cat === "all" ? "全部" : cat}
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      {/* Vocabulary Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        layout
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((e) => (
              <motion.div
                key={e.id}
                layout
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(255,143,171,0.15)" }}
                className="bg-kirby-white/60 backdrop-blur-sm rounded-2xl p-5 border border-kirby-pink-light/30 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-2xl font-bold text-kirby-pink-main">
                    {e.word}
                  </h2>
                  <span className="text-xs font-medium text-kirby-pink-dark/50 bg-kirby-pink-light/20 px-2 py-0.5 rounded">
                    {e.category}
                  </span>
                </div>
                <p className="text-kirby-pink-dark font-medium mb-2">
                  意思：{e.meaning}
                </p>
                <p className="text-kirby-pink-dark/60 text-sm italic mb-3 pl-3 border-l-2 border-kirby-pink-light/50">
                  {e.example}
                </p>
                <p className="text-kirby-pink-dark/40 text-xs">{e.notes}</p>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="col-span-full text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-kirby-pink-dark/40 text-lg">
                🔍 找不到符合的單字...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}