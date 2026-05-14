// Loads .env.local then .env before any module reads process.env.
// Must be the first import in the worker entry file.
import { config } from "dotenv";
import { existsSync } from "node:fs";

if (existsSync(".env.local")) config({ path: ".env.local", override: false });
config({ override: false });
