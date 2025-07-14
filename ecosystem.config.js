module.exports = {
  apps: [
    {
      name: "hono_memo",
      script: "src/index.ts",
      interpreter: "tsx",
      env: {
        NODE_ENV: "production"
      },
      output: "./logs/hono_memo-out.log",
      error: "./logs/hono_memo-error.log"
    }
  ]
}
