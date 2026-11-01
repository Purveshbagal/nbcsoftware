"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Send, RefreshCw, Search, MessageCircle } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface Employee {
  _id: string;
  name: string;
  profilePicture?: string;
  designation?: string;
}

interface Conversation {
  _id: string;
  type: "team" | "direct";
  displayName: string;
  displayImage?: string | null;
  isTeamChat: boolean;
  lastMessage?: {
    text: string;
    createdAt: string;
  };
  otherParticipantId?: string;
}

export default function ChatListClient() {
  const router = useRouter();
  const [teamChat, setTeamChat] = useState<Conversation | null>(null);
  const [directChats, setDirectChats] = useState<Conversation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadConversations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await fetch("/api/sfa/chat/conversations", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load conversations");
      const data = await response.json();

      setTeamChat(data.teamChat || null);
      setDirectChats(data.directChats || []);
      setEmployees(data.employees || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();

    // Refresh the employee list frequently so newly created employees appear promptly.
    const interval = setInterval(() => loadConversations(true), 3000);
    return () => clearInterval(interval);
  }, []);

  const openConversation = (conversationId: string) => {
    router.push(`/sfa/chat/${conversationId}`);
  };

  const startDirectChat = async (employeeId: string) => {
    try {
      const response = await fetch("/api/sfa/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });

      if (!response.ok) throw new Error("Failed to create conversation");
      const data = await response.json();

      openConversation(data.conversation._id);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      if (isToday(date)) return format(date, "h:mm a");
      if (isYesterday(date)) return "Yesterday";
      return format(date, "MMM d");
    } catch {
      return "";
    }
  };

  // Filter employees for search
  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get employees who don't have active direct chats
  const employeesWithChats = new Set(
    directChats.map((chat) => chat.otherParticipantId).filter(Boolean)
  );
  const employeesWithoutChats = filteredEmployees.filter(
    (emp) => !employeesWithChats.has(emp._id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Team Chat */}
      {teamChat && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Team Chat
          </h2>
          <ConversationCard
            conversation={teamChat}
            onClick={() => openConversation(teamChat._id)}
            formatTimestamp={formatTimestamp}
          />
        </div>
      )}

      {/* Direct Messages */}
      {directChats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Direct Messages
          </h2>
          <div className="space-y-2">
            {directChats.map((chat) => (
              <ConversationCard
                key={chat._id}
                conversation={chat}
                onClick={() => openConversation(chat._id)}
                formatTimestamp={formatTimestamp}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Employees */}
      {employeesWithoutChats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Start a Conversation
          </h2>
          <div className="space-y-2">
            {employeesWithoutChats.map((emp) => (
              <EmployeeCard
                key={emp._id}
                employee={emp}
                onClick={() => startDirectChat(emp._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!teamChat && directChats.length === 0 && employees.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-10 h-10 text-primary/60" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
          <p className="text-muted-foreground">
            Start chatting with your team members
          </p>
        </Card>
      )}
    </div>
  );
}

function ConversationCard({
  conversation,
  onClick,
  formatTimestamp,
}: {
  conversation: Conversation;
  onClick: () => void;
  formatTimestamp: (timestamp?: string) => string;
}) {
  return (
    <Card
      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="w-12 h-12 ring-2 ring-background">
            {conversation.displayImage ? (
              <AvatarImage src={conversation.displayImage} alt={conversation.displayName} />
            ) : null}
            <AvatarFallback
              className={
                conversation.isTeamChat
                  ? "bg-gradient-to-br from-primary to-primary/70"
                  : "bg-gradient-to-br from-emerald-500 to-emerald-600"
              }
            >
              {conversation.isTeamChat ? (
                <Users className="w-6 h-6 text-white" />
              ) : (
                <span className="text-white font-semibold">
                  {conversation.displayName[0]?.toUpperCase()}
                </span>
              )}
            </AvatarFallback>
          </Avatar>
          {conversation.isTeamChat && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{conversation.displayName}</h3>
            {conversation.isTeamChat && (
              <Badge variant="secondary" className="text-xs">
                Team
              </Badge>
            )}
          </div>
          {conversation.lastMessage && (
            <p className="text-sm text-muted-foreground truncate">
              {conversation.lastMessage.text}
            </p>
          )}
        </div>

        {conversation.lastMessage && (
          <div className="text-xs text-muted-foreground">
            {formatTimestamp(conversation.lastMessage.createdAt)}
          </div>
        )}
      </div>
    </Card>
  );
}

function EmployeeCard({
  employee,
  onClick,
}: {
  employee: Employee;
  onClick: () => void;
}) {
  return (
    <Card
      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12 ring-2 ring-background">
          {employee.profilePicture ? (
            <AvatarImage src={employee.profilePicture} alt={employee.name} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600">
            <span className="text-white font-semibold">
              {employee.name[0]?.toUpperCase()}
            </span>
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{employee.name}</h3>
          {employee.designation && (
            <p className="text-sm text-muted-foreground truncate">
              {employee.designation}
            </p>
          )}
        </div>

        <Button variant="ghost" size="sm">
          <Send className="w-4 h-4 mr-2" />
          Message
        </Button>
      </div>
    </Card>
  );
}
