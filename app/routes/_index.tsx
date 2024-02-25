import { json, redirect } from '@remix-run/node'
import type { ActionFunction, LoaderArgs, LoaderFunction } from '@remix-run/node'
import { Form } from '@remix-run/react'
import { createServerClient } from '@supabase/auth-helpers-remix'
import type { PostgrestResponse } from '@supabase/supabase-js'

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

  /// ...resolve loader

  return json({ session })
}

export default function Index() {
  // const { session } = useLoaderData()
  // const actionData = useActionData()

  return (
    <div className="h-screen w-screen flex flex-col justify-center">
      <Form method="post" className="flex flex-col items-center w-full h-1/3">
        <input type="text" name="name" minLength={1} maxLength={100} className="text-4xl bg-transparent text-white border-b-2 border-white/40 w-1/2 m-4 text-center" autoFocus/>
        <button type="submit" className="px-4 py-2 rounded-lg bg-theme-yellow text-theme-dark">Create New Room</button>
      </Form>
    </div>
  )
}
