/**
 * 이건 내가 만든 라우터. 이걸 서버가 사용하게 하려면 등록을 시켜줘야함
 */

import { Hono } from "hono";
import { verifyToken } from "../../utils/utils";

const router = new Hono();

router.post("/confirm", async (c) => {
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
      // result.success = false;
      // result.message = "로그인이 필요합니다";
      // return c.json(result);
    }

    const body = await c?.req?.json();

    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = `!!! tosspay error. ${error?.message ?? ""}`;
    return c.json(result);
  }
});

export default router;
