import { PRODUCT_BY_ID } from '../data/catalog.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isEmpty(value) {
  if (value === undefined || value === null) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'string') return value.trim() === ''
  return false
}

export function validateStep(stepIndex, state) {
  const errors = {}
  if (stepIndex === 0) {
    if (!state.productIds.length) errors.products = 'Select at least one product.'
  }
  if (stepIndex === 1) {
    for (const productId of state.productIds) {
      for (const field of PRODUCT_BY_ID[productId].specFields) {
        if (field.required && isEmpty(state.specs[productId]?.[field.id])) {
          errors[`${productId}.${field.id}`] = `${field.label} is required.`
        }
      }
    }
    if (!state.application.polymers.length) errors.polymers = 'Select the base polymer.'
    if (!state.application.process) errors.process = 'Select the conversion process.'
  }
  if (stepIndex === 2) {
    if (!state.commercial.annualVolume) errors.annualVolume = 'Select an estimated annual volume.'
    if (!state.commercial.timeline) errors.timeline = 'Select a timeline.'
    if (!state.commercial.country) errors.country = 'Select the delivery country.'
  }
  if (stepIndex === 3) {
    const c = state.contact
    if (isEmpty(c.firstName)) errors.firstName = 'First name is required.'
    if (isEmpty(c.lastName)) errors.lastName = 'Last name is required.'
    if (!EMAIL_RE.test(c.email.trim())) errors.email = 'Enter a valid work email.'
    if (c.phone.replace(/\D/g, '').length < 7) errors.phone = 'Enter a phone number we can reach.'
    if (isEmpty(c.company)) errors.company = 'Company is required.'
    if (!c.consent) errors.consent = 'Please confirm we may contact you about this request.'
  }
  return errors
}

export function firstInvalidStep(state) {
  for (let i = 0; i < 4; i++) {
    if (Object.keys(validateStep(i, state)).length) return i
  }
  return -1
}

const FREE_MAIL = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com']
export function isFreeMailbox(email) {
  const domain = email.split('@')[1]?.toLowerCase().trim()
  return Boolean(domain && FREE_MAIL.includes(domain))
}
