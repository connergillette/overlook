import { ActionFunction, LoaderArgs, LoaderFunction, json, redirect } from '@remix-run/node'
import { createServerClient } from '@supabase/auth-helpers-remix'
import { useState } from 'react'
import CalendarInput from '~/components/CalendarInput'

export const action: ActionFunction = async ({ request }) => {
  const response = new Response()

  const supabase = createServerClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || '',
    { request, response }
  )

  const { data: { session }} = await supabase.auth.getSession()

  // ...perform action

  return redirect('/')
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
  
  }

  return json({ session })
}

export default function Lobby() {
  // const { session } = useLoaderData()
  // const actionData = useActionData()
  const respondents = 5 // TODO: Make this non-magical
  const [view, setView] = useState('input')
  const [combinedCalendar, setCombinedCalendar] = useState(Array.from({length: 7}, () => Array.from({length: 48}, () => Math.floor(Math.random() * respondents))))

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div className="w-8/12 min-w-[900px] max-md:w-full max-md:min-w-[300px] mx-auto max-md:mt-2 max-md:pb-0 max-md:h-full h-full flex flex-col py-16 gap-4">
      <div className="max-md:w-11/12 mx-auto flex w-min whitespace-nowrap gap-4">
        <button className={`${view === 'input' && 'bg-theme-yellow text-theme-dark'} rounded-lg transition-colors px-2 py-1`} onClick={() => setView('input')}>Your Availability</button>
        <button className={`${view === 'combined' && 'bg-theme-yellow text-theme-dark'} rounded-lg transition-colors px-2 py-1`} onClick={() => setView('combined')}>Group Availability</button>
      </div>
      {
        view === 'input' && (
          <CalendarInput />
        )
      }
      {
        view === 'combined' && (
          <div className="flex w-full rounded-lg border-[1px] text-sm max-md:w-11/12 mx-auto bg-gray-500">
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
                          ${(hour > 0) ? highlightedCellStyle : 'bg-gray-500 text-opacity-50 text-theme-white'}`}
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
  );
}
