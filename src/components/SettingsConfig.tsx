import React, { useState, useEffect } from 'react';
import { Settings, UserSession, UserRole, BackupRecord } from '../types';
import { mockDatabase } from '../data/mockDatabase';
import { 
  Settings as SettingsIcon, 
  Building2, 
  DollarSign, 
  Lock, 
  Database, 
  Users, 
  Check, 
  AlertCircle,
  Download,
  Upload,
  UserCheck,
  ShieldCheck,
  Globe,
  UserPlus,
  Type,
  Image as ImageIcon,
  Clock,
  RefreshCw,
  FileCheck,
  HardDrive,
  Sparkles,
  Calendar,
  Key,
  Trash2,
  Phone,
  ShieldAlert,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { DEFAULT_FIELD_LABELS } from '../utils/fieldLabels';
import { generateStaffUsername } from '../utils/credentials';

interface SettingsConfigProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  users: UserSession[];
  currentUser: UserSession;
  onSelectUser: (user: UserSession) => void;
  onDownloadBackup: () => void;
  onUploadBackup: (backupText: string) => boolean;
  onResetAll: () => void;
  onAddUser?: (user: Omit<UserSession, 'id'>) => void;
  onResetPassword?: (userId: string) => { success: boolean; newPassword?: string; error?: string };
  onChangeMyPassword?: (userId: string, newPass: string) => { success: boolean; error?: string };
  onDeleteUser?: (userId: string) => void;
}

export default function SettingsConfig({
  settings,
  onUpdateSettings,
  users,
  currentUser,
  onSelectUser,
  onDownloadBackup,
  onUploadBackup,
  onResetAll,
  onAddUser,
  onResetPassword,
  onChangeMyPassword,
  onDeleteUser
}: SettingsConfigProps) {
  
  const isDueno = currentUser.rol === 'Dueño';
  const isJefe = currentUser.rol === 'Jefe';
  const canManageUsers = isDueno || isJefe;

  // Local states for inputs
  const [empresa, setEmpresa] = useState(settings.nombre_empresa);
  const [direccion, setDireccion] = useState(settings.direccion);
  const [ciudad, setCiudad] = useState(settings.ciudad);
  const [departamento, setDepartamento] = useState(settings.departamento);
  const [telefono, setTelefono] = useState(settings.telefono);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [correo, setCorreo] = useState(settings.correo);
  const [web, setWeb] = useState(settings.web);
  const [tipoCambio, setTipoCambio] = useState(String(settings.tipo_cambio));
  const [terminos, setTerminos] = useState(settings.terminos_cotizacion);
  const [logoUrl, setLogoUrl] = useState(settings.logo || '');

  // Custom fields state
  const [customFields, setCustomFields] = useState<Record<string, string>>(settings.custom_fields || {});

  // Keep local states in sync when global settings update
  React.useEffect(() => {
    setEmpresa(settings.nombre_empresa);
    setDireccion(settings.direccion);
    setCiudad(settings.ciudad);
    setDepartamento(settings.departamento);
    setTelefono(settings.telefono);
    setWhatsapp(settings.whatsapp);
    setCorreo(settings.correo);
    setWeb(settings.web);
    setTipoCambio(String(settings.tipo_cambio));
    setTerminos(settings.terminos_cotizacion);
    setLogoUrl(settings.logo || '');
    setCustomFields(settings.custom_fields || {});
  }, [settings]);

  // New User Form State
  const [newNombres, setNewNombres] = useState('');
  const [newApellidos, setNewApellidos] = useState('');
  const [newCelular, setNewCelular] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newUsuario, setNewUsuario] = useState('');
  const [newRol, setNewRol] = useState<UserRole>(isDueno ? 'Jefe' : 'Vendedor');

  // Change Password Form State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passChangeStatus, setPassChangeStatus] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [resetPassStatus, setResetPassStatus] = useState<{ userId: string; text: string } | null>(null);

  // UI status feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldsSaveSuccess, setFieldsSaveSuccess] = useState(false);
  const [userSuccess, setUserSuccess] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState('');
  const [backupError, setBackupError] = useState('');

  // Auto-generate username when first name or last name change
  const handleNombresChange = (val: string) => {
    setNewNombres(val);
    const auto = generateStaffUsername(val, newApellidos);
    setNewUsuario(auto);
  };

  const handleApellidosChange = (val: string) => {
    setNewApellidos(val);
    const auto = generateStaffUsername(newNombres, val);
    setNewUsuario(auto);
  };

  // ----------------------------------------------------
  // AUTO BACKUP CONFIGURATION & MANAGEMENT STATE
  // ----------------------------------------------------
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(settings.backup_auto_enabled ?? true);
  const [backupIntervalHours, setBackupIntervalHours] = useState<number>(settings.backup_interval_hours ?? 24);
  const [backupOnChanges, setBackupOnChanges] = useState<boolean>(settings.backup_on_critical_change ?? true);
  const [lastBackupTime, setLastBackupTime] = useState<string>(mockDatabase.getLastBackupTimestamp());
  const [autoBackupsList, setAutoBackupsList] = useState<BackupRecord[]>(mockDatabase.getAutoBackups());

  // Refresh backup state
  const refreshBackupsList = () => {
    setAutoBackupsList(mockDatabase.getAutoBackups());
    setLastBackupTime(mockDatabase.getLastBackupTimestamp());
  };

  // Trigger immediate manual backup
  const handleGenerateBackupNow = () => {
    try {
      const bkp = mockDatabase.createAutoBackup('Respaldo manual desde Configuración');
      refreshBackupsList();
      setBackupSuccess('¡Copia de seguridad generada con éxito! ' + bkp.archivo);
      setTimeout(() => setBackupSuccess(''), 4000);
    } catch (e: any) {
      setBackupError('Error al generar respaldo: ' + (e.message || 'Error desconocido'));
    }
  };

  // Restore directly from latest stored auto-backup
  const handleRestoreFromLatest = () => {
    const lastBkp = mockDatabase.getLastBackup();
    if (!lastBkp) {
      setBackupError('No hay respaldos automáticos previos guardados en el sistema.');
      return;
    }

    if (confirm(`¿Está seguro de restaurar los datos desde el último respaldo guardado el ${new Date(lastBkp.fecha).toLocaleString('es-BO')}? Esta acción recuperará clientes, vallas, cotizaciones y contratos registrados hasta esa fecha.`)) {
      const ok = mockDatabase.restoreLatestBackup();
      if (ok) {
        setBackupSuccess('¡Base de datos restaurada con éxito desde el último backup! Recargando aplicación...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setBackupError('No se pudo restaurar la copia de seguridad.');
      }
    }
  };

  // Download specific backup record as JSON file
  const handleDownloadBackupFile = (bkp?: BackupRecord) => {
    try {
      const dataStr = bkp ? bkp.data : mockDatabase.exportBackup();
      const filename = bkp ? bkp.archivo : `PUBLIX_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setBackupSuccess('Archivo de respaldo descargado correctamente.');
      setTimeout(() => setBackupSuccess(''), 3000);
    } catch (e: any) {
      setBackupError('Error al descargar archivo: ' + e.message);
    }
  };

  // Save auto-backup preferences
  const handleSaveBackupSettings = (newEnabled: boolean, newInterval: number, newOnChanges: boolean) => {
    setAutoBackupEnabled(newEnabled);
    setBackupIntervalHours(newInterval);
    setBackupOnChanges(newOnChanges);

    onUpdateSettings({
      ...settings,
      backup_auto_enabled: newEnabled,
      backup_interval_hours: newInterval,
      backup_on_critical_change: newOnChanges
    });

    setBackupSuccess('Preferencias de respaldo automático guardadas correctamente.');
    setTimeout(() => setBackupSuccess(''), 3000);
  };

  // Handle submit settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDueno && !isJefe) return;
    setSaveSuccess(false);

    onUpdateSettings({
      ...settings,
      nombre_empresa: isDueno ? empresa.trim() : settings.nombre_empresa,
      direccion: isDueno ? direccion.trim() : settings.direccion,
      ciudad: isDueno ? ciudad.trim() : settings.ciudad,
      departamento: isDueno ? departamento.trim() : settings.departamento,
      pais: 'Bolivia',
      telefono: isDueno ? telefono.trim() : settings.telefono,
      whatsapp: isDueno ? whatsapp.trim() : settings.whatsapp,
      correo: isDueno ? correo.trim() : settings.correo,
      web: isDueno ? web.trim() : settings.web,
      logo: isDueno ? logoUrl.trim() : settings.logo,
      tipo_cambio: Number(tipoCambio) || 6.96,
      terminos_cotizacion: isDueno ? terminos.trim() : settings.terminos_cotizacion,
      custom_fields: settings.custom_fields || {}
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Handle Logo local file upload (converts to base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDueno) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1.5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Por favor, cargue un logotipo de menos de 1.5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setLogoUrl(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save customized fields renaming
  const handleSaveFieldsCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDueno) return;
    setFieldsSaveSuccess(false);

    onUpdateSettings({
      ...settings,
      custom_fields: customFields
    });

    setFieldsSaveSuccess(true);
    setTimeout(() => setFieldsSaveSuccess(false), 2000);
  };

  // Create new user with auto @usuario and default password (celular)
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers || !onAddUser) return;

    if (!newNombres.trim() || !newApellidos.trim()) {
      alert('Por favor complete los nombres y apellidos del nuevo asesor.');
      return;
    }

    if (!newCelular.trim()) {
      alert('Por favor ingrese el número de celular (será su contraseña de acceso por defecto).');
      return;
    }

    const calculatedUser = (newUsuario.trim() || generateStaffUsername(newNombres, newApellidos)).toLowerCase();
    const fullName = `${newNombres.trim()} ${newApellidos.trim()}`;
    const roleToCreate = isDueno ? newRol : 'Vendedor';
    const cleanPhone = newCelular.trim();
    const defaultPassword = cleanPhone.replace(/\D/g, '') || cleanPhone;

    onAddUser({
      nombre: fullName,
      nombres: newNombres.trim(),
      apellidos: newApellidos.trim(),
      usuario: calculatedUser,
      celular: cleanPhone,
      email: newEmail.trim() || undefined,
      password: defaultPassword,
      rol: roleToCreate,
      estado: 'Activo'
    });

    setUserSuccess(true);
    setNewNombres('');
    setNewApellidos('');
    setNewCelular('');
    setNewEmail('');
    setNewUsuario('');
    setNewRol(isDueno ? 'Jefe' : 'Vendedor');
    setTimeout(() => setUserSuccess(false), 4000);
  };

  // Admin / Dueño resets user password to their cellphone number
  const handleResetUserPasswordClick = (userToReset: UserSession) => {
    if (!isDueno) {
      alert('Sólo el Administrador / Dueño general tiene privilegios para restablecer contraseñas de otros usuarios.');
      return;
    }

    const confirmMsg = `¿Está seguro de restablecer la contraseña del usuario @${userToReset.usuario} (${userToReset.nombre}) a su contraseña por defecto (número de celular: ${userToReset.celular || '70000000'})?`;
    if (!confirm(confirmMsg)) return;

    if (onResetPassword) {
      const res = onResetPassword(userToReset.id);
      if (res.success) {
        setResetPassStatus({
          userId: userToReset.id,
          text: `¡Contraseña de @${userToReset.usuario} restablecida a su celular (${res.newPassword})!`
        });
        setTimeout(() => setResetPassStatus(null), 5000);
      } else {
        alert(res.error || 'Error al restablecer la contraseña.');
      }
    }
  };

  // Active user changes their own password
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeStatus(null);

    if (!newPass.trim()) {
      setPassChangeStatus({ text: 'Por favor ingrese su nueva contraseña.', type: 'error' });
      return;
    }

    if (newPass.trim().length < 4) {
      setPassChangeStatus({ text: 'La nueva contraseña debe tener al menos 4 caracteres.', type: 'error' });
      return;
    }

    if (newPass !== confirmPass) {
      setPassChangeStatus({ text: 'La nueva contraseña y su confirmación no coinciden.', type: 'error' });
      return;
    }

    if (onChangeMyPassword) {
      const res = onChangeMyPassword(currentUser.id, newPass.trim());
      if (res.success) {
        setPassChangeStatus({ text: '¡Su contraseña ha sido modificada y actualizada con éxito!', type: 'success' });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => setPassChangeStatus(null), 4500);
      } else {
        setPassChangeStatus({ text: res.error || 'Error al modificar contraseña.', type: 'error' });
      }
    }
  };

  // Delete user
  const handleDeleteUserClick = (userToDelete: UserSession) => {
    if (!isDueno) return;
    if (userToDelete.rol === 'Dueño') {
      alert('No es posible eliminar la cuenta del Dueño / Administrador principal.');
      return;
    }
    if (confirm(`¿Está seguro de eliminar al usuario @${userToDelete.usuario} (${userToDelete.nombre}) del sistema?`)) {
      if (onDeleteUser) {
        onDeleteUser(userToDelete.id);
      }
    }
  };

  // Reset custom fields to default
  const handleResetCustomFields = () => {
    if (!isDueno) return;
    if (confirm('¿Está seguro de restablecer los nombres de todos los campos a su valor por defecto?')) {
      setCustomFields({});
      onUpdateSettings({
        ...settings,
        custom_fields: {}
      });
      setFieldsSaveSuccess(true);
      setTimeout(() => setFieldsSaveSuccess(false), 2000);
    }
  };

  // Process file upload backup
  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupSuccess('');
    setBackupError('');

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const success = onUploadBackup(text);
          if (success) {
            setBackupSuccess('La base de datos fue restaurada con éxito. Recargando la vista...');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            setBackupError('El archivo no es una copia de seguridad válida para PUBLI-X BOLIVIA.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6" id="settings-view">
      
      {/* Top Warning Banner for roles without editing permissions */}
      {!isDueno && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start space-x-3 shadow-3xs">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider text-[11px]">Modo de Lectura Configuración Activo ({currentUser.rol})</p>
            <p className="text-amber-800 leading-normal">
              Como <strong>{currentUser.rol}</strong>, no tiene privilegios para modificar la identidad corporativa, logotipo o los nombres de los campos de la plataforma. Estas modificaciones están reservadas exclusivamente para el rol de <strong>Dueño</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Settings Form (Only editable for Dueño) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General settings form */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 text-gray-700 mb-5 justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-gray-800 font-display uppercase tracking-wider">Identidad y Parámetros PUBLI-X BOLIVIA</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-500">Solo Dueño</span>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center space-x-2 animate-fade-in">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>Configuración e identidad comercial actualizadas con éxito.</span>
                </div>
              )}

              {/* Logo customization panel inside Settings */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Logotipo Corporativo de la Empresa</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {logoUrl ? 'Logotipo Personalizado' : 'Logotipo Predeterminado'}
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-5">
                  {/* Logo Preview Box */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-2xl border border-slate-700 w-full md:w-56 h-32 shrink-0 shadow-sm relative group overflow-hidden">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Vista Previa Logotipo" 
                        className="max-h-24 max-w-full object-contain filter drop-shadow-md" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="text-center space-y-1">
                        <span className="text-2xl">🏢</span>
                        <p className="text-[11px] text-amber-400 font-extrabold uppercase">Logo Oficial por Defecto</p>
                      </div>
                    )}
                    <span className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-400">Vista previa</span>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex-1 w-full space-y-3">
                    {(isDueno || isJefe) ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition flex items-center space-x-2 cursor-pointer shadow-sm uppercase tracking-wider">
                            <Upload className="w-4 h-4 text-slate-950" />
                            <span>Subir Archivo de Imagen</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                          </label>

                          {logoUrl && (
                            <button
                              type="button"
                              onClick={() => setLogoUrl('')}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Usar Logo Predeterminado
                            </button>
                          )}
                        </div>

                        {/* URL input option */}
                        <div className="space-y-1 pt-1">
                          <label className="block text-[11px] font-bold text-slate-600">
                            O Ingrese la URL Web Directa del Logotipo:
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="url"
                              value={logoUrl}
                              onChange={(e) => setLogoUrl(e.target.value)}
                              placeholder="https://ejemplo.com/mi-logotipo.png"
                              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 font-mono"
                            />
                            {logoUrl && (
                              <button
                                type="button"
                                onClick={() => setLogoUrl('')}
                                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
                              >
                                Limpiar
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 leading-snug">
                          💡 <strong>Consejo:</strong> Puede subir una imagen en formato PNG, JPG o WEBP desde su equipo o pegar un enlace web directo. Este logotipo se aplicará automáticamente en la barra superior del sistema, catálogo, proformas en PDF y contratos.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Logotipo corporativo configurado en la plataforma. Solo administradores pueden modificarlo.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre Comercial de la Empresa</label>
                  <input
                    type="text"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                    disabled={!isDueno}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 mb-1">
                    Cotización del Dólar de hoy (Bs. por 1 USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xs font-bold">Bs.</span>
                    <input
                      type="text"
                      value={tipoCambio}
                      onChange={(e) => setTipoCambio(e.target.value)}
                      placeholder="Ej. 10.10"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-amber-50/60 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 font-mono font-bold text-amber-800 disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
                      required
                      disabled={!isDueno && !isJefe}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {isDueno || isJefe 
                      ? 'Defina la tasa oficial (ej: 10.10). Se aplicará automáticamente a todos los precios en Bolivianos.'
                      : 'Protegido: Modificable únicamente por el Dueño o el Jefe.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Dirección de Oficina / Showroom</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!isDueno}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!isDueno}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Departamento</label>
                    <input
                      type="text"
                      value={departamento}
                      onChange={(e) => setDepartamento(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!isDueno}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono Corporativo</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!isDueno}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">WhatsApp Oficial para Envíos</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!isDueno}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Correo Electrónico Comercial</label>
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!isDueno}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Sitio Web Institucional</label>
                  <input
                    type="text"
                    value={web}
                    onChange={(e) => setWeb(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!isDueno}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Términos, Cláusulas y Garantías del Servicio en Cotizaciones PDF</label>
                <textarea
                  value={terminos}
                  onChange={(e) => setTerminos(e.target.value)}
                  rows={5}
                  className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 font-sans leading-relaxed text-gray-600 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!isDueno}
                />
              </div>

              {(isDueno || isJefe) && (
                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-xs uppercase tracking-wider cursor-pointer"
                  >
                    Guardar Configuración General
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* ---------------------------------------------------- */}
          {/* CUSTOMIZABLE FIELD NAMES PANEL (DUEÑO EXCLUSIVE) */}
          {/* ---------------------------------------------------- */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 text-gray-700 mb-5 justify-between">
              <div className="flex items-center space-x-2">
                <Type className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-gray-800 font-display uppercase tracking-wider">Modificar los Nombres de todos los Campos</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">Solo Dueño</span>
            </div>

            {fieldsSaveSuccess && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Nombres de campos personalizados y propagados en todo el sistema.</span>
              </div>
            )}

            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Como <strong>Dueño</strong>, puede renombrar cualquier campo clave del sistema de Vallas, Pantallas LED y CRM (por ejemplo, cambiar "Tipo de Estructura" por "Formato OOH", o "Presupuesto" por "Inversión Comercial"). Las etiquetas modificadas se propagarán de forma automática en los formularios, tablas, filtros y reportes de la plataforma.
            </p>

            <form onSubmit={handleSaveFieldsCustomization} className="space-y-6">
              
              {/* Vallas / OOH custom fields group */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block border-l-2 border-amber-500 pl-2">Campos del Catálogo de Vallas y Espacios Publicitarios OOH</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(DEFAULT_FIELD_LABELS)
                    .filter(key => key.startsWith('vehicle_'))
                    .map(key => (
                      <div key={key}>
                        <label className="block text-[11px] font-medium text-gray-400 mb-1">
                          Defecto: <span className="font-bold text-gray-500">"{DEFAULT_FIELD_LABELS[key]}"</span>
                        </label>
                        <input
                          type="text"
                          value={customFields[key] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomFields(prev => ({ ...prev, [key]: val }));
                          }}
                          placeholder={DEFAULT_FIELD_LABELS[key]}
                          disabled={!isDueno}
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* Client custom fields group */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block border-l-2 border-indigo-500 pl-2">Campos del Ficha Técnica de Clientes CRM</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(DEFAULT_FIELD_LABELS)
                    .filter(key => key.startsWith('client_'))
                    .map(key => (
                      <div key={key}>
                        <label className="block text-[11px] font-medium text-gray-400 mb-1">
                          Defecto: <span className="font-bold text-gray-500">"{DEFAULT_FIELD_LABELS[key]}"</span>
                        </label>
                        <input
                          type="text"
                          value={customFields[key] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomFields(prev => ({ ...prev, [key]: val }));
                          }}
                          placeholder={DEFAULT_FIELD_LABELS[key]}
                          disabled={!isDueno}
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    ))}
                </div>
              </div>

              {isDueno && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleResetCustomFields}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold uppercase tracking-wider transition"
                  >
                    Restablecer Nombres por Defecto
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs uppercase tracking-wider cursor-pointer"
                  >
                    Guardar Nombres de Campos
                  </button>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Right Columns: Role Selector + User Management + Password Control + Backups */}
        <div className="space-y-6">
          
          {/* ---------------------------------------------------- */}
          {/* USER DIRECTORY & ACCESS CONTROL PANEL */}
          {/* ---------------------------------------------------- */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4" id="users-directory-panel">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 text-gray-700 justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-display">
                  Gestión de Usuarios y Permisos
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                {users.length} Registrados
              </span>
            </div>

            {resetPassStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center space-x-2 font-medium animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{resetPassStatus.text}</span>
              </div>
            )}

            <p className="text-xs text-gray-500 leading-normal">
              Seleccione un perfil para simular su entorno de trabajo o administre sus credenciales y permisos:
            </p>

            {/* List of registered users with role and Admin actions */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {users.map(user => {
                const isSelected = currentUser.id === user.id;
                const canReset = isDueno;
                const canDelete = isDueno && user.rol !== 'Dueño';

                return (
                  <div
                    key={user.id}
                    className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isSelected 
                        ? 'border-indigo-300 bg-indigo-50/60 shadow-2xs ring-1 ring-indigo-200' 
                        : 'border-gray-200 bg-gray-50/80 hover:bg-gray-100/80'
                    }`}
                  >
                    <div 
                      className="cursor-pointer flex-1"
                      onClick={() => onSelectUser(user)}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-gray-900">{user.nombre}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-indigo-600 text-white rounded-full font-bold">
                            Activo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-gray-500">
                        <span className="font-mono text-indigo-700 font-bold">@{user.usuario}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1 text-gray-600">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{user.celular || 'Sin celular'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 self-end sm:self-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase border ${
                        user.rol === 'Dueño' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                        user.rol === 'Jefe' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {user.rol}
                      </span>

                      {/* Admin-only: Restablecer contraseña por defecto (USER REQUIREMENT) */}
                      {canReset && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetUserPasswordClick(user);
                          }}
                          className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-700 border border-gray-200 hover:border-amber-300 transition text-[10px] font-bold flex items-center space-x-1 shadow-3xs cursor-pointer"
                          title={`Restablecer contraseña de @${user.usuario} a su número de celular`}
                        >
                          <Key className="w-3.5 h-3.5 text-amber-600" />
                          <span className="hidden xl:inline">Restablecer</span>
                        </button>
                      )}

                      {/* Admin-only: Delete user */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUserClick(user);
                          }}
                          className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-gray-200 hover:border-rose-300 transition shadow-3xs cursor-pointer"
                          title="Eliminar usuario del sistema"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Privileges box based on selected user */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
                Privilegios para rol <strong className="text-indigo-700">{currentUser.rol}</strong>:
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
                {currentUser.rol === 'Dueño' && (
                  <>
                    <li><strong>Control total</strong> de base de datos, precios y backups</li>
                    <li><strong>Crear usuarios</strong> (Jefes, Vendedores, Dueños)</li>
                    <li><strong>Restablecer contraseñas</strong> de cualquier usuario</li>
                    <li>Historial de auditoría completo</li>
                  </>
                )}
                {currentUser.rol === 'Jefe' && (
                  <>
                    <li>Auditoría comercial y aprobación de descuentos</li>
                    <li><strong>Agregar únicamente usuarios Vendedores</strong></li>
                    <li>Cambiar su propia contraseña de acceso</li>
                  </>
                )}
                {currentUser.rol === 'Vendedor' && (
                  <>
                    <li>Gestión de clientes y catálogo de vallas</li>
                    <li>Emisión de cotizaciones y catálogos en PDF</li>
                    <li>Cambiar su propia contraseña de acceso</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* CAMBIAR MI CONTRASEÑA (USER REQUIREMENT) */}
          {/* ---------------------------------------------------- */}
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-xs space-y-4" id="change-my-password-panel">
            <div className="flex items-center space-x-2 pb-3 border-b border-indigo-50 text-indigo-900 justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-display text-gray-900">
                  Cambiar Mi Contraseña (@{currentUser.usuario})
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                Seguridad
              </span>
            </div>

            {passChangeStatus && (
              <div className={`p-3 text-xs rounded-xl flex items-center space-x-2 font-medium ${
                passChangeStatus.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {passChangeStatus.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{passChangeStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full pl-3 pr-9 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Repita la nueva contraseña"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer uppercase tracking-wider"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Actualizar Mi Contraseña</span>
              </button>
            </form>
          </div>

          {/* ---------------------------------------------------- */}
          {/* USER CREATION PANEL WITH AUTO @USUARIO & CELULAR PASS */}
          {/* ---------------------------------------------------- */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-4 animate-fade-in" id="admin-user-registration-form">
            <div className="flex items-center space-x-2 pb-3 border-b border-amber-100 text-amber-900 justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-wider font-display">
                  Formulario de Registro: Asesores y Gerentes
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                Administración
              </span>
            </div>

            {userSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center space-x-2 font-medium">
                <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>¡Asesor/Usuario creado y registrado correctamente con su contraseña por defecto!</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Nombres <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newNombres}
                    onChange={(e) => handleNombresChange(e.target.value)}
                    placeholder="Ej. Mariana"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Apellidos <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newApellidos}
                    onChange={(e) => handleApellidosChange(e.target.value)}
                    placeholder="Ej. Suárez Arce"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Número de Celular <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel"
                    value={newCelular}
                    onChange={(e) => setNewCelular(e.target.value)}
                    placeholder="Ej. +591 71234567"
                    className="w-full pl-8 pr-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                    required
                  />
                </div>
                <p className="text-[10px] text-amber-800 mt-1 font-medium flex items-center space-x-1">
                  <Key className="w-3 h-3 text-amber-600" />
                  <span>La contraseña inicial será automáticamente su número de celular.</span>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Nombre de Usuario (@Usuario auto-generado)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-mono text-xs font-bold">@</span>
                  <input
                    type="text"
                    value={newUsuario}
                    onChange={(e) => setNewUsuario(e.target.value)}
                    placeholder="mariana.suarez"
                    className="w-full pl-7 pr-3.5 py-2 text-xs bg-amber-50/50 border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono font-bold text-amber-950"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Fórmula automática: <code className="text-amber-800 font-mono">primer_nombre.primer_apellido</code> (modificable si se requiere).
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Rol y Nivel de Permisos</label>
                {isDueno ? (
                  <select
                    value={newRol}
                    onChange={(e) => setNewRol(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-gray-800"
                  >
                    <option value="Vendedor">Vendedor / Asesor Comercial (Gestión de Clientes y Cotizaciones)</option>
                    <option value="Jefe">Jefe / Gerente Comercial (Aprobación de Descuentos, Gestión de Vendedores)</option>
                    <option value="Dueño">Dueño / Administrador General (Control Total del Sistema)</option>
                  </select>
                ) : (
                  <div className="space-y-1">
                    <select
                      value="Vendedor"
                      disabled
                      className="w-full px-3.5 py-2 text-xs bg-amber-50/60 border border-amber-200 rounded-xl font-bold text-amber-900 cursor-not-allowed"
                    >
                      <option value="Vendedor">Vendedor / Asesor de Cuentas (Único rol permitido para Gerente)</option>
                    </select>
                    <p className="text-[10px] text-amber-800 font-medium">
                      🔒 <strong>Regla de Jerarquía:</strong> Como Gerente únicamente tiene permiso para agregar Vendedores / Asesores.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer uppercase tracking-wider"
              >
                <UserPlus className="w-4 h-4" />
                <span>Registrar Asesor en la Plataforma</span>
              </button>
            </form>
          </div>

          {/* ---------------------------------------------------- */}
          {/* SISTEMA DE BACKUP AUTOMÁTICO & RESTAURACIÓN COMPLETA */}
          {/* ---------------------------------------------------- */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5" id="backup-system-panel">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 text-slate-800 justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
                    Sistema de Backup Automático & Resguardo de Datos
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Respaldo íntegro de clientes, vallas, cotizaciones, agenda, bitácora y configuración
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Offline + Cloud
              </span>
            </div>

            {/* Visible "Fecha y hora del último backup realizado" (USER REQUIREMENT) */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-xl border border-slate-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Fecha y Hora del Último Backup Realizado</span>
                </span>
                <div className="text-sm sm:text-base font-black font-mono text-white">
                  {lastBackupTime ? new Date(lastBackupTime).toLocaleString('es-BO', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  }) : 'Ninguno registrado aún'}
                </div>
                <p className="text-[10px] text-slate-400">
                  {autoBackupsList.length} copias guardadas en el historial local del sistema
                </p>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleGenerateBackupNow}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition flex items-center space-x-1.5 shadow-xs cursor-pointer flex-1 sm:flex-none justify-center"
                  title="Generar snapshot de respaldo ahora mismo"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Crear Backup Ahora</span>
                </button>
              </div>
            </div>

            {/* Notifications */}
            {backupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{backupError}</span>
              </div>
            )}
            {backupSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center space-x-2 font-medium">
                <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{backupSuccess}</span>
              </div>
            )}

            {/* Configurable Periodic Backup Settings (USER REQUIREMENT) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <SettingsIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>Configuración de Frecuencia y Automatización</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoBackupEnabled}
                    onChange={(e) => handleSaveBackupSettings(e.target.checked, backupIntervalHours, backupOnChanges)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 cursor-pointer"
                  />
                  <span>Habilitar Respaldo Automático Periódico</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backupOnChanges}
                    onChange={(e) => handleSaveBackupSettings(autoBackupEnabled, backupIntervalHours, e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 cursor-pointer"
                  />
                  <span>Respaldar ante cambios importantes</span>
                </label>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-slate-200/60">
                <label className="text-xs font-bold text-slate-600">
                  Frecuencia de Respaldo Programado:
                </label>
                <select
                  value={backupIntervalHours}
                  onChange={(e) => handleSaveBackupSettings(autoBackupEnabled, Number(e.target.value), backupOnChanges)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value={6}>Cada 6 horas</option>
                  <option value={12}>Cada 12 horas</option>
                  <option value={24}>Cada 24 horas (Recomendado)</option>
                  <option value={48}>Cada 48 horas</option>
                  <option value={168}>Cada 7 días</option>
                </select>
              </div>
            </div>

            {/* Quick Action Buttons (USER REQUIREMENTS: Download latest, restore from latest, upload JSON) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Botón 1: Descargar manualmente el último backup generado */}
              <button
                type="button"
                onClick={() => handleDownloadBackupFile()}
                className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer uppercase tracking-tight"
                title="Descargar el último archivo JSON con todos los datos"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Descargar Último Backup JSON</span>
              </button>

              {/* Botón 2: Restaurar desde el último backup guardado */}
              <button
                type="button"
                onClick={handleRestoreFromLatest}
                className="p-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer uppercase tracking-tight"
                title="Restaurar el estado de los datos a la última copia guardada"
              >
                <RefreshCw className="w-4 h-4 text-slate-950" />
                <span>Restaurar desde Último Backup</span>
              </button>

              {/* Botón 3: Subir archivo y restaurar */}
              <label className="p-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-2xs uppercase tracking-tight">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Subir y Restaurar Archivo JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupUpload}
                  className="hidden"
                />
              </label>

              {/* Botón 4: Restablecer base de fábrica */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿ATENCIÓN: Está completamente seguro de restablecer de fábrica la base de datos de PUBLI-X BOLIVIA? Esto restablecerá todos los datos a la configuración inicial estándar.')) {
                    onResetAll();
                  }
                }}
                className="p-3 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-tight"
              >
                <Lock className="w-4 h-4" />
                <span>Restablecer Datos de Fábrica</span>
              </button>

            </div>

            {/* Snapshot History Table */}
            {autoBackupsList.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Historial de Backups Locales ({autoBackupsList.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Almacenamiento seguro en navegador</span>
                </h4>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {autoBackupsList.map((bkp) => (
                    <div 
                      key={bkp.id}
                      className="p-2.5 bg-slate-50 hover:bg-amber-50/50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs transition"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center space-x-2">
                          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(bkp.fecha).toLocaleString('es-BO')}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                            {(bkp.tamano / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{bkp.observaciones}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadBackupFile(bkp)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                        title="Descargar este archivo"
                      >
                        <Download className="w-3 h-3 text-amber-500" />
                        <span>Bajar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
