# Peak AI - Authentication Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PEAK AI APPLICATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              FRONTEND (React Native/Expo)                │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │           UI Components (Screens)                 │ │  │
│  │  │  ┌──────────────────┐   ┌──────────────────────┐ │ │  │
│  │  │  │   LoginScreen    │   │  RegisterScreen      │ │ │  │
│  │  │  │                  │   │                      │ │ │  │
│  │  │  │ - Email Input    │   │ - Name Input         │ │ │  │
│  │  │  │ - Password Input │   │ - Email Input        │ │ │  │
│  │  │  │ - Login Button   │   │ - Password Input     │ │ │  │
│  │  │  │ - Google Button  │   │ - Confirm Password   │ │ │  │
│  │  │  └──────────────────┘   │ - Register Button    │ │ │  │
│  │  │                          │ - Google Button      │ │ │  │
│  │  │                          └──────────────────────┘ │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                           ▲                             │  │
│  │                           │ uses                        │  │
│  │                           │                             │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │        AuthContext (State Management)             │ │  │
│  │  │                                                   │ │  │
│  │  │  ├─ user (User | null)                           │ │  │
│  │  │  ├─ token (string | null)                        │ │  │
│  │  │  ├─ isAuthenticated (boolean)                    │ │  │
│  │  │  ├─ login()                                      │ │  │
│  │  │  ├─ register()                                   │ │  │
│  │  │  ├─ googleLogin()                                │ │  │
│  │  │  ├─ logout()                                     │ │  │
│  │  │  └─ updateProfile()                              │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                           ▲                             │  │
│  │                           │ calls                       │  │
│  │                           │                             │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │           API Service Client                       │ │  │
│  │  │                                                   │ │  │
│  │  │  - register(name, email, password)               │ │  │
│  │  │  - login(email, password)                        │ │  │
│  │  │  - googleAuth(idToken)                           │ │  │
│  │  │  - getCurrentUser()                              │ │  │
│  │  │  - updateProfile(name, avatar)                   │ │  │
│  │  │                                                  │ │  │
│  │  │  + Auto Token Injection (async headers)         │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                    ▲
                    │ HTTP/HTTPS
                    │ REST API
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│               BACKEND (Node.js/Express)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │           Express Routes & Controllers                    ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │  POST /api/auth/register                            │ ││
│  │  │  POST /api/auth/login                               │ ││
│  │  │  POST /api/auth/google                              │ ││
│  │  │  GET  /api/auth/me        (Protected)               │ ││
│  │  │  PUT  /api/auth/profile   (Protected)               │ ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  │                      ▲                                      ││
│  │                      │                                      ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │     Middleware (JWT Verification)                   │ ││
│  │  │  - Extract token from headers                       │ ││
│  │  │  - Verify JWT signature                             │ ││
│  │  │  - Set userId on request                            │ ││
│  │  │  - Return 401 if invalid                            │ ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  │                      ▲                                      ││
│  │                      │                                      ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │     Auth Controller (Business Logic)                │ ││
│  │  │  - register: Create user, hash password, JWT        │ ││
│  │  │  - login: Verify credentials, generate JWT          │ ││
│  │  │  - googleAuth: Verify Google token, create/link     │ ││
│  │  │  - getCurrentUser: Return user profile              │ ││
│  │  │  - updateProfile: Update user info                  │ ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  │                      ▲                                      ││
│  │                      │                                      ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │        User Model (Mongoose Schema)                 │ ││
│  │  │  - name: String                                     │ ││
│  │  │  - email: String (unique)                           │ ││
│  │  │  - password: String (hashed with bcryptjs)          │ ││
│  │  │  - googleId: String (for OAuth)                     │ ││
│  │  │  - avatar: String                                   │ ││
│  │  │  - timestamps                                       │ ││
│  │  │                                                      │ ││
│  │  │  Methods:                                           │ ││
│  │  │  - comparePassword(): Verify password hash          │ ││
│  │  │  - pre save: Hash password before storing           │ ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  └────────────────────────────────────────────────────────────┘│
│                           ▲                                     │
│                           │ Mongoose ORM                        │
│                           │                                     │
│  ┌────────────────────────────────────────────────────────────┐│
│  │            Database Connection (MongoDB)                  ││
│  │                                                            ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │  users collection                                   │ ││
│  │  │  ┌──────────────────────────────────────────────┐   │ ││
│  │  │  │ _id: ObjectId                               │   │ ││
│  │  │  │ name: String                                │   │ ││
│  │  │  │ email: String (indexed, unique)             │   │ ││
│  │  │  │ password: String (bcrypt hash)              │   │ ││
│  │  │  │ googleId: String (indexed, sparse)          │   │ ││
│  │  │  │ avatar: String                              │   │ ││
│  │  │  │ createdAt: Date                             │   │ ││
│  │  │  │ updatedAt: Date                             │   │ ││
│  │  │  └──────────────────────────────────────────────┘   │ ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  │                                                            ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow Diagram

### 1. Registration Flow
```
User fills registration form
         ↓
Frontend validates input
         ↓
POST /api/auth/register (name, email, password)
         ↓
Backend validates input
         ↓
Check if email exists
         ↓
Hash password with bcryptjs
         ↓
Create user in MongoDB
         ↓
Generate JWT token
         ↓
Return token + user data
         ↓
Frontend stores in AsyncStorage
         ↓
User logged in, navigate to home
```

### 2. Login Flow
```
User enters credentials
         ↓
POST /api/auth/login (email, password)
         ↓
Find user by email
         ↓
Compare password hash
         ↓
If invalid → 401 error
         ↓
Generate JWT token
         ↓
Return token + user data
         ↓
Frontend stores token
         ↓
User logged in
```

### 3. Google OAuth Flow
```
User taps "Sign in with Google"
         ↓
Frontend initiates Google Sign-In
         ↓
User authenticates with Google
         ↓
Google returns ID token
         ↓
POST /api/auth/google (idToken)
         ↓
Backend verifies token with Google
         ↓
Extract email, name, profile pic
         ↓
Check if user exists (by email or googleId)
         ↓
If new: Create user with googleId + no password
         ↓
If exists: Link googleId if needed
         ↓
Generate JWT token
         ↓
Return token + user data
         ↓
Frontend stores token
         ↓
User logged in
```

### 4. Protected Request Flow
```
User requests /api/auth/me or /api/auth/profile
         ↓
Frontend adds: Authorization: Bearer <token>
         ↓
Backend middleware extracts token
         ↓
Verify JWT signature & expiration
         ↓
If invalid → 401 Unauthorized
         ↓
If valid → Extract userId, attach to request
         ↓
Handler processes request
         ↓
Return protected resource
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Transport Layer                                        │
│  ┌───────────────────────────────────────────────────┐ │
│  │ • HTTPS/SSL (recommended in production)           │ │
│  │ • Secure cookie flags (httpOnly, secure, samesite)│ │
│  └───────────────────────────────────────────────────┘ │
│                     ▲                                   │
│                     │                                   │
│  Application Layer                                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │ • CORS protection - whitelist origins             │ │
│  │ • Rate limiting - prevent brute force             │ │
│  │ • Input validation - sanitize all inputs          │ │
│  │ • Error handling - no internal error exposure     │ │
│  └───────────────────────────────────────────────────┘ │
│                     ▲                                   │
│                     │                                   │
│  Authentication Layer                                   │
│  ┌───────────────────────────────────────────────────┐ │
│  │ • JWT with HS256 algorithm                        │ │
│  │ • Configurable expiration (7 days default)        │ │
│  │ • Token stored in secure AsyncStorage             │ │
│  │ • Automatic token refresh (future feature)        │ │
│  └───────────────────────────────────────────────────┘ │
│                     ▲                                   │
│                     │                                   │
│  Password Layer                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ • bcryptjs with 10 salt rounds                    │ │
│  │ • Password min 6 characters (configurable)        │ │
│  │ • Password never returned in responses            │ │
│  │ • Passwords selected only when needed             │ │
│  └───────────────────────────────────────────────────┘ │
│                     ▲                                   │
│                     │                                   │
│  Database Layer                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ • MongoDB connection string in env vars           │ │
│  │ • Unique email index prevents duplicates          │ │
│  │ • Password field select:false by default          │ │
│  │ • Input validation at schema level               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
FRONTEND                          API                      BACKEND
═════════                         ═══                      ═══════

                        Request with Token
User Input ─────────→ ┌──────────────────────────→ Middleware (JWT Verify)
                      │                                   ↓
                      │                           Controller Logic
                      │                                   ↓
                      │                           Database Query/Update
                      │                                   ↓
AsyncStorage ←─────────┤ Response with User Data ← Format Response
(store token)         │
                      └──────────────────────────→ (return JSON)


User Context          AuthContext Updates        API Client Calls
StateManagement       (re-render components)
```

## Component Relationships

```
AuthContext
    │
    ├─ useAuth() hook
    │   │
    │   ├─ LoginScreen
    │   │   └─ API.login()
    │   │
    │   ├─ RegisterScreen
    │   │   └─ API.register()
    │   │
    │   └─ Other Screens
    │       └─ useAuth() to access user/logout
    │
    ├─ StorageService
    │   ├─ AsyncStorage (token)
    │   └─ AsyncStorage (user)
    │
    └─ API Client
        ├─ register()
        ├─ login()
        ├─ googleAuth()
        ├─ getCurrentUser()
        └─ updateProfile()
```

## Environment Variables

```
FRONTEND (.env)
├─ REACT_APP_API_URL: Backend endpoint
└─ REACT_APP_GOOGLE_CLIENT_ID: Google OAuth client

BACKEND (.env)
├─ MongoDB
│  └─ MONGODB_URI: Connection string
├─ JWT
│  ├─ JWT_SECRET: Signing key
│  └─ JWT_EXPIRES_IN: Token lifetime
├─ Google
│  ├─ GOOGLE_CLIENT_ID: OAuth client ID
│  └─ GOOGLE_CLIENT_SECRET: OAuth secret
├─ Server
│  ├─ PORT: Listening port
│  └─ NODE_ENV: Environment
└─ CORS
   └─ FRONTEND_URL: Allowed origin
```

---

This architecture provides:
- ✅ Secure authentication with multiple methods
- ✅ Scalable backend structure
- ✅ Clean separation of concerns
- ✅ Type-safe frontend with TypeScript
- ✅ Persistent user sessions
- ✅ Protected API endpoints
- ✅ Error handling and validation
- ✅ Google OAuth integration ready
