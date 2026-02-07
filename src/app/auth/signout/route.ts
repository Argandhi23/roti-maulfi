// app/auth/signout/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 1. Siapkan Response Redirect ke Login dulu
  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  })

  // 2. Buat Client Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // PERBAIKAN: Langsung set ke object 'response', JANGAN pakai NextResponse.next()
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // PERBAIKAN: Langsung set (kosongkan) ke object 'response'
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 3. Lakukan Logout di sisi server
  await supabase.auth.signOut()

  // 4. Kembalikan response yang membawa instruksi hapus cookie
  return response
}