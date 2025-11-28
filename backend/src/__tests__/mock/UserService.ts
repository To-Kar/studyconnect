import { dataStore, User, Role } from '../../lib/dataStore';

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
}