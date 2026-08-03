"use client";

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Upload,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  importRecords,
  importSegregationPlan,
  listSegregationPlanItems,
  RecordsImportRow,
  SegregationPlanRow,
} from '@/lib/api/imports';
import { lookupBarcode } from '@/lib/api/records';

type Tab = 'import' | 'segregation' | 'lookup';

function parseSpreadsheet(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/\s+/g, '');
}

function mapRecordsRows(raw: Record<string, string>[]): RecordsImportRow[] {
  return raw.map((row) => {
    const mapped: Record<string, string> = {};
    Object.entries(row).forEach(([k, v]) => {
      mapped[normalizeKey(k)] = String(v).trim();
    });
    return {
      clientCode: mapped.clientcode || mapped.client_code,
      clientName: mapped.clientname || mapped.client_name,
      locationBarcode: mapped.locationbarcode || mapped.location_barcode,
      boxBarcode: mapped.boxbarcode || mapped.box_barcode || mapped.box,
      fileBarcode: mapped.filebarcode || mapped.file_barcode || mapped.file,
    };
  });
}

function mapSegregationRows(raw: Record<string, string>[]): SegregationPlanRow[] {
  return raw.map((row) => {
    const mapped: Record<string, string> = {};
    Object.entries(row).forEach(([k, v]) => {
      mapped[normalizeKey(k)] = String(v).trim();
    });
    return {
      oldBoxBarcode: mapped.oldboxbarcode || mapped.old_box_barcode || mapped.oldbox,
      fileBarcode: mapped.filebarcode || mapped.file_barcode || mapped.file,
    };
  });
}

export default function BarcodesPage() {
  const [tab, setTab] = useState<Tab>('import');
  const [previewRows, setPreviewRows] = useState<RecordsImportRow[]>([]);
  const [segPreviewRows, setSegPreviewRows] = useState<SegregationPlanRow[]>([]);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [lookupBarcodeValue, setLookupBarcodeValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const segFileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: planItems = [], isLoading: planLoading } = useQuery({
    queryKey: ['segregation-plan'],
    queryFn: listSegregationPlanItems,
    enabled: tab === 'segregation',
  });

  const {
    data: lookupResult,
    isFetching: lookupLoading,
    refetch: runLookup,
    error: lookupError,
  } = useQuery({
    queryKey: ['barcode-lookup', lookupBarcodeValue],
    queryFn: () => lookupBarcode(lookupBarcodeValue),
    enabled: false,
    retry: false,
  });

  const recordsImportMutation = useMutation({
    mutationFn: importRecords,
    onSuccess: (result) => {
      setImportResult(
        `${result.boxesCreated} boxes, ${result.filesCreated} files, ${result.clientsCreated} clients imported`
      );
      setPreviewRows([]);
      toast.success('Records imported successfully');
    },
    onError: (err: Error) => toast.error(err.message || 'Import failed'),
  });

  const segImportMutation = useMutation({
    mutationFn: importSegregationPlan,
    onSuccess: (result) => {
      toast.success(`${result.planned} files planned as OUT`);
      setSegPreviewRows([]);
      queryClient.invalidateQueries({ queryKey: ['segregation-plan'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Segregation plan import failed'),
  });

  const handleRecordsFile = async (file: File) => {
    const raw = await parseSpreadsheet(file);
    const rows = mapRecordsRows(raw).filter((r) => r.boxBarcode);
    if (rows.some((r) => !r.boxBarcode)) {
      toast.error('Each row must include boxBarcode');
      return;
    }
    setPreviewRows(rows);
    setImportResult(null);
  };

  const handleSegFile = async (file: File) => {
    const raw = await parseSpreadsheet(file);
    const rows = mapSegregationRows(raw).filter((r) => r.oldBoxBarcode && r.fileBarcode);
    setSegPreviewRows(rows);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'import', label: 'Records Import' },
    { id: 'segregation', label: 'Segregation Plan' },
    { id: 'lookup', label: 'Barcode Lookup' },
  ];

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Barcode Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Import records, upload segregation plans, and look up barcodes.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'import' && (
        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Upload CSV or Excel with columns: clientCode, clientName, locationBarcode, boxBarcode, fileBarcode.
              boxBarcode is required.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleRecordsFile(file);
              }}
            />
            <Button onClick={() => fileInputRef.current?.click()} className="rounded-xl">
              <Upload className="w-4 h-4 mr-2" /> Choose File
            </Button>

            {previewRows.length > 0 && (
              <>
                <p className="text-xs text-slate-500">
                  Preview ({Math.min(10, previewRows.length)} of {previewRows.length} rows)
                </p>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {['clientCode', 'clientName', 'locationBarcode', 'boxBarcode', 'fileBarcode'].map(
                          (h) => (
                            <th key={h} className="px-3 py-2 text-left font-bold text-slate-500">
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">{row.clientCode || '—'}</td>
                          <td className="px-3 py-2">{row.clientName || '—'}</td>
                          <td className="px-3 py-2 font-mono">{row.locationBarcode || '—'}</td>
                          <td className="px-3 py-2 font-mono">{row.boxBarcode}</td>
                          <td className="px-3 py-2 font-mono">{row.fileBarcode || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button
                  disabled={recordsImportMutation.isPending}
                  onClick={() => recordsImportMutation.mutate(previewRows)}
                  className="rounded-xl"
                >
                  {recordsImportMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Submit Import
                </Button>
              </>
            )}

            {importResult && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle2 className="w-4 h-4" />
                {importResult}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'segregation' && (
        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Upload CSV with columns: oldBoxBarcode, fileBarcode
            </p>
            <input
              ref={segFileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSegFile(file);
              }}
            />
            <Button onClick={() => segFileInputRef.current?.click()} className="rounded-xl">
              <Upload className="w-4 h-4 mr-2" /> Choose File
            </Button>

            {segPreviewRows.length > 0 && (
              <>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left">oldBoxBarcode</th>
                        <th className="px-3 py-2 text-left">fileBarcode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segPreviewRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 font-mono">{row.oldBoxBarcode}</td>
                          <td className="px-3 py-2 font-mono">{row.fileBarcode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button
                  disabled={segImportMutation.isPending}
                  onClick={() => segImportMutation.mutate(segPreviewRows)}
                  className="rounded-xl"
                >
                  {segImportMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Submit Plan
                </Button>
              </>
            )}
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <h3 className="font-semibold text-slate-800 mb-3">Existing Plan Items</h3>
            {planLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            ) : planItems.length === 0 ? (
              <p className="text-sm text-slate-400">No plan items yet</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Old Box</th>
                    <th className="px-3 py-2 text-left">File</th>
                    <th className="px-3 py-2 text-left">Done</th>
                  </tr>
                </thead>
                <tbody>
                  {planItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2 font-mono">{item.oldBoxBarcode}</td>
                      <td className="px-3 py-2 font-mono">{item.fileBarcode}</td>
                      <td className="px-3 py-2">{item.isDone ? '✅' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'lookup' && (
        <div className="bg-white border rounded-2xl p-6 space-y-4">
          <div className="flex gap-2 max-w-md">
            <Input
              value={lookupBarcodeValue}
              onChange={(e) => setLookupBarcodeValue(e.target.value)}
              placeholder="Enter barcode..."
              className="font-mono rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && lookupBarcodeValue && runLookup()}
            />
            <Button
              onClick={() => lookupBarcodeValue && runLookup()}
              disabled={lookupLoading || !lookupBarcodeValue}
              className="rounded-xl"
            >
              {lookupLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {lookupError && (
            <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4" />
              Barcode not found
            </div>
          )}

          {lookupResult && (
            <div className="space-y-4 border rounded-xl p-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm uppercase">{lookupResult.entityType}</span>
              </div>
              <pre className="text-xs bg-white border rounded-lg p-3 overflow-x-auto">
                {JSON.stringify(lookupResult.entity, null, 2)}
              </pre>
              {lookupResult.path.length > 0 && (
                <p className="text-xs text-slate-600">
                  Path: {lookupResult.path.map((p) => p.name).join(' → ')}
                </p>
              )}
              {lookupResult.contents.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2">Contents ({lookupResult.contents.length})</p>
                  <pre className="text-xs bg-white border rounded-lg p-3 overflow-x-auto max-h-48">
                    {JSON.stringify(lookupResult.contents.slice(0, 20), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
