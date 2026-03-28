import { useState, useEffect } from 'react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../api/todoApi';
import styles from './Todo.module.css';

interface TodoFormProps {
  todo?: Todo | null;
  onSubmit: (data: CreateTodoInput | UpdateTodoInput) => void;
  onCancel: () => void;
}

export function TodoForm({ todo, onSubmit, onCancel }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'done'>('pending');

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setPriority(todo.priority);
      setStatus(todo.status);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('pending');
    }
  }, [todo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
    };

    onSubmit(data);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <div className={styles.formIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {todo ? (
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            ) : (
              <>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </>
            )}
            {todo ? (
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            ) : null}
          </svg>
        </div>
        <h2 className={styles.formTitle}>{todo ? '编辑任务' : '新建任务'}</h2>
      </div>

      <div className={styles.formBody}>
        <div className={styles.formGroup}>
          <label className={styles.label}>标题</label>
          <input
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入任务标题"
            required
            autoFocus
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>描述</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="添加任务描述（可选）"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>优先级</label>
            <select
              className={styles.select}
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>状态</label>
            <select
              className={styles.select}
              value={status}
              onChange={(e) => setStatus(e.target.value as 'pending' | 'in_progress' | 'done')}
            >
              <option value="pending">待处理</option>
              <option value="in_progress">进行中</option>
              <option value="done">已完成</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelButton} onClick={onCancel}>
          取消
        </button>
        <button type="submit" className={styles.submitButton}>
          {todo ? '保存修改' : '创建任务'}
        </button>
      </div>
    </form>
  );
}
