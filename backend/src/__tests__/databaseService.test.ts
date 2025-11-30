import pool from '../lib/database';
import { dataStore, Role } from '../lib/databaseService';

const resetDb = async () => {
  await pool.query('TRUNCATE task_comments, tasks, group_members, groups, users RESTART IDENTITY CASCADE');
};

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await pool.end(); // let Jest exit cleanly
});

describe('databaseService/user repository', () => {
  it('creates a user and finds it by id/email', async () => {
    const created = await dataStore.createUser({
      email: 'alice@example.com',
      username: 'alice',
      password: 'pw',
      role: Role.USER,
      points: 0,
      badges: [],
    });

    const byId = await dataStore.findUserById(created.id);
    const byEmail = await dataStore.findUserByEmail('alice@example.com');

    expect(byId?.username).toBe('alice');
    expect(byEmail?.id).toBe(created.id);
  });

  it('updates user information', async () => {
    const user = await dataStore.createUser({
      email: 'bob@example.com',
      username: 'bob',
      password: 'pw',
      role: Role.USER,
      points: 5,
      badges: [],
    });

    const updated = await dataStore.updateUser(user.id, { username: 'bobby', points: 15 });
    const reloaded = await dataStore.findUserById(user.id);

    expect(updated?.username).toBe('bobby');
    expect(reloaded?.points).toBe(15);
  });

  it('deletes a user', async () => {
    const user = await dataStore.createUser({
      email: 'carol@example.com',
      username: 'carol',
      password: 'pw',
      role: Role.USER,
      points: 0,
      badges: [],
    });

    const deleted = await dataStore.deleteUser(user.id);
    const after = await dataStore.findUserById(user.id);

    expect(deleted).toBe(true);
    expect(after).toBeNull();
  });

  it('queries users by role (via DB)', async () => {
    await dataStore.createUser({ email: 'admin@example.com', username: 'admin', password: 'pw', role: Role.ADMIN, points: 0, badges: [] });
    await dataStore.createUser({ email: 'user@example.com', username: 'user', password: 'pw', role: Role.USER, points: 0, badges: [] });

    const { rows: admins } = await pool.query('SELECT id FROM users WHERE role = $1', [Role.ADMIN]);
    const { rows: users } = await pool.query('SELECT id FROM users WHERE role = $1', [Role.USER]);

    expect(admins).toHaveLength(1);
    expect(users).toHaveLength(1);
  });

  it('queries users by team membership', async () => {
    const creator = await dataStore.createUser({ email: 'creator@example.com', username: 'creator', password: 'pw', role: Role.ADMIN, points: 0, badges: [] });
    const member = await dataStore.createUser({ email: 'member@example.com', username: 'member', password: 'pw', role: Role.USER, points: 0, badges: [] });
    const outsider = await dataStore.createUser({ email: 'outsider@example.com', username: 'outsider', password: 'pw', role: Role.USER, points: 0, badges: [] });

    const group = await dataStore.createGroup({ name: 'Test Group', description: 'demo', creatorId: creator.id });
    await dataStore.createGroupMember({ userId: member.id, groupId: group.id, role: Role.USER });

    const { rows: members } = await pool.query(
      'SELECT u.id, u.username FROM users u JOIN group_members gm ON gm.user_id = u.id WHERE gm.group_id = $1 ORDER BY u.username',
      [group.id]
    );

    expect(members.map(r => r.username)).toEqual(['member']);
    const groupMembers = await dataStore.findGroupMembersByGroupId(group.id);
    expect(groupMembers.map(m => m.userId)).toContain(member.id);
    expect(groupMembers.map(m => m.userId)).not.toContain(outsider.id);
  });
});
