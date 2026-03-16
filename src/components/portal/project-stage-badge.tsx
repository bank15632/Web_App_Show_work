import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStageLabel, type ProjectStage } from "@/lib/portal-data";

const stageClassMap: Record<ProjectStage, string> = {
  concept: "bg-secondary text-secondary-foreground",
  revision: "bg-primary/10 text-primary",
  construction: "bg-accent/20 text-foreground",
  archived: "bg-muted text-muted-foreground",
};

export function ProjectStageBadge({
  stage,
  className,
}: {
  stage: ProjectStage;
  className?: string;
}) {
  return (
    <Badge className={cn("px-3 py-1", stageClassMap[stage], className)}>
      {getStageLabel(stage)}
    </Badge>
  );
}
