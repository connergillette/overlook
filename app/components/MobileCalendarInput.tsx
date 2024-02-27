import { Form } from '@remix-run/react'
import { useState } from 'react'

interface Props {
  username: string,
  availabilityFormRef: React.RefObject<HTMLFormElement>,
  calendar: number[][],
  startDragging: Function,
  applyTouchHighlighting: Function,
  stopDragging: Function,
}

export default function MobileCalendarInput({ username, availabilityFormRef, calendar, startDragging, applyTouchHighlighting, stopDragging }: Props) {
  const [dayIndex, setDayIndex] = useState(-1)
  
  const day = calendar[dayIndex]
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="relative text-sm w-full">
      <Form method="post" ref={availabilityFormRef} onSubmit={(e) => { e.preventDefault() }}>
        <input type="hidden" name="name" value={username} />
      </Form>
      {
        dayIndex === -1 && (
          <div className="grid grid-flow-row grid-cols-3 items-center justify-center mx-auto rounded-lg gap-4">
            {/* <div className="flex text-center select-none bg-zinc-800 border-b border-white/10 h-10 font-bold text-base justify-center items-center"><span>Choose a day</span></div> */}
            {
              daysOfWeek.map((day, day_i) => (
                <div key={day_i} className="flex p-2 h-12 items-center justify-center text-theme-white outline outline-theme-white rounded-md" onTouchStart={() => setDayIndex(day_i)}>
                  <span>{day}</span>
                </div>
              ))
            }
          </div>
        )
      }
      {
        dayIndex >= 0 && (
          <div className="flex flex-col mx-auto">
            <div className="flex bg-theme-dark overflow-x-scroll overflow-y-hidden py-2 px-1 gap-2">
              {
                daysOfWeek.map((day, day_i) => (
                  <div key={day_i} className={`flex p-2 h-12 items-center justify-center outline outline-white/10 rounded-md ${dayIndex === day_i ? 'bg-theme-yellow text-theme-dark' : 'text-theme-white/50'}`} onTouchStart={() => setDayIndex(day_i)}>
                    <span>{day}</span>
                  </div>
                ))
              }
            </div>
            <div key={dayIndex} className="flex flex-col mb-16 rounded-lg outline outline-white/10">
              <div className="flex text-center select-none bg-zinc-800 border-b border-white/10 h-10 font-bold text-base justify-center items-center"><span>{daysOfWeek[dayIndex]}</span></div>
              {
                day.map((hour, hour_i) => (
                  <div 
                    key={`${dayIndex}-${hour_i}`}
                    className={`p-2 text-center align-middle h-12 ${ (calendar.length > dayIndex && calendar[dayIndex].length > hour_i && hour == 1) ? 'bg-theme-yellow text-opacity-100 text-theme-dark font-bold' : 'text-opacity-50 text-theme-white border-b border-white/10'}`}
                    onTouchStart={(e) => { startDragging(dayIndex, hour_i); applyTouchHighlighting(dayIndex, hour_i); stopDragging(dayIndex, hour_i) }}
                  >
                    {hour_i % 2 == 0 ? `${hour_i / 2}:00` : ''}
                  </div>
                ))
              }
            </div>
          </div>
        )
      }
      {/* <div className="flex fixed bottom-0 w-full bg-blend-difference bg-theme-dark px-10 h-12">
        <div className="flex grow text-left h-full" onClick={() => setDayIndex(Math.max(0, dayIndex - 1))}>
          <span className="self-center">{'Prev Day'}</span>
        </div>
        <div className="flex h-full" onClick={() => setDayIndex(Math.min(dayIndex + 1, 6))}>
          <span className="self-center">{'Next Day'}</span>
        </div>
      </div> */}
    </div>
  )
}