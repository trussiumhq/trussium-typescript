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

test("additional capability methods use stable endpoint paths", async () => {
  const paths = [];
  const client = new TrussiumClient({
    baseUrl: "http://runtime.test",
    fetch: mockFetch((url) => {
      paths.push(url.pathname);
      return new Response('{"ok":true}');
    }),
  });
  const payload = { model: "test" };
  await client.embeddings(payload);
  await client.moderations(payload);
  await client.generateImage(payload);
  await client.rerank(payload);
  await client.translate({ model: "test", input: ["Hello"], target_language: "fr" }, "translation-1");
  await client.createBatch(payload);
  await client.getBatch("batch-1");
  await client.cancelBatch("batch-1");
  await client.createVideo(payload);
  await client.getVideo("video-1");
  await client.executeTool({ name: "echo", arguments: {} });
  await client.transcribe({ model: "whisper", filename: "audio.wav", audio: new Blob(["audio"]) });
  assert.deepEqual(paths, [
    "/v1/embeddings", "/v1/moderations", "/v1/images/generations", "/v1/rerankings", "/v1/translations",
    "/v1/batches", "/v1/batches/batch-1", "/v1/batches/batch-1/cancel", "/v1/videos",
    "/v1/videos/video-1", "/v1/tools/executions", "/v1/audio/transcriptions",
  ]);
});
