import { Add, ArrowBack, Close, Code, Delete, Download, ExpandLess, ExpandMore, Stop, TableChart } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Alert, Button, ButtonGroup, Card, CardActionArea, CardActions, CardContent, CardHeader, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControlLabel, Grid, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemSecondaryAction, ListItemText, ListSubheader, Paper, Radio, RadioGroup, Snackbar, TextField, Toolbar, Typography } from '@mui/material';
import { Box } from '@mui/system';
import useLocalStorage from '@rehooks/local-storage';
import copy from 'clipboard-copy';
import { writeToString } from 'fast-csv';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { generatePath, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { RealtimeDataAtom } from '../atoms/RealtimeData';
import { NumberInput } from '../components/MatrixCard';
import { useDarkMode } from '../components/Pixel/Themes';
import { useSocket } from '../hooks/useSocket';

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

type OrientationData = {
    radians: Orientation
    degrees: Orientation
}
type CompassData = {
    compass: number
    raw: number
}
type GyroscopeData = {
    gyroscope: Vector
    raw: Vector
}

type AccelerometerData = {
    accelerometer: Vector
    raw: Vector
}

type ImuData = {
    orientation: OrientationData
    compass: CompassData
    gyroscope: GyroscopeData
    accelerometer: AccelerometerData
}

type TemperatureData = {
    temperature: number
    humidity: number
    pressure: number
}

type EnvironmentalData = {
    temperature: TemperatureData
    humidity: number
    pressure: number
}

export type SensorData = {
    timestamp: string
    environmental: EnvironmentalData
    imu: ImuData
}

type SensorEntry = {
    id: string
    name: string
    height: number | null
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
        /**
         * Must be batch write to revent race conflicts in localStorage
         */
        deleteEntries: (entryIds: string[]) => {
            setEntryMap(_.omit(entryMap, entryIds))
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
                <Grid item xs={11} md={7}>
                    <Card>
                        <CardHeader title={createNew ? "Create Device" : "Edit Device"} />
                        <CardContent>
                            <TextField label="Name" value={name} required onChange={e => setName(e.target.value)} fullWidth />
                            <Box my={2} />
                            <TextField label="URL" value={url} required onChange={e => setUrl(e.target.value)} fullWidth />
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

type ViewMode = 'view' | 'download' | ''
type ContentType = 'json' | 'csv'

function ContentTypeSwitch({ contentType, setContentType, }: { contentType: ContentType, setContentType: (contentType: ContentType) => void }) {
    return (
        <RadioGroup row value={contentType} onChange={e => {
            setContentType(e.target.value as ContentType)
        }}>
            <FormControlLabel value="json" control={<Radio />} label="JSON" />
            <FormControlLabel value="csv" control={<Radio />} label="CSV" />
        </RadioGroup>
    )
}

function downloadFile(filename: string, content: string) {
    const element = document.createElement('a')
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
}

function CardButton({ onClick, label, icon }: { onClick: () => void, label: string, icon: React.ReactNode }) {
    return (
        <>

            <Card >
                <CardActionArea onClick={onClick}>
                    <CardContent>
                        <Box display="flex" alignItems="center" flexDirection="column" justifyContent="space-between">
                            {icon}
                            <Typography variant="body2" color="text.secondary">
                                {label}
                            </Typography>
                        </Box>
                    </CardContent>
                </CardActionArea>
            </Card>
        </>
    )
}
function flattenObject(o: object, prefix = '', result = {}, keepNull = true) {
    if (_.isString(o) || _.isNumber(o) || _.isBoolean(o) || (keepNull && _.isNull(o))) {
        //@ts-ignore
        result[prefix] = o;
        return result;
    }

    if (_.isArray(o) || _.isPlainObject(o)) {
        for (let i in o) {
            let pref = prefix;
            if (_.isArray(o)) {
                pref = pref + `${i}`;
            } else {
                if (_.isEmpty(prefix)) {
                    pref = i;
                } else {
                    pref = prefix + '_' + i;
                }
            }
            //@ts-ignore
            flattenObject(o[i] as object, pref, result, keepNull);
        }
        return result;
    }
    return result;
}

function JsonBlock({ json }: { json: string }) {
    const [isDarkMode] = useDarkMode()
    return (
        <SyntaxHighlighter customStyle={{ margin: 0 }} language={'json'} style={isDarkMode ? materialDark : materialLight}>
            {json}
        </SyntaxHighlighter>
    )
}

function DataInspectionModal({ mode, entries, setMode, refrence }: { mode: ViewMode, setMode: (mode: ViewMode) => void, entries: SensorEntry[], refrence?: SensorEntry }) {
    const [contentType, setContentType] = useState<ContentType>('csv')
    const handleClose = useCallback(() => setMode(''), [setMode])
    const [csvString, setCsvString] = useState<string>('Processing ...')
    const withHeight = useMemo(() => !refrence ? entries : entries.map(e => ({ ...e, height: heightFrom(e.sensorData, refrence) })), [entries, refrence])
    const jsonString = useMemo(() => JSON.stringify({ entries: withHeight }, null, 2), [withHeight])
    const [isDarkMode] = useDarkMode()
    useEffect(() => {
        writeToString(withHeight.map(entry => flattenObject(entry)), {
            headers: true,
        }).then(setCsvString)
    }, [withHeight])
    return (
        <Dialog open={!!mode} onClose={() => setMode('')} fullScreen={mode === "view"}>
            <DialogTitle>{mode === 'view' ? 'View' : 'Download'} data as</DialogTitle>
            <DialogContent sx={{ padding: mode === 'view' ? 0 : undefined, paddingBottom: 0, overflow: "hidden" }}>
                {mode === 'view' ? (
                    <>
                        <Box px={2}>
                            <ContentTypeSwitch contentType={contentType} setContentType={setContentType} />
                        </Box>
                        <Paper sx={{ overflow: "auto", height: '100%' }}>
                            <SyntaxHighlighter customStyle={{ margin: 0 }} language={contentType} style={isDarkMode ? materialDark : materialLight}>
                                {contentType === 'json' ? jsonString : csvString}
                            </SyntaxHighlighter>
                            <Box p={2} />
                        </Paper>
                    </>
                ) : null}
                {mode === 'download' ? (
                    <>
                        <Grid container spacing={2} height={100}>
                            <Grid item xs={6}>
                                <CardButton label="JSON" onClick={() => {
                                    handleClose()
                                    downloadFile(`pi-data-${new Date().toISOString()}.json`, jsonString)
                                }} icon={<Code />} />
                            </Grid>
                            <Grid item xs={6}>
                                <CardButton label="CSV" onClick={() => {
                                    handleClose()
                                    downloadFile(`pi-data-${new Date().toISOString()}.csv`, csvString)
                                }} icon={<TableChart />} />
                            </Grid>
                        </Grid>
                    </>
                ) : null}
            </DialogContent >
            <DialogActions>
                {mode === 'download' ? (
                    <>
                        <Button onClick={() => {
                            handleClose()
                        }} color="secondary">
                            Cancel
                        </Button>
                    </>
                ) : null}
                {mode === 'view' ? (
                    <>
                        <Button onClick={() => {
                            handleClose()
                            copy(contentType === 'json' ? jsonString : csvString)
                        }} color="primary">
                            Copy to clipboard
                        </Button>
                        <Button onClick={() => {
                            handleClose()
                        }} color="primary">
                            Done
                        </Button>
                    </>
                ) : null}
            </DialogActions>
        </Dialog >
    )
}

function heightFrom(entry: SensorData, refrence: SensorEntry) {
    const T1: number = refrence.sensorData.environmental.temperature.temperature
    const a: number = -0.0065
    const p: number = entry.environmental.pressure
    const p1: number = refrence.sensorData.environmental.pressure
    const R: number = 287.06
    const g0: number = 9.81
    const h1: number = refrence.height || 0
    return (T1 / a) * (((p / p1) ** (- ((a * R) / g0))) - 1) + h1
}

function DataDownloadButton({ entries, refrence }: { entries?: SensorEntry[], refrence?: SensorEntry }) {
    const [mode, setMode] = useState<ViewMode>('')
    return (
        <>

            {entries?.length ? (
                <ListItem>
                    <DataInspectionModal mode={mode} setMode={setMode} entries={entries} refrence={refrence} />
                    <ListItemText primary={`${entries.length} entries`} />
                    <ListItemSecondaryAction>
                        <ButtonGroup aria-label="download or view button group" size="small">
                            <Button onClick={() => setMode('view')}>View</Button>
                            <Button onClick={() => setMode('download')} endIcon={<Download />}>Download</Button>
                        </ButtonGroup>
                    </ListItemSecondaryAction>
                </ListItem>
            ) : null}
        </>
    )
}

function SensorEntryList({ entries, setEntry, deleteEntries, max, deviceId, selected, onSelect, calibrationEntry }: { entries?: SensorEntry[], setEntry: (entry: SensorEntry) => void, max?: number, deviceId: string, deleteEntries: (ids: string[]) => void, selected?: string, onSelect?: (id: string) => void, calibrationEntry?: SensorEntry }) {
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
                    <DataDownloadButton entries={entries} refrence={calibrationEntry} />
                    {reversedEntryList.map(entry => {
                        const labelId = `checkbox-list-label-${entry.id}`
                        return (
                            <RequestNameButtonModal
                                key={entry.id}
                                value={entry.name}
                                editMode
                                onSubmit={(name) => {
                                    setEntry({ ...entry, name })
                                }}
                                trigger={(open) => (
                                    <ListItem disablePadding secondaryAction={(
                                        <>
                                            <Button component={Link} to={generatePath(`/sensors/devices/:id/${isCalibrate ? 'calibration' : 'history'}/:entryId`, { id: deviceId, entryId: entry.id })}>
                                                View
                                            </Button>
                                            <IconButton color="error" edge="end" onClick={() => deleteEntries([entry.id])}>
                                                <Delete />
                                            </IconButton>
                                        </>
                                    )}>
                                        <ListItemButton role={undefined} onClick={() => {
                                            open()
                                            onSelect?.(entry.id)
                                        }} dense>
                                            {isCalibrate ? (
                                                <ListItemIcon>
                                                    <Checkbox
                                                        edge="start"
                                                        checked={selected === entry.id}
                                                        tabIndex={-1}
                                                        disableRipple
                                                        inputProps={{ 'aria-labelledby': labelId }}
                                                    />
                                                </ListItemIcon>
                                            ) : null}
                                            <ListItemText id={labelId} primary={entry.name || 'Untitled'}
                                                secondary={
                                                    <div>
                                                        <div>{calibrationEntry ? heightFrom(entry.sensorData, calibrationEntry).toFixed(1) + 'm' : null}</div>
                                                        <div>{getHumanReadableTimestamp(new Date(entry.timestamp))}</div>
                                                    </div>
                                                } />
                                        </ListItemButton>
                                    </ListItem>
                                )}
                            />
                        )
                    })}
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
    const { entryList, deleteEntries, setEntry } = useSensorHistory()
    const { deviceEntryList } = useDeviceEntriesFor(entryList, deviceId)
    const { entry: calibrationProfile } = useSelectedCalibrationData(deviceId)
    const { entry: calibrationEntry } = useCalibrationData(calibrationProfile?.calibrationDataId)
    return <SensorEntryList
        setEntry={setEntry}
        entries={deviceEntryList}
        deviceId={deviceId}
        max={max}
        deleteEntries={deleteEntries}
        calibrationEntry={calibrationEntry}
    />
}

function CalibrationList({ deviceId, max }: { deviceId: string, max?: number }) {
    const { entryList, deleteEntries, setEntry } = useCalibrationData()
    const { entry, setEntry: setSelected } = useSelectedCalibrationData(deviceId)
    const { deviceEntryList } = useDeviceEntriesFor(entryList, deviceId)
    return <SensorEntryList
        setEntry={setEntry}
        entries={deviceEntryList}
        deviceId={deviceId}
        max={max}
        deleteEntries={deleteEntries}
        selected={entry?.calibrationDataId}
        onSelect={useCallback((id: string) => {
            setSelected({
                id: deviceId,
                calibrationDataId: id,
                selectedAt: getTimestamp(),
            })
        }, [setSelected, deviceId])}
    />
}

function getTimestamp() {
    return new Date().toISOString()
}

async function shouldRequestGeolocation(): Promise<boolean> {
    if ('geolocation' in navigator) {
        return await navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
            return result.state === 'prompt'
        })
    }
    return false
}

const getSensorEntry = (device: Device, name: string): Promise<SensorEntry | null | undefined> => getSensorData(device.url)
    .then(async (sensorData: SensorData) => {
        const createHistoryEntry = (sensorData: SensorData, location: GeolocationCoordinates | null) => {
            return ({
                id: generateId(),
                name,
                height: null,
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
                }
            })
        } else {
            return createHistoryEntry(sensorData, null)
        }
    })

function round(this: any, key: string, value: any) {
    return value?.toFixed ? Number((value as number).toFixed(2)) : value
}

const RealtimeDataBlock = React.memo(({ calibrationEntry, floorHeight }: { calibrationEntry?: SensorEntry, floorHeight: number }) => {
    const realtimeData = useRecoilValue(RealtimeDataAtom)
    const height = (calibrationEntry && realtimeData) ? Number(heightFrom(realtimeData, calibrationEntry).toFixed(2)) : null
    const currentFloor = (height !== null) ? (((height < 0) ? -1 : 1) * Math.ceil((Math.abs(height) / floorHeight))) : null
    return (
        <>
            {realtimeData ? (
                <>
                    <Box my={4} />
                    <JsonBlock json={JSON.stringify({
                        ...realtimeData,
                        height,
                        currentFloor,
                    }, round, 2)} />
                </>
            ) : null}
        </>
    )
})

const DataWindow = React.memo(({ url, calibrationEntry }: { url?: string, calibrationEntry?: SensorEntry }) => {
    const setRealtimeData = useSetRecoilState(RealtimeDataAtom)
    const [telemetryActive, setTelemetryActive] = useState(false)
    const [floorHeight, setFloorHeight] = useState(2.7)
    const [socket, connected, connecting, connect] = useSocket(useMemo(() => ({
        sensor_data(data: SensorData) {
            setRealtimeData(data)
        },
    }), [setRealtimeData]))
    useEffect(() => {
        if (!connected) {
            setTelemetryActive(false)
        }
    }, [connected])
    return (
        <>
            <Box my={2} />
            <Paper>
                <NumberInput
                    label="Floor height"
                    value={floorHeight}
                    onChange={(value) => setFloorHeight(value)}
                />
                <Box my={2} />
                {((url && !connected) || !socket) ? (
                    connecting ? (
                        <Button fullWidth variant="contained" color="warning" endIcon={<Stop />} onClick={() => connect(false)}>Connecting ...</Button>
                    ) : (
                        <Button fullWidth variant="contained" color="success" onClick={() => connect(true, url)}>Connect</Button>
                    )
                ) : (
                    <Grid container spacing={2}>
                        <Grid item sm={6} xs={12}>
                            {telemetryActive ? (
                                <Button fullWidth variant="contained" color="warning" onClick={() => {
                                    socket.emit('unsubscribe_from_sensors')
                                    setTelemetryActive(false)
                                }}>Stop Telemetry</Button>
                            ) : (
                                <Button fullWidth variant="contained" color="success" onClick={() => {
                                    socket.emit('subscribe_to_sensors')
                                    setTelemetryActive(true)
                                }}>Start Telemetry</Button>
                            )}
                        </Grid>
                        <Grid item sm={6} xs={12}>
                            <Button fullWidth variant="contained" color="error" onClick={() => connect(false)}>Disonnect</Button>
                        </Grid>
                    </Grid>
                )}
                <RealtimeDataBlock calibrationEntry={calibrationEntry} floorHeight={floorHeight} />
                {url ? null : (
                    <Typography variant="body2" color="text.secondary">
                        Please add a device url
                    </Typography>
                )}
            </Paper>
        </>
    )
})

function RequestNameButtonModal({ onSubmit, trigger, editMode, value }: { value?: string, editMode?: boolean, onSubmit: (name: string) => void, trigger: (open: () => void) => React.ReactElement }) {
    const [name, setName] = useState(value || '')
    const [open, setOpen] = useState(false)
    const handleClose = () => {
        setOpen(false)
        if (!value) {
            setName('')
        }
    }
    const handleSubmit = () => {
        setOpen(false)
        onSubmit(name)
        if (!value) {
            setName('')
        }
    }
    useEffect(() => {
        setName(value || '')
    }, [value, setName])
    return (
        <>
            {trigger(() => setOpen(true))}
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Entry Name</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter a name for the entry
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        type="text"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSubmit()
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} color="primary">
                        {editMode ? 'Save' : 'Create Entry'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

function RegisterSensorReadingButton({ device, onSubmit, label, setError }: { device: Device, setError: (error: Error) => void, label: string, onSubmit: (entry: SensorEntry) => void }) {
    const [loading, setLoading] = useState(false)
    return (
        <RequestNameButtonModal
            onSubmit={(name) => {
                setLoading(true)
                getSensorEntry(device, name).then(data => {
                    if (data) {
                        return onSubmit(data)
                    }
                }).catch(setError)
                    .finally(() => {
                        setLoading(false)
                    })
            }}
            trigger={(openName) => (
                <RequestLocationAccessModal
                    onCancel={openName}
                    trigger={(openGeo) => (
                        <LoadingButton
                            loadingIndicator={<CircularProgress color="primary" size={16} />}
                            loading={loading}
                            color="primary"
                            onClick={async () => {
                                const shouldRequest = await shouldRequestGeolocation()
                                if (shouldRequest) {
                                    openGeo()
                                } else {
                                    openName()
                                }
                            }}>
                            {label}
                        </LoadingButton>
                    )} />
            )} />
    )
}

function useCalibrationEntry(deviceId?: string) {
    const { entry: calibrationSettings } = useSelectedCalibrationData(deviceId)
    const { entry: calibrationEntry } = useCalibrationData(calibrationSettings?.calibrationDataId)
    return [calibrationEntry]
}

function DeviceScreen() {
    const { deviceId } = useParams()
    const navigate = useNavigate()
    const { deleteEntries: deleteDevices, entry: device } = useDevices(deviceId)
    const { entryList: historyList, deleteEntries: deleteHistoryEntries, setEntry: setSensorEntry } = useSensorHistory()
    const { deleteEntries: deleteDeviceCalibrationSettings, setEntry: setCurrentCalibrationEntry, entry: calibrationSettings } = useSelectedCalibrationData(deviceId)
    const { entryList: calibrationList, deleteEntries: deleteCalibrationEntries, setEntry: createCalibrationEntry, entry: calibrationEntry } = useCalibrationData(calibrationSettings?.calibrationDataId)
    const [error, setErrorMessage] = useState('')
    const { deviceEntryList: deviceHistoryList } = useDeviceEntriesFor(historyList, deviceId)
    const { deviceEntryList: deviceCalibrationList } = useDeviceEntriesFor(calibrationList, deviceId)

    const setError = (error: Error | null) => {
        setErrorMessage(error?.message || '')
        if (error) {
            console.error(error)
        }
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
            <ErrorNotification error={error} setError={setError} />
            <Routes>
                <Route path="/edit" element={<DeviceForm id={deviceId} device={device} />} />
                <Route path="/" element={(
                    <Grid container spacing={3} justifyContent="center">
                        <Grid item xs={11} md={7}>
                            <Card>
                                <CardHeader title={device?.name || 'Unknown'} subheader={'Created: ' + (device?.createdAt ? getHumanReadableTimestamp(new Date(device.createdAt)) : 'Unknown')} />
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">{device?.url || 'Unknown'}</Typography>
                                    <DataWindow url={device?.url} calibrationEntry={calibrationEntry} />
                                </CardContent>
                                <CardActions>
                                    <Button
                                        component={Link}
                                        to={generatePath('/sensors/devices/:id/edit', { id: deviceId })}
                                    >Edit</Button>
                                    <DeleteConfirmation onDelete={() => {
                                        deleteHistoryEntries(deviceHistoryList?.map(entry => entry.id) || [])
                                        deleteCalibrationEntries(deviceCalibrationList?.map(entry => entry.id) || [])
                                        deleteDeviceCalibrationSettings([deviceId])
                                        deleteDevices([deviceId])
                                        navigate("/sensors/devices")
                                    }} />
                                </CardActions>
                            </Card>
                        </Grid>
                        <Grid item xs={11} md={7}>
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
                                        <RegisterSensorReadingButton device={device} label="Calibrate" onSubmit={calibrate} setError={setError} />
                                    ) : null}
                                </CardActions>
                            </Card>
                        </Grid>
                        <Grid item xs={11} md={7}>
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
                                        <RegisterSensorReadingButton device={device} label="Add Log Entry" onSubmit={setSensorEntry} setError={setError} />
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
                        <ListItemText primary={entry.name || 'Untitled'} secondary={getHumanReadableTimestamp(new Date(entry.timestamp))} />
                    </ListItem>
                )
            })}
        </List>
    )
}

function HistoryEntryScreen() {
    const { entryId, deviceId } = useParams()
    const { entry } = useSensorHistory(entryId)
    const [calibrationEntry] = useCalibrationEntry(deviceId)
    return (
        <Card>
            <CardHeader title="Entry data" secondary={'Created: ' + (entry ? getHumanReadableTimestamp(new Date(entry.timestamp)) : 'Unknown')} />
            <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                    <JsonBlock json={entry ? (
                        JSON.stringify({
                            ...entry,
                            height: calibrationEntry ? heightFrom(entry.sensorData, calibrationEntry).toFixed(2) : null,
                        }, null, 2)
                    ) : "not found"} />
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
                    <JsonBlock json={JSON.stringify(entry, null, 2)} />
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
                        <ListItemText primary={entry.name || 'Untitled'} secondary={getHumanReadableTimestamp(new Date(entry.timestamp))} />
                    </ListItem>
                )
            })}
        </List>
    )
}

function ErrorNotification({ error, setError }: { error: string, setError: (error: null) => void }) {
    const handleClose = () => {
        setError(null)
    }
    return (
        <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={handleClose}
            message={error}
            action={(
                <>
                    <IconButton
                        size="small"
                        aria-label="close"
                        color="inherit"
                        onClick={handleClose}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                </>
            )}
        >
            <Alert severity="error" onClose={handleClose}>{error}</Alert>
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
