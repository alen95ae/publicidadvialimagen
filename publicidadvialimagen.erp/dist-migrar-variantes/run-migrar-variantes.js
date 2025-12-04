"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
const migrarVariantesProductos_1 = require("./lib/variantes/migrarVariantesProductos");
// Cargar variables de entorno desde .env.local
dotenv_1.default.config({ path: (0, path_1.resolve)(__dirname, ".env.local") });
async function main() {
    try {
        // Verificar que las variables necesarias estén disponibles
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("❌ Faltan variables de entorno necesarias:");
            console.error("   - NEXT_PUBLIC_SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
            console.error("   - SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
            process.exit(1);
        }
        await (0, migrarVariantesProductos_1.migrarVariantesProductos)();
        console.log("✅ Script de migración ejecutado correctamente.");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Error ejecutando migración de variantes:", error);
        process.exit(1);
    }
}
// Ejecutar solo cuando se llama directamente con ts-node / node
// eslint-disable-next-line no-console
main();
