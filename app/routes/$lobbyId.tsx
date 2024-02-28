import { json } from '@remix-run/node'
import type { LoaderArgs, LoaderFunction } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { createServerClient } from '@supabase/auth-helpers-remix'
import { PostgrestResponse } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import CalendarCell from '~/components/CalendarCell'
import CalendarInput from '~/components/CalendarInput'
import { decodeCalendarState } from '~/util/CalendarEncoding'

export const loader: LoaderFunction = async ({ request, params }: LoaderArgs) => {
  const { lobbyId, username } = params
  const response = new Response()

  const supabase = createServerClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || '',
    { request, response }
  )
  const { data: { session }} = await supabase.auth.getSession()

  const lobbyResponse : PostgrestResponse<any> = await supabase.from('rooms').select().eq('id', lobbyId)
  if (lobbyResponse.status === 200) {
    const lobby : LobbyResponse = lobbyResponse.data?.[0]
    const availabilityResponse = await supabase.from('availability').select('schedule_encoding, name').eq('room_id', lobbyId)

    let allAvailability : AvailabilityEntry[] = []
    let attendeeGrid : string[][][] = Array.from({ length: 7 }, () => Array.from({ length: 48 }, () => []))
    if (availabilityResponse.status === 200 && availabilityResponse.data) {
      allAvailability = availabilityResponse.data
      const entries = allAvailability.map((entry: AvailabilityEntry) => ({ name: entry.name, schedule: decodeCalendarState(entry.schedule_encoding) }))
      for (const entry of entries) {
        for (let i = 0; i < attendeeGrid.length; i++) {
          for (let j = 0; j < attendeeGrid[i].length; j++) {
            if (entry.schedule[i][j] === 1) {
              attendeeGrid[i][j].push(entry.name)
            }
          }
        }
      }
    }
    return json({ session, lobby, username, allAvailability, attendeeGrid, domain: process.env.DOMAIN })
  }
  return json({})
}

export default function Lobby() {
  const { lobby, allAvailability, attendeeGrid, domain } = useLoaderData()

  const [username, setUsername] = useState('')

  const initializeCombinedAvailability = () => {
    let combinedAvailability = Array.from({ length: 7 }, () => Array.from({ length: 48 }, () => 0))
    const otherAvailability = allAvailability?.filter((entry: AvailabilityEntry) => entry.name !== username)
    for (const entry of otherAvailability) {
      let schedule = decodeCalendarState(entry.schedule_encoding)
      for (let i = 0; i < combinedAvailability.length; i++) {
        for (let j = 0; j < combinedAvailability[i].length; j++) {
          const availabilitySum : number = combinedAvailability[i][j] + schedule[i][j]
          combinedAvailability[i][j] = availabilitySum
        }
      }
    }

    return combinedAvailability
  }

  const initialCombinedAvailability = initializeCombinedAvailability()

  const initializeUserAvailability = (username: string) => {
    const userEntry = allAvailability.find((entry: AvailabilityEntry) => entry.name === username)?.schedule_encoding
    if (!userEntry) return Array.from({ length: 7 }, () => Array.from({ length: 48 }, () => 0))

    const userAvailabilityInit = decodeCalendarState(userEntry)
    return userAvailabilityInit
  }

  const [userAvailability, setUserAvailability] = useState<number[][]>(initializeUserAvailability(''))
  const [usernameInProgress, setUsernameInProgress] = useState('')
  const [view, setView] = useState('input')
  const [hoveredCell, setHoveredCell] = useState([-1, -1])
  const [hasCopied, setHasCopied] = useState(false)

  const [combinedCalendar, setCombinedCalendar] = useState(initialCombinedAvailability)

  const [isMobile, setIsMobile] = useState(false)

  const updateCombinedCalendar = () => {
    let newCombinedCalendar = [...initialCombinedAvailability]

    for (let i = 0; i < combinedCalendar.length; i++) {
      for (let k = 0; k < combinedCalendar[i].length; k++) {
        if (userAvailability) {
          newCombinedCalendar[i][k] += userAvailability[i][k]
        }
      }
    }
    setCombinedCalendar(newCombinedCalendar)
  }

  const updateAttendeeGrid = () => {
    let newAttendeeGrid = [...attendeeGrid]

    for (let i = 0; i < newAttendeeGrid.length; i++) {
      for (let k = 0; k < newAttendeeGrid[i].length; k++) {
        if (userAvailability[i][k] === 1) {
          if (!newAttendeeGrid[i][k].includes(username)) {
            newAttendeeGrid[i][k].push(username)
          }
        }
      }
    }
  }

  const updateUserAvailability = (value: number[][]) => {
    setUserAvailability(value)
    updateCombinedCalendar()
    updateAttendeeGrid()
  }

  const updateUsername = (username: string) => {
    setUsername(username)
    updateUserAvailability(initializeUserAvailability(username))
  }

  const copyLink = async () => {
    // const type = "text/plain";
    const text = `https://${domain}/${lobby.id}`
    // const blob = new Blob([text], { type });
    // const data = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.writeText(text);
    setHasCopied(true)
  }

  useEffect(() => {
    setIsMobile(window.screen.width <= 500)
    updateCombinedCalendar()
  }, [userAvailability])

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  let maxAttendance = 0
  for (const day of combinedCalendar) {
    for (const hour of day) {
      maxAttendance = Math.max(maxAttendance, hour)
    }
  }

  return (
    // <>
      <div className="container min-w-[900px] max-md:w-full max-md:min-w-[300px] mx-auto max-lg:mt-2 max-lg:pb-0 max-lg:h-full h-full flex flex-col py-8 max-lg:p-4 gap-4">
        <div className={`container fixed mx-auto w-full min-w-[900px] max-md:min-w-[300px] max-lg:w-11/12 z-50 flex rounded-lg bg-zinc-800 p-2 border border-white/10`}>
          <h1 className="text-2xl max-md:text-lg font-semibold w-full px-4 max-md:px-2 grow">{lobby.name}</h1>
          <button type="button" className="py-1 px-2 bg-theme-yellow text-theme-dark whitespace-nowrap rounded-md text-sm" onClick={async () => await copyLink()}>{hasCopied ? 'Copied!' : 'Copy Link'}</button>
        </div>
        
        <div className="w-full flex whitespace-nowrap gap-4 justify-center mx-auto pt-16">
          <div className="flex w-full">
            {/* TODO: Find a better place for this */}
            {/* {
              (!isMobile && username) && (
                <div className="flex grow w-full items-center"><span>{username}</span></div>
              )
            } */}
            <button className={`${view === 'input' && 'bg-theme-yellow text-theme-dark'} rounded-lg transition-colors px-2 py-1 ml-auto`} onClick={() => setView('input')} disabled={!isMobile}>Your Availability</button>
          </div>
          <div className="flex flex-nowrap w-full">
            <button className={`${view === 'combined' && 'bg-theme-yellow text-theme-dark'} rounded-lg transition-colors px-2 py-1`} onClick={() => setView('combined')} disabled={!isMobile}>Group Availability</button>
            {
              !isMobile && (
                <div className="flex justify-end items-center grow text-white/50"><span>{(hoveredCell[0] >= 0 && hoveredCell[1] >= 0) && `${attendeeGrid[hoveredCell[0]][hoveredCell[1]].join(', ')} (${attendeeGrid[hoveredCell[0]][hoveredCell[1]].length}/${maxAttendance})`}</span></div>
              )
            }
          </div>
        </div>
        {
          isMobile && (
            <div className="flex justify-center items-center text-white/50"><span>{(hoveredCell[0] >= 0 && hoveredCell[1] >= 0) && `${attendeeGrid[hoveredCell[0]][hoveredCell[1]].join(', ')} (${attendeeGrid[hoveredCell[0]][hoveredCell[1]].length}/${maxAttendance})`}</span></div>
          )
        }
        <div className="flex w-full gap-4 pb-10">
          {
            ((isMobile && view === 'input') || !isMobile) && (
              <div className="w-full relative">
                <div className="w-full absolute z-10">
                  {
                    (!username && (
                      <Form method="get" className="flex gap-4 items-center" onSubmit={(e) => { e.preventDefault(); updateUsername(usernameInProgress) }}>
                        <input
                          type="text"
                          minLength={1}
                          maxLength={100}
                          className="text-xl bg-transparent text-white px-2 py-2 w-full my-4 border border-white/10 rounded-md" 
                          placeholder="What's your name?"
                          value={usernameInProgress}
                          onChange={(e) => setUsernameInProgress(e.target.value)}
                          autoFocus
                        />
                        <button className="px-4 py-2 rounded-lg bg-theme-yellow hover:bg-theme-yellow/90 text-theme-dark font-semibold">Submit</button>
                      </Form>
                    ))
                  }
                </div>
                <div className={`transition ${!username && 'blur-md pointer-events-none opacity-30'} w-full ${!isMobile && 'border border-white/10 rounded-md'}`}>
                  <CalendarInput username={username} schedule={userAvailability} setUserAvailability={updateUserAvailability} isMobile={isMobile} lobbyId={lobby.id} />
                </div>
              </div>
            )
          }
          {
            (!isMobile || (isMobile && view === 'combined')) && (
              <div className="flex flex-col w-full border border-white/10 rounded-md" onMouseLeave={() => setHoveredCell([-1, -1])}>
                <div className={`flex w-full rounded-lg text-sm mx-auto`}>
                  {
                    combinedCalendar.map((day, day_i) => (
                      <div key={day_i} className="flex flex-col w-full">

                        <div className="text-center select-none font-bold p-1 bg-zinc-800">{daysOfWeek[day_i]}</div>
                        {
                          day.map((hour, hour_i) => {
                            const weight = Math.ceil((hour / maxAttendance) * 100)
                            const calculatedOpacity = Math.ceil(weight / 10) * 10

                            // TODO: This is bad but necessary for Tailwind to keep up (but there's a better way)
                            let color = 'bg-theme-yellow/10'
                            switch(calculatedOpacity){
                              case 20: color = 'bg-theme-yellow/20'; break;
                              case 30: color = 'bg-theme-yellow/30'; break;
                              case 40: color = 'bg-theme-yellow/40'; break;
                              case 50: color = 'bg-theme-yellow/50'; break;
                              case 60: color = 'bg-theme-yellow/60'; break;
                              case 70: color = 'bg-theme-yellow/70'; break;
                              case 80: color = 'bg-theme-yellow/80'; break;
                              case 90: color = 'bg-theme-yellow/90'; break;
                              case 100: color = 'bg-theme-yellow/100'; break;
                            }

                            const highlightedCellStyle = `${color} text-opacity-100 text-theme-dark font-bold`
                            return (
                              <CalendarCell hour_i={hour_i} hour={hour} highlightedCellStyle={highlightedCellStyle} onMouseOver={() => setHoveredCell([day_i, hour_i])} key={`${day_i}-${hour_i}`}/>
                            )}
                          )
                        }
                      </div>
                    ))
                  }
                </div>
              </div>
            )
          }
        </div>
      </div>
    // </>
  )
}
