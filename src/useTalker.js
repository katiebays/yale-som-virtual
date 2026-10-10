import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { TALKERS, talk } from './talk.js'

const lerpAngle = (a, b, k) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k

// Shared behavior for chat-able professors: register for click-to-talk, face the player while
// chatting (otherwise scan the room), nod, and gesture. Attach the returned refs to the root
// group, head group, and the two arm groups (arms pivot at the shoulder, hanging along -y).
export function useTalker(id, rotation, { wave = 1 } = {}) {
  const root = useRef()
  const head = useRef()
  const armR = useRef()
  const armL = useRef()
  const yaw = useRef(rotation)

  useEffect(() => {
    TALKERS.set(id, { object: root.current })
    return () => TALKERS.delete(id)
  }, [id])

  useFrame(({ clock, camera }, dt) => {
    const t = clock.elapsedTime
    const r = root.current
    const chatting = talk.with === id
    const target = chatting
      ? Math.atan2(camera.position.x - r.position.x, camera.position.z - r.position.z)
      : rotation + Math.sin(t * 0.4) * 0.35
    yaw.current = lerpAngle(yaw.current, target, Math.min(1, dt * (chatting ? 6 : 2)))
    r.rotation.y = yaw.current
    head.current.rotation.x = chatting ? Math.sin(t * 3.1) * 0.05 : 0
    // talking hands while chatting, a friendly wave every few seconds otherwise
    const w = chatting ? 0.6 + Math.sin(t * 2.4) * 0.35 : Math.max(0, Math.sin(t * 0.9)) * 1.1 * wave
    armR.current.rotation.x = -0.15 - w * 0.9
    armR.current.rotation.z = -0.2 - (chatting ? 0 : w * 0.6)
    armL.current.rotation.x = chatting ? -0.4 + Math.sin(t * 2.4 + 1.3) * 0.25 : 0.05
  })

  return { root, head, armR, armL }
}
