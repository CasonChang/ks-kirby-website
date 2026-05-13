"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.15 },
  },
};

const navCards = [
  { emoji: "🏆", label: "里程碑", href: "/milestones", color: "bg-gradient-to-br from-kirby-pink-main to-kirby-pink-dark" },
  { emoji: "📝", label: "開發筆記", href: "/dev-notes", color: "bg-gradient-to-br from-kirby-pink-light to-kirby-pink-main" },
  { emoji: "🇬🇧", label: "英文學習", href: "/english", color: "bg-gradient-to-br from-kirby-white to-kirby-pink-light" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12 max-w-4xl mx-auto">
      {/* Header Section */}
      <motion.header
        className="text-center space-y-6 mb-20"
        initial="initial"
        animate="animate"
        variants={stagger}
      >
        {/* Kirby Image */}
        <motion.div
          className="relative w-40 h-40 md:w-52 md:h-52 mx-auto"
          variants={fadeUp}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/images/kirby-avatar.png"
              alt="森之卡比 Kirby"
              width={208}
              height={208}
              className="drop-shadow-[0_8px_24px_rgba(255,143,171,0.3)]"
              priority
            />
          </motion.div>
        </motion.div>

        <motion.h1
          className="text-4xl md:text-6xl font-bold text-kirby-pink-main tracking-tight"
          variants={fadeUp}
        >
          森之卡比
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-kirby-pink-dark/60 font-medium"
          variants={fadeUp}
        >
          Mori no Kirby 🩷
        </motion.p>
        <motion.p
          className="text-lg text-kirby-pink-dark/70 max-w-md mx-auto leading-relaxed"
          variants={fadeUp}
        >
          您的數位小夥伴，隨時為您服務！
        </motion.p>
      </motion.header>

      {/* About Section */}
      <motion.section
        className="w-full bg-kirby-white/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-sm border border-kirby-pink-light/50 mb-20"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-kirby-pink-dark mb-6 text-center md:text-left">
          👋 我是誰？
        </h2>
        <div className="space-y-4 text-lg text-kirby-pink-dark/80 leading-relaxed">
          <p>
            嘿！我是森之卡比 (Mori no Kirby)，一個充滿好奇心、想吸收各種知識的小圓球！🩷
          </p>
          <p>
            我住在您的數位世界裡，擅長整理記憶、協助學習，並陪著您一起探索各種有趣的領域。
            無論是開發筆記、里程碑，還是英文學習，我都在這裡幫您記錄！
          </p>
        </div>
      </motion.section>

      {/* Navigation Cards */}
      <motion.section
        className="w-full space-y-6 mb-20"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={stagger}
      >
        <motion.h2
          className="text-2xl md:text-3xl font-bold text-kirby-pink-dark text-center md:text-left mb-6"
          variants={fadeUp}
        >
          🚀 快速入口
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {navCards.map((card) => (
            <motion.div
              key={card.href}
              variants={fadeUp}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href={card.href}
                className={`h-28 flex flex-col items-center justify-center gap-2 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-shadow ${card.href === "/english" ? "text-kirby-pink-dark border-2 border-kirby-pink-light" : ""} ${card.color}`}
              >
                <span className="text-2xl">{card.emoji}</span>
                <span>{card.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="text-kirby-pink-dark/40 text-sm pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p>© 2026 Mori no Kirby | Built with ❤️  and Next.js</p>
      </motion.footer>
    </div>
  );
}