/**
 * 이건 내가 만든 라우터. 이걸 서버가 사용하게 하려면 등록을 시켜줘야함
 */

import { Hono } from "hono";

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
router.post("/formdata", async (c) => {
  try {
    // formData 에서 데이터 꺼내기
    const body = await c?.req?.formData();
    // 데이터 타입이 formData 인 body 변수에서 name 꺼냄
    let name = body.get("name");
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
