import useLocalStorage from "@rehooks/local-storage";

export function useTutorial() {
    return useLocalStorage('tutorial', { show: true, step: 0 })
}
