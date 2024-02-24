import { ActionFunction, LoaderArgs, LoaderFunction, json, redirect } from '@remix-run/node'
import { Form, Outlet, useLoaderData, useOutletContext } from '@remix-run/react'
import { createServerClient } from '@supabase/auth-helpers-remix'
import { useEffect, useState } from 'react'
import CalendarInput from '~/components/CalendarInput'
import { decodeCalendarState } from '~/util/CalendarEncoding'

export const loader: LoaderFunction = async ({ request, params }: LoaderArgs) => {
  const { lobbyId, username } = params
  const response = new Response()
  // an empty response is required for the auth helpers
  // to set cookies to manage auth

  const supabase = createServerClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || '',
    { request, response }
  )
  const { data: { session }} = await supabase.auth.getSession()

  const lobbyResponse = await supabase.from('rooms').select().eq('id', lobbyId)
  if (lobbyResponse.status === 200) {
    const lobby = lobbyResponse.data[0]
    const availabilityResponse = await supabase.from('availability').select('schedule_encoding, name').eq('room_id', lobbyId)

    let allAvailability = []
    if (availabilityResponse.status === 200 && availabilityResponse.data) {
      allAvailability = availabilityResponse.data
    }
    return json({ session, lobby, username, allAvailability })
  }
  return json({})
}

export default function Lobby() {
  const { supabase } = useOutletContext()
  const { lobby, session, allAvailability } = useLoaderData()

  const [username, setUsername] = useState('')

  const initializeCombinedAvailability = () => {
    let combinedAvailability = Array.from({ length: 7 }, () => Array.from({ length: 48 }, () => 0))
    const otherAvailability = allAvailability.filter((entry) => entry.name !== username)
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

  const initializeUserAvailability = (username) => {
    const userEntry = allAvailability.find((entry) => entry.name === username)?.schedule_encoding
    if (!userEntry) return Array.from({ length: 7 }, () => Array.from({ length: 48 }, () => 0))

    const userAvailabilityInit = decodeCalendarState(userEntry)
    return userAvailabilityInit
  }
  // const initializedUserAvailability = initializeUserAvailability(username)

  const respondents = 5 // TODO: Make this non-magical
  const [userAvailability, setUserAvailability] = useState(initializeUserAvailability(''))
  const [usernameInProgress, setUsernameInProgress] = useState('')
  const [view, setView] = useState('input')

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

  const updateUserAvailability = (value) => {
    setUserAvailability(value)
    updateCombinedCalendar()
  }

  const updateUsername = (username) => {
    setUsername(username)
    updateUserAvailability(initializeUserAvailability(username))
  }

  useEffect(() => {
    setIsMobile(window.screen.width <= 500)
    updateCombinedCalendar()
  }, [userAvailability])

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div className="w-8/12 min-w-[900px] max-md:w-full max-md:min-w-[300px] mx-auto max-md:mt-2 max-md:pb-0 max-md:h-full h-full flex flex-col py-16">
      {/* <div className="flex flex-col"> */}
        <h1 className="text-2xl font-semibold pb-4">{lobby.name}</h1>
        { isMobile && (
          <div className="w-11/12 flex whitespace-nowrap gap-4 justify-center mx-auto">
            <button className={`${view === 'input' && 'bg-theme-yellow text-theme-dark'} rounded-lg transition-colors px-2 py-1`} onClick={() => setView('input')}>Your Availability</button>
            <button className={`${view === 'combined' && 'bg-theme-yellow text-theme-dark'} rounded-lg transition-colors px-2 py-1`} onClick={() => setView('combined')}>Group Availability</button>
          </div>
        )}
        <div className="flex w-full gap-4">
          {
            (!isMobile || (isMobile && view === 'input')) && username && (
              <CalendarInput username={username} schedule={userAvailability} setUserAvailability={updateUserAvailability} isMobile={isMobile} lobbyId={lobby.id} />
            )
          }
          {
            !username && (
              <div className="w-full">
                <Form method="get" className="flex gap-4 items-center" onSubmit={(e) => { e.preventDefault(); updateUsername(usernameInProgress) }}>
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
          }
          {
            (!isMobile || (isMobile && view === 'combined')) && (
              <div className="flex w-full rounded-lg outline outline-[1px] text-sm max-md:w-11/12 mx-auto bg-gray-500">
                {
                  combinedCalendar.map((day, day_i) => (
                    <div key={day_i} className="flex flex-col w-full">
                      <div className="text-center select-none bg-theme-dark">{daysOfWeek[day_i]}</div>
                      {
                        day.map((hour, hour_i) => {
                          const calculatedOpacity = Math.ceil((hour / respondents) * 100)

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

                          const highlightedCellStyle = `${color} text-opacity-100`
                          return (
                            <div 
                            key={`${day_i}-${hour_i}`}
                            className={`\
                              ${hour_i % 2 == 0 ? `border-[1px] border-gray-400/20 border-t-[2px]` : 'border-x-[1px] border-gray-400/20'} \
                              h-min text-center select-none w-full \
                              ${(hour > 0) ? highlightedCellStyle : 'bg-gray-500 text-opacity-50'}`}
                            >
                              {hour_i % 2 == 0 ? `${hour_i / 2}:00` : <br />}
                            </div>
                          )}
                        )
                      }
                    </div>
                  ))
                }
              </div>
            )
          }
        </div>
      {/* </div> */}
    </div>
  );
}
