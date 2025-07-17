/**
 * 이건 내가 만든 라우터. 이걸 서버가 사용하게 하려면 등록을 시켜줘야함
 */

import { Hono } from "hono";
import { verifyToken } from "../../utils/utils";
import { sql } from "../../db";
import axios from "axios";

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
    const images = body.getAll("images") as File[];
    let imageUrlList: string[] = [];
    // imageFiles: File[] 배열
    for (const img of images) {
      //console.log(file.name);// 1. 파일을 ArrayBuffer로 읽고 Buffer로 변환
      const arrayBuffer = await img.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 2. Base64 인코딩
      const base64Image = buffer.toString("base64");

      // 3. imgbb API 키
      const IMGBB_API_KEY = "07c1e5d07ef4c497e700e5b7c0416269"; // 🔁 여기에 본인 키 입력

      const res = await axios.post("https://api.imgbb.com/1/upload", null, {
        params: {
          key: IMGBB_API_KEY,
          image: base64Image,
        },
      });

      const imageUrl = res?.data?.data?.url;
      imageUrlList.push(imageUrl);
    }
    if (imageUrlList && imageUrlList?.length > 0) {
      const productIdp = upserted?.idp; // 고정된 상품 ID

      const values = imageUrlList
        .map((url) => `(${productIdp}, '${url}')`) // 💥 주의: 직접 문자열 삽입, SQL 인젝션 주의
        .join(", ");

      await sql.unsafe(
        `INSERT INTO t_product_img (product_idp, img_url) VALUES ${values}`
      );
    }

    return c.json({});
  } catch (error) {
    return c.json({ error });
  }
});

router.get("/:id", (c) => {
  const id = c.req.param("id");
  return c.text(`👤 유저 상세: ${id}`);
});

export default router;
