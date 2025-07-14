import { neon } from "@neondatabase/serverless";

let dburl = `postgres://neondb_owner:npg_xSQ3ulX4RnJr@ep-billowing-cake-adi3zufj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`;
if (process.env.NODE_ENV.includes("dev"))
  dburl = `postgres://neondb_owner:npg_xSQ3ulX4RnJr@ep-billowing-cake-adi3zufj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`;
export const sql = neon(dburl);
