-- =====================================================
-- DATOS DE PRUEBA PARA ERP DE VALLAS PUBLICITARIAS
-- Publicidad Vial Imagen - Supabase/PostgreSQL
-- =====================================================

-- Limpiar datos existentes (opcional - descomenta si quieres empezar limpio)
-- TRUNCATE TABLE movimientos_inventario, ordenes_trabajo, facturas, contratos, cotizaciones, inventario, soportes, empleados, duenos_casa, clientes RESTART IDENTITY CASCADE;

-- =====================================================
-- EMPLEADOS
-- =====================================================
INSERT INTO empleados (id, nombre, apellidos, email, telefono, rol, departamento, salario_base, fecha_contratacion, estado, direccion, ciudad, codigo_postal) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'María', 'García López', 'maria.garcia@publicidadvialimagen.com', '+34 666 123 456', 'admin', 'Administración', 3500.00, '2023-01-15', 'activo', 'Calle Mayor 123', 'Madrid', '28001'),
('550e8400-e29b-41d4-a716-446655440002', 'Carlos', 'Rodríguez Martín', 'carlos.rodriguez@publicidadvialimagen.com', '+34 666 234 567', 'comercial', 'Ventas', 2800.00, '2023-02-01', 'activo', 'Avenida de la Paz 45', 'Barcelona', '08001'),
('550e8400-e29b-41d4-a716-446655440003', 'Ana', 'Fernández Ruiz', 'ana.fernandez@publicidadvialimagen.com', '+34 666 345 678', 'tecnico', 'Técnico', 3200.00, '2023-01-20', 'activo', 'Plaza España 78', 'Valencia', '46001'),
('550e8400-e29b-41d4-a716-446655440004', 'David', 'Sánchez Pérez', 'david.sanchez@publicidadvialimagen.com', '+34 666 456 789', 'comercial', 'Ventas', 2600.00, '2023-03-10', 'activo', 'Calle Gran Vía 12', 'Sevilla', '41001'),
('550e8400-e29b-41d4-a716-446655440005', 'Laura', 'González Díaz', 'laura.gonzalez@publicidadvialimagen.com', '+34 666 567 890', 'administrativo', 'Administración', 2200.00, '2023-04-05', 'activo', 'Avenida Libertad 34', 'Bilbao', '48001');

-- =====================================================
-- DUEÑOS DE CASA
-- =====================================================
INSERT INTO duenos_casa (id, nombre, contacto, email, telefono, direccion, ciudad, codigo_postal, tipo_propietario, condiciones_renta, porcentaje_comision, renta_fija, estado, notas) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Ayuntamiento de Madrid', 'Departamento de Publicidad', 'publicidad@madrid.es', '+34 91 123 4567', 'Plaza de Cibeles 1', 'Madrid', '28014', 'ayuntamiento', 'Contrato anual renovable', 15.00, 0.00, 'activo', 'Entidad pública - condiciones especiales'),
('660e8400-e29b-41d4-a716-446655440002', 'Inmobiliaria Centro S.L.', 'Juan Pérez', 'juan.perez@inmocentro.es', '+34 91 234 5678', 'Calle Alcalá 100', 'Madrid', '28009', 'empresa', 'Renta mensual fija + comisión', 10.00, 500.00, 'activo', 'Propietario de varios soportes en zona centro'),
('660e8400-e29b-41d4-a716-446655440003', 'María López', 'María López', 'maria.lopez@email.com', '+34 666 789 012', 'Avenida de América 200', 'Madrid', '28028', 'persona', 'Comisión por ingresos', 20.00, 0.00, 'activo', 'Propietaria particular - terreno familiar'),
('660e8400-e29b-41d4-a716-446655440004', 'Ayuntamiento de Barcelona', 'Servicio de Espacios Públicos', 'espacios@barcelona.cat', '+34 93 345 6789', 'Plaça Sant Jaume 1', 'Barcelona', '08002', 'ayuntamiento', 'Concurso público anual', 12.00, 0.00, 'activo', 'Entidad pública - proceso de licitación'),
('660e8400-e29b-41d4-a716-446655440005', 'Grupo Inmobiliario Mediterráneo', 'Carlos Ruiz', 'carlos.ruiz@gim.es', '+34 93 456 7890', 'Passeig de Gràcia 50', 'Barcelona', '08007', 'empresa', 'Contrato a largo plazo', 8.00, 800.00, 'activo', 'Empresa con múltiples propiedades');

-- =====================================================
-- CLIENTES
-- =====================================================
INSERT INTO clientes (id, nombre_comercial, nombre_contacto, email, telefono, cif_nif, direccion, ciudad, codigo_postal, tipo_cliente, estado, notas) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Coca-Cola España', 'Roberto Martínez', 'roberto.martinez@cocacola.es', '+34 91 567 8901', 'A12345678', 'Calle de la Paz 15', 'Madrid', '28045', 'empresa', 'activo', 'Cliente premium - campañas anuales'),
('770e8400-e29b-41d4-a716-446655440002', 'Zara', 'Isabel García', 'isabel.garcia@zara.com', '+34 981 678 9012', 'A23456789', 'Avenida de la Castellana 200', 'Madrid', '28046', 'empresa', 'activo', 'Cliente internacional - campañas estacionales'),
('770e8400-e29b-41d4-a716-446655440003', 'Juan Pérez', 'Juan Pérez', 'juan.perez@email.com', '+34 666 890 123', '12345678A', 'Calle Mayor 25', 'Barcelona', '08001', 'persona', 'activo', 'Cliente particular - campaña local'),
('770e8400-e29b-41d4-a716-446655440004', 'El Corte Inglés', 'Carmen López', 'carmen.lopez@elcorteingles.es', '+34 91 789 0123', 'A34567890', 'Calle Preciados 3', 'Madrid', '28013', 'empresa', 'activo', 'Cliente tradicional - múltiples campañas'),
('770e8400-e29b-41d4-a716-446655440005', 'Restaurante La Paella', 'Antonio Valencia', 'antonio@lapaella.com', '+34 96 890 1234', 'B45678901', 'Calle Colón 45', 'Valencia', '46001', 'empresa', 'activo', 'Restaurante local - publicidad gastronómica'),
('770e8400-e29b-41d4-a716-446655440006', 'María González', 'María González', 'maria.gonzalez@email.com', '+34 666 901 234', '23456789B', 'Avenida de la Constitución 12', 'Sevilla', '41001', 'persona', 'activo', 'Cliente particular - evento familiar');

-- =====================================================
-- SOPORTES
-- =====================================================
INSERT INTO soportes (id, codigo, nombre, tipo, ancho, alto, ubicacion, direccion, ciudad, codigo_postal, provincia, estado, precio_mes, precio_m2, foto_url, dueno_casa_id, empleado_responsable_id, fecha_instalacion, fecha_ultimo_mantenimiento, proximo_mantenimiento, notas) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'VLL-MAD-001', 'Valla Gran Vía Centro', 'valla', 4.00, 3.00, ST_GeomFromText('POINT(-3.703790 40.416775)', 4326), 'Gran Vía 25', 'Madrid', '28013', 'Madrid', 'disponible', 1200.00, 100.00, 'https://example.com/fotos/valla-gran-via.jpg', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '2023-01-15', '2024-01-10', '2024-07-10', 'Ubicación premium en el centro de Madrid'),
('880e8400-e29b-41d4-a716-446655440002', 'LED-MAD-002', 'Pantalla LED Sol', 'pantalla_led', 6.00, 4.00, ST_GeomFromText('POINT(-3.703790 40.416775)', 4326), 'Puerta del Sol 1', 'Madrid', '28013', 'Madrid', 'ocupado', 2500.00, 104.17, 'https://example.com/fotos/led-sol.jpg', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '2023-02-01', '2024-02-15', '2024-08-15', 'Pantalla digital en ubicación icónica'),
('880e8400-e29b-41d4-a716-446655440003', 'MNP-BCN-001', 'Monoposte Diagonal', 'monoposte', 2.50, 4.00, ST_GeomFromText('POINT(2.154007 41.390205)', 4326), 'Avenida Diagonal 500', 'Barcelona', '08029', 'Barcelona', 'disponible', 800.00, 80.00, 'https://example.com/fotos/monoposte-diagonal.jpg', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '2023-03-10', '2024-03-05', '2024-09-05', 'Monoposte en zona comercial'),
('880e8400-e29b-41d4-a716-446655440004', 'VLL-BCN-002', 'Valla Passeig de Gràcia', 'valla', 5.00, 3.50, ST_GeomFromText('POINT(2.154007 41.390205)', 4326), 'Passeig de Gràcia 100', 'Barcelona', '08008', 'Barcelona', 'disponible', 1500.00, 85.71, 'https://example.com/fotos/valla-gracia.jpg', '660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '2023-04-20', '2024-04-15', '2024-10-15', 'Valla en zona de lujo'),
('880e8400-e29b-41d4-a716-446655440005', 'MQS-VAL-001', 'Marquesina Estación Norte', 'marquesina', 3.00, 2.50, ST_GeomFromText('POINT(-0.376288 39.469907)', 4326), 'Estación del Norte', 'Valencia', '46007', 'Valencia', 'mantenimiento', 600.00, 80.00, 'https://example.com/fotos/marquesina-norte.jpg', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '2023-05-05', '2024-05-01', '2024-11-01', 'Marquesina en estación de tren'),
('880e8400-e29b-41d4-a716-446655440006', 'VLL-SEV-001', 'Valla Plaza Nueva', 'valla', 4.50, 3.20, ST_GeomFromText('POINT(-5.984459 37.389092)', 4326), 'Plaza Nueva 1', 'Sevilla', '41001', 'Sevilla', 'disponible', 900.00, 62.50, 'https://example.com/fotos/valla-plaza-nueva.jpg', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '2023-06-15', '2024-06-10', '2024-12-10', 'Valla en plaza histórica');

-- =====================================================
-- INVENTARIO
-- =====================================================
INSERT INTO inventario (id, codigo, nombre, categoria, descripcion, cantidad_actual, cantidad_minima, unidad, precio_unitario, proveedor, ubicacion_almacen, fecha_ultima_entrada, fecha_ultima_salida, estado, notas) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'ADH-001', 'Adhesivo Vinílico Premium', 'adhesivo', 'Adhesivo de alta calidad para exteriores', 50.00, 10.00, 'rollos', 25.50, 'Adhesivos del Norte S.L.', 'Almacén A - Estantería 1', '2024-01-15', '2024-01-20', 'activo', 'Para soportes de larga duración'),
('990e8400-e29b-41d4-a716-446655440002', 'LON-001', 'Lona PVC 440g', 'lona', 'Lona de PVC de 440 gramos para exteriores', 25.00, 5.00, 'm²', 8.75, 'Lonas Mediterráneo', 'Almacén B - Estantería 2', '2024-01-10', '2024-01-18', 'activo', 'Resistente a la intemperie'),
('990e8400-e29b-41d4-a716-446655440003', 'VIN-001', 'Vinilo Autoadhesivo', 'vinilo', 'Vinilo autoadhesivo para impresión digital', 100.00, 20.00, 'm²', 3.25, 'Vinilos Digitales S.A.', 'Almacén A - Estantería 3', '2024-01-12', '2024-01-22', 'activo', 'Para aplicaciones temporales'),
('990e8400-e29b-41d4-a716-446655440004', 'TIN-001', 'Tinta Eco-Solvente', 'tinta', 'Tinta eco-solvente para impresoras de gran formato', 15.00, 3.00, 'litros', 45.00, 'Tintas Profesionales', 'Almacén C - Refrigerado', '2024-01-08', '2024-01-25', 'activo', 'Tinta de alta durabilidad'),
('990e8400-e29b-41d4-a716-446655440005', 'HERR-001', 'Escalera Telescópica', 'herramienta', 'Escalera telescópica de 3.5 metros', 2.00, 1.00, 'unidades', 180.00, 'Herramientas Profesionales', 'Almacén D - Herramientas', '2024-01-05', '2024-01-28', 'activo', 'Para instalaciones en altura'),
('990e8400-e29b-41d4-a716-446655440006', 'ADH-002', 'Adhesivo de Montaje', 'adhesivo', 'Adhesivo especial para montaje rápido', 8.00, 2.00, 'botes', 12.50, 'Adhesivos del Norte S.L.', 'Almacén A - Estantería 1', '2024-01-20', '2024-01-30', 'agotado', 'Stock bajo - pedir más');

-- =====================================================
-- COTIZACIONES
-- =====================================================
INSERT INTO cotizaciones (id, numero_cotizacion, cliente_id, soporte_id, empleado_id, fecha_emision, fecha_validez, precio_estimado, iva_porcentaje, condiciones, observaciones, estado, fecha_respuesta, notas_respuesta) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', 'COT-2024-0001', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '2024-01-15', '2024-02-15', 1200.00, 21.00, 'Campaña de 3 meses, diseño incluido', 'Cliente premium - descuento aplicado', 'aceptada', '2024-01-20', 'Cliente acepta condiciones'),
('aa0e8400-e29b-41d4-a716-446655440002', 'COT-2024-0002', '770e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2024-01-18', '2024-02-18', 2500.00, 21.00, 'Campaña de 6 meses, mantenimiento incluido', 'Ubicación premium - precio especial', 'pendiente', NULL, NULL),
('aa0e8400-e29b-41d4-a716-446655440003', 'COT-2024-0003', '770e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '2024-01-20', '2024-02-20', 800.00, 21.00, 'Campaña de 1 mes, instalación incluida', 'Cliente particular - precio estándar', 'rechazada', '2024-01-25', 'Cliente encontró mejor precio'),
('aa0e8400-e29b-41d4-a716-446655440004', 'COT-2024-0004', '770e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '2024-01-22', '2024-02-22', 1500.00, 21.00, 'Campaña de 4 meses, diseño personalizado', 'Cliente tradicional - condiciones favorables', 'aceptada', '2024-01-28', 'Cliente acepta con modificaciones menores');

-- =====================================================
-- CONTRATOS
-- =====================================================
INSERT INTO contratos (id, numero_contrato, cliente_id, soporte_id, cotizacion_id, empleado_id, fecha_inicio, fecha_fin, precio_mes, iva_porcentaje, condiciones, condiciones_especiales, estado, renovacion_automatica) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 'CTR-2024-0001', '770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '2024-02-01', '2024-05-01', 1200.00, 21.00, 'Campaña de 3 meses, diseño incluido', 'Cliente premium - prioridad en renovación', 'activo', TRUE),
('bb0e8400-e29b-41d4-a716-446655440002', 'CTR-2024-0002', '770e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440004', 'aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '2024-03-01', '2024-07-01', 1500.00, 21.00, 'Campaña de 4 meses, diseño personalizado', 'Cliente tradicional - condiciones estándar', 'activo', FALSE);

-- =====================================================
-- FACTURAS
-- =====================================================
INSERT INTO facturas (id, numero_factura, contrato_id, cliente_id, fecha_emision, fecha_vencimiento, periodo_desde, periodo_hasta, importe_base, iva_porcentaje, estado, metodo_pago, notas) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', 'FAC-2024-0001', 'bb0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '2024-02-01', '2024-02-15', '2024-02-01', '2024-02-29', 1200.00, 21.00, 'pagada', 'transferencia', 'Primera factura del contrato'),
('cc0e8400-e29b-41d4-a716-446655440002', 'FAC-2024-0002', 'bb0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '2024-03-01', '2024-03-15', '2024-03-01', '2024-03-31', 1200.00, 21.00, 'pendiente', NULL, 'Segunda factura del contrato'),
('cc0e8400-e29b-41d4-a716-446655440003', 'FAC-2024-0003', 'bb0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440004', '2024-03-01', '2024-03-15', '2024-03-01', '2024-03-31', 1500.00, 21.00, 'pendiente', NULL, 'Primera factura del contrato');

-- =====================================================
-- ÓRDENES DE TRABAJO
-- =====================================================
INSERT INTO ordenes_trabajo (id, numero_orden, soporte_id, contrato_id, empleado_id, tipo_trabajo, prioridad, fecha_programada, fecha_inicio, fecha_fin, horas_trabajadas, estado, descripcion_trabajo, materiales_utilizados, costo_materiales, costo_mano_obra, observaciones) VALUES
('dd0e8400-e29b-41d4-a716-446655440001', 'OT-2024-0001', '880e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'instalacion', 'alta', '2024-02-01', '2024-02-01 09:00:00', '2024-02-01 15:00:00', 6.00, 'completada', 'Instalación de lona publicitaria para Coca-Cola', 'Lona PVC 440g, Adhesivo Vinílico', 150.00, 180.00, 'Instalación completada sin incidencias'),
('dd0e8400-e29b-41d4-a716-446655440002', 'OT-2024-0002', '880e8400-e29b-41d4-a716-446655440004', 'bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'instalacion', 'media', '2024-03-01', '2024-03-01 10:00:00', '2024-03-01 16:00:00', 6.00, 'completada', 'Instalación de valla para El Corte Inglés', 'Lona PVC 440g, Adhesivo Vinílico', 180.00, 180.00, 'Instalación completada correctamente'),
('dd0e8400-e29b-41d4-a716-446655440003', 'OT-2024-0003', '880e8400-e29b-41d4-a716-446655440005', NULL, '550e8400-e29b-41d4-a716-446655440003', 'mantenimiento', 'baja', '2024-01-30', '2024-01-30 08:00:00', '2024-01-30 12:00:00', 4.00, 'completada', 'Mantenimiento preventivo de marquesina', 'Adhesivo de Montaje, Herramientas', 50.00, 120.00, 'Mantenimiento rutinario completado'),
('dd0e8400-e29b-41d4-a716-446655440004', 'OT-2024-0004', '880e8400-e29b-41d4-a716-446655440002', NULL, '550e8400-e29b-41d4-a716-446655440003', 'impresion', 'alta', '2024-02-15', '2024-02-15 09:00:00', '2024-02-15 11:00:00', 2.00, 'completada', 'Impresión de contenido para pantalla LED', 'Tinta Eco-Solvente', 90.00, 60.00, 'Impresión de alta calidad completada'),
('dd0e8400-e29b-41d4-a716-446655440005', 'OT-2024-0005', '880e8400-e29b-41d4-a716-446655440006', NULL, '550e8400-e29b-41d4-a716-446655440003', 'limpieza', 'media', '2024-02-20', '2024-02-20 10:00:00', '2024-02-20 14:00:00', 4.00, 'en_progreso', 'Limpieza y mantenimiento de valla', 'Productos de limpieza', 30.00, 120.00, 'Limpieza en progreso');

-- =====================================================
-- MOVIMIENTOS DE INVENTARIO
-- =====================================================
INSERT INTO movimientos_inventario (id, inventario_id, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, fecha_movimiento, referencia, motivo, empleado_id, costo_unitario) VALUES
('ee0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 'entrada', 50.00, 0.00, 50.00, '2024-01-15 10:00:00', 'PED-2024-001', 'Compra de stock inicial', '550e8400-e29b-41d4-a716-446655440001', 25.50),
('ee0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', 'entrada', 25.00, 0.00, 25.00, '2024-01-10 11:00:00', 'PED-2024-002', 'Compra de lona PVC', '550e8400-e29b-41d4-a716-446655440001', 8.75),
('ee0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440001', 'salida', 2.00, 50.00, 48.00, '2024-01-20 14:00:00', 'OT-2024-0001', 'Uso en instalación Coca-Cola', '550e8400-e29b-41d4-a716-446655440003', 25.50),
('ee0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440002', 'salida', 12.00, 25.00, 13.00, '2024-01-20 14:30:00', 'OT-2024-0001', 'Lona para instalación Coca-Cola', '550e8400-e29b-41d4-a716-446655440003', 8.75),
('ee0e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440001', 'salida', 2.00, 48.00, 46.00, '2024-03-01 15:00:00', 'OT-2024-0002', 'Uso en instalación El Corte Inglés', '550e8400-e29b-41d4-a716-446655440003', 25.50),
('ee0e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440002', 'salida', 17.50, 13.00, -4.50, '2024-03-01 15:30:00', 'OT-2024-0002', 'Lona para instalación El Corte Inglés', '550e8400-e29b-41d4-a716-446655440003', 8.75),
('ee0e8400-e29b-41d4-a716-446655440007', '990e8400-e29b-41d4-a716-446655440006', 'salida', 1.00, 8.00, 7.00, '2024-01-30 12:00:00', 'OT-2024-0003', 'Uso en mantenimiento marquesina', '550e8400-e29b-41d4-a716-446655440003', 12.50);

-- =====================================================
-- ACTUALIZAR ESTADOS DE SOPORTES SEGÚN CONTRATOS
-- =====================================================
UPDATE soportes SET estado = 'ocupado' WHERE id IN (
    SELECT soporte_id FROM contratos WHERE estado = 'activo'
);

-- =====================================================
-- ACTUALIZAR FECHAS DE PAGO EN FACTURAS
-- =====================================================
UPDATE facturas SET fecha_pago = '2024-02-10', referencia_pago = 'TRF-2024-001' 
WHERE numero_factura = 'FAC-2024-0001';

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Verificar que los datos se insertaron correctamente
SELECT 'Datos de prueba insertados correctamente' as resultado;

-- Mostrar resumen de datos insertados
SELECT 
    'Empleados' as tabla, COUNT(*) as registros FROM empleados
UNION ALL
SELECT 'Dueños de Casa', COUNT(*) FROM duenos_casa
UNION ALL
SELECT 'Clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'Soportes', COUNT(*) FROM soportes
UNION ALL
SELECT 'Inventario', COUNT(*) FROM inventario
UNION ALL
SELECT 'Cotizaciones', COUNT(*) FROM cotizaciones
UNION ALL
SELECT 'Contratos', COUNT(*) FROM contratos
UNION ALL
SELECT 'Facturas', COUNT(*) FROM facturas
UNION ALL
SELECT 'Órdenes de Trabajo', COUNT(*) FROM ordenes_trabajo
UNION ALL
SELECT 'Movimientos Inventario', COUNT(*) FROM movimientos_inventario;

-- =====================================================
-- FIN DE LOS DATOS DE PRUEBA
-- =====================================================
