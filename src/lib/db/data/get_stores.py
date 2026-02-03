import requests
import pandas as pd
from tqdm import tqdm
import time
import os # 경로 처리를 위해 추가

# 현재 실행 중인 파일의 절대 경로를 기준으로 저장 위치 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
file_name = os.path.join(current_dir, "lotto_stores_final.csv")

start_round = 262
end_round = 1208
all_data = []

print(f"📡 Sat20 프로젝트: 수집 후 안전 저장 모드")
print(f"📍 저장 예정 위치: {file_name}")

try:
    for i in tqdm(range(start_round, end_round + 1)):
        url = f"https://www.dhlottery.co.kr/wnprchsplcsrch/selectLtWnShp.do?srchWnShpRnk=all&srchLtEpsd={i}"
        try:
            time.sleep(0.3) 
            response = requests.get(url, timeout=10)
            json_data = response.json()
            
            if "data" in json_data and "list" in json_data["data"]:
                stores = json_data["data"]["list"]
                if stores:
                    df = pd.DataFrame(stores)
                    df['round'] = i 
                    all_data.append(df)
        except Exception:
            continue

finally:
    # 에러가 나더라도 여기까지 수집된 데이터는 무조건 저장 시도
    if all_data:
        print(f"\n💾 데이터 병합 및 저장 중...")
        final_df = pd.concat(all_data, ignore_index=True)
        
        # 파일 저장 시 발생할 수 있는 오류 방지
        try:
            final_df.to_csv(file_name, index=False, encoding='utf-8-sig')
            print(f"✅ 저장 완료! 파일 위치: {file_name}")
            print(f"📊 총 수집 행수: {len(final_df)}행")
        except Exception as e:
            print(f"❌ 파일 저장 실패: {e}")
            # 최후의 수단: 현재 경로에 'backup.csv'로 시도
            final_df.to_csv("backup_lotto.csv", index=False, encoding='utf-8-sig')
            print("⚠️ backup_lotto.csv로 저장되었습니다.")
    else:
        print("\n❌ 수집된 데이터가 없습니다.")