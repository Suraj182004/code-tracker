import { Router, Request, Response } from 'express';
import { supabaseAnon } from '../config/supabase';
import prisma from '../config/prisma';
import { authenticateUser } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// Register user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabaseAnon.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'User registered successfully in Supabase. Please create a profile.',
      user: data.user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      message: 'Login successful',
      session: data.session,
      user: data.user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required'
      });
    }

    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      message: 'Token refreshed successfully',
      session: data.session
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const profile = await prisma.profile.findUnique({
      where: {
        id: userId,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { displayName, timezone, settings, privacySettings } = req.body;

    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (settings !== undefined) updateData.settings = settings;
    if (privacySettings !== undefined) updateData.privacySettings = privacySettings;

    const profile = await prisma.profile.update({
      where: {
        id: userId,
      },
      data: updateData,
    });

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user profile (for after client-side signUp)
router.post('/profile', authenticateUser, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { username, displayName } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const profile = await prisma.profile.create({
            data: {
                id: userId,
                username,
                displayName: displayName || username,
            },
        });

        res.status(201).json({
            message: 'Profile created successfully',
            profile,
        });
    } catch (error) {
        console.error('Profile creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (mainly for cleanup)
router.post('/logout', authenticateUser, async (req: Request, res: Response) => {
  try {
    // In a JWT-based system, logout is mainly client-side
    // But we can perform server-side cleanup here if needed
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 