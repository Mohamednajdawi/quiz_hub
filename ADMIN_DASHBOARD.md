# Admin Dashboard

## Overview

A comprehensive admin dashboard has been created to allow administrators to view and manage all user accounts. The dashboard displays:

- **User Information**: Name, email, account type (Free/Pro), and account status
- **Quiz Statistics**: Number of quizzes generated per user
- **Overall Statistics**: Total users, Pro users, Free users, Active users, and Total quizzes

## Setup

### Creating an Admin Account

**Admin accounts are regular user accounts with special privileges.** There is no separate admin password. To create an admin account:

1. **Register a new user account** (or use an existing account):
   - Go to `/register` page
   - Fill in email, password, name, etc.
   - Complete registration

2. **Set the email as admin** by adding it to the `ADMIN_EMAILS` environment variable:

```bash
export ADMIN_EMAILS="admin@example.com,another-admin@example.com"
```

Or in your `.env` file:
```
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

3. **Restart the backend** to load the new environment variable

### Accessing the Dashboard

1. **Log in** with the admin account using the **same password** you set during registration
2. Navigate to the "Admin" link in the navigation bar (visible to all authenticated users)
3. The dashboard will load if you have admin privileges, or show an error message if you don't

### Password Management

- **Admin accounts use the same password** as regular user accounts
- Passwords are set during registration at `/register`
- Currently, password hashing is a placeholder (needs to be secured for production)
- There is **no special admin password** - admin status is determined by email only

## Features

### Statistics Overview

The dashboard displays five key metrics:
- **Total Users**: Total number of registered users
- **Pro Users**: Users with active subscriptions
- **Free Users**: Users without active subscriptions
- **Active Users**: Users with active accounts
- **Total Quizzes**: Total number of quizzes generated across all users

### User Management Table

The main table shows:
- **User**: Full name (or "N/A" if not provided)
- **Email**: User's email address
- **Account Type**: "Free" or "Pro" badge
- **Quizzes Generated**: Count of quizzes created by the user
- **Status**: "Active" or "Inactive" badge
- **Created**: Account creation date

### Search Functionality

Users can search the table by:
- Email address
- First name
- Last name
- Full name

## API Endpoints

### GET `/admin/users`

Returns all users with their statistics.

**Response:**
```json
{
  "users": [
    {
      "id": "user-id",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "account_type": "pro",
      "quiz_count": 15,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00",
      "free_tokens": 10
    }
  ],
  "total": 1
}
```

### GET `/admin/stats`

Returns overall statistics.

**Response:**
```json
{
  "total_users": 100,
  "free_users": 75,
  "pro_users": 25,
  "active_users": 95,
  "total_quizzes": 500
}
```

## Security

- Admin endpoints require authentication
- Only users with emails in `ADMIN_EMAILS` can access admin endpoints
- Non-admin users will receive a 403 Forbidden error
- All admin endpoints are protected by the `require_admin` dependency
- **Important**: Admin status is determined by email only - no special password required
- **Security Note**: The current password hashing implementation is a placeholder and should be secured for production use

## Implementation Details

### Backend Files

- `backend/utils/admin.py`: Admin utility functions
- `backend/api_routers/routers/admin_router.py`: Admin API endpoints
- `backend/api.py`: Router registration

### Frontend Files

- `app/admin/page.tsx`: Admin dashboard page
- `lib/api/admin.ts`: Admin API client
- `components/Navigation.tsx`: Navigation with admin link

## Account Type Determination

A user is considered "Pro" if they have at least one active subscription (status = "active"). Otherwise, they are considered "Free".

## Quiz Count

The quiz count represents the number of quizzes created by the user, determined by counting `QuizTopic` records where `created_by_user_id` matches the user's ID.

