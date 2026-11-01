import { Suspense } from "react";
import ChatClient from "./client";

export default async function ChatPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading chat...</div>}>
      <ChatClient />
    </Suspense>
  );
}
