import {
  pgTable,
  serial,
  varchar,
  integer,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

/* ------------------ ENUMS ------------------ */
export const transactionTypeEnum = pgEnum("transaction_type", [
  "IN", // New delivery
  "OUT", // Released
  "FORWARD", // Forwarded balance
]);

export const itemStatusEnum = pgEnum("item_status", [
  "IN_STOCK",
  "OUT_OF_STOCK",
]);

/* ------------------ CATEGORIES ------------------ */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* ------------------ ITEMS ------------------ */
export const items = pgTable("items", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),
  categoryId: integer("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),

  status: itemStatusEnum("status").default("IN_STOCK"),

  createdAt: timestamp("created_at").defaultNow(),
});

/* ------------------ INVENTORY TRANSACTIONS ------------------ */
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),

  itemId: integer("item_id")
    .references(() => items.id, { onDelete: "cascade" })
    .notNull(),

  type: transactionTypeEnum("type").notNull(),

  quantity: integer("quantity").notNull(),

  remarks: text("remarks"),

  createdAt: timestamp("created_at").defaultNow(),
});

/* ------------------ INVENTORY SUMMARY (CURRENT STATE) ------------------ */
export const inventorySummary = pgTable("inventory_summary", {
  id: serial("id").primaryKey(),

  itemId: integer("item_id")
    .references(() => items.id, { onDelete: "cascade" })
    .unique()
    .notNull(),

  beginningStock: integer("beginning_stock").default(0),
  forwardedBalance: integer("forwarded_balance").default(0),
  totalIn: integer("total_in").default(0),
  totalOut: integer("total_out").default(0),
  actualBalance: integer("actual_balance").default(0),

  updatedAt: timestamp("updated_at").defaultNow(),
});
