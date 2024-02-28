import { Form, useOutletContext } from '@remix-run/react'
import type { PostgrestResponse, SupabaseClient } from '@supabase/supabase-js'
import React, { useEffect, useState } from 'react';
import { encodeCalendarState } from '~/util/CalendarEncoding';
import CalendarInputCell from './CalendarInputCell'
import MobileCalendarInput from './MobileCalendarInput'

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

  useEffect(() => {
    if (rerender) {
      setRerender(false)
    }
  }, [rerender])

  useEffect(() => {
    setCalendar(schedule)
  }, [schedule])

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

  if (!isMobile) {
    return (
      <>
      <Form method="post" ref={availabilityFormRef} onSubmit={(e) => { e.preventDefault(); }}>
        <input type="hidden" name="name" value={username} />
      </Form>
      <div className={`flex flex-col gap-4`}>
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {
            daysOfWeekAbbrev.map((day, day_i) => (
              <div className="text-center select-none font-bold p-1 bg-zinc-800 grow" key={`${daysOfWeekAbbrev[day_i]}-head`}>{daysOfWeekAbbrev[day_i]}</div>
            ))
          }
        </div>
        <div className={`flex w-full rounded-lg text-sm  ${!isMobile && 'border border-white/10 rounded-md'}`}>
          {
            calendar.map((day, day_i) => (
              <div key={day_i} className="flex flex-col w-full">
                {
                  day.map((hour, hour_i) => (
                    <CalendarInputCell
                      key={`${day_i}-${hour_i}`}
                      day_i={day_i}
                      hour_i={hour_i}
                      hour={hour}
                      calendar={calendar}
                      startDragging={startDragging}
                      stopDragging={stopDragging}
                      applyDragHighlighting={applyDragHighlighting}
                    />
                  ))
                }
              </div>
            ))
          }
        </div>
      </div>
      </>

    )
  } else {
    return <MobileCalendarInput 
      username={username}
      availabilityFormRef={availabilityFormRef}
      calendar={calendar}
      startDragging={startDragging}
      applyTouchHighlighting={applyTouchHighlighting}
      stopDragging={stopDragging}
    />
  }
}