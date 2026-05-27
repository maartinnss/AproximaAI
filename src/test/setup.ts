import { vi } from "vitest";

process.env.AUTH_SECRET = "test-secret-with-at-least-32-characters-xxxx";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test";
process.env.META_VERIFY_TOKEN = "verify-me";
process.env.META_APP_SECRET = "app-secret-xyz";
process.env.META_GRAPH_VERSION = "v21.0";
process.env.META_ACCESS_TOKEN = "tok";

vi.mock("server-only", () => ({}));
