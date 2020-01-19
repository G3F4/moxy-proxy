export function requestResponse(state, request) {
    return 'decreased!';
}

export function serverUpdate(request) {
    return function (state) {
        state.requestCount = state.requestCount - 1;
    };
}
