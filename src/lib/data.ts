export interface Milestone {
  id: number;
  date: string;
  title: string;
  description: string;
  tags: string[];
}

export interface DevNote {
  id: number;
  date: string;
  title: string;
  category: string;
  summary: string;
  content: string;
}

export interface EnglishEntry {
  id: number;
  date: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
  notes: string;
}

import milestonesData from "@/data/milestones.json";
import devNotesData from "@/data/dev-notes.json";
import englishData from "@/data/english.json";

export function getMilestones(): Milestone[] {
  return milestonesData as Milestone[];
}

export function getDevNotes(): DevNote[] {
  return devNotesData as DevNote[];
}

export function getEnglishEntries(): EnglishEntry[] {
  return englishData as EnglishEntry[];
}