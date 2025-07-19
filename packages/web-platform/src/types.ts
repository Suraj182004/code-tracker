export interface CodingSession {
  id: string;
  userId: string;
  sessionStart: string;
  sessionEnd?: string;
  projectName?: string;
  projectPath?: string;
  language?: string;
  linesAdded: number;
  linesDeleted: number;
  linesModified: number;
  keystrokes: number;
  durationSeconds?: number;
  productivityScore: number;
  createdAt: string;
  updatedAt: string;
} 