# Secure Note-Taking Application

A simple note-taking application with user authentication and role-based access. Users can manage their own notes, while admins can manage users and access all notes.

The backend is built with Node.js, Express, TypeScript, and MongoDB. The frontend uses React and Tailwind CSS.

## Features

- User registration and login with email and password.
- JWT-based authentication.
- Password hashing with bcrypt.
- Users can create, view, update, and delete their own notes.
- Admins can manage users and view all notes.
- Role-based access for users and admins.
- Pagination for all list endpoints.
- MongoDB indexes for better query performance.
- Aggregation to group users by interests.
- `$lookup` to get posts created by a specific user.
- Public post listing and post creation for authenticated users.

The API will run at:

`http://localhost:5000/api`

### Create the First Admin

New registrations always get the `user` role. Users cannot make themselves admins during registration.

To create the first admin:

1. Register a normal account using `POST /api/auth/register`.
2. Open MongoDB Shell (`mongosh`).
3. Select your database and run:

Replace the email with your registered email.

4. Log in using `POST /api/auth/login`.
5. Use the returned JWT token to access admin routes.

After creating the first admin, you can manage other users through the admin API.

## 2. Frontend Setup

`http://localhost:3000`

The frontend connects to the deployed backend at:

`https://secure-notes-app-opqi.onrender.com/api`

## 3. API Endpoints

All API routes start with `/api`.

For protected routes, include your JWT token in the request headers:

```http
Authorization: Bearer <access-token>
```

| Method | Endpoint                     | Access      | Description                    |
| ------ | ---------------------------- | ----------- | ------------------------------ |
| GET    | `/api/health`                | Public      | Check server status            |
| POST   | `/api/auth/register`         | Public      | Register a new user            |
| POST   | `/api/auth/login`            | Public      | Login and get JWT token        |
| GET    | `/api/notes`                 | User/Admin  | Get notes                      |
| POST   | `/api/notes`                 | User/Admin  | Create a note                  |
| GET    | `/api/notes/:id`             | User/Admin  | Get a single note              |
| PATCH  | `/api/notes/:id`             | Owner       | Update a note                  |
| DELETE | `/api/notes/:id`             | Owner       | Delete a note                  |
| GET    | `/api/users`                 | Admin       | Get all users                  |
| GET    | `/api/users/:id`             | Owner/Admin | Get user profile               |
| POST   | `/api/users`                 | Admin       | Create a user                  |
| PATCH  | `/api/users/:id`             | Admin       | Update a user                  |
| DELETE | `/api/users/:id`             | Admin       | Delete a user                  |
| GET    | `/api/users/interest-groups` | Admin       | Get users grouped by interests |
| GET    | `/api/users/:id/posts`       | Public      | Get posts by a specific user   |
| GET    | `/api/posts`                 | Public      | Get all public posts           |
| POST   | `/api/posts`                 | User/Admin  | Create a post                  |

Replace `:id` with the actual MongoDB document ID when making a request.

### Example Request Bodies

**Register a user**

```json
{
  "name": "Sam Reader",
  "email": "sam@example.com",
  "password": "SecurePass123!",
  "interests": ["reading", "chess"]
}
```

**Create a note**

```json
{
  "title": "MongoDB notes",
  "content": "Review indexes and aggregation pipelines."
}
```

**Create a post**

```json
{
  "title": "My first post",
  "content": "Posts are visible to everyone."
}
```

## 4. Pagination

All list endpoints support pagination using `page` and `limit`.

Example:

```http
GET /api/notes?page=1&limit=20
```

- `page` selects the page number.
- `limit` controls how many records are returned.
- Default page is `1`.
- Default limit is `20`.
- Maximum limit is `100`.

The response includes pagination information:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

## 5. MongoDB Indexes and Aggregation

I added indexes using Mongoose's `schema.index()` method to support the queries used in the application.

**Notes collection**

- `{ owner: 1, createdAt: -1, _id: -1 }` – For getting a user's notes.
- `{ createdAt: -1, _id: -1 }` – For the admin's all-notes list.

**Users collection**

- `{ email: 1 }` – Unique index for email.
- `{ createdAt: -1, _id: -1 }` – For listing users.
- `{ interests: 1 }` – For interest-based queries.

**Posts collection**

- `{ owner: 1, createdAt: -1, _id: -1 }` – For getting posts by a user.
- `{ createdAt: -1, _id: -1 }` – For listing public posts.

MongoDB also creates a default index on `_id`, which supports finding individual documents by ID.

### Aggregation Tasks

**1. Group users by interests**

The interest-groups endpoint uses a single `User.aggregate()` call with `$unwind` and `$group` to organize users by their interests.

**2. Get posts by user**

The user-posts endpoint uses a single aggregation pipeline with `$lookup` to retrieve posts belonging to a particular user.

I also used `explain("executionStats")` to inspect query performance. Actual index usage should be checked against the target MongoDB deployment.

frontend deploy: netlify
backend deploy: render
mongoDB: mongoDB atlas
