import { dataStore, User, Role } from '../lib/dataStore';

export class UserService {
    async registerUser(email: string, username: string, password: string): Promise<User> {
        if (password.length < 6) throw new Error('Password must be at least 6 characters');

        // Check ob User existiert
        const existingUser = await dataStore.findUserByEmailOrUsername(email, username);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // User erstellen
        return await dataStore.createUser({
            email, username, password,
            points: 0, badges: [], role: Role.USER
        });
    }

    // Logik für Login
    async loginUser(email: string, password: string): Promise<User> {
        const user = await dataStore.findUserByEmail(email);
        
        // Einfacher Check
        if (!user || user.password !== password) {
            throw new Error('Invalid credentials');
        }
        return user;
    }
    
    async findUserByEmail(email: string): Promise<User | null> {
        return await dataStore.findUserByEmail(email);
    }
}
