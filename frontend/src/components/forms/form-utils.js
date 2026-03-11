function getValueAtPath(source, path) {
  if (!source || !path) {
    return undefined
  }

  return String(path)
    .split('.')
    .reduce((value, key) => {
      if (value == null) {
        return undefined
      }

      return value[key]
    }, source)
}

const FORM_DRAFT_STORAGE_PREFIX = 'tripPlanner.formDraft.'

function getFormDraftStorageKey(persistKey) {
  const safeKey = String(persistKey || '').trim()
  return safeKey ? `${FORM_DRAFT_STORAGE_PREFIX}${safeKey}` : ''
}

function readFormDraft(persistKey) {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null
  }

  const key = getFormDraftStorageKey(persistKey)
  if (!key) {
    return null
  }

  const raw = window.sessionStorage.getItem(key)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    window.sessionStorage.removeItem(key)
    return null
  }
}

function writeFormDraft(persistKey, values) {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return
  }

  const key = getFormDraftStorageKey(persistKey)
  if (!key) {
    return
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(values ?? {}))
  } catch {
    // Ignore storage write failures.
  }
}

function clearFormDraft(persistKey) {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return
  }

  const key = getFormDraftStorageKey(persistKey)
  if (!key) {
    return
  }

  window.sessionStorage.removeItem(key)
}

function clearAllFormDrafts() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return
  }

  const keys = []
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index)
    if (key?.startsWith(FORM_DRAFT_STORAGE_PREFIX)) {
      keys.push(key)
    }
  }

  keys.forEach((key) => window.sessionStorage.removeItem(key))
}

function getFieldMessage(errors, name) {
  const fieldError = getValueAtPath(errors, name)

  if (!fieldError) {
    return ''
  }

  if (typeof fieldError.message === 'string') {
    return fieldError.message
  }

  return ''
}

function toInputId(name, prefix = 'field') {
  return `${prefix}-${String(name).replace(/\./g, '-')}`
}

export {
  clearAllFormDrafts,
  clearFormDraft,
  getFieldMessage,
  readFormDraft,
  toInputId,
  writeFormDraft,
}
