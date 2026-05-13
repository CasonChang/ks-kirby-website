"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDevNotes, type DevNote } from "@/lib/data";
import SearchBar from "@/components/SearchBar";

const categories = ["all", "nextjs", "css", "animation"] as const;

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

export default function DevNotesPage() {
  const notes = getDevNotes();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.summary.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === "all" || n.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [notes, search, activeCategory]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <header className="text-center mb-10">
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-kirby-pink-main mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          📝 開發筆記
        </motion.h1>
        <motion.p
          className="text-kirby-pink-dark/60 text-lg mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          記錄寫程式時的點點滴滴
        </motion.p>

        {/* Search + Filter */}
        <div className="space-y-4">
          <SearchBar
            placeholder="搜尋筆記..."
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
                {cat === "all" ? "全部" : `#${cat}`}
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      {/* Notes Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        layout
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((n) => (
              <motion.div
                key={n.id}
                layout
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(255,143,171,0.15)" }}
                className="bg-kirby-white/60 backdrop-blur-sm rounded-2xl p-5 border border-kirby-pink-light/30 shadow-sm cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-kirby-pink-main bg-kirby-pink-main/10 px-2 py-0.5 rounded">
                    #{n.category}
                  </span>
                  <span className="text-xs text-kirby-pink-dark/40">{n.date}</span>
                </div>
                <h3 className="text-lg font-bold text-kirby-pink-dark mb-2">{n.title}</h3>
                <p className="text-kirby-pink-dark/70 text-sm leading-relaxed mb-3">{n.summary}</p>
                <motion.p
                  className="text-kirby-pink-dark/50 text-xs leading-relaxed line-clamp-3"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                >
                  {n.content}
                </motion.p>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="col-span-full text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-kirby-pink-dark/40 text-lg">
                🔍 找不到符合的筆記...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}