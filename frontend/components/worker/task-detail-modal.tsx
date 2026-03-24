import { TaskOccurrenceDetailModal as BaseTaskOccurrenceDetailModal } from '@/app/[locale]/(owner)/_components/modals/task-detail-modal';

type TaskStatus = 'todo' | 'doing' | 'completed' | 'skipped';

interface MaterialItem {
  material_id?: string;
  materialId?: string;
  material_name?: string;
  materialName?: string;
  quantity: number;
  unit: string;
}

type TaskOccurrence = {
  id: string;
  title: string;
  status: TaskStatus;
  scheduledDate: string;
  scheduledTime: string;
  description?: string;
  groups: { id: string; name: string }[];
  workers: { name: string; initial: string }[];
  materials?: MaterialItem[];
  report_id?: string;
  completedBy?: string;
  completedAt?: string;
  skipNote?: string;
};

interface CompleteTaskPayload {
  notes?: string;
  report: {
    title: string;
    description: string;
    type: string;
    severity: string;
    group_id?: string;
  };
  materials_used?: Array<{ material_id: string; quantity: number }>;
}

interface SkipTaskPayload {
  reason?: string;
}

interface WorkerTaskOccurrenceDetailModalProps {
  open: boolean;
  onClose: () => void;
  task?: TaskOccurrence;
  isLoading?: boolean;
  isCompleting?: boolean;
  isSkipping?: boolean;
  canComplete?: boolean;
  canSkip?: boolean;
  onComplete?: (payload: CompleteTaskPayload) => Promise<boolean> | boolean;
  onSkip?: (payload: SkipTaskPayload) => Promise<boolean> | boolean;
}

export function TaskOccurrenceDetailModal(
  props: Readonly<WorkerTaskOccurrenceDetailModalProps>,
) {
  // We use `as any` because Base component might have slightly broader/stricter types 
  // than our local subset interface, but at runtime it handles the shapes correctly.
  return <BaseTaskOccurrenceDetailModal {...(props as any)} />;
}
