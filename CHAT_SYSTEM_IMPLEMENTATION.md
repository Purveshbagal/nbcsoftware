# 💬 Chat System Implementation Guide

## Overview

A complete chat system has been implemented with the following features:

### ✅ Features Implemented

1. **Team Chat** - Group chat where all employees can communicate together
2. **Direct Messages** - Private one-on-one conversations between employees
3. **Auto-Add New Employees** - New employees are automatically added to team chat
4. **Welcome Messages** - System automatically sends welcome messages for new employees
5. **Birthday Wishes** - System automatically sends birthday wishes based on employee birth dates
6. **Emoji Support** - Full emoji support using mobile keyboard emojis
7. **Image Sharing** - Share images in both team chat and direct messages
8. **System Messages** - Special messages for welcome and birthday wishes

---

## 📁 New Files Created

### Backend (Node.js/Next.js)

#### Models
- `src/models/Conversation.ts` - Conversation model (team and direct chats)
- Updated `src/models/ChatMessage.ts` - Added conversation support and system messages

#### Utility Functions
- `src/lib/chat-helpers.ts` - Helper functions for:
  - Creating/getting team chat
  - Creating/getting direct conversations
  - Adding employees to team chat
  - Sending welcome messages
  - Sending birthday wishes
  - Checking birthdays daily

#### API Endpoints

**Employee Chat APIs (Mobile):**
- `GET /api/labs/chat/conversations` - Get all conversations for an employee
- `POST /api/labs/chat/conversations` - Create/get a conversation
- `GET /api/labs/chat/conversations/[id]/messages` - Get messages for a conversation
- `POST /api/labs/chat/conversations/[id]/messages` - Send a message to a conversation
- `GET /api/labs/chat/employees` - Get all employees for chat list

**Admin APIs:**
- `GET /api/sfa/chat/birthday-check` - Check and send birthday wishes (for cron job)
- `POST /api/sfa/chat/birthday-check` - Manual birthday check trigger

#### Updated Files
- `src/app/api/sfa/employees/route.ts` - Auto-add new employees to team chat and send welcome message

### Mobile (Flutter)

#### Screens
- `mobile-labs/lib/screens/chat_list_screen.dart` - Chat list showing team chat and all employees
- Updated `mobile-labs/lib/screens/chat_screen.dart` - Support for conversations, direct messages, and system messages

#### Theme
- Updated `mobile-labs/lib/app_theme.dart` - Added missing colors (inkLight, surface, indigoSoft)

---

## 🚀 How It Works

### 1. Team Chat

**When you open the chat list:**
- Team Chat appears at the top
- All active employees are automatically participants
- Shows last message and timestamp

**Features:**
- All employees can see all messages
- System messages for welcomes and birthdays
- Real-time message polling (updates every 3 seconds)

### 2. Direct Messages

**Starting a direct chat:**
1. Open chat list
2. Tap on any employee
3. Conversation is created automatically
4. Messages are private between the two employees

**Features:**
- One-on-one private messaging
- Separate conversations for each employee pair
- Image sharing support
- Emoji support from keyboard

### 3. Auto-Welcome for New Employees

**When admin creates a new employee:**
1. Employee is created in the database
2. Employee is automatically added to team chat participants
3. System message is sent: "🎉 Welcome to the team, [Name]! We're excited to have you on board."
4. All team members see the welcome message in team chat

### 4. Birthday Wishes

**Automatic birthday detection:**
1. The scheduled GitHub Actions workflow checks birthdays every day at 9:00 AM India time.
2. System checks all employees' birth dates
3. For employees with birthdays today:
   - Creates birthday message: "🎂 Happy Birthday, [Name]! 🎉\nWishing you a fantastic day filled with joy and happiness! 🥳"
   - Posts to team chat
   - All team members see the birthday wish
4. The same workflow posts "Good morning 🙂" at 9:00 AM and "Good night 🙂" at 9:00 PM.
5. Scheduled messages use the System name and `/cartoon.webp` profile picture and are deduplicated by India calendar date.

**Manual trigger:**
- Admin can manually trigger: `POST /api/sfa/chat/birthday-check`

### 5. System Messages

**Display:**
- Special UI with amber background
- Icon indicator
- Centered text
- Shows timestamp

**Types:**
- `welcome` - New employee welcome
- `birthday` - Birthday wishes
- `employee_added` - General employee added notification

---

## 📱 Mobile UI Features

### Chat List Screen

**Layout:**
```
┌─────────────────────────────┐
│  Messages           [↻]     │ ← AppBar
├─────────────────────────────┤
│  [👥] Team Chat             │ ← Team chat (always on top)
│       Last message...       │
│       2:30 PM               │
├─────────────────────────────┤
│  ── Direct Messages ──      │ ← Section divider
├─────────────────────────────┤
│  [A] Alice Johnson          │ ← Direct conversation
│       Thanks!               │
│       Yesterday             │
├─────────────────────────────┤
│  [B] Bob Smith              │ ← Employee (no conversation yet)
│       Tap to start chatting │
│                             │
└─────────────────────────────┘
```

**Features:**
- Auto-refresh every 5 seconds
- Pull to refresh
- Shows last message preview
- Smart timestamp formatting (time, Yesterday, day name, date)
- Team chat always at top
- Direct messages sorted by last activity

### Chat Screen

**Enhanced UI:**
- Modern message bubbles with gradients
- Profile pictures with shadows
- System messages with special styling
- Emoji support (keyboard emojis work automatically)
- Image sharing
- Real-time updates (3-second polling)

**Message Types:**
1. **Your messages** - Indigo gradient, right-aligned, "You" label
2. **Other messages** - White background, left-aligned, sender name
3. **System messages** - Amber background, centered, icon

---

## 🔧 Setup Instructions

### 1. Database Migration

The new models will be automatically created when you first use the chat:
- `conversations` collection
- Updated `chatmessages` collection with new fields

No manual migration needed!

### 2. Scheduled Team Messages (Current Setup)

The `.github/workflows/team-chat-schedule.yml` workflow runs at 03:30 UTC and 15:30 UTC (09:00 and 21:00 India time). Configure these GitHub Actions repository secrets:

- `CHAT_APP_URL` — deployed app base URL, without a trailing slash
- `CRON_SECRET` — a strong secret also configured in the app environment

The morning run sends birthday wishes and the Good Morning message. The evening run sends the Good Night message. Requests without the matching bearer token are rejected.

The scheduler options below are legacy examples and do not trigger the current morning/evening jobs.

**Option A: Using Vercel Cron**

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sfa/chat/birthday-check",
    "schedule": "0 9 * * *"
  }]
}
```

**Option B: Using external cron service (cron-job.org, etc.)**

Set up a daily GET request to:
```
https://your-domain.com/api/sfa/chat/birthday-check
Header: Authorization: Bearer your-secret-token
```

**Option C: Manual trigger**

Admin can manually trigger birthday checks:
```bash
POST /api/sfa/chat/birthday-check
```

### 3. Required Environment Variable

Configure the same strong secret in the deployed app environment and GitHub Actions repository secrets:
```env
CRON_SECRET=your-strong-random-secret
```

---

## 🎨 UI/UX Improvements

### Desktop Chat (Already Improved)
- ✅ Modern layout with date dividers
- ✅ Gradient message bubbles
- ✅ Improved spacing and typography
- ✅ Better empty states
- ✅ Sticky header with backdrop blur

### Mobile Chat (Newly Implemented)
- ✅ Chat list with team and direct messages
- ✅ Beautiful message bubbles with gradients
- ✅ System messages with special styling
- ✅ Profile pictures with shadows
- ✅ Smart timestamp formatting
- ✅ Auto-refresh and pull-to-refresh

---

## 📊 Database Structure

### Conversations Collection
```javascript
{
  _id: ObjectId,
  type: "team" | "direct",
  participants: [ObjectId], // Employee IDs
  name: String, // "Team Chat" for team, empty for direct
  lastMessage: {
    text: String,
    senderId: ObjectId,
    senderName: String,
    createdAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### ChatMessages Collection (Updated)
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId, // NEW
  senderType: "employee" | "admin" | "system", // "system" is NEW
  senderId: ObjectId, // Optional for system messages
  senderName: String,
  senderProfilePic: String,
  messageType: "text" | "image",
  text: String,
  imageUrl: String,
  isSystemMessage: Boolean, // NEW
  systemMessageType: "welcome" | "birthday" | "employee_added", // NEW
  isRead: Boolean,
  readBy: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Integration Points

### When Creating a New Employee

In `src/app/api/sfa/employees/route.ts`:
```typescript
const created = await EmployeeModel.create(employeeData);

// Auto-add to team chat and send welcome message
await addEmployeeToTeamChat(created._id);
await createWelcomeMessage(created._id, created.name);
```

### Daily Birthday Check

Call this endpoint daily at 9 AM:
```
GET /api/sfa/chat/birthday-check
Authorization: Bearer your-cron-secret
```

---

## 🧪 Testing

### Test Team Chat
1. Open mobile app as any employee
2. Go to Messages (use ChatListScreen)
3. Tap "Team Chat"
4. Send a message
5. Check from another employee account - should see the message

### Test Direct Messages
1. Open mobile app
2. Go to Messages
3. Tap on any employee
4. Send a message
5. Check from that employee's account - should see the message

### Test Welcome Message
1. Admin creates a new employee with required details
2. Check team chat - should see welcome message
3. New employee logs in - should see team chat with welcome message

### Test Birthday Wishes
1. Set an employee's birth date to today
2. Call `POST /api/sfa/chat/birthday-check`
3. Check team chat - should see birthday message

---

## 🎯 Next Steps (Optional Enhancements)

Future improvements you could add:

1. **Read Receipts** - Show who has read messages
2. **Typing Indicators** - Show when someone is typing
3. **Push Notifications** - Real-time notifications for new messages
4. **Message Search** - Search through chat history
5. **File Sharing** - Share documents, PDFs, etc.
6. **Voice Messages** - Record and send voice messages
7. **Message Reactions** - React to messages with emojis
8. **Group Chats** - Create custom group chats (besides team chat)
9. **Message Editing** - Edit sent messages
10. **Message Deletion** - Delete sent messages

---

## 📝 Notes

- **Emojis work automatically** - No special implementation needed! Mobile keyboard emojis work in all text fields
- **Backward compatible** - Old chat messages still work (if any existed)
- **Scalable** - System designed to handle many conversations and messages
- **Real-time-ish** - Uses polling (3-5 seconds) instead of WebSockets for simplicity
- **Error handling** - Chat creation errors won't fail employee creation

---

## 🎉 Summary

The complete chat system is now implemented with:

✅ Team Chat - Everyone can chat together
✅ Direct Messages - Private one-on-one chats
✅ Auto-add employees to team chat
✅ Welcome messages for new employees
✅ Birthday wishes (automatic with cron)
✅ Emoji support (keyboard emojis)
✅ Image sharing
✅ System messages
✅ Beautiful mobile UI
✅ Real-time updates

Everything is ready to use! 🚀
