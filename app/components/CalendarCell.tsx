interface Props {
  hour_i: number,
  hour: number,
  highlightedCellStyle: string
}

export default function CalendarCell({ hour_i, hour, highlightedCellStyle } : Props) {
  return (
    <div
      className={`\
    h-min text-center select-none w-full \
        ${(hour > 0) ? highlightedCellStyle : 'text-theme-white'}`}
    >
      <div className={`m-1`}>
        {hour_i % 2 == 0 ? `${hour_i / 2}:00` : <br />}
      </div>
    </div>
  )
}