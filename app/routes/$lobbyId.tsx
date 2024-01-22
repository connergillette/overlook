import { ActionFunction, LoaderArgs, LoaderFunction, json, redirect } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { createServerClient } from '@supabase/auth-helpers-remix'
import { useEffect, useState } from 'react'
import CalendarInput from '~/components/CalendarInput'

export const action: ActionFunction = async ({ request, params }) => {
  const response = new Response()

  const supabase = createServerClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || '',
    { request, response }
  )

  const { data: { session }} = await supabase.auth.getSession()

  const requestBody = new URLSearchParams(await request.text())
  const name = requestBody.get('name')
  const availability = requestBody.get('availability')

  const insertResponse = await supabase.from('availability').upsert({
    name: name,
    room_id: params['lobbyId'],
    schedule_encoding: availability
  }).select('id')

  console.log(insertResponse)

  return json({})
}

export const loader: LoaderFunction = async ({ request, params }: LoaderArgs) => {
  const { lobbyId } = params
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

    return json({ session, lobby })
  }
}

export default function Lobby() {
  const { lobby, session } = useLoaderData()
  // const actionData = useActionData()
  const respondents = 5 // TODO: Make this non-magical
  const [username, setUsername] = useState('')
  const [view, setView] = useState('input')
  const [combinedCalendar, setCombinedCalendar] = useState(Array.from({length: 7}, () => Array.from({length: 48}, () => Math.floor(Math.random() * respondents))))
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.screen.width <= 500)
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
            (!isMobile || (isMobile && view === 'input')) && (
              <CalendarInput isMobile={isMobile} username={username} setUsername={setUsername} />
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
