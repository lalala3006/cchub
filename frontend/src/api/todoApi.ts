import { apiRequest, apiRequestVoid, API_BASE_URL } from './client';

export interface Todo {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'done';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'done';
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'done';
}

export const todoApi = {
  async getAll(): Promise<Todo[]> {
    return apiRequest<Todo[]>('/todos');
  },

  async getById(id: number): Promise<Todo> {
    return apiRequest<Todo>(`/todos/${id}`);
  },

  async create(data: CreateTodoInput): Promise<Todo> {
    return apiRequest<Todo>('/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: UpdateTodoInput): Promise<Todo> {
    return apiRequest<Todo>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    await apiRequestVoid(`/todos/${id}`, {
      method: 'DELETE',
    });
  },
};

export { API_BASE_URL };
