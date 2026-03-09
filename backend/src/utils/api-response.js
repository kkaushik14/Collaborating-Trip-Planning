class ApiResponse {
  constructor(statusCode, data = null, message = 'Success', meta = null) {
    this.success = statusCode < 400
    this.statusCode = statusCode
    this.message = message
    this.data = data

    if (meta && Object.keys(meta).length > 0) {
      this.meta = meta
    }
  }
}

export { ApiResponse }
