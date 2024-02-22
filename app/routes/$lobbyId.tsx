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
    const availabilityResponse = await supabase.from('availability').select('schedule_encoding').eq('room_id', lobbyId)

    if (availabilityResponse.status === 200) {
      const availability = availabilityResponse.data
      if (availability) {
        let combinedAvailability = []
        for (const entry of availability) {
          if (combinedAvailability.length === 0) {
            console.log(`combinedAvailability initialized with ${entry.schedule_encoding.split('-')}`)
            combinedAvailability = entry.schedule_encoding.split('-')
          } else {
            let schedule = entry.schedule_encoding.split('-')
            for (let i = 0; i < combinedAvailability.length; i++) {
              const availabilitySum : number = parseInt(combinedAvailability[i]) + parseInt(schedule[i])
              // console.log(availabilitySum)
              combinedAvailability[i] = availabilitySum + ''
            }
            console.log(`-> combinedAvailability is now ${combinedAvailability}`)
          }
        }

        console.log(combinedAvailability)
        return json({ lobby, username, availability, combinedAvailability: combinedAvailability.join('-') })
      }
      return json({ lobby, username, availability: [], combinedAvailability: []})
    }
    return json({ session, lobby, username })
  }
  return json({})
}

export default function Lobby() {
  const { lobby, session, username: usernameQuery, availability, combinedAvailability } = useLoaderData()
  const { supabase } = useOutletContext()
  // const actionData = useActionData()
  const respondents = 5 // TODO: Make this non-magical
  const [username, setUsername] = useState(usernameQuery)
  const [usernameInProgress, setUsernameInProgress] = useState('')
  const [view, setView] = useState('input')
  const [combinedCalendar, setCombinedCalendar] = useState(
    Array.from({length: 7}, () => Array.from({length: 48}, () => 0))
  )
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.screen.width <= 500)
    console.log(`combinedAvailability: ${combinedAvailability}`)
    setCombinedCalendar(decodeCalendarState(combinedAvailability))
  }, [])

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
              <Outlet context={{ supabase, session }} />
            )
          }
          {
            !username && (
              <div className="w-full">
                <Form method="get" action={`/${lobby.id}/${usernameInProgress}`} className="flex gap-4 items-center" onSubmit={(e) => { setUsername(usernameInProgress)}}>
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
