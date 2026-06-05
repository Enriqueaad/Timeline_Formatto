import path from "node:path";
import { defineConfig } from "prisma/config";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: false });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
