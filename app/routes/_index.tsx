import { json, redirect } from '@remix-run/node'
import type { ActionFunction, LoaderArgs, LoaderFunction } from '@remix-run/node'
import { Form } from '@remix-run/react'
import { createServerClient } from '@supabase/auth-helpers-remix'
import type { PostgrestResponse } from '@supabase/supabase-js'
import DatePicker from '~/components/DatePicker'
import DonationCTA from '~/components/DonationCTA'

export const action: ActionFunction = async ({ request }) => {
  const response = new Response()

  const supabase = createServerClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || '',
    { request, response }
  )

  const requestBody = new URLSearchParams(await request.text())
  const name = requestBody.get('name')

  // TODO: Create lobby
  const lobbyResponse : PostgrestResponse<any> = await supabase.from('rooms').insert({ name }).select('id')
  if (lobbyResponse.status === 201) {
    const lobbyId = lobbyResponse.data?.[0].id
    return redirect(`/${lobbyId}`)
  }

  return json({ })
}

export const loader: LoaderFunction = async ({ request }: LoaderArgs) => {
  const response = new Response()
  // an empty response is required for the auth helpers
  // to set cookies to manage auth

  const supabase = createServerClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || '',
    { request, response }
  )
  const { data: { session }} = await supabase.auth.getSession()

  return json({ session })
}

export default function Index() {
  return (
    <div className="h-screen">
      <div className="container flex flex-col justify-center mx-auto h-full gap-10">
        <h1 className="text-6xl text-center font-semibold text-theme-light">Timesmith</h1>
        <Form method="post" className="flex flex-col items-center w-full gap-4">
          <div className="w-1/2 max-lg:w-11/12 flex flex-col justify-center gap-4">
            {/* TODO: Uncomment this after component is finished */}
            {/* <DatePicker /> */}
            <input type="text" name="name" minLength={1} maxLength={100} className="text-2xl bg-transparent text-theme-white text-center outline py-2 px-4 outline-white/10 rounded-md" autoFocus/>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-theme-yellow text-theme-dark hover:bg-theme-yellow/90 transition-colors">Create New Room</button>
        </Form>
        <DonationCTA />
      </div>
    </div>
  )
}
