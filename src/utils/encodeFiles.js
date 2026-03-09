/**
 * Converts a File to a base64-encoded string (without the data URL prefix).
 * Files are never written to localStorage/sessionStorage/IndexedDB.
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      // Strip "data:<mime>;base64," prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Converts an array of File objects to an array of base64 strings.
 */
export async function fileListToBase64Array(files) {
  return Promise.all(Array.from(files).map(fileToBase64))
}
