interface Props {
  day_i: number,
  hour_i: number,
  hour: number,
  calendar: number[][],
  startDragging: Function,
  stopDragging: Function,
  applyDragHighlighting: Function
}

export default function CalendarInputCell ({ day_i, hour_i, hour, calendar, startDragging, stopDragging, applyDragHighlighting }: Props) {
  return (
    <div 
      key={`${day_i}-${hour_i}`}
      className={`h-min text-center select-none w-full ${ (calendar.length > day_i && calendar[day_i].length > hour_i && hour == 1) ? 'bg-theme-yellow text-opacity-100 text-theme-dark font-bold' : 'text-opacity-50 text-theme-white'}`}
      onMouseDownCapture={() => startDragging(day_i, hour_i) }
      onMouseUpCapture={(e) => { stopDragging(day_i, hour_i) }}
      onMouseOver={(e) => { applyDragHighlighting(day_i, hour_i) }}
    >
      <div className={`rounded-sm ${ (calendar.length > day_i && calendar[day_i].length > hour_i && hour == 1) ? 'hover:bg-white/10' : 'hover:bg-white/10'} m-1`}>
        {hour_i % 2 == 0 ? `${hour_i / 2}:00` : <br />}
      </div>
    </div>
  )
}