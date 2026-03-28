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
      setError(err instanceof Error ? err.message : '获取 TODO 失败');
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
      alert(err instanceof Error ? err.message : '创建失败');
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
      alert(err instanceof Error ? err.message : '更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条 TODO 吗？')) return;
    try {
      await todoApi.delete(id);
      fetchTodos();
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleToggleStatus = async (todo: Todo) => {
    const newStatus = todo.status === 'done' ? 'pending' : 'done';
    try {
      await todoApi.update(todo.id, { status: newStatus });
      fetchTodos();
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新状态失败');
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
        <h1 className={styles.title}>TODO 列表</h1>
        {!showForm && (
          <button className={styles.addButton} onClick={handleAddClick}>
            + 新建 TODO
          </button>
        )}
      </div>

      {loading && <div className={styles.loading}>加载中...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {showForm && (
        <TodoForm
          todo={editingTodo}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {!loading && !error && (
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
