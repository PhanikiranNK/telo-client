import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckSquare as LucideCheckSquare, Calendar as LucideCalendar } from 'lucide-react-native';
import { Avatar } from './Avatar';
import { Colors, FontSize, FontWeight, Radius } from '../theme';

const CheckSquare = LucideCheckSquare as any;
const Calendar = LucideCalendar as any;

export interface TaskItem {
  id: string;
  title: string;
  desc: string;
  priority: 'High' | 'Medium' | 'Low';
  checklist: string;
  assignee: string;
  dueDate?: string; // Format: YYYY-MM-DD
  column?: 'todo' | 'progress' | 'done';
  completedBy?: string;
}

interface TaskCardProps {
  task: TaskItem;
}

function formatTaskDate(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function isDateOverdue(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

function getChecklistText(checklist: string, isCompleted: boolean, completedBy?: string) {
  if (!isCompleted) return checklist;
  const match = checklist.match(/(\d+)\/(\d+)/);
  const total = match ? match[2] : '1';
  if (completedBy) {
    return `${total}/${total} completed by ${completedBy}`;
  }
  return `${total}/${total} completed`;
}

export function TaskCard({ task }: TaskCardProps) {
  const badgeColor =
    task.priority === 'High' ? { bg: '#FEF2F2', text: '#EF4444' } :
    task.priority === 'Medium' ? { bg: '#FFFBEB', text: '#D97706' } :
    { bg: '#ECFDF5', text: '#10B981' };

  const isOverdue = isDateOverdue(task.dueDate);
  const isCompleted = task.column === 'done';
  const checklistColor = isCompleted ? '#22C55E' : '#64748B';
  const checklistText = getChecklistText(task.checklist || '0/1 pending', isCompleted, task.completedBy);

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={[styles.priorityBadge, { backgroundColor: badgeColor.bg }]}>
          <Text style={[styles.priorityText, { color: badgeColor.text }]}>{task.priority}</Text>
        </View>
        <Avatar name={task.assignee} size={20} />
      </View>
      <Text style={styles.taskCardTitle}>{task.title}</Text>
      <Text style={styles.taskCardDesc}>{task.desc}</Text>
      <View style={styles.taskDivider} />
      
      <View style={styles.taskFooterRow}>
        <View style={[styles.taskChecklistRow, isCompleted && styles.taskChecklistRowCompleted]}>
          <CheckSquare size={12} color={checklistColor} />
          <Text style={[styles.taskChecklist, isCompleted && styles.taskChecklistCompleted]}>
            {checklistText}
          </Text>
        </View>

        {task.dueDate ? (
          <View style={[styles.dueDateBadge, isOverdue && styles.dueDateBadgeOverdue]}>
            <Calendar size={11} color={isOverdue ? '#EF4444' : '#64748B'} />
            <Text style={[styles.dueDateText, isOverdue && styles.dueDateTextOverdue]}>
              {formatTaskDate(task.dueDate)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  taskCardTitle: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  taskCardDesc: {
    fontSize: 12,
    color: '#737373',
    lineHeight: 16,
  },
  taskDivider: {
    height: 0.5,
    backgroundColor: '#EFEFEF',
    marginVertical: 10,
  },
  taskFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskChecklistRowCompleted: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#A7F3D0',
  },
  taskChecklist: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: FontWeight.medium,
  },
  taskChecklistCompleted: {
    color: '#22C55E',
    fontWeight: FontWeight.bold,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
  },
  dueDateBadgeOverdue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  dueDateText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: FontWeight.semibold,
  },
  dueDateTextOverdue: {
    color: '#EF4444',
  },
});
