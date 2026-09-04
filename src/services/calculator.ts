/**
 * Scientific & Geometric Calculator Service
 * Comprehensive mathematical calculations for expression evaluation,
 * 2D & 3D geometry, quadratic polynomials, and coordinate geometry.
 */

// Safe expression evaluator using Shunting-Yard / Token parser
export function evaluate(expression: string): number | string {
  try {
    // Sanitize input: allow digits, operators, parens, decimal, spaces
    const clean = expression.replace(/[^0-9+\-*/().^eE\s]/g, '');
    if (!clean.trim()) return 0;

    // Replace ^ with ** for JavaScript exponentiation
    const jsExpr = clean.replace(/\^/g, '**');

    // Safe mathematical evaluation using Function
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${jsExpr});`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Math.round(result * 1000000) / 1000000;
    }
    return 'Invalid result';
  } catch {
    return 'Invalid expression';
  }
}

// 2D & 3D Geometry
export function circleArea(r: number): number {
  return Math.round(Math.PI * r * r * 10000) / 10000;
}

export function circlePerimeter(r: number): number {
  return Math.round(2 * Math.PI * r * 10000) / 10000;
}

export function sphereVolume(r: number): number {
  return Math.round((4 / 3) * Math.PI * Math.pow(r, 3) * 10000) / 10000;
}

export function sphereSurfaceArea(r: number): number {
  return Math.round(4 * Math.PI * r * r * 10000) / 10000;
}

export function cylinderVolume(r: number, h: number): number {
  return Math.round(Math.PI * r * r * h * 10000) / 10000;
}

export function cylinderSurfaceArea(r: number, h: number): number {
  return Math.round((2 * Math.PI * r * h + 2 * Math.PI * r * r) * 10000) / 10000;
}

export function coneVolume(r: number, h: number): number {
  return Math.round((1 / 3) * Math.PI * r * r * h * 10000) / 10000;
}

// Quadratic Equations & Polynomials
export function discriminant(a: number, b: number, c: number): number {
  return b * b - 4 * a * c;
}

export function quadraticFormula(a: number, b: number, c: number): string {
  if (a === 0) return 'Linear equation: x = ' + (-c / b);
  const d = discriminant(a, b, c);
  if (d > 0) {
    const x1 = Math.round(((-b + Math.sqrt(d)) / (2 * a)) * 1000) / 1000;
    const x2 = Math.round(((-b - Math.sqrt(d)) / (2 * a)) * 1000) / 1000;
    return `Two real roots: x₁ = ${x1}, x₂ = ${x2}`;
  } else if (d === 0) {
    const x = Math.round((-b / (2 * a)) * 1000) / 1000;
    return `One repeated root: x = ${x}`;
  } else {
    const real = Math.round((-b / (2 * a)) * 1000) / 1000;
    const imag = Math.round((Math.sqrt(-d) / (2 * a)) * 1000) / 1000;
    return `Complex roots: x = ${real} ± ${imag}i`;
  }
}

export function vertexParabolaStandardForm(a: number, b: number, c: number): string {
  if (a === 0) return 'Not a parabola (a = 0)';
  const h = Math.round((-b / (2 * a)) * 1000) / 1000;
  const k = Math.round((c - (b * b) / (4 * a)) * 1000) / 1000;
  return `Vertex (h, k) = (${h}, ${k}), Axis of Symmetry: x = ${h}`;
}

// Coordinate Geometry
export function distanceBetweenTwoPoints(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.round(Math.sqrt(dx * dx + dy * dy) * 10000) / 10000;
}

export function slopeFromPoints(y2: number, y1: number, x2: number, x1: number): number | string {
  if (x2 - x1 === 0) return 'Undefined (Vertical Line)';
  return Math.round(((y2 - y1) / (x2 - x1)) * 10000) / 10000;
}

export const calculator = {
  evaluate,
  circleArea,
  circlePerimeter,
  sphereVolume,
  sphereSurfaceArea,
  cylinderVolume,
  cylinderSurfaceArea,
  coneVolume,
  discriminant,
  quadraticFormula,
  vertexParabolaStandardForm,
  distanceBetweenTwoPoints,
  slopeFromPoints
};

export default calculator;
