# Todo List API - MVP v1

A comprehensive REST API for managing tasks/todos, implemented according to the provided specification.

## 🚀 Features

- **Complete REST API** with all endpoints from the specification
- **Authentication** via Bearer tokens
- **Rate Limiting** (120 req/min per token)
- **Idempotency** support for POST requests
- **ETags & Concurrency Control** for optimistic locking
- **Comprehensive Filtering** (status, listId, assigneeId, tag, due date, text search)
- **Pagination** with cursor-based approach
- **Sorting** (single field support)
- **Validation** using Zod schemas
- **Error Handling** with detailed error responses
- **TypeScript** for type safety

## 📋 API Specification Compliance

This implementation fully complies with the Todo List API MVP v1 specification, including:

- ✅ All required endpoints (`/health`, `/tasks`, task CRUD operations)
- ✅ Authentication via Bearer tokens
- ✅ Request/response formats
- ✅ Error handling and status codes
- ✅ Filtering, pagination, and sorting
- ✅ Idempotency and concurrency control
- ✅ Rate limiting
- ✅ Data validation
- ✅ 501 responses for unimplemented features (Lists, Comments, Webhooks, Batch)

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Validation**: Zod
- **Security**: Helmet, CORS
- **Rate Limiting**: express-rate-limit
- **UUID Generation**: uuid

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone or navigate to the project
cd /Users/gabrielmalinosqui/Documents/dev/todo-api

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run linting
npm run lint

# Run tests (when implemented)
npm test
```

## 🔑 Authentication

The API uses Bearer token authentication. For testing, use one of these tokens:

- `test-token-123`
- `dev-token-456`

Example:
```bash
curl -H "Authorization: Bearer test-token-123" \
     http://localhost:3000/v1/tasks
```

## 📚 API Endpoints

### Health Check
```http
GET /v1/health
```

### Tasks

#### List Tasks
```http
GET /v1/tasks
```

Query Parameters:
- `filter[status]`: Comma-separated values (e.g., `open,in_progress`)
- `filter[listId]`: List ID filter
- `filter[assigneeId]`: Assignee ID filter
- `filter[tag]`: Tag filter
- `filter[dueAt][lte/gte]`: Due date filters
- `filter[q]`: Text search (prefix match on title)
- `sort`: Sort field (e.g., `dueAt`, `-createdAt`)
- `page[limit]`: Page limit (1-200, default 50)
- `page[after/before]`: Cursor-based pagination

#### Create Task
```http
POST /v1/tasks
```

Headers:
- `Idempotency-Key`: UUID v4 (optional but recommended)

#### Get Single Task
```http
GET /v1/tasks/{taskId}
```

#### Update Task
```http
PATCH /v1/tasks/{taskId}
```

Headers:
- `If-Match`: ETag for concurrency control (optional)

#### Complete Task
```http
POST /v1/tasks/{taskId}:complete
```

#### Reopen Task
```http
POST /v1/tasks/{taskId}:reopen
```

## 🧪 Testing Examples

### 1. Health Check
```bash
curl http://localhost:3001/v1/health
```

### 2. List Tasks
```bash
curl -H "Authorization: Bearer test-token-123" \
     "http://localhost:3001/v1/tasks?filter%5Bstatus%5D=open&page%5Blimit%5D=10"
```

### 3. Create Task
```bash
curl -X POST -H "Authorization: Bearer test-token-123" \
     -H "Content-Type: application/json" \
     -H "Idempotency-Key: $(uuidgen)" \
     -d '{
       "listId": "lst_01HV7E1Z9PABCDE",
       "title": "Review contract",
       "description": "Check clauses 3 and 5",
       "priority": "medium",
       "assignees": ["usr_01AB"],
       "tags": ["legal", "Q3"],
       "checklist": [{"title": "Clause 3"}, {"title": "Clause 5"}]
     }' \
     http://localhost:3000/v1/tasks
```

### 4. Get Single Task
```bash
curl -H "Authorization: Bearer test-token-123" \
     http://localhost:3000/v1/tasks/tsk_01HV7E2D1KXW3M2C3B4A5
```

### 5. Update Task
```bash
curl -X PATCH -H "Authorization: Bearer test-token-123" \
     -H "Content-Type: application/json" \
     -H "If-Match: \"3\"" \
     -d '{"status": "in_progress", "priority": "high"}' \
     http://localhost:3000/v1/tasks/tsk_01HV7E2D1KXW3M2C3B4A5
```

### 6. Complete Task
```bash
curl -X POST -H "Authorization: Bearer test-token-123" \
     http://localhost:3000/v1/tasks/tsk_01HV7E2D1KXW3M2C3B4A5:complete
```

## 📊 Data Models

### Task
```typescript
{
  id: string;              // tsk_01HV7E2D1KXW3M2C3B4A5
  listId: string;          // lst_01HV7E1Z9PABCDE
  title: string;           // Required, 1-240 chars
  description?: string;
  status: 'open' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueAt?: string;          // ISO-8601
  completedAt?: string | null;
  assigneeIds: string[];   // Output field
  tags: string[];
  checklist: Array<{
    id: string;
    title: string;
    checked: boolean;
  }>;
  createdAt: string;       // ISO-8601
  updatedAt: string;       // ISO-8601
  version: number;         // Integer, incremented on updates
}
```

## 🔒 Security Features

- **Helmet.js** for security headers
- **CORS** configuration
- **Rate limiting** (120 req/min per token)
- **Input validation** with Zod
- **Bearer token authentication**
- **Request ID tracking**
- **Error sanitization**

## 🚧 MVP Limitations

As per specification, the following are not implemented (return 501):

- Lists management (`/v1/lists`)
- Comments (`/v1/comments`)
- Webhooks (`/v1/webhooks`)
- Batch operations (`/v1/batch`)

## 📝 Development Notes

- Uses in-memory storage for MVP (would be replaced with database in production)
- Implements cursor-based pagination (simplified for MVP)
- Supports prefix text search on titles only
- ETag-based concurrency control
- Idempotency for POST operations
- Comprehensive error handling and validation

## 🤝 Contributing

1. Follow the existing code style and TypeScript conventions
2. Add appropriate validation and error handling
3. Update documentation as needed
4. Test thoroughly with the provided examples

---

**API Base URL**: `http://localhost:3001/v1`
**Health Check**: `http://localhost:3001/v1/health`
