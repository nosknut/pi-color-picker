import { useEffect, useState } from 'react'

export function usePwaInstall() {
    const [state, setState] = useState<{
        deferredPrompt?: {
            prompt?(): void
            userChoice: Promise<{ outcome: 'dismissed' | 'accepted', platform: string }>
        }
        isAppInstallable?: boolean
        isAppInstalled?: boolean
    }>({})

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            // e.preventDefault()
            // Stash the event so it can be triggered later.
            setState({ deferredPrompt: e, isAppInstallable: true })
        })

        window.addEventListener('appinstalled', () => {
            setState({ isAppInstalled: true })
        })
    }, [setState])

    return {
        isAppInstallable: state.isAppInstallable,
        isAppInstalled: state.isAppInstalled,
        installApp: () => {
            if (state.deferredPrompt) {
                //@ts-ignore
                state.deferredPrompt?.prompt()
            }
        },
    }
}
