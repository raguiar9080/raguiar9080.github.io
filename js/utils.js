function float32Concat(first, second)
{
  var firstLength = first.length,
  result = new Float32Array(firstLength + second.length);

  result.set(first);
  result.set(second, firstLength);

  return result;
}

function bufferToMs(size, sampleRate) {
  return ((size * 1000) / sampleRate);
}
function msToBuffer(time, sampleRate) {
  return Math.floor((time * sampleRate) / 1000);
}

function secondToMs(timeInSeconds) {
  return Math.round(timeInSeconds * 1000);
}
function msToSecond(timeInMilliseconds) {
  return Math.round(timeInMilliseconds / 1000);
}

export default {
  float32Concat,
  bufferToMs,
  msToBuffer,
  secondToMs,
  msToSecond
}
