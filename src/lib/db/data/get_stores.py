import requests
import pandas as pd
from tqdm import tqdm
import time

start_round = 262
end_round = 1208
file_name = "lotto_stores_final.csv"

all_data = []

print(f"📡 Sat20 프로젝트: JSON 직접 수집 모드로 전환! (위도/경도 포함)")

for i in tqdm(range(start_round, end_round + 1)):
    # 데이터만 주는 API 주소로 직접 찌릅니다.
    url = f"https://www.dhlottery.co.kr/wnprchsplcsrch/selectLtWnShp.do?srchWnShpRnk=all&srchLtEpsd={i}"
    
    try:
        time.sleep(1) # JSON 방식은 가벼워서 더 빨리 긁어도 됩니다.
        response = requests.get(url, timeout=10)
        
        # JSON 데이터 추출
        json_data = response.json()
        
        if "data" in json_data and "list" in json_data["data"]:
            stores = json_data["data"]["list"]
            if stores:
                df = pd.DataFrame(stores)
                df['회차'] = i # 회차 정보 추가
                all_data.append(df)
        
    except Exception as e:
        print(f"\n⚠️ {i}회차 건너뜀: {e}")
        continue

if all_data:
    final_df = pd.concat(all_data, ignore_index=True)
    # 엑셀(CSV)로 저장
    final_df.to_csv(file_name, index=False, encoding='utf-8-sig')
    print(f"\n✅ 완료! 총 {len(final_df)}개의 판매점 데이터를 확보했습니다.")
    print(f"📍 위도/경도 데이터까지 포함되어 바로 지도에 뿌릴 수 있습니다!")
else:
    print("\n❌ 데이터를 가져오지 못했습니다.")