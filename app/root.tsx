import { json, V2_MetaFunction, type LinksFunction, type LoaderArgs } from "@remix-run/node"
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRevalidator,
} from "@remix-run/react"
import { SupabaseClient, createBrowserClient, createServerClient } from '@supabase/auth-helpers-remix'

import styles from "./tailwind.css"
import { useEffect, useState } from 'react'

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Overlook" },
    { name: "description", content: "Dead-simple scheduling tool." },
  ];
};

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
  { rel: 'stylesheet', href: styles },
];

export const loader = async ({ request }: LoaderArgs) => {
  const response = new Response()

  const supabase = createServerClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '', {
    request,
    response,
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
  }

  return json({ env, session }, { headers: response.headers })
}

export default function App() {
  const { env, session } = useLoaderData()
  const { revalidate } = useRevalidator()
  const [supabase] = useState<SupabaseClient>(() => createBrowserClient(env.SUPABASE_URL, env.SUPABASE_KEY))

  const serverAccessToken = session?.access_token

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== serverAccessToken) {
        // server and client are out of sync.
        revalidate()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [serverAccessToken, supabase, revalidate])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-theme-dark text-theme-white h-screen w-screen">
        <Outlet context={{ supabase, session }} />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
