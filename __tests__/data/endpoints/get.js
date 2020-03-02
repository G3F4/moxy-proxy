function requestResponse(state, request) {
  return state.test;
}

function serverUpdate(request) {
  return function stateUpdate(state) {
    state.modified = false;
  };
}

module.exports = { requestResponse, serverUpdate };
