export function requestResponse(state, request) {
    return 'data stored!';
}

export function serverUpdate(request) {
    return function (state) {
        state.data = { ...state.data, ...request.body };
    };
}
