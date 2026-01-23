/**
 * 로또 번호별 볼 색상 유틸리티
 */
export function getBallColorClass(num: number): string {
  if (num >= 1 && num <= 10) {
    // 노란색 (1-10)
    return 'bg-[#FFCC00] text-black'
  } else if (num >= 11 && num <= 20) {
    // 파란색 (11-20)
    return 'bg-[#0099FF] text-white'
  } else if (num >= 21 && num <= 30) {
    // 빨간색 (21-30)
    return 'bg-[#FF3333] text-white'
  } else if (num >= 31 && num <= 40) {
    // 회색 (31-40)
    return 'bg-[#888888] text-white'
  } else if (num >= 41 && num <= 45) {
    // 초록색 (41-45)
    return 'bg-[#22CC22] text-white'
  }
  // 기본값
  return 'bg-slate-200 text-slate-700'
}
