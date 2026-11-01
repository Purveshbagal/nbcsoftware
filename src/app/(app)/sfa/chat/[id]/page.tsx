import { Suspense } from "react";
import { RefreshCw } from "lucide-react";
import ConversationClient from "./client";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConversationClient conversationId={id} />
    </Suspense>
  );
}
