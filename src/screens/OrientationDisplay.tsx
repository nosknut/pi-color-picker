import { Canvas, MeshProps, useFrame } from '@react-three/fiber'
import React, { useRef, useState } from 'react'
import { Color, Euler } from 'three'

import { Controller } from './PIDController'

interface TOptions {
    k_p?: number;
    k_i?: number;
    k_d?: number;
    /**
     * Interval of time between two updates
     * If not set, it will be automatically calculated
     */
    dt?: number;
    /** The maximum absolute value of the integral term */
    i_max?: number;
}

declare class TController {
    public k_p: number;
    public k_i: number;
    public k_d: number;
    public dt: number;
    public i_max: number;

    public sumError: number;
    public lastError: number;
    public lastTime: number;

    public target: number;

    constructor(options: TOptions);
    constructor(k_p?: number, k_i?: number, k_d?: number, dt?: number);

    public setTarget(target: number): void;

    public update(currentValue: number): number;

    public reset(): number;
}


function smoothTransition(stateObject: any, refrenceObject: any, key: string, delta: number, controller: TController) {
    const stateValue = Number((stateObject[key] || 1).toFixed(2))
    if (stateValue !== refrenceObject[key]) {
        // console.log(stateObject[key], refrenceObject[key])
        //- refrenceObject[key]
        console.log(stateValue, refrenceObject[key])
        console.log(((-stateValue) + refrenceObject[key]))
        //stateObject[key] += delta * ((-stateValue) + refrenceObject[key])
        stateObject[key] += delta * (stateValue > 0 ? 1 : -1) * controller.update(Math.abs(stateValue))
    }
}

const cx = new Controller({
    k_p: 10,
    k_i: 0.1,
    k_d: 1,
    dt: 1
})
const cy = new Controller({
    k_p: 10,
    k_i: 0.1,
    k_d: 1,
    dt: 1
})
const cz = new Controller({
    k_p: 10,
    k_i: 0.1,
    k_d: 1,
    dt: 1
})

// https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene
// https://codesandbox.io/s/rrppl0y8l4?file=/src/App.js:911-1220
function Box(props: MeshProps & { targetOrientation: Euler }) {
    // This reference gives us direct access to the THREE.Mesh object
    const ref = useRef<any>()
    // Hold state for hovered and clicked events
    const [hovered, hover] = useState(false)
    const [clicked, click] = useState(false)
    cx.setTarget(props.targetOrientation.x)
    cy.setTarget(props.targetOrientation.y)
    cz.setTarget(props.targetOrientation.z)
    // Subscribe this component to the render-loop, rotate the mesh every frame
    useFrame((state, delta) => {
        smoothTransition(ref.current.rotation, props.targetOrientation, 'x', delta, cx as unknown as TController)
        smoothTransition(ref.current.rotation, props.targetOrientation, 'z', delta, cz as unknown as TController)
        smoothTransition(ref.current.rotation, props.targetOrientation, 'y', delta, cy as unknown as TController)
    })
    // Return the view, these are regular Threejs elements expressed in JSX
    // console.log(props.targetOrientation)
    return (
        <mesh
            {...props}
            // rotation={props.targetOrientation}
            ref={ref}
            scale={clicked ? 1.5 : 1}
            onClick={(event) => click(!clicked)}
            onPointerOver={(event) => hover(true)}
            onPointerOut={(event) => hover(false)}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={hovered ? 'hotpink' : 'purple'} />
        </mesh>
    )
}

class Avg {
    values: number[] = []

    update(value: number) {
        this.values.push(value)
        if (this.values.length > 3) {
            this.values.shift()
        }
        return value
        // return this.values.reduce((a, b) => a + b, 0) / this.values.length
    }
}

const ax = new Avg()
const ay = new Avg()
const az = new Avg()

export const OrientationDisplay = React.memo(({ roll, yaw, pitch }: { roll: number, yaw: number, pitch: number }) => {
    return (
        <Canvas>
            <ambientLight intensity={0.1} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={0.1} />
            <pointLight position={[-10, -10, -10]} />
            <Box position={[0, 0, 2]} targetOrientation={new Euler(
                Number(ax.update(roll * Math.PI / 180).toFixed(2)),
                Number(ay.update(yaw * Math.PI / 180).toFixed(2)),
                Number(az.update(pitch * Math.PI / 180).toFixed(2)),
            )} />
        </Canvas>
    )
})
