import { useEffect, useRef } from "react"

/**
 * Useful for prividing state to callback handlers without causing unnecessary re-renders
 */
export function useImperativeState<T extends {}>(values: T) {
    const state = useRef<T>(values)
    useEffect(() => {
        for (const key in values) {
            state.current[key] = values[key]
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Object.values(values)])
    return state
}
