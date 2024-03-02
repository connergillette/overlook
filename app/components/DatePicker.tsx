// TODO: This component is WIP

import { useEffect, useState } from 'react'
import DatePickerCell from './DatePickerCell'

export default function DatePicker() {
  const [isDragging, setIsDragging] = useState(false)
  const [mouseDownPos, setMouseDownPos] = useState<number[] | null>(null)
  const [highlightType, setHighlightType] = useState(true)
  const [rerender, setRerender] = useState(false)

  const [grid, setGrid] = useState(Array.from({ length: 4 }, () => Array.from({ length: 7 }, () => 0)))
  const today = new Date()
  
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const firstDayOfWeek = firstDay.getDay()
  
  const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()

  const prevMonthLastDay = new Date(new Date().getFullYear(), new Date().getMonth(), 0)
  const nextMonthFirstDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDate = (week: number, day: number) => (week * 7) + (day + 1)
  const isToday = (date: number) => (date) === today.getDate()
  const isSelectableDay = (date: Date) => (date.getMonth() === today.getMonth() && date.getDate() >= today.getDate()) || (date.getMonth() > today.getMonth())

  useEffect(() => {
    if (rerender) {
      setRerender(false)
    }
  }, [rerender])

  const highlightCell = (day: number, hour: number) => {
    grid[day][hour] = highlightType ? 1 : 0
    setGrid(grid)
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

  return (
    <div className="flex flex-col gap-4 max-w-[300px] justify-center mx-auto">
      <div className="flex rounded-lg overflow-hidden border border-white/10">
        {
          daysOfWeek.map((day, day_i) => (
            <div className="text-center select-none font-bold p-1 bg-zinc-800 grow" key={`${daysOfWeek[day_i]}-head`}>{daysOfWeek[day_i]}</div>
          ))
        }
      </div>
      <div className="grid grid-flow-row grid-cols-7 outline outline-white/10 rounded-lg relative overflow-hidden">
        {
          Array.from({ length: firstDayOfWeek }, (_, i) => prevMonthLastDay.getDate() - firstDayOfWeek + i + 1).map((date, date_i) => {
            return <div key={date_i} className="flex items-center aspect-square justify-center bg-theme-dark text-theme-white text-opacity-50">{date}</div>
          })
        }
        {
          Array.from({ length: daysInMonth }, (_, i) => i + 1).map((date, date_i) => (
            <DatePickerCell
              key={date_i}
              date={date}
              isToday={isToday(date)}
              startDragging={startDragging}
              stopDragging={stopDragging}
              applyDragHighlighting={applyDragHighlighting}
            />
          ))
        }
        {
          Array.from({ length: 42 - daysInMonth - firstDayOfWeek }, (_, i) => i + 1).map((date, date_i) => {
            return <div key={date_i} className="flex items-center justify-center aspect-square bg-theme-dark text-theme-white text-opacity-50">{date}</div>
          })
        }
        {/* {
          grid.map((row, row_i) => (
            <div key={row_i} className="flex gap-2 p-2">
              {
                row.map((cell, cell_i) => {
                  const date = getDate(row_i, cell_i)
                  return <div key={cell_i} className={`flex items-center justify-center w-8 h-8 rounded-md bg-theme-dark text-theme-white ${isToday(date) ? 'text-theme-yellow' : ''}`}>{date}</div>
                })
              }
            </div>
          ))
        } */}
      </div>
    </div>
  )
}