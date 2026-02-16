import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const notebooks = sqliteTable("notebooks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  notebookId: text("notebook_id")
    .notNull()
    .references(() => notebooks.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  rawContent: text("raw_content"),
  status: text("status").notNull().default("uploading"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const chunks = sqliteTable("chunks", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  startChar: integer("start_char").notNull().default(0),
  endChar: integer("end_char").notNull().default(0),
  metadata: text("metadata"),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  notebookId: text("notebook_id")
    .notNull()
    .references(() => notebooks.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  sources: text("sources"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
