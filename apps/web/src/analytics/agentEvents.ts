/** Pendo Track Agent events for the Fieldnotes Research Assistant. */

export const RESEARCH_ASSISTANT_AGENT_ID = "jccWt12BEbmlASMr8YV142TZSas";

export type AgentEventType = "prompt" | "agent_response" | "user_reaction";

export interface AgentEventMetadata {
  conversationId: string;
  messageId: string;
  content: string;
  modelUsed?: string;
  suggestedPrompt?: boolean;
  toolsUsed?: string[];
  fileUploaded?: boolean;
}

export function trackAssistantEvent(
  eventType: AgentEventType,
  metadata: AgentEventMetadata
): void {
  window.pendo?.trackAgent?.(eventType, { agentId: RESEARCH_ASSISTANT_AGENT_ID, ...metadata });
}
