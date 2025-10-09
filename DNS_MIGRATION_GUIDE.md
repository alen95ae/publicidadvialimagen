# 🌐 Guía de Migración DNS - publicidadvialimagen.com a Vercel

**Fecha del análisis:** 9 de Octubre, 2025  
**Estado actual:** ❌ Dominio apuntando a Wix  
**Objetivo:** Migrar a Vercel

---

## 📊 Estado Actual

### Dominio raíz: `publicidadvialimagen.com`
- **Registro A:** 216.198.79.1 ❌ (Wix)
- **Name Servers:** ns10.wixdns.net, ns11.wixdns.net ❌ (Wix)

### Subdominio: `www.publicidadvialimagen.com`
- **CNAME:** cdn1.wixdns.net ❌ (Wix)

### Email (Google Workspace)
- **MX Records:** ✅ Configurados correctamente (NO tocar)

---

## ✅ Configuración Objetivo para Vercel

### Opción Recomendada: Cambiar Nameservers

#### Paso 1: Agregar dominio en Vercel
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Domains
3. Agrega: `publicidadvialimagen.com`
4. Vercel te dará nameservers como:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

#### Paso 2: Cambiar nameservers en Wix
1. Inicia sesión en [Wix.com](https://www.wix.com/my-account/domains)
2. Ve a tu dominio `publicidadvialimagen.com`
3. Busca "Name Servers" o "Servidores de nombres"
4. Cambia a "Custom Name Servers"
5. **Elimina:**
   - ❌ ns10.wixdns.net
   - ❌ ns11.wixdns.net
6. **Agrega los que te dio Vercel:**
   - ✅ ns1.vercel-dns.com
   - ✅ ns2.vercel-dns.com

#### Paso 3: Configurar registros en Vercel
Una vez que los nameservers propaguen (24-48h), en Vercel Dashboard:

1. Ve a tu dominio → DNS Records
2. Agrega estos registros:

**Para el sitio web:**
```
Tipo: A
Nombre: @
Valor: 76.76.21.21
TTL: 3600
```

```
Tipo: CNAME
Nombre: www
Valor: cname.vercel-dns.com
TTL: 3600
```

**Para mantener el email (Google):**
```
Tipo: MX | Nombre: @ | Valor: aspmx.l.google.com           | Prioridad: 10
Tipo: MX | Nombre: @ | Valor: alt1.aspmx.l.google.com      | Prioridad: 20
Tipo: MX | Nombre: @ | Valor: alt2.aspmx.l.google.com      | Prioridad: 30
Tipo: MX | Nombre: @ | Valor: alt3.aspmx.l.google.com      | Prioridad: 40
Tipo: MX | Nombre: @ | Valor: alt4.aspmx.l.google.com      | Prioridad: 50
```

**Para mantener SPF y verificación:**
```
Tipo: TXT
Nombre: @
Valor: v=spf1 include:_spf.google.com ~all
```

```
Tipo: TXT
Nombre: @
Valor: google-site-verification=bnNt7iNPkxMPBpgBwVYJ5q2veDltSCbpm2qw-T-l_hI
```

---

## ⚡ Opción Alternativa: Solo cambiar registros A/CNAME (más rápido)

Si prefieres mantener DNS en Wix pero apuntar a Vercel:

### En tu panel DNS de Wix:

**1. Modificar registro A:**
- Busca el registro A actual (216.198.79.1)
- Elimínalo o edítalo
- Nuevo valor: `76.76.21.21`

**2. Modificar CNAME de www:**
- Busca: `www CNAME cdn1.wixdns.net`
- Cambia a: `www CNAME cname.vercel-dns.com`

**3. NO TOQUES:**
- ✅ Registros MX (email)
- ✅ Registros TXT (SPF, verificación)

---

## 🔍 Verificación

### Comandos de terminal para verificar:

```bash
# Verificar dominio raíz
dig publicidadvialimagen.com A +short
# Debe devolver: 76.76.21.21

# Verificar subdominio www
dig www.publicidadvialimagen.com CNAME +short
# Debe devolver: cname.vercel-dns.com
```

### Herramientas online:
- [WhatsmyDNS.net](https://www.whatsmydns.net/#A/publicidadvialimagen.com)
- [DNSChecker.org](https://dnschecker.org/)

### Limpiar caché local:
```bash
# macOS:
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# Windows:
ipconfig /flushdns
```

---

## ⏰ Timeline de Propagación

| Tiempo | Estado |
|--------|--------|
| T + 5 min | Primera propagación |
| T + 30 min | ~50% actualizado |
| T + 1 hora | ~80% actualizado |
| T + 4 horas | ~95% actualizado |
| T + 24 horas | ~99% actualizado |
| T + 48 horas | ✅ 100% garantizado |

---

## 📞 Recursos

- **Vercel Docs:** https://vercel.com/docs/custom-domains
- **Panel Wix:** https://www.wix.com/my-account/domains
- **Soporte Vercel:** https://vercel.com/support

---

## ✅ Checklist Final

- [ ] Proyecto Next.js desplegado en Vercel
- [ ] Variables de entorno configuradas en Vercel
- [ ] Dominio agregado en Vercel Dashboard
- [ ] Nameservers cambiados (Opción A) o registros A/CNAME actualizados (Opción B)
- [ ] Propagación DNS completada (verificar con dig/herramientas)
- [ ] SSL/HTTPS funcionando (Vercel lo genera automáticamente)
- [ ] Email funcionando correctamente
- [ ] Sitio accesible desde publicidadvialimagen.com y www.publicidadvialimagen.com

---

**🎯 Recomendación:** Usa Opción A (Nameservers de Vercel) para control total y setup profesional.

**¡Tu sitio Next.js está listo para ser accesible desde tu dominio personalizado!** 🚀

