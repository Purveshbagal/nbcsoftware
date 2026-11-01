"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Image as ImageIcon, RefreshCw, Users } from "lucide-react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";

interface ChatMessage {
  _id: string;
  senderType: "employee" | "admin";
  senderId: string;
  senderName: string;
  senderProfilePic?: string;
  messageType: "text" | "image";
  text?: string;
  imageUrl?: string;
  createdAt: string;
}

export default function ChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await fetch("/api/sfa/chat/messages?limit=100");
      if (!response.ok) throw new Error("Failed to load messages");
      const data = await response.json();
      setMessages(data.messages || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    // Poll for new messages every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      loadMessages(true);
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const text = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const response = await fetch("/api/sfa/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageType: "text",
          text,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      await loadMessages(true);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      // Upload image
      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await fetch("/api/sfa/chat/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload image");
      const uploadData = await uploadResponse.json();

      // Send image message
      const messageResponse = await fetch("/api/sfa/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageType: "image",
          imageUrl: uploadData.imageUrl,
        }),
      });

      if (!messageResponse.ok) throw new Error("Failed to send image message");
      await loadMessages(true);
    } catch (error) {
      console.error("Failed to send image:", error);
      alert("Failed to send image. Please try again.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { date: Date; messages: ChatMessage[] }[], message) => {
    const messageDate = new Date(message.createdAt);
    const existingGroup = groups.find(g => isSameDay(g.date, messageDate));

    if (existingGroup) {
      existingGroup.messages.push(message);
    } else {
      groups.push({ date: messageDate, messages: [message] });
    }

    return groups;
  }, []);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  return (
    <div className="h-[calc(100vh-80px)] flex">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Team Chat</h1>
                <p className="text-xs text-muted-foreground">
                  Group chat with all employees
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadMessages()}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-muted/20">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Send className="w-10 h-10 text-primary/60" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No messages yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Start the conversation with your team members. Share updates, ask questions, or just say hello!
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {groupedMessages.map((group, idx) => (
                <div key={idx} className="space-y-4">
                  {/* Date Divider */}
                  <div className="flex items-center gap-3 py-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium text-muted-foreground px-3 py-1 bg-background rounded-full border">
                      {getDateLabel(group.date)}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Messages */}
                  {group.messages.map((message) => (
                    <MessageBubble key={message._id} message={message} />
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-4 py-4 border-t bg-background/95 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage || sending}
                className="flex-shrink-0"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending || uploadingImage}
                  className="pr-12 h-11 rounded-full border-2 focus-visible:ring-1"
                />
              </div>
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending || uploadingImage}
                size="icon"
                className="flex-shrink-0 w-11 h-11 rounded-full"
              >
                {sending || uploadingImage ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            {uploadingImage && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Uploading image...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAdmin = message.senderType === "admin";
  const time = format(new Date(message.createdAt), "h:mm a");

  return (
    <div className={`flex gap-3 ${isAdmin ? "justify-end" : "justify-start"} group`}>
      {!isAdmin && (
        <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-background">
          {message.senderProfilePic ? (
            <AvatarImage src={message.senderProfilePic} alt={message.senderName} />
          ) : null}
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
            {message.senderName?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} max-w-[75%] md:max-w-[60%]`}>
        {!isAdmin && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-xs font-semibold text-foreground">
              {message.senderName}
            </span>
            {message.senderType === "admin" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                Admin
              </Badge>
            )}
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isAdmin
              ? "bg-primary text-primary-foreground rounded-tr-sm shadow-sm"
              : "bg-card border border-border rounded-tl-sm shadow-sm"
          }`}
        >
          {message.messageType === "text" ? (
            <div className="space-y-1">
              <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                {message.text}
              </p>
              <p
                className={`text-[11px] ${
                  isAdmin ? "text-primary-foreground/60" : "text-muted-foreground"
                }`}
              >
                {time}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <img
                src={message.imageUrl}
                alt="Shared image"
                className="rounded-xl max-w-sm max-h-80 object-contain bg-background/10"
              />
              <p
                className={`text-[11px] ${
                  isAdmin ? "text-primary-foreground/60" : "text-muted-foreground"
                }`}
              >
                {time}
              </p>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 mt-1.5 px-1">
            <span className="text-xs font-semibold text-foreground">You</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              Admin
            </Badge>
          </div>
        )}
      </div>

      {isAdmin && (
        <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-background">
          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold">
            A
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
