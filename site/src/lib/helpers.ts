import { Session } from "next-auth"

export function isValidSession(session: Session | null): session is Session {
    return session !== null && typeof session.user?.name === 'string';
}