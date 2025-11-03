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

  list(
    filter?: { completed?: boolean },
    options?: {
      sortBy?: "id" | "createdAt" | "updatedAt" | "title";
      order?: "asc" | "desc";
      offset?: number;
      limit?: number;
    },
  ) {
    let items = Array.from(this.#todos.values());
    if (filter?.completed !== undefined) {
      items = items.filter((todo) => todo.completed === filter.completed);
    }

    const total = items.length;

    const sortBy = options?.sortBy ?? "id";
    const order = options?.order ?? "asc";
    items.sort((a, b) => {
      let av: number | string | Date;
      let bv: number | string | Date;
      switch (sortBy) {
        case "createdAt":
          av = a.createdAt;
          bv = b.createdAt;
          break;
        case "updatedAt":
          av = a.updatedAt;
          bv = b.updatedAt;
          break;
        case "title":
          av = a.title.toLowerCase();
          bv = b.title.toLowerCase();
          break;
        case "id":
        default:
          av = a.id;
          bv = b.id;
      }
      if (av < (bv as any)) return order === "asc" ? -1 : 1;
      if (av > (bv as any)) return order === "asc" ? 1 : -1;
      return 0;
    });

    const offset = Math.max(0, options?.offset ?? 0);
    const limit = Math.max(0, options?.limit ?? items.length);
    const paged = items.slice(offset, offset + limit);
    return { items: paged, total };
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

  deleteMany(filter?: { completed?: boolean }) {
    const before = this.#todos.size;
    if (filter?.completed === undefined) {
      // no-op: require a filter to avoid accidental wipe
      return 0;
    }
    for (const [id, todo] of this.#todos) {
      if (todo.completed === filter.completed) this.#todos.delete(id);
    }
    const removed = before - this.#todos.size;
    if (removed > 0)
      this.#save().catch((e) => console.error("Erro ao salvar dados:", e));
    return removed;
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
