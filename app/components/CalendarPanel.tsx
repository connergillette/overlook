import React, { useEffect, useState } from 'react';
import { render } from 'react-dom'

export default function CalendarPanel ({ }) {
  const [calendar, setCalendar] = useState(Array.from({length: 7}, () => Array.from({length: 24}, () => false)))
  const [rerender, setRerender] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [mouseDownPos, setMouseDownPos] = useState(null)
  // const [mouseUpPos, setMouseUpPos] = useState(null)
  const [highlightType, setHighlightType] = useState(true)

  useEffect(() => {
    if (rerender) {
      setRerender(false)
    }
  }, [rerender])

  const highlightCell = (day, hour) => {
    // calendar[day][hour] = !(calendar[day][hour])
    calendar[day][hour] = highlightType
    setCalendar(calendar)
    setRerender(true)
  }

  const startDragging = (day, hour) => {
    if (!isDragging) {
      console.log(`started dragging {day: ${day}, hour: ${hour}}`)
      setIsDragging(true)
      setMouseDownPos([day, hour])
      setHighlightType(!calendar[day][hour])
    }
  }

  const applyDragHighlighting = (day, hour) => {
    if (isDragging) {
      const [startDay, startHour] = mouseDownPos
      const minX = Math.min(startDay, day)
      const minY = Math.min(startHour, hour)
      const maxX = Math.max(startDay, day)
      const maxY = Math.max(startHour, hour)

      for (let i = minX; i <= maxX; i++) {
        for (let j = minY; j <= maxY; j++) {
          highlightCell(i, j)
        }
      }
    }
  }

  const applyTouchHighlighting = (day, hour) => {
    highlightCell(day, hour)
  }
  
  const stopDragging = (endDay, endHour) => {
    console.log(`stopped dragging {day: ${endDay}, hour: ${endHour}}`)
    applyDragHighlighting(endDay, endHour)
    setIsDragging(false)
  }

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div className="flex overflow-hidden">
      {
        calendar.map((day, day_i) => (
          <div key={day_i} className="flex flex-col border-[1px]">
            <div className="text-center select-none">{daysOfWeek[day_i]}</div>
            {
              day.map((hour, hour_i) => (
                <div 
                  key={`${day_i}-${hour_i}`}
                  className={`text-theme-white border-b-[1px] h-8 w-16 ${ (calendar.length > day_i && calendar[day_i].length > hour_i && hour == true) ? 'bg-green-500' : 'bg-gray-500'}`}
                  onMouseDownCapture={() => startDragging(day_i, hour_i) }
                  onMouseUpCapture={(e) => { stopDragging(day_i, hour_i) }}
                  onMouseOver={(e) => { applyDragHighlighting(day_i, hour_i) }}
                  onTouchMove={(e) => { applyTouchHighlighting(day_i, hour_i) }}
                >
                </div>
              ))
            }
          </div>
        ))
      }
    </div>
  )
}