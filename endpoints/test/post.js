export function requestResponse(state, request) {
    return 'data stored!';
}

export function serverUpdate(request) {
    return function (state) {
        Object.assign(state.data, request.body);
    };
}
