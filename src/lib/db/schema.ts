import {
  pgTable,
  serial,
  varchar,
  integer,
  text,
  timestamp,
  pgEnum,
  index,
  numeric, 
  boolean, 
} from "drizzle-orm/pg-core";

/* =========================================================
   ENUMS (unchanged)
========================================================= */
export const transactionTypeEnum = pgEnum("transaction_type", [
  "IN", // New delivery
  "OUT", // Released
  "FORWARD", // Forwarded balance
]);

export const itemStatusEnum = pgEnum("item_status", [
  "IN_STOCK",
  "OUT_OF_STOCK",
]);

/* =========================================================
   USERS (unchanged)
========================================================= */
export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  role: varchar("role", { length: 50 }).default("staff"),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================================================
   UNITS (unchanged — already good for box, piece, roll, bottle, bundle, etc.)
========================================================= */
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // "box", "piece", "roll", "bottle", "bundle", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================================================
   SUPPLIERS (unchanged)
========================================================= */
// export const suppliers = pgTable("suppliers", {
//   id: serial("id").primaryKey(),
//   name: varchar("name", { length: 255 }).notNull(),
//   contact: varchar("contact", { length: 100 }),
//   createdAt: timestamp("created_at").defaultNow(),
// });

/* =========================================================
   CATEGORIES (unchanged)
========================================================= */
// export const categories = pgTable("categories", {
//   id: serial("id").primaryKey(),
//   name: varchar("name", { length: 100 }).notNull().unique(),
//   description: text("description"),
//   createdAt: timestamp("created_at").defaultNow(),
// });

/* =========================================================
   ITEMS — added procurement-related fields
========================================================= */
export const items = pgTable(
  "items",
  {
    id: serial("id").primaryKey(),

    name: varchar("name", { length: 255 }).notNull(),

    description: varchar("description", { length: 255 }).notNull(),

    beginingStock: integer("begining_stock").default(0),

    newDeliveryStock: integer("new_delivery_stock").default(0),

    releaseStock: integer("release_stock").default(0),

    actualBalance: integer("actual_balance").default(0),

    // ── NEW ───────────────────────────────────────────────
    stockNo: varchar("stock_no", { length: 255 }), // e.g. internal stock/reference number if used
    // ──────────────────────────────────────────────────────

    // categoryId: integer("category_id")
    //   .references(() => categories.id, { onDelete: "cascade" })
    //   .notNull(),

    unitId: integer("unit_id")
      .references(() => units.id)
      .notNull(),

    // ── NEW ───────────────────────────────────────────────
    unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).default("0.00"), // e.g. 240.00, 15.00, 600.00
    // Useful for quick reference / reports / PO recreation
    // ──────────────────────────────────────────────────────

    status: itemStatusEnum("status").default("IN_STOCK"),

    // ── NEW (optional) ────────────────────────────────────
    isActive: boolean("is_active").default(true), // soft delete / archive old items
    // ──────────────────────────────────────────────────────

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // categoryIdx: index("items_category_idx").on(table.categoryId),
    // optional: add index if you query by stock number frequently
    stockNoIdx: index("items_stock_no_idx").on(table.stockNo),
  })
);

/* =========================================================
   INVENTORY TRANSACTIONS — added cost capture
========================================================= */
export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: serial("id").primaryKey(),

    itemId: integer("item_id")
      .references(() => items.id, { onDelete: "cascade" })
      .notNull(),

    // supplierId: integer("supplier_id").references(() => suppliers.id),

    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),

    type: transactionTypeEnum("type").notNull(),

    quantity: integer("quantity").notNull(),

    // ── NEW ───────────────────────────────────────────────
    unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).default("0.00"),
    totalCost: numeric("total_cost", { precision: 14, scale: 2 }).default(
      "0.00"
    ),
    // These two allow you to record historical purchase prices per transaction
    // Very useful when unit cost changes over time
    // ──────────────────────────────────────────────────────

    remarks: text("remarks"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    itemIdx: index("inv_tx_item_idx").on(table.itemId),
  })
);

/* =========================================================
   INVENTORY SUMMARY (unchanged — still good as derived/current state)
========================================================= */
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

/* =========================================================
   STOCK CARD (unchanged — ledger style)
========================================================= */
export const stockCards = pgTable(
  "stock_cards",
  {
    id: serial("id").primaryKey(),

    itemId: integer("item_id")
      .references(() => items.id, { onDelete: "cascade" })
      .notNull(),

    transactionId: integer("transaction_id")
      .references(() => inventoryTransactions.id, { onDelete: "cascade" })
      .notNull(),

    inQty: integer("in_qty").default(0),
    outQty: integer("out_qty").default(0),

    balance: integer("balance").notNull(),

    // ── NEW (optional but recommended) ────────────────────
    runningTotalCost: numeric("running_total_cost", {
      precision: 14,
      scale: 2,
    }),
    // If you want to keep value-based tracking (FIFO/average cost)
    // ──────────────────────────────────────────────────────

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    itemIdx: index("stock_card_item_idx").on(table.itemId),
  })
);
