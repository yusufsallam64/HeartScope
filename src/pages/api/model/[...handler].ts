import type { NextApiRequest, NextApiResponse } from "next";
import { DatabaseService } from "@/lib/db/service";
import { ObjectId } from 'mongodb';
import { authenticateRequest } from '../conversations';

if (!process.env.CF_API_TOKEN || !process.env.CF_ACCOUNT_ID) {
  throw new Error("Missing required environment variables: CF_API_TOKEN or CF_ACCOUNT_ID");
}

const SYSTEM_PROMPT = "twerk"

async function storeMessage(conversationId: ObjectId, userId: string, role: string, content: string) {
  return DatabaseService.createMessage({
    conversationId,
    userId: new ObjectId(userId),
    role,
    content
  });
}

type ModelResponse = {
  response: string | null;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  tool_calls?: {
    name: string;
    arguments: Record<string, any>;
  }[];
};

function validateMessage(message: any) {
  if (!message.role) {
    throw new Error(`Message missing role: ${JSON.stringify(message)}`);
  }
  if (!['user', 'assistant', 'system', 'tool'].includes(message.role)) {
    throw new Error(`Invalid role: ${message.role}`);
  }
  if (typeof message.content !== 'string') {
    throw new Error(`Content must be string, got: ${typeof message.content}`);
  }
  return {
    role: message.role,
    content: message.content
  };
}

async function runModel(messages: any[]) {
  try {
    const validatedMessages = messages
      .filter(msg => msg.content != null) 
      .map(validateMessage);
    
    const payload = {
      messages: validatedMessages.map(m => ({
        role: m.role === 'system' ? 'assistant' : m.role,
        content: m.content
      })),
      stream: false
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
      {
        headers: { 
          Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();
    console.log('API Response:', JSON.stringify(result));
    
    if (!result.success) {
      console.error('Full API Response:', result);
      throw new Error(result.errors?.[0]?.message || 'Cloudflare API request failed');
    }

    return result.result as ModelResponse;
  } catch (error) {
    console.error('Error in runModel:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await authenticateRequest(req, res);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { interactionMessages, conversationId } = req.body;

  if (!interactionMessages?.length) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  try {
    let currentConversationId: ObjectId;

    // Handle conversation ID creation
    if (!conversationId) {
      currentConversationId = await DatabaseService.createConversation({
        userId: new ObjectId(userId),
        title: 'Wallet Interaction',
        status: 'active'
      });
    } else {
      currentConversationId = new ObjectId(conversationId);
      const conversation = await DatabaseService.getConversation(currentConversationId);
      if (!conversation || conversation.userId.toString() !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    // Store user's message
    const userMessage = interactionMessages[interactionMessages.length - 1].content;
    await storeMessage(
      currentConversationId, 
      userId, 
      'user', 
      userMessage
    );

    // Prepare messages for the model
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add conversation messages and wallet address
    fullMessages.push(
      ...interactionMessages.map(msg => ({
        role: msg.role,
        content: String(msg.content)
      }))
    );

    const initialResponse = await runModel(fullMessages);

    let responseToStore: string = initialResponse.response || 'No response from the model';

    await storeMessage(
      currentConversationId,
      userId,
      'assistant',
      responseToStore
    );
    
    return res.status(200).json({
      response: responseToStore,
      messages: await DatabaseService.getConversationMessages(currentConversationId),
      conversation: await DatabaseService.getConversation(currentConversationId),
      usage: initialResponse.usage
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

