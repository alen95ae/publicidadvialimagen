# Publicidad Vial Imagen

Monorepo con dos aplicaciones Next.js:
- `/publicidadvialimagen.com/` - **Sitio web público** (la app a desplegar en Vercel)
- `/publicidadvialimagen.erp/` - Panel ERP (uso interno)

---

## 🚀 Deploy en Vercel

### Configuración en Vercel Dashboard:

1. **Root Directory**: Dejar vacío o apuntar a `/publicidadvialimagen.com`
2. **Build Command**: `npm run build` (o usa el script `vercel-build`)
3. **Output Directory**: `.next`
4. **Install Command**: `npm install`

El archivo `vercel.json` en la raíz del repo ya está configurado para manejar el subdirectorio automáticamente.

### Variables de Entorno:

Asegúrate de configurar en Vercel las siguientes variables de entorno (copia desde tu `.env.local`):

- `KINDE_*` - Credenciales de autenticación
- `NEXT_PUBLIC_SUPABASE_*` - Configuración de base de datos
- `AIRTABLE_*` - API keys de Airtable
- Cualquier otra variable que esté en tu `.env.local`

⚠️ **Importante**: No commitear archivos `.env.local` al repositorio.

---

## 💻 Desarrollo Local

### Sitio Web Público (publicidadvialimagen.com)

```bash
cd publicidadvialimagen.com
npm install
npm run dev          # Corre en http://localhost:3000
npm run dev:3001     # Corre en http://localhost:3001
```

### Build de Producción

```bash
cd publicidadvialimagen.com
npm run build        # Genera build optimizado
npm start            # Sirve el build en producción
npm start:3001       # Sirve en puerto 3001
```

---

## 📦 Tecnologías

- **Next.js 14.2.16** (App Router)
- **React 18**
- **TypeScript 5**
- **Tailwind CSS 3.4**
- **Kinde Auth** - Autenticación
- **Supabase** - Base de datos
- **Airtable** - CMS/Backend
- **Leaflet** - Mapas interactivos
- **Radix UI** - Componentes accesibles

---

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Modo desarrollo (puerto 3000) |
| `npm run dev:3001` | Modo desarrollo (puerto 3001) |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | Linter de código |
| `npm run vercel-build` | Build para Vercel |

---

## 📁 Estructura del Proyecto

```
publicidadvialimagen.com/
├── app/                    # Rutas de Next.js (App Router)
│   ├── (auth)/            # Rutas de autenticación
│   ├── api/               # API Routes
│   ├── billboards/        # Vallas publicitarias
│   ├── campaigns/         # Campañas
│   ├── checkout/          # Proceso de compra
│   └── ...
├── components/            # Componentes reutilizables
│   └── ui/               # Componentes de UI (shadcn)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilidades y configuración
├── public/                # Assets estáticos
└── styles/                # Estilos globales
```

---

## ✅ Checklist de Deploy

- [x] Next.js en `dependencies` del `package.json`
- [x] Scripts de build configurados
- [x] `vercel.json` creado en la raíz
- [x] `.npmrc` configurado para builds estables
- [x] `engines` especificado (Node >=18.17.0)
- [x] Build local pasando exitosamente
- [ ] Variables de entorno configuradas en Vercel
- [ ] Dominio personalizado configurado (opcional)

---

## 🐛 Troubleshooting

### Error: "No Next.js version detected"
- ✅ Resuelto: `next` ya está en `dependencies` del `package.json`

### Build falla en Vercel
- Verifica que las variables de entorno estén configuradas
- Revisa el Root Directory en la configuración de Vercel
- Asegúrate de que el build local pase con `npm run build`

### Middleware causa errores
- El middleware ya está configurado para solo proteger rutas `/panel/:path*`
- No debería interferir con el build ni con el sitio público

---

## 📝 Notas

- El proyecto usa **App Router** de Next.js 14
- TypeScript y ESLint están configurados para no bloquear builds
- Las imágenes están en modo `unoptimized` para compatibilidad
- El sitio es completamente estático excepto las rutas API y dinámicas

