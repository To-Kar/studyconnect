export class TaskService {
    async createTask(taskData: any) {
        return { id: "task-1", ...taskData, status: 'OPEN' };
    }

    async updateTask(taskId: string, taskData: any) {
        return { id: taskId, ...taskData };
    }

    async deleteTask(taskId: string) {
        return true;
    }
    
    async getTasks() {
        return [];
    }
}
