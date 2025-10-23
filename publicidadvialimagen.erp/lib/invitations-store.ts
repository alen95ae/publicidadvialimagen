// Almacén compartido de invitaciones en memoria
// En producción, esto debería ser una base de datos real

export interface Invitation {
  id: string;
  email: string;
  rol: string;
  token: string;
  estado: "pendiente" | "usado" | "expirado";
  fechaCreacion: string;
  fechaExpiracion: string;
  fechaUso?: string;
  enlace: string;
}

export const invitations: Invitation[] = [];
