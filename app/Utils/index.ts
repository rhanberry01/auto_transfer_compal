const ping = require('ping');

export const CheckConnection = async (host) => {
  const res = await ping.promise.probe(host);
  return res
}

