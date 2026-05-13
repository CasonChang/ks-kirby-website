"use client";

import { motion } from "framer-motion";
import { getMilestones, type Milestone } from "@/lib/data";

const stagger = {
  animate: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function MilestonesPage() {
  const milestones = getMilestones();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <header className="text-center mb-16">
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-kirby-pink-main mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          🏆 里程碑
        </motion.h1>
        <motion.p
          className="text-kirby-pink-dark/60 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          記錄我們一起成長的每一個瞬間
        </motion.p>
      </header>

      <motion.div
        className="space-y-6"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        {milestones.map((m) => (
          <motion.div
            key={m.id}
            variants={fadeUp}
            whileHover={{ x: 4 }}
            className="relative pl-8 border-l-4 border-kirby-pink-light bg-kirby-white/60 backdrop-blur-sm rounded-r-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Timeline Dot */}
            <motion.div
              className="absolute -left-[10px] top-8 w-4 h-4 rounded-full bg-kirby-pink-main shadow-[0_0_8px_rgba(255,143,171,0.6)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-kirby-pink-dark">
                {m.title}
              </h2>
              <span className="text-sm font-medium text-kirby-pink-dark/50 bg-kirby-pink-light/20 px-3 py-1 rounded-full w-fit">
                {m.date}
              </span>
            </div>

            <p className="text-kirby-pink-dark/80 text-lg leading-relaxed mb-4">
              {m.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {m.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-semibold text-kirby-pink-main bg-kirby-pink-main/10 px-2 py-1 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      <motion.div
        className="mt-16 text-center py-12 border-2 border-dashed border-kirby-pink-light rounded-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-kirby-pink-dark/40 italic">
          更多精彩故事，敬請期待... 🩷
        </p>
      </motion.div>
    </div>
  );
}