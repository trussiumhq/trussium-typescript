import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, TrussiumClient } from "../dist/index.js";

function mockFetch(handler) {
  return async (url, init = {}) => handler(new URL(url), init);
}

test("complete forwards request ID and decodes response", async () => {
  const client = new TrussiumClient({
    baseUrl: "http://runtime.test",
    fetch: mockFetch((url, init) => {
      assert.equal(url.pathname, "/v1/chat/completions");
      assert.equal(init.headers.get("X-Request-ID"), "request-123");
      return new Response(JSON.stringify({ id: "chat-1" }), { status: 200 });
    }),
  });
  assert.deepEqual(await client.complete({ model: "test", messages: [] }, "request-123"), { id: "chat-1" });
});

test("readiness, capabilities, and API errors use stable responses", async () => {
  const client = new TrussiumClient({
    baseUrl: "http://runtime.test",
    fetch: mockFetch((url) => {
      if (url.pathname === "/health/ready") return new Response('{"status":"ok"}');
      if (url.pathname === "/v1/capabilities") return new Response('{"capabilities":[]}');
      return new Response('{"error":{"code":"provider_unreachable"}}', { status: 503 });
    }),
  });
  assert.equal((await client.readiness()).status, "ok");
  assert.deepEqual(await client.capabilities(), { capabilities: [] });
  await assert.rejects(() => client.complete({ model: "test", messages: [] }), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.statusCode, 503);
    assert.equal(error.code, "provider_unreachable");
    return true;
  });
});
