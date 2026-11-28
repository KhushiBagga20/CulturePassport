import { dbConfigured } from "../db";
import { githubStoreConfigured } from "./github-store";

/** Where editorial work is stored. GitHub wins over the database when both are configured. */
export type StoreMode = "github" | "postgres" | "local";
export const storeMode = (): StoreMode => (githubStoreConfigured() ? "github" : dbConfigured() ? "postgres" : "local");
/** true when editorial reads and writes go to PostgreSQL */
export const useDatabase = () => storeMode() === "postgres";
