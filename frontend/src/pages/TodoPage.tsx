import { useState, useEffect, useCallback } from 'react';
import { todoApi } from '../api/todoApi';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../api/todoApi';
import { TodoList } from '../components/Todo/TodoList';
import { TodoForm } from '../components/Todo/TodoForm';
import styles from '../components/Todo/Todo.module.css';

export function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await todoApi.getAll();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleCreate = async (data: CreateTodoInput) => {
    try {
      await todoApi.create(data);
      setShowForm(false);
      fetchTodos();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  const handleUpdate = async (data: UpdateTodoInput) => {
    if (!editingTodo) return;
    try {
      await todoApi.update(editingTodo.id, data);
      setEditingTodo(null);
      setShowForm(false);
      fetchTodos();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      await todoApi.delete(id);
      fetchTodos();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleToggleStatus = async (todo: Todo) => {
    const newStatus = todo.status === 'done' ? 'pending' : 'done';
    try {
      await todoApi.update(todo.id, { status: newStatus });
      fetchTodos();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTodo(null);
  };

  const handleAddClick = () => {
    setEditingTodo(null);
    setShowForm(true);
  };

  const handleSubmit = (data: CreateTodoInput | UpdateTodoInput) => {
    if (editingTodo) {
      handleUpdate(data);
    } else {
      handleCreate(data as CreateTodoInput);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>TODO</h1>
          <p className={styles.subtitle}>
            {loading ? 'Loading...' : `${todos.length} ${todos.length === 1 ? 'Task' : 'Tasks'}`}
          </p>
        </div>
        {!showForm && (
          <button className={styles.addButton} onClick={handleAddClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Task</span>
          </button>
        )}
      </div>

      {showForm && (
        <TodoForm
          todo={editingTodo}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {loading && (
        <div className={styles.loading}>Loading...</div>
      )}

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      {!loading && !error && todos.length === 0 && (
        <div className={styles.empty}>No tasks yet</div>
      )}

      {!loading && !error && todos.length > 0 && (
        <TodoList
          todos={todos}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
}
