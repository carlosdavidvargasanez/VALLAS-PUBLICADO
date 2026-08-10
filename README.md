# MLA AutoSender 🚗💨

MLA AutoSender es un sistema CRM y de envío comercial automatizado de vanguardia para la gestión de clientes, seguimiento de importaciones y comunicación para vehículos de alta gama de **MLA AUTOMOTORS**. El sistema está construido con React 19, TypeScript, Tailwind CSS v4, Motion y Lucide Icons.

---

## 🚀 ¿Cómo descargar e instalar el proyecto?

Para instalar y ejecutar MLA AutoSender localmente en tu ordenador, sigue estos sencillos pasos:

### 1. Descargar el código fuente
Puedes exportar y descargar este proyecto directamente desde la interfaz de **Google AI Studio**:
1. Haz clic en el botón de **Configuración (Settings)** o el menú de exportación en la esquina superior derecha.
2. Selecciona **Export to ZIP** (Exportar como archivo ZIP) o conéctalo con tu repositorio de **GitHub**.
3. Guarda y descomprime el archivo ZIP en una carpeta de tu ordenador.

### 2. Requisitos Previos
Asegúrate de tener instalado **Node.js** (versión 18 o superior recomendada) y un gestor de paquetes como **npm** (que viene incluido con Node.js).
- Puedes descargar Node.js desde su sitio web oficial: [nodejs.org](https://nodejs.org/)

### 3. Instalación de Dependencias
Abre tu terminal de comandos (Terminal en Mac/Linux, o PowerShell / Símbolo del Sistema en Windows), navega hasta la carpeta del proyecto descomprimido y ejecuta:

```bash
# Navegar a la carpeta (ejemplo)
cd mla-autosender

# Instalar todas las dependencias necesarias
npm install
```

### 4. Ejecutar en Modo Desarrollo (Local)
Una vez completada la instalación, inicia el servidor de desarrollo local con:

```bash
npm run dev
```

Esto iniciará el servidor web. Abre tu navegador e ingresa a:
👉 **`http://localhost:3000`** (o el puerto que te indique la consola) para ver y probar la aplicación en tiempo real con cambios instantáneos.

---

## 📦 Producción y Despliegue en la Web

### Crear la versión de producción optimizada
Si quieres subir la aplicación a un servidor web definitivo o compartirla de forma profesional, genera la versión de producción compilada ejecutando:

```bash
npm run build
```

Este comando creará una carpeta llamada **`dist/`** en la raíz de tu proyecto. 

### ¿Dónde puedo alojar la carpeta `dist/` de forma gratuita?
Al ser una aplicación web de tipo SPA (Single Page Application) cliente-servidor en el navegador, la carpeta `dist/` contiene archivos estáticos ultra-eficientes (HTML, CSS y JS). Puedes subir el contenido de la carpeta `dist/` gratis a:
- **Netlify** (Arrastrando y soltando la carpeta `dist`)
- **Vercel** (A través de su interfaz o CLI)
- **GitHub Pages** (Ideal si tienes el código en GitHub)
- **Cloud Run / Firebase Hosting**

---

## ✨ Características Principales de MLA AutoSender
- **Panel de Control (Dashboard)**: Estadísticas clave de clientes en seguimiento, cotizaciones activas, vehículos importados y estado de tareas.
- **Gestor de Clientes (CRM)**: Registro detallado de clientes, su estatus comercial, vehículos de interés y enlaces rápidos.
- **Gestión de Vehículos**: Visualización y gestión de la flota de importación con filtros por marca, modelo, año, precio y origen.
- **Cotizador Inteligente (Quotations)**: Diseña propuestas de precios detalladas (FOB, flete, impuestos, honorarios de importación, etc.) con exportación rápida.
- **Agenda y Seguimiento (Follow-ups)**: Calendario de actividades, recordatorios, y asignación de tareas con notificaciones.
- **Envío Automatizado por WhatsApp**: Motor de mensajería con plantillas dinámicas y personalizadas que autocompletan los datos del cliente, vehículo y cotización para enviar con un solo clic.
- **Auditoría e Importación/Exportación**: Historial de logs internos para auditoría y funciones de respaldo para exportar/importar toda la base de datos en formato JSON para seguridad de la información.

---

*Desarrollado y optimizado con ❤️ para MLA AUTOMOTORS.*
