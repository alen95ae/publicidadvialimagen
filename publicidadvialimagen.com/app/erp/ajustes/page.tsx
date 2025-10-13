import InvitationsManager from "@/components/erp/InvitationsManager";

export default function AjustesERPPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Ajustes del ERP</h1>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Gestión de usuarios (invitaciones)</h2>
        <p className="text-sm text-gray-600">Invita empleados o admins con enlaces únicos y fecha de caducidad.</p>
        <InvitationsManager />
      </section>
    </div>
  );
}
