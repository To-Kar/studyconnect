import { v4 as uuidv4 } from 'uuid';

// Enums
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

// Interfaces
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

// In-memory data storage
class DataStore {
  private users: User[] = [];
  private groups: Group[] = [];
  private groupMembers: GroupMember[] = [];
  private tasks: Task[] = [];
  private taskComments: TaskComment[] = [];
  private auditLogs: AuditLog[] = [];
  private notifications: Notification[] = [];

  // User methods
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.users.find(user => user.username === username) || null;
  }

  async findUserByEmailOrUsername(email: string, username: string): Promise<User | null> {
    return this.users.find(user => user.email === email || user.username === username) || null;
  }

  async findAllUsers(): Promise<User[]> {
    return this.users;
  }

  async updateUser(id: string, updateData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateData,
      updatedAt: new Date()
    };
    return this.users[userIndex];
  }

  async deleteUser(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;
    
    this.users.splice(userIndex, 1);
    // Also remove related data
    this.tasks = this.tasks.filter(task => task.creatorId !== id && task.assigneeId !== id);
    this.groupMembers = this.groupMembers.filter(member => member.userId !== id);
    this.groups = this.groups.filter(group => group.creatorId !== id);
    
    return true;
  }

  // Group methods
  async createGroup(groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> {
    const group: Group = {
      ...groupData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.groups.push(group);
    return group;
  }

  async findGroupById(id: string): Promise<Group | null> {
    return this.groups.find(group => group.id === id) || null;
  }

  async findAllGroups(): Promise<Group[]> {
    return this.groups;
  }

  async updateGroup(id: string, updateData: Partial<Omit<Group, 'id' | 'createdAt'>>): Promise<Group | null> {
    const groupIndex = this.groups.findIndex(group => group.id === id);
    if (groupIndex === -1) return null;

    this.groups[groupIndex] = {
      ...this.groups[groupIndex],
      ...updateData,
      updatedAt: new Date()
    };
    return this.groups[groupIndex];
  }

  async deleteGroup(id: string): Promise<boolean> {
    const groupIndex = this.groups.findIndex(group => group.id === id);
    if (groupIndex === -1) return false;
    
    this.groups.splice(groupIndex, 1);
    // Also remove related data
    this.groupMembers = this.groupMembers.filter(member => member.groupId !== id);
    this.tasks = this.tasks.filter(task => task.groupId !== id);
    
    return true;
  }

  // GroupMember methods
  async createGroupMember(memberData: Omit<GroupMember, 'id' | 'joinedAt'>): Promise<GroupMember> {
    const member: GroupMember = {
      ...memberData,
      id: uuidv4(),
      joinedAt: new Date()
    };
    this.groupMembers.push(member);
    return member;
  }

  async findGroupMembersByGroupId(groupId: string): Promise<GroupMember[]> {
    return this.groupMembers.filter(member => member.groupId === groupId);
  }

  async findGroupMembersByUserId(userId: string): Promise<GroupMember[]> {
    return this.groupMembers.filter(member => member.userId === userId);
  }

  async findGroupMember(userId: string, groupId: string): Promise<GroupMember | null> {
    return this.groupMembers.find(member => member.userId === userId && member.groupId === groupId) || null;
  }

  async deleteGroupMember(userId: string, groupId: string): Promise<boolean> {
    const memberIndex = this.groupMembers.findIndex(member => member.userId === userId && member.groupId === groupId);
    if (memberIndex === -1) return false;
    
    this.groupMembers.splice(memberIndex, 1);
    return true;
  }

  // Task methods
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const task: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.push(task);
    return task;
  }

  async findTaskById(id: string): Promise<Task | null> {
    return this.tasks.find(task => task.id === id) || null;
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
    let filteredTasks = this.tasks;

    if (filters) {
      if (filters.creatorId) {
        filteredTasks = filteredTasks.filter(task => task.creatorId === filters.creatorId);
      }
      if (filters.assigneeId) {
        filteredTasks = filteredTasks.filter(task => task.assigneeId === filters.assigneeId);
      }
      if (filters.groupId) {
        filteredTasks = filteredTasks.filter(task => task.groupId === filters.groupId);
      }
      if (filters.status) {
        filteredTasks = filteredTasks.filter(task => task.status === filters.status);
      }
      if (filters.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
      }
      if (filters.category) {
        filteredTasks = filteredTasks.filter(task => task.category === filters.category);
      }
      if (filters.dueBefore) {
        filteredTasks = filteredTasks.filter(task => task.dueDate && task.dueDate < filters.dueBefore!);
      }
      if (filters.dueAfter) {
        filteredTasks = filteredTasks.filter(task => task.dueDate && task.dueDate > filters.dueAfter!);
      }
    }

    return filteredTasks;
  }

  async updateTask(id: string, updateData: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task | null> {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return null;

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updateData,
      updatedAt: new Date()
    };
    return this.tasks[taskIndex];
  }

  async updateManyTasks(filters: { dueDate?: Date; status?: TaskStatus }, updateData: Partial<Task>): Promise<number> {
    let updatedCount = 0;
    
    this.tasks.forEach((task, index) => {
      let shouldUpdate = true;
      
      if (filters.dueDate && (!task.dueDate || task.dueDate >= filters.dueDate)) {
        shouldUpdate = false;
      }
      if (filters.status && task.status !== filters.status) {
        shouldUpdate = false;
      }
      
      if (shouldUpdate) {
        this.tasks[index] = {
          ...task,
          ...updateData,
          updatedAt: new Date()
        };
        updatedCount++;
      }
    });
    
    return updatedCount;
  }

  async deleteTask(id: string): Promise<boolean> {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return false;
    
    this.tasks.splice(taskIndex, 1);
    return true;
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

  // Task Comment methods
  async createTaskComment(commentData: Omit<TaskComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskComment> {
    const comment: TaskComment = {
      ...commentData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.taskComments.push(comment);
    return comment;
  }

  async findTaskCommentsByTaskId(taskId: string): Promise<TaskComment[]> {
    return this.taskComments.filter(comment => comment.taskId === taskId);
  }

  async deleteTaskComment(id: string): Promise<boolean> {
    const commentIndex = this.taskComments.findIndex(comment => comment.id === id);
    if (commentIndex === -1) return false;
    
    this.taskComments.splice(commentIndex, 1);
    return true;
  }

  // Audit Log methods
  async createAuditLog(auditData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const audit: AuditLog = {
      ...auditData,
      id: uuidv4(),
      timestamp: new Date()
    };
    this.auditLogs.push(audit);
    return audit;
  }

  async findAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditLogs.filter(log => log.entityType === entityType && log.entityId === entityId);
  }

  // Notification methods
  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const notification: Notification = {
      ...notificationData,
      id: uuidv4(),
      createdAt: new Date()
    };
    this.notifications.push(notification);
    return notification;
  }

  async findNotificationsByUserId(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    let notifications = this.notifications.filter(notification => notification.userId === userId);
    if (unreadOnly) {
      notifications = notifications.filter(notification => !notification.read);
    }
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return false;
    
    notification.read = true;
    return true;
  }

  // Badge system methods
  async awardBadge(userId: string, badgeName: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    if (!user || user.badges.includes(badgeName)) return false;
    
    user.badges.push(badgeName);
    user.updatedAt = new Date();
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
export const dataStore = new DataStore();