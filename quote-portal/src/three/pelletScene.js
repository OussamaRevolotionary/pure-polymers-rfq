import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Fog,
  InstancedMesh,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/** Brand pellet swatches (sRGB). White / black / blue / amber are the core palette. */
const SWATCH = {
  white: '#F2F4F7',
  black: '#0B0D11',
  blue: '#3249B3',
  amber: '#E09A2D',
  natural: '#E6DCC4',
  green: '#509C35',
  lime: '#BECC30',
}

/** Pellet mix per product family the buyer is looking at. Weights need not sum to 1. */
const PALETTES = {
  default: { white: 0.3, black: 0.24, blue: 0.26, amber: 0.2 },
  white: { white: 0.66, black: 0.1, blue: 0.12, amber: 0.12 },
  black: { black: 0.62, white: 0.14, blue: 0.14, amber: 0.1 },
  color: { blue: 0.34, amber: 0.24, green: 0.14, lime: 0.1, white: 0.1, black: 0.08 },
  additive: { amber: 0.4, natural: 0.22, white: 0.18, blue: 0.12, black: 0.08 },
  compound: { blue: 0.3, white: 0.24, black: 0.2, amber: 0.16, green: 0.1 },
}

// Pellets live behind the content plane (camera at z = 16) so copy stays legible.
const BOUNDS = { x: 24, y: 14, zNear: -1, zFar: -28 }
const BG = 0x06080b

/** Strand-cut masterbatch pellet: short cylinder with rounded edges. */
function pelletGeometry() {
  const r = 0.5
  const h = 0.72
  const e = 0.17
  const seg = 6
  const pts = [new Vector2(0, -h / 2), new Vector2(r - e, -h / 2)]
  for (let i = 1; i <= seg; i++) {
    const a = -Math.PI / 2 + (i / seg) * (Math.PI / 2)
    pts.push(new Vector2(r - e + Math.cos(a) * e, -h / 2 + e + Math.sin(a) * e))
  }
  pts.push(new Vector2(r, h / 2 - e))
  for (let i = 1; i <= seg; i++) {
    const a = (i / seg) * (Math.PI / 2)
    pts.push(new Vector2(r - e + Math.cos(a) * e, h / 2 - e + Math.sin(a) * e))
  }
  pts.push(new Vector2(0, h / 2))
  return new LatheGeometry(pts, 28)
}

function mulberry32(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickSwatch(palette, u) {
  const entries = Object.entries(palette)
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let acc = 0
  for (const [key, weight] of entries) {
    acc += weight / total
    if (u <= acc) return key
  }
  return entries[entries.length - 1][0]
}

export function createPelletScene(host, { reducedMotion = false } = {}) {
  const lowPower =
    (navigator.hardwareConcurrency ?? 8) <= 4 || window.matchMedia('(max-width: 767px)').matches
  const maxCount = lowPower ? 70 : 140

  const renderer = new WebGLRenderer({ antialias: !lowPower, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75))
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.95
  renderer.outputColorSpace = SRGBColorSpace
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  host.appendChild(renderer.domElement)

  const scene = new Scene()
  scene.fog = new Fog(BG, 17, 46)
  const pmrem = new PMREMGenerator(renderer)
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTexture
  scene.environmentIntensity = 0.62

  const camera = new PerspectiveCamera(38, 1, 0.1, 100)
  camera.position.set(0, 0, 16)

  const key = new DirectionalLight(0xfff1dc, 1.7)
  key.position.set(6, 9, 10)
  const rim = new DirectionalLight(0x7d93ff, 1.2)
  rim.position.set(-9, -3, -6)
  const fill = new DirectionalLight(0xbecc30, 0.25)
  fill.position.set(-4, 6, 8)
  scene.add(key, rim, fill, new AmbientLight(0x9fb4ff, 0.12))

  const geometry = pelletGeometry()
  const material = lowPower
    ? new MeshStandardMaterial({ roughness: 0.36, metalness: 0 })
    : new MeshPhysicalMaterial({
        roughness: 0.34,
        metalness: 0,
        clearcoat: 0.65,
        clearcoatRoughness: 0.22,
        sheen: 0.2,
        sheenRoughness: 0.7,
        sheenColor: new Color('#9fb4ff'),
      })
  const mesh = new InstancedMesh(geometry, material, maxCount)
  mesh.instanceMatrix.setUsage(DynamicDrawUsage)
  mesh.frustumCulled = false
  scene.add(mesh)

  // Struct-of-arrays state for every pellet.
  const rand = mulberry32(20170101)
  const pos = new Float32Array(maxCount * 3)
  const vel = new Float32Array(maxCount * 3)
  const rot = new Float32Array(maxCount * 3)
  const spin = new Float32Array(maxCount * 3)
  const scl = new Float32Array(maxCount * 3)
  const phase = new Float32Array(maxCount)
  const pickU = new Float32Array(maxCount)
  const colorNow = new Float32Array(maxCount * 3)
  const colorTarget = new Float32Array(maxCount * 3)
  const swatches = Object.fromEntries(Object.entries(SWATCH).map(([k, hex]) => [k, new Color(hex)]))

  const spawn = (i, anywhere) => {
    const j = i * 3
    pos[j] = (rand() * 2 - 1) * BOUNDS.x
    pos[j + 1] = anywhere ? (rand() * 2 - 1) * BOUNDS.y : -BOUNDS.y - rand() * 2
    pos[j + 2] = BOUNDS.zFar + rand() * (BOUNDS.zNear - BOUNDS.zFar)
    vel[j] = (rand() - 0.5) * 0.18
    vel[j + 1] = 0.12 + rand() * 0.32
    vel[j + 2] = (rand() - 0.5) * 0.08
  }

  for (let i = 0; i < maxCount; i++) {
    const j = i * 3
    spawn(i, true)
    rot[j] = rand() * Math.PI * 2
    rot[j + 1] = rand() * Math.PI * 2
    rot[j + 2] = rand() * Math.PI * 2
    spin[j] = (rand() - 0.5) * 0.6
    spin[j + 1] = (rand() - 0.5) * 0.6
    spin[j + 2] = (rand() - 0.5) * 0.4
    const radius = 0.5 + rand() * 0.34
    scl[j] = radius
    scl[j + 1] = radius * (0.75 + rand() * 0.6)
    scl[j + 2] = radius * (0.9 + rand() * 0.2)
    phase[i] = rand() * Math.PI * 2
    pickU[i] = rand()
  }

  let colorsSettled = false
  const assignTargets = (paletteKey, immediate) => {
    const palette = PALETTES[paletteKey] ?? PALETTES.default
    for (let i = 0; i < maxCount; i++) {
      const c = swatches[pickSwatch(palette, pickU[i])]
      const j = i * 3
      colorTarget[j] = c.r
      colorTarget[j + 1] = c.g
      colorTarget[j + 2] = c.b
      if (immediate) {
        colorNow[j] = c.r
        colorNow[j + 1] = c.g
        colorNow[j + 2] = c.b
      }
    }
    colorsSettled = false
  }
  assignTargets('default', true)

  const dummy = new Object3D()
  const tmpColor = new Color()
  const writeColors = (lerp) => {
    let maxDelta = 0
    for (let i = 0; i < maxCount; i++) {
      const j = i * 3
      for (let k = 0; k < 3; k++) {
        const d = colorTarget[j + k] - colorNow[j + k]
        colorNow[j + k] += d * lerp
        maxDelta = Math.max(maxDelta, Math.abs(d))
      }
      tmpColor.setRGB(colorNow[j], colorNow[j + 1], colorNow[j + 2])
      mesh.setColorAt(i, tmpColor)
    }
    mesh.instanceColor.needsUpdate = true
    colorsSettled = maxDelta < 0.002
  }
  writeColors(1)

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  const onPointer = (event) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1
  }
  if (!reducedMotion) window.addEventListener('pointermove', onPointer, { passive: true })

  const resize = () => {
    const w = host.clientWidth || window.innerWidth
    const h = host.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  resize()

  let raf = 0
  let last = performance.now()
  let elapsed = 0
  let pulse = 0
  let frames = 0
  let slowFrames = 0
  let degraded = false
  const baseSpeed = reducedMotion ? 0.12 : 1

  const frame = (now) => {
    raf = requestAnimationFrame(frame)
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    elapsed += dt

    // Adaptive quality: if the first ~2 s run below ~36 fps, shed pellets and resolution.
    if (!degraded && frames < 120) {
      frames += 1
      if (dt > 0.028) slowFrames += 1
      if (frames === 120 && slowFrames > 60) {
        degraded = true
        mesh.count = Math.floor(maxCount * 0.55)
        renderer.setPixelRatio(1)
        resize()
      }
    }

    pulse = Math.max(0, pulse - dt / 2.6)
    const boost = reducedMotion ? 0 : pulse * pulse
    const speed = baseSpeed * (1 + boost * 3.2)
    const scrollLift = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 4) * 1.4

    for (let i = 0; i < mesh.count; i++) {
      const j = i * 3
      const sway = Math.sin(elapsed * 0.35 + phase[i])
      pos[j] += (vel[j] + sway * 0.05) * dt * speed
      pos[j + 1] += vel[j + 1] * dt * speed
      pos[j + 2] += vel[j + 2] * dt * speed
      if (boost > 0) {
        // Gentle vortex on successful submission.
        const x = pos[j]
        const y = pos[j + 1]
        pos[j] += -y * 0.22 * boost * dt
        pos[j + 1] += x * 0.22 * boost * dt
      }
      if (pos[j + 1] > BOUNDS.y + 1.5) spawn(i, false)
      if (pos[j] > BOUNDS.x + 2) pos[j] = -BOUNDS.x - 2
      if (pos[j] < -BOUNDS.x - 2) pos[j] = BOUNDS.x + 2
      if (pos[j + 2] > BOUNDS.zNear) pos[j + 2] = BOUNDS.zFar
      if (pos[j + 2] < BOUNDS.zFar) pos[j + 2] = BOUNDS.zNear

      rot[j] += spin[j] * dt * speed
      rot[j + 1] += spin[j + 1] * dt * speed
      rot[j + 2] += spin[j + 2] * dt * speed

      dummy.position.set(pos[j], pos[j + 1] + scrollLift, pos[j + 2])
      dummy.rotation.set(rot[j], rot[j + 1], rot[j + 2])
      dummy.scale.set(scl[j], scl[j + 1], scl[j + 2])
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true

    if (!colorsSettled) writeColors(1 - Math.exp(-dt * 2.4))

    pointer.x += (pointer.tx - pointer.x) * Math.min(dt * 2, 1)
    pointer.y += (pointer.ty - pointer.y) * Math.min(dt * 2, 1)
    camera.position.x = pointer.x * 0.9
    camera.position.y = -pointer.y * 0.55
    camera.lookAt(0, 0, -4)

    renderer.render(scene, camera)
  }

  const start = () => {
    if (!raf) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }
  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
  }
  const onVisibility = () => (document.hidden ? stop() : start())
  document.addEventListener('visibilitychange', onVisibility)

  let onContextLost = () => {}
  let disposed = false
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault()
    stop()
    // dispose() forces a context loss on purpose; only report real GPU losses.
    if (!disposed) onContextLost()
  })

  start()

  return {
    setEmphasis(familyId) {
      assignTargets(familyId && PALETTES[familyId] ? familyId : 'default', false)
    },
    pulse() {
      pulse = 1
    },
    onContextLost(handler) {
      onContextLost = handler
    },
    dispose() {
      disposed = true
      stop()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointer)
      geometry.dispose()
      material.dispose()
      envTexture.dispose()
      pmrem.dispose()
      mesh.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
}
