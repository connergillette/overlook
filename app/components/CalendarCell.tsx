import type { MouseEventHandler } from 'react'

interface Props {
  hour_i: number,
  hour: number,
  highlightedCellStyle: string,
  onMouseOver: MouseEventHandler<HTMLDivElement>,
}

export default function CalendarCell({ hour_i, hour, highlightedCellStyle, onMouseOver } : Props) {
  return (
    <div
      className={`\
    h-min text-center select-none w-full \
        ${(hour > 0) ? highlightedCellStyle : 'text-theme-white'}`}
      onMouseOver={onMouseOver}
    >
      <div className={`m-1`}>
        {hour_i % 2 == 0 ? `${hour_i / 2}:00` : <br />}
      </div>
    </div>
  )
}