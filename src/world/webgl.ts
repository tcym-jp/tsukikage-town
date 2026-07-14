export function supportsWebGL(documentObject?: Document): boolean {
  const currentDocument = documentObject ?? (typeof document === 'undefined' ? undefined : document)
  if (currentDocument === undefined) {
    return false
  }

  try {
    const canvas = currentDocument.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}
