import TicketThread from "@/component/Dashboard/Sections/TicketThread";

const SupportTicketsById = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  return (
    <div>
      <TicketThread id={id} />
    </div>
  );
};

export default SupportTicketsById;
