// Shared state for talking to AI professors (read inside useFrame, so plain objects, not React state).
export const TALKERS = new Map() // id -> { object: THREE.Object3D, name, course, room }
export const talk = { with: null } // id of the professor currently in a chat, or null

export const PROF_INFO = {
  zaman: { name: 'Prof. Tauhid Zaman', course: 'MGT 409 · AI Foundations for Managers', room: '2200', greeting: 'Yo! Welcome to Evans 2200. Ask me anything: regression, the CLT, variance, AI agents, or what else is running at SOM this fall.' },
}

export const API_BASE = import.meta.env.VITE_API_URL ?? ''
