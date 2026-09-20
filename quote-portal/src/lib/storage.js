/**
 * Browser storage can be missing or throw (private mode, blocked site data,
 * embedded previews). Every access goes through these guards so the page
 * always renders and submits without it.
 */

function area(kind) {
  try {
    const store = kind === 'session' ? window.sessionStorage : window.localStorage
    const probe = '__pp_probe__'
    store.setItem(probe, '1')
    store.removeItem(probe)
    return store
  } catch {
    return null
  }
}

export function readJSON(key, fallback, kind = 'local') {
  try {
    const raw = area(kind)?.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key, value, kind = 'local') {
  try {
    area(kind)?.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key, kind = 'local') {
  try {
    area(kind)?.removeItem(key)
  } catch {
    /* storage unavailable */
  }
}
