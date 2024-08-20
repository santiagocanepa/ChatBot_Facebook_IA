const userAgent = process.env.USERAGENT ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
const viewPort = {
  width: Number(process.env.WIDTH) || 1360,
  height: Number(process.env.HEIGHT) || 760
}

export {
  viewPort,
  userAgent
}