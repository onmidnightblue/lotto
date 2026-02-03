-- lotto_winning_stores 테이블을 새 스키마로 교체 (PK = round, rnum, region 등 필수 키 포함)
-- 실행 후: pnpm db:seed-stores

-- 기존 테이블 삭제 (데이터 삭제됨)
DROP TABLE IF EXISTS lotto_winning_stores;

-- 새 테이블 생성
CREATE TABLE lotto_winning_stores (
  "round" integer NOT NULL REFERENCES lotto_win_result(id),
  rnum integer NOT NULL,
  shp_nm text NOT NULL,
  shp_telno text,
  region text,
  tm1_shp_lctn_addr text,
  tm2_shp_lctn_addr text,
  tm3_shp_lctn_addr text,
  shp_addr text,
  atmt_psv_yn text,
  lt_shp_id text,
  slr_oper_stts_cd text,
  l645_lt_ntsl_yn text,
  wn_shp_rnk integer DEFAULT 1,
  shp_lat double precision,
  shp_lot double precision,
  created_at timestamp DEFAULT now(),
  PRIMARY KEY ("round", rnum)
);
