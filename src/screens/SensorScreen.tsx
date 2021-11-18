import { Add, ArrowBack, Close, Delete, ExpandLess, ExpandMore } from '@mui/icons-material';
import { Alert, Button, Card, CardActions, CardContent, CardHeader, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, Grid, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, ListSubheader, Snackbar, TextField, Toolbar, Typography } from '@mui/material';
import { Box } from '@mui/system';
import useLocalStorage from '@rehooks/local-storage';
import { error } from 'console';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { generatePath, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';

type Device = {
    id: string
    name: string
    url: string
    createdAt: string
}

type IdMap<T extends { id: string }> = {
    [id: string]: T
}

type Orientation = {
    pitch: number
    roll: number
    yaw: number
}

type Vector = {
    x: number
    y: number
    z: number
}

type SensorData = {
    timestamp: string
    environmental: {
        temperature: {
            temperature: number
            humidity: number
            pressure: number
        }
        humidity: number
        pressure: number
    }
    imu: {
        orientation: {
            radians: Orientation
            degrees: Orientation
        }
        compass: {
            compass: number
            raw: number
        }
        gyroscope: {
            gyroscope: Vector
            raw: Vector
        }
        accelerometer: {
            accelerometer: Vector
            raw: Vector
        }
    }
}

type SensorEntry = {
    id: string
    deviceId: string
    timestamp: string
    sensorData: SensorData
    location: GeolocationCoordinates | null
}

function generateId() {
    return Math.random().toString().replace('.', '')
}

export function useDevices(deviceId?: string) {
    return useLocalStorageApi<Device>('devices', deviceId)
}

export function useSelectedCalibrationData(deviceId?: string) {
    return useLocalStorageApi<{
        // device id
        id: string
        calibrationDataId: string
        selectedAt: string
    }>('selectedCalibrationData', deviceId)
}

export function useCalibrationData(entryId?: string) {
    return useLocalStorageApi<SensorEntry>('calibrationData', entryId)
}

export function useSensorHistory(entryId?: string) {
    return useLocalStorageApi<SensorEntry>('sensorHistory', entryId)
}

function toIdMap<T extends { id: string }>(entries: T[]) {
    return entries.reduce((map, entry) => {
        map[entry.id] = entry
        return map
    }
        , {} as IdMap<T>)
}

function useDeviceEntriesFor<T extends { id: string, deviceId: string }>(entries: T[], deviceId?: string) {
    return useMemo(() => {
        const deviceEntries = entries.filter(entry => entry.deviceId === deviceId) || []
        return deviceId ? {
            deviceEntries: toIdMap(deviceEntries),
            deviceEntryList: deviceEntries,
        } : {}
    }, [deviceId, entries])
}

function useLocalStorageApi<T extends { id: string }>(key: string, entryId?: string) {
    const [entryMap, setEntryMap] = useLocalStorage<IdMap<T>>(key, {})
    return useMemo(() => ({
        entries: entryMap,
        setEntries: setEntryMap,
        entryList: Object.values(entryMap),
        entry: entryId ? entryMap[entryId] : undefined,
        setEntry: (entry: T) => setEntryMap({ ...entryMap, [entry.id]: entry }),
        deleteEntry: (entryId: string) => {
            const { [entryId]: current, ...rest } = entryMap
            setEntryMap({ ...rest })
        },
    }), [entryMap, setEntryMap, entryId])
}

function DevicesScreen() {
    const { entryList } = useDevices()
    return (
        <>
            {entryList.length ? (
                <List subheader={<ListSubheader>Devices</ListSubheader>}>
                    {entryList.map(entry => {
                        return (
                            <ListItem key={entry.id} button component={Link} to={generatePath('/sensors/devices/:id', { id: entry.id })}>
                                <ListItemText primary={entry.name} secondary={entry.url} />
                            </ListItem>
                        )
                    })}
                </List>
            ) : (
                <div style={{ position: "fixed", height: '100vh', width: '100vw', display: 'grid', placeItems: 'center' }}>
                    <Typography variant="h6" color="GrayText">No devices found</Typography>
                </div>
            )}
            <Fab sx={{ bottom: 25, right: 25, position: "fixed" }} color="primary" component={Link} to={generatePath('/sensors/devices/new')}>
                <Add />
            </Fab>
        </>
    )
}

function getIntersectingFields<T, K extends T>(a?: K, b?: T) {
    const keys = _.intersection(_.keys(a), _.keys(b))
    return _.pick(a, keys)
}

function compare<T, K extends T>(a?: K, b?: T) {
    return _.isEqual(getIntersectingFields(a, b), b)
}

function DeviceForm({ id, device, createNew }: { id: string, device?: Device, createNew?: boolean }) {
    const navigate = useNavigate()
    const [name, setName] = useState(device?.name || '')
    const [url, setUrl] = useState(device?.url || '')
    const { setEntry } = useDevices()
    const validInput = useMemo(() => !!(name && url) && !compare(device, { name, url }), [name, url, device])
    const onSubmit = useCallback(() => {
        if (!validInput) {
            return
        }
        setEntry({
            id,
            name,
            url,
            createdAt: device?.createdAt || getTimestamp(),
        })
        navigate(generatePath('/sensors/devices/:id', { id }))
    }, [name, url, setEntry, navigate, device, id, validInput])
    return (
        <div>
            <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} md={7}>
                    <Card>
                        <CardHeader title={createNew ? "Create Device" : "Edit Device"} />
                        <CardContent>
                            <TextField id="name" label="Name" value={name} required onChange={e => setName(e.target.value)} fullWidth />
                            <Box my={2} />
                            <TextField id="url" label="URL" value={url} required onChange={e => setUrl(e.target.value)} fullWidth />
                        </CardContent>
                        <CardActions>
                            <Button variant="outlined" onClick={onSubmit} disabled={!validInput}>
                                {createNew ? 'Create' : 'Save'}
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
        </div>
    )
}

function DeleteConfirmation({ onDelete }: { onDelete: () => void }) {
    const [open, setOpen] = useState(false)
    const handleDelete = useCallback(() => {
        setOpen(false)
        onDelete()
    }, [onDelete])
    return (
        <>
            <Button color="error" onClick={() => setOpen(true)}>Delete</Button>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

function getHumanReadableTimestamp(date: Date) {
    return date.toLocaleString('no-NO', {
        year: 'numeric',
        month: '2-digit',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    })
}

function getSensorData(url: string): Promise<SensorData> {
    return url === 'test' ? Promise.resolve().then(() => ({
        timestamp: getTimestamp(),
        imu: {
            orientation: {
                radians: {
                    pitch: Math.random() * Math.PI,
                    roll: Math.random() * Math.PI,
                    yaw: Math.random() * Math.PI,
                },
                degrees: {
                    pitch: Math.random() * Math.PI,
                    roll: Math.random() * Math.PI,
                    yaw: Math.random() * Math.PI,
                },
            },
            accelerometer: {
                accelerometer: {
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    z: Math.random() * 100,
                },
                raw: {
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    z: Math.random() * 100,
                }
            },
            gyroscope: {
                gyroscope: {
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    z: Math.random() * 100,
                },
                raw: {
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    z: Math.random() * 100,
                }
            },
            compass: {
                compass: Math.random() * 100,
                raw: Math.random() * 100,
            }
        },
        environmental: {
            temperature: {
                temperature: Math.random() * 100,
                humidity: Math.random() * 100,
                pressure: Math.random() * 100,
            },
            humidity: Math.random() * 100,
            pressure: Math.random() * 100,
        },
    })) : fetch(url + '/sensors').then(res => res.json())
}

function RequestLocationAccessModal({ trigger, onCancel }: { onCancel: () => void, trigger?: (open: () => void) => React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const handleClose = useCallback(() => setOpen(false), [])
    const handleCancel = useCallback(() => {
        handleClose()
        onCancel()
    }, [handleClose, onCancel])
    const handleOk = useCallback(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(() => {

            }, (error) => {
                console.error(error)
            })
        }
        handleClose()
    }, [handleClose])

    return (
        <>
            {trigger?.(() => setOpen(true)) || <Button color="primary" onClick={() => setOpen(true)}>Allow Location Access</Button>}
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Request Location Access</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Do you wish to include your current location in the entry?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} color="primary">
                        No
                    </Button>
                    <Button onClick={handleOk} color="primary">
                        Grant access to location
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

function SensorEntryList({ entries, deleteEntry, max, deviceId, selected, onSelect }: { entries?: SensorEntry[], max?: number, deviceId: string, deleteEntry: (id: string) => void, selected?: string, onSelect?: (id: string) => void }) {
    const [showMore, setShowMore] = useState(false)
    const reversedEntryList = useMemo(() => {
        return entries?.slice().reverse().slice(0, showMore ? undefined : max)
    }, [entries, max, showMore])
    const isCalibrate = !!(selected || onSelect)
    return (
        !reversedEntryList?.length ? (
            <Typography variant="body2" color="text.secondary">No entries</Typography>
        ) : (
            <>
                <List disablePadding dense>
                    {isCalibrate ? (
                        <ListItem>
                            <ListItemText primary="Select Calibration refrence" />
                        </ListItem>
                    ) : null}
                    {reversedEntryList.map(entry => (
                        <ListItem key={entry.id}>
                            {isCalibrate ? (
                                <ListItemIcon>
                                    <Checkbox
                                        checked={selected === entry.id}
                                        onChange={() => onSelect?.(entry.id)}
                                    />
                                </ListItemIcon>
                            ) : null}
                            <ListItemText primary={getHumanReadableTimestamp(new Date(entry.timestamp))} />
                            <ListItemSecondaryAction>
                                <Button component={Link} to={generatePath(`/sensors/devices/:id/${isCalibrate ? 'calibration' : 'history'}/:entryId`, { id: deviceId, entryId: entry.id })}>
                                    View
                                </Button>
                                <IconButton color="error" onClick={() => deleteEntry(entry.id)}>
                                    <Delete />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                    {(entries?.length ?? 0) > (max ?? 0) ? (
                        <ListItem>
                            <Button
                                onClick={() => setShowMore(!showMore)}
                                fullWidth
                                endIcon={showMore ? <ExpandLess /> : <ExpandMore />}
                            >{showMore ? 'Show less' : 'Show more'}</Button>
                        </ListItem>
                    ) : null}
                </List>
            </>
        )
    )
}

function HistoryList({ deviceId, max }: { deviceId: string, max?: number }) {
    const { entryList, deleteEntry } = useSensorHistory()
    const { deviceEntryList } = useDeviceEntriesFor(entryList, deviceId)
    return <SensorEntryList
        entries={deviceEntryList}
        deviceId={deviceId}
        max={max}
        deleteEntry={deleteEntry}
    />
}

function CalibrationList({ deviceId, max }: { deviceId: string, max?: number }) {
    const { entryList, deleteEntry } = useCalibrationData()
    const { entry, setEntry } = useSelectedCalibrationData(deviceId)
    const { deviceEntryList } = useDeviceEntriesFor(entryList, deviceId)
    return <SensorEntryList
        entries={deviceEntryList}
        deviceId={deviceId}
        max={max}
        deleteEntry={deleteEntry}
        selected={entry?.calibrationDataId}
        onSelect={useCallback((id: string) => {
            setEntry({
                id: deviceId,
                calibrationDataId: id,
                selectedAt: getTimestamp(),
            })
        }, [setEntry, deviceId])}
    />
}

function getTimestamp() {
    return new Date().toISOString()
}

const getSensorEntry = (device: Device, requestGeolocationAccess?: () => void): Promise<SensorEntry | null | undefined> => getSensorData(device.url)
    .then(async (sensorData: SensorData) => {
        const createHistoryEntry = (sensorData: SensorData, location: GeolocationCoordinates | null) => {
            return ({
                id: generateId(),
                deviceId: device.id,
                timestamp: getTimestamp(),
                sensorData,
                location,
            })
        }
        if ('geolocation' in navigator) {
            return navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
                if (result.state === 'granted') {
                    return new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition((position) => {
                            resolve(createHistoryEntry(sensorData, position.coords))
                        }, (error) => {
                            console.error(error)
                            reject(error)
                        })
                    })
                } else if (result.state === 'prompt') {
                    requestGeolocationAccess?.()
                    return null
                }
            })
        } else {
            return createHistoryEntry(sensorData, null)
        }
    })

function DeviceScreen() {
    const { deviceId } = useParams()
    const navigate = useNavigate()
    const { deleteEntry: deleteDevice, entry: device } = useDevices(deviceId)
    const { setEntry: setSensorEntry } = useSensorHistory()
    const { setEntry: setCurrentCalibrationEntry } = useSelectedCalibrationData(deviceId)
    const { setEntry: createCalibrationEntry } = useCalibrationData()
    const [error, setErrorMessage] = useState('')

    const setError = (error: Error) => {
        setErrorMessage(error.message)
        console.error(error)
    }

    const calibrate = useCallback((sensorEntry: SensorEntry) => {
        if (deviceId) {
            createCalibrationEntry(sensorEntry)
            setCurrentCalibrationEntry({
                id: deviceId,
                calibrationDataId: sensorEntry.id,
                selectedAt: getTimestamp(),
            })
        }
    }, [createCalibrationEntry, deviceId, setCurrentCalibrationEntry])

    if (!deviceId) {
        const notFound = <div>Device not found</div>
        return notFound
    }

    return (
        <div>
            <ErrorNotification error={error} />
            <Routes>
                <Route path="/edit" element={<DeviceForm id={deviceId} device={device} />} />
                <Route path="/" element={(
                    <Grid container spacing={3} justifyContent="center">
                        <Grid item xs={12} md={7}>
                            <Card>
                                <CardHeader title={device?.name || 'Unknown'} subheader={'Created: ' + (device?.createdAt ? getHumanReadableTimestamp(new Date(device.createdAt)) : 'Unknown')} />
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">{device?.url || 'Unknown'}</Typography>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        component={Link}
                                        to={generatePath('/sensors/devices/:id/edit', { id: deviceId })}
                                    >Edit</Button>
                                    <DeleteConfirmation onDelete={() => {
                                        deleteDevice(deviceId)
                                        navigate("/sensors/devices")
                                    }} />
                                </CardActions>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={7}>
                            <Card>
                                <CardHeader title="Calibration" />
                                <CardContent>
                                    <CalibrationList deviceId={deviceId} max={5} />
                                </CardContent>
                                <CardActions>
                                    <Button component={Link} to={generatePath('/sensors/devices/:id/calibration', { id: deviceId })} >
                                        Show Calibration History
                                    </Button>
                                    {device ? (
                                        <RequestLocationAccessModal
                                            onCancel={() => getSensorEntry(device).then(data => {
                                                if (data) {
                                                    calibrate(data)
                                                }
                                            }).catch(setError)}
                                            trigger={(open) => (
                                                <Button color="primary" onClick={() => getSensorEntry(device, open).then(data => {
                                                    if (data) {
                                                        calibrate(data)
                                                    }
                                                }).catch(setError)}>
                                                    Calibrate
                                                </Button>
                                            )} />
                                    ) : null}
                                </CardActions>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={7}>
                            <Card>
                                <CardHeader title="History" />
                                <CardContent>
                                    <HistoryList deviceId={deviceId} max={5} />
                                </CardContent>
                                <CardActions>
                                    <Button component={Link} to={generatePath('/sensors/devices/:id/history', { id: deviceId })} >
                                        Show History
                                    </Button>
                                    {device ? (
                                        <RequestLocationAccessModal
                                            onCancel={() => getSensorEntry(device).then(data => {
                                                if (data) {
                                                    setSensorEntry(data)
                                                }
                                            }).catch(setError)}
                                            trigger={(open) => (
                                                <Button color="primary" onClick={() => getSensorEntry(device, open).then(data => {
                                                    if (data) {
                                                        setSensorEntry(data)
                                                    }
                                                }).catch(setError)}>
                                                    Add Log Entry
                                                </Button>
                                            )} />
                                    ) : null}
                                </CardActions>
                            </Card>
                        </Grid>
                    </Grid>
                )} />
            </Routes>
        </div >
    )

}

function CreateDeviceScreen() {
    return (
        <DeviceForm createNew id={generateId()} />
    )
}

function HistoryScreen() {
    const { deviceId } = useParams()
    const { entryList } = useSensorHistory()
    const { deviceEntryList } = useDeviceEntriesFor(entryList, deviceId)
    return (
        <List>
            {deviceEntryList?.map(entry => {
                return (
                    <ListItem key={entry.id} button component={Link} to={generatePath('/sensors/devices/:deviceId/history/:id', { deviceId: deviceId, id: entry.id })}>
                        <ListItemText primary={getHumanReadableTimestamp(new Date(entry.timestamp))} />
                    </ListItem>
                )
            })}
        </List>
    )
}

function HistoryEntryScreen() {
    const { entryId } = useParams()
    const { entry } = useSensorHistory(entryId)
    return (
        <Card>
            <CardHeader title="Entry data" secondary={'Created: ' + (entry ? getHumanReadableTimestamp(new Date(entry.timestamp)) : 'Unknown')} />
            <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(entry, null, 2)}
                </Typography>
            </CardContent>
        </Card>
    )
}

function CalibrationEntryScreen() {
    const { entryId } = useParams()
    const { entry } = useCalibrationData(entryId)
    return (
        <Card>
            <CardHeader title="Entry data" secondary={'Created: ' + (entry ? getHumanReadableTimestamp(new Date(entry.timestamp)) : 'Unknown')} />
            <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(entry, null, 2)}
                </Typography>
            </CardContent>
        </Card>
    )
}

function CalibrationScreen() {
    const { deviceId } = useParams()
    const { entryList } = useCalibrationData()
    const { deviceEntryList } = useDeviceEntriesFor(entryList, deviceId)
    return (
        <List>
            {deviceEntryList?.map(entry => {
                return (
                    <ListItem key={entry.id} button component={Link} to={generatePath('/sensors/devices/:deviceId/calibration/:id', { deviceId: deviceId, id: entry.id })}>
                        <ListItemText primary={getHumanReadableTimestamp(new Date(entry.timestamp))} />
                    </ListItem>
                )
            })}
        </List>
    )
}

function ErrorNotification({ error }: { error: string }) {
    const [showSnackbar, setShowSnackbar] = useState(false)
    useEffect(() => {
        console.log(error)
        if (error) {
            setShowSnackbar(true)
        }
    }, [error, setShowSnackbar])
    return (
        <Snackbar
            open={!!(showSnackbar && error)}
            autoHideDuration={6000}
            onClose={() => setShowSnackbar(false)}
            message={error}
            action={(
                <>
                    <IconButton
                        size="small"
                        aria-label="close"
                        color="inherit"
                        onClick={() => setShowSnackbar(false)}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                </>
            )}
        >
            <Alert severity="error" onClose={() => setShowSnackbar(false)}>{error}</Alert>
        </Snackbar>
    )
}

export function SensorScreen() {
    const navigate = useNavigate()
    return (
        <>
            <Toolbar>
                <IconButton edge="start" onClick={() => navigate(-1)}>
                    <ArrowBack />
                </IconButton>
            </Toolbar>
            <main style={{ marginBottom: "200px" }}>
                <Routes>
                    <Route path={`/`} element={<DevicesScreen />} />
                    <Route path={`/devices`} element={<DevicesScreen />} />
                    <Route path={`/devices/new`} element={<CreateDeviceScreen />} />
                    <Route path={`/devices/:deviceId/*`} element={<DeviceScreen />} />
                    <Route path={`/devices/:deviceId/calibration/*`} element={<CalibrationScreen />} />
                    <Route path={`/devices/:deviceId/calibration/:entryId/*`} element={<CalibrationEntryScreen />} />
                    <Route path={`/devices/:deviceId/history/*`} element={<HistoryScreen />} />
                    <Route path={`/devices/:deviceId/history/:entryId/*`} element={<HistoryEntryScreen />} />
                </Routes>
            </main>
        </>
    );
}
