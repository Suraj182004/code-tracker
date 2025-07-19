import { Router, Request, Response } from 'express';
import prisma from '../config/prisma';
import { authenticateUser } from '../middleware/auth';
import { dataIngestionRateLimit } from '../middleware/rateLimiter';

const router = Router();

// Apply authentication and rate limiting to all session routes
router.use(authenticateUser);
router.use(dataIngestionRateLimit);

// Submit coding session data
router.post('/coding', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      sessionStart,
      sessionEnd,
      projectName,
      projectPath,
      workspaceName,
      language,
      framework,
      editorTheme,
      linesAdded,
      linesDeleted,
      linesModified,
      keystrokes,
      charactersTyped,
      filesModified,
      gitCommits,
      breakpointsHit,
      productivityScore,
      metadata
    } = req.body;

    // Validate required fields
    if (!sessionStart) {
      return res.status(400).json({
        error: 'sessionStart is required'
      });
    }

    // Create session with Prisma
    const session = await prisma.codingSession.create({
      data: {
        userId,
        sessionStart: new Date(sessionStart),
        sessionEnd: sessionEnd ? new Date(sessionEnd) : null,
        projectName,
        projectPath,
        workspaceName,
        language,
        framework,
        editorTheme,
        linesAdded: linesAdded || 0,
        linesDeleted: linesDeleted || 0,
        linesModified: linesModified || 0,
        keystrokes: keystrokes || 0,
        charactersTyped: charactersTyped || 0,
        filesModified: filesModified || 0,
        gitCommits: gitCommits || 0,
        breakpointsHit: breakpointsHit || 0,
        productivityScore: productivityScore || 0,
        metadata: metadata || {}
      },
    });

    res.status(201).json({
      message: 'Coding session recorded successfully',
      session
    });
  } catch (error) {
    console.error('Coding session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit website session data
router.post('/website', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      domain,
      urlCategory,
      sessionStart,
      sessionEnd,
      idleTimeSeconds,
      tabSwitches,
      pageViews,
      productivityScore,
      focusScore
    } = req.body;

    // Validate required fields
    if (!domain || !sessionStart) {
      return res.status(400).json({
        error: 'domain and sessionStart are required'
      });
    }

    // Create session with Prisma
    const session = await prisma.websiteSession.create({
      data: {
        userId,
        domain,
        urlCategory: urlCategory || 'uncategorized',
        sessionStart: new Date(sessionStart),
        sessionEnd: sessionEnd ? new Date(sessionEnd) : null,
        idleTimeSeconds: idleTimeSeconds || 0,
        tabSwitches: tabSwitches || 0,
        pageViews: pageViews || 1,
        productivityScore: productivityScore,
        focusScore: focusScore || 0
      },
    });

    res.status(201).json({
      message: 'Website session recorded successfully',
      session
    });
  } catch (error) {
    console.error('Website session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch submit multiple sessions
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { codingSessions = [], websiteSessions = [] } = req.body;

    if (!Array.isArray(codingSessions) || !Array.isArray(websiteSessions)) {
      return res.status(400).json({
        error: 'codingSessions and websiteSessions must be arrays'
      });
    }

    const results: {
      codingSessions: any[];
      websiteSessions: any[];
      errors: string[];
    } = {
      codingSessions: [],
      websiteSessions: [],
      errors: []
    };

    // Process coding sessions
    if (codingSessions.length > 0) {
      try {
        const codingData = codingSessions.map(session => ({
          userId,
          sessionStart: new Date(session.sessionStart),
          sessionEnd: session.sessionEnd ? new Date(session.sessionEnd) : null,
          projectName: session.projectName,
          projectPath: session.projectPath,
          workspaceName: session.workspaceName,
          language: session.language,
          framework: session.framework,
          editorTheme: session.editorTheme,
          linesAdded: session.linesAdded || 0,
          linesDeleted: session.linesDeleted || 0,
          linesModified: session.linesModified || 0,
          keystrokes: session.keystrokes || 0,
          charactersTyped: session.charactersTyped || 0,
          filesModified: session.filesModified || 0,
          gitCommits: session.gitCommits || 0,
          breakpointsHit: session.breakpointsHit || 0,
          productivityScore: session.productivityScore || 0,
          metadata: session.metadata || {}
        }));

        // Use createMany for batch insert
        await prisma.codingSession.createMany({
          data: codingData,
          skipDuplicates: true
        });

        // Get the created sessions for response
        const createdSessions = await prisma.codingSession.findMany({
          where: {
            userId,
            sessionStart: {
              in: codingData.map(s => s.sessionStart)
            }
          },
          orderBy: {
            sessionStart: 'desc'
          },
          take: codingData.length
        });

        results.codingSessions = createdSessions;
      } catch (error) {
        results.errors.push(`Coding sessions: ${error}`);
      }
    }

    // Process website sessions
    if (websiteSessions.length > 0) {
      try {
        const websiteData = websiteSessions.map(session => ({
          userId,
          domain: session.domain,
          urlCategory: session.urlCategory || 'uncategorized',
          sessionStart: new Date(session.sessionStart),
          sessionEnd: session.sessionEnd ? new Date(session.sessionEnd) : null,
          idleTimeSeconds: session.idleTimeSeconds || 0,
          tabSwitches: session.tabSwitches || 0,
          pageViews: session.pageViews || 1,
          productivityScore: session.productivityScore,
          focusScore: session.focusScore || 0
        }));

        // Use createMany for batch insert
        await prisma.websiteSession.createMany({
          data: websiteData,
          skipDuplicates: true
        });

        // Get the created sessions for response
        const createdSessions = await prisma.websiteSession.findMany({
          where: {
            userId,
            sessionStart: {
              in: websiteData.map(s => s.sessionStart)
            }
          },
          orderBy: {
            sessionStart: 'desc'
          },
          take: websiteData.length
        });

        results.websiteSessions = createdSessions;
      } catch (error) {
        results.errors.push(`Website sessions: ${error}`);
      }
    }

    const status = results.errors.length > 0 ? 207 : 201; // 207 Multi-Status if partial errors

    res.status(status).json({
      message: 'Batch session upload completed',
      results
    });
  } catch (error) {
    console.error('Batch session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's recent sessions
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 50, type = 'all' } = req.query;

    const results: any = {};

    if (type === 'all' || type === 'coding') {
      const codingSessions = await prisma.codingSession.findMany({
        where: {
          userId
        },
        orderBy: {
          sessionStart: 'desc'
        },
        take: Number(limit)
      });

      results.codingSessions = codingSessions;
    }

    if (type === 'all' || type === 'website') {
      const websiteSessions = await prisma.websiteSession.findMany({
        where: {
          userId
        },
        orderBy: {
          sessionStart: 'desc'
        },
        take: Number(limit)
      });

      results.websiteSessions = websiteSessions;
    }

    res.json(results);
  } catch (error) {
    console.error('Recent sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 