import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

// GET - Obtener un contacto por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const record = await airtable("Contactos").find(id)

    const contact = {
      id: record.id,
      displayName: record.fields['Nombre'] || record.fields['Nombre Comercial'] || record.fields['Nombre Contacto'] || String(record.fields['ID'] || ''),
      legalName: record.fields['Empresa'] || record.fields['Nombre Legal'] || '',
      company: record.fields['Empresa'] || '',
      kind: record.fields['Tipo de Contacto'] === 'Individual' ? 'INDIVIDUAL' : 'COMPANY',
      email: record.fields['Email'] || record.fields['Correo'] || '',
      phone: record.fields['Teléfono'] || record.fields['Telefono'] || '',
      taxId: record.fields['NIT'] || record.fields['CIF'] || '',
      address: record.fields['Dirección'] || record.fields['Direccion'] || '',
      city: record.fields['Ciudad'] || '',
      postalCode: record.fields['Código Postal'] || '',
      country: record.fields['País'] || 'Bolivia',
      relation: record.fields['Relación'] || 'Cliente',
      status: 'activo',
      notes: record.fields['Notas'] || '',
      createdAt: record.createdTime,
      updatedAt: record.createdTime,
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error("Error fetching contact:", error)
    return NextResponse.json(
      { error: "No se pudo obtener el contacto" },
      { status: 404 }
    )
  }
}

// PUT - Actualizar un contacto
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: any = {}

    // Mapear todos los campos posibles
    if (body.displayName) updateData['Nombre'] = body.displayName
    if (body.legalName) updateData['Empresa'] = body.legalName
    if (body.company) updateData['Empresa'] = body.company
    if (body.kind) updateData['Tipo de Contacto'] = body.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
    if (body.email) updateData['Email'] = body.email
    if (body.phone) updateData['Teléfono'] = body.phone
    if (body.taxId) updateData['NIT'] = body.taxId
    if (body.address) updateData['Dirección'] = body.address
    if (body.city) updateData['Ciudad'] = body.city
    if (body.postalCode) updateData['Código Postal'] = body.postalCode
    if (body.country) updateData['País'] = body.country
    if (body.relation) updateData['Relación'] = body.relation
    if (body.notes) updateData['Notas'] = body.notes
    if (body.website) updateData['Sitio Web'] = body.website

    // Actualizar el registro en Airtable
    const record = await airtable("Contactos").update(id, updateData)

    const updated = {
      id: record.id,
      displayName: record.fields['Nombre'] || String(record.fields['ID'] || ''),
      legalName: record.fields['Empresa'] || '',
      company: record.fields['Empresa'] || '',
      kind: record.fields['Tipo de Contacto'] === 'Individual' ? 'INDIVIDUAL' : 'COMPANY',
      email: record.fields['Email'] || '',
      phone: record.fields['Teléfono'] || '',
      taxId: record.fields['NIT'] || '',
      address: record.fields['Dirección'] || '',
      city: record.fields['Ciudad'] || '',
      postalCode: record.fields['Código Postal'] || '',
      country: record.fields['País'] || 'Bolivia',
      relation: record.fields['Relación'] || 'Cliente',
      website: record.fields['Sitio Web'] || '',
      status: 'activo',
      notes: record.fields['Notas'] || '',
      createdAt: record.createdTime,
      updatedAt: record.createdTime,
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating contact:", error)
    return NextResponse.json(
      { error: "No se pudo actualizar el contacto" },
      { status: 500 }
    )
  }
}

// PATCH - Actualización parcial de un contacto
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: any = {}

    // Mapear solo los campos que vienen en el body
    if (body.displayName !== undefined) updateData['Nombre'] = body.displayName
    if (body.legalName !== undefined) updateData['Empresa'] = body.legalName
    if (body.company !== undefined) updateData['Empresa'] = body.company
    if (body.kind !== undefined) updateData['Tipo de Contacto'] = body.kind === 'INDIVIDUAL' ? 'Individual' : 'Compañía'
    if (body.email !== undefined) updateData['Email'] = body.email
    if (body.phone !== undefined) updateData['Teléfono'] = body.phone
    if (body.taxId !== undefined) updateData['NIT'] = body.taxId
    if (body.address !== undefined) updateData['Dirección'] = body.address
    if (body.city !== undefined) updateData['Ciudad'] = body.city
    if (body.postalCode !== undefined) updateData['Código Postal'] = body.postalCode
    if (body.country !== undefined) updateData['País'] = body.country
    if (body.relation !== undefined) updateData['Relación'] = body.relation
    if (body.notes !== undefined) updateData['Notas'] = body.notes
    if (body.website !== undefined) updateData['Sitio Web'] = body.website

    // Actualizar el registro en Airtable
    const record = await airtable("Contactos").update(id, updateData)

    return NextResponse.json({ success: true, id: record.id })
  } catch (error: any) {
    console.error("Error updating contact:", error)
    return NextResponse.json(
      { error: "No se pudo actualizar el contacto", details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un contacto
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await airtable("Contactos").destroy(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return NextResponse.json(
      { error: "No se pudo eliminar el contacto" },
      { status: 500 }
    )
  }
}
