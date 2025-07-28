/**
 * 이건 내가 만든 라우터. 이걸 서버가 사용하게 하려면 등록을 시켜줘야함
 */

import { Hono } from "hono";
import { verifyToken } from "../../utils/utils";
import axios from "axios";
import { sql } from "../../db";

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

    let paymentKey = String(body.get("paymentKey"));
    let orderId = String(body.get("orderId") ?? "");
    let amount = Number(body.get("amount"));
    let paymentType = String(body.get("paymentType")); //paymentType
    const splittedOrderId = orderId.split("__");
    const user_idp = splittedOrderId[0];
    const product_idp = splittedOrderId[1];

    // 토스페이먼츠 API는 시크릿 키를 사용자 ID로 사용하고, 비밀번호는 사용하지 않습니다.
    // 비밀번호가 없다는 것을 알리기 위해 시크릿 키 뒤에 콜론을 추가합니다.
    const widgetSecretKey = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";
    const encryptedSecretKey =
      "Basic " + Buffer.from(widgetSecretKey + ":").toString("base64");

    // 결제를 승인하면 결제수단에서 금액이 차감돼요.
    await axios
      .post(
        "https://api.tosspayments.com/v1/payments/confirm",
        {
          orderId: orderId,
          amount: amount,
          paymentKey: paymentKey,
        },
        {
          headers: {
            Authorization: encryptedSecretKey,
            "Content-Type": "application/json",
          },
        }
      )
      .then(function (response: any) {
        // 결제 성공 비즈니스 로직을 구현하세요.
        console.log(response.data);
      })
      .catch(function (error: any) {
        // 결제 실패 비즈니스 로직을 구현하세요.
        console.log(error.response.data);
        result.success = false;
        result.message = `tosspay axios error. ${error?.message ?? ""}`;
        return c.json(result);
      });

    const [inserted] = await sql`
            INSERT INTO t_payment (user_idp, product_idp, price,paymentkey,orderid,paymenttype)
            VALUES (
              ${user_idp},
              ${product_idp},
              ${amount},
              ${paymentKey},
              ${orderId},
              ${paymentType}
            )
            RETURNING *
          `;

    return c.json(result);
  } catch (error: any) {
    result.success = false;
    result.message = `!!! tosspay error. ${error?.message ?? ""}`;
    return c.json(result);
  }
});

export default router;
