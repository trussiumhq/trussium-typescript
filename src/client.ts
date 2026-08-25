export interface TrussiumClientOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_output_tokens?: number;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface ChatChoice {
  index: number;
  message: Message;
  finish_reason: string;
}

export interface ChatCompletion {
  id: string;
  provider: string;
  model: string;
  choices: ChatChoice[];
  usage: TokenUsage;
}

export interface Readiness { status: string }
export interface Capability { name: string; description?: string }
export interface Capabilities { capabilities: Capability[] }
export type JsonPayload = Record<string, unknown>;

export interface TranscriptionRequest {
  model: string;
  filename: string;
  audio: Blob;
  contentType?: string;
  language?: string;
  prompt?: string;
  temperature?: number;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;

  constructor(statusCode: number, code?: string) {
    super(`Trussium runtime returned HTTP ${statusCode}${code ? `: ${code}` : ""}`);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class TrussiumClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof globalThis.fetch;

  constructor(options: TrussiumClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "http://127.0.0.1:9000").replace(/\/$/, "");
    this.fetcher = options.fetch ?? globalThis.fetch;
  }

  async complete(request: ChatCompletionRequest, requestId?: string): Promise<ChatCompletion> {
    return this.request<ChatCompletion>("/v1/chat/completions", {
      method: "POST", body: JSON.stringify(request), requestId,
    });
  }

  async readiness(): Promise<Readiness> {
    return this.request<Readiness>("/health/ready");
  }

  async capabilities(): Promise<Capabilities> {
    return this.request<Capabilities>("/v1/capabilities");
  }

  async embeddings(request: JsonPayload): Promise<JsonPayload> {
    return this.request<JsonPayload>("/v1/embeddings", this.jsonOptions(request));
  }

  async moderations(request: JsonPayload): Promise<JsonPayload> {
    return this.request<JsonPayload>("/v1/moderations", this.jsonOptions(request));
  }

  async generateImage(request: JsonPayload): Promise<JsonPayload> {
    return this.request<JsonPayload>("/v1/images/generations", this.jsonOptions(request));
  }

  async rerank(request: JsonPayload): Promise<JsonPayload> {
    return this.request<JsonPayload>("/v1/rerankings", this.jsonOptions(request));
  }

  async createBatch(request: JsonPayload): Promise<JsonPayload> {
    return this.request<JsonPayload>("/v1/batches", this.jsonOptions(request));
  }

  async getBatch(batchId: string): Promise<JsonPayload> {
    return this.request<JsonPayload>(`/v1/batches/${batchId}`);
  }

  async cancelBatch(batchId: string): Promise<JsonPayload> {
    return this.request<JsonPayload>(`/v1/batches/${batchId}/cancel`, { method: "POST" });
  }

  async createVideo(request: JsonPayload): Promise<JsonPayload> {
    return this.request<JsonPayload>("/v1/videos", this.jsonOptions(request));
  }

  async getVideo(videoId: string): Promise<JsonPayload> {
    return this.request<JsonPayload>(`/v1/videos/${videoId}`);
  }

  async executeTool(request: JsonPayload): Promise<JsonPayload> {
    return this.request<JsonPayload>("/v1/tools/executions", this.jsonOptions(request));
  }

  async transcribe(request: TranscriptionRequest): Promise<JsonPayload> {
    const form = new FormData();
    form.set("model", request.model);
    form.set("file", request.audio, request.filename);
    for (const [key, value] of Object.entries(request)) {
      if (key !== "model" && key !== "audio" && key !== "filename" && value !== undefined) {
        form.set(key, String(value));
      }
    }
    return this.request<JsonPayload>("/v1/audio/transcriptions", { body: form });
  }

  private jsonOptions(request: JsonPayload): { method: string; body: string } {
    return { method: "POST", body: JSON.stringify(request) };
  }

  private async request<T>(path: string, options: { method?: string; body?: BodyInit; requestId?: string } = {}): Promise<T> {
    const headers = new Headers({ Accept: "application/json" });
    if (typeof options.body === "string") headers.set("Content-Type", "application/json");
    if (options.requestId) headers.set("X-Request-ID", options.requestId);
    let response: Response;
    try {
      response = await this.fetcher(`${this.baseUrl}${path}`, {
        method: options.method ?? "GET", headers, body: options.body,
      });
    } catch (error) {
      throw new Error("Trussium runtime request failed.", { cause: error });
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: { code?: string } };
      throw new ApiError(response.status, payload.error?.code);
    }
    return await response.json() as T;
  }
}
