# Auth & Admin Infrastructure Specification

## Tech Stack
- **Framework**: Next.js 16.2.4 (App Router)
- **Auth**: NextAuth.js v5 (beta) with Credentials provider
- **Database**: SQLite via better-sqlite3
- **Password Hashing**: bcryptjs
- **Validation**: Zod (already installed)

---

## Core Features

### 1. User Management
- [ ] Users table: id, email, name, password_hash, role, created_at, updated_at
- [ ] Roles: `admin`, `manager`, `user` (lowest permissions)
- [ ] CRUD operations for admin panel

### 2. Authentication
- [ ] Credentials login (email + password)
- [ ] JWT sessions
- [ ] Protected routes via middleware
- [ ] Logout functionality

### 3. Authorization
- [ ] Role-based access control (RBAC)
- [ ] Middleware to block unauthorized routes
- [ ] Component-level permission checks

### 4. Admin Panel
- [ ] User list table with search/filter
- [ ] Create new user form
- [ ] Edit user (name, email, role)
- [ ] Delete user (soft delete or hard delete)
- [ ] Only admins can access /admin

---

## File Structure

```
/app
  /api/auth/[...nextauth]/route.ts    # NextAuth handler
  /api/users/route.ts                 # Users CRUD API
  /api/users/[id]/route.ts            # Single user API
  /login/page.tsx                     # Login page
  /admin
    /page.tsx                         # Admin dashboard
    /users/page.tsx                   # User management
/authcallback/...
/lib
  /db.ts                              # SQLite connection
  /auth.ts                            # Auth options
  /(utils)                            # Helper functions
/components
  /auth/                              # Login form, etc.
  /admin/                             # Admin UI components
```

---

## Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'user')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);
```

---

## Roles & Permissions

| Route/Action       | admin | manager | user |
|-------------------|-------|---------|------|
| /admin            | ✓    | ✗      | ✗    |
| /admin/users      | ✓    | ✗      | ✗    |
| View all data     | ✓    | ✓      | ✗    |
| Edit own profile | ✓    | ✓      | ✓    |
| View dashboard   | ✓    | ✓      | ✓    |

---

## Implementation Steps

### Step 1: Database Setup
- Create `/lib/db.ts` - SQLite connection + table initialization
- Seed an initial admin user (email: admin@example.com, password: change-me)

### Step 2: NextAuth Configuration
- Create `/lib/auth.ts` - NextAuth options with credentials provider
- Configure callbacks to include `role` in session
- Create `/app/api/auth/[...nextauth]/route.ts`

### Step 3: Auth Utilities
- Password hashing/decoding helpers
- `getSession()` helper for server components
- `requireAuth()` for protected actions

### Step 4: Middleware
- Create `/middleware.ts` to protect routes based on role
- Exclude public routes: /login, /api/auth, static files

### Step 5: Login Page
- `/app/login/page.tsx` - Clean login form with validation
- Use existing UI components (shadcn)

### Step 6: Admin Panel Pages
- `/app/admin/page.tsx` - Overview stats
- `/app/admin/users/page.tsx` - User table with CRUD

### Step 7: User API Routes
- GET /api/users - list users (admin only)
- POST /api/users - create user
- PATCH /api/users/[id] - update user
- DELETE /api/users/[id] - delete user

---

## Security Considerations

- Never expose password_hash in API responses
- Validate all inputs with Zod
- Use prepared statements for SQLite queries
- Hash passwords with bcrypt (12 rounds)
- HTTP-only cookies for sessions

---

## Initial Seed Data

Create first admin user:
- Email: admin@example.com
- Password: admin123 (force change on first login)
- Role: admin