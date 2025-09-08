import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@stellarmotion.io' },
    update: {},
    create: {
      email: 'admin@stellarmotion.io',
      name: 'Admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  })

  const comercial1 = await prisma.user.upsert({
    where: { email: 'maria.garcia@stellarmotion.io' },
    update: {},
    create: {
      email: 'maria.garcia@stellarmotion.io',
      name: 'María García',
      password: await bcrypt.hash('password123', 10),
      role: 'MANAGER',
    },
  })

  const comercial2 = await prisma.user.upsert({
    where: { email: 'carlos.lopez@stellarmotion.io' },
    update: {},
    create: {
      email: 'carlos.lopez@stellarmotion.io',
      name: 'Carlos López',
      password: await bcrypt.hash('password123', 10),
      role: 'OPERATOR',
    },
  })

  const comp = await prisma.company.create({
    data: { name: 'StellarMotion Media', website: 'https://stellarmotion.io' },
  })

  // Crear soportes solo si no existen
  const existingSupports = await prisma.support.count()
  if (existingSupports === 0) {
    await prisma.support.createMany({
      data: [
        { 
          code: 'SM-001', 
          title: 'Valla Avenidas', 
          type: 'valla', 
          city: 'Zamora', 
          country: 'ES', 
          priceMonth: 450, 
          available: true, 
          status: 'DISPONIBLE',
          widthM: 4.0,
          heightM: 3.0,
          areaM2: 12.0,
          pricePerM2: 12.0,
          productionCost: 144.0,
          productionCostOverride: false,
          owner: 'Imagen',
          companyId: comp.id, 
          latitude: 41.503, 
          longitude: -5.744 
        },
        { 
          code: 'SM-002', 
          title: 'LED Centro', 
          type: 'pantalla', 
          city: 'Zamora', 
          country: 'ES', 
          priceMonth: 950, 
          available: true, 
          status: 'DISPONIBLE',
          widthM: 6.0,
          heightM: 4.0,
          areaM2: 24.0,
          pricePerM2: 15.0,
          productionCost: 360.0,
          productionCostOverride: false,
          companyId: comp.id, 
          latitude: 41.505, 
          longitude: -5.741 
        },
      ].map((d:any)=>({ ...d })),
    })
  }

  // Crear etiquetas de contacto
  const tags = await Promise.all([
    prisma.contactTag.upsert({
      where: { name: 'VIP' },
      update: {},
      create: { name: 'VIP', color: '#FFD700' }
    }),
    prisma.contactTag.upsert({
      where: { name: 'Nuevo' },
      update: {},
      create: { name: 'Nuevo', color: '#00FF00' }
    }),
    prisma.contactTag.upsert({
      where: { name: 'Potencial' },
      update: {},
      create: { name: 'Potencial', color: '#FF6B6B' }
    }),
    prisma.contactTag.upsert({
      where: { name: 'Activo' },
      update: {},
      create: { name: 'Activo', color: '#4ECDC4' }
    })
  ])

  // Crear contactos de ejemplo
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        kind: 'COMPANY',
        relation: 'CUSTOMER',
        displayName: 'AA Shop S.R.L.',
        legalName: 'AA Shop Sociedad de Responsabilidad Limitada',
        taxId: '12345678',
        phone: '+591 2 123456',
        email: 'contacto@aashop.bo',
        website: 'https://aashop.bo',
        address1: 'Av. 16 de Julio 1234',
        city: 'La Paz',
        country: 'BO',
        salesOwnerId: comercial1.id,
        favorite: true,
        tags: {
          create: [
            { tagId: tags[0].id }, // VIP
            { tagId: tags[3].id }  // Activo
          ]
        }
      }
    }),
    prisma.contact.create({
      data: {
        kind: 'COMPANY',
        relation: 'SUPPLIER',
        displayName: 'Digital Print Solutions',
        legalName: 'Digital Print Solutions Ltda.',
        taxId: '87654321',
        phone: '+591 3 654321',
        email: 'info@digitalprint.bo',
        website: 'https://digitalprint.bo',
        address1: 'Calle Comercio 567',
        city: 'Santa Cruz',
        country: 'BO',
        salesOwnerId: comercial2.id,
        tags: {
          create: [
            { tagId: tags[2].id } // Potencial
          ]
        }
      }
    }),
    prisma.contact.create({
      data: {
        kind: 'INDIVIDUAL',
        relation: 'CUSTOMER',
        displayName: 'Juan Pérez',
        phone: '+591 7 123456',
        email: 'juan.perez@email.com',
        address1: 'Calle Sucre 789',
        city: 'Cochabamba',
        country: 'BO',
        salesOwnerId: comercial1.id,
        tags: {
          create: [
            { tagId: tags[1].id } // Nuevo
          ]
        }
      }
    }),
    prisma.contact.create({
      data: {
        kind: 'COMPANY',
        relation: 'BOTH',
        displayName: 'MediaCorp Bolivia',
        legalName: 'MediaCorp Bolivia S.A.',
        taxId: '11223344',
        phone: '+591 4 112233',
        email: 'ventas@mediacorp.bo',
        website: 'https://mediacorp.bo',
        address1: 'Av. Mariscal Santa Cruz 456',
        city: 'La Paz',
        country: 'BO',
        salesOwnerId: comercial2.id,
        favorite: true,
        tags: {
          create: [
            { tagId: tags[0].id }, // VIP
            { tagId: tags[2].id }  // Potencial
          ]
        }
      }
    }),
    prisma.contact.create({
      data: {
        kind: 'INDIVIDUAL',
        relation: 'CUSTOMER',
        displayName: 'María Rodríguez',
        phone: '+591 6 987654',
        email: 'maria.rodriguez@email.com',
        address1: 'Calle Ballivián 321',
        city: 'Oruro',
        country: 'BO',
        salesOwnerId: comercial1.id
      }
    }),
    prisma.contact.create({
      data: {
        kind: 'COMPANY',
        relation: 'SUPPLIER',
        displayName: 'Tech Supplies Co.',
        legalName: 'Tech Supplies Company',
        taxId: '55667788',
        phone: '+591 2 556677',
        email: 'info@techsupplies.bo',
        website: 'https://techsupplies.bo',
        address1: 'Av. Camacho 789',
        city: 'La Paz',
        country: 'BO',
        salesOwnerId: comercial2.id
      }
    })
  ])

  console.log('Seed completado:', { 
    admin: admin.email, 
    company: comp.name,
    contacts: contacts.length,
    tags: tags.length
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
