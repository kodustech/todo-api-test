## Todo API com Bun

### Pré-requisitos
- [Bun](https://bun.sh) >= 1.0 instalado localmente.

### Como rodar
```bash
bun install
bun run src/server.ts
```

> Use `bun run --watch src/server.ts` para modo de desenvolvimento com recarga automática.

### Configuração
- Variáveis de ambiente:
  - `PORT` (opcional): porta do servidor. Padrão `3000`.
  - `DATA_FILE` (opcional): caminho do arquivo de persistência. Padrão `data/todos.json`.

Os dados agora são persistidos em disco (JSON). Ao iniciar, a API carrega o arquivo, e a cada criação/atualização/remoção grava novamente. As datas são armazenadas em ISO 8601.

### Rotas disponíveis
- `GET /health` — Verifica se a API está respondendo.
- `GET /` — Mensagem simples de boas-vindas.
- `GET /todos` — Lista todos os itens; use `GET /todos?completed=true|false` para filtrar por status.
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

> As respostas incluem `createdAt` e `updatedAt` em formato ISO 8601.

### Logs
Cada requisição gera um log no stdout com método, rota, status e duração em milissegundos.
