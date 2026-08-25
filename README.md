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

The SDK provides typed non-streaming chat completions, readiness, capability
discovery, embeddings, moderation, image generation, transcription, reranking,
batch jobs, video jobs, controlled tools, request-ID forwarding, and `ApiError`
responses. It uses
the host application's `fetch` implementation and requires Node 20 or a
compatible fetch runtime.

## Releases

Releases use [semantic-release](https://github.com/semantic-release/semantic-release)
on `main`. Conventional commits determine the semantic version, changelog, Git
tag, and GitHub release. npm publication is temporarily disabled until an
`NPM_TOKEN` is configured; the release workflow still runs the build and tests
and creates GitHub releases with `GITHUB_TOKEN`. When npm publication is
enabled, npm provenance is already configured.

Until the first npm publication, clone a tagged release and build it locally:

```bash
git clone https://github.com/trussiumhq/trussium-typescript.git
cd trussium-typescript
npm ci
npm run build
```

## Development

```bash
npm install
npm test
```
