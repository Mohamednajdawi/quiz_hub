# Authentication System Setup

## Overview

A complete authentication system has been implemented with:

- **Backend**: JWT-based authentication with password hashing
- **Frontend**: Login/Register pages with auth context
- **Database**: User model with password_hash field

## Backend Implementation

### New Files Created

1. **`backend/utils/auth.py`**

   - Password hashing (bcrypt)
   - JWT token generation and validation
   - User authentication functions

2. **`backend/api_routers/routers/auth_router.py`**
   - `/auth/register` - Register new user
   - `/auth/login` - Login with email/password
   - `/auth/me` - Get current user info

### Database Changes

- Added `password_hash` column to `users` table
- Migration script: `migrations/add_password_hash_to_users.py`

### Dependencies Added

- `python-jose[cryptography]>=3.3.0` - JWT handling
- `passlib[bcrypt]>=1.7.4` - Password hashing

## Frontend Implementation

### New Files Created

1. **`lib/api/auth.ts`** - Auth API client
2. **`contexts/AuthContext.tsx`** - Auth context provider
3. **`app/login/page.tsx`** - Login page
4. **`app/register/page.tsx`** - Register page

### Updated Files

- `app/providers.tsx` - Added AuthProvider
- `components/Navigation.tsx` - Added login/logout buttons
- `app/dashboard/page.tsx` - Uses auth context
- `lib/api/client.ts` - Auto-adds JWT token to requests

## Features

### Security

- ✅ Password hashing with bcrypt
- ✅ JWT tokens with 30-day expiration
- ✅ Secure token storage in localStorage
- ✅ Automatic token injection in API requests
- ✅ Protected routes with auth checks

### User Experience

- ✅ Clean login/register forms
- ✅ Error handling and validation
- ✅ Automatic redirect after login
- ✅ User email display in navigation
- ✅ Logout functionality
- ✅ Persistent sessions (tokens stored in localStorage)

## Usage

### Register a New User

```bash
POST /auth/register
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Login

```bash
POST /auth/login
{
  "username": "user@example.com",  # OAuth2 uses 'username' field
  "password": "securepassword123"
}
```

### Get Current User

```bash
GET /auth/me
Authorization: Bearer <token>
```

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd quiz_backend
pip install -r requirements.txt
```

### 2. Run Database Migration

```bash
cd quiz_backend
python migrations/add_password_hash_to_users.py
```

This will add the `password_hash` column to your existing users table.

### 3. Set Environment Variable (Optional)

For production, set a secure SECRET_KEY:

```bash
export SECRET_KEY="your-secret-key-here"
```

Or add to `.env` file:

```
SECRET_KEY=your-secret-key-here
```

### 4. Start Backend

```bash
uvicorn backend.api:app --reload
```

### 5. Start Frontend

```bash
cd quiz_frontend
npm run dev
```

## API Endpoints

### Register

- **URL**: `/auth/register`
- **Method**: POST
- **Body**: `{ "email": string, "password": string }`
- **Response**: `{ "access_token": string, "token_type": "bearer", "user_id": string, "email": string }`

### Login

- **URL**: `/auth/login`
- **Method**: POST
- **Body**: Form data with `username` (email) and `password`
- **Response**: `{ "access_token": string, "token_type": "bearer", "user_id": string, "email": string }`

### Get Current User

- **URL**: `/auth/me`
- **Method**: GET
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "id": string, "email": string, "is_active": boolean }`

## Frontend Routes

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Protected (requires authentication)

## Integration with Existing Features

- Quiz attempts are now linked to authenticated users
- Dashboard shows user-specific analytics
- User history is filtered by user ID
- All API requests automatically include JWT token

## Security Best Practices

1. **Password Requirements**: Minimum 6 characters (can be enhanced)
2. **Token Expiration**: 30 days (configurable in `auth.py`)
3. **HTTPS**: Use HTTPS in production
4. **Secret Key**: Change default SECRET_KEY in production
5. **Password Reset**: Can be added as future enhancement

## Troubleshooting

### "Failed to load dashboard data"

- User needs to be logged in
- Check if token is stored in localStorage
- Verify token is being sent in Authorization header

### "Invalid authentication credentials"

- Token may have expired
- User needs to login again
- Check SECRET_KEY is set correctly

### Database errors

- Run migration script: `python migrations/add_password_hash_to_users.py`
- Check database file permissions

## Next Steps (Optional Enhancements)

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Remember me option
- [ ] Session management
- [ ] Role-based access control
- [ ] OAuth integration (Google, GitHub, etc.)
