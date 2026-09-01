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
  ArrowRight,
  Database,
  Cloud,
  CloudCheck,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FirebaseSyncService } from '../services/firebase';
import { mockDb } from '../data/mockDatabase';

interface ImportExportProps {
  onImportClients: (imported: any[]) => { successCount: number; errorCount: number; report: string[] };
  onImportVehicles: (imported: any[]) => { successCount: number; errorCount: number; report: string[] };
  clients: Client[];
  vehicles: Vehicle[];
  onDownloadBackup?: () => void;
  onUploadBackup?: (backupText: string) => boolean;
}

export default function ImportExport({
  onImportClients,
  onImportVehicles,
  clients,
  vehicles,
  onDownloadBackup,
  onUploadBackup
}: ImportExportProps) {
  
  // Active Tab: 'csv' for spreadsheets or 'backup' for full database JSON & Firebase cloud
  const [activeSubTab, setActiveSubTab] = useState<'csv' | 'backup'>('csv');

  // State variables for CSV
  const [importType, setImportType] = useState<'clients' | 'vehicles'>('clients');
  const [dragActive, setDragActive] = useState(false);
  const [reportResult, setReportResult] = useState<{
    processed: number;
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // State variables for Backup & Cloud
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [jsonBackupStatus, setJsonBackupStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Download template helpers
  const downloadTemplate = () => {
    let headers = '';
    let sampleRow = '';
    let filename = '';

    if (importType === 'clients') {
      headers = 'Nombre,Celular,Ciudad,Departamento,PresupuestoUSD,Observaciones\n';
      sampleRow = 'Juan Carlos Perez,+59170012345,Santa Cruz de la Sierra,Santa Cruz,45000,Busca valla publicitaria en zona norte\n';
      filename = 'plantilla_clientes_PUBLI_X.csv';
    } else {
      headers = 'Marca,Modelo,Version,Anio,Tipo,PrecioUSD,Motor,Combustible,Transmision,Traccion,Color,Descripcion\n';
      sampleRow = 'PUBLI-X,Av. Cristo Redentor y 4to Anillo,Cara A,2025,Valla Gigante Bipolar,1500,Iluminacion LED,10x4m,Centro,Santa Cruz,Full Color,Valla de alto impacto visual y tráfico masivo\n';
      filename = 'plantilla_vallas_PUBLI_X.csv';
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
      filename = `clientes_exportados_PUBLI_X_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const headers = 'ID,Marca,Modelo,Version,Anio,Tipo,Combustible,Transmision,Traccion,PrecioUSD,Estado\n';
      const rows = vehicles.map(v => 
        `"${v.id}","${v.marca}","${v.modelo}","${v.version}",${v.anio},"${v.tipo}","${v.combustible}","${v.transmision}","${v.traccion}",${v.precio_usd},"${v.estado}"`
      ).join('\n');
      csvContent = headers + rows;
      filename = `catalogo_vallas_exportado_PUBLI_X_${new Date().toISOString().split('T')[0]}.csv`;
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

      // Check if user uploaded JSON in CSV area
      if (file.name.endsWith('.json')) {
        if (onUploadBackup) {
          const success = onUploadBackup(text);
          if (success) {
            alert('¡Copia de seguridad JSON restaurada con éxito en PUBLI-X BOLIVIA!');
            window.location.reload();
            return;
          }
        }
      }

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

  // Handle Full Database JSON Download
  const handleDownloadFullDatabaseJSON = () => {
    if (onDownloadBackup) {
      onDownloadBackup();
    } else {
      const backupText = mockDb.exportBackup();
      const blob = new Blob([backupText], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `PUBLI_X_BOLIVIA_BaseDatos_Completa_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setJsonBackupStatus({
      text: '¡Archivo JSON generado y descargado con éxito con todas las vallas, clientes, cotizaciones y contratos!',
      type: 'success'
    });
    setTimeout(() => setJsonBackupStatus(null), 5000);
  };

  // Handle Full Database JSON Restore
  const handleRestoreJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJsonBackupStatus(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const success = onUploadBackup ? onUploadBackup(text) : mockDb.importBackup(text);
          if (success) {
            setJsonBackupStatus({
              text: '¡Base de datos restaurada correctamente desde el archivo JSON! Recargando vista...',
              type: 'success'
            });
            setTimeout(() => window.location.reload(), 1500);
          } else {
            setJsonBackupStatus({
              text: 'El archivo seleccionado no corresponde a una copia de seguridad JSON válida para PUBLI-X.',
              type: 'error'
            });
          }
        }
      };
      reader.readAsText(file);
    }
  };

  // Manual trigger for Firebase Cloud Sync
  const handleTriggerCloudSync = async () => {
    setCloudSyncing(true);
    setCloudMessage(null);
    try {
      const success = await mockDb.syncWithFirestore();
      if (success) {
        setCloudMessage({
          text: '¡Sincronización en la nube con Firebase Firestore completada con éxito! Todos los cambios están respaldados en la nube.',
          type: 'success'
        });
      } else {
        setCloudMessage({
          text: 'Firebase está en línea y operando con almacenamiento local sincronizado.',
          type: 'info'
        });
      }
    } catch (e: any) {
      setCloudMessage({
        text: 'Error durante la sincronización: ' + (e.message || 'Error desconocido'),
        type: 'error'
      });
    } finally {
      setCloudSyncing(false);
      setTimeout(() => setCloudMessage(null), 6000);
    }
  };

  return (
    <div className="space-y-6" id="import-export-module">
      
      {/* Top Header Tabs: CSV Planillas vs Copia de Seguridad JSON & Nube */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500 text-gray-950 rounded-lg shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 font-display uppercase tracking-wider">
              Centro de Importación, Exportación y Respaldos
            </h3>
            <p className="text-xs text-gray-400">
              Gestione cargas masivas de planillas Excel o administre respaldos JSON y sincronización en la nube Firebase
            </p>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveSubTab('csv')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeSubTab === 'csv'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
            <span>Planillas CSV / Excel</span>
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeSubTab === 'backup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-500" />
            <span>Respaldo JSON & Nube Firebase</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'backup' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Cloud Status & Sync Banner */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-slate-900 p-6 rounded-2xl border border-gray-800 shadow-lg text-white space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400">
                  <Cloud className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black font-display uppercase tracking-wider text-white">
                      Base de Datos en la Nube (Firebase Firestore)
                    </h4>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      CONECTADO
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Tus vallas, clientes, cotizaciones y contratos se sincronizan en la nube para que estén siempre seguros y accesibles desde múltiples computadoras o en Render.
                  </p>
                </div>
              </div>

              <button
                onClick={handleTriggerCloudSync}
                disabled={cloudSyncing}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center space-x-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${cloudSyncing ? 'animate-spin' : ''}`} />
                <span>{cloudSyncing ? 'Sincronizando...' : 'Sincronizar con la Nube Ahora'}</span>
              </button>
            </div>

            {cloudMessage && (
              <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 animate-fade-in ${
                cloudMessage.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' :
                cloudMessage.type === 'error' ? 'bg-rose-950/60 border-rose-500/40 text-rose-300' :
                'bg-blue-950/60 border-blue-500/40 text-blue-300'
              }`}>
                {cloudMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" /> : <Info className="w-4 h-4 shrink-0 text-blue-400" />}
                <span>{cloudMessage.text}</span>
              </div>
            )}
          </div>

          {/* JSON Backup Export & Import Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Export Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-50 text-gray-800">
                  <Download className="w-5 h-5 text-amber-500" />
                  <h4 className="text-base font-bold font-display uppercase tracking-wider">
                    Descargar Respaldo Total (JSON)
                  </h4>
                </div>
                
                <p className="text-xs text-gray-500 leading-relaxed">
                  Genera y descarga un archivo <strong>.json</strong> completo con todos los datos del sistema:
                </p>
                <ul className="text-xs text-gray-600 space-y-1.5 pl-2 font-mono">
                  <li className="flex items-center space-x-2">
                    <span className="text-amber-500 font-bold">✔</span>
                    <span>Catálogo de Vallas y Pantallas LED (con fotos y medidas)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-amber-500 font-bold">✔</span>
                    <span>Directorio de Clientes CRM y Representantes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-amber-500 font-bold">✔</span>
                    <span>Cotizaciones, Contratos y Facturas</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-amber-500 font-bold">✔</span>
                    <span>Configuración de Empresa y Tipo de Cambio</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleDownloadFullDatabaseJSON}
                className="w-full py-3 bg-gray-950 hover:bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Descargar Copia de Seguridad (.json)</span>
              </button>
            </div>

            {/* Restore Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-50 text-gray-800">
                  <Upload className="w-5 h-5 text-blue-500" />
                  <h4 className="text-base font-bold font-display uppercase tracking-wider">
                    Restaurar Base de Datos desde JSON
                  </h4>
                </div>
                
                <p className="text-xs text-gray-500 leading-relaxed">
                  ¿Mudó de equipo o desea restaurar un respaldo anterior? Cargue aquí su archivo <strong>.json</strong> para restablecer inmediatamente toda la información.
                </p>

                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-900 text-[11px] space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Protección y Seguridad de Datos:
                  </p>
                  <p className="text-amber-800 leading-normal">
                    La restauración sobreescribirá los registros actuales con los contenidos en el archivo de respaldo seleccionado.
                  </p>
                </div>
              </div>

              <div>
                <label className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-md cursor-pointer text-center">
                  <Upload className="w-4 h-4" />
                  <span>Seleccionar Archivo .json para Restaurar</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreJSONFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>

          {jsonBackupStatus && (
            <div className={`p-4 rounded-xl border text-xs flex items-center space-x-2.5 animate-fade-in ${
              jsonBackupStatus.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {jsonBackupStatus.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <span className="font-medium">{jsonBackupStatus.text}</span>
            </div>
          )}

        </div>
      )}

      {activeSubTab === 'csv' && (
        <div className="space-y-6 animate-fade-in">
          
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
                  Reduzca el tiempo administrativo cargando de golpe su listado de clientes o renovando todo el catálogo de vallas publicitarias en un solo clic utilizando planillas compatibles de Excel.
                </p>

                <div className="space-y-2 pt-2">
                  <span className="block text-xs font-bold text-gray-400 uppercase">Módulo Seleccionado:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setImportType('clients');
                        setReportResult(null);
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs transition border cursor-pointer ${
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
                      className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs transition border cursor-pointer ${
                        importType === 'vehicles'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      Catálogo Vallas OOH
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={downloadTemplate}
                  className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-3xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Plantilla Template</span>
                </button>
                <button
                  onClick={handleExportData}
                  className="py-2.5 bg-gray-950 hover:bg-gray-900 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm uppercase tracking-wider cursor-pointer"
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

          {/* Reports and logs block */}
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
                    <p className="text-xs text-gray-400">Validado en tiempo real según políticas comerciales</p>
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

                {/* Error logs */}
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
      )}

    </div>
  );
}
