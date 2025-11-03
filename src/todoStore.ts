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
  #dataFile?: string;

  constructor(dataFile?: string) {
    this.#dataFile = dataFile;
  }

  async init() {
    if (!this.#dataFile) return;
    try {
      const file = Bun.file(this.#dataFile);
      if (await file.exists()) {
        const raw = await file.text();
        if (raw.trim().length) {
          const data = JSON.parse(raw) as Array<{
            id: number;
            title: string;
            completed: boolean;
            createdAt: string;
            updatedAt: string;
          }>;
          for (const t of data) {
            this.#todos.set(t.id, {
              id: t.id,
              title: t.title,
              completed: t.completed,
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
            });
          }
          // compute nextId
          const maxId = Math.max(0, ...Array.from(this.#todos.keys()));
          this.#nextId = maxId + 1;
        }
      } else {
        // ensure directory exists
        await this.#ensureDir();
        await Bun.write(this.#dataFile, "[]\n");
      }
    } catch (err) {
      console.error("Falha ao carregar os dados:", err);
    }
  }

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
    this.#save().catch((e) => console.error("Erro ao salvar dados:", e));
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
    this.#save().catch((e) => console.error("Erro ao salvar dados:", e));
    return updated;
  }

  delete(id: number) {
    const ok = this.#todos.delete(id);
    if (ok) this.#save().catch((e) => console.error("Erro ao salvar dados:", e));
    return ok;
  }

  async #ensureDir() {
    if (!this.#dataFile) return;
    const path = await import("node:path");
    const fs = await import("node:fs/promises");
    const dir = path.dirname(this.#dataFile);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {}
  }

  async #save() {
    if (!this.#dataFile) return;
    const data = Array.from(this.#todos.values()).map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));
    await this.#ensureDir();
    await Bun.write(this.#dataFile, JSON.stringify(data, null, 2) + "\n");
  }
}

const dataFile = process.env.DATA_FILE ?? "data/todos.json";
export const todoStore = new TodoStore(dataFile);
export const initTodoStore = () => todoStore.init();
