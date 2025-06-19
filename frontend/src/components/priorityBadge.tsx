import { Flag } from "lucide-react";

export const PriorityBadge = ({
  priority,
}: {
  priority: "high" | "middle" | "low";
}) => {
  const styles = {
    high: { text: "text-red-700", fill: "fill-red-700 stroke-red-700" },
    middle: { text: "text-amber-600", fill: "fill-amber-600 stroke-amber-600" },
    low: { text: "text-neutral-600", fill: "" },
  };

  return (
    <div
      className={`flex items-center gap-1 text-sm font-semibold ${styles[priority].text}`}
    >
      <Flag size={16} className={styles[priority].fill} />
      {priority === "high" ? "高" : priority === "middle" ? "中" : "低"}
    </div>
  );
};
