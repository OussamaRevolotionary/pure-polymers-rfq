import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Fixed full-viewport WebGL backdrop. `emphasis` is the product family the buyer
 * is configuring (shifts the pellet mix); bump `pulseKey` to play the success swirl.
 */
export default function PelletField({ emphasis, pulseKey }) {
  const hostRef = useRef(null)
  const sceneRef = useRef(null)
  const [fallback, setFallback] = useState(false)

  const emphasisRef = useRef(emphasis)
  emphasisRef.current = emphasis

  useEffect(() => {
    if (!webglAvailable()) {
      setFallback(true)
      return undefined
    }
    let scene
    let cancelled = false
    // three.js loads after first paint so the form is interactive immediately.
    import('./pelletScene.js')
      .then(({ createPelletScene }) => {
        if (cancelled || !hostRef.current) return
        scene = createPelletScene(hostRef.current, { reducedMotion: prefersReducedMotion() })
        scene.onContextLost(() => setFallback(true))
        scene.setEmphasis(emphasisRef.current)
        sceneRef.current = scene
      })
      .catch(() => setFallback(true))
    return () => {
      cancelled = true
      scene?.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setEmphasis(emphasis)
  }, [emphasis])

  useEffect(() => {
    if (pulseKey) sceneRef.current?.pulse()
  }, [pulseKey])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_10%,rgba(80,156,53,0.16),transparent_70%),radial-gradient(55%_45%_at_90%_20%,rgba(50,73,179,0.22),transparent_70%),radial-gradient(70%_60%_at_50%_110%,rgba(224,154,45,0.10),transparent_70%)]" />
      {fallback ? <div className="pellet-fallback absolute inset-0 opacity-60" /> : <div ref={hostRef} className="absolute inset-0" />}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,transparent_45%,rgba(5,7,10,0.85)_100%)]" />
      <div className="grain absolute inset-0 opacity-[0.07] mix-blend-overlay" />
      <div className="blueprint absolute inset-0 opacity-[0.05]" />
    </div>
  )
}
