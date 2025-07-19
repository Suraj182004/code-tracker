import express, { Request, Response } from 'express';
import prisma from '../config/prisma';
import { CodingSession } from '@prisma/client';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Route to handle incoming tracking data from the VS Code extension
router.post('/sync', authenticateUser, async (req: Request, res: Response) => {
  const sessionData = req.body;
  const userId = req.user!.id;

  console.log('Received session data from extension:', JSON.stringify(sessionData, null, 2));

  try {
    // Transform the session data to match database schema
    const dbSessionData = {
      userId: userId,
      sessionStart: new Date(sessionData.startTime), // Extension sends startTime
      sessionEnd: sessionData.endTime ? new Date(sessionData.endTime) : null, // Extension sends endTime
      projectName: sessionData.projectName || 'Unknown Project',
      projectPath: sessionData.projectPath || '',
      language: sessionData.language || 'unknown',
      linesAdded: sessionData.linesAdded || 0,
      linesDeleted: sessionData.linesDeleted || 0,
      linesModified: sessionData.linesModified || 0,
      keystrokes: sessionData.keystrokes || 0,
      productivityScore: sessionData.productivity || 0,
      durationSeconds: sessionData.duration ? Math.floor(sessionData.duration / 1000) : 0,
      metadata: {
        files: sessionData.files || [],
        gitBranch: sessionData.gitBranch || null,
        gitCommits: sessionData.gitCommits || 0
      }
    };

    console.log('Transformed data for database:', JSON.stringify(dbSessionData, null, 2));

    const newSession = await prisma.codingSession.create({
      data: dbSessionData,
    });
    
    console.log('✅ Session saved successfully with ID:', newSession.id);
    res.status(201).json({ message: 'Session saved successfully', sessionId: newSession.id });
  } catch (error) {
    console.error('❌ Error saving session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Error saving session', error: errorMessage });
  }
});

router.get('/sync', authenticateUser, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const sessions = await prisma.codingSession.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                sessionStart: 'desc'
            }
        });
        res.status(200).json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ message: 'Error fetching sessions' });
    }
});

export default router; 