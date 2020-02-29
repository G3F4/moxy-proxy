export default function randomUserDelay(minDelay = 100, delayDelta = 100) {
  return Math.floor(Math.random() * minDelay) + delayDelta;
}
