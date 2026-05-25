export type ApiParams = Record<string, string | number | boolean | null | undefined>;

export type EntryInput = {
  checkpointId?: string | null;
  checkpoint_id?: string | null;
  pillar: string;
  category: string;
  metricKey?: string;
  metric_key?: string;
  valueNumeric?: number | string | null;
  value_numeric?: number | string | null;
  valueText?: string | null;
  value_text?: string | null;
  valueBoolean?: boolean | null;
  value_boolean?: boolean | null;
  proofUrl?: string | null;
  proof_url?: string | null;
  proofType?: string | null;
  proof_type?: string | null;
  isVerified?: boolean;
  is_verified?: boolean;
  notes?: string | null;
  loggedAt?: string;
  logged_at?: string;
  entryDate?: string;
  entry_date?: string;
};

export type SelfCheckInput = {
  weekDate?: string;
  week_date?: string;
  energy?: number | null;
  sleepQuality?: number | null;
  sleep_quality?: number | null;
  relationshipQuality?: number | null;
  relationship_quality?: number | null;
  workSatisfaction?: number | null;
  work_satisfaction?: number | null;
  notes?: string | null;
};

type RequestOptions = Omit<RequestInit, "body"> & {
  params?: ApiParams;
  body?: unknown;
};

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const { params, headers, body, ...rest } = init;
  const baseUrl = typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    : window.location.origin;
  const url = new URL(path, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const requestBody: BodyInit | null | undefined = body
    ? isFormData
      ? body
      : typeof body === "string"
        ? body
        : JSON.stringify(body)
    : body === null
      ? null
      : undefined;

  const response = await fetch(url.toString(), {
    credentials: "include",
    ...rest,
    headers: isFormData
      ? headers
      : {
          "Content-Type": "application/json",
          ...headers,
        },
    body: requestBody,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || `Request failed with status ${response.status}`;
    try {
      const json = JSON.parse(text) as { error?: string; message?: string };
      message = json.error ?? json.message ?? message;
    } catch {
      // not JSON — use raw text as-is
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function fetchDashboard<T = unknown>() {
  return request<T>("/api/dashboard");
}

export function fetchCheckpoints<T = unknown>() {
  return request<T>("/api/checkpoints");
}

export function fetchCheckpoint<T = unknown>(id: string) {
  return request<T>(`/api/checkpoints/${id}`);
}

export function fetchEntries<T = unknown>(params?: ApiParams) {
  return request<T>("/api/entries", { params });
}

export function createEntry<T = unknown>(data: EntryInput) {
  return request<T>("/api/entries", { method: "POST", body: data });
}

export function deleteEntry<T = unknown>(id: number | string) {
  return request<T>(`/api/entries/${id}`, { method: "DELETE" });
}

export function updateEntry<T = unknown>(id: number | string, data: Partial<EntryInput>) {
  return request<T>(`/api/entries/${id}`, { method: "PUT", body: data });
}

export function fetchSelfChecks<T = unknown>() {
  return request<T>("/api/self-checks");
}

export function createSelfCheck<T = unknown>(data: SelfCheckInput) {
  return request<T>("/api/self-checks", { method: "POST", body: data });
}

export function fetchHabitLogs<T = unknown>(key: string) {
  return request<T>(`/api/habits/${key}`);
}

export function logHabit<T = unknown>(key: string, date: string, data: Record<string, unknown> = {}) {
  return request<T>(`/api/habits/${key}/${date}`, {
    method: "POST",
    body: data,
  });
}

export function fetchHabitStreak<T = unknown>(key: string) {
  return request<T>(`/api/habits/${key}/streak`);
}

export function updateProductLabel<T = unknown>(productKey: string, label: string) {
  return request<T>("/api/config/active", {
    method: "PATCH",
    body: { productKey, label },
  });
}

export function fetchConfig<T = unknown>() {
  return request<T>("/api/config/active");
}

export function exportData<T = unknown>() {
  return request<T>("/api/config/export");
}

export function importConfig<T = unknown>(mode: string, config: unknown) {
  return request<T>("/api/config", {
    method: "POST",
    body: { mode, config },
  });
}
