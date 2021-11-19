import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = <T extends { [event: string]: (data: any) => void }>(listeners: T): [socket: Socket | null, connected: boolean, connecting: boolean, connect: (connect: boolean, url?: string) => void] => {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [connected, setConnected] = useState(false)
    const [connecting, setConnecting] = useState(false)
    useEffect(() => {
        return () => {
            socket?.disconnect()
        }
    }, [socket])
    useEffect(() => {
        socket?.on('connect', () => {
            setConnected(true)
            setConnecting(false)
        })
        socket?.on('disconnect', () => {
            setConnected(false)
            setConnecting(false)
        })
    }, [socket, setConnected, setConnecting])
    useEffect(() => {
        Object.entries(listeners).forEach(([event, callback]) => {
            socket?.on(event, callback)
        })
        return () => {
            Object.entries(listeners).forEach(([event, callback]) => {
                socket?.off(event, callback)
            })
        }
    }, [listeners, socket])
    const connect = useCallback((connect: boolean, url?: string) => {
        if (connect && url) {
            socket?.disconnect()
            const soc = io(url)
            setSocket(soc)
            setConnecting(true)
            soc?.connect()
        } else {
            setConnecting(false)
            socket?.disconnect()
        }
    }, [socket])
    return [socket, connected, connecting, connect]
}
