/**
 * 이건 내가 만든 라우터. 이걸 서버가 사용하게 하려면 등록을 시켜줘야함
 */

import { Hono } from "hono";
import { verifyToken } from "../../utils/utils.js";
import { sql } from "../../db.js";

const router = new Hono();

router.get("/list", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    code: "",
    data: null,
    message: ``,
  };

  try {
    // 1. Authorization 헤더 처리
    let authHeader = c.req.header("Authorization") ?? "";
    try {
      authHeader = authHeader.split("Bearer ")[1];
    } catch (error) {
      authHeader = "";
    }

    // 2. 토큰 검증
    const tokenData: any = verifyToken(authHeader);
    if (!tokenData?.idp) {
      result.success = false;
      result.message = "로그인이 필요합니다";
      return c.json(result);
    }

    // 3. 쌩쿼리로 메모 조회
    const memos = await sql`
      SELECT 
      idp
      ,title
      ,content
      ,user_idp as userIdp
      ,created_dt as createdDt
      FROM t_memo
      WHERE user_idp = ${tokenData.idp}
      ORDER BY created_dt DESC
      LIMIT 1000
    `;

    result.data = memos;
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = error?.message ?? "Unknown error";
    return c.json(result);
  }
});



router.get("/get_memo_by_idp", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    code: "",
    data: null,
    message: ``,
  };

  try {
    const idp = Number(c.req.query("idp"));

    if (!idp || isNaN(idp)) {
      result.success = false;
      result.message = "idp 파라미터가 올바르지 않습니다.";
      return c.json(result);
    }

    const rows = await sql`
      SELECT 
      idp
      ,title
      ,content
      ,user_idp as userIdp
      ,created_dt as createdDt
      FROM t_memo
      WHERE idp = ${idp}
      LIMIT 1
    `;

    const memo = rows[0] ?? null;

    result.data = memo;
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = error?.message ?? "Unknown error";
    return c.json(result);
  }
});

router.post("/upsert", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    code: "",
    data: null,
    message: ``,
  };

  try {
    // 1. Authorization 헤더 파싱
    let authHeader = c.req.header("Authorization") ?? "";
    try {
      authHeader = authHeader.split("Bearer ")[1];
    } catch {
      authHeader = "";
    }

    const tokenData: any = verifyToken(authHeader);
    if (!tokenData?.idp) {
      result.success = false;
      result.message = "로그인이 필요합니다";
      return c.json(result);
    }

    // 2. Body 파싱
    const body = await c.req.json();
    const idp = Number(body?.idp ?? 0);
    const title = String(body?.title ?? "").trim();
    const content = String(body?.content ?? "").trim();

    if (!title || !content) {
      result.success = false;
      result.message = "제목이나 내용을 입력해주세요";
      return c.json(result);
    }

    let upserted:any;
    // 3. UPSERT 실행
    if (idp > 0) {
    // UPDATE
    const [updated] = await sql`
      UPDATE t_memo
      SET
        title = ${title},
        content = ${content},
        user_idp = ${tokenData.idp}
      WHERE idp = ${idp}
      RETURNING *
    `;
    upserted=updated
    } else {
    // INSERT
    const [inserted] = await sql`
      INSERT INTO t_memo (title, content, user_idp)
      VALUES (
        ${title},
        ${content},
        ${tokenData.idp}
      )
      RETURNING *
    `;
    upserted=inserted
  }

    result.data = upserted;
    return c.json(result);

  } catch (error: any) {
    result.success = false;
    result.message = error?.message ?? "Unknown error";
    return c.json(result);
  }
});
router.post("/delete", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    code: "",
    data: null,
    message: ``,
  };

  try {
    const body = await c.req.json();
    const idp = Number(body?.idp ?? 0);

    if (!idp || isNaN(idp)) {
      result.success = false;
      result.message = `올바른 idp를 입력해주세요`;
      return c.json(result);
    }

    // 먼저 존재 여부 확인
    const rows = await sql`
      SELECT idp
      FROM t_memo
      WHERE idp = ${idp}
      LIMIT 1
    `;

    if (rows.length === 0) {
      result.success = false;
      result.message = `없는 데이터를 삭제하려고 합니다`;
      return c.json(result);
    }

    // 삭제 실행
    await sql`
      DELETE FROM t_memo
      WHERE idp = ${idp}
    `;

    return c.json(result);

  } catch (error: any) {
    result.success = false;
    result.message = error?.message ?? "Unknown error";
    return c.json(result);
  }
});

export default router;
