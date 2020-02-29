function requestResponse(state, request) {
  return state;
}

function serverUpdate(request) {
  return function stateUpdate(state) {
    state.modified = true;
  };
}

module.exports = { requestResponse, serverUpdate };
