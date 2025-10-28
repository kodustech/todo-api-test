import { todoStore, type CreateTodoInput } from "./todoStore";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

const todosPattern = new URLPattern({ pathname: "/todos" });
const todoIdPattern = new URLPattern({ pathname: "/todos/:id" });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });

const text = (value: string, init?: ResponseInit) =>
  new Response(value, {
    ...init,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });

const methodNotAllowed = () =>
  json({ error: "Method Not Allowed" }, { status: 405 });

const notFound = () => json({ error: "Not Found" }, { status: 404 });

const noContent = (status = 204) =>
  new Response(null, { status, headers: corsHeaders });

const safeJsonBody = async (req: Request) => {
  try {
    return {
      ok: true as const,
      value: (await req.json()) as unknown,
    };
  } catch {
    return {
      ok: false as const,
      error: "Invalid JSON body",
    };
  }
};

const ensureJson = (req: Request) => {
  const contentType = req.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
};

const parseCreateInput = (payload: unknown) => {
  if (!isRecord(payload)) {
    return { ok: false as const, error: "Body must be an object" };
  }

  const rawTitle = payload.title;
  if (typeof rawTitle !== "string" || !rawTitle.trim()) {
    return {
      ok: false as const,
      error: "Field 'title' is required and must be a non-empty string",
    };
  }

  const completed = payload.completed;
  if (completed !== undefined && typeof completed !== "boolean") {
    return {
      ok: false as const,
      error: "Field 'completed' must be a boolean",
    };
  }

  const input: CreateTodoInput = {
    title: rawTitle.trim(),
    completed,
  };

  return { ok: true as const, value: input };
};

const parseUpdateInput = (payload: unknown) => {
  if (!isRecord(payload)) {
    return { ok: false as const, error: "Body must be an object" };
  }

  const hasTitle = Object.prototype.hasOwnProperty.call(payload, "title");
  const hasCompleted = Object.prototype.hasOwnProperty.call(
    payload,
    "completed",
  );

  if (!hasTitle && !hasCompleted) {
    return {
      ok: false as const,
      error: "Provide at least one field: 'title' or 'completed'",
    };
  }

  const update: { title?: string; completed?: boolean } = {};

  if (hasTitle) {
    if (typeof payload.title !== "string" || !payload.title.trim()) {
      return {
        ok: false as const,
        error: "Field 'title' must be a non-empty string",
      };
    }

    update.title = payload.title.trim();
  }

  if (hasCompleted) {
    if (typeof payload.completed !== "boolean") {
      return {
        ok: false as const,
        error: "Field 'completed' must be a boolean",
      };
    }

    update.completed = payload.completed;
  }

  return { ok: true as const, value: update };
};

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

    const todosMatch = todosPattern.exec(req.url);
    if (todosMatch) {
      if (req.method === "GET") {
        const completedParam = url.searchParams.get("completed");
        if (
          completedParam !== null &&
          completedParam !== "true" &&
          completedParam !== "false"
        ) {
          return json(
            {
              error: "Parameter 'completed' must be either 'true' or 'false'",
            },
            { status: 400 },
          );
        }

        const filter =
          completedParam === null
            ? {}
            : { completed: completedParam === "true" };

        return json(todoStore.list(filter));
      }

      if (req.method === "POST") {
        if (!ensureJson(req)) {
          return json(
            { error: "Content-Type must be application/json" },
            { status: 415 },
          );
        }

        const parsed = await safeJsonBody(req);
        if (!parsed.ok) {
          return json({ error: parsed.error }, { status: 400 });
        }

        const validated = parseCreateInput(parsed.value);
        if (!validated.ok) {
          return json({ error: validated.error }, { status: 400 });
        }

        const todo = todoStore.create(validated.value);
        return json(todo, { status: 201 });
      }

      return methodNotAllowed();
    }

    const todoMatch = todoIdPattern.exec(req.url);
    if (todoMatch) {
      const idParam = todoMatch.pathname.groups.id;
      const id = Number.parseInt(idParam ?? "", 10);
      if (!Number.isFinite(id)) {
        return json({ error: "Invalid id" }, { status: 400 });
      }

      const existing = todoStore.get(id);
      if (!existing) {
        return notFound();
      }

      if (req.method === "GET") {
        return json(existing);
      }

      if (req.method === "PATCH") {
        if (!ensureJson(req)) {
          return json(
            { error: "Content-Type must be application/json" },
            { status: 415 },
          );
        }

        const parsed = await safeJsonBody(req);
        if (!parsed.ok) {
          return json({ error: parsed.error }, { status: 400 });
        }

        const validated = parseUpdateInput(parsed.value);
        if (!validated.ok) {
          return json({ error: validated.error }, { status: 400 });
        }

        const updated = todoStore.update(id, validated.value);
        return json(updated);
      }

      if (req.method === "DELETE") {
        todoStore.delete(id);
        return noContent();
      }

      return methodNotAllowed();
    }

    return notFound();
  },
});

console.log(
  `Todo API ouvindo em http://localhost:${server.port} (pid ${process.pid})`,
);
