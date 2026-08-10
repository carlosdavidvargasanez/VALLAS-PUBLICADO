import React, { useState } from 'react';
import { Settings, UserSession, UserRole } from '../types';
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
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { DEFAULT_FIELD_LABELS } from '../utils/fieldLabels';

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
  onAddUser
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
  const [newNombre, setNewNombre] = useState('');
  const [newUsuario, setNewUsuario] = useState('');
  const [newRol, setNewRol] = useState<UserRole>(isDueno ? 'Jefe' : 'Vendedor');

  // UI status feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldsSaveSuccess, setFieldsSaveSuccess] = useState(false);
  const [userSuccess, setUserSuccess] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState('');
  const [backupError, setBackupError] = useState('');

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

  // Create new user
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers || !onAddUser) return;

    if (!newNombre.trim() || !newUsuario.trim()) {
      alert('Por favor complete todos los campos para el nuevo usuario.');
      return;
    }

    // Role safety restrictions: Jefe can only create Vendedores
    const roleToCreate = isDueno ? newRol : 'Vendedor';

    onAddUser({
      nombre: newNombre.trim(),
      usuario: newUsuario.trim().toLowerCase(),
      rol: roleToCreate,
      estado: 'Activo'
    });

    setUserSuccess(true);
    setNewNombre('');
    setNewUsuario('');
    setNewRol(isDueno ? 'Jefe' : 'Vendedor');
    setTimeout(() => setUserSuccess(false), 3000);
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
            setBackupError('El archivo no es una copia de seguridad válida para VALLAS & LED BOLIVIA.');
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
                <h3 className="text-base font-bold text-gray-800 font-display uppercase tracking-wider">Identidad y Parámetros VALLAS & LED BOLIVIA</h3>
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
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Logotipo Corporativo</span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden bg-white flex items-center justify-center p-1 shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-[10px] text-gray-400 font-bold">Sin Logo</span>
                    )}
                  </div>
                  
                  <div className="flex-1 w-full space-y-2">
                    {isDueno ? (
                      <>
                        <div className="flex space-x-2">
                          <label className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-3xs uppercase">
                            <Upload className="w-3.5 h-3.5 text-amber-500" />
                            <span>Cargar Logotipo (.png / .jpg)</span>
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
                              className="px-3 py-2 border border-transparent hover:border-gray-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          Seleccione una imagen cuadrada de su computadora (máximo 1.5MB). Se codificará en la base de datos local y se aplicará en todo el sistema.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Logotipo corporativo configurado en la plataforma.</p>
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
              Como <strong>Dueño</strong>, puede renombrar cualquier campo clave del sistema (por ejemplo, cambiar "Marca" por "Fabricante", o "Presupuesto" por "Capital de Inversión"). Las etiquetas modificadas se propagarán de forma automática en los formularios, tablas, filtros y reportes de la plataforma.
            </p>

            <form onSubmit={handleSaveFieldsCustomization} className="space-y-6">
              
              {/* Vehicle custom fields group */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block border-l-2 border-amber-500 pl-2">Campos del Catálogo de Vehículos</span>
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

        {/* Right Columns: Role Selector + Backups and DB admin */}
        <div className="space-y-6">
          
          {/* Simulated User Selector */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 text-gray-700">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-display">Control de Acceso y Roles</h3>
            </div>

            <p className="text-xs text-gray-400 leading-normal">
              Simule el acceso de distintos asesores comerciales para comprobar las políticas de visualización de VALLAS & LED BOLIVIA:
            </p>

            <div className="space-y-2">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition flex items-center justify-between ${
                    currentUser.id === user.id 
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-800' 
                      : 'border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-sm">{user.nombre}</span>
                    <span className="text-[10px] text-gray-400 font-mono">@{user.usuario}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                    user.rol === 'Dueño' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                    user.rol === 'Jefe' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {user.rol}
                  </span>
                </button>
              ))}
            </div>

            {/* Privileges box based on selected user */}
            <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100 text-xs space-y-1.5">
              <span className="font-bold text-gray-700 block text-[10px] uppercase tracking-wider">Permisos habilitados:</span>
              <ul className="list-disc pl-4 space-y-1 text-gray-500 text-[11px]">
                {currentUser.rol === 'Dueño' && (
                  <>
                    <li><strong>Control total de base de datos</strong> y backups</li>
                    <li><strong>Personalizar nombres de todos los campos</strong></li>
                    <li>Cargar/modificar el logotipo de la empresa</li>
                    <li>Modificar y establecer precios base</li>
                    <li><strong>Crear usuarios de todo nivel (Jefes, Vendedores)</strong></li>
                    <li>Historial de auditoría completo y Logs</li>
                  </>
                )}
                {currentUser.rol === 'Jefe' && (
                  <>
                    <li>Visualización y auditoría de cartera comercial</li>
                    <li><strong>Modificar precios aplicando rebajas</strong></li>
                    <li>Guardar y rastrear historial de descuentos</li>
                    <li><strong>Agregar únicamente usuarios Vendedores</strong></li>
                    <li>Seguimientos y agenda de actividades de venta</li>
                  </>
                )}
                {currentUser.rol === 'Vendedor' && (
                  <>
                    <li>Gestión de clientes y registros en el CRM</li>
                    <li>Lectura del catálogo y envío por WhatsApp</li>
                    <li>Generar catálogos en PDF / PPTX con códigos únicos</li>
                    <li>Bloqueo estricto de edición de precios o parámetros</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* USER CREATION PANEL FOR ADMIN / DUEÑO / JEFE */}
          {/* ---------------------------------------------------- */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-4 animate-fade-in" id="admin-user-registration-form">
            <div className="flex items-center space-x-2 pb-3 border-b border-amber-100 text-amber-900 justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-wider font-display">
                  Formulario de Registro: Gerente y Vendedores
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                Administración
              </span>
            </div>

            {userSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center space-x-2 font-medium">
                <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>¡Asesor/Usuario creado y registrado correctamente en el sistema!</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Nombre Completo del Asesor</label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej. Roberto Arce Claure"
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Nombre de Usuario (@Alias para acceso)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-mono text-xs font-bold">@</span>
                  <input
                    type="text"
                    value={newUsuario}
                    onChange={(e) => setNewUsuario(e.target.value)}
                    placeholder="roberto.gerente"
                    className="w-full pl-7 pr-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Rol y Nivel de Permisos a Asignar</label>
                {isDueno ? (
                  <select
                    value={newRol}
                    onChange={(e) => setNewRol(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-gray-800"
                  >
                    <option value="Jefe">Jefe / Gerente Comercial (Aprobación de Descuentos, Gestión de Vendedores)</option>
                    <option value="Vendedor">Vendedor / Asesor de Cuentas (Gestión Comercial de Clientes)</option>
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
                      🔒 <strong>Regla de Jerarquía:</strong> Como Gerente únicamente tiene permiso para agregar Vendedores / Asesores. La asignación de Gerentes o Administradores es exclusiva del Dueño.
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

          {/* Backup Database and Restore triggers (CRITICAL CAPABILITY SPECIFIED IN MANUAL) */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 text-gray-700">
              <Database className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-display">Respaldos SQLite Offline</h3>
            </div>

            <p className="text-xs text-gray-400 leading-normal">
              Exporte el estado actual del CRM como una copia de seguridad íntegra en formato JSON compatible para resguardar la información:
            </p>

            {backupError && (
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{backupError}</span>
              </div>
            )}
            {backupSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] rounded-lg flex items-center space-x-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{backupSuccess}</span>
              </div>
            )}

            <div className="space-y-2">
              {/* Download Backup */}
              <button
                onClick={onDownloadBackup}
                className="w-full py-2 px-4 bg-gray-900 text-white rounded-lg text-xs font-bold transition hover:bg-gray-800 flex items-center justify-center space-x-1.5 uppercase"
              >
                <Download className="w-4 h-4 text-amber-500" />
                <span>Descargar Copia JSON</span>
              </button>

              {/* Upload Backup */}
              <label className="w-full py-2 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-3xs uppercase">
                <Upload className="w-4 h-4 text-emerald-500" />
                <span>Restaurar Copia JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleBackupUpload}
                  className="hidden"
                />
              </label>

              {/* Hard reset */}
              <button
                onClick={() => {
                  if (confirm('¿ATENCIÓN: Está completamente seguro de restablecer de fábrica la base de datos de VALLAS & LED BOLIVIA? Esto borrará todas las cotizaciones, campos personalizados y usuarios nuevos, y re-generará la base de datos con 350 prospectos de clientes y 350 estructuras del catálogo.')) {
                    onResetAll();
                  }
                }}
                className="w-full py-2.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 uppercase cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Formatear a Base de Alta Capacidad</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
