export function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


export function isUrl(message) {
    const entities = message?.entities
    return !!(entities?.[0] && entities?.[0]?.type === 'url');
}