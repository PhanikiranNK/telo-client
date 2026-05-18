import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { TaskCard, TaskItem } from '../components/TaskCard';
import { Colors, FontSize, FontWeight, Radius } from '../theme';
import { socketService } from '../config/socket';

// ─── Lucide React Native Vector Icons ─────────────────────────────────────────
import {
  Plus as LucidePlus,
  Compass as LucideCompass,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  Calendar as LucideCalendar,
} from 'lucide-react-native';

const Plus = LucidePlus as any;
const Compass = LucideCompass as any;
const ChevronLeft = LucideChevronLeft as any;
const ChevronRight = LucideChevronRight as any;
const Calendar = LucideCalendar as any;

// ─── Helper Functions for custom Calendar grid ────────────────────────────────
function getMonthDays(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  
  // Empty slots for preceding days
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(null);
  }
  
  // Actual month days
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(i);
  }
  
  return cells;
}

function formatDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthName(monthIndex: number) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
}

// Local interface extension to support board columns locally
interface BoardTask extends TaskItem {
  column: 'todo' | 'progress' | 'done';
}

export function TaskScreen() {
  const currentUser = useSelector((s: RootState) => s.auth.user);

  // Trellix Task Board Local States
  const [activeColumn, setActiveColumn] = useState<'todo' | 'progress' | 'done'>('todo');
  const [tasks, setTasks] = useState<Record<'todo' | 'progress' | 'done', BoardTask[]>>({
    todo: [],
    progress: [],
    done: []
  });
  
  // Add task inline modal helper
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Calendar states
  const [visibleDate, setVisibleDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  // Selected task for moving status
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);

  // ─── Socket Synchronization Listeners ───────────────────────────────────────
  useEffect(() => {
    const activeSocket = socketService.socket;
    if (!activeSocket) return;

    function fetchTasks() {
      if (activeSocket) {
        activeSocket.emit('task:get_all', {}, (res: any) => {
          if (res && res.success && res.tasks) {
            const fetchedTasks = res.tasks as BoardTask[];
            const grouped = {
              todo: fetchedTasks.filter((t) => t.column === 'todo'),
              progress: fetchedTasks.filter((t) => t.column === 'progress'),
              done: fetchedTasks.filter((t) => t.column === 'done'),
            };
            setTasks(grouped);
          }
        });
      }
    }

    // Call initially
    fetchTasks();

    // Listen for socket events from team members
    function handleTaskCreated(data: { task: BoardTask }) {
      setTasks((prev) => {
        const col = data.task.column || 'todo';
        const exists = prev[col].some((t) => t.id === data.task.id);
        if (exists) return prev;
        return {
          ...prev,
          [col]: [data.task, ...prev[col]],
        };
      });
    }

    function handleTaskMoved(data: { taskId: string; column: 'todo' | 'progress' | 'done'; completedBy?: string }) {
      setTasks((prev) => {
        let foundTask: BoardTask | null = null;
        
        // Remove from existing column
        const updated = {
          todo: prev.todo.filter((t) => {
            if (t.id === data.taskId) { foundTask = t; return false; }
            return true;
          }),
          progress: prev.progress.filter((t) => {
            if (t.id === data.taskId) { foundTask = t; return false; }
            return true;
          }),
          done: prev.done.filter((t) => {
            if (t.id === data.taskId) { foundTask = t; return false; }
            return true;
          }),
        };

        // Append to target column
        if (foundTask) {
          const taskObj = foundTask as BoardTask;
          const match = (taskObj.checklist || '').match(/(\d+)\/(\d+)/);
          const total = match ? match[2] : '1';
          const updatedChecklist = data.column === 'done' ? `${total}/${total} completed` : `0/${total} pending`;

          const updatedTask: BoardTask = {
            ...taskObj,
            column: data.column,
            checklist: updatedChecklist,
            completedBy: data.column === 'done' ? (data.completedBy || 'Anonymous') : undefined,
          };
          updated[data.column] = [updatedTask, ...updated[data.column]];
        } else {
          // Robust fallback: fetch all if task wasn't in state
          fetchTasks();
        }
        
        return updated;
      });
    }

    activeSocket.on('task:created', handleTaskCreated);
    activeSocket.on('task:moved', handleTaskMoved);
    activeSocket.on('connect', fetchTasks);

    return () => {
      activeSocket.off('task:created', handleTaskCreated);
      activeSocket.off('task:moved', handleTaskMoved);
      activeSocket.off('connect', fetchTasks);
    };
  }, [socketService.socket]);

  // ─── Actions handlers ──────────────────────────────────────────────────────
  function handleAddNewTask() {
    if (!newTaskTitle.trim()) return;

    const isDone = activeColumn === 'done';
    const completedBy = isDone ? (currentUser?.displayName || 'Anonymous') : undefined;
    const taskPayload = {
      title: newTaskTitle.trim(),
      desc: newTaskDesc.trim() || 'No description provided.',
      priority: newTaskPriority,
      checklist: isDone ? '1/1 completed' : '0/1 pending',
      assignee: currentUser?.displayName || 'Anonymous User',
      dueDate: selectedDate ? formatDateString(selectedDate) : undefined,
      completedBy,
    };

    const socket = socketService.socket;
    if (socket && socket.connected) {
      socket.emit('task:create', { task: taskPayload, column: activeColumn }, (res: any) => {
        if (res && res.success && res.task) {
          const created = res.task as BoardTask;
          setTasks((prev) => ({
            ...prev,
            [activeColumn]: [created, ...prev[activeColumn]]
          }));
        }
      });
    } else {
      // Local Sandbox Fallback
      const fallbackTask: BoardTask = {
        ...taskPayload,
        id: `task-${Date.now()}`,
        column: activeColumn,
      };
      setTasks((prev) => ({
        ...prev,
        [activeColumn]: [fallbackTask, ...prev[activeColumn]]
      }));
    }

    // Reset Form
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskPriority('Medium');
    setSelectedDate(null);
    setShowCalendarPicker(false);
    setShowAddTask(false);
  }

  function handleMoveTask(task: BoardTask, targetColumn: 'todo' | 'progress' | 'done') {
    const socket = socketService.socket;
    const match = (task.checklist || '').match(/(\d+)\/(\d+)/);
    const total = match ? match[2] : '1';
    const updatedChecklist = targetColumn === 'done' ? `${total}/${total} completed` : `0/${total} pending`;
    const completedBy = targetColumn === 'done' ? (currentUser?.displayName || 'Anonymous') : undefined;

    if (socket && socket.connected) {
      socket.emit('task:move', { taskId: task.id, column: targetColumn }, (res: any) => {
        if (res && res.success) {
          setTasks((prev) => {
            const updated = {
              todo: prev.todo.filter((t) => t.id !== task.id),
              progress: prev.progress.filter((t) => t.id !== task.id),
              done: prev.done.filter((t) => t.id !== task.id),
            };
            const movedTask: BoardTask = {
              ...task,
              column: targetColumn,
              checklist: updatedChecklist,
              completedBy,
              ...(res.task || {})
            };
            updated[targetColumn] = [movedTask, ...updated[targetColumn]];
            return updated;
          });
        }
      });
    } else {
      // Local Sandbox Fallback
      setTasks((prev) => {
        const updated = {
          todo: prev.todo.filter((t) => t.id !== task.id),
          progress: prev.progress.filter((t) => t.id !== task.id),
          done: prev.done.filter((t) => t.id !== task.id),
        };
        const movedTask: BoardTask = {
          ...task,
          column: targetColumn,
          checklist: updatedChecklist,
          completedBy,
        };
        updated[targetColumn] = [movedTask, ...updated[targetColumn]];
        return updated;
      });
    }
    
    setSelectedTask(null);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <Text style={styles.boardHeaderTitle}>Workspace Board</Text>
        <TouchableOpacity style={styles.addTaskBtn} onPress={() => setShowAddTask(true)}>
          <View style={styles.addTaskBtnRow}>
            <Plus size={12} color="#FFFFFF" />
            <Text style={styles.addTaskBtnText}>Add Task</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Column segmented selectors */}
      <View style={styles.boardSegmentContainer}>
        <TouchableOpacity
          style={[styles.boardSegment, activeColumn === 'todo' && styles.boardSegmentActive]}
          onPress={() => setActiveColumn('todo')}
        >
          <Text style={[styles.boardSegmentText, activeColumn === 'todo' && styles.boardSegmentTextActive]}>
            To Do ({tasks.todo.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boardSegment, activeColumn === 'progress' && styles.boardSegmentActive]}
          onPress={() => setActiveColumn('progress')}
        >
          <Text style={[styles.boardSegmentText, activeColumn === 'progress' && styles.boardSegmentTextActive]}>
            Active ({tasks.progress.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boardSegment, activeColumn === 'done' && styles.boardSegmentActive]}
          onPress={() => setActiveColumn('done')}
        >
          <Text style={[styles.boardSegmentText, activeColumn === 'done' && styles.boardSegmentTextActive]}>
            Completed ({tasks.done.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inline Add Task Overlay Form */}
      {showAddTask && (
        <View style={styles.addTaskCard}>
          <Text style={styles.addTaskCardTitle}>Create New Task</Text>
          <TextInput
            style={styles.addTaskInput}
            placeholder="Task name"
            placeholderTextColor={Colors.textTertiary}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
          />
          <TextInput
            style={styles.addTaskInput}
            placeholder="Description"
            placeholderTextColor={Colors.textTertiary}
            value={newTaskDesc}
            onChangeText={setNewTaskDesc}
          />
          
          <View style={styles.prioritySelectorRow}>
            <Text style={styles.prioritySelectorLabel}>Priority:</Text>
            {(['High', 'Medium', 'Low'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.priorityOption, newTaskPriority === p && styles.priorityOptionActive]}
                onPress={() => setNewTaskPriority(p)}
              >
                <Text style={[styles.priorityOptionText, newTaskPriority === p && styles.priorityOptionTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Due Date Trigger Selector */}
          <View style={styles.dateSelectorContainer}>
            <Text style={styles.prioritySelectorLabel}>Due Date:</Text>
            <TouchableOpacity
              style={[styles.dateTriggerBtn, selectedDate && styles.dateTriggerBtnActive]}
              onPress={() => setShowCalendarPicker(!showCalendarPicker)}
              activeOpacity={0.8}
            >
              <Calendar size={12} color={selectedDate ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.dateTriggerText, selectedDate && styles.dateTriggerTextActive]}>
                {selectedDate ? formatDateString(selectedDate) : 'No due date'}
              </Text>
            </TouchableOpacity>
            {selectedDate && (
              <TouchableOpacity
                style={styles.clearDateBtn}
                onPress={() => {
                  setSelectedDate(null);
                  setShowCalendarPicker(false);
                }}
              >
                <Text style={styles.clearDateText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Interactive Notion-Style Custom Calendar Picker */}
          {showCalendarPicker && (
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  onPress={() => {
                    const prevMonth = new Date(visibleDate.getFullYear(), visibleDate.getMonth() - 1, 1);
                    setVisibleDate(prevMonth);
                  }}
                  style={styles.calNavBtn}
                >
                  <ChevronLeft size={14} color="#475569" />
                </TouchableOpacity>
                <Text style={styles.calendarMonthTitle}>
                  {getMonthName(visibleDate.getMonth())} {visibleDate.getFullYear()}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const nextMonth = new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 1);
                    setVisibleDate(nextMonth);
                  }}
                  style={styles.calNavBtn}
                >
                  <ChevronRight size={14} color="#475569" />
                </TouchableOpacity>
              </View>

              {/* Day names row */}
              <View style={styles.weekdaysRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <Text key={d} style={styles.weekdayText}>{d}</Text>
                ))}
              </View>

              {/* Days grid matrix */}
              <View style={styles.daysGrid}>
                {getMonthDays(visibleDate.getFullYear(), visibleDate.getMonth()).map((day, idx) => {
                  if (day === null) {
                    return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
                  }

                  const cellDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), day);
                  const isSelected = selectedDate &&
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === visibleDate.getMonth() &&
                    selectedDate.getFullYear() === visibleDate.getFullYear();

                  const today = new Date();
                  const isToday = today.getDate() === day &&
                    today.getMonth() === visibleDate.getMonth() &&
                    today.getFullYear() === visibleDate.getFullYear();

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday,
                      ]}
                      onPress={() => {
                        setSelectedDate(cellDate);
                        setShowCalendarPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.dayTextSelected,
                          isToday && !isSelected && styles.dayTextToday,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.addTaskActions}>
            <TouchableOpacity style={styles.addTaskCancel} onPress={() => {
              setShowAddTask(false);
              setShowCalendarPicker(false);
            }}>
              <Text style={styles.addTaskCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addTaskConfirm} onPress={handleAddNewTask}>
              <Text style={styles.addTaskConfirmText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Cards List */}
      <FlatList
        data={tasks[activeColumn]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedTask(item)} activeOpacity={0.95}>
            <TaskCard task={item} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.boardCardList}
        ListEmptyComponent={
          <View style={styles.emptyBoardState}>
            <Compass size={32} color="#CBD5E1" style={styles.emptyBoardIcon} />
            <Text style={styles.emptyBoardText}>Column is empty! Take a break or add a task.</Text>
          </View>
        }
      />

      {/* Move Task Action Sheet / Drawer Modal */}
      {selectedTask && (
        <Modal visible transparent animationType="slide">
          <View style={styles.actionSheetOverlay}>
            <Pressable style={styles.actionSheetBackdrop} onPress={() => setSelectedTask(null)} />
            <View style={styles.actionSheetContainer}>
              <View style={styles.actionSheetHandle} />
              
              <Text style={styles.actionSheetTitle}>{selectedTask.title}</Text>
              {selectedTask.desc ? <Text style={styles.actionSheetDesc}>{selectedTask.desc}</Text> : null}
              
              {selectedTask.column !== 'done' && <Text style={styles.actionSheetSectionLabel}>Change Status</Text>}
              
              <View style={styles.actionButtonsCol}>
                {selectedTask.column !== 'todo' && selectedTask.column !== 'done' && (
                  <TouchableOpacity
                    style={[styles.actionRowBtn, { borderLeftColor: '#64748B' }]}
                    onPress={() => handleMoveTask(selectedTask, 'todo')}
                  >
                    <View style={[styles.statusDot, { backgroundColor: '#64748B' }]} />
                    <Text style={styles.actionRowBtnText}>Move to To Do</Text>
                  </TouchableOpacity>
                )}

                {selectedTask.column !== 'progress' && selectedTask.column !== 'done' && (
                  <TouchableOpacity
                    style={[styles.actionRowBtn, { borderLeftColor: '#F59E0B' }]}
                    onPress={() => handleMoveTask(selectedTask, 'progress')}
                  >
                    <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.actionRowBtnText}>Move to Active (In Progress)</Text>
                  </TouchableOpacity>
                )}

                {selectedTask.column !== 'done' && (
                  <TouchableOpacity
                    style={[styles.actionRowBtn, { borderLeftColor: '#10B981' }]}
                    onPress={() => handleMoveTask(selectedTask, 'done')}
                  >
                    <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.actionRowBtnText}>Move to Completed</Text>
                  </TouchableOpacity>
                )}

                {selectedTask.column === 'done' && (
                  <View style={styles.completedBadgeSheet}>
                    <Text style={styles.completedBadgeSheetText}>
                      ✓ Completed by {selectedTask.completedBy || 'Anonymous'}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.actionCancelBtn} onPress={() => setSelectedTask(null)}>
                <Text style={styles.actionCancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  boardHeaderTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: '#1A1A1A',
  },
  addTaskBtn: {
    backgroundColor: '#000000',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addTaskBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  boardSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4F5F7',
    padding: 3,
    borderRadius: Radius.lg,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  boardSegment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  boardSegmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  boardSegmentText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
    color: '#737373',
  },
  boardSegmentTextActive: {
    color: '#000000',
    fontWeight: FontWeight.bold,
  },

  // Add Task card inline form
  addTaskCard: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  addTaskCardTitle: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  addTaskInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1A1A1A',
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  prioritySelectorLabel: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: '#737373',
  },
  priorityOption: {
    backgroundColor: '#F4F5F7',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityOptionActive: {
    backgroundColor: '#000000',
  },
  priorityOptionText: {
    fontSize: 10,
    color: '#737373',
    fontWeight: FontWeight.semibold,
  },
  priorityOptionTextActive: {
    color: '#FFFFFF',
  },

  // Custom Inline Calendar styles
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  dateTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
  },
  dateTriggerBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4338CA',
  },
  dateTriggerText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: FontWeight.semibold,
  },
  dateTriggerTextActive: {
    color: '#FFFFFF',
  },
  clearDateBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearDateText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: FontWeight.bold,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.md,
    padding: 10,
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calNavBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  calendarMonthTitle: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#1E293B',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  weekdayText: {
    width: 28,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
    borderRadius: 14,
  },
  dayCellEmpty: {
    width: 28,
    height: 28,
    marginVertical: 1,
  },
  dayCellSelected: {
    backgroundColor: '#4F46E5',
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
  },
  dayText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: FontWeight.medium,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  dayTextToday: {
    color: '#4F46E5',
    fontWeight: FontWeight.bold,
  },

  addTaskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  addTaskCancel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addTaskCancelText: {
    fontSize: 12,
    color: '#737373',
    fontWeight: FontWeight.medium,
  },
  addTaskConfirm: {
    backgroundColor: '#000000',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addTaskConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },

  // Task board cards list
  boardCardList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  emptyBoardState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyBoardIcon: {
    marginBottom: 10,
  },
  emptyBoardText: {
    fontSize: 12,
    color: '#A3A3A3',
    textAlign: 'center',
  },

  // Premium Action Sheet Styles
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  actionSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 12,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: '#1E293B',
    marginBottom: 4,
  },
  actionSheetDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  actionSheetSectionLabel: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  actionButtonsCol: {
    gap: 10,
    marginBottom: 16,
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionRowBtnText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: '#334155',
  },
  actionCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionCancelBtnText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: FontWeight.bold,
  },
  completedBadgeSheet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  completedBadgeSheetText: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: '#22C55E',
  },
});
