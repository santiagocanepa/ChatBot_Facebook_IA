function centralTimer (max: number, min: number): number {
    let rand = 0
    for (let i = 0; i < 6; i++) {
      rand += Math.random()
    }
    return Math.floor(rand / 6 * (max - min) + min)
  }
  
  export async function randomTimer (max: number = 12000, min: number = 4000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  
  
  // GAMMA TIMER
  
  function generateGamma (alpha: number, beta: number): number {
    let sum = 0;
    for (let i = 0; i < alpha; i++) {
      sum += -Math.log(Math.random());
    }
    return sum * beta;
  }
  
  function centralGammaTimer (alpha: number, beta: number, max: number, min: number) {
    const delay = generateGamma(alpha, beta);
    return Math.floor((delay / (alpha * beta)) * (max - min) + min);
  }
  
  export async function gammaTimer (alpha: number = 2, beta: number = 2, max: number = 12000, min: number = 4000): Promise<void> {
    const delay = centralGammaTimer(alpha, beta, max, min);
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
  
  
  export function getHumanizedWaitTime(
    min: number = 700,
    max: number = 1700,
    stdDevPercentage: number = 0.9, 
    deviationMultiplier: number = 1.25,
    significantDeviationProbability: number = 0.1 
  ): Promise<void> {
    function getRandomNormal(mean: number, stdDev: number) {
      let u = 0, v = 0;
      while(u === 0) u = Math.random(); 
      while(v === 0) v = Math.random(); 
      return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
  
    function getRandomExponential(rate: number) {
      let u = Math.random();
      return -Math.log(1 - u) / rate;
    }
  
    const mean = (min + max) / 2;
    const range = max - min;
    const stdDev = range * stdDevPercentage;
  
    let result = getRandomNormal(mean, stdDev);
    
    if (Math.random() < significantDeviationProbability) { 
      const maxExponentialDeviation = (max - mean) * deviationMultiplier;
      const exponentialDeviation = getRandomExponential(1 / stdDev) * stdDev;
      result += Math.min(exponentialDeviation, maxExponentialDeviation);
    }
  
    if (result < min) result = min;
    if (result > max) result = max;
  
    return new Promise((resolve) => setTimeout(resolve, Math.floor(result)));
  }
  