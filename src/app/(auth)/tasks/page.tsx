"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Plus, RefreshCw, X, UserCheck, Eye, Ban, Filter, Search } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api/auth';
import { toast } from 'sonner';
import { PageHeaderCard } from '@/components/page-header-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function TasksPage() {
  const queryClient = useQueryClient();

  // State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [cancelTaskId, setCancelTaskId] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Form
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    taskType: 'FILE_INSERT',
    priority: 'MEDIUM',
    warehouseId: '',
    assignedToId: '',
    fileBarcode: '',
    boxBarcode: '',
    sourceLocationBarcode: '',
    destinationLocationBarcode: '',
    dueDate: ''
  });

  // Reassign Form
  const [reassignUserId, setReassignUserId] = useState('');

  // Queries
  const { data: tasksResponse, refetch, isFetching } = useQuery({
    queryKey: ['tasks', filterStatus, filterType, filterPriority, filterWarehouseId, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('taskType', filterType);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterWarehouseId) params.append('warehouseId', filterWarehouseId);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetchWithAuth(`/tasks?${params.toString()}`);
      return res.data || [];
    }
  });

  const tasks = Array.isArray(tasksResponse) ? tasksResponse : [];

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: async () => {
      const res = await fetchWithAuth('/warehouses');
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.warehouses)) return res.data.warehouses;
      return [];
    }
  });

  const { data: assignees = [] } = useQuery({
    queryKey: ['tasks-assignees', createForm.warehouseId],
    queryFn: async () => {
      const param = createForm.warehouseId ? `?warehouseId=${createForm.warehouseId}` : '';
      const res = await fetchWithAuth(`/tasks/assignees${param}`);
      return res.data || [];
    }
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      return fetchWithAuth('/tasks', {
        method: 'POST',
        body: JSON.stringify(createForm)
      });
    },
    onSuccess: () => {
      toast.success('Task created & assigned successfully');
      setIsCreateOpen(false);
      setCreateForm({
        title: '',
        description: '',
        taskType: 'FILE_INSERT',
        priority: 'MEDIUM',
        warehouseId: '',
        assignedToId: '',
        fileBarcode: '',
        boxBarcode: '',
        sourceLocationBarcode: '',
        destinationLocationBarcode: '',
        dueDate: ''
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create task')
  });

  const reassignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask || !reassignUserId) throw new Error('Assignee required');
      return fetchWithAuth(`/tasks/${selectedTask.id}/reassign`, {
        method: 'POST',
        body: JSON.stringify({ newAssigneeId: reassignUserId })
      });
    },
    onSuccess: () => {
      toast.success('Task reassigned successfully');
      setIsReassignOpen(false);
      setSelectedTask(null);
      setReassignUserId('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to reassign task')
  });

  const cancelMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return fetchWithAuth(`/tasks/${taskId}/cancel`, { method: 'POST' });
    },
    onSuccess: () => {
      toast.success('Task cancelled');
      setCancelTaskId(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to cancel task')
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('Tasks refreshed');
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeaderCard
        title="Task Assignment Management"
        description="Assign, track, and manage warehouse tasks for executives and supervisors"
        badge="Work Management · Tasks"
        icon={CheckSquare}
      >
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-violet-300' : ''}`} />
        </button>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
        >
          <Plus className="h-4 w-4" /> Create & Assign Task
        </button>
      </PageHeaderCard>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[200px] flex-1">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Task #, Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-9 border rounded-xl bg-slate-50 focus:bg-white transition text-xs"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 border rounded-xl px-3 bg-slate-50 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="OVERDUE">OVERDUE</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-9 border rounded-xl px-3 bg-slate-50 font-medium"
          >
            <option value="">All Task Types</option>
            <option value="BOX_SCAN">BOX_SCAN</option>
            <option value="FILE_INSERT">FILE_INSERT</option>
            <option value="FILE_REFILE">FILE_REFILE</option>
            <option value="BOX_TRANSFER">BOX_TRANSFER</option>
            <option value="SEGREGATION">SEGREGATION</option>
            <option value="LOCATION_VERIFICATION">LOCATION_VERIFICATION</option>
            <option value="FILE_VERIFICATION">FILE_VERIFICATION</option>
            <option value="BOX_VERIFICATION">BOX_VERIFICATION</option>
            <option value="CUSTOM">CUSTOM</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="h-9 border rounded-xl px-3 bg-slate-50 font-medium"
          >
            <option value="">All Priorities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>

          {warehouses.length > 0 && (
            <select
              value={filterWarehouseId}
              onChange={(e) => setFilterWarehouseId(e.target.value)}
              className="h-9 border rounded-xl px-3 bg-slate-50 font-medium"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Task #</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Assigned To</th>
                <th className="p-3.5">Assigned By</th>
                <th className="p-3.5">Warehouse</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-normal">
                    No tasks found. Click "Create & Assign Task" to generate a new task.
                  </td>
                </tr>
              ) : (
                tasks.map((task: any) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold font-mono text-slate-900">{task.taskNumber}</td>
                    <td className="p-3.5">
                      <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase">
                        {task.taskType}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 max-w-[200px] truncate" title={task.title}>
                      {task.title}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      {task.assignedTo?.fullName || task.assignedTo?.email || 'Unassigned'}
                    </td>
                    <td className="p-3.5 text-slate-500">{task.assignedBy?.fullName || 'System'}</td>
                    <td className="p-3.5 text-slate-600">{task.warehouse?.name || '—'}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          task.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-700'
                            : task.status === 'ACCEPTED'
                            ? 'bg-indigo-100 text-indigo-700'
                            : task.status === 'REJECTED' || task.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-slate-100 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setIsReassignOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                            title="Reassign Task"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setCancelTaskId(task.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                            title="Cancel Task"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TASK — RIGHT-SIDE SHEET / DRAWER */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-lg w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Create & Assign Task</h3>
                  <p className="text-xs text-slate-500">Assign warehouse operational work to executive</p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Insert File MAC5832438 into Box BX171526"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full border rounded-xl h-9 px-3 mt-1 font-medium text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Task Type *</label>
                    <select
                      value={createForm.taskType}
                      onChange={(e) => setCreateForm({ ...createForm, taskType: e.target.value })}
                      className="w-full border rounded-xl h-9 px-2 mt-1 bg-white font-medium"
                    >
                      <option value="FILE_INSERT">FILE_INSERT</option>
                      <option value="FILE_REFILE">FILE_REFILE</option>
                      <option value="BOX_TRANSFER">BOX_TRANSFER</option>
                      <option value="BOX_SCAN">BOX_SCAN</option>
                      <option value="SEGREGATION">SEGREGATION</option>
                      <option value="LOCATION_VERIFICATION">LOCATION_VERIFICATION</option>
                      <option value="FILE_VERIFICATION">FILE_VERIFICATION</option>
                      <option value="BOX_VERIFICATION">BOX_VERIFICATION</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Priority *</label>
                    <select
                      value={createForm.priority}
                      onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                      className="w-full border rounded-xl h-9 px-2 mt-1 bg-white font-medium"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Warehouse *</label>
                    <select
                      value={createForm.warehouseId}
                      onChange={(e) => setCreateForm({ ...createForm, warehouseId: e.target.value })}
                      className="w-full border rounded-xl h-9 px-2 mt-1 bg-white font-medium"
                    >
                      <option value="">-- Select Warehouse --</option>
                      {warehouses.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Assign To *</label>
                    <select
                      value={createForm.assignedToId}
                      onChange={(e) => setCreateForm({ ...createForm, assignedToId: e.target.value })}
                      className="w-full border rounded-xl h-9 px-2 mt-1 bg-white font-medium"
                    >
                      <option value="">-- Select Employee --</option>
                      {assignees.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Task execution notes / instructions..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full border rounded-xl p-2 mt-1 text-xs"
                  />
                </div>

                <div className="pt-2 border-t space-y-2">
                  <span className="font-semibold text-slate-900">Entity Barcodes (Optional)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-600">File Barcode</label>
                      <input
                        type="text"
                        placeholder="e.g. MAC5832438"
                        value={createForm.fileBarcode}
                        onChange={(e) => setCreateForm({ ...createForm, fileBarcode: e.target.value })}
                        className="w-full border rounded-xl h-9 px-2 mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600">Box Barcode</label>
                      <input
                        type="text"
                        placeholder="e.g. BX171526"
                        value={createForm.boxBarcode}
                        onChange={(e) => setCreateForm({ ...createForm, boxBarcode: e.target.value })}
                        className="w-full border rounded-xl h-9 px-2 mt-1 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-600">Source Location</label>
                      <input
                        type="text"
                        placeholder="e.g. R01-L02"
                        value={createForm.sourceLocationBarcode}
                        onChange={(e) => setCreateForm({ ...createForm, sourceLocationBarcode: e.target.value })}
                        className="w-full border rounded-xl h-9 px-2 mt-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600">Destination Location</label>
                      <input
                        type="text"
                        placeholder="e.g. R02-L01"
                        value={createForm.destinationLocationBarcode}
                        onChange={(e) => setCreateForm({ ...createForm, destinationLocationBarcode: e.target.value })}
                        className="w-full border rounded-xl h-9 px-2 mt-1 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full border rounded-xl h-9 px-3 mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!createForm.title || !createForm.warehouseId || !createForm.assignedToId || createMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Assigning...' : 'Assign Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN TASK — RIGHT-SIDE SHEET / DRAWER */}
      {isReassignOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Reassign Task</h3>
                  <p className="text-xs text-slate-500">Task #{selectedTask.taskNumber}</p>
                </div>
                <button
                  onClick={() => setIsReassignOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs pt-4">
                <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900">{selectedTask.title}</div>
                  <div className="text-slate-500">Currently Assigned To: <strong className="text-slate-800">{selectedTask.assignedTo?.fullName}</strong></div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Select New Assignee *</label>
                  <select
                    value={reassignUserId}
                    onChange={(e) => setReassignUserId(e.target.value)}
                    className="w-full border rounded-xl h-9 px-3 mt-1 bg-white font-medium"
                  >
                    <option value="">-- Select New Employee --</option>
                    {assignees.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => setIsReassignOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => reassignMutation.mutate()}
                disabled={!reassignUserId || reassignMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
              >
                {reassignMutation.isPending ? 'Reassigning...' : 'Confirm Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TASK DETAILS INSPECTOR — RIGHT-SIDE SHEET / DRAWER */}
      {selectedTask && !isReassignOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase">
                    {selectedTask.taskType}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{selectedTask.taskNumber}</h3>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs pt-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedTask.title}</h4>
                  {selectedTask.description && (
                    <p className="text-slate-600 mt-1">{selectedTask.description}</p>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="font-bold uppercase text-slate-900">{selectedTask.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Priority</span>
                    <span className="font-bold uppercase text-slate-900">{selectedTask.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned To</span>
                    <span className="font-bold text-slate-900">{selectedTask.assignedTo?.fullName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned By</span>
                    <span className="font-bold text-slate-900">{selectedTask.assignedBy?.fullName || 'System'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Warehouse</span>
                    <span className="font-bold text-slate-900">{selectedTask.warehouse?.name || '—'}</span>
                  </div>
                </div>

                {(selectedTask.file || selectedTask.box || selectedTask.sourceLocation || selectedTask.destinationLocation) && (
                  <div className="border border-slate-200 p-3 rounded-xl space-y-2 font-mono text-[11px]">
                    <span className="font-sans font-bold text-slate-900 text-xs block mb-1">Related Entities</span>
                    {selectedTask.file && <div>File Barcode: <strong>{selectedTask.file.barcode}</strong></div>}
                    {selectedTask.box && <div>Box Barcode: <strong>{selectedTask.box.barcode}</strong></div>}
                    {selectedTask.sourceLocation && <div>Source Location: <strong>{selectedTask.sourceLocation.barcode}</strong></div>}
                    {selectedTask.destinationLocation && <div>Destination Location: <strong>{selectedTask.destinationLocation.barcode}</strong></div>}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL TASK — SMALL CENTERED CONFIRMATION MODAL */}
      <ConfirmDialog
        isOpen={Boolean(cancelTaskId)}
        title="Cancel Task"
        description="Are you sure you want to cancel this task? The assigned employee will no longer be able to execute it."
        confirmLabel="Cancel Task"
        variant="danger"
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelTaskId && cancelMutation.mutate(cancelTaskId)}
        onClose={() => setCancelTaskId(null)}
      />
    </div>
  );
}
