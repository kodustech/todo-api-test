## Todo API com Bun

### Pré-requisitos
- [Bun](https://bun.sh) >= 1.0 instalado localmente.

### Como rodar
```bash
bun install
bun run src/server.ts
```

> Use `bun run --watch src/server.ts` para modo de desenvolvimento com recarga automática.

### Rotas disponíveis
- `GET /health` — Verifica se a API está respondendo.
- `GET /todos` — Lista todos os itens.
- `POST /todos` — Cria um novo todo. Corpo esperado:
  ```json
  {
    "title": "Comprar leite",
    "completed": false
  }
  ```
- `GET /todos/:id` — Recupera um item pelo `id`.
- `PATCH /todos/:id` — Atualiza campos `title` e/ou `completed`.
- `DELETE /todos/:id` — Remove um item.

> O armazenamento é apenas em memória, ideal para prototipação rápida.
