import mongoose from "mongoose";
import ChatMessageModel from "@/models/ChatMessage";
import ConversationModel from "@/models/Conversation";
import EmployeeModel from "@/models/Employee";

const SYSTEM_PROFILE_PICTURE = "/cartoon.webp";
const INDIA_TIME_ZONE = "Asia/Kolkata";

function getIndiaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getBirthdayMonthAndDay(value: string) {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

/**
 * Get or create the team chat conversation
 */
export async function getOrCreateTeamChat() {
  let teamChat = await ConversationModel.findOne({ type: "team" });

  if (!teamChat) {
    // Get all active employees
    const allEmployees = await EmployeeModel.find({ isActive: true }).select("_id");
    const participantIds = allEmployees.map((emp) => emp._id);

    teamChat = await ConversationModel.create({
      type: "team",
      name: "Team Chat",
      participants: participantIds,
    });
  }

  return teamChat;
}

/**
 * Get or create a direct conversation between two employees
 */
export async function getOrCreateDirectConversation(
  employee1Id: mongoose.Types.ObjectId | string,
  employee2Id: mongoose.Types.ObjectId | string
) {
  const id1 = typeof employee1Id === "string" ? new mongoose.Types.ObjectId(employee1Id) : employee1Id;
  const id2 = typeof employee2Id === "string" ? new mongoose.Types.ObjectId(employee2Id) : employee2Id;

  // Check if conversation already exists (order doesn't matter)
  let conversation = await ConversationModel.findOne({
    type: "direct",
    participants: { $all: [id1, id2], $size: 2 },
  });

  if (!conversation) {
    conversation = await ConversationModel.create({
      type: "direct",
      participants: [id1, id2],
    });
  }

  return conversation;
}

/**
 * Add a new employee to team chat
 */
export async function addEmployeeToTeamChat(employeeId: mongoose.Types.ObjectId | string) {
  const id = typeof employeeId === "string" ? new mongoose.Types.ObjectId(employeeId) : employeeId;

  const teamChat = await getOrCreateTeamChat();

  // Check if employee is already in team chat
  const isAlreadyMember = teamChat.participants.some((p) => p.toString() === id.toString());

  if (!isAlreadyMember) {
    teamChat.participants.push(id);
    await teamChat.save();
  }

  return teamChat;
}

/**
 * Create a welcome system message when a new employee joins
 */
export async function createWelcomeMessage(
  employeeName: string
) {
  const teamChat = await getOrCreateTeamChat();

  const welcomeText = `🎉 Welcome to the team, ${employeeName}! We're excited to have you on board.`;

  const message = await ChatMessageModel.create({
    conversationId: teamChat._id,
    senderType: "system",
    senderName: "System",
    senderProfilePic: SYSTEM_PROFILE_PICTURE,
    messageType: "text",
    text: welcomeText,
    isSystemMessage: true,
    systemMessageType: "welcome",
  });

  // Update last message in conversation
  teamChat.lastMessage = {
    text: welcomeText,
    senderName: "System",
    createdAt: message.createdAt,
  };
  await teamChat.save();

  return message;
}

/**
 * Create a birthday wish message
 */
export async function createBirthdayMessage(
  employeeId: mongoose.Types.ObjectId | string,
  employeeName: string,
  dateKey: string
) {
  const teamChat = await getOrCreateTeamChat();
  const id = typeof employeeId === "string" ? new mongoose.Types.ObjectId(employeeId) : employeeId;
  const systemMessageKey = `birthday:${dateKey}:${id.toString()}`;
  const birthdayText = `🎂 Happy Birthday, ${employeeName}! 🎉\nWishing you a fantastic day filled with joy and happiness! 🥳`;

  const existingMessage = await ChatMessageModel.findOne({
    conversationId: teamChat._id,
    systemMessageKey,
  });
  if (existingMessage) return null;

  const message = await ChatMessageModel.create({
    conversationId: teamChat._id,
    senderType: "system",
    senderName: "System",
    senderProfilePic: SYSTEM_PROFILE_PICTURE,
    messageType: "text",
    text: birthdayText,
    isSystemMessage: true,
    systemMessageType: "birthday",
    systemMessageDate: dateKey,
    systemMessageKey,
  });

  // Update last message in conversation
  teamChat.lastMessage = {
    text: birthdayText,
    senderName: "System",
    createdAt: message.createdAt,
  };
  await teamChat.save();

  return message;
}

export async function createDailyTeamMessage(
  type: "good_morning" | "good_night",
  dateKey = getIndiaDateKey()
) {
  const teamChat = await getOrCreateTeamChat();
  const existingMessage = await ChatMessageModel.findOne({
    conversationId: teamChat._id,
    systemMessageType: type,
    systemMessageDate: dateKey,
  });

  if (existingMessage) return null;

  const text = type === "good_morning" ? "Good morning 🙂" : "Good night 🙂";
  const message = await ChatMessageModel.create({
    conversationId: teamChat._id,
    senderType: "system",
    senderName: "System",
    senderProfilePic: SYSTEM_PROFILE_PICTURE,
    messageType: "text",
    text,
    isSystemMessage: true,
    systemMessageType: type,
    systemMessageDate: dateKey,
  });

  teamChat.lastMessage = {
    text,
    senderName: "System",
    createdAt: message.createdAt,
  };
  await teamChat.save();

  return message;
}

/**
 * Check for birthdays today and send wishes
 */
export async function checkAndSendBirthdayWishes(dateKey = getIndiaDateKey()) {
  const [, month, day] = dateKey.split("-").map(Number);

  // Find all active employees
  const employees = await EmployeeModel.find({
    isActive: true,
    dateOfBirth: { $exists: true, $nin: [null, ""] },
  }).select("_id name dateOfBirth");

  const birthdayEmployees: { id: mongoose.Types.ObjectId; name: string }[] = [];

  for (const emp of employees) {
    if (!emp.dateOfBirth) continue;

    const birthDate = getBirthdayMonthAndDay(emp.dateOfBirth);
    if (!birthDate) continue;

    if (birthDate.month === month && birthDate.day === day) {
      birthdayEmployees.push({
        id: emp._id,
        name: emp.name,
      });
    }
  }

  // Send birthday wishes
  const messages = [];
  for (const emp of birthdayEmployees) {
    const message = await createBirthdayMessage(emp.id, emp.name, dateKey);
    if (message) messages.push(message);
  }

  return messages;
}

/**
 * Get all conversations for an employee
 */
export async function getEmployeeConversations(employeeId: mongoose.Types.ObjectId | string) {
  const id = typeof employeeId === "string" ? new mongoose.Types.ObjectId(employeeId) : employeeId;

  const conversations = await ConversationModel.find({
    participants: id,
  })
    .sort({ "lastMessage.createdAt": -1 })
    .lean();

  return conversations;
}

/**
 * Update conversation's last message
 */
export async function updateConversationLastMessage(
  conversationId: mongoose.Types.ObjectId | string,
  message: {
    text: string;
    senderId?: mongoose.Types.ObjectId;
    senderName: string;
    createdAt: Date;
  }
) {
  const id = typeof conversationId === "string" ? new mongoose.Types.ObjectId(conversationId) : conversationId;

  await ConversationModel.findByIdAndUpdate(id, {
    lastMessage: message,
  });
}
