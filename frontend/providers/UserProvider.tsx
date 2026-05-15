'use client'

import { createContext, useContext } from 'react'

interface UserData {
  name: string
  faculty: string
  email: string
}

const UserContext = createContext<UserData>({
  name: 'Student',
  faculty: 'general',
  email: '',
})

export function UserProvider({
  children,
  user,
}: {
  children: React.ReactNode
  user: UserData
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser() {
  return useContext(UserContext)
}