
import { obtenerPrecioVarianteSync } from './lib/variantes/obtenerPrecioVariante';

// Mock variants data
const mockVariantes = [
    {
        combinacion: 'Color:Rojo|Talla:M',
        precio_override: 100,
        precio_variante: JSON.stringify({ totalPrice: 100 }), // Override == Calculator
        precio_calculado: 50
    },
    {
        combinacion: 'Color:Azul|Talla:L',
        precio_override: 120,
        precio_variante: JSON.stringify({ totalPrice: 100 }), // Override != Calculator
        precio_calculado: 50
    },
    {
        combinacion: 'Color:Verde|Talla:S',
        precio_override: null,
        precio_variante: JSON.stringify({ totalPrice: 80 }), // Only Calculator
        precio_calculado: 50
    },
    {
        combinacion: 'Color:Negro|Talla:XL',
        precio_override: null,
        precio_variante: null,
        precio_calculado: 60 // Only Calculated
    },
    {
        combinacion: 'Color:Blanco|Talla:XS',
        precio_override: null,
        precio_variante: null,
        precio_calculado: null // Fallback to Base
    }
];

const precioBase = 10;

console.log('--- Verification Log ---');

// Case 1: Override == Calculator -> Should use Calculator (100)
const price1 = obtenerPrecioVarianteSync(mockVariantes, { Color: 'Rojo', Talla: 'M' }, precioBase);
console.log(`Case 1 (Override == Calculator): Expected 100, Got ${price1} -> ${price1 === 100 ? 'PASS' : 'FAIL'}`);

// Case 2: Override != Calculator -> Should use Override (120)
const price2 = obtenerPrecioVarianteSync(mockVariantes, { Color: 'Azul', Talla: 'L' }, precioBase);
console.log(`Case 2 (Override != Calculator): Expected 120, Got ${price2} -> ${price2 === 120 ? 'PASS' : 'FAIL'}`);

// Case 3: Only Calculator -> Should use Calculator (80)
const price3 = obtenerPrecioVarianteSync(mockVariantes, { Color: 'Verde', Talla: 'S' }, precioBase);
console.log(`Case 3 (Only Calculator): Expected 80, Got ${price3} -> ${price3 === 80 ? 'PASS' : 'FAIL'}`);

// Case 4: Only Calculated -> Should use Calculated (60)
const price4 = obtenerPrecioVarianteSync(mockVariantes, { Color: 'Negro', Talla: 'XL' }, precioBase);
console.log(`Case 4 (Only Calculated): Expected 60, Got ${price4} -> ${price4 === 60 ? 'PASS' : 'FAIL'}`);

// Case 5: No prices -> Should use Base (10)
const price5 = obtenerPrecioVarianteSync(mockVariantes, { Color: 'Blanco', Talla: 'XS' }, precioBase);
console.log(`Case 5 (Fallback Base): Expected 10, Got ${price5} -> ${price5 === 10 ? 'PASS' : 'FAIL'}`);

