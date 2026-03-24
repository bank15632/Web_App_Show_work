import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

export interface TrackerEnv {
  DB: D1Database;
  ARTIFACTS_BUCKET: R2Bucket;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  NEXT_INC_CACHE_R2_BUCKET?: R2Bucket;
  OWNER_PIN?: string;
}
