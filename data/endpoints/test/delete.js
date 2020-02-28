function requestResponse(state, request) {
    return 'decreased!';
}

function serverUpdate(request) {
    return function (state) {
        state.requestCount = state.requestCount - 1;
    };
}

module.exports = { requestResponse, serverUpdate };
