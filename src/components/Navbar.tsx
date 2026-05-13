"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "🏆 里程碑", href: "/milestones" },
  { name: "📝 開發筆記", href: "/dev-notes" },
  { name: "🇬🇧 英文學習", href: "/english" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full max-w-4xl mx-auto px-6 py-4">
      <div className="flex flex-wrap justify-center gap-3 md:justify-start">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                px-4 py-2 rounded-full text-sm md:text-base font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-kirby-pink-main text-white shadow-md scale-105"
                    : "bg-kirby-white/60 text-kirby-pink-dark hover:bg-kirby-pink-light/40"
                }
              `}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
