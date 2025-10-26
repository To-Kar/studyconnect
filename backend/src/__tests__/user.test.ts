import { dataStore, Role, User } from '../lib/dataStore';

describe('User Entity Tests', () => {
  // Reset dataStore before each test
  beforeEach(() => {
    // Clear all data
    (dataStore as any).users = [];
    (dataStore as any).groups = [];
    (dataStore as any).groupMembers = [];
    (dataStore as any).tasks = [];
  });

  describe('User Creation Tests', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'alice@example.com',
        username: 'alice',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 0,
        badges: []
      };

      const user = await dataStore.createUser(userData);

      expect(user).toMatchObject({
        email: 'alice@example.com',
        username: 'alice',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 0,
        badges: []
      });
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create admin user with admin role', async () => {
      const userData = {
        email: 'admin@example.com',
        username: 'admin',
        password: 'hashedpassword123',
        role: Role.ADMIN,
        points: 100,
        badges: ['Admin']
      };

      const user = await dataStore.createUser(userData);

      expect(user.role).toBe(Role.ADMIN);
      expect(user.points).toBe(100);
      expect(user.badges).toContain('Admin');
    });

    it('should create user with default values', async () => {
      const userData = {
        email: 'default@example.com',
        username: 'defaultuser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 0,
        badges: []
      };

      const user = await dataStore.createUser(userData);

      expect(user.points).toBe(0);
      expect(user.badges).toEqual([]);
      expect(user.role).toBe(Role.USER);
    });
  });

  describe('User Validation Tests', () => {
    it('should handle users with different badge arrays', async () => {
      const userWithBadges = await dataStore.createUser({
        email: 'badged@example.com',
        username: 'badgeduser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 50,
        badges: ['Early Bird', 'Task Master']
      });

      expect(userWithBadges.badges).toHaveLength(2);
      expect(userWithBadges.badges).toContain('Early Bird');
      expect(userWithBadges.badges).toContain('Task Master');
    });

    it('should handle users with different point values', async () => {
      const highPointUser = await dataStore.createUser({
        email: 'points@example.com',
        username: 'pointsuser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 1000,
        badges: []
      });

      expect(highPointUser.points).toBe(1000);
    });
  });

  describe('User Retrieval Tests', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await dataStore.createUser({
        email: 'retrieve@example.com',
        username: 'retrieveuser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 25,
        badges: ['Starter']
      });
    });

    it('should find user by id', async () => {
      const foundUser = await dataStore.findUserById(testUser.id);

      expect(foundUser).not.toBeNull();
      expect(foundUser!.id).toBe(testUser.id);
      expect(foundUser!.email).toBe('retrieve@example.com');
    });

    it('should find user by email', async () => {
      const foundUser = await dataStore.findUserByEmail('retrieve@example.com');

      expect(foundUser).not.toBeNull();
      expect(foundUser!.id).toBe(testUser.id);
      expect(foundUser!.username).toBe('retrieveuser');
    });

    it('should find user by username', async () => {
      const foundUser = await dataStore.findUserByUsername('retrieveuser');

      expect(foundUser).not.toBeNull();
      expect(foundUser!.id).toBe(testUser.id);
      expect(foundUser!.email).toBe('retrieve@example.com');
    });

    it('should return null for non-existent user id', async () => {
      const foundUser = await dataStore.findUserById('non-existent-id');
      expect(foundUser).toBeNull();
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await dataStore.findUserByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });

    it('should find user by email or username', async () => {
      const foundByEmail = await dataStore.findUserByEmailOrUsername('retrieve@example.com', 'wrongusername');
      const foundByUsername = await dataStore.findUserByEmailOrUsername('wrong@email.com', 'retrieveuser');

      expect(foundByEmail).not.toBeNull();
      expect(foundByEmail!.id).toBe(testUser.id);
      expect(foundByUsername).not.toBeNull();
      expect(foundByUsername!.id).toBe(testUser.id);
    });
  });

  describe('User Update Tests', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await dataStore.createUser({
        email: 'update@example.com',
        username: 'updateuser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 10,
        badges: []
      });
    });

    it('should update user points', async () => {
      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1));
      const updatedUser = await dataStore.updateUser(testUser.id, { points: 50 });

      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.points).toBe(50);
      expect(updatedUser!.updatedAt.getTime()).toBeGreaterThanOrEqual(testUser.updatedAt.getTime());
    });

    it('should update user badges', async () => {
      const newBadges = ['First Task', 'Team Player'];
      const updatedUser = await dataStore.updateUser(testUser.id, { badges: newBadges });

      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.badges).toEqual(newBadges);
    });

    it('should update user role', async () => {
      const updatedUser = await dataStore.updateUser(testUser.id, { role: Role.ADMIN });

      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.role).toBe(Role.ADMIN);
    });

    it('should update multiple fields', async () => {
      const updateData = {
        points: 100,
        badges: ['Super User'],
        role: Role.ADMIN
      };
      const updatedUser = await dataStore.updateUser(testUser.id, updateData);

      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.points).toBe(100);
      expect(updatedUser!.badges).toEqual(['Super User']);
      expect(updatedUser!.role).toBe(Role.ADMIN);
    });

    it('should return null for non-existent user update', async () => {
      const updatedUser = await dataStore.updateUser('non-existent-id', { points: 50 });
      expect(updatedUser).toBeNull();
    });
  });

  describe('User Business Logic Tests', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await dataStore.createUser({
        email: 'logic@example.com',
        username: 'logicuser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 0,
        badges: []
      });
    });

    it('should award badge to user', async () => {
      const result = await dataStore.awardBadge(testUser.id, 'First Task');

      expect(result).toBe(true);
      const updatedUser = await dataStore.findUserById(testUser.id);
      expect(updatedUser!.badges).toContain('First Task');
    });

    it('should not award duplicate badge', async () => {
      await dataStore.awardBadge(testUser.id, 'First Task');
      const result = await dataStore.awardBadge(testUser.id, 'First Task');

      expect(result).toBe(false);
      const updatedUser = await dataStore.findUserById(testUser.id);
      expect(updatedUser!.badges.filter(b => b === 'First Task')).toHaveLength(1);
    });

    it('should check and award badges based on achievements', async () => {
      // Update user to 100 points to trigger century badge
      await dataStore.updateUser(testUser.id, { points: 100 });
      
      const newBadges = await dataStore.checkAndAwardBadges(testUser.id);

      expect(newBadges).toContain('century');
      const updatedUser = await dataStore.findUserById(testUser.id);
      expect(updatedUser!.badges).toContain('century');
    });
  });

  describe('User Deletion Tests', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await dataStore.createUser({
        email: 'delete@example.com',
        username: 'deleteuser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 0,
        badges: []
      });
    });

    it('should delete existing user', async () => {
      const result = await dataStore.deleteUser(testUser.id);

      expect(result).toBe(true);
      const deletedUser = await dataStore.findUserById(testUser.id);
      expect(deletedUser).toBeNull();
    });

    it('should return false for non-existent user deletion', async () => {
      const result = await dataStore.deleteUser('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('User Role Tests', () => {
    it('should handle USER role correctly', async () => {
      const user = await dataStore.createUser({
        email: 'user@example.com',
        username: 'normaluser',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 0,
        badges: []
      });

      expect(user.role).toBe(Role.USER);
      expect(user.role).toBe('USER');
    });

    it('should handle ADMIN role correctly', async () => {
      const admin = await dataStore.createUser({
        email: 'admin@example.com',
        username: 'adminuser',
        password: 'hashedpassword123',
        role: Role.ADMIN,
        points: 0,
        badges: []
      });

      expect(admin.role).toBe(Role.ADMIN);
      expect(admin.role).toBe('ADMIN');
    });
  });

  describe('User Collection Tests', () => {
    beforeEach(async () => {
      // Create multiple users for collection tests
      await dataStore.createUser({
        email: 'user1@example.com',
        username: 'user1',
        password: 'hashedpassword123',
        role: Role.USER,
        points: 10,
        badges: []
      });

      await dataStore.createUser({
        email: 'user2@example.com',
        username: 'user2',
        password: 'hashedpassword123',
        role: Role.ADMIN,
        points: 50,
        badges: ['Admin']
      });
    });

    it('should retrieve all users', async () => {
      const allUsers = await dataStore.findAllUsers();

      expect(allUsers).toHaveLength(2);
      expect(allUsers.map(u => u.username)).toContain('user1');
      expect(allUsers.map(u => u.username)).toContain('user2');
    });

    it('should maintain user uniqueness by email and username', async () => {
      const allUsers = await dataStore.findAllUsers();
      const emails = allUsers.map(u => u.email);
      const usernames = allUsers.map(u => u.username);

      expect(new Set(emails).size).toBe(emails.length);
      expect(new Set(usernames).size).toBe(usernames.length);
    });
  });
});
