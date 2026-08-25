import { TrussiumClient } from "../dist/index.js";

const baseUrl = process.env.TRUSSIUM_URL ?? "http://127.0.0.1:9000";
const model = process.env.TRUSSIUM_MODEL ?? "gpt-4.1-mini";
const prompt = process.env.TRUSSIUM_PROMPT ?? "Say hello in one sentence.";

const client = new TrussiumClient({ baseUrl });
const readiness = await client.readiness();
const capabilities = await client.capabilities();
console.log("Runtime:", baseUrl);
console.log("Readiness:", readiness.status);
console.log("Capabilities:", capabilities.capabilities.map((capability) => capability.name));

const completion = await client.complete({
  model,
  messages: [{ role: "user", content: prompt }],
});
console.log("Completion:", completion.choices[0]?.message.content ?? "<empty>");
