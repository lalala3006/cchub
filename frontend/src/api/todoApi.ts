const API_BASE_URL = 'http://localhost:4000/api/v1';

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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  return response.json();
}

export const todoApi = {
  async getAll(): Promise<Todo[]> {
    const response = await fetch(`${API_BASE_URL}/todos`);
    return handleResponse(response);
  },

  async getById(id: number): Promise<Todo> {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`);
    return handleResponse(response);
  },

  async create(data: CreateTodoInput): Promise<Todo> {
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async update(id: number, data: UpdateTodoInput): Promise<Todo> {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Delete failed' }));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }
  },
};
