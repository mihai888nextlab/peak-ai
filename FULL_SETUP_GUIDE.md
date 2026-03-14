# Peak AI - Full Stack Setup Guide

This guide covers setting up the entire application with authentication, including the Expo frontend and Node.js/Express backend with MongoDB.

## Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB account (Atlas)
- Google Cloud Console account (for OAuth)
- Expo CLI (`npm install -g expo-cli`)

---

## Part 1: Backend Setup

### 1.1 Create MongoDB Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or log in
3. Create a new cluster (Free tier)
4. Once the cluster is created, click "Connect"
5. Choose "Drivers"
6. Copy the connection string (you'll need the MongoDB URI)

### 1.2 Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/peak-ai?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 1.3 Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:5000`
   - `http://localhost:3000`
   - `http://localhost:19000` (Expo)
   - Your production URLs
7. Copy Client ID and Secret to `.env`

### 1.4 Install Dependencies & Start Backend

```bash
cd backend
npm install

# Development
npm run dev

# Or build and run production
npm run build
npm start
```

The backend should now be running on `http://localhost:5000`.

---

## Part 2: Frontend Setup

### 2.1 Install Dependencies

```bash
cd ..
npm install
```

### 2.2 Configure Frontend Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

**Note:** For mobile, you'll need to configure Google Sign-In differently (see section 2.3).

### 2.3 Update app.json for Google Sign-In

For iOS and Android, update your `app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-font",
      [
        "expo-google-app-auth",
        {
          "projectId": "your-google-project-id"
        }
      ]
    ],
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### 2.4 Run Frontend

```bash
# Start Expo
npm start

# Then choose:
# - Press 'i' for iOS
# - Press 'a' for Android
# - Press 'w' for Web
```

---

## Part 3: Testing the Application

### 3.1 Test Email/Password Registration

Make a POST request to `http://localhost:5000/api/auth/register`:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": null
  }
}
```

### 3.2 Test Email/Password Login

Make a POST request to `http://localhost:5000/api/auth/login`:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### 3.3 Test Google OAuth

1. Get an ID token from Google Sign-In
2. Make a POST request to `http://localhost:5000/api/auth/google`:

```json
{
  "idToken": "google_id_token_from_frontend"
}
```

### 3.4 Test Protected Routes

Make a GET request to `http://localhost:5000/api/auth/me` with header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Project Structure

```
PeakAI/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   └── authController.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── models/
│   │   │   └── User.ts
│   │   ├── routes/
│   │   │   └── authRoutes.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
├── src/
│   ├── components/
│   │   ├── AuthComponents.tsx
│   │   ├── BottomNav.tsx
│   │   ├── SplashScreen.tsx
│   │   └── index.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── BriefScreen.tsx
│   │   ├── CoachScreen.tsx
│   │   ├── FuelScreen.tsx
│   │   ├── RecoverScreen.tsx
│   │   └── TrainScreen.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── storage.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── auth.ts
│   └── theme/
│       └── index.ts
├── App.tsx
├── package.json
├── app.json
└── .env.example
```

---

## API Documentation

### Authentication Endpoints

#### Register
- **URL:** `POST /api/auth/register`
- **Body:** `{ name, email, password }`
- **Response:** `{ success, token, user }`

#### Login
- **URL:** `POST /api/auth/login`
- **Body:** `{ email, password }`
- **Response:** `{ success, token, user }`

#### Google Auth
- **URL:** `POST /api/auth/google`
- **Body:** `{ idToken }`
- **Response:** `{ success, token, user }`

#### Get Current User
- **URL:** `GET /api/auth/me`
- **Auth:** Required (Bearer token)
- **Response:** `{ success, user }`

#### Update Profile
- **URL:** `PUT /api/auth/profile`
- **Auth:** Required (Bearer token)
- **Body:** `{ name, avatar? }`
- **Response:** `{ success, user }`

---

## Common Issues & Solutions

### 1. MongoDB Connection Error
- Ensure your IP address is whitelisted in MongoDB Atlas
- Check connection string in `.env`
- Verify username and password are correct

### 2. CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend
- Check backend is allowing requests from your frontend origin

### 3. Token Issues
- Make sure `JWT_SECRET` is set in `.env`
- Verify token format: `Bearer <token>`
- Check token expiration

### 4. Google Sign-In Not Working
- Verify Google Client ID is correct
- Check authorized redirect URIs in Google Cloud Console
- Ensure `GOOGLE_CLIENT_SECRET` is set on backend

### 5. Port Already in Use
```bash
# Kill process on port 5000
pkill -f "node.*5000"
# Or use a different port in .env
PORT=5001
```

---

## Next Steps

1. Implement user profile pages
2. Add more authentication methods (Apple Sign-In, etc.)
3. Add role-based access control (RBAC)
4. Implement refresh tokens for better security
5. Add email verification
6. Add password reset functionality
7. Add two-factor authentication (2FA)

---

## Security Checklist

- [ ] Use strong `JWT_SECRET` (min 32 characters)
- [ ] Enable HTTPS in production
- [ ] Use environment variables for sensitive data
- [ ] Validate all user inputs
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Use secure password hashing (bcrypt)
- [ ] Implement proper error handling
- [ ] Use HTTPS for API calls
- [ ] Add request validation

---

## Support

For issues or questions, check:
- Backend README: `backend/README.md`
- MongoDB Documentation: https://docs.mongodb.com
- Express Documentation: https://expressjs.com
- React Native Documentation: https://reactnative.dev
- Expo Documentation: https://docs.expo.dev
