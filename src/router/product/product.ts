/**
 * 이건 내가 만든 라우터. 이걸 서버가 사용하게 하려면 등록을 시켜줘야함
 */

import { Hono } from "hono";
import { verifyToken } from "../../utils/utils";
import { sql } from "../../db";

const router = new Hono();

router.get("/", (c) => {
  /**
   * http://localhost:3000/test1?ddd=33&a=뭐뭐뭐
   * 데이터 이름이 ddd 라는놈의 값을 가져와라
   */
  let ddd = c?.req?.query("ddd");
  let a = c?.req?.query("a");
  return c.json({ ddd, a });
});

router.post("/body", async (c) => {
  // const : 변경 불가능
  const body = await c?.req?.json();
  return c.json({ body });
});

/**
 * 그냥 데이터랑, 파일을 받을수 있다
 */
router.post("/product_upload", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    code: "",
    data: null,
    message: ``,
  };
  try {
    // formData 에서 데이터 꺼내기
    const body = await c?.req?.formData();

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
      // result.success = false;
      // result.message = "로그인이 필요합니다";
      // return c.json(result);
    }

    // 데이터 타입이 formData 인 body 변수에서 name 꺼냄
    let title = String(body.get("name"));
    let content = String(body.get("description"));
    let price = Number(body.get("price") ?? 0);
    let category_idp = Number(body.get("category_idp") ?? 0);
    let upserted: any;
    const [inserted] = await sql`
      INSERT INTO t_memo (title, content, price,category_idp)
      VALUES (
        ${title},
        ${content},
        ${price},
        ${category_idp},
      )
      RETURNING *
    `;
    upserted = inserted;

    // file1 꺼냄. :any 붙인 이유는 파일 타입은 굉장히 복잡하기 때문에, 자바스크립트 스타일로 하겠다.
    let file1: any = body.get("file1");
    let base64file = "";
    // 파일을 첨부했으면
    if (file1) {
      const arrayBuffer = await file1.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // 파일을 base64 라는 문자열로 변환해라
      base64file = buffer.toString("base64");
    }
    // 파일을 base64 라는 문자열로 그대로 보여준것. 그러니깐 컴퓨터가 파일을 보는 방식
    return c.json({ base64file, name });
  } catch (error) {
    return c.json({ error });
  }
});

router.get("/:id", (c) => {
  const id = c.req.param("id");
  return c.text(`👤 유저 상세: ${id}`);
});

export default router;
