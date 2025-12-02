import { dataStore, User, Role } from '../lib/databaseService';

export class UserService {

    async registerUser(email: string, username: string, password: string): Promise<User> {
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        const existingUser = await dataStore.findUserByEmailOrUsername(email, username);
        if (existingUser) {
            throw new Error('User already exists');
        }

        return await dataStore.createUser({
            email,
            username,
            password, 
            points: 0, 
            badges: [], 
            role: Role.USER
        });
    }

    async loginUser(email: string, password: string): Promise<User> {
        const user = await dataStore.findUserByEmail(email);
        
        if (!user) {
            throw new Error('Invalid credentials');
        }
        return user;
    }

    async getUserById(id: string): Promise<User | undefined> {
        const user = await dataStore.findUserById(id);
        return user || undefined; 
    }
    
    async findUserByEmail(email: string): Promise<User | undefined> {
        const user = await dataStore.findUserByEmail(email);
        return user || undefined; 
    }

    async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
        const user = await dataStore.updateUser(id, updates);
        return user || undefined;
    }
}
