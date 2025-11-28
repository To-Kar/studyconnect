import pool from './database';
import { v4 as uuidv4 } from 'uuid';

// Keep the same enums and interfaces from the original dataStore
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  OVERDUE = 'OVERDUE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Keep the same interfaces
export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  role: Role;
  points: number;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: Role;
  joinedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  points: number;
  creatorId: string;
  assigneeId?: string;
  groupId?: string;
  category?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  entityType: 'task' | 'group' | 'user';
  entityId: string;
  action: string;
  changes: Record<string, any>;
  userId: string;
  timestamp: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'assignment' | 'due_soon' | 'overdue';
  title: string;
  message: string;
  read: boolean;
  taskId?: string;
  createdAt: Date;
}

// PostgreSQL-based DataStore class
class DatabaseService {

  // User methods
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { rows } = await pool.query(`
      INSERT INTO users (email, username, password, role, points, badges)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, username, password, role, points, badges, created_at as "createdAt", updated_at as "updatedAt"
    `, [userData.email, userData.username, userData.password, userData.role, userData.points, userData.badges]);
    
    return rows[0];
  }

  async findUserById(id: string): Promise<User | null> {
    const { rows } = await pool.query(`
      SELECT id, email, username, password, role, points, badges, created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE id = $1
    `, [id]);
    
    return rows[0] || null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const { rows } = await pool.query(`
      SELECT id, email, username, password, role, points, badges, created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE email = $1
    `, [email]);
    
    return rows[0] || null;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    const { rows } = await pool.query(`
      SELECT id, email, username, password, role, points, badges, created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE username = $1
    `, [username]);
    
    return rows[0] || null;
  }

  async findUserByEmailOrUsername(email: string, username: string): Promise<User | null> {
    const { rows } = await pool.query(`
      SELECT id, email, username, password, role, points, badges, created_at as "createdAt", updated_at as "updatedAt"
      FROM users WHERE email = $1 OR username = $2
    `, [email, username]);
    
    return rows[0] || null;
  }

  async findAllUsers(): Promise<User[]> {
    const { rows } = await pool.query(`
      SELECT id, email, username, password, role, points, badges, created_at as "createdAt", updated_at as "updatedAt"
      FROM users ORDER BY created_at DESC
    `);
    
    return rows;
  }

  async updateUser(id: string, updateData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        const dbKey = key === 'updatedAt' ? 'updated_at' : key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);

    const { rows } = await pool.query(`
      UPDATE users SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, username, password, role, points, badges, created_at as "createdAt", updated_at as "updatedAt"
    `, values);

    return rows[0] || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (rowCount || 0) > 0;
  }

  // Group methods
  async createGroup(groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> {
    const { rows } = await pool.query(`
      INSERT INTO groups (name, description, creator_id)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, creator_id as "creatorId", created_at as "createdAt", updated_at as "updatedAt"
    `, [groupData.name, groupData.description, groupData.creatorId]);
    
    return rows[0];
  }

  async findGroupById(id: string): Promise<Group | null> {
    const { rows } = await pool.query(`
      SELECT id, name, description, creator_id as "creatorId", created_at as "createdAt", updated_at as "updatedAt"
      FROM groups WHERE id = $1
    `, [id]);
    
    return rows[0] || null;
  }

  async findAllGroups(): Promise<Group[]> {
    const { rows } = await pool.query(`
      SELECT id, name, description, creator_id as "creatorId", created_at as "createdAt", updated_at as "updatedAt"
      FROM groups ORDER BY created_at DESC
    `);
    
    return rows;
  }

  async updateGroup(id: string, updateData: Partial<Omit<Group, 'id' | 'createdAt'>>): Promise<Group | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        const dbKey = key === 'creatorId' ? 'creator_id' : key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);

    const { rows } = await pool.query(`
      UPDATE groups SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, creator_id as "creatorId", created_at as "createdAt", updated_at as "updatedAt"
    `, values);

    return rows[0] || null;
  }

  async deleteGroup(id: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM groups WHERE id = $1', [id]);
    return (rowCount || 0) > 0;
  }

  // GroupMember methods
  async createGroupMember(memberData: Omit<GroupMember, 'id' | 'joinedAt'>): Promise<GroupMember> {
    const { rows } = await pool.query(`
      INSERT INTO group_members (user_id, group_id, role)
      VALUES ($1, $2, $3)
      RETURNING id, user_id as "userId", group_id as "groupId", role, joined_at as "joinedAt"
    `, [memberData.userId, memberData.groupId, memberData.role]);
    
    return rows[0];
  }

  async findGroupMembersByGroupId(groupId: string): Promise<GroupMember[]> {
    const { rows } = await pool.query(`
      SELECT id, user_id as "userId", group_id as "groupId", role, joined_at as "joinedAt"
      FROM group_members WHERE group_id = $1
    `, [groupId]);
    
    return rows;
  }

  async findGroupMembersByUserId(userId: string): Promise<GroupMember[]> {
    const { rows } = await pool.query(`
      SELECT id, user_id as "userId", group_id as "groupId", role, joined_at as "joinedAt"
      FROM group_members WHERE user_id = $1
    `, [userId]);
    
    return rows;
  }

  async findGroupMember(userId: string, groupId: string): Promise<GroupMember | null> {
    const { rows } = await pool.query(`
      SELECT id, user_id as "userId", group_id as "groupId", role, joined_at as "joinedAt"
      FROM group_members WHERE user_id = $1 AND group_id = $2
    `, [userId, groupId]);
    
    return rows[0] || null;
  }

  async deleteGroupMember(userId: string, groupId: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      'DELETE FROM group_members WHERE user_id = $1 AND group_id = $2',
      [userId, groupId]
    );
    return (rowCount || 0) > 0;
  }

  // Task methods
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const { rows } = await pool.query(`
      INSERT INTO tasks (title, description, status, priority, due_date, points, creator_id, assignee_id, group_id, category, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, title, description, status, priority, due_date as "dueDate", points, 
                creator_id as "creatorId", assignee_id as "assigneeId", group_id as "groupId", 
                category, notes, created_at as "createdAt", updated_at as "updatedAt"
    `, [
      taskData.title, taskData.description, taskData.status, taskData.priority,
      taskData.dueDate, taskData.points, taskData.creatorId, taskData.assigneeId,
      taskData.groupId, taskData.category, taskData.notes
    ]);
    
    return rows[0];
  }

  async findTaskById(id: string): Promise<Task | null> {
    const { rows } = await pool.query(`
      SELECT id, title, description, status, priority, due_date as "dueDate", points,
             creator_id as "creatorId", assignee_id as "assigneeId", group_id as "groupId",
             category, notes, created_at as "createdAt", updated_at as "updatedAt"
      FROM tasks WHERE id = $1
    `, [id]);
    
    return rows[0] || null;
  }

  async findAllTasks(filters?: {
    creatorId?: string;
    assigneeId?: string;
    groupId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    category?: string;
    dueBefore?: Date;
    dueAfter?: Date;
  }): Promise<Task[]> {
    let query = `
      SELECT id, title, description, status, priority, due_date as "dueDate", points,
             creator_id as "creatorId", assignee_id as "assigneeId", group_id as "groupId",
             category, notes, created_at as "createdAt", updated_at as "updatedAt"
      FROM tasks
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters) {
      if (filters.creatorId) {
        conditions.push(`creator_id = $${paramCount}`);
        values.push(filters.creatorId);
        paramCount++;
      }
      if (filters.assigneeId) {
        conditions.push(`assignee_id = $${paramCount}`);
        values.push(filters.assigneeId);
        paramCount++;
      }
      if (filters.groupId) {
        conditions.push(`group_id = $${paramCount}`);
        values.push(filters.groupId);
        paramCount++;
      }
      if (filters.status) {
        conditions.push(`status = $${paramCount}`);
        values.push(filters.status);
        paramCount++;
      }
      if (filters.priority) {
        conditions.push(`priority = $${paramCount}`);
        values.push(filters.priority);
        paramCount++;
      }
      if (filters.category) {
        conditions.push(`category = $${paramCount}`);
        values.push(filters.category);
        paramCount++;
      }
      if (filters.dueBefore) {
        conditions.push(`due_date < $${paramCount}`);
        values.push(filters.dueBefore);
        paramCount++;
      }
      if (filters.dueAfter) {
        conditions.push(`due_date > $${paramCount}`);
        values.push(filters.dueAfter);
        paramCount++;
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async updateTask(id: string, updateData: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        let dbKey = key;
        switch (key) {
          case 'assigneeId': dbKey = 'assignee_id'; break;
          case 'creatorId': dbKey = 'creator_id'; break;
          case 'groupId': dbKey = 'group_id'; break;
          case 'dueDate': dbKey = 'due_date'; break;
          case 'updatedAt': dbKey = 'updated_at'; break;
          default: 
            dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        }
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) return null;

    values.push(id);

    const { rows } = await pool.query(`
      UPDATE tasks SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, description, status, priority, due_date as "dueDate", points,
                creator_id as "creatorId", assignee_id as "assigneeId", group_id as "groupId",
                category, notes, created_at as "createdAt", updated_at as "updatedAt"
    `, values);

    return rows[0] || null;
  }

  async updateManyTasks(filters: { dueDate?: Date; status?: TaskStatus }, updateData: Partial<Task>): Promise<number> {
    const conditions = [];
    const setFields = [];
    const values = [];
    let paramCount = 1;

    // Build WHERE conditions
    if (filters.dueDate) {
      conditions.push(`due_date < $${paramCount}`);
      values.push(filters.dueDate);
      paramCount++;
    }
    if (filters.status) {
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }

    // Build SET fields
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        setFields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (conditions.length === 0 || setFields.length === 0) return 0;

    const query = `
      UPDATE tasks SET ${setFields.join(', ')}
      WHERE ${conditions.join(' AND ')}
    `;

    const { rowCount } = await pool.query(query, values);
    return rowCount || 0;
  }

  async deleteTask(id: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return (rowCount || 0) > 0;
  }

  // Helper methods for relations
  async getTaskWithRelations(id: string): Promise<(Task & { creator?: User; assignee?: User; group?: Group }) | null> {
    const task = await this.findTaskById(id);
    if (!task) return null;

    const creator = await this.findUserById(task.creatorId);
    const assignee = task.assigneeId ? await this.findUserById(task.assigneeId) : null;
    const group = task.groupId ? await this.findGroupById(task.groupId) : null;

    return {
      ...task,
      creator: creator || undefined,
      assignee: assignee || undefined,
      group: group || undefined
    };
  }

  async getTasksWithRelations(filters?: Parameters<typeof this.findAllTasks>[0]): Promise<(Task & { creator?: User; assignee?: User; group?: Group })[]> {
    const tasks = await this.findAllTasks(filters);
    
    const tasksWithRelations = await Promise.all(
      tasks.map(async (task) => {
        const creator = await this.findUserById(task.creatorId);
        const assignee = task.assigneeId ? await this.findUserById(task.assigneeId) : null;
        const group = task.groupId ? await this.findGroupById(task.groupId) : null;

        return {
          ...task,
          creator: creator || undefined,
          assignee: assignee || undefined,
          group: group || undefined
        };
      })
    );

    return tasksWithRelations;
  }

  // Group membership helpers
  async isUserMemberOfGroup(userId: string, groupId: string): Promise<boolean> {
    const member = await this.findGroupMember(userId, groupId);
    return !!member;
  }

  async getUserRoleInGroup(userId: string, groupId: string): Promise<Role | null> {
    const member = await this.findGroupMember(userId, groupId);
    return member ? member.role : null;
  }

  // Additional methods (Task Comments, Notifications, Audit Logs, Badges)
  // Implementation continues...

  async createTaskComment(commentData: Omit<TaskComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskComment> {
    const { rows } = await pool.query(`
      INSERT INTO task_comments (task_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, task_id as "taskId", user_id as "userId", content, created_at as "createdAt", updated_at as "updatedAt"
    `, [commentData.taskId, commentData.userId, commentData.content]);
    
    return rows[0];
  }

  async findTaskCommentsByTaskId(taskId: string): Promise<TaskComment[]> {
    const { rows } = await pool.query(`
      SELECT id, task_id as "taskId", user_id as "userId", content, created_at as "createdAt", updated_at as "updatedAt"
      FROM task_comments WHERE task_id = $1 ORDER BY created_at ASC
    `, [taskId]);
    
    return rows;
  }

  async deleteTaskComment(id: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM task_comments WHERE id = $1', [id]);
    return (rowCount || 0) > 0;
  }

  // Notification methods
  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const { rows } = await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, read, task_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id as "userId", type, title, message, read, task_id as "taskId", created_at as "createdAt"
    `, [
      notificationData.userId,
      notificationData.type,
      notificationData.title,
      notificationData.message,
      notificationData.read,
      notificationData.taskId || null
    ]);

    return rows[0];
  }

  async findNotificationsByUserId(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    const params: any[] = [userId];
    let query = `
      SELECT id, user_id as "userId", type, title, message, read, task_id as "taskId", created_at as "createdAt"
      FROM notifications
      WHERE user_id = $1
    `;

    if (unreadOnly) {
      params.push(false);
      query += ` AND read = $2`;
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    return rows;
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const { rowCount } = await pool.query(`
      UPDATE notifications SET read = true WHERE id = $1
    `, [id]);

    return (rowCount || 0) > 0;
  }

  // Badge system methods
  async awardBadge(userId: string, badgeName: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    if (!user || user.badges.includes(badgeName)) return false;
    
    const newBadges = [...user.badges, badgeName];
    await this.updateUser(userId, { badges: newBadges });
    return true;
  }

  async checkAndAwardBadges(userId: string): Promise<string[]> {
    const user = await this.findUserById(userId);
    if (!user) return [];
    
    const userTasks = await this.findAllTasks({ assigneeId: userId, status: TaskStatus.DONE });
    const newBadges: string[] = [];
    
    // First task completed
    if (userTasks.length === 1 && !user.badges.includes('first_task')) {
      await this.awardBadge(userId, 'first_task');
      newBadges.push('first_task');
    }
    
    // Task Master (10 tasks)
    if (userTasks.length >= 10 && !user.badges.includes('task_master')) {
      await this.awardBadge(userId, 'task_master');
      newBadges.push('task_master');
    }
    
    // Points milestone badges
    if (user.points >= 100 && !user.badges.includes('century')) {
      await this.awardBadge(userId, 'century');
      newBadges.push('century');
    }
    
    return newBadges;
  }
}

// Create singleton instance
export const dataStore = new DatabaseService();
