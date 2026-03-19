import type {
  TrackerSavedView,
  TrackerTaskRecord,
} from "@/lib/tracker/types";

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isTaskOverdue(task: TrackerTaskRecord, now = new Date()) {
  if (!task.dueDate || task.status === "done") {
    return false;
  }

  return startOfDay(new Date(task.dueDate)).getTime() < startOfDay(now).getTime();
}

export function isTaskDueToday(task: TrackerTaskRecord, now = new Date()) {
  if (!task.dueDate || task.status === "done") {
    return false;
  }

  return (
    startOfDay(new Date(task.dueDate)).getTime() === startOfDay(now).getTime()
  );
}

export function isTaskDueThisWeek(task: TrackerTaskRecord, now = new Date()) {
  if (!task.dueDate || task.status === "done") {
    return false;
  }

  const due = startOfDay(new Date(task.dueDate)).getTime();
  const today = startOfDay(now).getTime();
  const sevenDays = today + 7 * 24 * 60 * 60 * 1000;

  return due >= today && due <= sevenDays;
}

export function filterTasksForSavedView(
  tasks: TrackerTaskRecord[],
  view: TrackerSavedView,
  now = new Date(),
) {
  switch (view) {
    case "today":
      return tasks.filter((task) => isTaskDueToday(task, now) || isTaskOverdue(task, now));
    case "this_week":
      return tasks.filter((task) => isTaskDueThisWeek(task, now));
    case "waiting_on":
      return tasks.filter((task) => task.status === "waiting");
    case "overdue":
      return tasks.filter((task) => isTaskOverdue(task, now));
    case "rfis":
      return tasks.filter((task) => task.taskType === "rfi");
    case "submittals":
      return tasks.filter((task) => task.taskType === "submittal");
    case "site_issues":
      return tasks.filter((task) => task.taskType === "site_issue");
    case "punch_list":
      return tasks.filter((task) => task.taskType === "punch_list");
    default:
      return tasks;
  }
}
