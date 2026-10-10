import * as THREE from 'three'
import { useTalker } from './useTalker.js'

// Prof. Peter Schott: short dark-brown hair, light-blue button-down (open collar, chest pocket),
// charcoal slacks, brown shoes, blue eyes, and an easy smile. Same primitive style as Zaman.jsx.
// Figure faces +z; his left side is +x.

const SKIN = '#e8c0a2'
const HAIR = '#4a3326'
const SHIRT = '#a9c3e6'
const SLACKS = '#2c2e35'
const SHOES = '#5a3a24'

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)

const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => <mesh geometry={g} material={m(c, o)} position={p} scale={s} rotation={r} />

export default function Schott({ position = [0, 0, 0], rotation = 0, id = 'schott' }) {
  const { root, head, armR, armL } = useTalker(id, rotation, { wave: 1.2 }) // extra-cheerful wave
  const shirt = m(SHIRT)

  return (
    <group ref={root} position={position} rotation={[0, rotation, 0]}>
      {/* shoes + slacks */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <B g={BOX} c={SHOES} p={[0.1 * sx, 0.04, 0.05]} s={[0.11, 0.08, 0.27]} />
          <mesh geometry={CAP} material={m(SLACKS)} position={[0.1 * sx, 0.5, 0]} scale={[0.085, 0.33, 0.085]} />
        </group>
      ))}
      <B g={BOX} c={SLACKS} p={[0, 0.9, 0]} s={[0.36, 0.14, 0.22]} />
      <B g={BOX} c="#3a2a1e" p={[0, 0.965, 0]} s={[0.37, 0.03, 0.225]} />

      {/* shirt: body, button placket, chest pocket on his left, open collar */}
      <mesh geometry={CAP} material={shirt} position={[0, 1.24, 0]} scale={[0.2, 0.19, 0.13]} />
      <B g={BOX} c={SHIRT} p={[0, 1.22, 0]} s={[0.4, 0.5, 0.22]} />
      <B g={BOX} c="#9db8dc" p={[0, 1.2, 0.137]} s={[0.025, 0.5, 0.005]} />
      {[1.38, 1.26, 1.14, 1.02].map((y) => (
        <B key={y} c="#f7f7f7" p={[0, y, 0.142]} s={[0.008, 0.008, 0.004]} />
      ))}
      <B g={BOX} c="#9db8dc" p={[0.09, 1.3, 0.136]} s={[0.08, 0.08, 0.006]} />
      <B g={BOX} c={SKIN} p={[0, 1.465, 0.11]} r={[0.25, 0, Math.PI / 4]} s={[0.07, 0.07, 0.02]} />
      {[-1, 1].map((sx) => (
        <B key={sx} g={BOX} c={SHIRT} p={[0.05 * sx, 1.49, 0.1]} r={[0.5, 0, 0.5 * sx]} s={[0.075, 0.04, 0.012]} />
      ))}
      <B g={SPH} c={SKIN} p={[0, 1.53, 0]} s={[0.05, 0.06, 0.05]} />

      {/* arms in long sleeves */}
      <group ref={armL} position={[0.24, 1.42, 0]} rotation={[0, 0, 0.12]}>
        <mesh geometry={CAP} material={shirt} position={[0, -0.24, 0]} scale={[0.06, 0.2, 0.06]} />
        <mesh geometry={SPH} material={m(SKIN)} position={[0, -0.5, 0.01]} scale={[0.045, 0.055, 0.04]} />
      </group>
      <group ref={armR} position={[-0.24, 1.42, 0]}>
        <mesh geometry={CAP} material={shirt} position={[0, -0.24, 0]} scale={[0.06, 0.2, 0.06]} />
        <mesh geometry={SPH} material={m(SKIN)} position={[0, -0.5, 0.01]} scale={[0.045, 0.055, 0.04]} />
      </group>

      {/* head: short side-swept dark-brown hair, blue eyes, big friendly smile */}
      <group ref={head} position={[0, 1.67, 0]}>
        <B c={SKIN} s={[0.115, 0.14, 0.125]} />
        {[-1, 1].map((sx) => (
          <B key={sx} c={SKIN} p={[0.118 * sx, 0, 0]} s={[0.02, 0.035, 0.02]} />
        ))}
        <B c={HAIR} p={[0, 0.065, -0.012]} s={[0.123, 0.09, 0.13]} />
        <B c={HAIR} p={[0.02, 0.105, 0.045]} r={[0.3, 0, -0.25]} s={[0.11, 0.045, 0.08]} />
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B c="#ffffff" p={[0.044 * sx, 0.022, 0.108]} s={[0.02, 0.014, 0.01]} />
            <B c="#4f7fae" p={[0.044 * sx, 0.022, 0.115]} s={[0.01, 0.01, 0.006]} />
            <B g={BOX} c={HAIR} p={[0.046 * sx, 0.055, 0.112]} r={[0, 0, -0.1 * sx]} s={[0.04, 0.01, 0.01]} />
          </group>
        ))}
        <B c={SKIN} p={[0, -0.012, 0.125]} s={[0.022, 0.03, 0.024]} />
        <B g={BOX} c="#ffffff" p={[0, -0.056, 0.113]} s={[0.06, 0.016, 0.01]} />
        <B g={BOX} c="#a5574a" p={[0, -0.067, 0.112]} s={[0.064, 0.006, 0.01]} />
      </group>
    </group>
  )
}
