export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  theme: "light" | "dark" | "system";
  registry_token_hash: string | null;
  registry_token_prefix: string | null;
  registry_token_created_at: string | null;
}

export interface Library {
  id: string;
  owner: string;
  application_id: string | null;
  name: string;
  slug: string;
  visibility: "public" | "private";
  payload: unknown;
  created_at: string;
  updated_at: string;
}

export interface LibraryVersion {
  id: string;
  library_id: string;
  version: number;
  payload_hash: string;
  snapshot: Record<string, string>;
  payload?: unknown;
  published_at: string;
}

export interface McpToken {
  id: string;
  user_id: string;
  token_hash: string;
  label: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}
