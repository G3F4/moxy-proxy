export function requestResponse(state, request) {
    return state.requestCount * 5;
}

export function serverUpdate(request) {
    return function (state) {
    };
}
