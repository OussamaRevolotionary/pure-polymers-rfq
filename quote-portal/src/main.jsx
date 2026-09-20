import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig, MotionGlobalConfig } from 'motion/react'
import App from './App.jsx'
import './index.css'

// ?static=1 renders every UI animation at its end state — for screenshots, visual QA and kiosk demos.
if (new URLSearchParams(window.location.search).has('static')) {
  MotionGlobalConfig.skipAnimations = true
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
