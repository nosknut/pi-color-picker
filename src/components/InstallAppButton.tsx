import { GetApp } from "@mui/icons-material"
import { IconButton } from "@mui/material"
import { usePwaInstall } from "../hooks/usePwaInstalled"

export function InstallAppButton() {
    const {
        isAppInstallable,
        installApp,
    } = usePwaInstall()

    return (
        isAppInstallable ? (
            <IconButton sx={{ color: 'white' }} onClick={installApp}>
                <GetApp />
            </IconButton>
        ) : null
    )
}