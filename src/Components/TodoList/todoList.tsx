import { useState, useEffect } from 'react';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from '../../Api/todos';
import type { Todo } from '../../Types/todo';
import type { ApiError } from '../../Types/error';
import styles from './todoList.module.css';

function TodoList() {

    const [todos, setTodos] = useState<Todo[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [completedFilter, setCompletedFilter] = useState(false);

    useEffect(() => {
        async function LoadTodos() {
            try {
                const page = await fetchTodos(0, 20, completedFilter ? true : undefined);
                setTodos(page.content);
            } catch (err) {
                setError((err as ApiError).message ?? 'Failed to load todos');
            } finally {
                setLoading(false);
            }
        }
        LoadTodos();
    }, [completedFilter]);

    async function handleCreate() {
        const title = newTitle.trim();
        const description = newDescription.trim();

        if (!title) {
            setFieldErrors({ title: 'Title is required' });
            setError(null);
            return;
        }

        try {
            const created = await createTodo({
                title,
                description: description || undefined,
                completed: false,
            });
            setTodos(prev => [created, ...prev]); //Add new todo to top of list (Arrow function to avoid stale state issues)
            setNewTitle(''); //Clear input fields
            setNewDescription('');
            setFieldErrors({});
            setError(null);
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errors) {
                setFieldErrors(apiError.errors); //Validation errors
                setError(null);
            } else {
                setFieldErrors({});
                setError(apiError.message ?? 'Failed to create todo'); //Other errors
            }
        }
    }

    async function handleToggle(todo: Todo) {
        try {
            const updated = await updateTodo(todo.id, {
                title: todo.title,
                description: todo.description ?? undefined,
                completed: !todo.completed, //Toggle completed status
            });
            setTodos(prev => prev.map(t => t.id === updated.id ? updated : t)); //If match, replace with updated, else replace with itself(no change)
        } catch (err) {
            setError((err as ApiError).message ?? 'Failed to update todo');
        }
    }

    async function handleDelete(id: number) {
        try {
            await deleteTodo(id);
            setTodos(prev => prev.filter((t) => t.id !== id)); //Remove deleted todo from list
        } catch (err) {
            setError((err as ApiError).message ?? 'Failed to delete todo');
        }
    }

    if (loading) return <p className={styles.message}>Loading...</p>;
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>To Do List</h2>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.inputGroup}>
                <input
                    className={styles.input}
                    type="text"
                    value={newTitle}
                    onChange={(e) => {
                        setNewTitle(e.target.value);
                        if (fieldErrors.title) {
                            setFieldErrors((prev) => {
                                const next = { ...prev };
                                delete next.title;
                                return next;
                            });
                        }
                    }}
                    placeholder="Title"
                />
                {fieldErrors.title && ( //If validation error for title exists, show error message below input
                    <span className={styles.fieldError}>{fieldErrors.title}</span>
                )}

                <input
                    className={styles.input}
                    type="text"
                    value={newDescription}
                    onChange={(e) => {
                        setNewDescription(e.target.value);
                        if (fieldErrors.description) {
                            setFieldErrors((prev) => {
                                const next = { ...prev };
                                delete next.description;
                                return next;
                            });
                        }
                    }}
                    placeholder="Description (optional)"
                />
                {fieldErrors.description && ( //If validation error for description exists, show error message below input
                    <span className={styles.fieldError}>{fieldErrors.description}</span>
                )}

                <button className={styles.btnAdd} onClick={handleCreate}>
                    Add
                </button>
            </div>
            <div className={styles.filterRow}>
                <input
                    id="filterCompleted"
                    type="checkbox"
                    checked={completedFilter}
                    onChange={() => setCompletedFilter(prev => !prev)}
                />
                <label htmlFor="filterCompleted">Filter Completed</label>
            </div>

            {todos.length === 0 ? (
                <p className={styles.message}>No tasks yet</p>
            ) : (
                <ul className={styles.list}>
                    {todos.map((todo) => (
                        <li
                            key={todo.id}
                            className={`${styles.item} ${todo.completed ? styles.completed : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => handleToggle(todo)
                                }
                            />
                            <div className={styles.itemContent}>
                                <span className={styles.itemTitle}>{todo.title}</span>
                                {todo.description && (
                                    <span className={styles.itemDescription}>
                                        {todo.description}
                                    </span>
                                )}
                            </div>
                            <button
                                className={styles.btnRemove}
                                onClick={() => handleDelete(todo.id)}
                            >
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default TodoList;