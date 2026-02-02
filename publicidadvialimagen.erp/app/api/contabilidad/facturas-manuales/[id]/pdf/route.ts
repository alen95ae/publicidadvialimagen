export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseServer";
import { requirePermiso } from "@/lib/permisos";
import jsPDF from "jspdf";
import path from "path";
import fs from "fs/promises";

function placeholder(val: unknown): string {
  if (val === null || val === undefined || String(val).trim() === "") return "{{campo}}";
  return String(val).trim();
}

async function cargarLogo(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.jpg");
    const logoBuffer = await fs.readFile(logoPath);
    return `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;
  } catch (error) {
    console.error("Error cargando logo:", error);
    return null;
  }
}

/** Convierte URL de imagen (ej. QR fiscal) a data URL base64 para jsPDF. */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const base64 = buf.toString("base64");
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function formatearNumero(numero: number): string {
  const n = numero.toFixed(2);
  const [entera, decimal] = n.split(".");
  const conSeparador = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conSeparador},${decimal}`;
}

function numeroALetras(numero: number): string {
  if (numero === 0) return "Cero";
  if (numero < 0) return "Menos " + numeroALetras(Math.abs(numero));
  let r = "";
  const millones = Math.floor(numero / 1000000);
  if (millones > 0) {
    r += millones === 1 ? "Un Millón " : numeroALetras(millones) + " Millones ";
    numero %= 1000000;
  }
  const miles = Math.floor(numero / 1000);
  if (miles > 0) {
    r += miles === 1 ? "Mil " : numeroALetras(miles) + " Mil ";
    numero %= 1000;
  }
  const unidades = ["", "Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve"];
  const decenas = ["", "", "Veinte", "Treinta", "Cuarenta", "Cincuenta", "Sesenta", "Setenta", "Ochenta", "Noventa"];
  const esp = ["Diez", "Once", "Doce", "Trece", "Catorce", "Quince", "Dieciséis", "Diecisiete", "Dieciocho", "Diecinueve"];
  const centenas = ["", "Ciento", "Doscientos", "Trescientos", "Cuatrocientos", "Quinientos", "Seiscientos", "Setecientos", "Ochocientos", "Novecientos"];
  if (numero >= 100) {
    const c = Math.floor(numero / 100);
    r += (numero === 100 ? "Cien" : centenas[c]) + " ";
    numero %= 100;
  }
  if (numero >= 10 && numero < 20) {
    r += esp[numero - 10] + " ";
    numero = 0;
  }
  if (numero >= 20) {
    const d = Math.floor(numero / 10);
    r += decenas[d];
    numero %= 10;
    if (numero > 0) r += " y ";
  }
  if (numero > 0) r += unidades[numero] + " ";
  return r.trim();
}

const EMPRESA_ID = 1;

/**
 * PDF fiscal Bolivia. Esquema: facturas_manuales (numero, fecha, lugar_emision, punto_venta,
 * cliente_nombre, cliente_nit, glosa, moneda, subtotal, descuento, importe_base_cf, total,
 * codigo_autorizacion, qr_url) e items_factura_manual (codigo_producto, descripcion, cantidad,
 * unidad_medida, precio_unitario, descuento, importe). Sin datos se muestra {{campo}}.
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const permiso = await requirePermiso("contabilidad", "ver");
    if (permiso instanceof Response) return permiso;

    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "id es requerido" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: factura, error: errF } = await supabase
      .from("facturas_manuales")
      .select("*")
      .eq("id", id)
      .eq("empresa_id", EMPRESA_ID)
      .single();

    if (errF || !factura) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    const { data: items, error: errI } = await supabase
      .from("items_factura_manual")
      .select("orden, codigo_producto, descripcion, cantidad, unidad_medida, precio_unitario, descuento, importe")
      .eq("factura_id", id)
      .order("orden", { ascending: true });

    if (errI) {
      console.error("Error items factura:", errI);
    }
    const detalles = items || [];

    const pdf = new jsPDF("p", "mm", "a4");
    const primaryColor: [number, number, number] = [190, 8, 18];
    const currentYear = new Date().getFullYear();
    const pageWidth = 210;
    let yPosition = 10;

    const logoBase64 = await cargarLogo();
    if (logoBase64) {
      const aspectRatio = 24 / 5.5;
      const maxHeight = 10;
      const logoWidth = Math.min(maxHeight * aspectRatio, 45);
      const logoHeight = logoWidth / aspectRatio;
      pdf.addImage(logoBase64, "JPEG", 15, yPosition, logoWidth, logoHeight);
    }

    // Cabecera: razón social, NIT y dirección (estilo PDF 3)
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Publicidad Vial Imagen S.R.L.", pageWidth - 15, yPosition + 1, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.text("NIT: 164692025", pageWidth - 15, yPosition + 5, { align: "right" });
    pdf.text("C. Nicolás Acosta Esq. Pedro Blanco", pageWidth - 15, yPosition + 9, { align: "right" });
    pdf.text("(Alto San Pedro) N° 1471 - La Paz", pageWidth - 15, yPosition + 13, { align: "right" });

    yPosition = 30;
    const numeroFactura = factura.numero != null && String(factura.numero).trim() !== "" ? String(factura.numero) : placeholder(factura.numero);
    const codigoFactura = numeroFactura;
    const fechaStr = factura.fecha ? new Date(factura.fecha).toLocaleDateString("es-ES") : "{{fecha}}";
    const lugarEmision = factura.lugar_emision != null && String(factura.lugar_emision).trim() !== "" ? String(factura.lugar_emision).trim() : "{{lugar_emision}}";
    const codigoAutorizacion = factura.codigo_autorizacion != null && String(factura.codigo_autorizacion).trim() !== "" ? String(factura.codigo_autorizacion).trim() : null;

    // Centro: "FACTURA" en grande; todo lo demás va debajo
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("FACTURA", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "italic");
    pdf.text("Con Derecho a Crédito Fiscal", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 6;

    // Código de la factura igual que en PDF cotización: recuadro gris, courier bold, centrado
    const nitCi = factura.cliente_nit != null && String(factura.cliente_nit).trim() !== "" ? String(factura.cliente_nit).trim() : "";
    const codigoX = 15;
    const codigoPaddingX = 5;
    const codigoHeight = 8;
    pdf.setFontSize(10);
    pdf.setFont("courier", "bold");
    const codigoWidth = pdf.getTextWidth(codigoFactura);
    const recuadroWidth = codigoWidth + codigoPaddingX * 2;
    const codigoY = yPosition;
    pdf.setFillColor(245, 245, 245);
    pdf.setDrawColor(229, 229, 229);
    pdf.setLineWidth(0.3);
    pdf.setTextColor(31, 41, 55);
    pdf.roundedRect(codigoX, codigoY, recuadroWidth, codigoHeight, 2, 2, "FD");
    pdf.text(codigoFactura, codigoX + recuadroWidth / 2, codigoY + codigoHeight / 2 + 1, { align: "center" });
    pdf.setTextColor(0, 0, 0);
    yPosition += codigoHeight + 6;

    // Lugar y fecha de emisión (izquierda) y NIT/CI (derecha, misma altura). NIT/CI: etiqueta en negrita como Código de cliente
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Lugar y fecha de emisión:", 15, yPosition);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${lugarEmision}, ${fechaStr}`, 55, yPosition);
    pdf.setFont("helvetica", "bold");
    const wValNit = pdf.getTextWidth(nitCi || "");
    const wLabelNit = pdf.getTextWidth("NIT/CI: ");
    pdf.text("NIT/CI: ", pageWidth - 15 - wValNit - wLabelNit, yPosition);
    pdf.setFont("helvetica", "normal");
    pdf.text(nitCi || "", pageWidth - 15, yPosition, { align: "right" });
    yPosition += 6;

    // Cliente / Razón social (izquierda) y Código de cliente (derecha), misma altura; Cliente justo debajo de Lugar y fecha, a la izquierda
    pdf.setFont("helvetica", "bold");
    pdf.text("Cliente / Razón social:", 15, yPosition);
    pdf.setFont("helvetica", "normal");
    pdf.text(placeholder(factura.cliente_nombre), 55, yPosition);
    pdf.setFont("helvetica", "bold");
    const wLabelCodigoCliente = pdf.getTextWidth("Código de cliente:");
    const labXCliente = pageWidth - 15 - wValNit - wLabelCodigoCliente;
    pdf.text("Código de cliente:", labXCliente, yPosition);
    pdf.setFont("helvetica", "normal");
    pdf.text(nitCi, pageWidth - 15, yPosition, { align: "right" });
    yPosition += 6;
    if (codigoAutorizacion) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Cód. autorización:", 15, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(codigoAutorizacion, 55, yPosition);
      yPosition += 6;
    }
    if (factura.glosa) {
      pdf.setFont("helvetica", "bold");
      pdf.text("Glosa:", 15, yPosition);
      pdf.setFont("helvetica", "normal");
      const glosaLines = pdf.splitTextToSize(factura.glosa, pageWidth - 55);
      pdf.text(glosaLines, 45, yPosition);
      yPosition += glosaLines.length * 5 + 2;
    }
    yPosition += 4;

    const tableWidth = pageWidth - 30;
    const colWidths = {
      codigo: 18,
      cantidad: 14,
      unidad: 12,
      descripcion: 82,
      precio: 18,
      descuento: 18,
      importe: 18,
    };

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setFillColor(240, 240, 240);
    pdf.setDrawColor(200, 200, 200);
    const headerH = 8;
    pdf.rect(15, yPosition - 5, tableWidth, headerH, "FD");
    const headerTextY = yPosition - 5 + headerH / 2 + 1.5;
    let xP = 15;
    pdf.text("Código", xP + 2, headerTextY);
    xP += colWidths.codigo;
    pdf.text("Cant.", xP + colWidths.cantidad / 2, headerTextY, { align: "center" });
    xP += colWidths.cantidad;
    pdf.text("Unidad", xP + colWidths.unidad / 2, headerTextY, { align: "center" });
    xP += colWidths.unidad;
    pdf.text("Descripción", xP + 2, headerTextY);
    xP += colWidths.descripcion;
    pdf.text("P. unit.", xP + colWidths.precio / 2, headerTextY, { align: "center" });
    xP += colWidths.precio;
    pdf.text("Descuento", xP + colWidths.descuento / 2, headerTextY, { align: "center" });
    xP += colWidths.descuento;
    pdf.text("Subtotal", xP + colWidths.importe / 2, headerTextY, { align: "center" });
    yPosition += headerH;
    pdf.setFont("helvetica", "normal");

    let totalImporte = 0;
    detalles.forEach((d: any) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      const importeItem = Number(d.importe) || 0;
      totalImporte += importeItem;
      const codigoProducto = d.codigo_producto != null && String(d.codigo_producto).trim() !== "" ? String(d.codigo_producto).trim() : "{{codigo_producto}}";
      const udm = d.unidad_medida != null && String(d.unidad_medida).trim() !== "" ? String(d.unidad_medida).trim() : "-";
      const descuentoItem = Number(d.descuento) || 0;
      const descTexto = d.descripcion != null && String(d.descripcion).trim() !== "" ? String(d.descripcion).trim() : "{{descripcion}}";
      const descLines = pdf.splitTextToSize(descTexto, colWidths.descripcion - 4);
      const rowH = Math.max(6, descLines.length * 5);
      pdf.setDrawColor(200, 200, 200);
      xP = 15;
      pdf.line(xP, yPosition - 5, xP, yPosition - 5 + rowH);
      xP += colWidths.codigo;
      pdf.line(xP, yPosition - 5, xP, yPosition - 5 + rowH);
      xP += colWidths.cantidad;
      pdf.line(xP, yPosition - 5, xP, yPosition - 5 + rowH);
      xP += colWidths.unidad;
      pdf.line(xP, yPosition - 5, xP, yPosition - 5 + rowH);
      xP += colWidths.descripcion;
      pdf.line(xP, yPosition - 5, xP, yPosition - 5 + rowH);
      xP += colWidths.precio;
      pdf.line(xP, yPosition - 5, xP, yPosition - 5 + rowH);
      xP += colWidths.descuento;
      pdf.line(xP, yPosition - 5, xP, yPosition - 5 + rowH);
      xP += colWidths.importe;
      pdf.line(xP, yPosition - 5, xP, yPosition - 5 + rowH);

      xP = 15;
      pdf.text(codigoProducto, xP + 2, yPosition);
      xP += colWidths.codigo;
      pdf.text(formatearNumero(Number(d.cantidad) || 0), xP + colWidths.cantidad / 2, yPosition, { align: "center" });
      xP += colWidths.cantidad;
      pdf.text(udm, xP + colWidths.unidad / 2, yPosition, { align: "center" });
      xP += colWidths.unidad;
      pdf.text(descLines, xP + 2, yPosition);
      xP += colWidths.descripcion;
      pdf.text(formatearNumero(Number(d.precio_unitario) || 0), xP + colWidths.precio / 2, yPosition, { align: "center" });
      xP += colWidths.precio;
      pdf.text(formatearNumero(descuentoItem), xP + colWidths.descuento / 2, yPosition, { align: "center" });
      xP += colWidths.descuento;
      pdf.text(formatearNumero(importeItem), xP + colWidths.importe / 2, yPosition, { align: "center" });
      yPosition += rowH;
    });

    const gapCierre = 3;
    const yCierre = yPosition + gapCierre;
    pdf.setDrawColor(80, 80, 80);
    pdf.setLineWidth(0.6);
    pdf.line(15, yCierre, 15 + tableWidth, yCierre);
    pdf.setLineWidth(0.3);
    yPosition = yCierre + gapCierre;

    const subtotalDoc = Number(factura.subtotal) ?? totalImporte;
    const descuentoDoc = Number(factura.descuento) || 0;
    const baseCreditoFiscal = factura.importe_base_cf != null ? Number(factura.importe_base_cf) : subtotalDoc;
    const totalVal = Number(factura.total) ?? totalImporte;

    yPosition += 4;
    const labX = 15;
    const valX = pageWidth - 15 - 2;
    const lineH = 5;
    const totalH = 8;
    const espacioAntesFranja = 4;
    const yRedBar = yPosition + lineH * 4 + espacioAntesFranja;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("Subtotal:", labX, yPosition);
    pdf.text(formatearNumero(subtotalDoc), valX, yPosition, { align: "right" });
    pdf.text("Bonificaciones y descuentos:", labX, yPosition + lineH);
    pdf.text(formatearNumero(descuentoDoc), valX, yPosition + lineH, { align: "right" });
    pdf.text("Importe base crédito fiscal:", labX, yPosition + lineH * 2);
    pdf.text(formatearNumero(baseCreditoFiscal), valX, yPosition + lineH * 2, { align: "right" });
    pdf.text("Total en bolivianos:", labX, yPosition + lineH * 3);
    pdf.text(formatearNumero(totalVal), valX, yPosition + lineH * 3, { align: "right" });

    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(15, yRedBar - 5, tableWidth, totalH, "FD");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.text("MONTO A PAGAR", 15 + 2, yRedBar);
    pdf.text(formatearNumero(totalVal), pageWidth - 15 - 2, yRedBar, { align: "right" });
    pdf.setTextColor(0, 0, 0);
    yPosition = yRedBar + totalH + 4;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Son:", 15, yPosition);
    pdf.setFont("helvetica", "normal");
    const parteEntera = Math.floor(totalVal);
    const centavos = Math.round((totalVal - parteEntera) * 100);
    const monedaTexto = factura.moneda === "USD" ? "Dólares" : "Bolivianos";
    const sonTexto = `${numeroALetras(parteEntera)} ${centavos.toString().padStart(2, "0")}/100 ${monedaTexto}`;
    const sonLines = pdf.splitTextToSize(sonTexto, pageWidth - 50);
    pdf.text(sonLines, 40, yPosition);
    yPosition += sonLines.length * 5 + 6;

    const textoLegalBold =
      "ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE\nACUERDO A LEY";
    const textoLegalNormal =
      "Ley N° 453: Tienes derecho a un trato equitativo sin discriminación en la oferta de servicios.\n" +
      "Este documento es la Representación Gráfica de un Documento Fiscal Digital emitido en una Modalidad de Facturación en Línea";
    pdf.setFontSize(7);
    const lineasBold = pdf.splitTextToSize(textoLegalBold, pageWidth - 40);
    pdf.setFont("helvetica", "bold");
    lineasBold.forEach((linea: string) => {
      pdf.text(linea, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 4;
    });
    pdf.setFont("helvetica", "normal");
    const lineasNormal = pdf.splitTextToSize(textoLegalNormal, pageWidth - 40);
    lineasNormal.forEach((linea: string) => {
      pdf.text(linea, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 4;
    });
    yPosition += 6;

    if (factura.qr_url != null && String(factura.qr_url).trim() !== "") {
      const qrBase64 = await fetchImageAsBase64(String(factura.qr_url).trim());
      if (qrBase64) {
        yPosition += 4;
        const qrSize = 25;
        try {
          pdf.addImage(qrBase64, "PNG", 15, yPosition, qrSize, qrSize);
        } catch {
          pdf.addImage(qrBase64, "JPEG", 15, yPosition, qrSize, qrSize);
        }
        yPosition += qrSize + 4;
      }
    }

    const totalPages = pdf.getNumberOfPages();
    const pageHeight = 297;
    const footerHeight = 12;
    const footerY = pageHeight - footerHeight;

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, footerY, 210, footerHeight, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      const footerTextY = footerY + footerHeight / 2 + 2;
      pdf.text(`${currentYear} Publicidad Vial Imagen`, 5, footerTextY);
      pdf.text("|", 65, footerTextY);
      pdf.text("contabilidad@publicidadvialimagen.com", 70, footerTextY);
      const sep2X = 70 + pdf.getTextWidth("contabilidad@publicidadvialimagen.com") + 5;
      pdf.text("|", sep2X, footerTextY);
      pdf.text("NIT: 164692025", sep2X + 5, footerTextY);
      const sep3X = sep2X + 5 + pdf.getTextWidth("NIT: 164692025") + 5;
      pdf.text("|", sep3X, footerTextY);
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 15, footerTextY, { align: "right" });
    }

    const codigo = (factura.numero || id).toString().replace(/[/\\?%*:|"<>]/g, "-");
    const nombreArchivo = codigo ? `${codigo}.pdf` : `factura_${id.slice(0, 8)}.pdf`;
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      },
    });
  } catch (error) {
    console.error("Error generating factura PDF:", error);
    return NextResponse.json({ error: "Error al generar el PDF" }, { status: 500 });
  }
}
