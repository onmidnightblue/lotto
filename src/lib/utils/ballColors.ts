/**
 * 로또 번호별 볼 색상 유틸리티
 */
export function getBallColorClass(num: number): string {
  if (num >= 1 && num <= 10) {
    return 'bg-[#e08f00] text-white'   // 1~10
  } else if (num >= 11 && num <= 20) {
    return 'bg-[#0063cc] text-white'   // 11~20
  } else if (num >= 21 && num <= 30) {
    return 'bg-[#d8314f] text-white'   // 21~30
  } else if (num >= 31 && num <= 40) {
    return 'bg-[#6e7382] text-white'   // 31~40
  } else if (num >= 41 && num <= 45) {
    return 'bg-[#2c9e44] text-white'   // 41~45
  }
  return 'bg-slate-200 text-slate-700'
}
