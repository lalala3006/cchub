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
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>TODO</h1>
          <p className={styles.subtitle}>
            {loading ? '加载中...' : `${todos.length} 个任务`}
          </p>
        </div>
        {!showForm && (
          <button className={styles.addButton} onClick={handleAddClick}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>新建任务</span>
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
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p>加载中...</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {!loading && !error && todos.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <p className={styles.emptyText}>暂无任务</p>
          <p className={styles.emptyHint}>点击上方按钮创建第一个任务</p>
        </div>
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
