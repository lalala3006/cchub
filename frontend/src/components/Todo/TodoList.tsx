import type { Todo } from '../../api/todoApi';
import { TodoItem } from './TodoItem';
import styles from './Todo.module.css';

interface TodoListProps {
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (todo: Todo) => void;
}

export function TodoList({ todos, onEdit, onDelete, onToggleStatus }: TodoListProps) {
  if (todos.length === 0) {
    return <div className={styles.empty}>暂无 TODO，点击上方按钮添加</div>;
  }

  return (
    <div className={styles.list}>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}
