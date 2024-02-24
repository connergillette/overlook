export function decodeCalendarState (encoded: string): number[][] {
  const data = encoded.split('-')
  const decoded = []
  for (let day = 0; day < 7; day++) {
    const subarr = []
    for (let segment = day * 48; segment < (day * 48) + 48; segment++) {
      const segmentArr = data[segment].split('-')
      for (const value of segmentArr) {
        subarr.push(parseInt(value))
      }
    }
    decoded.push(subarr)
  }
  return decoded
}

export function encodeCalendarState (calendar : string[][]) : string {
  let encoded = []
  for (let i = 0; i < calendar.length; i++) {
    for (let j = 0; j < calendar[i].length; j++) {
      encoded.push(calendar[i][j] ? calendar[i][j] : 0)
    }
  }

  return encoded.join('-')
}