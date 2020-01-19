export function requestResponse(state, request) {
    return 'patched!';
}

export function serverUpdate(request) {
    return function (state) {
        state.requstCount = request.body.requstCount;
    };
}
