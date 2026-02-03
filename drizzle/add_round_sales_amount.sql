-- lotto_win_result에 round_sales_amount 컬럼 추가 (Supabase SQL Editor에서 실행)
ALTER TABLE lotto_win_result
ADD COLUMN IF NOT EXISTS round_sales_amount bigint;
