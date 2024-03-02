interface Props {
  isToday: boolean,
  date: number,
  fullDate: Date,
  startDragging: Function,
  stopDragging: Function,
  applyDragHighlighting: Function,
}

export default function DatePickerCell ({ isToday, date, fullDate, startDragging, stopDragging, applyDragHighlighting }: Props) {
  return (
    <div 
      className={`flex aspect-square items-center justify-center bg-theme-dark text-theme-white ${isToday && 'text-theme-yellow font-bold'}`}
      onMouseDownCapture={() => startDragging(fullDate) }
      onMouseUpCapture={(e) => { stopDragging(fullDate) }}
      onMouseOver={(e) => { applyDragHighlighting(fullDate) }}
    >
      {date}
    </div>
  )
}