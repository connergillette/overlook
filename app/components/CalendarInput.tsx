import { Form, useOutletContext } from '@remix-run/react'
import { PostgrestResponse, SupabaseClient } from '@supabase/supabase-js'
import React, { useEffect, useState } from 'react';
import { encodeCalendarState } from '~/util/CalendarEncoding';

interface Props {
  username: string,
  isMobile: boolean,
  schedule: number[][],
  lobbyId: string,
  setUserAvailability: Function,
}

export default function CalendarInput ({ username, isMobile, schedule, lobbyId, setUserAvailability }: Props) {
  const availabilityFormRef = React.useRef<HTMLFormElement>(null)
  const { supabase } : { supabase: SupabaseClient } = useOutletContext()

  const [calendar, setCalendar] = useState<number[][]>(schedule)
  const [rerender, setRerender] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [mouseDownPos, setMouseDownPos] = useState<number[] | null>(null)
  const [highlightType, setHighlightType] = useState(true)
  const [dayIndex, setDayIndex] = useState(0)

  useEffect(() => {
    if (rerender) {
      setRerender(false)
    }
  }, [rerender])

  const highlightCell = (day: number, hour: number) => {
    calendar[day][hour] = highlightType ? 1 : 0
    setCalendar(calendar)
    setRerender(true)
  }

  const startDragging = (day: number, hour: number) => {
    if (!isDragging) {
      setIsDragging(true)
      setMouseDownPos([day, hour])
      setHighlightType(!calendar[day][hour])
    }
  }

  const applyDragHighlighting = (day: number, hour: number) => {
    if (isDragging) {
      if (mouseDownPos === null) return
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
  
  const applyTouchHighlighting = (day: number, hour: number) => {
    highlightCell(day, hour)
  }
  
  const stopDragging = (endDay: number, endHour: number) => {
    applyDragHighlighting(endDay, endHour)
    setIsDragging(false)
    submitChanges()
  }

  const submitChanges = async () => {
    const availability = encodeCalendarState(calendar)
    setUserAvailability(calendar)

    const availabilityResponse : PostgrestResponse<any> = await supabase.from('availability').select().eq('room_id', lobbyId).eq('name', username)
    if (availabilityResponse.status === 200) {
      const existingAvailability = availabilityResponse.data?.[0]
      if (existingAvailability) {
        await supabase.from('availability').update({
          name: username,
          room_id: lobbyId,
          schedule_encoding: availability
        }).eq('room_id', lobbyId).eq('name', username).select()
      } else {
        await supabase.from('availability').insert({
          name: username,
          room_id: lobbyId,
          schedule_encoding: availability
        }).eq('room_id', lobbyId).eq('name', username).select()
      }
    }
  }
  
  const daysOfWeekAbbrev = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  if (!isMobile) {
    return (
      <>
        <Form method="post" ref={availabilityFormRef} onSubmit={(e) => { e.preventDefault(); }}>
          <input type="hidden" name="name" value={username} />
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
                      className={`${hour_i % 2 == 0 ? `border-[1px] border-gray-400/20 border-t-[2px]` : 'border-x-[1px] border-gray-400/20'} h-min hover:opacity-90 text-center select-none w-full ${ (calendar.length > day_i && calendar[day_i].length > hour_i && hour) ? 'bg-theme-yellow text-opacity-100 text-theme-dark font-bold' : 'bg-gray-500 text-opacity-50 text-theme-white'}`}
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
        <Form method="post" ref={availabilityFormRef} onSubmit={(e) => { e.preventDefault() }}>
          <input type="hidden" name="name" value={username} />
        </Form>
        {
          <div key={dayIndex} className="flex flex-col border-[1px] w-11/12 mx-auto mb-16 rounded-lg">
            <div className="text-center select-none">{daysOfWeek[dayIndex]}</div>
            {
              day.map((hour, hour_i) => (
                <div 
                  key={`${dayIndex}-${hour_i}`}
                  className={`text-center align-middle ${hour_i % 2 == 0 ? `border-[1px] border-gray-400/20 border-t-[2px]` : 'border-x-[1px] border-gray-400/20'} h-12 ${ (calendar.length > dayIndex && calendar[dayIndex].length > hour_i) ? 'bg-theme-yellow text-opacity-100 text-theme-dark font-bold' : 'bg-gray-500 text-opacity-50 text-theme-white'}`}
                  onTouchStart={(e) => { startDragging(dayIndex, hour_i); applyTouchHighlighting(dayIndex, hour_i); stopDragging(dayIndex, hour_i) }}
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