import React, { useState } from 'react';
import { Client, Vehicle } from '../types';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImportExportProps {
  onImportClients: (imported: any[]) => { successCount: number; errorCount: number; report: string[] };
  onImportVehicles: (imported: any[]) => { successCount: number; errorCount: number; report: string[] };
  clients: Client[];
  vehicles: Vehicle[];
}

export default function ImportExport({
  onImportClients,
  onImportVehicles,
  clients,
  vehicles
}: ImportExportProps) {
  
  // State variables
  const [importType, setImportType] = useState<'clients' | 'vehicles'>('clients');
  const [dragActive, setDragActive] = useState(false);
  const [reportResult, setReportResult] = useState<{
    processed: number;
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Download template helpers
  const downloadTemplate = () => {
    let headers = '';
    let sampleRow = '';
    let filename = '';

    if (importType === 'clients') {
      headers = 'Nombre,Celular,Ciudad,Departamento,PresupuestoUSD,Observaciones\n';
      sampleRow = 'Juan Carlos Perez,+59170012345,Santa Cruz de la Sierra,Santa Cruz,45000,Busca vagoneta mediana tipo SUV\n';
      filename = 'plantilla_clientes_MLA.csv';
    } else {
      headers = 'Marca,Modelo,Version,Anio,Tipo,PrecioUSD,Motor,Combustible,Transmision,Traccion,Color,Descripcion\n';
      sampleRow = 'Toyota,Tacoma TRD,Double Cab,2025,Pickup,52000,2.4L Hibrido,Hibrido,Automatica,4x4,Azul,Camioneta extrema para offroad\n';
      filename = 'plantilla_vehiculos_MLA.csv';
    }

    const blob = new Blob([headers + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger export of active databases to Excel CSV
  const handleExportData = () => {
    let csvContent = '';
    let filename = '';

    if (importType === 'clients') {
      const headers = 'ID,Nombre,Celular,Ciudad,Departamento,PresupuestoUSD,Estado,FechaRegistro\n';
      const rows = clients.map(c => 
        `"${c.id}","${c.nombre}","${c.celular}","${c.ciudad}","${c.departamento}",${c.presupuesto_usd},"${c.estado}","${c.fecha_registro}"`
      ).join('\n');
      csvContent = headers + rows;
      filename = `clientes_exportados_MLA_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = 'ID,Marca,Modelo,Version,Anio,Tipo,Combustible,Transmision,Traccion,PrecioUSD,Estado\n';
      const rows = vehicles.map(v => 
        `"${v.id}","${v.marca}","${v.modelo}","${v.version}",${v.anio},"${v.tipo}","${v.combustible}","${v.transmision}","${v.traccion}",${v.precio_usd},"${v.estado}"`
      ).join('\n');
      csvContent = headers + rows;
      filename = `catalogo_exportado_MLA_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Parse file and triggers db import
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      // Parse CSV line by line
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        alert('El archivo cargado no contiene registros válidos para importar.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const parsedRecords: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        parsedRecords.push(record);
      }

      if (importType === 'clients') {
        const result = onImportClients(parsedRecords);
        setReportResult({
          processed: parsedRecords.length,
          success: result.successCount,
          failed: result.errorCount,
          errors: result.report
        });
      } else {
        const result = onImportVehicles(parsedRecords);
        setReportResult({
          processed: parsedRecords.length,
          success: result.successCount,
          failed: result.errorCount,
          errors: result.report
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6" id="import-export-module">
      
      {/* Selector and template columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Selection Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-50 text-gray-700">
              <FileSpreadsheet className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-gray-800 font-display uppercase tracking-wider">Carga Masiva de Datos</h3>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Reduzca el tiempo administrativo cargando de golpe su listado histórico de clientes o renovando todo el catálogo de vehículos disponibles en un solo clic utilizando planillas compatibles de Excel.
            </p>

            <div className="space-y-2 pt-2">
              <span className="block text-xs font-bold text-gray-400 uppercase">Módulo Seleccionado:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setImportType('clients');
                    setReportResult(null);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs transition border ${
                    importType === 'clients'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  Clientes CRM
                </button>
                <button
                  onClick={() => {
                    setImportType('vehicles');
                    setReportResult(null);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs transition border ${
                    importType === 'vehicles'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  Catálogo Vehículos
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 grid grid-cols-2 gap-3">
            <button
              onClick={downloadTemplate}
              className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-3xs"
            >
              <Download className="w-4 h-4" />
              <span>Plantilla Template</span>
            </button>
            <button
              onClick={handleExportData}
              className="py-2.5 bg-gray-950 hover:bg-gray-900 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm uppercase tracking-wider"
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>Exportar Base</span>
            </button>
          </div>
        </div>

        {/* Drag Drop Area Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
          <div className="pb-3 border-b border-gray-50 text-gray-700 mb-5">
            <h4 className="text-sm font-bold uppercase tracking-wider font-display">Zona de Carga del Archivo</h4>
          </div>

          {/* Upload input element */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-4 transition ${
              dragActive 
                ? 'border-amber-500 bg-amber-50/20' 
                : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
            }`}
          >
            <div className="p-3 bg-white rounded-full shadow-2xs border border-gray-100">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-700">Arrastre y suelte su archivo CSV o de Texto aquí</p>
              <p className="text-[10px] text-gray-400">O haga clic para navegar localmente en su sistema</p>
            </div>

            <label className="px-4 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-bold transition cursor-pointer shadow-3xs">
              <span>Seleccionar Archivo</span>
              <input
                type="file"
                accept=".csv, .txt, .json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Reports and logs block (errores_importacion.xlsx and statistics) */}
      <AnimatePresence>
        {reportResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4"
          >
            <div className="pb-3 border-b border-gray-50 flex justify-between items-center text-gray-700">
              <div>
                <h4 className="text-base font-bold font-display text-gray-800">
                  Informe Detallado de Importación Masiva
                </h4>
                <p className="text-xs text-gray-400">Validado en tiempo real según políticas comerciales de SQLite</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>

            {/* Quick metrics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400">Procesados</span>
                <p className="text-2xl font-bold font-mono text-gray-800 mt-1">{reportResult.processed}</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Importados con Éxito</span>
                <p className="text-2xl font-bold font-mono text-emerald-800 mt-1">{reportResult.success}</p>
              </div>
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-100">
                <span className="text-[10px] uppercase font-bold text-rose-600">Omitidos con Errores</span>
                <p className="text-2xl font-bold font-mono text-rose-800 mt-1">{reportResult.failed}</p>
              </div>
            </div>

            {/* Error logs log sheet ("errores_importacion.xlsx" simulator) */}
            {reportResult.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Bitácora de Registros Fallidos (Omitidos):</span>
                  </span>
                  <span className="text-gray-400 text-[10px]">No se alteró la integridad de la base</span>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-[160px] overflow-y-auto space-y-1.5 font-mono text-[10px] text-gray-600">
                  {reportResult.errors.map((err, i) => (
                    <div key={i} className="flex space-x-2 text-rose-600 border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                      <span className="font-bold">❌</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
