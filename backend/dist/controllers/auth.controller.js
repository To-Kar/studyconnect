"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("../middleware/error.middleware");
const dataStore_1 = require("../lib/dataStore");
const register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        if (!email || !username || !password) {
            throw new error_middleware_1.AppError('Please provide email, username and password', 400);
        }
        // Check if user exists
        const existingUser = await dataStore_1.dataStore.findUserByEmailOrUsername(email, username);
        if (existingUser) {
            throw new error_middleware_1.AppError('User with this email or username already exists', 409);
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const user = await dataStore_1.dataStore.createUser({
            email,
            username,
            password: hashedPassword,
            role: dataStore_1.Role.USER,
            points: 0,
            badges: []
        });
        // Generate token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback-secret');
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
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new error_middleware_1.AppError('Please provide email and password', 400);
        }
        // Find user
        const user = await dataStore_1.dataStore.findUserByEmail(email);
        if (!user) {
            throw new error_middleware_1.AppError('Invalid email or password', 401);
        }
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new error_middleware_1.AppError('Invalid email or password', 401);
        }
        // Generate token
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'fallback-secret');
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
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getProfile = async (req, res, next) => {
    try {
        const user = await dataStore_1.dataStore.findUserById(req.user.id);
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404);
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
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
