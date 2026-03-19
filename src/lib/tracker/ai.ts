import OpenAI from "openai";

import { trackerModelDefault } from "@/lib/tracker/constants";
import type { TrackerEnv } from "@/lib/tracker/env";
import { aiGenerationSchema } from "@/lib/tracker/schemas";
import {
  answerWorkspaceQuery,
  buildWeeklyReportProposal,
} from "@/lib/tracker/service";
import type {
  TrackerArtifactRecord,
  TrackerProjectDetail,
  TrackerQueryResult,
  TrackerReviewProposal,
  TrackerWorkspaceData,
} from "@/lib/tracker/types";

interface ArtifactGenerationOptions {
  env: TrackerEnv;
  artifact: TrackerArtifactRecord;
  project: TrackerProjectDetail;
  workspace: TrackerWorkspaceData;
  imageDataUrl?: string;
}

function firstSentences(input: string, count = 2) {
  const segments = input
    .split(/(?<=[.!?])\s+|\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.slice(0, count).join(" ");
}

function extractActionLines(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length > 8);
}

function inferPriority(line: string) {
  const lower = line.toLowerCase();
  if (/(urgent|critical|high|ด่วน|เร่ง|ทันที)/.test(lower)) return "high" as const;
  if (/(low|ภายหลัง|ถ้าได้)/.test(lower)) return "low" as const;
  return "medium" as const;
}

function inferTaskType(line: string, artifactKind: TrackerArtifactRecord["kind"]) {
  const lower = line.toLowerCase();
  if (artifactKind === "rfi_log" || lower.includes("rfi")) return "rfi" as const;
  if (artifactKind === "submittal_log" || lower.includes("submittal")) return "submittal" as const;
  if (artifactKind === "site_photo" || artifactKind === "site_markup") return "site_issue" as const;
  if (/(approve|approval|อนุมัติ)/.test(lower)) return "approval" as const;
  if (/(coord|consultant|contractor|ประสาน)/.test(lower)) return "coordination" as const;
  if (/(punch|snag)/.test(lower)) return "punch_list" as const;
  if (/(procure|vendor|supplier|ราคา|วัสดุ)/.test(lower)) return "procurement" as const;
  return artifactKind === "meeting_note" ? "meeting_followup" : "design";
}

function inferStatus(line: string, artifactKind: TrackerArtifactRecord["kind"]) {
  const lower = line.toLowerCase();
  if (/(wait|waiting|รอ)/.test(lower)) return "waiting" as const;
  if (/(block|blocked|ติดปัญหา)/.test(lower)) return "blocked" as const;
  if (artifactKind === "rfi_log" || artifactKind === "submittal_log") return "waiting" as const;
  return "todo" as const;
}

function buildHeuristicArtifactGeneration({
  artifact,
  project,
}: ArtifactGenerationOptions) {
  const proposals: TrackerReviewProposal[] = [];
  const sourceText = artifact.sourceText.trim();
  const summaryText =
    firstSentences(sourceText, 3) ||
    artifact.extractedSummary ||
    `${artifact.title} captured for ${project.name}.`;

  proposals.push({
    version: "v1",
    action: "artifact.summary",
    projectId: project.id,
    sourceArtifactId: artifact.id,
    confidence: 0.72,
    reasoningSummary: "Generated from submitted artifact content.",
    entity: {
      artifactId: artifact.id,
      kind: artifact.kind,
      title: artifact.title,
      extractedSummary: summaryText,
      sourceText: artifact.sourceText,
      metadataJson: artifact.metadataJson,
    },
  });

  const lines = extractActionLines(sourceText);
  const uniqueTitles = new Set(project.tasks.map((task) => task.title.toLowerCase()));

  if (artifact.kind === "site_photo" || artifact.kind === "site_markup") {
    proposals.push({
      version: "v1",
      action: "task.create",
      projectId: project.id,
      sourceArtifactId: artifact.id,
      confidence: 0.63,
      reasoningSummary: "Site media usually requires an issue review task before status changes.",
      entity: {
        phase: project.phase,
        taskType: "site_issue",
        title: `Review site issue from ${artifact.title}`,
        description: summaryText,
        status: "todo",
        priority: "high",
        assignee: "BNJ Studio",
        dueDate: null,
        location: "",
        revision: artifact.revision,
        sourceType: artifact.kind,
        sourceRef: artifact.title,
        sourceArtifactId: artifact.id,
        nextAction: "Verify issue on site and assign follow-up action.",
        blocker: "",
        humanVerified: false,
      },
    });
  }

  for (const line of lines.slice(0, 5)) {
    if (uniqueTitles.has(line.toLowerCase())) {
      continue;
    }

    if (/(approve|approved|decision|ตกลง|สรุป)/i.test(line) && artifact.kind === "meeting_note") {
      proposals.push({
        version: "v1",
        action: "decision.create",
        projectId: project.id,
        sourceArtifactId: artifact.id,
        confidence: 0.61,
        reasoningSummary: "Detected a likely decision statement in the meeting note.",
        entity: {
          title: line.slice(0, 72),
          decisionText: line,
          decidedBy: "Meeting attendees",
          decidedAt: new Date().toISOString(),
          sourceArtifactId: artifact.id,
        },
      });
      continue;
    }

    proposals.push({
      version: "v1",
      action: "task.create",
      projectId: project.id,
      sourceArtifactId: artifact.id,
      confidence: 0.66,
      reasoningSummary: "Detected an actionable follow-up item in the submitted artifact.",
      entity: {
        phase: project.phase,
        taskType: inferTaskType(line, artifact.kind),
        title: line,
        description: artifact.extractedSummary || summaryText,
        status: inferStatus(line, artifact.kind),
        priority: inferPriority(line),
        assignee: "BNJ Studio",
        dueDate: null,
        location: "",
        revision: artifact.revision,
        sourceType: artifact.kind,
        sourceRef: artifact.title,
        sourceArtifactId: artifact.id,
        nextAction: "",
        blocker: "",
        humanVerified: false,
      },
    });
  }

  return {
    artifactSummary: summaryText,
    proposals,
  };
}

async function generateWithOpenAI({
  env,
  artifact,
  project,
  workspace,
  imageDataUrl,
}: ArtifactGenerationOptions) {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const projectContext = {
    project: {
      id: project.id,
      name: project.name,
      code: project.code,
      phase: project.phase,
      nextMilestone: project.nextMilestone,
    },
    existingTasks: project.tasks.slice(0, 12).map((task) => ({
      title: task.title,
      status: task.status,
      taskType: task.taskType,
      dueDate: task.dueDate,
    })),
    trackerProjects: workspace.projects.length,
  };

  const systemPrompt = [
    "You normalize architecture-project tracker proposals.",
    "Return strict JSON only.",
    "Do not mutate real data directly.",
    "Allowed actions: task.create, task.update, decision.create, artifact.summary, report.weekly.",
    "All outputs must use version = 'v1'.",
    "Task entity must align to the tracker schema.",
  ].join(" ");

  const userText = JSON.stringify(
    {
      artifact: {
        id: artifact.id,
        kind: artifact.kind,
        title: artifact.title,
        revision: artifact.revision,
        sourceText: artifact.sourceText,
      },
      context: projectContext,
    },
    null,
    2,
  );

  const response = await client.responses.create({
    model: env.OPENAI_MODEL || trackerModelDefault,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      },
      {
        role: "user",
        content: imageDataUrl
          ? [
              { type: "input_text", text: userText },
              { type: "input_image", image_url: imageDataUrl },
            ]
          : [{ type: "input_text", text: userText }],
      },
    ],
  } as never);

  const outputText =
    "output_text" in response && typeof response.output_text === "string"
      ? response.output_text
      : "";

  const jsonStart = outputText.indexOf("{");
  const jsonEnd = outputText.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    return null;
  }

  const raw = outputText.slice(jsonStart, jsonEnd + 1);
  const parsed = aiGenerationSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export async function generateArtifactReviewProposals(
  options: ArtifactGenerationOptions,
) {
  try {
    const openAiResult = await generateWithOpenAI(options);
    if (openAiResult) {
      return {
        provider: "openai" as const,
        proposals: openAiResult.proposals.map((proposal) => ({
          ...proposal,
          version: "v1" as const,
          projectId: options.project.id,
          sourceArtifactId: options.artifact.id,
        })),
      };
    }
  } catch {
    // Fall through to heuristic generation when OpenAI is unavailable or parsing fails.
  }

  const heuristic = buildHeuristicArtifactGeneration(options);
  return {
    provider: "heuristic" as const,
    proposals: heuristic.proposals,
  };
}

export async function answerTrackerQueryWithAi(
  env: TrackerEnv,
  workspace: TrackerWorkspaceData,
  question: string,
  projectId?: string,
): Promise<TrackerQueryResult> {
  if (!env.OPENAI_API_KEY) {
    return answerWorkspaceQuery(env, question, projectId);
  }

  try {
    const projects = projectId
      ? workspace.projects.filter((project) => project.id === projectId)
      : workspace.projects.slice(0, 5);
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const response = await client.responses.create({
      model: env.OPENAI_MODEL || trackerModelDefault,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Answer questions using only approved tracker data. Keep the answer concise.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(
                {
                  question,
                  projects: projects.map((project) => ({
                    id: project.id,
                    name: project.name,
                    tasks: project.tasks.slice(0, 20),
                    decisions: project.decisions.slice(0, 10),
                    artifacts: project.artifacts.slice(0, 10).map((artifact) => ({
                      id: artifact.id,
                      kind: artifact.kind,
                      title: artifact.title,
                      extractedSummary: artifact.extractedSummary,
                    })),
                  })),
                },
                null,
                2,
              ),
            },
          ],
        },
      ],
    } as never);

    const answer =
      "output_text" in response && typeof response.output_text === "string"
        ? response.output_text.trim()
        : "";

    if (answer) {
      return {
        answer,
        snippets: [],
      };
    }
  } catch {
    // Fall back to deterministic query response when OpenAI is unavailable.
  }

  return answerWorkspaceQuery(env, question, projectId);
}

export function buildWeeklyReportReview(
  workspace: TrackerWorkspaceData,
  projectId: string,
) {
  const project = workspace.projects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  return buildWeeklyReportProposal(project);
}
