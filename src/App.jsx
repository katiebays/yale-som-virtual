import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import World from './World.jsx'
import Player from './Player.jsx'
import Minimap from './Minimap.jsx'
import TouchControls from './TouchControls.jsx'
import Interact from './Interact.jsx'
import ChatWindow from './ChatWindow.jsx'
import { EYE, SPAWN } from './layout.js'
import { PROF_INFO, talk } from './talk.js'

const typing = (e) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement

export default function App() {
  const [locked, setLocked] = useState(false)
  const [where, setWhere] = useState('')
  const [showMap, setShowMap] = useState(true)
  const lockRef = useRef()
  const mapRef = useRef()
  const onLock = useCallback((v) => setLocked(v), [])
  const onWhere = useCallback((w) => setWhere(w), [])
  // phones have no pointer lock, so they get a joystick + drag-to-look instead
  const [isTouch] = useState(() => matchMedia('(pointer: coarse)').matches) // phones + tablets; touchscreen laptops still get mouse mode
  const [touchOn, setTouchOn] = useState(false)
  const touchRef = useRef({ active: false, move: [0, 0], look: [0, 0], jump: false })
  const setTouch = (on) => {
    touchRef.current.active = on
    touchRef.current.move = [0, 0]
    setTouchOn(on)
  }
  const playing = locked || touchOn

  // talking to AI professors: aim the crosshair at one, then click / press E / tap Talk
  const [aim, setAim] = useState(null)
  const [chatWith, setChatWith] = useState(null)
  const chatFromTouch = useRef(false)
  const onAim = useCallback((id) => setAim(id), [])
  const openChat = useCallback(
    (id) => {
      talk.with = id
      setChatWith(id)
      setAim(null)
      chatFromTouch.current = touchRef.current.active
      if (touchRef.current.active) setTouch(false)
      else document.exitPointerLock?.()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  // resume = true when closed with the button (a click, so pointer lock can be re-requested)
  const closeChat = (resume) => {
    talk.with = null
    setChatWith(null)
    if (!resume) return
    if (chatFromTouch.current) setTouch(true)
    else lockRef.current?.()
  }

  useEffect(() => {
    const k = (e) => {
      if (typing(e)) return
      if (e.code === 'KeyM') setShowMap((v) => !v)
      if (e.code === 'KeyE' && aim && playing) openChat(aim)
    }
    const click = () => aim && locked && openChat(aim)
    window.addEventListener('keydown', k)
    window.addEventListener('mousedown', click)
    return () => {
      window.removeEventListener('keydown', k)
      window.removeEventListener('mousedown', click)
    }
  }, [aim, locked, playing, openChat])

  return (
    <>
      <Canvas
        camera={{ fov: 72, near: 0.05, far: 800, position: [SPAWN.x, EYE, SPAWN.z] }}
        dpr={[1, 1.75]}
      >
        <World />
        <Player lockRef={lockRef} mapRef={mapRef} touchRef={touchRef} onLock={onLock} onWhere={onWhere} />
        <Interact onAim={onAim} />
      </Canvas>

      <div className="where">
        <span className="dot" />
        {where}
      </div>
      <div className={showMap ? 'mapwrap' : 'mapwrap hidden'}>
        <Minimap drawRef={mapRef} />
      </div>
      <button className="maptoggle" onClick={() => setShowMap((s) => !s)}>
        {showMap ? 'hide map' : 'map'}
      </button>
      {playing && <div className={aim ? 'crosshair on' : 'crosshair'} />}
      {touchOn && <TouchControls touchRef={touchRef} onPause={() => setTouch(false)} />}
      {playing && aim && (
        touchOn ? (
          <button
            className="talkhint tap"
            onPointerDown={(e) => {
              e.stopPropagation()
              openChat(aim)
            }}
          >
            Talk to {PROF_INFO[aim].name}
          </button>
        ) : (
          <div className="talkhint">
            <b>Click</b> or press <b>E</b> to talk to {PROF_INFO[aim].name}
          </div>
        )
      )}
      {chatWith && <ChatWindow profId={chatWith} onClose={closeChat} />}

      {!playing && !chatWith && (
        <div className="overlay" onClick={() => (isTouch ? setTouch(true) : lockRef.current?.())}>
          <div className="card">
            <div className="kicker">Yale SOM · Evans Hall</div>
            <h1>Floor 2</h1>
            <p className="sub">Classroom drums, the cloister, Ross Library, the Beinecke Terrace Room, and the courtyard.</p>
            <button className="go">{isTouch ? 'Tap to walk in' : 'Click to walk in'}</button>
            {!isTouch && (
              <button
                className="go alt"
                onClick={(e) => {
                  e.stopPropagation()
                  setTouch(true)
                }}
              >
                Use on-screen joystick
              </button>
            )}
            {isTouch ? (
              <div className="keys">
                <span><b>Left thumb</b> joystick to walk (push all the way to hurry)</span>
                <span><b>Right thumb</b> drag to look</span>
              </div>
            ) : (
              <div className="keys">
                <span><b>W A S D</b> walk</span>
                <span><b>Mouse</b> look</span>
                <span><b>Shift</b> sprint</span>
                <span><b>Space</b> jump</span>
                <span><b>C</b> crouch</span>
                <span><b>M</b> map</span>
                <span><b>Esc</b> pause</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
