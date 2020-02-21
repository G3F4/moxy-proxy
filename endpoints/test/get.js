function requestResponse(state, request) {
    return state.requestCount;
}

function serverUpdate(request) {
    return function (state) {
    };
}

module.exports = { requestResponse, serverUpdate };

