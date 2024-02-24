import { ActionFunction, json } from '@remix-run/node'
import { useLoaderData, useOutletContext } from '@remix-run/react'
import { createServerClient } from '@supabase/auth-helpers-remix'
import { useEffect, useState } from 'react'
import CalendarInput from '~/components/CalendarInput'

export const action: ActionFunction = async ({ request, params }) => {
  const response = new Response()
  const { lobbyId, username } = params

  const supabase = createServerClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || '',
    { request, response }
  )

  const { data: { session }} = await supabase.auth.getSession()

  const requestBody = new URLSearchParams(await request.text())
  const availability = requestBody.get('availability')

  const availabilityResponse = await supabase.from('availability').select().eq('room_id', lobbyId).eq('name', username)
  if (availabilityResponse.status === 200) {
    const existingAvailability = availabilityResponse.data[0]
    if (existingAvailability) {
      const updateResponse = await supabase.from('availability').update({
        name: username,
        room_id: params['lobbyId'],
        schedule_encoding: availability
      }).eq('room_id', lobbyId).eq('name', username).select()
    } else {
      const insertResponse = await supabase.from('availability').insert({
        name: username,
        room_id: params['lobbyId'],
        schedule_encoding: availability
      }).eq('room_id', lobbyId).eq('name', username).select()
    }
  }
  return null
}

export async function loader ({ request, params }) {
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
    const availabilityResponse = await supabase.from('availability').select().eq('room_id', lobbyId).eq('name', username)
    if (availabilityResponse.status === 200) {
      const availability = availabilityResponse.data[0]

      return json({ lobby, username, availability })
    }
  }

  return json({})
}


export default function UserAvailability() {
  const { username, availability, lobby } = useLoaderData()
  const [isMobile, setIsMobile] = useState(false)
  const { supabase } = useOutletContext()

  useEffect(() => {
    setIsMobile(window.screen.width <= 500)
  }, [])

  return (
    <CalendarInput username={username} encodedSchedule={availability?.schedule_encoding} isMobile={isMobile} lobbyId={lobby.id} />
  )
}