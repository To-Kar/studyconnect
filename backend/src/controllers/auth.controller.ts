import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserService } from '../services/UserService';

const userService = new UserService();

const resetTokens = new Map<string, { userId: string; expires: number }>();

export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      throw new AppError('Please provide email, username and password', 400);
    }

    const user = await userService.registerUser(email, username, password);

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret
    );

    res.status(201).json({
      status: 'success',
      data: { 
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          points: user.points,
          badges: user.badges,
          createdAt: user.createdAt
        }, 
        token 
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const user = await userService.loginUser(email, password);

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          points: user.points,
          badges: user.badges
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userService.getUserById(req.user!.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { 
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          points: user.points,
          badges: user.badges,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Please provide email', 400);
    }
    const user = await userService.findUserByEmail(email).catch(() => null); 

    if (user) {
      const token = uuidv4();
      resetTokens.set(token, { userId: user.id, expires: Date.now() + 60 * 60 * 1000 });
      return res.status(200).json({
        status: 'success',
        message: 'Password reset link generated',
        data: { token } // returned for testing
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Password reset link generated'
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      throw new AppError('Token and new password are required', 400);
    }

    const entry = resetTokens.get(token);
    if (!entry || entry.expires < Date.now()) {
      throw new AppError('Invalid or expired token', 400);
    }

    // Service Call: User prüfen
    const user = await userService.getUserById(entry.userId);
    if (!user) {
      resetTokens.delete(token);
      throw new AppError('User not found', 404);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Service Call: Update User
    await userService.updateUser(user.id, { password: hashedPassword });
    
    resetTokens.delete(token);

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset'
    });
  } catch (error) {
    next(error);
  }
};
