export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTodoInput = {
  title: string;
  completed?: boolean;
};

export type UpdateTodoInput = {
  title?: string;
  completed?: boolean;
};

class TodoStore {
  #todos = new Map<number, Todo>();
  #nextId = 1;

  list(filter?: { completed?: boolean }) {
    let items = Array.from(this.#todos.values());
    if (filter?.completed !== undefined) {
      items = items.filter((todo) => todo.completed === filter.completed);
    }

    return items;
  }

  get(id: number) {
    return this.#todos.get(id);
  }

  create(input: CreateTodoInput) {
    const now = new Date();
    const todo: Todo = {
      id: this.#nextId++,
      title: input.title,
      completed: input.completed ?? false,
      createdAt: now,
      updatedAt: now,
    };

    this.#todos.set(todo.id, todo);
    return todo;
  }

  update(id: number, input: UpdateTodoInput) {
    const existing = this.#todos.get(id);
    if (!existing) return;

    const updated: Todo = {
      ...existing,
      ...input,
      updatedAt: new Date(),
    };

    this.#todos.set(id, updated);
    return updated;
  }

  delete(id: number) {
    return this.#todos.delete(id);
  }
}

export const todoStore = new TodoStore();
