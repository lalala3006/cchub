import type { Todo } from '../../api/todoApi';
import styles from './Todo.module.css';

interface TodoItemProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (todo: Todo) => void;
}

export function TodoItem({ todo, onEdit, onDelete, onToggleStatus }: TodoItemProps) {
  const isDone = todo.status === 'done';

  const priorityClass =
    todo.priority === 'high'
      ? styles.badgeHigh
      : todo.priority === 'medium'
      ? styles.badgeMedium
      : styles.badgeLow;

  const statusClass =
    todo.status === 'done'
      ? styles.badgeDone
      : todo.status === 'in_progress'
      ? styles.badgeInProgress
      : styles.badgePending;

  const statusLabels = {
    pending: '待处理',
    in_progress: '进行中',
    done: '已完成',
  };

  const priorityLabels = {
    low: '低',
    medium: '中',
    high: '高',
  };

  return (
    <div className={styles.item}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={isDone}
        onChange={() => onToggleStatus(todo)}
      />
      <div className={styles.content}>
        <div className={styles.itemHeader}>
          <span className={`${styles.itemTitle} ${isDone ? styles.itemTitleDone : ''}`}>
            {todo.title}
          </span>
        </div>
        {todo.description && (
          <p className={styles.description}>{todo.description}</p>
        )}
        <div className={styles.meta}>
          <span className={`${styles.badge} ${priorityClass}`}>
            {priorityLabels[todo.priority]}
          </span>
          <span className={`${styles.badge} ${statusClass}`}>
            {statusLabels[todo.status]}
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        <button
          className={`${styles.actionButton} ${styles.editButton}`}
          onClick={() => onEdit(todo)}
        >
          编辑
        </button>
        <button
          className={`${styles.actionButton} ${styles.deleteButton}`}
          onClick={() => onDelete(todo.id)}
        >
          删除
        </button>
      </div>
    </div>
  );
}
