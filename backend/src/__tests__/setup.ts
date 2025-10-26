// Test setup file
// This file runs before all tests

// Mock console.log to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup test timeout
jest.setTimeout(10000);

// Global test utilities
(global as any).testUtils = {
  createMockUser: () => ({
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword123',
    role: 'USER' as const,
    points: 0,
    badges: []
  }),
  
  createMockTask: () => ({
    title: 'Test Task',
    description: 'This is a test task',
    status: 'OPEN' as const,
    priority: 'MEDIUM' as const,
    points: 10,
    creatorId: 'user-123'
  }),
  
  createMockGroup: () => ({
    name: 'Test Group',
    description: 'This is a test group',
    creatorId: 'user-123'
  }),
  
  // Helper to create delay for timestamp tests
  delay: (ms: number = 1) => new Promise(resolve => setTimeout(resolve, ms))
};

// Add a dummy test to satisfy Jest's requirement
describe('Setup', () => {
  it('should initialize test utilities', () => {
    expect((global as any).testUtils).toBeDefined();
    expect((global as any).testUtils.createMockUser).toBeInstanceOf(Function);
    expect((global as any).testUtils.createMockTask).toBeInstanceOf(Function);
    expect((global as any).testUtils.createMockGroup).toBeInstanceOf(Function);
    expect((global as any).testUtils.delay).toBeInstanceOf(Function);
  });
});
