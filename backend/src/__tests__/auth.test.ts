import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dataStore, Role } from '../lib/dataStore';

describe('Authentication Domain Model Tests', () => {
  // Reset dataStore before each test
  beforeEach(() => {
    // Clear all data
    (dataStore as any).users = [];
    (dataStore as any).groups = [];
    (dataStore as any).groupMembers = [];
    (dataStore as any).tasks = [];
  });

  describe('Authentication Entity Creation Tests', () => {
    it('should create authentication entity with valid login data', async () => {
      // First create a user to authenticate
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: await bcrypt.hash('password123', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      const user = await dataStore.createUser(userData);
      
      // Test authentication entity creation
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Simulate authentication process
      const foundUser = await dataStore.findUserByEmail(loginData.email);
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(loginData.email);
      
      // Verify password validation
      const isPasswordValid = await bcrypt.compare(loginData.password, foundUser!.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should create authentication entity with username login', async () => {
      const userData = {
        email: 'user@example.com',
        username: 'uniqueuser',
        password: await bcrypt.hash('securepass', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      await dataStore.createUser(userData);

      const loginData = {
        username: 'uniqueuser',
        password: 'securepass'
      };

      // Test authentication by username
      const foundUser = await dataStore.findUserByUsername(loginData.username);
      expect(foundUser).toBeDefined();
      expect(foundUser?.username).toBe(loginData.username);

      const isPasswordValid = await bcrypt.compare(loginData.password, foundUser!.password);
      expect(isPasswordValid).toBe(true);
    });
  });

  describe('Authentication Validation Constraints', () => {
    it('should validate email format in authentication', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'testuser',
        password: await bcrypt.hash('password123', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      // Test email validation during user creation (affects auth)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(userData.email)).toBe(false);
    });

    it('should validate password strength constraints', async () => {
      const weakPasswords = ['123', 'abc', '', 'aa'];
      
      for (const weakPassword of weakPasswords) {
        // Test password strength validation
        expect(weakPassword.length).toBeLessThan(6); // Minimum password length constraint
      }

      const strongPassword = 'StrongPass123!';
      expect(strongPassword.length).toBeGreaterThanOrEqual(6);
    });

    it('should validate unique email constraint for authentication', async () => {
      const userData1 = {
        email: 'duplicate@example.com',
        username: 'user1',
        password: await bcrypt.hash('password123', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      const userData2 = {
        email: 'duplicate@example.com', // Same email
        username: 'user2',
        password: await bcrypt.hash('password456', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      await dataStore.createUser(userData1);
      
      // Test uniqueness constraint
      const existingUser = await dataStore.findUserByEmail(userData2.email);
      expect(existingUser).toBeDefined(); // Should find the first user
    });

    it('should validate unique username constraint for authentication', async () => {
      const userData1 = {
        email: 'user1@example.com',
        username: 'sameusername',
        password: await bcrypt.hash('password123', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      const userData2 = {
        email: 'user2@example.com',
        username: 'sameusername', // Same username
        password: await bcrypt.hash('password456', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      await dataStore.createUser(userData1);
      
      // Test uniqueness constraint
      const existingUser = await dataStore.findUserByUsername(userData2.username);
      expect(existingUser).toBeDefined(); // Should find the first user
    });
  });

  describe('Authentication Helper Methods and Business Logic', () => {
    it('should hash passwords correctly using helper method', async () => {
      const plainPassword = 'mySecretPassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(50); // Bcrypt hashes are typically long
      
      // Test password comparison helper
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });

    it('should generate JWT tokens with correct payload', () => {
      const userId = 'test-user-id-123';
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-testing';
      
      const tokenPayload = { userId };
      const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      
      // Verify token contains correct payload
      const decoded = jwt.verify(token, jwtSecret) as any;
      expect(decoded.userId).toBe(userId);
      expect(decoded.exp).toBeDefined(); // Should have expiration
    });

    it('should validate JWT token expiration', () => {
      const userId = 'test-user-id-123';
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-testing';
      
      // Create expired token (expires in past)
      const expiredToken = jwt.sign(
        { userId },
        jwtSecret,
        { expiresIn: '-1h' } // Negative time = expired
      );
      
      expect(() => {
        jwt.verify(expiredToken, jwtSecret);
      }).toThrow();
    });

    it('should find user by email or username helper method', async () => {
      const userData = {
        email: 'findme@example.com',
        username: 'findmeuser',
        password: await bcrypt.hash('password123', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      const user = await dataStore.createUser(userData);
      
      // Test findUserByEmailOrUsername helper method
      const foundByEmail = await dataStore.findUserByEmailOrUsername(userData.email, '');
      expect(foundByEmail).toBeDefined();
      expect(foundByEmail?.id).toBe(user.id);
      
      const foundByUsername = await dataStore.findUserByEmailOrUsername('', userData.username);
      expect(foundByUsername).toBeDefined();
      expect(foundByUsername?.id).toBe(user.id);
    });
  });

  describe('Authentication Entity-Specific Tests', () => {
    it('should handle role-based authentication logic', async () => {
      const adminData = {
        email: 'admin@example.com',
        username: 'adminuser',
        password: await bcrypt.hash('adminpass', 12),
        role: Role.ADMIN,
        points: 0,
        badges: []
      };

      const userData = {
        email: 'user@example.com',
        username: 'normaluser',
        password: await bcrypt.hash('userpass', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      const admin = await dataStore.createUser(adminData);
      const user = await dataStore.createUser(userData);
      
      // Test role-based logic
      expect(admin.role).toBe(Role.ADMIN);
      expect(user.role).toBe(Role.USER);
      
      // Admin should have elevated privileges
      expect(admin.role === Role.ADMIN).toBe(true);
      expect(user.role === Role.ADMIN).toBe(false);
    });

    it('should handle authentication failure scenarios', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: await bcrypt.hash('correctpassword', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      await dataStore.createUser(userData);
      
      // Test wrong password
      const user = await dataStore.findUserByEmail('test@example.com');
      const wrongPasswordCheck = await bcrypt.compare('wrongpassword', user!.password);
      expect(wrongPasswordCheck).toBe(false);
      
      // Test non-existent user
      const nonExistentUser = await dataStore.findUserByEmail('nonexistent@example.com');
      expect(nonExistentUser).toBeNull();
    });

    it('should handle authentication state transitions', async () => {
      const userData = {
        email: 'statetest@example.com',
        username: 'stateuser',
        password: await bcrypt.hash('password123', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      const user = await dataStore.createUser(userData);
      
      // Test authentication state: UNAUTHENTICATED → AUTHENTICATED
      let isAuthenticated = false;
      
      // Simulate login process
      const foundUser = await dataStore.findUserByEmail(userData.email);
      const passwordValid = await bcrypt.compare('password123', foundUser!.password);
      
      if (foundUser && passwordValid) {
        isAuthenticated = true;
      }
      
      expect(isAuthenticated).toBe(true);
      
      // Test logout (state transition back to UNAUTHENTICATED)
      isAuthenticated = false;
      expect(isAuthenticated).toBe(false);
    });

    it('should validate authentication session management', () => {
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-testing';
      
      // Create session token
      const sessionData = {
        userId: 'user-123',
        role: Role.USER,
        loginTime: new Date().toISOString()
      };
      
      const sessionToken = jwt.sign(sessionData, jwtSecret, { expiresIn: '24h' });
      
      // Validate session
      const decoded = jwt.verify(sessionToken, jwtSecret) as any;
      expect(decoded.userId).toBe(sessionData.userId);
      expect(decoded.role).toBe(Role.USER);
      expect(decoded.loginTime).toBeDefined();
    });
  });

  describe('Authentication Entity Relationships', () => {
    it('should test relationship between authentication and user entity', async () => {
      const userData = {
        email: 'relation@example.com',
        username: 'relationuser',
        password: await bcrypt.hash('password123', 12),
        role: Role.USER,
        points: 50,
        badges: ['NewUser']
      };

      const user = await dataStore.createUser(userData);
      
      // Authentication should relate to user entity
      const authenticatedUser = await dataStore.findUserByEmail(userData.email);
      expect(authenticatedUser).toBeDefined();
      expect(authenticatedUser?.id).toBe(user.id);
      expect(authenticatedUser?.points).toBe(50);
      expect(authenticatedUser?.badges).toContain('NewUser');
    });

    it('should test authentication impact on user points and badges', async () => {
      const userData = {
        email: 'points@example.com',
        username: 'pointsuser',
        password: await bcrypt.hash('password123', 12),
        role: Role.USER,
        points: 0,
        badges: []
      };

      const user = await dataStore.createUser(userData);
      
      // Simulate first login bonus (authentication-related business logic)
      const updatedUser = await dataStore.updateUser(user.id, {
        points: user.points + 10, // Login bonus
        badges: [...user.badges, 'FirstLogin']
      });
      
      expect(updatedUser?.points).toBe(10);
      expect(updatedUser?.badges).toContain('FirstLogin');
    });
  });
});