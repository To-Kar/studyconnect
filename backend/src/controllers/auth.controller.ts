import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { dataStore, Role } from '../lib/databaseService';

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

    // Check if user exists
    const existingUser = await dataStore.findUserByEmailOrUsername(email, username);

    if (existingUser) {
      throw new AppError('User with this email or username already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await dataStore.createUser({
      email,
      username,
      password: hashedPassword,
      role: Role.USER,
      points: 0,
      badges: []
    });

    // Generate token
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

    // Find user
    const user = await dataStore.findUserByEmail(email);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

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
    const user = await dataStore.findUserById(req.user!.id);

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
