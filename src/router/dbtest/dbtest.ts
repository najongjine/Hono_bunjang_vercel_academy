import { Hono } from "hono";
import { sql } from "../../db.js";

const router = new Hono();

/**
 * GET /t_dummy1
 * SELECT * FROM t_dummy1 LIMIT 1000
 */
router.get("/t_dummy1", async (c) => {
  try {
    let ddd = c.req.query("ddd");
    let a = c.req.query("a");

    const dummy1data = await sql`
      SELECT *
      FROM t_dummy1
      LIMIT 1000
    `;

    return c.json({ dummy1data });
  } catch (error: any) {
    return c.json(error?.message ?? "Unknown error");
  }
});

/**
 * GET /t_dummy2
 * SELECT * FROM t_user
 */
router.get("/t_dummy2", async (c) => {
  try {
    let ddd = c.req.query("ddd");
    let a = c.req.query("a");

    const data = await sql`
      SELECT *
      FROM t_user
    `;

    return c.json({ data });
  } catch (error: any) {
    return c.json(error?.message ?? "Unknown error");
  }
});

/**
 * POST /body
 * INSERT INTO t_dummy1 (name) VALUES ($1)
 * RETURNING *
 */
router.post("/body", async (c) => {
  try {
    const body = await c.req.json();
    let name = body?.name ?? "";

    const [newDummy] = await sql`
      INSERT INTO t_dummy1 (name)
      VALUES (${name})
      RETURNING *
    `;

    return c.json({ newDummy });
  } catch (error: any) {
    return c.json(error?.message ?? "Unknown error");
  }
});

export default router;
