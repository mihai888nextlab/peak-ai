# Peak AI - Full Stack Authentication System

## Summary

I've successfully created a complete authentication system for your Peak AI application with:

### ✅ Backend (Node.js/Express + MongoDB)
- Email/password registration and login with bcrypt hashing
- Google OAuth 2.0 integration
- JWT-based authentication
- User profile management
- MongoDB schema with secure password storage
- TypeScript for type safety

### ✅ Frontend (React Native/Expo)
- Login screen with email/password
- Registration screen with validation
- Google OAuth button (ready to implement)
- Authentication context (React Context API)
- Persistent authentication (AsyncStorage)
- Protected API client
- Error handling and user feedback

---

## Created Files Structure

### Backend Files
```
backend/
├── src/
│   ├── index.ts                          - Express server entry point
│   ├── config/
│   │   └── database.ts                   - MongoDB connection
│   ├── models/
│   │   └── User.ts                       - User schema with password hashing
│   ├── controllers/
│   │   └── authController.ts             - Auth business logic
│   ├── middleware/
│   │   └── auth.ts                       - JWT verification middleware
│   └── routes/
│       └── authRoutes.ts                 - API endpoints
├── package.json                          - Dependencies
├── tsconfig.json                         - TypeScript config
├── .env.example                          - Environment variables template
├── README.md                             - Backend documentation
└── node_modules/                         - (will be created with npm install)
```

### Frontend Files
```
src/
├── types/
│   └── auth.ts                          - TypeScript interfaces
├── services/
│   ├── api.ts                           - API client with fetch
│   └── storage.ts                       - AsyncStorage wrapper
├── context/
│   └── AuthContext.tsx                  - Authentication state management
├── components/
│   └── AuthComponents.tsx               - Reusable auth UI components
└── screens/
    ├── LoginScreen.tsx                  - Login UI
    ├── RegisterScreen.tsx               - Register UI
    ├── BriefScreen.tsx                  - (existing)
    ├── CoachScreen.tsx                  - (existing)
    ├── FuelScreen.tsx                   - (existing)
    ├── RecoverScreen.tsx                - (existing)
    └── TrainScreen.tsx                  - (existing)

.env.example                             - Frontend config template
package.json                             - Updated with auth dependencies
```

### Documentation
```
QUICK_START.md                           - 30-minute setup guide
FULL_SETUP_GUIDE.md                      - Comprehensive setup & deployment
.env.example                             - Frontend env template
backend/.env.example                     - Backend env template
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response (201):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  }
}
```

#### 2. Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response (200): Same as Register
```

#### 3. Google OAuth
```
POST /api/auth/google
Content-Type: application/json

{
  "idToken": "google_id_token_from_frontend"
}

Response (200): Same as Register
```

#### 4. Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "user": { ... }
}
```

#### 5. Update Profile
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "avatar": "https://example.com/avatar.jpg"
}

Response (200): User object
```

---

## Key Features Implemented

### Backend Features
✅ **User Model**
- Name, Email, Password (hashed with bcrypt)
- Google ID for OAuth
- Avatar URL
- Timestamps (createdAt, updatedAt)

✅ **Authentication**
- Password hashing with bcryptjs (10 rounds)
- JWT tokens with configurable expiration
- Email validation
- Password strength validation

✅ **Google OAuth**
- Token verification with Google Auth Library
- Auto-linking accounts
- Avatar sync from Google profile

✅ **Security**
- Password is never returned in responses
- CORS protection
- Input validation
- Error handling without exposing sensitive info

### Frontend Features
✅ **AuthContext**
- User state management
- Token persistence
- Auto-login on app start
- Logout functionality

✅ **API Client**
- Automatic token injection
- Error handling
- Fetch-based (no additional dependencies)
- TypeScript support

✅ **UI Components**
- Login screen with email/password
- Register screen with password confirmation
- Reusable auth components
- Loading states
- Error alerts
- Theme-aware styling

✅ **Storage**
- AsyncStorage for token persistence
- User data caching
- Secure cleanup on logout

---

## Setup Instructions (Quick)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### 2. Frontend Setup
```bash
npm install
cp .env.example .env
# Edit .env with your API URL
npm start
```

### 3. Configure MongoDB
1. Create account at mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Add to backend `.env`

### 4. Configure Google OAuth (Optional)
1. Visit console.cloud.google.com
2. Create project and enable Google+ API
3. Create OAuth credentials
4. Add redirect URIs
5. Copy Client ID & Secret to `.env`

---

## Usage in Your App

### Wrap App with AuthProvider
```tsx
// App wrapper or main entry
import { AuthProvider } from './src/context/AuthContext';

export default function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
```

### Use Authentication Hook
```tsx
import { useAuth } from './src/context/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <View>
      <Text>Welcome, {user?.name}!</Text>
      <Button onPress={logout} title="Logout" />
    </View>
  );
}
```

### Make Authenticated API Calls
The API client automatically includes the token in all requests once a user is authenticated.

---

## Database Schema

### User Collection
```json
{
  "_id": ObjectId,
  "name": String (required),
  "email": String (required, unique, validated),
  "password": String (hashed, optional for OAuth users),
  "googleId": String (optional),
  "avatar": String (optional),
  "createdAt": Date,
  "updatedAt": Date
}
```

### Indexes
- email: unique, sparse
- googleId: sparse

---

## Dependencies Added

### Backend
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `google-auth-library` - Google OAuth verification
- `cors` - Cross-origin support
- `dotenv` - Environment variables
- `typescript`, `ts-node` - TypeScript support

### Frontend
- `@react-native-async-storage/async-storage` - Persistent storage
- `expo-google-app-auth` - Google Sign-In (optional)

---

## Security Considerations

✅ **Implemented**
- Password hashing with bcryptjs
- JWT for stateless auth
- Password not returned in responses
- CORS protection
- Environment variables for secrets
- Input validation
- Error handling without exposing internals

🔒 **Recommendations**
- Use strong JWT_SECRET (32+ characters)
- Enable HTTPS in production
- Implement rate limiting
- Add email verification
- Add password reset flow
- Implement refresh tokens
- Add request validation with Joi/Yup
- Use helmet for security headers
- Implement 2FA

---

## Next Steps

1. **Implement Google Sign-In Integration**
   - Add `expo-google-sign-in` package
   - Integrate with existing button
   - Test on mobile devices

2. **Add Email Verification**
   - Send verification email on register
   - Verify before login

3. **Password Reset**
   - Forgot password endpoint
   - Email with reset link
   - Reset password form

4. **Additional Auth Methods**
   - Apple Sign-In
   - Facebook OAuth
   - GitHub OAuth

5. **User Profile**
   - Edit profile screen
   - Upload avatar
   - Manage preferences

6. **Enhanced Security**
   - Refresh tokens
   - Rate limiting
   - Request validation
   - Security headers

---

## Testing the Application

### Test with cURL
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get user (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/auth/me
```

### Test in Frontend
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm start`
3. Press 'w' for web
4. Click "Register" and create a test account
5. Login with test account
6. Verify user data displays correctly

---

## File Reference

### Auth Context - [src/context/AuthContext.tsx](src/context/AuthContext.tsx)
Manages authentication state globally. Provides `useAuth()` hook.

### API Client - [src/services/api.ts](src/services/api.ts)
Handles all API calls with automatic token injection.

### Auth Screens - [src/screens/LoginScreen.tsx](src/screens/LoginScreen.tsx), [src/screens/RegisterScreen.tsx](src/screens/RegisterScreen.tsx)
User interface for authentication.

### Controllers - [backend/src/controllers/authController.ts](backend/src/controllers/authController.ts)
Business logic for authentication.

### User Model - [backend/src/models/User.ts](backend/src/models/User.ts)
Database schema and password hashing.

---

## Support & Resources

- **MongoDB Documentation**: https://docs.mongodb.com
- **Express.js**: https://expressjs.com
- **React Native**: https://reactnative.dev
- **Expo**: https://docs.expo.dev
- **JWT**: https://jwt.io
- **Google OAuth**: https://developers.google.com/identity

---

## Questions?

Refer to:
1. `QUICK_START.md` - For rapid setup
2. `FULL_SETUP_GUIDE.md` - For detailed instructions
3. `backend/README.md` - For API documentation
4. Individual file comments - For code explanations

Your authentication system is ready to use! 🚀
