import { UserService } from './UserService';
import { dataStore, Role } from '../../lib/dataStore';

jest.mock('../../lib/dataStore', () => ({
    Role: { USER: 'USER', ADMIN: 'ADMIN' },
    dataStore: {
        findUserByEmailOrUsername: jest.fn(),
        findUserByEmail: jest.fn(),
        createUser: jest.fn(),
    },
}));

describe('UserService', () => {
    let userService: UserService;
    const mockUser = { id: '1', email: 't@t.com', username: 't', password: 'pw', role: Role.USER };

    beforeEach(() => {
        userService = new UserService();
        jest.clearAllMocks();
    });

    it('registers new user', async () => {
        (dataStore.findUserByEmailOrUsername as jest.Mock).mockResolvedValue(null);
        (dataStore.createUser as jest.Mock).mockResolvedValue(mockUser);
        await expect(userService.registerUser('t@t.com', 't', 'passwd')).resolves.toEqual(mockUser);
    });

    it('rejects short password', async () => {
        await expect(userService.registerUser('t@t.com', 't', '123')).rejects.toThrow('Password too short');
    });

    it('rejects existing user', async () => {
        (dataStore.findUserByEmailOrUsername as jest.Mock).mockResolvedValue(mockUser);
        await expect(userService.registerUser('t@t.com', 't', 'password123')).rejects.toThrow('User already exists');
    });

    it('logs in user', async () => {
        (dataStore.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
        await expect(userService.loginUser('t@t.com', 'pw')).resolves.toEqual(mockUser);
    });

    it('rejects invalid login', async () => {
        (dataStore.findUserByEmail as jest.Mock).mockResolvedValue(null);
        await expect(userService.loginUser('t@t.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
});