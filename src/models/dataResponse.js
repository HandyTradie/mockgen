
class DataResponse {
  genericErrorMessage = 'Something went wrong. Please try again'

  setResponse( isError, message, data ) {
    return {
      error: isError,
      message,
      data,
    }
  }
}

export default DataResponse