function requestResponse(state, request) {
    return 'data stored!';
}

function serverUpdate(request) {
    return function (state) {
        Object.assign(state.data, request.body);
    };
}

module.exports = { requestResponse, serverUpdate };
