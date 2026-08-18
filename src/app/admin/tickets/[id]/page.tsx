import TicketDetail from "@/component/admin/Tickets/TicketDetail";

const AdminTicketDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  return (
    <div>
      <TicketDetail id={id} />
    </div>
  );
};

export default AdminTicketDetailPage;
