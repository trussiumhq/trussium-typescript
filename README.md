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

## Releases

Releases use [semantic-release](https://github.com/semantic-release/semantic-release)
on `main`. Conventional commits determine the semantic version, changelog, Git
tag, GitHub release, and npm publication. The release workflow runs the build
and tests first and requires the repository's `NPM_TOKEN`; GitHub supplies the
`GITHUB_TOKEN`. npm provenance is enabled for published packages.

## Development

```bash
npm install
npm test
```
