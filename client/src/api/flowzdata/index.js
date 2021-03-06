import api from '../../api'
let model = 'flowzdata'
export default {
  get: (id = null, params = null, headers = null) => {
    if (id === null) {
      return api.request('get', '/' + model, null, params, headers).then(response => {
        return response.data
      })
    } else {
      return api.request('get', '/' + model + '/' + id, null, params, headers)
    }
  },
  // getThis: (id) => {
  //   return api.request('get', '/' + model + '/' + id)
  // },
  post: (data) => {
    return api.request('post', '/' + model, data)
  },
  put: (id, data) => {
    return api.request('put', '/' + model + '/' + id, data)
  },
  patch: (id, data) => {
    return api.request('patch', '/' + model + '/' + id, data)
  },
  delete: (id) => {
    return api.request('delete', '/' + model + '/' + id)
  }
}
