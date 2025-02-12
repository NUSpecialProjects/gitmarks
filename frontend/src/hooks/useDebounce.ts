import { useState, useEffect } from "react"

const useDebounce = <T>(initialValue: T, delay: number) => {
  const [value, setValue] = useState<T>(initialValue)
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return [value, debouncedValue, setValue] as const
}

export default useDebounce