This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database (Drizzle)

`.env`에 `DATABASE_URL`(PostgreSQL 연결 문자열)이 있어야 합니다.

### 스키마 반영 (push)

스키마 변경 후 DB에 그대로 반영할 때:

```bash
pnpm drizzle:push
```

### 시드

- **당첨 회차·당첨금**: `pnpm db:seed-prizes` (lotto_prizes.json → lotto_win_result, lotto_prize_stats)
- **당첨 판매점**: `pnpm db:seed-stores` (lotto_stores.csv → lotto_winning_stores, ltShpId 기준 upsert)

### `lotto_winning_stores` 스키마를 바꾼 뒤 할 일

1. 스키마 반영  
   ```bash
   pnpm drizzle:push
   ```
2. 판매점 시드 (기존 행은 ltShpId 기준으로 upsert)  
   ```bash
   pnpm db:seed-stores
   ```

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
