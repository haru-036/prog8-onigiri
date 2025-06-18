import { Flag } from "lucide-react";

export const PriorityBadge = ({
  priority,
}: {
  priority: "high" | "middle" | "low";
}) => {
  const colors = {
    high: "text-red-700",
    middle: "text-amber-600",
    low: "text-neutral-600",
  };

  return (
    <div
      className={`flex items-center gap-1 text-sm font-semibold ${colors[priority]}`}
    >
      <Flag
        size={16}
        className={
          priority === "high"
            ? "fill-red-700"
            : priority === "middle"
            ? "fill-amber-600"
            : ""
        }
      />
      {priority === "high" ? "高" : priority === "middle" ? "中" : "低"}
    </div>
  );
};
