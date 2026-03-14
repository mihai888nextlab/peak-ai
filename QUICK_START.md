# Quick Start Guide - Peak AI Authentication

## 30-Minute Setup

### Backend (10 minutes)

1. **Create MongoDB Database**
   - Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster and get your connection string

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

3. **Configure .env**
   ```env
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/peak-ai
   JWT_SECRET=your_random_secret_key_here
   PORT=5000
   ```

4. **Start Backend**
   ```bash
   npm run dev
   ```

### Google OAuth (Optional - 5 minutes)

1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable Google+ API
3. Create OAuth 2.0 credentials (Web)
4. Add redirect URIs: `http://localhost:5000`, `http://localhost:19000`
5. Copy Client ID & Secret to backend `.env`

### Frontend (15 minutes)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure .env**
   ```bash
   cp .env.example .env
   ```
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start Frontend**
   ```bash
   npm start
   ```

4. **Test**
   - Press 'w' for web
   - Click "Register" or "Login"
   - Test email/password authentication

---

## Testing Email/Password Auth

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

## File Structure

```
✅ Backend
├── src/
│   ├── config/database.ts      - MongoDB connection
│   ├── models/User.ts          - User schema with password hashing
│   ├── controllers/authController.ts - Auth logic
│   ├── middleware/auth.ts      - JWT verification
│   ├── routes/authRoutes.ts    - API endpoints
│   └── index.ts                - Express server

✅ Frontend
├── src/
│   ├── types/auth.ts           - TypeScript interfaces
│   ├── services/
│   │   ├── api.ts              - API client
│   │   └── storage.ts          - AsyncStorage helper
│   ├── context/AuthContext.tsx - State management
│   ├── components/
│   │   └── AuthComponents.tsx  - Reusable UI components
│   └── screens/
│       ├── LoginScreen.tsx     - Login UI
│       └── RegisterScreen.tsx  - Register UI
```

---

## API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login user |
| POST | `/api/auth/google` | No | Google OAuth |
| GET | `/api/auth/me` | Yes | Get current user |
| PUT | `/api/auth/profile` | Yes | Update profile |

---

## Next Step: Integrate Auth Screens

To use auth in your app, wrap App.tsx with AuthProvider:

```tsx
import { AuthProvider } from './src/context/AuthContext';

export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
```

Then use `useAuth()` hook in any component:

```tsx
const { user, login, logout, isAuthenticated } = useAuth();
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection error | Check IP whitelist in Atlas |
| CORS error | Verify `FRONTEND_URL` in backend `.env` |
| Token invalid | Ensure `JWT_SECRET` matches |
| Port 5000 in use | `pkill -f "node"` or change PORT |

---

See [FULL_SETUP_GUIDE.md](./FULL_SETUP_GUIDE.md) for detailed setup instructions.
