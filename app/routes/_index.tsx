import { ActionFunction, LoaderArgs, LoaderFunction, json, redirect } from '@remix-run/node'
import { createServerClient } from '@supabase/auth-helpers-remix'
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
    <div className="w-8/12 min-w-[900px] max-md:w-full max-md:min-w-[300px] mx-auto max-md:mt-2 max-md:pb-0 max-md:h-full h-full flex flex-col py-16">
      <CalendarInput />
    </div>
  );
}
