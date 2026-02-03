/**
 * lotto_win_result 스키마에는 odd_even, high_low, total_sum 컬럼이 없습니다.
 * 해당 값은 lotto_prizes.json 필수 키만 저장하므로 이 스크립트는 더 이상 사용하지 않습니다.
 */
async function updatePatterns() {
  console.log('ℹ️  update-patterns: lotto_win_result no longer has odd_even, high_low, total_sum. No-op.')
  process.exit(0)
}

updatePatterns()
