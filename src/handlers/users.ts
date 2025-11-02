import { Router } from 'express';
import { UserService } from '../services/user.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const userService = new UserService();

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const profile = await userService.getProfile(req.user!.id);
        res.json(profile);
    } catch (error) {
        next(error);
    }
});

// Update profile
router.put('/me', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const profile = await userService.updateProfile(req.user!.id, req.body);
        res.json(profile);
    } catch (error) {
        next(error);
    }
});

// Delete account
router.delete('/me', authenticate, async (req: AuthRequest, res, next) => {
    try {
        await userService.deleteAccount(req.user!.id);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Update preferences
router.put('/me/preferences', authenticate, async (req: AuthRequest, res, next) => {
    try {
        await userService.updatePreferences(req.user!.id, req.body);
        res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
