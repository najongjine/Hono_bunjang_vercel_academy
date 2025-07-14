/**
 * 이건 내가 만든 라우터. 이걸 서버가 사용하게 하려면 등록을 시켜줘야함
 */

import { Hono } from "hono";
import {
  comparePassword,
  generateToken,
  hashPassword,
  verifyToken,
} from "../../utils/utils.js";
import { instanceToPlain } from "class-transformer";
import { sql } from "../../db.js";

const router = new Hono();

router.post("/register", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    data: null,
    code: "",
    message: ``,
  };
  try {
    const reqs = await c.req.json();
    let username = String(reqs?.username ?? "").trim();
    let password = String(reqs?.password ?? "").trim();

    // 1. 사용자 존재 여부 확인
    const existingUser = await sql`
      SELECT idp, username
      FROM t_user
      WHERE username = ${username}
      LIMIT 1
    `;

    if (existingUser.length > 0 && existingUser[0]?.idp) {
      result.success = false;
      result.message = `이미 가입된 회원입니다`;
      return c.json(result);
    }

    // 2. 단방향 암호화
    const hashedPassword = await hashPassword(password);

    // 3. 신규 유저 INSERT
    const [newUser] = await sql`
      INSERT INTO t_user (username, password)
      VALUES (${username}, ${hashedPassword})
      RETURNING *
    `;

    // 4. 비밀번호는 응답에서 제거
    newUser.password = "";

    // 5. 민증(토큰) 발급
    const userToken = generateToken(newUser, "999d");

    // 6. 응답 반환
    result.data = { userData: newUser, userToken };
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = error?.message ?? "";
    return c.json(result);
  }
});


router.post("/login", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    data: null,
    code: "",
    message: ``,
  };

  try {
    const reqs = await c.req.json();
    const username = String(reqs?.username ?? "").trim();
    const password = String(reqs?.password ?? "").trim();

    // 1. 유저 조회
    const userRows = await sql`
      SELECT *
      FROM t_user
      WHERE username = ${username}
      LIMIT 1
    `;

    const userData = userRows[0];

    // 2. 존재 여부 확인
    if (!userData?.idp) {
      result.success = false;
      result.message = `가입되지 않거나, 잘못된 비밀번호 입니다`;
      return c.json(result);
    }

    // 3. 비밀번호 검증
    const isPasswordMatch = await comparePassword(password, userData.password ?? "");

    if (!isPasswordMatch) {
      result.success = false;
      result.message = `가입되지 않거나, 잘못된 비밀번호 입니다`;
      return c.json(result);
    }

    // 4. 비밀번호 제거
    userData.password = "";

    // 5. 토큰 발급
    const payload = instanceToPlain(userData);
    const userToken = generateToken(payload, "999d");

    result.data = {
      userData,
      userToken,
    };

    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = error?.message ?? "Unknown error";
    return c.json(result);
  }
});

router.post("/validate", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    data: null,
    code: "",
    message: ``,
  };
  try {
    // body 에서 받은 데이터들
    const reqs = await c?.req?.json();
    // reqs 에서 username 꺼내기
    const token = String(reqs?.token ?? "");
    const btoken = verifyToken(token);
    if (!btoken) {
      result.success = false;
      result.message = `토근정보가 잘못됬습니다. 다시 로그인 해주세요`;
      return c.json(result);
    }

    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = error?.message ?? "";
    return c.json(result);
  }
});

router.get("/info", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    data: null,
    code: "",
    message: ``,
  };
  try {
    const authHeader = String(c?.req?.header("Authorization") ?? "");
    const token = authHeader.split(" ")[1];
    const decoded: any = verifyToken(token);
    console.log(decoded);
    const hasMasterRole = decoded?.tUserRoles?.some(
      (role: any) => role.roleName === "master"
    );
    if (hasMasterRole) result.data = `마스터 권한이 있습니다`;
    else result.data = `마스터 권한이 없습니다`;
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = error?.message ?? "";
    return c.json(result);
  }
});

export default router;
