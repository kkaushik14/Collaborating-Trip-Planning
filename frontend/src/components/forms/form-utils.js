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

export { getFieldMessage, toInputId }
