import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "schema.ts",
  out: "src/generated",
  dialect: "postgresql",
  dbCredentials: {
    url: "your_connection_string",
  },
});