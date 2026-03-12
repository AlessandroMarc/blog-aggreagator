import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "schema.ts",
  out: "src/generated",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://alessandromarchesin:@localhost:5432/gator?sslmode=disable",
  },
});