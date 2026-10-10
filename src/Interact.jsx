import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DRUMS } from './layout.js'
import { PROF_INFO, TALKERS, talk } from './talk.js'

const REACH = 6 // meters: how close you need to be to start a chat
const CENTER = new THREE.Vector2(0, 0)

const inRoom = (room, x, z) => {
  const d = DRUMS.find((dr) => dr.id === room)
  return d && ((x - d.c[0]) / d.rx) ** 2 + ((z - d.c[1]) / d.rz) ** 2 < 1
}

// Every few frames, cast a ray from the crosshair. If it lands on a professor in the same
// classroom (so walls never count), report their id so the UI can offer "click to talk".
export default function Interact({ onAim }) {
  const ray = useMemo(() => {
    const r = new THREE.Raycaster()
    r.far = REACH
    return r
  }, [])
  const frame = useRef(0)
  const aimed = useRef(null)

  useFrame(({ camera }) => {
    if (++frame.current % 4) return
    let hit = null
    if (!talk.with) {
      ray.setFromCamera(CENTER, camera)
      for (const [id, { object }] of TALKERS) {
        if (!inRoom(PROF_INFO[id]?.room, camera.position.x, camera.position.z)) continue
        if (ray.intersectObject(object, true).length) {
          hit = id
          break
        }
      }
    }
    if (hit !== aimed.current) {
      aimed.current = hit
      onAim(hit)
    }
  })
  return null
}
