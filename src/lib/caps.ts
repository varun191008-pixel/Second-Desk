import { lerp } from './stats';

export interface Caps {
  maxSingleName: number;
  sizeCap: number;
  bias: number;
}

export function computeCaps(eligible: boolean, risk10: number): Caps {
  if (eligible) {
    const riskNorm = risk10 / 10;
    const maxSingleName = lerp(0.22, 0.35, riskNorm);
    const sizeCap = lerp(0.03, 0.08, riskNorm);
    const bias = lerp(-0.22, 0.18, riskNorm);
    return {
      maxSingleName,
      sizeCap,
      bias,
    };
  } else {
    return {
      maxSingleName: 0.25,
      sizeCap: 0.04,
      bias: 0,
    };
  }
}
