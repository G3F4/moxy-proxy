function requestResponse(state, request) {
    return 'patched!';
}

function serverUpdate(request) {
    return function (state) {
        state.requstCount = request.body.requstCount;
    };
}

module.exports = { requestResponse, serverUpdate };
