import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('default')
  const router = useRouter()

  useEffect(() => {
    if (router.query.theme) {
      setTheme(router.query.theme)
    }
  }, [router.query])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)