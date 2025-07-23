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

router.get("/get_product_by_idp", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    code: "",
    data: null,
    message: ``,
  };
  try {
    const idp = c.req.query("idp");
    console.log(`## idp: ${idp}`);

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

    let data: any;
    data = await sql`
SELECT
p.idp
,p.title
,p.content
,p.price
,p.category_idp
,p.created_dt
,p.updated_dt
,MAX(c.category_name) as category_name
,COALESCE(
  json_agg(
    json_build_object(
      'img_idp', pi.idp,
      'img_url', pi.img_url,
      'product_idp', pi.product_idp,
      'created_dt', pi.created_dt
    )
  ) FILTER (WHERE pi.idp IS NOT NULL),
  '[]'
) AS imgs

FROM t_product AS p
LEFT JOIN t_product_img pi ON p.idp = pi.product_idp
LEFT JOIN t_category as c ON c.idp=p.category_idp
WHERE p.idp = ${idp}
GROUP BY p.idp
LIMIT 1
    `;
    try {
      data = data[0];
    } catch (error) {
      data = null;
    }
    console.log(`## data: `, data);

    result.data = data;
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = `!!! product_upload error. ${error?.message ?? ""}`;
    return c.json(result);
  }
});

router.get("/get_product_list", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    code: "",
    data: null,
    message: ``,
  };
  try {
    const page_no = Number(c.req.query("page_no") ?? 1);
    const item_limit = Number(c.req.query("item_limit") ?? 50);

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

    let data: any;
    data = await sql`
SELECT
p.idp
,p.title
,p.content
,p.price
,p.category_idp
,p.created_dt
,p.updated_dt
,MAX(c.category_name) as category_name
,COALESCE(
  json_agg(
    json_build_object(
      'img_idp', pi.idp,
      'img_url', pi.img_url,
      'product_idp', pi.product_idp,
      'created_dt', pi.created_dt
    )
  ) FILTER (WHERE pi.idp IS NOT NULL),
  '[]'
) AS imgs

FROM t_product AS p
LEFT JOIN t_product_img pi ON p.idp = pi.product_idp
LEFT JOIN t_category as c ON c.idp=p.category_idp
GROUP BY p.idp
ORDER BY p.created_dt DESC
OFFSET (${page_no} - 1) * ${item_limit}
LIMIT ${item_limit}
;
    `;
    try {
      data = data[0];
    } catch (error) {
      data = null;
    }
    console.log(`## data: `, data);

    result.data = data;
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = `!!! product_upload error. ${error?.message ?? ""}`;
    return c.json(result);
  }
});

router.get("/get_category_list", async (c) => {
  let result: { success: boolean; data: any; code: string; message: string } = {
    success: true,
    code: "",
    data: null,
    message: ``,
  };
  try {
    //const idp = c.req.query("idp");

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

    let data: any;
    data = await sql`
SELECT
*
FROM t_category
ORDER BY category_name ASC
    `;
    try {
      //data = data[0];
    } catch (error) {
      data = null;
    }
    console.log(`## data: `, data);

    result.data = data;
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = `!!! product_upload error. ${error?.message ?? ""}`;
    return c.json(result);
  }
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
    let product_idp = Number(body.get("product_idp") ?? 0);
    let price = Number(body.get("price") ?? 0);
    let category_idp = Number(body.get("category_idp") ?? 0);
    console.log(`## product_idp:`, product_idp);
    let upserted: any;
    upserted = await sql`
    SELECT
    *
    FROM t_product as p
    WHERE p.idp = ${product_idp}
    `;
    console.log(`## select upserted:`, upserted);
    try {
      upserted = upserted[0];
    } catch (error) {
      upserted = null;
    }
    if (!upserted?.idp) {
      console.log(`## insert`);
      const [inserted] = await sql`
      INSERT INTO t_product (title, content, price,category_idp)
      VALUES (
        ${title},
        ${content},
        ${price},
        ${category_idp}
      )
      RETURNING *
    `;
      upserted = inserted;
      console.log(`## INSERT upserted:`, upserted);
    } else {
      const [updated] = await sql`
      UPDATE t_product
      SET
        title = ${title},
        content = ${content},
        price = ${price},
        category_idp=${category_idp}
      WHERE idp = ${product_idp}
      RETURNING *
    `;
      upserted = updated;
      console.log(`## UPDATE upserted:`, upserted);
    }

    const images: any = body.getAll("images");
    console.log(`## images:`, images);
    let imageUrlList: string[] = [];
    for (const img of images) {
      //console.log(img.name);// 1. 파일을 ArrayBuffer로 읽고 Buffer로 변환
      const arrayBuffer = await img.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = buffer.toString("base64");
      const IMGBB_API_KEY = process.env.IMGBB_API_KEY ?? "";

      const formData = new FormData();
      formData.append("key", IMGBB_API_KEY);
      formData.append("image", base64Image);

      const res = await axios.post("https://api.imgbb.com/1/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = res?.data?.data?.url;
      console.log(`## imageUrl:`, imageUrl);
      imageUrlList.push(imageUrl);
    }
    if (imageUrlList && imageUrlList?.length > 0) {
      const productIdp = upserted?.idp ?? 0; // 고정된 상품 ID
      await sql`DELETE FROM t_product_img WHERE product_idp = ${productIdp}`;
      for (const url of imageUrlList) {
        await sql`
        INSERT INTO t_product_img (product_idp, img_url)
        VALUES (${productIdp}, ${url})
      `;
      }
      console.log(`## imageUrlList: ${imageUrlList}`);
    }

    result.data = upserted;
    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = `!!! product_upload error. ${error?.message ?? ""}`;
    return c.json(result);
  }
});

router.get("/:id", (c) => {
  const id = c.req.param("id");
  return c.text(`👤 유저 상세: ${id}`);
});

export default router;
