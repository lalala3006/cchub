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
      ? styles.badgePriorityHigh
      : todo.priority === 'medium'
      ? styles.badgePriorityMedium
      : styles.badgePriorityLow;

  const statusClass =
    todo.status === 'done'
      ? styles.badgeStatusDone
      : todo.status === 'in_progress'
      ? styles.badgeStatusProgress
      : styles.badgeStatusPending;

  const statusLabels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    done: 'Done',
  };

  const priorityLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
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
        <span className={`${styles.itemTitle} ${isDone ? styles.itemTitleDone : ''}`}>
          {todo.title}
        </span>
        <span className={`${styles.badge} ${statusClass}`}>
          {statusLabels[todo.status]}
        </span>
        <span className={`${styles.badge} ${priorityClass}`}>
          {priorityLabels[todo.priority]}
        </span>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          onClick={() => onEdit(todo)}
        >
          Edit
        </button>
        <button
          className={styles.actionButton}
          onClick={() => onDelete(todo.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
