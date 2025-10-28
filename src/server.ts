type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

const todos = new Map<number, Todo>();
let nextId = 1;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (data: unknown, init?: ResponseInit) => {
  const body = JSON.stringify(data);
  const headers = {
    "Content-Type": "application/json",
    ...corsHeaders,
    ...(init?.headers ?? {}),
  };

  return new Response(body, {
    ...init,
    headers,
  });
};

const text = (value: string, init?: ResponseInit) =>
  new Response(value, {
    ...init,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return text("ok");
    }

    if (url.pathname === "/todos" && req.method === "GET") {
      return json(Array.from(todos.values()));
    }

    if (url.pathname === "/todos" && req.method === "POST") {
      let payload: Record<string, unknown>;
      try {
        payload = await req.json();
      } catch {
        return json({ error: "Invalid JSON body" }, { status: 400 });
      }

      const title = typeof payload.title === "string" ? payload.title.trim() : "";
      const completed =
        payload.completed === undefined ? false : Boolean(payload.completed);

      if (!title) {
        return json({ error: "Field 'title' is required" }, { status: 400 });
      }

      const todo: Todo = {
        id: nextId++,
        title,
        completed,
      };

      todos.set(todo.id, todo);
      return json(todo, { status: 201 });
    }

    const todoIdMatch = url.pathname.match(/^\/todos\/(\d+)$/);
    if (todoIdMatch) {
      const id = Number.parseInt(todoIdMatch[1], 10);
      const existing = todos.get(id);

      if (!existing) {
        return json({ error: "Todo not found" }, { status: 404 });
      }

      if (req.method === "GET") {
        return json(existing);
      }

      if (req.method === "PATCH") {
        let payload: Record<string, unknown>;
        try {
          payload = await req.json();
        } catch {
          return json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const updated: Todo = { ...existing };

        if (payload.title !== undefined) {
          if (typeof payload.title !== "string" || !payload.title.trim()) {
            return json(
              { error: "Field 'title' must be a non-empty string" },
              { status: 400 },
            );
          }

          updated.title = payload.title.trim();
        }

        if (payload.completed !== undefined) {
          if (typeof payload.completed !== "boolean") {
            return json(
              { error: "Field 'completed' must be a boolean" },
              { status: 400 },
            );
          }

          updated.completed = payload.completed;
        }

        todos.set(updated.id, updated);
        return json(updated);
      }

      if (req.method === "DELETE") {
        todos.delete(id);
        return new Response(null, { status: 204, headers: corsHeaders });
      }
    }

    return json({ error: "Not Found" }, { status: 404 });
  },
});

console.log(
  `Todo API ouvindo em http://localhost:${server.port} (pid ${process.pid})`,
);
