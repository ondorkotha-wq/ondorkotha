"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import useAxiosSecure from "../Axios/useAxiosSecure";
import { TicketMessage } from "@/types/ticket.types";

interface ReplyPayload {
  id: number | string;
  body: string;
}

// Customer-facing reply — POST /support/ticket/:id/reply.
const useReplyToTicket = () => {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  return useMutation<TicketMessage, AxiosError, ReplyPayload>({
    mutationFn: async ({ id, body }) => {
      const res = await axiosSecure.post<TicketMessage>(
        `/support/ticket/${id}/reply`,
        { body },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-ticket-detail"] });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });
};

export default useReplyToTicket;
