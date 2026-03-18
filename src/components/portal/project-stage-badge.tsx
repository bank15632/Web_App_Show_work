import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStageLabel, type ProjectStage } from "@/lib/portal-data";

const stageClassMap: Record<ProjectStage, string> = {
  concept: "bg-secondary text-secondary-foreground border-border",
  revision: "bg-foreground/10 text-foreground border-foreground/20",
  construction: "bg-foreground text-background border-foreground",
  archived: "bg-muted text-muted-foreground border-border",
};

export function ProjectStageBadge({
  stage,
  className,
}: {
  stage: ProjectStage;
  className?: string;
}) {
  return (
    <Badge className={cn("px-2.5 py-0.5 text-xs font-medium", stageClassMap[stage], className)}>
      {getStageLabel(stage)}
    </Badge>
  );
}
