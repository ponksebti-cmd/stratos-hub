// routes/chat.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "../db.js";
import { requireAuth, unauthorized } from "../auth.js";
import { decryptKey } from "../crypto.js";
import { randomUUID } from "crypto";

// ── Credit cost ───────────────────────────────────────────────────────────────
const CREDITS_PER_CHAT = 5;

export async function deductCredits(companyId) {
  await db`SELECT increment_usage(${companyId}, ${CREDITS_PER_CHAT})`
}

// ── Tool Definitions ─────────────────────────────────────────────────────────

export const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_uploaded_documents",
      description: "Search uploaded real estate documents. IMPORTANT: Provide only 1 or 2 simple, broad keywords (e.g. 'Mumbai', 'Villa', 'Commercial', 'Pune'). Do NOT use complex phrases like 'most expensive' or 'price list'.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Simple search keywords (e.g. 'Mumbai' or 'Apartment')"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_all_documents",
      description: "Fetch a large batch of all uploaded property data at once. Use this tool ONLY when the user asks for complex comparisons (e.g., 'most expensive', 'cheapest', 'all properties in a city', or finding highest/lowest values) so you can read the data and compare it yourself.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Create and save a newly qualified real estate lead with their contact info, budget, and requirements once qualified in conversation.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The prospect's full name" },
          phone: { type: "string", description: "The prospect's phone number" },
          budget: { type: "number", description: "The prospect's budget in local currency (as a number)" },
          city: { type: "string", description: "The target city or location of interest" },
          propertyType: { type: "string", description: "The type of property (e.g. Apartment, Villa, Plot, Commercial)" }
        },
        required: ["name"]
      }
    }
  }
];

// ── Tool Implementations ─────────────────────────────────────────────────────

export async function executeTool(name, args, companyId, sessionId) {
  console.log(`[agent tool] Executing tool '${name}' with args:`, args);
  try {
    if (name === "search_uploaded_documents") {
      const searchQuery = args.query.trim();

      if (!searchQuery) return "No valid search terms provided.";

      let chunks = [], error = null;
      try {
        chunks = await db`SELECT content FROM file_chunks WHERE company_id = ${companyId} AND content @@ websearch_to_tsquery('english', ${searchQuery}) LIMIT 20`;
      } catch(e) { error = e; }

      if (error) {
        console.error("Tool search_uploaded_documents error:", error);
        return "Error searching documents.";
      }

      if (!chunks || chunks.length === 0) {
        return `No matches found for keyword "${searchQuery}". Try using analyze_all_documents to pull data manually.`;
      }

      return chunks.map((c) => c.content).join("\n---\n");
    }

    if (name === "analyze_all_documents") {
      let chunks = [], error = null;
      try {
        chunks = await db`SELECT content FROM file_chunks WHERE company_id = ${companyId} LIMIT 200`;
      } catch(e) { error = e; } // Pull up to ~100k characters for Gemini to analyze

      if (error) {
        console.error("Tool analyze_all_documents error:", error);
        return "Error fetching documents.";
      }

      if (!chunks || chunks.length === 0) {
        return "No matching property documents found in the uploaded files.";
      }

      return chunks.map((c) => c.content).join("\n---\n");
    }

    if (name === "create_lead") {
      const id = randomUUID();
      
      // Basic lead scoring calculation
      let score = 0;
      if (args.budget && args.budget > 0) score += 2;
      if (args.propertyType && args.propertyType.length > 0) score += 2;
      if (args.city && args.city.length > 0) score += 1;
      
      let error = null;
      try {
        await db`INSERT INTO leads (id, company_id, name, phone, budget, city, property_type, source, status, score, session_id) 
                 VALUES (${id}, ${companyId}, ${args.name ?? ""}, ${args.phone ?? ""}, ${Number(args.budget) || 0}, ${args.city ?? ""}, ${args.propertyType ?? ""}, 'Chat', 'new', ${score}, ${sessionId})`;
      } catch (e) { error = e; }

      if (error) {
        console.error("Tool create_lead error:", error);
        return "Failed to save lead in the database.";
      }

      return `Lead '${args.name}' has been successfully created and saved in the leads database.`;
    }
  } catch (err) {
    console.error(`Tool execution error [${name}]:`, err);
    return `Error executing tool: ${err.message}`;
  }

  return `Unknown tool: ${name}`;
}

// ── LLM Call Client ──────────────────────────────────────────────────────────

export async function callLLM(apiKey, messages, modelName, onStream = null, customPrompt = null) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const baseInstruction = `You are a smart real-estate AI assistant for Stratos Hub. Help agents qualify leads, search property documents, and answer real estate questions.
Support multilingual conversations: if the user speaks or replies in Arabic, respond in natural and professional real-estate Arabic, otherwise default to English.
Always use your available tools:
- Use 'search_uploaded_documents' whenever the user asks about property listings, specific files, pricing, or locations. Provide simple, single-word keywords (e.g. 'Mumbai').
- Use 'analyze_all_documents' to fetch the whole catalog when answering comparative questions like "most expensive", "cheapest", or when searching for a broad range of items.
- Use 'create_lead' to save prospect info to the database once you have gathered their name and some requirement/contact info.
Keep your conversational responses professional, helpful, and concise.
You MUST output all listings with markdown formatting (e.g. bold names, bullet lists).
Whenever you include an image or file link, use standard markdown image syntax: ![Alt](url)`;

  const systemInstruction = customPrompt ? `${baseInstruction}\n\nCustom Instructions:\n${customPrompt}` : baseInstruction;

  const model = genAI.getGenerativeModel({
    model: modelName || "gemini-3.5-flash",
    systemInstruction,
    tools: [
      {
        functionDeclarations: TOOLS.map(t => ({
          name: t.function.name,
          description: t.function.description,
          parameters: {
            type: "OBJECT",
            properties: t.function.parameters.properties,
            required: t.function.parameters.required,
          }
        }))
      }
      // Removed googleSearchRetrieval as it may cause 429 Quota errors on the free tier
    ]
  });

  // Map OpenAI message format to Gemini history format
  const geminiHistory = [];
  let lastRole = "";
  
  for (const m of messages) {
    if (m.role === "system") continue; // Handled by systemInstruction

    let role = m.role === "assistant" ? "model" : "user";
    if (m.role === "tool") role = "user"; // Tool responses are considered user inputs in Gemini

    // Gemini requires the history to start with a 'user' role message.
    if (geminiHistory.length === 0 && role === "model") {
      geminiHistory.push({ role: "user", parts: [{ text: "Hello" }] });
      lastRole = "user";
    }

    let parts = [];

    // To prevent strict schema validation errors (like missing thought_signature) in Gemini 3.5+,
    // we flatten past tool calls and responses into plain text blocks for the history.
    if (m.role === "tool") {
      parts.push({ text: `[Tool Execution Result from ${m.name}]:\n${m.content || "Success"}` });
    } else if (m.tool_calls) {
      let tcDescriptions = m.tool_calls.map(tc => `[Called tool ${tc.function.name} with arguments: ${typeof tc.function.arguments === 'string' ? tc.function.arguments : JSON.stringify(tc.function.arguments)}]`);
      parts.push({ text: tcDescriptions.join("\n") });
    } else {
      parts.push({ text: m.content || "" });
    }

    // Gemini doesn't allow two consecutive messages with the same role. If it happens, we combine parts.
    if (role === lastRole && geminiHistory.length > 0) {
      geminiHistory[geminiHistory.length - 1].parts.push(...parts);
    } else {
      geminiHistory.push({ role, parts });
      lastRole = role;
    }
  }

  // The last message is usually the user prompt. We pop it out to use as `generateContent` input
  // Or we can just use `startChat({ history })` and `sendMessage(lastMessage)`
  
  // Let's use startChat
  const chatToStart = [...geminiHistory];
  const lastMsg = chatToStart.pop();
  
  const chat = model.startChat({
    history: chatToStart
  });

  let response;
  let text = "";

  if (onStream) {
    const result = await chat.sendMessageStream(lastMsg.parts);
    for await (const chunk of result.stream) {
      if (chunk.text) {
        const chunkText = chunk.text();
        text += chunkText;
        onStream(chunkText);
      }
    }
    response = await result.response;
  } else {
    const result = await chat.sendMessage(lastMsg.parts);
    response = result.response;
    try { text = response.text(); } catch {}
  }

  // Map Gemini response back to the format our app expects (OpenAI format)
  const functionCalls = response.functionCalls();

  const outMessage = {
    role: "assistant",
    content: text || "",
  };

  if (functionCalls && functionCalls.length > 0) {
    outMessage.tool_calls = functionCalls.map(fc => ({
      id: randomUUID(),
      type: "function",
      function: {
        name: fc.name,
        arguments: JSON.stringify(fc.args)
      }
    }));
  }

  return outMessage;
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function handleListSessions(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let sessions = [], error = null;
  try {
    sessions = await db`SELECT id, title, updated_at FROM chat_sessions WHERE company_id = ${user.company_id} ORDER BY updated_at DESC LIMIT 50`;
  } catch (e) { error = e; }

  if (error) {
    console.error("list sessions:", error);
    return Response.json({ error: "Failed to list sessions" }, { status: 500 });
  }

  return Response.json(
    sessions.map((s) => ({ id: s.id, title: s.title, updatedAt: s.updated_at }))
  );
}

export async function handleCreateSession(req) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  let body = {};
  try { body = await req.json(); } catch { /* no body */ }

  const id = randomUUID();
  const title = body.title ?? "New conversation";

  let error = null;
  try {
    await db`INSERT INTO chat_sessions (id, company_id, title) VALUES (${id}, ${user.company_id}, ${title})`;
  } catch (e) { error = e; }
  if (error) {
    console.error("create session:", error);
    return Response.json({ error: "Failed to create session" }, { status: 500 });
  }

  // Welcome message
  await db`INSERT INTO messages (id, session_id, company_id, role, content) VALUES (${randomUUID()}, ${id}, ${user.company_id}, 'assistant', 'Hi! I''m your Stratos Hub AI assistant. I can help you qualify leads, search your uploaded property files, and draft client messages. What would you like to do?')`;

  return Response.json({ id, title, updatedAt: new Date().toISOString() });
}

export async function handleGetMessages(req, sessionId) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const [session] = await db`SELECT id FROM chat_sessions WHERE id = ${sessionId} AND company_id = ${user.company_id} LIMIT 1`;

  if (!session) return Response.json({ error: "Not found" }, { status: 404 });

  let messages = [], error = null;
  try {
    messages = await db`SELECT id, role, content, created_at FROM messages WHERE session_id = ${sessionId} ORDER BY created_at ASC`;
  } catch(e) { error = e; }

  if (error) {
    console.error("get messages:", error);
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 });
  }

  return Response.json(
    messages.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at }))
  );
}

export async function handleSendMessage(req, sessionId) {
  const user = await requireAuth(req);
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const isStream = url.searchParams.get("stream") === "true";

  const [session] = await db`SELECT id FROM chat_sessions WHERE id = ${sessionId} AND company_id = ${user.company_id} LIMIT 1`;

  if (!session) return Response.json({ error: "Not found" }, { status: 404 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { content } = body ?? {};
  if (!content?.trim()) return Response.json({ error: "content is required" }, { status: 400 });

  // 1. Credit guard
  const [company] = await db`SELECT credits FROM companies WHERE id = ${user.company_id} LIMIT 1`;

  if (!company || company.credits < CREDITS_PER_CHAT) {
    return Response.json({ error: "Insufficient credits. Please upgrade your plan." }, { status: 402 });
  }

  // Save user message
  const userMsgId = randomUUID();
  const now = new Date().toISOString();
  await db`INSERT INTO messages (id, session_id, company_id, role, content, created_at) VALUES (${userMsgId}, ${sessionId}, ${user.company_id}, 'user', ${content}, ${now})`;

  // Update session title if this is the first user message
  const [{ count }] = await db`SELECT count(id)::int as count FROM messages WHERE session_id = ${sessionId} AND role = 'user'`;

  if (count === 1) {
    await db`UPDATE chat_sessions SET title = ${content.slice(0, 60)} WHERE id = ${sessionId}`;
  }

  // Retrieve active API key and model settings
  const provider = "gemini";
  let apiKey = process.env.GEMINI_API_KEY;
  let modelName = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

  // Fallback to database BYOK settings if local environment variables are missing
  const [settings] = await db`SELECT openai_key_enc, openai_key_iv, openai_key_tag, system_prompt FROM settings WHERE company_id = ${user.company_id} LIMIT 1`;

  if (!apiKey && settings?.openai_key_enc) {
    try {
      apiKey = await decryptKey({
        enc: settings.openai_key_enc,
        iv: settings.openai_key_iv,
        tag: settings.openai_key_tag,
      });
    } catch (e) {
      console.error("Failed to decrypt custom API key:", e);
    }
  }

  const customPrompt = settings?.system_prompt;

  if (!apiKey) {
    const assistantMsgId = randomUUID();
    const replyText = `Please configure your API key to enable AI-powered chat. Active provider is: ${provider.toUpperCase()}`;
    await db`INSERT INTO messages (id, session_id, company_id, role, content) VALUES (${assistantMsgId}, ${sessionId}, ${user.company_id}, 'assistant', ${replyText})`;
    return Response.json({
      id: assistantMsgId,
      role: "assistant",
      content: replyText,
      createdAt: new Date().toISOString(),
    });
  }

  // Get full message history for the session
  let allMessages = [];
  try {
    allMessages = await db`SELECT role, content FROM messages WHERE session_id = ${sessionId} ORDER BY created_at ASC`;
  } catch (e) { console.error(e); }

  const history = (allMessages ?? []).map((m) => ({ role: m.role, content: m.content }));

  if (isStream) {
    const stream = new ReadableStream({
      async start(controller) {
        let finalContent = "";
        let success = false;

        const sendChunk = (text) => {
          try {
            controller.enqueue(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
          } catch (e) {
            console.warn("[stream] Failed to send chunk (controller closed/inactive):", e.message);
          }
        };

        try {
          let currentHistory = [...history];
          let attempts = 0;
          const maxAttempts = 5;

          while (attempts < maxAttempts) {
            attempts++;
            const responseMessage = await callLLM(apiKey, currentHistory, modelName, (chunk) => {
              // Only stream chunks on the final iteration
              sendChunk(chunk);
            }, customPrompt);

            if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
              finalContent += responseMessage.content ?? "";
              success = true;
              break;
            }

            currentHistory.push(responseMessage);

            for (const toolCall of responseMessage.tool_calls) {
              const { name, arguments: rawArgs } = toolCall.function;
              let args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

              let action = "";
              if (name === "search_uploaded_documents") action = `🔍 Searching database for "${args.query}"...\n\n`;
              else if (name === "analyze_all_documents") action = `📊 Analyzing all property documents...\n\n`;
              else if (name === "create_lead") action = `📝 Creating lead "${args.name}"...\n\n`;

              if (action) {
                finalContent += action;
                sendChunk(action);
              }

              const result = await executeTool(name, args, user.company_id, sessionId);
              currentHistory.push({ role: "tool", tool_call_id: toolCall.id, name, content: result });
            }
          }
        } catch (err) {
          console.error("LLM Agent loop failed:", err);
          const errText = `I encountered an issue processing your request. Error: ${err.message}`;
          finalContent += errText;
          sendChunk(errText);
        }

        const assistantMsgId = randomUUID();
        const replyAt = new Date().toISOString();
        await db`INSERT INTO messages (id, session_id, company_id, role, content, created_at) VALUES (${assistantMsgId}, ${sessionId}, ${user.company_id}, 'assistant', ${finalContent}, ${replyAt})`;
        await db`UPDATE chat_sessions SET updated_at = ${replyAt} WHERE id = ${sessionId}`;

        if (success) await deductCredits(user.company_id);

        try {
          controller.enqueue(`data: ${JSON.stringify({ type: "done", message: { id: assistantMsgId, role: "assistant", content: finalContent, createdAt: replyAt } })}\n\n`);
          controller.enqueue(`data: [DONE]\n\n`);
          controller.close();
        } catch (e) {
          console.warn("[stream] Failed to finalise stream (controller closed):", e.message);
        }
      }
    });

    return new Response(stream, { 
      headers: { 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Content-Encoding": "none"
      } 
    });
  }

  // --- Non-streaming code path ---
  let finalContent = "";
  let success = false;

  try {
    let currentHistory = [...history];
    let attempts = 0;
    const maxAttempts = 5;
    let thoughtBlocks = [];

    while (attempts < maxAttempts) {
      attempts++;
      const responseMessage = await callLLM(apiKey, currentHistory, modelName, null, customPrompt);

      // If the model does not want to call a tool, we are finished!
      if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
        finalContent = responseMessage.content ?? "";
        success = true;
        break;
      }

      // Add assistant's tool-call request to messages list
      currentHistory.push(responseMessage);

      // Execute each tool request
      for (const toolCall of responseMessage.tool_calls) {
        const { name, arguments: rawArgs } = toolCall.function;
        let args = {};
        try {
          args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
        } catch (e) {
          console.error("Malformed tool arguments:", rawArgs);
        }

        if (name === "search_uploaded_documents") {
          thoughtBlocks.push(`🔍 Searching database for "${args.query}"...`);
        } else if (name === "create_lead") {
          thoughtBlocks.push(`📝 Creating lead "${args.name}"...`);
        }

        const result = await executeTool(name, args, user.company_id, sessionId);

        currentHistory.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: name,
          content: result,
        });
      }
    }

    if (thoughtBlocks.length > 0) {
      finalContent = `<thought_process>\n${thoughtBlocks.join("\n")}\n</thought_process>\n\n` + finalContent;
    }
  } catch (err) {
    console.error("LLM Agent loop failed:", err);
    finalContent = `I encountered an issue processing your request. Error: ${err.message}`;
  }

  // Save the final reply text from the assistant
  const assistantMsgId = randomUUID();
  const replyAt = new Date().toISOString();
  await db`INSERT INTO messages (id, session_id, company_id, role, content, created_at) VALUES (${assistantMsgId}, ${sessionId}, ${user.company_id}, 'assistant', ${finalContent}, ${replyAt})`;

  // Touch session updated_at
  await db`UPDATE chat_sessions SET updated_at = ${replyAt} WHERE id = ${sessionId}`;

  // Deduct credits if LLM successfully completed
  if (success) {
    await deductCredits(user.company_id);
  }

  return Response.json({
    id: assistantMsgId,
    role: "assistant",
    content: finalContent,
    createdAt: replyAt,
  });
}

// ── Widget Chat Handler (Unauthenticated, public) ──────────────────────────────

export async function handleWidgetChat(req) {
  const url = new URL(req.url);

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  // isStream can be sent as a URL query param OR in the request body
  const isStream = url.searchParams.get("stream") === "true" || body?.stream === true;

  const { agencyId, message, sessionId: clientSessionId, leadInfo } = body ?? {};
  if (!agencyId || !message?.trim()) {
    return Response.json({ error: "agencyId and message required" }, { status: 400 });
  }

  // 1. Get company API keys and check credits
  const [company] = await db`SELECT credits FROM companies WHERE id = ${agencyId} LIMIT 1`;
  if (!company) {
    console.warn(`[widget] Agency not found: ${agencyId}`);
    if (isStream) {
      return new Response("data: {\"type\":\"done\",\"message\":\"Agency not found. Please check the widget configuration.\"}\n\n", { 
        headers: { 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
          "Content-Encoding": "none"
        } 
      });
    }
    return Response.json({ reply: "Agency not found. Please check the widget configuration." });
  }
  if (company.credits < CREDITS_PER_CHAT) {
    console.warn(`[widget] Insufficient credits for agency ${agencyId}: ${company.credits}`);
    if (isStream) {
      return new Response("data: {\"type\":\"done\",\"message\":\"I'm currently unavailable. Please contact the agency directly.\"}\n\n", { 
        headers: { 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
          "Content-Encoding": "none"
        } 
      });
    }
    return Response.json({ reply: "I'm currently unavailable. Please contact the agency directly." });
  }

  // 2. Fetch API keys
  const provider = "gemini";
  let apiKey = process.env.GEMINI_API_KEY;
  let modelName = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

  const [settings] = await db`SELECT openai_key_enc, openai_key_iv, openai_key_tag, system_prompt FROM settings WHERE company_id = ${agencyId} LIMIT 1`;
  
  if (!apiKey && settings?.openai_key_enc) {
    try {
      apiKey = await decryptKey({
        enc: settings.openai_key_enc, iv: settings.openai_key_iv, tag: settings.openai_key_tag,
      });
    } catch {}
  }

  const customPrompt = settings?.system_prompt;

  if (!apiKey) {
    if (isStream) {
      return new Response("data: {\"type\":\"done\",\"message\":\"AI is not configured for this agency.\"}\n\n", { 
        headers: { 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
          "Content-Encoding": "none"
        } 
      });
    }
    return Response.json({ reply: "AI is not configured for this agency." });
  }

  // 3. Persistent session logic
  let activeSessionId = clientSessionId;
  let history = [];
  
  if (!activeSessionId) {
    activeSessionId = randomUUID();
    await db`INSERT INTO chat_sessions (id, company_id, title) VALUES (${activeSessionId}, ${agencyId}, 'Widget Chat Session')`;

    // If lead info was provided at the start of the session, auto-create a lead
    if (leadInfo?.name && leadInfo?.phone) {
      try {
        await executeTool("create_lead", {
          name: leadInfo.name,
          phone: leadInfo.phone,
          city: leadInfo.city || "",
          propertyType: leadInfo.propertyType || "",
        }, agencyId, activeSessionId);
      } catch (err) {
        console.error("[widget] Failed to auto-create lead:", err);
      }
    }
  } else {
    // Check if session exists and is valid
    const [sessionExists] = await db`SELECT id FROM chat_sessions WHERE id = ${activeSessionId} AND company_id = ${agencyId} LIMIT 1`;
      
    if (!sessionExists) {
      activeSessionId = randomUUID();
      await db`INSERT INTO chat_sessions (id, company_id, title) VALUES (${activeSessionId}, ${agencyId}, 'Widget Chat Session')`;
    } else {
      // Load previous messages history
      const pastMessages = await db`SELECT role, content FROM messages WHERE session_id = ${activeSessionId} ORDER BY created_at ASC LIMIT 20`;
        
      if (pastMessages) {
        history = pastMessages.map(m => ({ role: m.role, content: m.content }));
      }
    }
  }

  // Save the user's message
  const userMsgId = randomUUID();
  await db`INSERT INTO messages (id, session_id, company_id, role, content) VALUES (${userMsgId}, ${activeSessionId}, ${agencyId}, 'user', ${message})`;

  history.push({ role: "user", content: message });
  
  let finalContent = "";
  let success = false;
  let thoughtBlocks = [];

  // If streaming is enabled
  if (isStream) {
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data) => {
          try {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch (e) {
            console.warn("[widget stream] Failed to send event (controller closed/inactive):", e.message);
          }
        };

        try {
          let currentHistory = [...history];
          let attempts = 0;
          let isFinalIteration = false;

          while (attempts < 5) {
            attempts++;
            isFinalIteration = attempts === 5; // Safety fallback, though usually we break early

            const onChunk = (chunk) => {
              sendEvent({ type: "chunk", text: chunk });
            };

            const responseMessage = await callLLM(apiKey, currentHistory, modelName, onChunk, customPrompt);

            if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
              finalContent = responseMessage.content ?? "";
              success = true;
              break;
            }

            // We hit a tool call. We need to loop again. Next loop will stream the actual reply.
            isFinalIteration = false; 

            currentHistory.push(responseMessage);

            for (const toolCall of responseMessage.tool_calls) {
              const { name, arguments: rawArgs } = toolCall.function;
              let args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
              
              if (name === "search_uploaded_documents") {
                thoughtBlocks.push(`🔍 Searching database for "${args.query}"...`);
              } else if (name === "create_lead") {
                thoughtBlocks.push(`📝 Creating lead "${args.name}"...`);
              }

              const result = await executeTool(name, args, agencyId, activeSessionId);

              currentHistory.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: name,
                content: result,
              });
            }
          }

          if (thoughtBlocks.length > 0) {
            finalContent = `<thought_process>\n${thoughtBlocks.join("\n")}\n</thought_process>\n\n` + finalContent;
          }
        } catch (err) {
          console.error("Widget Stream error:", err);
          finalContent = `Sorry, I encountered an error: ${err.message}`;
        }
        
        const cleanReply = finalContent.replace(/<lead>[\s\S]*?<\/lead>/g, "").trim();

        // Save AI message to db
        const aiMsgId = randomUUID();
        await db`INSERT INTO messages (id, session_id, company_id, role, content) VALUES (${aiMsgId}, ${activeSessionId}, ${agencyId}, 'assistant', ${cleanReply})`;

        await db`UPDATE chat_sessions SET updated_at = ${new Date().toISOString()} WHERE id = ${activeSessionId}`;
        
        if (success) await deductCredits(agencyId);

        // Send the final message payload down
        sendEvent({
          type: "done",
          message: cleanReply,
          sessionId: activeSessionId
        });
        try {
          controller.close();
        } catch (e) {
          console.warn("[widget stream] Failed to close controller:", e.message);
        }
      }
    });

    return new Response(stream, { 
      headers: { 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Content-Encoding": "none"
      } 
    });
  }

  // --- Non-streaming code path ---
  try {
    let currentHistory = [...history];
    let attempts = 0;
    while (attempts < 5) {
      attempts++;
      const responseMessage = await callLLM(apiKey, currentHistory, modelName, null, customPrompt);

      if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
        finalContent = responseMessage.content ?? "";
        success = true;
        break;
      }

      currentHistory.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const { name, arguments: rawArgs } = toolCall.function;
        let args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
        
        if (name === "search_uploaded_documents") thoughtBlocks.push(`🔍 Searching database for "${args.query}"...`);
        else if (name === "create_lead") thoughtBlocks.push(`📝 Creating lead "${args.name}"...`);

        const result = await executeTool(name, args, agencyId, activeSessionId);
        currentHistory.push({ role: "tool", tool_call_id: toolCall.id, name, content: result });
      }
    }
    
    if (thoughtBlocks.length > 0) {
      finalContent = `<thought_process>\n${thoughtBlocks.join("\n")}\n</thought_process>\n\n` + finalContent;
    }
  } catch (err) {
    finalContent = `Sorry, I encountered an error: ${err.message}`;
  }

  const cleanReply = finalContent.replace(/<lead>[\s\S]*?<\/lead>/g, "").trim();

  // Save AI message
  const aiMsgId = randomUUID();
  await db`INSERT INTO messages (id, session_id, company_id, role, content) VALUES (${aiMsgId}, ${activeSessionId}, ${agencyId}, 'assistant', ${cleanReply})`;

  await db`UPDATE chat_sessions SET updated_at = ${new Date().toISOString()} WHERE id = ${activeSessionId}`;

  if (success) await deductCredits(agencyId);

  return Response.json({ reply: cleanReply, sessionId: activeSessionId });
}
