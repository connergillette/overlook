import { Form } from '@remix-run/react'
import React, { useEffect, useState } from 'react';

interface Props {
  username: string,
  setUsername: Function,
  isMobile: boolean
}

export default function CalendarInput ({ username, setUsername, isMobile }: Props) {
  const availabilityFormRef = React.useRef<HTMLFormElement>(null)

  const [usernameSubmitted, setUsernameSubmitted] = useState(false)
  const [usernameInProgress, setUsernameInProgress] = useState('')
  const [calendar, setCalendar] = useState(Array.from({length: 7}, () => Array.from({length: 48}, () => false)))
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

    availabilityFormRef.current?.submit()
  }

  const encodeCalendarState = () => {
    let encoded = ''
    for (let i = 0; i < calendar.length; i++) {
      for (let j = 0; j < calendar[i].length; j++) {
        encoded += calendar[i][j] ? '1' : '0'
      }
    }
    return encoded
  }
  
  const daysOfWeekAbbrev = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  if (!username) {
    return (
      <div className="w-full">
        <Form method="get" className="flex gap-4 items-center" onSubmit={(e) => { e.preventDefault(); setUsername(usernameInProgress)}}>
          <input
            type="text"
            minLength={1}
            maxLength={100}
            className="text-xl bg-transparent text-white px-2 py-1 border-b-[1px] border-white/40 w-full text-center my-4" 
            placeholder="What's your name?"
            value={usernameInProgress}
            onChange={(e) => setUsernameInProgress(e.target.value)}
            autoFocus
          />
          <button className="px-4 py-2 rounded-lg bg-theme-yellow hover:bg-theme-yellow/90 text-theme-dark font-semibold">Submit</button>
        </Form>
      </div>
    )
  } else if (screenWidth >= 500) {
    return (
      <>
        <Form method="post" ref={availabilityFormRef} onSubmit={(e) => {e.preventDefault(); console.log(e)}}>
          <input type="hidden" name="name" value={username} />
          <input type="hidden" name="availability" value={encodeCalendarState()} />
        </Form>
        <div className="flex w-full rounded-lg outline outline-[1px] text-sm">
          {
            calendar.map((day, day_i) => (
              <div key={day_i} className="flex flex-col w-full">
                <div className="text-center select-none">{daysOfWeekAbbrev[day_i]}</div>
                {
                  day.map((hour, hour_i) => (
                    <div 
                      key={`${day_i}-${hour_i}`}
                      className={`${hour_i % 2 == 0 ? `border-[1px] border-gray-400/20 border-t-[2px]` : 'border-x-[1px] border-gray-400/20'} h-min hover:opacity-90 text-center select-none w-full ${ (calendar.length > day_i && calendar[day_i].length > hour_i && hour == true) ? 'bg-theme-yellow text-opacity-100 text-theme-dark font-bold' : 'bg-gray-500 text-opacity-50 text-theme-white'}`}
                      onMouseDownCapture={() => startDragging(day_i, hour_i) }
                      onMouseUpCapture={(e) => { stopDragging(day_i, hour_i) }}
                      onMouseOver={(e) => { applyDragHighlighting(day_i, hour_i) }}
                    >
                      {hour_i % 2 == 0 ? `${hour_i / 2}:00` : <br />}
                    </div>
                  ))
                }
              </div>
            ))
          }
        </div>
      </>
    )
  } else {
    const day = calendar[dayIndex]
    return (
      <div className="relative text-sm w-full">
        {
          <div key={dayIndex} className="flex flex-col border-[1px] w-11/12 mx-auto mb-16 rounded-lg">
            <div className="text-center select-none">{daysOfWeek[dayIndex]}</div>
            {
              day.map((hour, hour_i) => (
                <div 
                  key={`${dayIndex}-${hour_i}`}
                  className={`text-center align-middle ${hour_i % 2 == 0 ? `border-[1px] border-gray-400/20 border-t-[2px]` : 'border-x-[1px] border-gray-400/20'} h-12 ${ (calendar.length > dayIndex && calendar[dayIndex].length > hour_i && hour == true) ? 'bg-theme-yellow text-opacity-100 text-theme-dark font-bold' : 'bg-gray-500 text-opacity-50 text-theme-white'}`}
                  onMouseDownCapture={() => startDragging(dayIndex, hour_i) }
                  onMouseUpCapture={(e) => { stopDragging(dayIndex, hour_i) }}
                  onMouseOver={(e) => { applyDragHighlighting(dayIndex, hour_i) }}
                >
                  {hour_i % 2 == 0 ? `${hour_i / 2}:00` : ''}
                </div>
              ))
            }
          </div>
        }
        <div className="flex fixed bottom-0 w-full bg-blend-difference bg-theme-dark px-10 h-12">
          <div className="flex grow text-left h-full" onClick={() => setDayIndex(Math.max(0, dayIndex - 1))}>
           <span className="self-center">{'Prev Day'}</span>
          </div>
          <div className="flex h-full" onClick={() => setDayIndex(Math.min(dayIndex + 1, 6))}>
            <span className="self-center">{'Next Day'}</span>
          </div>
        </div>
      </div>
    )
  }
}