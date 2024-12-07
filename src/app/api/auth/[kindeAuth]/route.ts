import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server"

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const GET = handleAuth()