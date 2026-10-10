import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Labubu from './Labubu.jsx'
import { TALKERS, talk } from './talk.js'

// Prof. Tauhid Zaman: black hoodie with a BLACKPINK print, jeans, pink-trim sneakers, glasses,
// and a pink Labubu keychain swinging from his belt loop. Built from primitives like Professor.jsx.
// Figure faces +z. When you're chatting with him he turns to face you and gestures while he talks.

const SKIN = '#b9825a' // warm light brown
const HAIR = '#141012'
const HOODIE = '#141418'
const PINK = '#ff4fa3'
const DENIM = '#2f4466'

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
const TORUS = new THREE.TorusGeometry(1, 0.14, 8, 24)

const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o, mat }) => (
  <mesh geometry={g} material={mat ?? m(c, o)} position={p} scale={s} rotation={r} />
)

function printTex() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = HOODIE
  g.fillRect(0, 0, 512, 256)
  g.fillStyle = PINK
  g.font = 'bold 74px "Arial Black", Arial, sans-serif'
  g.textAlign = 'center'
  g.fillText('BLACK', 256, 112)
  g.fillText('PINK', 256, 196)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const lerpAngle = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k

export default function Zaman({ position = [0, 0, 0], rotation = 0, id = 'zaman' }) {
  const root = useRef()
  const armR = useRef()
  const armL = useRef()
  const charm = useRef()
  const head = useRef()
  const yaw = useRef(rotation)
  const print = useMemo(() => new THREE.MeshStandardMaterial({ map: printTex(), roughness: 0.9 }), [])
  const hoodie = m(HOODIE)

  useEffect(() => {
    TALKERS.set(id, { object: root.current })
    return () => TALKERS.delete(id)
  }, [id])

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime
    const r = root.current
    const chatting = talk.with === id
    // face the player while chatting, otherwise scan the room like the other professors
    const target = chatting
      ? Math.atan2(camera.position.x - r.position.x, camera.position.z - r.position.z)
      : rotation + Math.sin(t * 0.4) * 0.35
    yaw.current = lerpAngle(yaw.current, target, Math.min(1, dt * (chatting ? 6 : 2)))
    r.rotation.y = yaw.current
    // nod along a little when talking
    head.current.rotation.x = chatting ? Math.sin(t * 3.1) * 0.05 : 0
    // talking hands while chatting, a casual "yo" wave every few seconds otherwise
    const wave = chatting ? 0.6 + Math.sin(t * 2.4) * 0.35 : Math.max(0, Math.sin(t * 0.9)) * 1.1
    armR.current.rotation.x = -0.15 - wave * 0.9
    armR.current.rotation.z = -0.2 - (chatting ? 0 : wave * 0.6)
    armL.current.rotation.x = chatting ? -0.4 + Math.sin(t * 2.4 + 1.3) * 0.25 : 0.05
    // the Labubu keychain swings with his steps
    charm.current.rotation.z = Math.sin(t * 2.2) * 0.35
    charm.current.rotation.x = Math.sin(t * 1.6 + 0.7) * 0.15
  })

  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]}>
      {/* sneakers */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={BOX} c="#f4f4f6" p={[0.1 * sx, 0.05, 0.04]} s={[0.12, 0.1, 0.28]} />
          <B g={BOX} c={PINK} p={[0.1 * sx, 0.015, 0.04]} s={[0.125, 0.03, 0.29]} />
        </group>
      ))}
      {/* jeans */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={CAP} material={m(DENIM)} position={[0.1 * sx, 0.5, 0]} scale={[0.085, 0.33, 0.085]} />
      ))}
      <B g={BOX} c={DENIM} p={[0, 0.9, 0]} s={[0.36, 0.14, 0.22]} />
      <B g={BOX} c="#1a1a1a" p={[0, 0.96, 0]} s={[0.37, 0.035, 0.225]} />
      {/* hoodie body, pocket, print, drawstrings */}
      <mesh geometry={CAP} material={hoodie} position={[0, 1.24, 0]} scale={[0.22, 0.2, 0.14]} />
      <B g={BOX} c={HOODIE} p={[0, 1.22, 0]} s={[0.42, 0.5, 0.24]} />
      <B g={BOX} c="#0c0c0f" p={[0, 1.07, 0.142]} s={[0.26, 0.11, 0.01]} />
      <mesh material={print} position={[0, 1.27, 0.148]}>
        <planeGeometry args={[0.3, 0.15]} />
      </mesh>
      {[-1, 1].map((sx) => (
        <B key={sx} g={CYL} c={PINK} p={[0.04 * sx, 1.42, 0.15]} s={[0.006, 0.12, 0.006]} />
      ))}
      {/* hood bunched behind the neck */}
      <B c={HOODIE} p={[0, 1.5, -0.08]} s={[0.17, 0.09, 0.11]} />
      <B g={TORUS} c={HOODIE} p={[0, 1.5, 0]} r={[Math.PI / 2, 0, 0]} s={[0.1, 0.1, 0.25]} />
      <B g={CYL} c={SKIN} p={[0, 1.53, 0]} s={[0.05, 0.06, 0.05]} />

      {/* arms: left relaxed, right does the talking / waving */}
      <group ref={armL} position={[0.25, 1.42, 0]} rotation={[0, 0, 0.12]}>
        <mesh geometry={CAP} material={hoodie} position={[0, -0.24, 0]} scale={[0.065, 0.2, 0.065]} />
        <mesh geometry={SPH} material={m(SKIN)} position={[0, -0.5, 0.01]} scale={[0.045, 0.055, 0.04]} />
      </group>
      <group ref={armR} position={[-0.25, 1.42, 0]}>
        <mesh geometry={CAP} material={hoodie} position={[0, -0.24, 0]} scale={[0.065, 0.2, 0.065]} />
        <mesh geometry={SPH} material={m(SKIN)} position={[0, -0.5, 0.01]} scale={[0.045, 0.055, 0.04]} />
      </group>

      {/* head: short black hair, glasses, a grin */}
      <group ref={head} position={[0, 1.67, 0]}>
        <B c={SKIN} p={[0, 0, 0]} s={[0.115, 0.135, 0.125]} />
        {[-1, 1].map((sx) => (
          <B key={sx} c={SKIN} p={[0.118 * sx, 0, 0]} s={[0.02, 0.035, 0.02]} />
        ))}
        <B c={HAIR} p={[0, 0.06, -0.01]} s={[0.122, 0.095, 0.13]} />
        <B c={HAIR} p={[0, 0.1, 0.05]} r={[0.35, 0, 0]} s={[0.1, 0.04, 0.07]} />
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B c="#ffffff" p={[0.044 * sx, 0.02, 0.108]} s={[0.02, 0.016, 0.01]} />
            <B c="#1d1410" p={[0.044 * sx, 0.02, 0.116]} s={[0.01, 0.011, 0.006]} />
            <B g={TORUS} c="#111" p={[0.046 * sx, 0.02, 0.122]} s={[0.032, 0.028, 0.03]} />
            <B g={BOX} c={HAIR} p={[0.046 * sx, 0.058, 0.112]} r={[0, 0, -0.08 * sx]} s={[0.042, 0.01, 0.01]} />
          </group>
        ))}
        <B g={BOX} c="#111" p={[0, 0.022, 0.126]} s={[0.025, 0.006, 0.006]} />
        <B c={SKIN} p={[0, -0.015, 0.124]} s={[0.02, 0.028, 0.022]} />
        <B g={BOX} c="#ffffff" p={[0, -0.058, 0.112]} s={[0.055, 0.014, 0.01]} />
        <B c="#2a1d17" p={[0, -0.075, 0.098]} s={[0.07, 0.04, 0.04]} o={{ transparent: true, opacity: 0.35 }} />
      </group>

      {/* Labubu keychain on the right belt loop */}
      <group position={[-0.17, 0.93, 0.09]}>
        <B g={TORUS} c="#c9a44a" o={{ metalness: 0.8, roughness: 0.3 }} s={[0.02, 0.02, 0.02]} />
        <group ref={charm}>
          <B g={CYL} c="#c9a44a" o={{ metalness: 0.8, roughness: 0.3 }} p={[0, -0.04, 0]} s={[0.003, 0.07, 0.003]} />
          <group position={[0, -0.24, 0]}>
            <Labubu fur="#ff8fc4" expression="mischief" height={0.17} anim="idle" />
          </group>
        </group>
      </group>
    </group>
  )
}
