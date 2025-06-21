import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

type Member = { id: number; user_name: string; picture: string };

export const useGroupMembers = (groupId?: number) => {
  return useQuery<Member[]>({
    queryKey: ["members", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const res = await api.get(`/groups/${groupId}/members`);
      return res.data;
    },
    enabled: !!groupId, // groupId があるときだけ発火
    retry: 1,
  });
};
