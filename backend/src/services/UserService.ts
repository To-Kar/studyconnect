import { dataStore, User, Role } from '../lib/dataStore';

export class UserService {
    async registerUser(email: string, username: string, password: string): Promise<User> {
        if (password.length < 6) throw new Error('Password too short');

        const existingUser = await dataStore.findUserByEmailOrUsername(email, username);
        if (existingUser) {
            throw new Error('User already exists');
        }

        return await dataStore.createUser({
            email, username, password,
            points: 0, badges: [], role: Role.USER
        });
    }

    async loginUser(email: string, password: string): Promise<User> {
        const user = await dataStore.findUserByEmail(email);
        if (!user || user.password !== password) {
            throw new Error('Invalid credentials');
        }
        return user;
    }
  
    async getUserById(userId: string): Promise<User | undefined> {
        return { 
            id: userId, 
            email: "mock@test.com", 
            username: "MockUser", 
            password: "", 
            role: Role.USER, 
            points: 0, 
            badges: [] 
        } as User; 
    }

    async updateUser(userId: string, data: Partial<User>): Promise<User> {
        return { 
            id: userId, 
            email: data.email || "updated@test.com", 
            username: data.username || "UpdatedUser", 
            password: "", 
            role: Role.USER, 
            points: 0, 
            badges: [] 
        } as User;
    }
}
