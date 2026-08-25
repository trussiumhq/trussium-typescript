# Trussium TypeScript SDK

The official TypeScript SDK calls an existing Trussium runtime. It does not
install or host the runtime, Kubernetes, Helm, or `trussium-operator`.

```bash
npm install @trussium/sdk
```

```ts
import { TrussiumClient } from "@trussium/sdk";

const client = new TrussiumClient({ baseUrl: "http://127.0.0.1:9000" });
const completion = await client.complete(
  { model: "gpt-4.1-mini", messages: [{ role: "user", content: "Say hello." }] },
  "request-123",
);
```

The foundation provides typed non-streaming chat completions, readiness,
capability discovery, request-ID forwarding, and `ApiError` responses. It uses
the host application's `fetch` implementation and requires Node 20 or a
compatible fetch runtime.

## Development

```bash
npm install
npm test
```
