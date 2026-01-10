import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "postgres://user:password@db/parking");

export default sql;
