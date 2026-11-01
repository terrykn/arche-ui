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
  published_at: string;
}
