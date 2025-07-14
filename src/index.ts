// serve 라는 객체든, 함수든 뭐 요렇게 된놈을 가져와라
// @hono/node-server 라는 모듈 덩어리에서
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as dotenv from "dotenv";
import test1Router from "./router/test1.js";
import dbtest from "./router/dbtest/dbtest.js";
import auth from "./router/auth/auth.js";
import memoRouter from "./router/memo/memo.js";

// app 이라는 객체를 만들어라. Hono 라는 클래스를 통해서
// 클래스란건 어떻게 알음?? new 키워드 보고 눈치챔
const app = new Hono();

// .env.development 읽을건지, .env.production 읽을건지 결정
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: envFile });

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["*"],
  })
);



// get은 영어의 뜻에선 가져오다. 근데, 이게 http 이론에서도 등장
// endpoint도 있다 "/"
// 또 테스트도 해보고, "아... 이게 api endpoint구나" 이렇게 아는것
app.get("/", (c) => {
  return c.text(`${__dirname}`);
});

app.route("/test1", test1Router);
app.route("/dbtest", dbtest);
app.route("/api/auth", auth);
app.route("/api/memo", memoRouter);

/** 이건 코드가 드럽게 어렵게 생김
 * port:3000, console.log(`Server is running on http://localhost:${info.port}`);
 * 이걸 보고, 서버 돌리는 코드구나 하고 알게됨
 * 봐도 정 모르겠으면, gpt 한테 물어봄
 *
 * (info) => { 요건 콜백 함수인데, 지금 이 코드에서 뜻은
 * serve 함수 실행하고나면 (info) => { 요 함수를 갔다 써라. 니가 쓰고싶을때
 * 맘대로
 */
serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
