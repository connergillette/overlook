import React, { useEffect, useState } from 'react';

export default function CalendarPanel ({ }) {
  const [calendar, setCalendar] = useState(Array.from({length: 7}, () => Array.from({length: 24}, () => false)))
  const [rerender, setRerender] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [mouseDownPos, setMouseDownPos] = useState(null)
  const [highlightType, setHighlightType] = useState(true)
  const [screenWidth, setScreenWidth] = useState(0)
  const [dayIndex, setDayIndex] = useState(0)

  useEffect(() => {
    setScreenWidth(window.screen.width)
  }, [])

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
      // console.log(`started dragging {day: ${day}, hour: ${hour}}`)
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
    // console.log('stop!')
    // console.log(`stopped dragging {day: ${endDay}, hour: ${endHour}}`)
    applyDragHighlighting(endDay, endHour)
    setIsDragging(false)
  }
  
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  
  if (screenWidth >= 500) {
    return (
      <div className="flex w-full rounded-lg border-[1px]">
        {
          calendar.map((day, day_i) => (
            <div key={day_i} className="flex flex-col w-full">
              <div className="text-center select-none">{daysOfWeek[day_i]}</div>
              {
                day.map((hour, hour_i) => (
                  <div 
                    key={`${day_i}-${hour_i}`}
                    className={`border-[1px] h-min text-center select-none w-full ${ (calendar.length > day_i && calendar[day_i].length > hour_i && hour == true) ? 'bg-theme-yellow text-opacity-100 text-theme-dark font-bold' : 'bg-gray-500 text-opacity-50 text-theme-white'}`}
                    onMouseDownCapture={() => startDragging(day_i, hour_i) }
                    onMouseUpCapture={(e) => { stopDragging(day_i, hour_i) }}
                    onMouseOver={(e) => { applyDragHighlighting(day_i, hour_i) }}
                    // onTouchStartCapture={(e) => { startDragging(day_i, hour_i) }}
                    // onTouchEndCapture={(e) => { applyDragHighlighting(day_i, hour_i); stopDragging(day_i, hour_i); }}
                    // onTouchMoveCapture={(e) => { console.log(e) }}
                    // onTouchCancelCapture={(e) => { stopDragging(day_i, hour_i) }}
                  >
                    {hour_i}:00
                  </div>
                ))
              }
            </div>
          ))
        }
      </div>
    )
  } else {
    const day = calendar[dayIndex]
    return (
      <div className="relative">
        {
          <div key={dayIndex} className="flex flex-col border-[1px] w-11/12 mx-auto mb-16 rounded-lg">
            <div className="text-center select-none">{daysOfWeek[dayIndex]}</div>
            {
              day.map((hour, hour_i) => (
                <div 
                  key={`${dayIndex}-${hour_i}`}
                  className={`text-center align-middle border-b-[1px] h-12 ${ (calendar.length > dayIndex && calendar[dayIndex].length > hour_i && hour == true) ? 'bg-theme-yellow text-opacity-100 text-theme-dark font-bold' : 'bg-gray-500 text-opacity-50 text-theme-white'}`}
                  onMouseDownCapture={() => startDragging(dayIndex, hour_i) }
                  onMouseUpCapture={(e) => { stopDragging(dayIndex, hour_i) }}
                  onMouseOver={(e) => { applyDragHighlighting(dayIndex, hour_i) }}
                  // onTouchStartCapture={(e) => { startDragging(day_i, hour_i) }}
                  // onTouchEndCapture={(e) => { applyDragHighlighting(day_i, hour_i); stopDragging(day_i, hour_i); }}
                  // onTouchMoveCapture={(e) => { console.log(e) }}
                  // onTouchCancelCapture={(e) => { stopDragging(day_i, hour_i) }}
                >
                  {hour_i}:00
                </div>
              ))
            }
          </div>
        }
        <div className="flex fixed bottom-0 w-full bg-blend-difference bg-theme-dark px-10 h-12">
          <div className="flex grow text-left h-full" onClick={() => setDayIndex(dayIndex - 1)}>
           <span className="self-center">{'Prev Day'}</span>
          </div>
          <div className="flex h-full" onClick={() => setDayIndex(dayIndex + 1)}>
            <span className="self-center">{'Next Day'}</span>
          </div>
        </div>
      </div>
    )
  }
}