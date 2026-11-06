import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import nodemailer, { type Transporter } from 'nodemailer';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PINTUCO_PRODUCTS, CEDI_LOCATIONS } from './src/data/pintucoCatalog.js';
import { calculatePintucoSolution, generateProjectId } from './src/utils/calculator.js';
import { INITIAL_PROJECTS } from './src/data/mockProjects.js';

const APP_ROOT = (process as any).pkg ? path.dirname(process.execPath) : process.cwd();
dotenv.config({ path: path.join(APP_ROOT, '.env.local') });
dotenv.config({ path: path.join(APP_ROOT, '.env') });

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const COMPANY_WHATSAPP = process.env.COMPANY_WHATSAPP || '573236030829';
const APP_PUBLIC_URL = process.env.APP_URL || 'https://ais-dev-yeliyv23rmawmcdkgcxaje-111552814485.us-east1.run.app';

// Supabase Server-side Client
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://jgckmiencopjyrdvkfms.supabase.co').replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_KMqE5jecKTsyd--f2QZRmA_h717HB7O';

let serverSupabase: SupabaseClient | null = null;
function getSupabaseClient(): SupabaseClient | null {
  if (!serverSupabase && SUPABASE_URL && SUPABASE_KEY) {
    try {
      serverSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
      console.warn('[Server Supabase] Init error:', e);
    }
  }
  return serverSupabase;
}

let mailTransporter: Transporter | null = null;

function getMailTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER || GMAIL_USER;
  const pass = (process.env.GMAIL_APP_PASSWORD || GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  if (!user || !pass) return null;
  
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return mailTransporter;
}

function cleanPhoneForWhatsApp(rawPhone?: string): string {
  if (!rawPhone) return COMPANY_WHATSAPP;
  let cleaned = rawPhone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = `57${cleaned}`;
  }
  if (!cleaned) cleaned = COMPANY_WHATSAPP;
  return cleaned;
}

function buildWhatsAppUrl(phone: string | undefined, message: string): string {
  const target = cleanPhoneForWhatsApp(phone);
  return `https://api.whatsapp.com/send?phone=${target}&text=${encodeURIComponent(message)}`;
}

async function dispatchEmailSafely(options: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = getMailTransporter();
    if (!transporter) {
      console.log(`[Gmail Queue] Transporter not ready for: ${options.to}`);
      return { sent: false, error: 'Credenciales de Gmail incompletas en servidor' };
    }
    const info = await transporter.sendMail({
      from: `"COLORLINK by Pintuco®" <${GMAIL_USER}>`,
      to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject
    });
    console.log(`[Gmail Dispatch Success] Sent to ${options.to}, messageId: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err: any) {
    console.warn(`[Gmail Dispatch Notice] Could not send email to ${options.to} (${err.message}). Notification preserved in records.`);
    return { sent: false, error: err.message };
  }
}

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '15mb' }));

// In-memory project store initialized with mock project records
let projectsStore = [...INITIAL_PROJECTS];

// In-memory products & inventory store initialized from PINTUCO_PRODUCTS
let productsStore = [...PINTUCO_PRODUCTS];

// In-memory quotation store
let quotesStore: any[] = [
  {
    id: 'COT-2026-9041',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    clientName: 'Arq. Mateo Valenzuela',
    clientEmail: 'mvalenzuela@habitatandino.com.co',
    clientPhone: '+57 312 849 2031',
    clientCompany: 'Constructora & Hábitat Andino S.A.S.',
    clientDoc: '900.842.115-4',
    projectCity: 'Medellín',
    surfaceType: 'mamposteria_concreto',
    environment: 'exterior_intemperie',
    condition: 'humedad_eflorescencia',
    areaM2: 520,
    colorName: 'Blanco Lino Andino (Pintuco 1001-P)',
    colorHex: '#F3EFEA',
    selectedProductId: 'koraza-5',
    selectedProductName: 'Koraza® 5 Máxima Durabilidad Exteriores',
    coats: 2,
    gallonsNeeded: 39,
    cuñetesNeeded: 7,
    remainderGallons: 4,
    items: [
      {
        id: 'item-1',
        category: 'pintura',
        name: 'Koraza® 5 Máxima Durabilidad Exteriores (Cuñete 5 Gal)',
        presentation: 'Cuñete (5 Gal)',
        quantity: 7,
        unitPriceCOP: 549000,
        totalCOP: 3843000
      },
      {
        id: 'item-2',
        category: 'pintura',
        name: 'Koraza® 5 Máxima Durabilidad Exteriores (Galón)',
        presentation: 'Galón (3.785 L)',
        quantity: 4,
        unitPriceCOP: 118900,
        totalCOP: 475600
      },
      {
        id: 'item-3',
        category: 'preparacion',
        name: 'Sellomax® 7 en 1 Imprimante Antihumedad (Cuñete 5 Gal)',
        presentation: 'Cuñete (5 Gal)',
        quantity: 3,
        unitPriceCOP: 295000,
        totalCOP: 885000
      },
      {
        id: 'item-4',
        category: 'preparacion',
        name: 'Masilla Acrílica Profesional Pintuco® (Galón)',
        presentation: 'Galón',
        quantity: 5,
        unitPriceCOP: 42900,
        totalCOP: 214500
      },
      {
        id: 'item-5',
        category: 'servicio',
        name: 'Mano de Obra Certificada Pintuco (Fachada & Alturas con ARL)',
        presentation: '520 m² de aplicación técnica',
        quantity: 520,
        unitPriceCOP: 12500,
        totalCOP: 6500000
      }
    ],
    subtotalMaterialsCOP: 5418100,
    subtotalServicesCOP: 6500000,
    discountPercent: 5,
    discountAmountCOP: 595905,
    subtotalNetCOP: 11322195,
    taxIvaCOP: 2151217,
    totalCOP: 13473412,
    validUntil: new Date(Date.now() + 86400000 * 13).toISOString().split('T')[0],
    nearestCedi: 'CEDI Central Guarne - Medellín',
    warrantyYears: 5,
    includeLabor: true,
    status: 'convertida_en_proyecto',
    convertedProjectId: 'COLORLINK-2026-1042'
  }
];

// Initial seeded users with default password 'pintuco2026'
let usersStore: any[] = [
  {
    id: 'user-demo-client',
    name: 'Arq. Mateo Valenzuela',
    email: 'mvalenzuela@habitatandino.com.co',
    password: 'pintuco2026',
    role: 'cliente_empresa',
    companyOrOrg: 'Constructora & Hábitat Andino S.A.S.',
    positionOrTitle: 'Director de Obra & Especificaciones',
    nitOrDoc: '900.842.115-4',
    phone: '+57 312 849 2031',
    city: 'Medellín',
    address: 'Carrera 43A # 1Sur-220, Torre Ejecutiva El Poblado',
    isRegistered: true,
    accountStatus: 'activo',
    emailVerified: true,
    registeredAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: 'user-demo-advisor',
    name: 'Marcela Cifuentes',
    email: 'mcifuentes@pintuco.com',
    password: 'pintuco2026',
    role: 'asesor',
    companyOrOrg: 'Pintuco S.A. - Canal Proyectos',
    positionOrTitle: 'Especialista Técnico Comercial Proyectos',
    nitOrDoc: '890.900.120-1',
    phone: '+57 300 451 9822',
    city: 'Bogotá',
    address: 'Calle 26 # 69D-91, Centro Empresarial Arrecife',
    isRegistered: true,
    accountStatus: 'activo',
    emailVerified: true,
    approvedByAdminAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    approvedByAdminName: 'Jair Magallanes (Administrador)',
    registeredAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'user-pending-advisor-1',
    name: 'Ing. David Osorio',
    email: 'dosorio.proyectos@pintuco.com',
    password: 'pintuco2026',
    role: 'asesor',
    companyOrOrg: 'Pintuco Regional Occidente',
    positionOrTitle: 'Asesor Técnico en Evaluación',
    nitOrDoc: '890.900.120-1',
    phone: '+57 318 402 1199',
    city: 'Cali',
    address: 'Autopista Cali-Yumbo Km 3, Parque Industrial',
    isRegistered: true,
    accountStatus: 'pendiente_aprobacion_admin',
    emailVerified: true,
    verificationToken: '749201',
    registeredAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'user-demo-contractor',
    name: 'Maestro Jairo Bermúdez',
    email: 'jairo.bermudez@pintoresmaster.co',
    password: 'pintuco2026',
    role: 'contratista',
    companyOrOrg: 'Cuadrilla Máster Certificada Oro',
    positionOrTitle: 'Contratista Líder de Aplicación',
    nitOrDoc: '71.294.882',
    phone: '+57 317 623 8810',
    city: 'Cali',
    address: 'Calle 15 # 28A-40, Barrio San Fernando',
    isRegistered: true,
    accountStatus: 'activo',
    emailVerified: true,
    registeredAt: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 'user-demo-quality',
    name: 'Ing. Laura Serna',
    email: 'lserna.calidad@pintuco.com',
    password: 'pintuco2026',
    role: 'calidad',
    companyOrOrg: 'Asistencia Técnica & Calidad Pintuco',
    positionOrTitle: 'Auditora Técnica de Calidad y Recubrimientos',
    nitOrDoc: '890.900.120-1',
    phone: '+57 310 994 2100',
    city: 'Medellín',
    address: 'Calle 10 # 50-100, Sede Técnica Pintuco Guarne',
    isRegistered: true,
    accountStatus: 'activo',
    emailVerified: true,
    registeredAt: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    id: 'user-demo-admin',
    name: 'Jair Magallanes',
    email: 'jairmagallanes@gmail.com',
    password: 'pintuco2026',
    role: 'administrador',
    companyOrOrg: 'COLORLINK Central Pintuco',
    positionOrTitle: 'Administrador General del Sistema & Director de Plataforma',
    nitOrDoc: '1.047.382.910',
    phone: '+57 323 603 0829',
    city: 'Medellín',
    address: 'Carrera 48 # 26-85, Edificio Sede Principal Pintuco',
    isRegistered: true,
    accountStatus: 'activo',
    emailVerified: true,
    registeredAt: new Date(Date.now() - 86400000 * 30).toISOString()
  }
];

// System email notifications store
let notificationsStore: any[] = [
  {
    id: 'email-init-1',
    to: 'mcifuentes@pintuco.com',
    toName: 'Marcela Cifuentes',
    subject: '🎨 COLORLINK Pintuco® - Perfil de Asesor Técnico Aprobado y Activo',
    sentAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    type: 'aprobacion_asesor',
    role: 'asesor',
    isRead: true,
    actionTaken: true,
    associatedUserId: 'user-demo-advisor',
    previewSnippet: 'Tu solicitud como Asesor Técnico Comercial ha sido validada y aprobada por la Administración Central.',
    htmlContent: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #1E216B 0%, #2E3192 100%); padding: 24px; text-align: center; color: white;">
          <div style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #F7C548;">COLORLINK by Pintuco®</div>
          <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">Ecosistema Digital de Pinturas & Recubrimientos</div>
        </div>
        <div style="padding: 28px 24px; color: #1e293b;">
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; color: #065f46; font-size: 14px; font-weight: bold;">
            ✅ Perfil de Asesor Técnico Oficialmente Autorizado
          </div>
          <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">¡Estimada Marcela Cifuentes!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Nos complace informarte que tu perfil como <strong>Asesor Técnico Comercial Pintuco</strong> (Sede Bogotá) ha sido revisado, validado y <strong>aprobado satisfactoriamente por el Administrador Central</strong>.
          </p>
        </div>
      </div>
    `
  },
  {
    id: 'email-admin-alert-osorio',
    to: 'jairmagallanes@gmail.com',
    toName: 'COLORLINK by Pintuco® - Jair Magallanes (Administrador)',
    subject: '🛡️ COLORLINK - Nueva Solicitud de Registro de Asesor Técnico por Aprobar (Ing. David Osorio)',
    sentAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    type: 'alerta_admin_asesor',
    role: 'administrador',
    previewSnippet: 'El usuario Ing. David Osorio (dosorio.proyectos@pintuco.com) ha solicitado el rol de Asesor Técnico en Cali. Requiere tu aprobación en el panel RBAC.',
    htmlContent: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #4c1d95 0%, #1E216B 100%); padding: 24px; text-align: center; color: white;">
          <div style="font-size: 20px; font-weight: 800; color: #F7C548;">🛡️ COLORLINK - Alerta de Administración</div>
          <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">Nueva Solicitud de Rol Asesor Técnico por Aprobar</div>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <p style="font-size: 14px; line-height: 1.6;">
            El usuario <strong>Ing. David Osorio</strong> se ha registrado y ha solicitado el rol de <strong>Asesor Técnico Comercial Pintuco</strong>.
          </p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; font-size: 13px; line-height: 1.7;">
            <div><strong>Correo:</strong> dosorio.proyectos@pintuco.com</div>
            <div><strong>Empresa / Unidad:</strong> Pintuco Regional Occidente</div>
            <div><strong>Ciudad:</strong> Cali</div>
            <div><strong>Estado:</strong> Pendiente de Aprobación por Administrador</div>
          </div>
        </div>
      </div>
    `,
    isRead: false,
    actionTaken: false,
    associatedUserId: 'user-pending-advisor-1'
  }
];

function sanitizeUser(user: any) {
  const { password, verificationToken, ...safeUser } = user;
  return safeUser;
}

function hashAccountPassword(password: string, salt = randomBytes(16).toString('hex')) {
  return {
    salt,
    hash: scryptSync(password, salt, 64).toString('hex')
  };
}

function verifyAccountPassword(password: string, salt: string, expectedHash: string) {
  try {
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// Lazy Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Groq AI Integration (Ultra-fast inference with Llama & Qwen models)
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

async function callGroqAI(systemPrompt: string, userPrompt: string, jsonMode: boolean = true, model: string = 'qwen/qwen3.8-27b'): Promise<any> {
  if (!GROQ_API_KEY) {
    return null;
  }
  try {
    const bodyPayload: any = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 700
    };

    if (jsonMode) {
      bodyPayload.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(12000),
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Groq API returned ${response.status}:`, errText);
      return null;
    }

    const json: any = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    if (jsonMode) {
      return JSON.parse(content);
    }
    return content;
  } catch (err) {
    console.warn('Error calling Groq API:', err);
    return null;
  }
}

// API Routes
// Authentication & User Management
app.get('/api/auth/users', (req, res) => {
  res.json({ success: true, users: usersStore.map(sanitizeUser) });
});

app.get('/api/auth/check-email', async (req, res) => {
  const email = (req.query.email as string || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }
  let exists = usersStore.some(u => u.email.toLowerCase() === email);
  const sb = getSupabaseClient();
  if (sb) {
    const { data, error } = await sb.from('perfiles').select('correo_electronico').eq('correo_electronico', email).maybeSingle();
    if (error) return res.status(503).json({ success: false, error: 'No se pudo consultar el correo en Supabase.' });
    exists = exists || Boolean(data);
  }
  return res.json({ success: true, exists, email });
});

async function recordAndDispatchNotification(notification: any) {
  if (!notification.clientPhone) {
    notification.clientPhone = COMPANY_WHATSAPP;
  }
  if (notification.whatsappMessage && !notification.whatsappUrl) {
    notification.whatsappUrl = buildWhatsAppUrl(notification.clientPhone, notification.whatsappMessage);
  }
  
  // Try sending real email via Gmail SMTP
  const emailRes = await dispatchEmailSafely({
    to: notification.to,
    toName: notification.toName,
    subject: notification.subject,
    html: notification.htmlContent,
    text: notification.previewSnippet
  });

  notification.emailSent = emailRes.sent;
  notification.emailError = emailRes.error;
  notification.senderEmail = GMAIL_USER;
  if (!notification.sentAt) notification.sentAt = new Date().toISOString();

  const sb = getSupabaseClient();
  if (sb) {
    const { error } = await sb.from('colorlink_notificaciones').upsert({
      id: notification.id,
      destinatario: notification.to.toLowerCase(),
      enviado_en: notification.sentAt,
      datos: notification
    }, { onConflict: 'id' });
    if (error) console.warn('[Supabase Notification Persistence Warning]:', error.message);
  }

  const existingIdx = notificationsStore.findIndex(n => n.id === notification.id);
  if (existingIdx !== -1) {
    notificationsStore[existingIdx] = { ...notificationsStore[existingIdx], ...notification };
  } else {
    notificationsStore.unshift(notification);
  }

  return notification;
}

function notifyProjectStatusChange(
  project: any,
  newStatus: string,
  eventTitle: string,
  eventDescription: string
) {
  const clientName = project.formData?.identification?.clientName || 'Cliente Pintuco';
  const clientEmail = project.formData?.identification?.contactEmail || project.formData?.identification?.clientEmail || 'jairmagallanes@gmail.com';
  const clientPhone = project.formData?.identification?.contactPhone || COMPANY_WHATSAPP;
  const areaM2 = project.formData?.project?.areaM2 || 100;
  const product = project.solution?.recommendedPrimaryProduct?.name || 'Viniltex® / Koraza® Pintuco';

  const statusLabels: Record<string, string> = {
    inspeccion_aprobada: 'Fase 1: Diagnóstico Técnico Aprobado',
    inventario_reservado: 'Fase 2: Inventario Reservado en CEDI',
    presupuesto_aprobado: 'Fase 3: Presupuesto & Cotización Aprobada',
    compra_aprobada: 'Fase 4: Compra Aprobada / Orden Emitida',
    verificacion_pago: 'Fase 5: Pago Verificado por Tesorería',
    despacho_en_camino: 'Fase 6: Despacho en Ruta hacia la Obra',
    calidad_aprobada: 'Calidad Aprobada & Póliza Emitida',
    finalizado: 'Fase 7: Producto Entregado al Cliente'
  };

  const friendlyStatus = statusLabels[newStatus] || `Estado: ${newStatus}`;

  const whatsappMessage = 
`🔔 *COLORLINK Pintuco® - Actualización de Proyecto ${project.id}*
Hola *${clientName}*, te informamos el avance de tu proyecto de pintura:

📌 *Nuevo Estado:* *${friendlyStatus}*
📋 *Detalle:* ${eventDescription}
📍 *Obra / Ciudad:* ${project.formData?.project?.city || 'Medellín'} (${areaM2} m²)
🧪 *Producto:* ${product}

Puedes hacer seguimiento en tiempo real de tu obra y despacho aquí:
👉 ${APP_PUBLIC_URL}

_Pintuco S.A. • Centro de Control Logístico: +57 323 603 0829_`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #1E216B 0%, #2E3192 100%); padding: 24px; text-align: center; color: white;">
        <div style="display: inline-block; background: #F7C548; color: #1E216B; font-weight: 900; font-size: 14px; padding: 4px 12px; border-radius: 6px; margin-bottom: 8px; text-transform: uppercase;">COLORLINK by Pintuco®</div>
        <div style="font-size: 20px; font-weight: 800; color: #ffffff;">Actualización de Estado de Obra</div>
        <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">Radicado: <strong>${project.id}</strong></div>
      </div>
      <div style="padding: 26px 24px; color: #1e293b;">
        <div style="background: #ecfdf5; border: 1px solid #6ee7b7; padding: 14px 18px; border-radius: 10px; margin-bottom: 20px;">
          <div style="font-size: 12px; text-transform: uppercase; color: #065f46; font-weight: 800;">Estado Actualizado:</div>
          <div style="font-size: 16px; font-weight: 900; color: #064e3b; margin-top: 2px;">${friendlyStatus}</div>
        </div>
        <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Estimado(a) ${clientName},</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          ${eventDescription}
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px;">
          <div style="font-weight: bold; color: #1E216B; margin-bottom: 8px;">Resumen del Proyecto:</div>
          <div><strong>Cliente:</strong> ${clientName}</div>
          <div><strong>Ubicación:</strong> ${project.formData?.project?.address || project.formData?.project?.city}</div>
          <div><strong>Línea de Recubrimiento:</strong> ${product}</div>
          <div><strong>Área:</strong> ${areaM2} m²</div>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${APP_PUBLIC_URL}" style="display: inline-block; background: #2E3192; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 14px;">
            Consultar Bitácora y Seguimiento en Vivo
          </a>
        </div>
      </div>
      <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b;">
        COLORLINK Pintuco S.A. • Notificaciones de Despacho & Bitácora de Obra • WhatsApp: +57 323 603 0829
      </div>
    </div>
  `;

  const notification = {
    id: `email-status-${project.id}-${Date.now()}`,
    to: clientEmail,
    toName: clientName,
    subject: `🎨 COLORLINK - Actualización Proyecto ${project.id}: ${eventTitle}`,
    sentAt: new Date().toISOString(),
    type: 'cambio_estado_proyecto',
    previewSnippet: `Proyecto ${project.id} actualizado a ${friendlyStatus}: ${eventDescription}`,
    htmlContent,
    isRead: false,
    associatedProjectId: project.id,
    clientPhone,
    whatsappMessage,
    whatsappUrl: buildWhatsAppUrl(clientPhone, whatsappMessage)
  };

  recordAndDispatchNotification(notification).catch(console.warn);
  if (clientEmail.toLowerCase() !== 'jairmagallanes@gmail.com') {
    recordAndDispatchNotification({
      ...notification, id: `${notification.id}-admin`,
      to: 'jairmagallanes@gmail.com', toName: 'Jair Magallanes (Administrador)',
      previewSnippet: `Cliente ${clientName} - ${notification.previewSnippet}`
    }).catch(console.warn);
  }
  return notification;
}

// Notifications / Email store API
app.get('/api/notifications/emails', async (req, res) => {
  const recipient = typeof req.query.to === 'string' ? req.query.to.toLowerCase() : '';
  if (!recipient) return res.status(400).json({ success: false, error: 'Destinatario requerido.' });
  const sb = getSupabaseClient();
  if (sb && recipient) {
    const { data, error } = await sb.from('colorlink_notificaciones')
      .select('datos').eq('destinatario', recipient)
      .order('enviado_en', { ascending: false }).limit(500);
    if (!error && data) return res.json({ success: true, data: data.map(row => row.datos).filter(item => item.type !== 'verificacion_cuenta') });
    if (error) console.warn('[Supabase Notification Inbox Warning]:', error.message);
  }
  const data = notificationsStore.filter(n => (n.to || '').toLowerCase() === recipient && n.type !== 'verificacion_cuenta');
  return res.json({ success: true, data });
});

app.delete('/api/notifications/emails', async (req, res) => {
  const recipient = typeof req.query.to === 'string' ? req.query.to.toLowerCase() : '';
  if (!recipient) return res.status(400).json({ success: false, error: 'Destinatario requerido.' });
  const sb = getSupabaseClient();
  if (sb) {
    const { error } = await sb.from('colorlink_notificaciones').delete().eq('destinatario', recipient);
    if (error) console.warn('[Supabase Notification Clear Warning]:', error.message);
  }
  notificationsStore = notificationsStore.filter(n => (n.to || '').toLowerCase() !== recipient);
  return res.json({ success: true });
});

// Notifications settings & status endpoint
app.get('/api/notifications/settings', (req, res) => {
  return res.json({
    success: true,
    senderEmail: GMAIL_USER,
    companyWhatsApp: COMPANY_WHATSAPP,
    isGmailConfigured: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    isAppPasswordSet: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').length >= 16,
    hasPasswordProvided: Boolean(process.env.GMAIL_APP_PASSWORD),
    instructions: {
      step1: 'Ingresar a https://myaccount.google.com con la cuenta jairmagallanes@gmail.com',
      step2: 'En "Seguridad", activar la "Verificación en 2 pasos" si aún no está activa',
      step3: 'Buscar "Contraseñas de aplicaciones" (App Passwords) y generar una contraseña para "Correo / Servidor Web"',
      step4: 'Copiar la clave de 16 caracteres e ingresarla en la variable GMAIL_APP_PASSWORD de .env'
    }
  });
});

// Dispatch generic notification
app.post('/api/notifications/dispatch', async (req, res) => {
  try {
    const notification = req.body;
    if (!notification || !notification.to || !notification.subject) {
      return res.status(400).json({ success: false, error: 'Datos de notificación incompletos' });
    }

    const recorded = await recordAndDispatchNotification(notification);
    return res.json({ success: true, data: recorded });
  } catch (err: any) {
    console.error('Error dispatching notification:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Live test email sending
app.post('/api/notifications/test-email', async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const dest = (targetEmail || GMAIL_USER).trim();

    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #1E216B; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0; color: #F7C548;">COLORLINK by Pintuco®</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1;">Prueba de Conexión de Correo Saliente</p>
        </div>
        <div style="padding: 24px; color: #334155;">
          <p style="font-size: 15px; font-weight: bold; color: #065f46; background: #ecfdf5; padding: 10px 14px; border-radius: 6px;">
            ✅ Conexión SMTP Gmail Establecida Satisfactoriamente
          </p>
          <p style="font-size: 14px; line-height: 1.5;">
            Este es un correo de prueba enviado desde <strong>${GMAIL_USER}</strong> a través de la infraestructura de COLORLINK Pintuco.
          </p>
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; line-height: 1.6;">
            <div><strong>Remitente:</strong> ${GMAIL_USER}</div>
            <div><strong>Destinatario:</strong> ${dest}</div>
            <div><strong>WhatsApp Oficial:</strong> +57 323 603 0829</div>
            <div><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</div>
          </div>
        </div>
      </div>
    `;

    const result = await dispatchEmailSafely({
      to: dest,
      toName: 'Usuario de Prueba Pintuco',
      subject: '🎨 COLORLINK Pintuco® - Verificación Exitosa de Correo Electrónico',
      html: testHtml,
      text: 'COLORLINK by Pintuco: Correo de prueba exitoso.'
    });

    return res.json({
      success: result.sent,
      messageId: result.messageId,
      error: result.error,
      sender: GMAIL_USER,
      destination: dest
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, companyOrOrg, nitOrDoc, phone, city, address, positionOrTitle } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre completo, correo electrónico y contraseña son obligatorios.' 
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const profileStore = getSupabaseClient();
    if (!profileStore) {
      return res.status(503).json({ success: false, error: 'No hay conexión con Supabase para validar la cuenta.' });
    }

    const { data: savedCredential, error: credentialLookupError } = await profileStore
      .from('colorlink_usuarios_auth')
      .select('correo_electronico, usuario, email_verificado')
      .eq('correo_electronico', normalizedEmail)
      .maybeSingle();
    if (credentialLookupError) {
      console.error('[Supabase Auth Lookup Error]:', credentialLookupError.message);
      return res.status(503).json({ success: false, error: 'Falta instalar la actualización de autenticación en Supabase. Ejecuta el esquema SQL actualizado.' });
    }
    
    // Check if user already exists
    const existingUser = usersStore.find(u => u.email.toLowerCase() === normalizedEmail);
    if (savedCredential?.email_verificado || (existingUser && !savedCredential)) {
      const existingName = savedCredential?.usuario?.name || existingUser?.name || normalizedEmail;
      return res.status(409).json({
        success: false,
        alreadyRegistered: true,
        error: `El correo "${normalizedEmail}" ya se encuentra registrado en COLORLINK. No se permite crear registros duplicados. Por favor inicia sesión con tu contraseña.`,
        email: normalizedEmail,
        userName: existingName
      });
    }

    // Check by NIT or Doc if provided and not empty
    if (!savedCredential && nitOrDoc && nitOrDoc.trim()) {
      const existingDoc = usersStore.find(
        u => u.nitOrDoc && u.nitOrDoc.replace(/[^a-zA-Z0-9]/g, '') === nitOrDoc.replace(/[^a-zA-Z0-9]/g, '')
      );
      if (existingDoc) {
        return res.status(409).json({
          success: false,
          alreadyRegistered: true,
          error: `El documento o NIT "${nitOrDoc}" ya está registrado a nombre de ${existingDoc.name} (${existingDoc.email}). Por favor inicia sesión.`,
          email: existingDoc.email,
          userName: existingDoc.name
        });
      }
    }

    const requestedRole = role || 'cliente_natural';
    const userRole = requestedRole === 'administrador' ? 'cliente_natural' : requestedRole;
    const isAdvisor = userRole === 'asesor';
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Advisors start in 'pendiente_aprobacion_admin' after email verification; other roles start in 'pendiente_verificacion_email'
    const accountStatus = isAdvisor ? 'pendiente_aprobacion_admin' : 'pendiente_verificacion_email';

    const newUser = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      email: normalizedEmail,
      password: password.trim(),
      role: userRole,
      companyOrOrg: (companyOrOrg || '').trim(),
      positionOrTitle: (positionOrTitle || '').trim(),
      nitOrDoc: (nitOrDoc || '').trim(),
      phone: (phone || '').trim(),
      city: (city || 'Medellín').trim(),
      address: (address || '').trim(),
      isRegistered: true,
      accountStatus,
      emailVerified: false,
      verificationToken: verificationCode,
      registeredAt: new Date().toISOString()
    };

    // Persist the account email/profile before accepting registration.
    const profileRole = userRole === 'administrador' ? 'administrador' : userRole === 'asesor' ? 'asesor_tecnico' : userRole === 'contratista' ? 'contratista' : 'cliente';
    const { error: profileSaveError } = await profileStore.from('perfiles').upsert({
      correo_electronico: newUser.email,
      nombre_completo: newUser.name,
      telefono: newUser.phone || null,
      rol: profileRole,
      empresa_o_organizacion: newUser.companyOrOrg || null,
      cargo_o_titulo: newUser.positionOrTitle || null,
      nit_o_cedula: newUser.nitOrDoc || null,
      ciudad: newUser.city || 'Medellín',
      direccion: newUser.address || null,
      esta_activo: false,
      email_verificado: false
    }, { onConflict: 'correo_electronico' });
    if (profileSaveError) {
      console.error('[Supabase User Persistence Error]:', profileSaveError.message);
      return res.status(503).json({ success: false, error: 'Supabase no pudo guardar el correo. Revisa la conexión y vuelve a intentar.' });
    }

    const { salt: passwordSalt, hash: passwordHash } = hashAccountPassword(newUser.password);
    const { password: _plainPassword, verificationToken: _verificationToken, ...persistedUser } = newUser;
    const { error: credentialSaveError } = await profileStore.from('colorlink_usuarios_auth').upsert({
      correo_electronico: newUser.email,
      password_salt: passwordSalt,
      password_hash: passwordHash,
      usuario: persistedUser,
      verification_token: verificationCode,
      token_expira: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      email_verificado: false,
      fecha_actualizacion: new Date().toISOString()
    }, { onConflict: 'correo_electronico' });
    if (credentialSaveError) {
      console.error('[Supabase Credential Persistence Error]:', credentialSaveError.message);
      return res.status(503).json({ success: false, error: 'No se pudieron guardar las credenciales seguras. Ejecuta el esquema SQL actualizado y vuelve a intentarlo.' });
    }

    usersStore = usersStore.filter(user => user.email.toLowerCase() !== normalizedEmail);
    usersStore.unshift(newUser);

    // Generate and dispatch verification email notification
    const roleLabels: Record<string, string> = {
      administrador: 'Administrador del Sistema',
      asesor: 'Asesor Técnico Comercial',
      aplicador_contratista: 'Pintor / Contratista Certificado',
      especificador: 'Arquitecto / Especificador Técnico',
      cliente_empresa: 'Cliente Corporativo / Constructora',
      cliente_natural: 'Cliente Particular / Propietario'
    };
    const roleTitle = roleLabels[userRole] || userRole;

    const userEmailNotification = {
      id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      to: newUser.email,
      toName: newUser.name,
      subject: `🎨 COLORLINK Pintuco® - ¡Bienvenido! Verificación y Activación de tu Cuenta (${roleTitle})`,
      sentAt: new Date().toISOString(),
      type: 'verificacion_cuenta',
      role: newUser.role,
      previewSnippet: `Hola ${newUser.name}, valida tu correo con el código de activación enviado a tu dirección para activar tu perfil.`,
      htmlContent: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <div style="background: linear-gradient(135deg, #1E216B 0%, #2E3192 100%); padding: 26px 24px; text-align: center; color: white;">
            <div style="display: inline-block; background: #F7C548; color: #1E216B; font-weight: 900; font-size: 15px; padding: 4px 12px; border-radius: 6px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">COLORLINK by Pintuco®</div>
            <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Notificación de Registro y Verificación de Cuenta</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">Ecosistema Digital de Pinturas, Recubrimientos & Gestión de Obras</div>
          </div>
          <div style="padding: 28px 24px; color: #1e293b;">
            <div style="background: #eff6ff; border-left: 4px solid #2E3192; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
              <span style="font-size: 13px; font-weight: bold; color: #1E216B;">📩 Correo de Notificación Oficial:</span>
              <span style="font-size: 13px; color: #334155; display: block; margin-top: 2px;">Este mensaje ha sido enviado automáticamente a <strong>${newUser.email}</strong> tras completar el registro en la plataforma.</span>
            </div>

            <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; margin-bottom: 8px;">¡Te damos la bienvenida, ${newUser.name}!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 18px;">
              Tu cuenta ha sido creada exitosamente en <strong>COLORLINK Pintuco®</strong> con el rol de <strong>${roleTitle}</strong>. Para activar tu acceso a las cotizaciones en línea, cálculo técnico de recubrimientos y consulta de inventario en CEDIs, ingresa tu código de verificación.
            </p>

            <div style="background: #f8fafc; border: 2px dashed #2E3192; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
              <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 1.5px; margin-bottom: 6px;">Código de Activación de 6 Dígitos</div>
              <div style="font-size: 34px; font-weight: 900; letter-spacing: 7px; color: #1E216B; font-family: monospace;">${verificationCode}</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">Válido durante 24 horas para activar tu cuenta</div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
              <div style="font-size: 12px; font-weight: 800; color: #1E216B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                📋 Resumen de Datos Registrados:
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b; width: 140px;"><strong>Nombre Completo:</strong></td>
                  <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${newUser.name}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;"><strong>Correo Registrado:</strong></td>
                  <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${newUser.email}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;"><strong>Rol del Sistema:</strong></td>
                  <td style="padding: 4px 0; color: #2E3192; font-weight: 700;">${roleTitle}</td>
                </tr>
                ${newUser.nitOrDoc ? `
                <tr>
                  <td style="padding: 4px 0; color: #64748b;"><strong>Documento / NIT:</strong></td>
                  <td style="padding: 4px 0; color: #334155;">${newUser.nitOrDoc}</td>
                </tr>` : ''}
                ${newUser.positionOrTitle ? `
                <tr>
                  <td style="padding: 4px 0; color: #64748b;"><strong>Cargo / Especialidad:</strong></td>
                  <td style="padding: 4px 0; color: #334155;">${newUser.positionOrTitle}</td>
                </tr>` : ''}
                ${newUser.address ? `
                <tr>
                  <td style="padding: 4px 0; color: #64748b;"><strong>Dirección Sede/Obra:</strong></td>
                  <td style="padding: 4px 0; color: #334155;">${newUser.address}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 4px 0; color: #64748b;"><strong>Ciudad / CEDI:</strong></td>
                  <td style="padding: 4px 0; color: #334155;">${newUser.city}</td>
                </tr>
                ${newUser.phone ? `
                <tr>
                  <td style="padding: 4px 0; color: #64748b;"><strong>Teléfono / WhatsApp:</strong></td>
                  <td style="padding: 4px 0; color: #334155;">${newUser.phone}</td>
                </tr>` : ''}
                ${newUser.companyOrOrg ? `
                <tr>
                  <td style="padding: 4px 0; color: #64748b;"><strong>Empresa / Entidad:</strong></td>
                  <td style="padding: 4px 0; color: #334155;">${newUser.companyOrOrg}</td>
                </tr>` : ''}
              </table>
            </div>

            ${isAdvisor ? `
              <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px; color: #92400e; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">
                ⚠️ <strong>Aviso para Asesores Técnicos:</strong> Por gobernanza institucional, los perfiles con rol de Asesor Técnico Comercial son verificados y aprobados formalmente por el Administrador Central de COLORLINK. Tras validar tu correo, tu solicitud quedará radicada para su autorización en el panel RBAC.
              </div>
            ` : `
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px; color: #065f46; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">
                ✅ <strong>Activación Inmediata:</strong> Al ingresar tu código o validar tu correo, tu cuenta quedará 100% activa para generar cotizaciones, especificar proyectos y consultar disponibilidad en CEDIs.
              </div>
            `}

            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 20px;">
              Si no solicitaste este registro en COLORLINK Pintuco®, puedes desestimar este mensaje.
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Pintuco S.A. • Universidad Cooperativa de Colombia (UCC) • COLORLINK 2026
          </div>
        </div>
      `,
      isRead: false,
      actionTaken: false,
      associatedUserId: newUser.id,
      clientPhone: newUser.phone || COMPANY_WHATSAPP,
    };

    const verificationDelivery = await recordAndDispatchNotification(userEmailNotification);
    if (!verificationDelivery.emailSent) {
      usersStore = usersStore.filter(user => user.id !== newUser.id);
      return res.status(503).json({
        success: false,
        error: `No se pudo enviar el código a ${newUser.email}. Verifica GMAIL_USER y GMAIL_APP_PASSWORD y vuelve a registrarte.`
      });
    }

    // If role is Advisor, send notification to Administrator
    if (isAdvisor) {
      const adminAlertNotification = {
        id: `email-admin-${Date.now()}`,
        to: 'jairmagallanes@gmail.com',
        toName: 'COLORLINK by Pintuco® - Jair Magallanes (Administrador)',
        subject: `🛡️ COLORLINK - Nueva Solicitud de Registro de Asesor Técnico por Aprobar (${newUser.name})`,
        sentAt: new Date().toISOString(),
        type: 'alerta_admin_asesor',
        role: 'administrador',
        previewSnippet: `El usuario ${newUser.name} (${newUser.email}) ha solicitado el rol de Asesor Técnico en ${newUser.city}. Requiere tu aprobación en el panel RBAC.`,
        htmlContent: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #4c1d95 0%, #1E216B 100%); padding: 24px; text-align: center; color: white;">
              <div style="font-size: 20px; font-weight: 800; color: #F7C548;">🛡️ COLORLINK - Alerta de Administración</div>
              <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">Nueva Solicitud de Rol Asesor Técnico por Aprobar</div>
            </div>
            <div style="padding: 24px; color: #1e293b;">
              <p style="font-size: 14px; line-height: 1.6;">
                El usuario <strong>${newUser.name}</strong> se ha registrado y ha solicitado el rol de <strong>Asesor Técnico Comercial Pintuco</strong>.
              </p>
              <div style="background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; font-size: 13px; line-height: 1.7;">
                <div><strong>Correo:</strong> ${newUser.email}</div>
                <div><strong>Empresa / Unidad:</strong> ${newUser.companyOrOrg || 'Pintuco S.A.'}</div>
                <div><strong>Documento / NIT:</strong> ${newUser.nitOrDoc || 'No especificado'}</div>
                <div><strong>Cargo / Título:</strong> ${newUser.positionOrTitle || 'Asesor Técnico'}</div>
                <div><strong>Dirección:</strong> ${newUser.address || 'No especificada'}</div>
                <div><strong>Ciudad:</strong> ${newUser.city}</div>
                <div><strong>Estado Actual:</strong> Pendiente de Aprobación por Administrador</div>
              </div>
            </div>
          </div>
        `,
        isRead: false,
        actionTaken: false,
        associatedUserId: newUser.id
      };
      await recordAndDispatchNotification(adminAlertNotification);
    }

    // Sync newly registered user to Supabase PostgreSQL database
    const sb = getSupabaseClient();
    if (sb) {
      const roleMap: Record<string, string> = {
        administrador: 'administrador',
        asesor: 'asesor_tecnico',
        aplicador_contratista: 'contratista',
        especificador: 'especificador',
        cliente_empresa: 'cliente',
        cliente_natural: 'cliente'
      };
      const mappedRole = roleMap[newUser.role] || 'cliente';

      await (async () => {
        try {
          await sb.from('perfiles').upsert({
            correo_electronico: newUser.email,
            nombre_completo: newUser.name,
            telefono: newUser.phone || null,
            rol: mappedRole,
            esta_activo: false,
            email_verificado: false
          }, { onConflict: 'correo_electronico' });

          if (newUser.role === 'cliente_empresa' || newUser.role === 'cliente_natural' || newUser.role === 'cliente') {
            const nitDoc = newUser.nitOrDoc && newUser.nitOrDoc.trim() 
              ? newUser.nitOrDoc.trim() 
              : `NIT-${newUser.email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

            await sb.from('clientes').upsert({
              nit_cedula: nitDoc,
              nombre_empresa: newUser.companyOrOrg || newUser.name,
              nombre_contacto: newUser.name,
              correo_contacto: newUser.email,
              telefono_contacto: newUser.phone || '3000000000',
              direccion_facturacion: newUser.address || 'Colombia',
              ciudad: newUser.city || 'Medellín',
              tipo_cliente: newUser.role === 'cliente_empresa' ? 'empresa' : 'natural'
            }, { onConflict: 'nit_cedula' });
          }
        } catch (err: any) {
          console.warn('[Supabase Server Sync User Warning]:', err?.message);
        }
      })();
    }

    return res.status(201).json({
      success: true,
      message: isAdvisor 
        ? (verificationDelivery.emailSent ? `Registro completado. Enviamos el código de verificación a ${newUser.email}; después, el administrador debe aprobar el rol de Asesor Técnico.` : `Registro creado, pero no se pudo enviar el correo a ${newUser.email}. Configura el servicio de correo y solicita el reenvío antes de activar la cuenta.`)
        : (verificationDelivery.emailSent ? `Registro completado. Enviamos el código de activación a ${newUser.email}.` : `Registro creado, pero no se pudo enviar el correo a ${newUser.email}. Configura el servicio de correo y solicita el reenvío antes de activar la cuenta.`),
      user: sanitizeUser(newUser),
      emailSent: verificationDelivery.emailSent,
      requiresAdvisorApproval: isAdvisor
    });
  } catch (error: any) {
    console.error('Error in /api/auth/register:', error);
    return res.status(500).json({ success: false, error: 'Error en el servidor al registrar el usuario' });
  }
});

// Google Sign-In and Registration endpoint
app.post('/api/auth/google', (_req, res) => {
  return res.status(410).json({ success: false, error: 'El acceso con Google fue deshabilitado. Usa correo y contraseña.' });
  /* legacy route disabled

  try {
    const { email, name, avatarUrl, googleId, role, companyOrOrg, nitOrDoc, phone, city, address, clientType } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'El correo electrónico de Google es obligatorio.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let userFound = usersStore.find(u => u.email.toLowerCase() === normalizedEmail);

    if (userFound) {
      // User already exists: update Google details and log in
      userFound.authProvider = 'google';
      if (googleId) userFound.googleId = googleId;
      if (avatarUrl && !userFound.avatarUrl) userFound.avatarUrl = avatarUrl;
      if (name && !userFound.name) userFound.name = name;
      userFound.emailVerified = true;

      if (userFound.role === 'asesor' && userFound.accountStatus === 'pendiente_aprobacion_admin') {
        return res.status(403).json({
          success: false,
          pendingAdvisorApproval: true,
          user: sanitizeUser(userFound),
          error: `Tu perfil como Asesor Técnico Comercial (${userFound.name}) se encuentra pendiente de aprobación por el Administrador Central de COLORLINK.`
        });
      }

      if (userFound.accountStatus === 'rechazado') {
        return res.status(403).json({
          success: false,
          rejected: true,
          error: `Tu solicitud de acceso ha sido rechazada por la administración. Motivo: ${userFound.rejectionReason || 'Contacta al soporte central.'}`
        });
      }

      return res.json({
        success: true,
        isNewUser: false,
        message: `¡Bienvenido(a) de nuevo, ${userFound.name}! Sesión iniciada con tu cuenta de Google.`,
        user: sanitizeUser(userFound)
      });
    }

    // New User registration via Google
    const userRole = role || 'cliente_natural';
    const isAdvisor = userRole === 'asesor';
    const accountStatus = isAdvisor ? 'pendiente_aprobacion_admin' : 'activo';

    const newUser = {
      id: `user-g-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: (name || normalizedEmail.split('@')[0]).trim(),
      email: normalizedEmail,
      authProvider: 'google',
      googleId: googleId || `gid-${Date.now()}`,
      avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || normalizedEmail)}&background=2E3192&color=fff`,
      role: userRole,
      clientType: clientType || (userRole === 'cliente_empresa' ? 'empresa' : 'persona_natural'),
      companyOrOrg: (companyOrOrg || '').trim(),
      positionOrTitle: (isAdvisor ? 'Asesor Técnico Comercial' : '').trim(),
      nitOrDoc: (nitOrDoc || '').trim(),
      phone: (phone || '').trim(),
      city: (city || 'Medellín').trim(),
      address: (address || '').trim(),
      isRegistered: true,
      accountStatus,
      emailVerified: true,
      registeredAt: new Date().toISOString()
    };

    usersStore.unshift(newUser);

    // Welcome email notification
    const welcomeNotification = {
      id: `email-welcome-g-${Date.now()}`,
      to: newUser.email,
      toName: newUser.name,
      subject: '🎨 COLORLINK by Pintuco® - Bienvenido(a) con tu cuenta de Google',
      sentAt: new Date().toISOString(),
      type: 'verificacion_cuenta',
      role: newUser.role,
      isRead: false,
      actionTaken: true,
      associatedUserId: newUser.id,
      previewSnippet: `Tu cuenta ha sido vinculada y activada exitosamente a través de Google (${newUser.email}).`,
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #1E216B 0%, #2E3192 100%); padding: 24px; text-align: center; color: white;">
            <div style="font-size: 24px; font-weight: 900; color: #F7C548;">COLORLINK by Pintuco®</div>
            <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">Ecosistema Digital de Pinturas & Recubrimientos</div>
          </div>
          <div style="padding: 24px; color: #1e293b;">
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; color: #065f46; font-size: 14px; font-weight: bold;">
              ✅ Registro Exitoso con Cuenta de Google
            </div>
            <p>Hola <strong>${newUser.name}</strong>, bienvenido(a) a la plataforma COLORLINK de Pintuco®. Tu cuenta asociada a <strong>${newUser.email}</strong> ha sido verificada y activada exitosamente.</p>
          </div>
        </div>
      `
    };
    notificationsStore.unshift(welcomeNotification);

    return res.status(201).json({
      success: true,
      isNewUser: true,
      message: isAdvisor 
        ? `¡Cuenta Google registrada! Tu solicitud de Asesor Técnico se encuentra en proceso de aprobación por el Administrador.`
        : `¡Registro completado con éxito! Bienvenido(a) a COLORLINK, ${newUser.name}.`,
      user: sanitizeUser(newUser)
    });
  } catch (error: any) {
    console.error('Error in /api/auth/google:', error);
    return res.status(500).json({ success: false, error: 'Error en el servidor al autenticar con Google' });
  }
});

*/

});

// Verify email with token
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ success: false, error: 'Email y código de verificación son requeridos' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const sb = getSupabaseClient();
    let savedAuth: any = null;
    if (sb) {
      const { data, error } = await sb.from('colorlink_usuarios_auth')
        .select('usuario, verification_token, token_expira, email_verificado')
        .eq('correo_electronico', normalizedEmail)
        .maybeSingle();
      if (error) {
        console.error('[Supabase Verification Lookup Error]:', error.message);
        return res.status(503).json({ success: false, error: 'No se pudo consultar la verificación guardada en Supabase.' });
      }
      savedAuth = data;
    }

    const userIndex = usersStore.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    const user = savedAuth?.usuario || (userIndex >= 0 ? usersStore[userIndex] : null);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const storedToken = savedAuth?.verification_token || user.verificationToken;
    if (savedAuth?.email_verificado) {
      return res.json({ success: true, message: 'El correo ya estaba verificado.', user: sanitizeUser(user) });
    }
    if (savedAuth?.token_expira && Date.parse(savedAuth.token_expira) < Date.now()) {
      return res.status(400).json({ success: false, error: 'El código de activación venció. Registra nuevamente tus datos para recibir uno nuevo.' });
    }
    if (!storedToken || storedToken !== token.trim()) {
      return res.status(400).json({ success: false, error: 'El código de activación ingresado no es válido.' });
    }

    user.emailVerified = true;
    if (user.role !== 'asesor') {
      user.accountStatus = 'activo';
    }

    if (sb) {
      const { error } = await sb.from('perfiles').update({
        email_verificado: true,
        esta_activo: user.role !== 'asesor'
      }).eq('correo_electronico', normalizedEmail);
      if (error) console.warn('[Supabase Email Verification Sync Warning]:', error.message);

      if (savedAuth) {
        const { error: authUpdateError } = await sb.from('colorlink_usuarios_auth').update({
          usuario: user,
          verification_token: null,
          token_expira: null,
          email_verificado: true,
          fecha_actualizacion: new Date().toISOString()
        }).eq('correo_electronico', normalizedEmail);
        if (authUpdateError) console.warn('[Supabase Auth Verification Sync Warning]:', authUpdateError.message);
      }
    }

    if (userIndex >= 0) usersStore[userIndex] = user;

    return res.json({
      success: true,
      message: user.role === 'asesor' && user.accountStatus === 'pendiente_aprobacion_admin'
        ? '¡Correo verificado con éxito! Tu perfil de Asesor Técnico ahora se encuentra en revisión y espera de aprobación por el Administrador.'
        : '¡Correo verificado y cuenta activada exitosamente!',
      user: sanitizeUser(user)
    });
  } catch (error: any) {
    console.error('Error in /api/auth/verify-email:', error);
    return res.status(500).json({ success: false, error: 'Error al verificar correo' });
  }
});

// Admin approves Advisor Profile
app.post('/api/auth/approve-advisor', (req, res) => {
  try {
    const { userId, adminName } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'ID de usuario requerido' });
    }

    const userIndex = usersStore.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const user = usersStore[userIndex];
    user.accountStatus = 'activo';
    user.role = 'asesor';
    user.emailVerified = true;
    user.approvedByAdminAt = new Date().toISOString();
    user.approvedByAdminName = adminName || 'Jair Magallanes (Administrador)';

    // Dispatch approval email
    const approvalEmail = {
      id: `email-approved-${Date.now()}`,
      to: user.email,
      toName: user.name,
      subject: '🎉 COLORLINK Pintuco® - ¡Tu Perfil de Asesor Técnico ha sido Aprobado!',
      sentAt: new Date().toISOString(),
      type: 'aprobacion_asesor',
      role: 'asesor',
      previewSnippet: `Tu perfil de Asesor Técnico ha sido aprobado por el Administrador (${user.approvedByAdminName}). Tu cuenta ya está 100% activa.`,
      htmlContent: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #1E216B 0%, #2E3192 100%); padding: 24px; text-align: center; color: white;">
            <div style="font-size: 22px; font-weight: 900; color: #F7C548;">COLORLINK by Pintuco®</div>
            <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">Notificación Oficial de Aprobación de Cuenta</div>
          </div>
          <div style="padding: 28px 24px; color: #1e293b;">
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; color: #065f46; font-size: 14px; font-weight: bold;">
              🎉 ¡Tu Perfil de Asesor Técnico ha sido Aprobado!
            </div>
            <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Estimado(a) ${user.name},</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              El <strong>Administrador (${user.approvedByAdminName})</strong> ha revisado y <strong>aprobado formalmente tu rol como Asesor Técnico Comercial</strong> en la plataforma COLORLINK.
            </p>
            <p style="font-size: 13px; color: #475569; line-height: 1.6;">
              Tu perfil ya se encuentra <strong>100% ACTIVO</strong> con acceso a la gestión técnica de obras, diagnósticos con IA y trazabilidad en la red de CEDIs de Pintuco®.
            </p>
          </div>
        </div>
      `,
      isRead: false,
      actionTaken: true,
      associatedUserId: user.id
    };

    notificationsStore.unshift(approvalEmail);

    return res.json({
      success: true,
      message: `El perfil de Asesor Técnico de ${user.name} ha sido aprobado exitosamente y se le ha enviado la notificación por correo.`,
      user: sanitizeUser(user)
    });
  } catch (error: any) {
    console.error('Error in /api/auth/approve-advisor:', error);
    return res.status(500).json({ success: false, error: 'Error al aprobar asesor' });
  }
});

// Admin rejects or changes user
app.post('/api/auth/reject-advisor', (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'ID de usuario requerido' });

    const userIndex = usersStore.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    const user = usersStore[userIndex];
    user.accountStatus = 'rechazado';
    user.rejectionReason = reason || 'No cumple con las credenciales de asesor técnico Pintuco';

    return res.json({
      success: true,
      message: `La solicitud de asesor ha sido rechazada para ${user.name}.`,
      user: sanitizeUser(user)
    });
  } catch (error: any) {
    console.error('Error rejecting advisor:', error);
    return res.status(500).json({ success: false, error: 'Error al rechazar' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Por favor ingresa tu correo electrónico y tu contraseña.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const sb = getSupabaseClient();
    if (!sb) {
      return res.status(503).json({ success: false, error: 'No hay conexión con la base de datos de cuentas. Revisa Supabase.' });
    }

    const { data: savedAuth, error: authLookupError } = await sb.from('colorlink_usuarios_auth')
      .select('password_salt, password_hash, usuario, email_verificado')
      .eq('correo_electronico', normalizedEmail)
      .maybeSingle();
    if (authLookupError) {
      console.error('[Supabase Login Lookup Error]:', authLookupError.message);
      return res.status(503).json({ success: false, error: 'No se pudo consultar la cuenta. Ejecuta el esquema SQL actualizado en Supabase.' });
    }

    let userFound: any = null;
    if (savedAuth) {
      if (!verifyAccountPassword(password.trim(), savedAuth.password_salt, savedAuth.password_hash)) {
        return res.status(401).json({ success: false, incorrectPassword: true, error: 'Contraseña incorrecta. Verifica los datos e inténtalo de nuevo.' });
      }
      userFound = savedAuth.usuario;
      if (!savedAuth.email_verificado) {
        return res.status(403).json({
          success: false,
          notVerified: true,
          error: 'Tu cuenta existe, pero falta verificar el correo. Regístrate de nuevo con este mismo correo para recibir un código actualizado.'
        });
      }
    } else {
      userFound = usersStore.find(u => u.email.toLowerCase() === normalizedEmail);
      if (userFound) {
        if (userFound.password !== password.trim()) {
          return res.status(401).json({ success: false, incorrectPassword: true, error: 'Contraseña incorrecta. Verifica los datos e inténtalo de nuevo.' });
        }
      } else {
        const { data: existingProfile, error: profileLookupError } = await sb.from('perfiles')
          .select('correo_electronico, nombre_completo, email_verificado')
          .eq('correo_electronico', normalizedEmail)
          .maybeSingle();
        if (profileLookupError) {
          console.error('[Supabase Profile Lookup Error]:', profileLookupError.message);
          return res.status(503).json({ success: false, error: 'No se pudo consultar el perfil en Supabase.' });
        }

        if (existingProfile) {
          return res.status(409).json({
            success: false,
            legacyProfile: true,
            error: 'Encontramos tu correo, pero el perfil anterior no tiene credenciales persistentes. Selecciona Registrarse y usa el mismo correo para verificarlo y guardar una contraseña segura.'
          });
        }

        return res.status(404).json({
          success: false,
          notFound: true,
          error: `El correo "${normalizedEmail}" no está registrado en COLORLINK. Regístrate para crear una cuenta.`
        });
      }
    }

    // Check account approval status for advisors
    if (userFound.role === 'asesor' && userFound.accountStatus === 'pendiente_aprobacion_admin') {
      return res.status(403).json({
        success: false,
        pendingAdvisorApproval: true,
        user: sanitizeUser(userFound),
        error: `Tu perfil como Asesor Técnico Comercial (${userFound.name}) se encuentra pendiente de aprobación por el Administrador Central de COLORLINK. Puedes ingresar como Administrador para autorizar tu solicitud.`
      });
    }

    if (userFound.accountStatus === 'rechazado') {
      return res.status(403).json({
        success: false,
        rejected: true,
        error: `Tu solicitud de acceso ha sido rechazada por la administración. Motivo: ${userFound.rejectionReason || 'Contacta al soporte central.'}`
      });
    }

    return res.json({
      success: true,
      message: `¡Bienvenido(a) de nuevo, ${userFound.name}!`,
      user: sanitizeUser(userFound)
    });
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    return res.status(500).json({ success: false, error: 'Error en el servidor al iniciar sesión' });
  }
});

// Update Profile endpoint - Allows updating personal/contact/address information
// strictly protecting primary key & fiscal identifiers (ID, NIT/Doc, Email, System Role)
app.put('/api/auth/profile', (req, res) => {
  try {
    const { id, email, name, phone, city, address, companyOrOrg, positionOrTitle } = req.body;

    if (!id && !email) {
      return res.status(400).json({ success: false, error: 'ID o correo del usuario es requerido para actualizar perfil.' });
    }

    const userIndex = usersStore.findIndex(
      (u) => (id && u.id === id) || (email && u.email.toLowerCase() === email.trim().toLowerCase())
    );

    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado en la base de datos.' });
    }

    const user = usersStore[userIndex];

    // Validate name if provided
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, error: 'El nombre completo no puede estar vacío.' });
      }
      user.name = name.trim();
    }

    // Update non-primary fields
    if (phone !== undefined) user.phone = phone.trim();
    if (city !== undefined) user.city = city.trim();
    if (address !== undefined) user.address = address.trim();
    if (companyOrOrg !== undefined) user.companyOrOrg = companyOrOrg.trim();
    if (positionOrTitle !== undefined) user.positionOrTitle = positionOrTitle.trim();

    user.updatedAt = new Date().toISOString();

    return res.json({
      success: true,
      message: '¡Perfil y datos de contacto actualizados correctamente!',
      user: sanitizeUser(user)
    });
  } catch (error: any) {
    console.error('Error in /api/auth/profile:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar el perfil.' });
  }
});

app.patch('/api/auth/profile', (req, res) => {
  // Alias to PUT
  const fakeReq = { ...req } as any;
  return (app as any)._router.handle(fakeReq, res, () => {});
});

// Email Notifications Endpoints
app.get('/api/notifications/emails', (req, res) => {
  const { to, type } = req.query;
  let filtered = [...notificationsStore];
  if (to && typeof to === 'string') {
    filtered = filtered.filter(n => n.to.toLowerCase() === to.toLowerCase());
  }
  if (type && typeof type === 'string') {
    filtered = filtered.filter(n => n.type === type);
  }
  return res.json({ success: true, data: filtered });
});

app.post('/api/notifications/emails', (req, res) => {
  try {
    const emailData = req.body;
    if (!emailData || !emailData.to || !emailData.subject) {
      return res.status(400).json({ success: false, error: 'Datos de correo incompletos' });
    }
    const newRecord = {
      ...emailData,
      id: emailData.id || `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sentAt: emailData.sentAt || new Date().toISOString(),
      isRead: false
    };
    notificationsStore.unshift(newRecord);
    return res.status(201).json({ success: true, data: newRecord });
  } catch (error: any) {
    console.error('Error creating email notification:', error);
    return res.status(500).json({ success: false, error: 'Error al registrar la notificación' });
  }
});

app.patch('/api/notifications/emails/:id/read', async (req, res) => {
  const { id } = req.params;
  const item = notificationsStore.find(n => n.id === id);
  if (item) {
    item.isRead = true;
  }
  const sb = getSupabaseClient();
  if (sb) {
    const { data } = await sb.from('colorlink_notificaciones').select('datos').eq('id', id).maybeSingle();
    if (data?.datos) {
      await sb.from('colorlink_notificaciones').update({ datos: { ...data.datos, isRead: true } }).eq('id', id);
    }
  }
  return res.json({ success: true, data: item });
});



// Products & Inventory Management API
app.get('/api/products', (req, res) => {
  return res.json({ success: true, data: productsStore });
});

// Update product stock by CEDI or details
app.patch('/api/products/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { city, stock, stockByCity, updatedBy } = req.body;

    const prodIndex = productsStore.findIndex((p) => p.id === id);
    if (prodIndex === -1) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado en catálogo' });
    }

    if (stockByCity && typeof stockByCity === 'object') {
      productsStore[prodIndex].stockByCity = {
        ...productsStore[prodIndex].stockByCity,
        ...stockByCity
      };
    } else if (city && typeof stock === 'number') {
      productsStore[prodIndex].stockByCity = {
        ...productsStore[prodIndex].stockByCity,
        [city]: Math.max(0, Math.round(stock))
      };
    }

    return res.json({
      success: true,
      message: `Inventario actualizado para ${productsStore[prodIndex].name}`,
      data: productsStore[prodIndex]
    });
  } catch (error: any) {
    console.error('Error updating stock:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar el inventario' });
  }
});

// Update full product info (pricing, description, coverage, etc.)
app.put('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const prodIndex = productsStore.findIndex((p) => p.id === id);
    if (prodIndex === -1) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    productsStore[prodIndex] = {
      ...productsStore[prodIndex],
      ...updateData,
      id // preserve original id
    };

    return res.json({
      success: true,
      message: `Producto ${productsStore[prodIndex].name} actualizado con éxito`,
      data: productsStore[prodIndex]
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar el producto' });
  }
});

// Create a new product in the catalog
app.post('/api/products', (req, res) => {
  try {
    const newProductData = req.body;
    if (!newProductData || !newProductData.name || !newProductData.category) {
      return res.status(400).json({ success: false, error: 'Nombre y categoría del producto son obligatorios' });
    }

    const generatedId = newProductData.id || `pintuco-${newProductData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now().toString().slice(-4)}`;

    // Default stock across CEDIs if not specified
    const defaultStockByCity: Record<string, number> = {
      'Medellín': 500,
      'Bogotá': 650,
      'Cali': 350,
      'Barranquilla': 400,
      'Bucaramanga': 200,
      'Cartagena': 250,
      ...(newProductData.stockByCity || {})
    };

    const newProduct = {
      id: generatedId,
      name: newProductData.name,
      line: newProductData.line || 'Línea Especializada Pintuco',
      category: newProductData.category,
      coveragePerGallon: Number(newProductData.coveragePerGallon) || 35,
      recommendedCoats: Number(newProductData.recommendedCoats) || 2,
      voc: newProductData.voc || '< 25 g/L (Bajo VOC)',
      dryingTime: newProductData.dryingTime || '2 a 4 horas entre manos',
      description: newProductData.description || 'Producto de alto desempeño formulado por Pintuco para protección de sustratos.',
      features: Array.isArray(newProductData.features) && newProductData.features.length > 0 
        ? newProductData.features 
        : ['Alta adherencia y cobertura', 'Resistencia química y ambiental', 'Fórmula certificada Pintuco'],
      pricePerGallonCOP: Number(newProductData.pricePerGallonCOP) || 95000,
      pricePerBucketCOP: Number(newProductData.pricePerBucketCOP) || (Number(newProductData.pricePerGallonCOP) * 4.5 || 427500),
      imageBadge: newProductData.imageBadge || 'Nuevo Producto',
      stockByCity: defaultStockByCity
    };

    productsStore.unshift(newProduct);

    return res.status(201).json({
      success: true,
      message: `¡Producto "${newProduct.name}" registrado e incorporado al inventario CEDI y cotizador!`,
      data: newProduct
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return res.status(500).json({ success: false, error: 'Error al registrar el nuevo producto' });
  }
});

app.get('/api/projects', (req, res) => {
  res.json({ success: true, data: projectsStore });
});

app.post('/api/projects', (req, res) => {
  try {
    const formData = req.body;
    if (!formData || !formData.identification || !formData.technical) {
      return res.status(400).json({ error: 'Datos de captura incompletos' });
    }

    const newId = generateProjectId();
    const solution = calculatePintucoSolution(formData);

    // Pick closest CEDI or matching city
    const projectCity = formData.project?.city || 'Medellín';
    const matchingCEDI =
      CEDI_LOCATIONS.find((c) => c.city.toLowerCase() === projectCity.toLowerCase()) ||
      CEDI_LOCATIONS[0];

    const newRecord = {
      id: newId,
      createdAt: new Date().toISOString(),
      status: 'capturado' as const,
      channel: formData.identification?.channel || 'web_portal',
      deliveryUrgency: formData.project?.deliveryUrgency || 'express_3_5dias',
      deliveryMethod: formData.project?.deliveryMethod || 'envio_obra',
      pickupStoreOrCedi: formData.project?.pickupStoreOrCedi || '',
      formData,
      solution,
      assignedWarehouse: {
        cediName: matchingCEDI.name,
        city: matchingCEDI.city,
        stockAvailable: true,
        reservationCode: `RES-${matchingCEDI.city.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
      },
      serviceDispatch: {
        technicianOrContractor: `Red Aplicadores Certificados Pintuco - Zona ${matchingCEDI.city}`,
        certificationLevel: 'Nivel 2 Plata / Oro Pintuco',
        estimatedExecutionDays: Math.max(2, Math.ceil((formData.project?.areaM2 || 100) / 120)),
        scheduledStartDate: formData.project?.requiredDate || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
      },
      qualityAssurance: {
        inspectorName: `Ing. Asistencia Técnica Pintuco (${matchingCEDI.city})`,
        warrantyDocId: `GAR-${matchingCEDI.city.substring(0, 3).toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`,
        adherenceTestPassed: true,
        thicknessMicronsRecommended: `${solution.coatsRecommended * 45} µm DFT Película Seca`
      }
    };

    projectsStore.unshift(newRecord);

    // Auto notify client on project creation
    notifyProjectStatusChange(
      newRecord,
      'capturado',
      'Diagnóstico y Especificación Técnica Radicada',
      `Tu proyecto ${newId} ha sido formulado exitosamente en el CEDI ${matchingCEDI.name}. Nuestro asesor técnico validará el diagnóstico y las cantidades requeridas.`
    );

    // Sync project to Supabase PostgreSQL database
    const sb = getSupabaseClient();
    if (sb) {
      (async () => {
        try {
          const nit = formData.identification?.nit || `CLI-${Date.now().toString().slice(-6)}`;
          const clientName = formData.identification?.clientName || 'Cliente ColorLink';
          const email = (formData.identification?.contactEmail || 'contacto@colorlink.pintuco.com').toLowerCase();

          // Upsert client
          const { data: cData } = await sb.from('clientes').upsert({
            nit_cedula: nit,
            nombre_empresa: clientName,
            nombre_contacto: formData.identification?.contactPerson || clientName,
            correo_contacto: email,
            telefono_contacto: formData.identification?.contactPhone || '3000000000',
            ciudad: formData.project?.city || 'Medellín',
            direccion_facturacion: formData.project?.address || 'Colombia'
          }, { onConflict: 'nit_cedula' }).select('id').maybeSingle();

          // Insert project
          await sb.from('proyectos').insert({
            codigo: newId,
            cliente_id: cData?.id || null,
            estado: 'cotizado',
            area_m2: formData.project?.areaM2 || 100,
            tipo_superficie: formData.technical?.surface || 'mamposteria_concreto',
            ambiente: formData.technical?.environment || 'exterior_intemperie',
            condicion_superficie: formData.technical?.condition || 'buen_estado',
            nombre_color_objetivo: formData.technical?.colorName || 'Blanco Pintuco',
            hex_color_objetivo: formData.technical?.colorHex || '#F5F5F0',
            acabado_objetivo: formData.technical?.finish || 'Mate',
            monto_total: solution.estimatedMaterialCostCOP || 0,
            datos_completos_json: newRecord
          });
        } catch (e: any) {
          console.warn('[Supabase Server Sync Project Exception]:', e?.message);
        }
      })();
    }

    return res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Error al procesar y calcular el proyecto' });
  }
});

// Update project status with optional event log
app.patch('/api/projects/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, eventNote, authorName } = req.body;
  const index = projectsStore.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }
  
  projectsStore[index].status = status;
  
  // Ensure timelineEvents array exists
  if (!projectsStore[index].timelineEvents) {
    projectsStore[index].timelineEvents = [];
  }
  
  if (eventNote) {
    projectsStore[index].timelineEvents.push({
      id: `evt-${Date.now()}`,
      status: status,
      title: `Cambio de Estado: ${status}`,
      description: eventNote,
      timestamp: new Date().toISOString(),
      author: authorName || 'Sistema ColorLink'
    });
  }

  // Auto dispatch notification to client via Email + WhatsApp
  notifyProjectStatusChange(
    projectsStore[index],
    status,
    `Estado Actualizado a ${status}`,
    eventNote || `Tu proyecto ${projectsStore[index].id} ha cambiado de estado a ${status}.`
  );

  // Update status in Supabase if live
  const sb = getSupabaseClient();
  if (sb) {
    (async () => {
      try {
        const { error } = await sb.from('proyectos')
          .update({ estado: status })
          .or(`codigo.eq.${id},id.eq.${id}`);
        if (error) console.warn('[Supabase Patch Project Warning]:', error.message);
      } catch (err: any) {
        console.warn('[Supabase Patch Project Catch]:', err?.message);
      }
    })();
  }
  
  return res.json({ success: true, data: projectsStore[index] });
});

// Step: Validate Stock in CEDI prior to sending quote
app.post('/api/projects/:id/validate-stock', (req, res) => {
  try {
    const { id } = req.params;
    const { assignedCedi, availableGallons, requiredGallons, notes, validatedBy } = req.body;
    
    const index = projectsStore.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const isAvailable = (availableGallons || 100) >= (requiredGallons || 1);

    projectsStore[index].stockValidation = {
      isValidated: true,
      validatedAt: new Date().toISOString(),
      validatedBy: validatedBy || 'Asesor Técnico Comercial',
      isStockAvailable: isAvailable,
      assignedCedi: assignedCedi || projectsStore[index].assignedWarehouse.cediName,
      availableGallons: availableGallons || 500,
      requiredGallons: requiredGallons || projectsStore[index].solution.gallonsPrimary,
      notes: notes || 'Inventario en CEDI verificado satisfactoriamente.'
    };

    if (projectsStore[index].status === 'capturado') {
      projectsStore[index].status = 'validacion_stock_previa';
    }

    if (!projectsStore[index].timelineEvents) {
      projectsStore[index].timelineEvents = [];
    }

    projectsStore[index].timelineEvents.push({
      id: `evt-${Date.now()}`,
      status: 'validacion_stock_previa',
      title: 'Validación de Stock en CEDI Pintuco',
      description: `Inventario verificado en ${assignedCedi || projectsStore[index].assignedWarehouse.cediName}. Disponibilidad: ${isAvailable ? 'Suficiente para despacho' : 'Bajo stock / Reabastecimiento requerido'}.`,
      timestamp: new Date().toISOString(),
      author: validatedBy || 'Asesor Técnico'
    });

    return res.json({ success: true, data: projectsStore[index] });
  } catch (error) {
    console.error('Error validating stock:', error);
    return res.status(500).json({ error: 'Error al validar stock de inventario' });
  }
});

// Step: Client Decision on Quotation (Accept or Reject)
app.post('/api/projects/:id/client-decision', (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reason, authorName } = req.body; // decision: 'aceptada' | 'rechazada'
    
    const index = projectsStore.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    if (!projectsStore[index].timelineEvents) {
      projectsStore[index].timelineEvents = [];
    }

    if (decision === 'aceptada') {
      projectsStore[index].status = 'inventario_reservado';
      if (!projectsStore[index].quotationInfo) {
        projectsStore[index].quotationInfo = {
          quoteId: `COT-${projectsStore[index].id.replace('COLORLINK-', '')}`,
          totalCOP: projectsStore[index].solution.estimatedMaterialCostCOP,
          sentAt: new Date().toISOString()
        };
      }
      projectsStore[index].quotationInfo.clientDecision = 'aceptada';
      projectsStore[index].quotationInfo.decisionDate = new Date().toISOString();

      projectsStore[index].timelineEvents.push({
        id: `evt-${Date.now()}`,
        status: 'inventario_reservado',
        title: 'Cotización ACEPTADA por el Cliente',
        description: 'El cliente aprobó la propuesta económica y técnica. Se procede con la reserva de inventario en CEDI y solicitud de pago.',
        timestamp: new Date().toISOString(),
        author: authorName || projectsStore[index].formData.identification.clientName || 'Cliente'
      });
    } else {
      // Rejection -> Process ends here
      projectsStore[index].status = 'cotizacion_rechazada';
      if (!projectsStore[index].quotationInfo) {
        projectsStore[index].quotationInfo = {
          quoteId: `COT-${projectsStore[index].id.replace('COLORLINK-', '')}`,
          totalCOP: projectsStore[index].solution.estimatedMaterialCostCOP,
          sentAt: new Date().toISOString()
        };
      }
      projectsStore[index].quotationInfo.clientDecision = 'rechazada';
      projectsStore[index].quotationInfo.decisionDate = new Date().toISOString();
      projectsStore[index].quotationInfo.rejectionReason = reason || 'Cliente no aceptó las condiciones de la cotización.';

      projectsStore[index].timelineEvents.push({
        id: `evt-${Date.now()}`,
        status: 'cotizacion_rechazada',
        title: 'Cotización RECHAZADA por el Cliente (Fin del Proceso)',
        description: `Motivo del rechazo: ${reason || 'No especificado'}. Proceso cerrado sin despacho de materiales.`,
        timestamp: new Date().toISOString(),
        author: authorName || projectsStore[index].formData.identification.clientName || 'Cliente'
      });
    }

    notifyProjectStatusChange(
      projectsStore[index],
      projectsStore[index].status,
      decision === 'aceptada' ? 'Cotización Aprobada por Cliente' : 'Cotización Rechazada',
      decision === 'aceptada' 
        ? 'Has aprobado la cotización técnica. Tu inventario se encuentra reservado y el pedido avanza a fase de pago.'
        : `Cotización cancelada por el cliente. Motivo: ${reason || 'Condiciones comerciales no aceptadas'}.`
    );

    return res.json({ success: true, data: projectsStore[index] });
  } catch (error) {
    console.error('Error handling client decision:', error);
    return res.status(500).json({ error: 'Error al procesar la decisión del cliente' });
  }
});

// Step: Payment Verification (Check if client paid before dispatching)
app.post('/api/projects/:id/verify-payment', (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentReference, paymentAmountCOP, paymentDate, isVerified, verifiedBy, notes } = req.body;

    const index = projectsStore.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    if (!projectsStore[index].timelineEvents) {
      projectsStore[index].timelineEvents = [];
    }

    const verified = isVerified !== undefined ? isVerified : true;

    projectsStore[index].paymentVerification = {
      isPaid: true,
      paymentMethod: paymentMethod || 'transferencia_bancolombia',
      paymentReference: paymentReference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentAmountCOP: paymentAmountCOP || projectsStore[index].solution.estimatedMaterialCostCOP,
      paymentDate: paymentDate || new Date().toISOString(),
      isVerified: verified,
      verifiedBy: verified ? (verifiedBy || 'Tesorería Pintuco') : undefined,
      verifiedAt: verified ? new Date().toISOString() : undefined,
      notes: notes || (verified ? 'Pago validado y confirmado. Pedido autorizado para despacho.' : 'Comprobante recibido, pendiente confirmación en extracto bancario.')
    };

    if (verified) {
      projectsStore[index].status = 'verificacion_pago';
      projectsStore[index].timelineEvents.push({
        id: `evt-${Date.now()}`,
        status: 'verificacion_pago',
        title: 'Pago del Cliente VERIFICADO y Aprobado',
        description: `Comprobante ${paymentReference || 'N/A'} verificado por Tesorería. Monto: $${new Intl.NumberFormat('es-CO').format(paymentAmountCOP || projectsStore[index].solution.estimatedMaterialCostCOP)} COP. Pedido liberado para despacho logístico.`,
        timestamp: new Date().toISOString(),
        author: verifiedBy || 'Tesorería Pintuco'
      });
      
      notifyProjectStatusChange(
        projectsStore[index],
        'verificacion_pago',
        'Pago Aprobado por Tesorería',
        `Tu pago por $${new Intl.NumberFormat('es-CO').format(paymentAmountCOP || projectsStore[index].solution.estimatedMaterialCostCOP)} COP ha sido verificado con éxito. La orden fue liberada al CEDI para alistamiento y despacho inmediato.`
      );
    } else {
      projectsStore[index].status = 'verificacion_pago';
      projectsStore[index].timelineEvents.push({
        id: `evt-${Date.now()}`,
        status: 'verificacion_pago',
        title: 'Comprobante de Pago Registrado por el Cliente',
        description: `Referencia: ${paymentReference || 'N/A'}. En espera de validación bancaria para autorizar salida de bodega.`,
        timestamp: new Date().toISOString(),
        author: 'Cliente'
      });
      
      notifyProjectStatusChange(
        projectsStore[index],
        'verificacion_pago',
        'Comprobante de Pago en Revisión',
        `Recibimos tu soporte de pago con referencia ${paymentReference || 'N/A'}. Nuestro equipo de tesorería está conciliando la transacción.`
      );
    }

    return res.json({ success: true, data: projectsStore[index] });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ error: 'Error al registrar la verificación de pago' });
  }
});

// Step: Dispatch & Shipping / Pickup of materials
app.post('/api/projects/:id/dispatch', async (req, res) => {
  try {
    if ((req.body?.authorEmail || '').toLowerCase() !== 'jairmagallanes@gmail.com') {
      return res.status(403).json({ error: 'Solo el administrador Jair Magallanes puede confirmar el despacho.' });
    }
    const { id } = req.params;
    const {
      carrierName,
      trackingNumber,
      vehiclePlate,
      driverContact,
      estimatedDeliveryDate,
      deliveryAddress,
      deliveryMethod,
      pickupStoreOrCedi,
      pickupVerificationCode,
      pickupAuthorizedPerson,
      isPickupDelivered,
      notes,
      authorName
    } = req.body;

    const index = projectsStore.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Verify payment was verified first
    if (!projectsStore[index].paymentVerification?.isVerified) {
      return res.status(400).json({
        error: 'No se puede despachar los materiales sin previa verificación y confirmación del pago del cliente.'
      });
    }

    if (!projectsStore[index].timelineEvents) {
      projectsStore[index].timelineEvents = [];
    }

    const currentMethod = deliveryMethod || projectsStore[index].formData.project?.deliveryMethod || 'envio_obra';
    const isPickup = currentMethod === 'retiro_tienda';
    const storeLocation = pickupStoreOrCedi || projectsStore[index].formData.project?.pickupStoreOrCedi || 'Tienda Pintacasa Pintuco® Central';
    const claimCode = pickupVerificationCode || projectsStore[index].dispatchInfo?.pickupVerificationCode || `RETIRO-PIN-${Math.floor(1000 + Math.random() * 9000)}`;
    const authPerson = pickupAuthorizedPerson || projectsStore[index].formData.project?.pickupAuthorizedPerson || projectsStore[index].formData.identification?.contactPerson || 'Cliente Titular';

    if (isPickup) {
      projectsStore[index].dispatchInfo = {
        isDispatched: true,
        deliveryMethod: 'retiro_tienda',
        pickupStoreOrCedi: storeLocation,
        pickupVerificationCode: claimCode,
        pickupAuthorizedPerson: authPerson,
        isPickupReady: true,
        isPickupDelivered: Boolean(isPickupDelivered),
        carrierName: 'Retiro Directo en Tienda Pintacasa / CEDI',
        trackingNumber: claimCode,
        dispatchedAt: new Date().toISOString(),
        estimatedDeliveryDate: estimatedDeliveryDate || new Date().toISOString().split('T')[0],
        vehiclePlate: 'Retiro Mostrador',
        driverContact: 'Atención al Cliente Pintacasa',
        deliveryAddress: `Retiro en Sede: ${storeLocation}`
      };

      projectsStore[index].status = 'despacho_en_camino';

      projectsStore[index].timelineEvents.push({
        id: `evt-${Date.now()}`,
        status: 'despacho_en_camino',
        title: isPickupDelivered
          ? 'Materiales ENTREGADOS en Mostrador Pintacasa'
          : 'Materiales LISTOS para Retiro en Tienda Pintacasa',
        description: isPickupDelivered
          ? `Entrega completada en mostrador a ${authPerson}. Código verificado: ${claimCode}.`
          : `Pedido alistado y disponible para retiro en ${storeLocation}. Código de reclamo: ${claimCode}. Persona autorizada: ${authPerson}.`,
        timestamp: new Date().toISOString(),
        author: authorName || 'Mostrador Tienda Pintacasa'
      });
    } else {
      projectsStore[index].dispatchInfo = {
        isDispatched: true,
        deliveryMethod: 'envio_obra',
        carrierName: carrierName || 'Flota Logística Especializada Pintuco Express',
        trackingNumber: trackingNumber || `GUIA-PIN-${Math.floor(10000 + Math.random() * 90000)}`,
        dispatchedAt: new Date().toISOString(),
        estimatedDeliveryDate: estimatedDeliveryDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        vehiclePlate: vehiclePlate || 'PNT-2026',
        driverContact: driverContact || 'Conductor Asignado (+57 300 000 0000)',
        deliveryAddress: deliveryAddress || projectsStore[index].formData.project.address || `Obra ${projectsStore[index].formData.project.city}`
      };

      projectsStore[index].status = 'despacho_en_camino';

      projectsStore[index].timelineEvents.push({
        id: `evt-${Date.now()}`,
        status: 'despacho_en_camino',
        title: 'Materiales DESPACHADOS en Ruta hacia la Obra',
        description: `Guía ${projectsStore[index].dispatchInfo.trackingNumber} con ${carrierName || 'Transportadora Pintuco'}. Placa: ${vehiclePlate || 'N/A'}. Destino: ${deliveryAddress || projectsStore[index].formData.project.address || projectsStore[index].formData.project.city}.`,
        timestamp: new Date().toISOString(),
        author: authorName || 'Logística & Despacho CEDI'
      });
    }

    const dispatchDetails = isPickup
      ? (isPickupDelivered
          ? `Materiales entregados en mostrador Pintacasa a ${authPerson}. Código verificado: ${claimCode}.`
          : `Tus materiales están listos para retiro en ${storeLocation}. Código de retiro: ${claimCode}. Persona autorizada: ${authPerson}.`)
      : `Tus materiales van en camino con ${carrierName || 'Transportadora Pintuco'}. Guía de rastreo: ${projectsStore[index].dispatchInfo.trackingNumber}. Placa: ${vehiclePlate || 'N/A'}. Destino: ${deliveryAddress || projectsStore[index].formData.project.address || projectsStore[index].formData.project.city}.`;

    notifyProjectStatusChange(
      projectsStore[index],
      'despacho_en_camino',
      isPickup ? (isPickupDelivered ? 'Materiales Entregados en Pintacasa' : 'Materiales Listos para Retiro') : 'Materiales Despachados en Ruta',
      dispatchDetails
    );

    const sb = getSupabaseClient();
    if (sb) {
      const { error } = await sb.from('proyectos').update({
        estado: projectsStore[index].status,
        datos_completos_json: projectsStore[index]
      }).eq('codigo', id);
      if (error) console.warn('[Supabase Dispatch Persistence Warning]:', error.message);
    }

    return res.json({ success: true, data: projectsStore[index] });
  } catch (error) {
    console.error('Error dispatching project:', error);
    return res.status(500).json({ error: 'Error al procesar el despacho de materiales' });
  }
});

// Phase 7: Admin confirms that the vehicle delivered the order to the client.
app.post('/api/projects/:id/confirm-delivery', async (req, res) => {
  try {
    const gpsCompletion = req.body?.source === 'gps_simulation' && Number(req.body?.progress) >= 100;
    if (!gpsCompletion && (req.body?.authorEmail || '').toLowerCase() !== 'jairmagallanes@gmail.com') {
      return res.status(403).json({ success: false, error: 'Solo el administrador puede confirmar la entrega.' });
    }

    const { id } = req.params;
    const index = projectsStore.findIndex(project => project.id === id);
    if (index < 0) return res.status(404).json({ success: false, error: 'Proyecto no encontrado.' });
    const project = projectsStore[index];
    if (!project.dispatchInfo?.isDispatched) {
      return res.status(400).json({ success: false, error: 'Primero registra el despacho del producto.' });
    }
    if (project.status === 'finalizado') {
      return res.json({ success: true, data: project, alreadyDelivered: true });
    }

    const deliveredAt = new Date().toISOString();
    project.status = 'finalizado';
    project.dispatchInfo.deliveredAt = deliveredAt;
    project.dispatchInfo.receivedByName = (req.body?.receivedByName || project.formData?.identification?.clientName || 'Cliente').trim();
    project.timelineEvents = project.timelineEvents || [];
    const eventDescription = `El pedido fue entregado en ${project.dispatchInfo.deliveryAddress || project.formData?.project?.address || project.formData?.project?.city || 'la dirección registrada'}. Guía ${project.dispatchInfo.trackingNumber || 'sin guía'}. Recibido por ${project.dispatchInfo.receivedByName}.`;
    project.timelineEvents.push({
      id: `evt-${Date.now()}`,
      status: 'finalizado',
      title: 'Fase 7: Producto Entregado al Cliente',
      description: eventDescription,
      timestamp: deliveredAt,
      author: req.body?.authorName || (gpsCompletion ? 'Simulador GPS' : 'Jair Magallanes (Administrador)')
    });

    const sb = getSupabaseClient();
    if (sb) {
      const { error } = await sb.from('proyectos').update({
        estado: 'finalizado',
        datos_completos_json: project
      }).eq('codigo', id);
      if (error) console.warn('[Supabase Delivery Persistence Warning]:', error.message);
    }

    notifyProjectStatusChange(project, 'finalizado', 'Fase 7: Producto Entregado al Cliente', eventDescription);
    return res.json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error confirming delivery:', error);
    return res.status(500).json({ success: false, error: 'No se pudo confirmar la entrega.' });
  }
});

// Quotations Endpoints
app.get('/api/quotes', (req, res) => {
  return res.json({ success: true, data: quotesStore });
});

app.post('/api/quotes', (req, res) => {
  try {
    const quoteData = req.body;
    if (!quoteData || !quoteData.clientName || !quoteData.areaM2) {
      return res.status(400).json({ error: 'Datos de cotización incompletos' });
    }

    const quoteId = `COT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newQuote = {
      ...quoteData,
      id: quoteId,
      createdAt: new Date().toISOString(),
      status: quoteData.status || 'enviada',
      validUntil: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0]
    };

    quotesStore.unshift(newQuote);

    // Auto dispatch email & WhatsApp notification to client
    const totalStr = new Intl.NumberFormat('es-CO').format(newQuote.totalCOP || newQuote.subtotalNetCOP || 0);
    const clientPhone = newQuote.clientPhone || COMPANY_WHATSAPP;
    const clientEmail = newQuote.clientEmail || 'cliente@pintuco.com';
    const clientName = newQuote.clientName || 'Cliente';
    const areaM2 = newQuote.areaM2 || 100;
    const productName = newQuote.selectedProductName || 'Viniltex® / Koraza® Pintuco';
    const cuñetes = newQuote.cuñetesNeeded || 0;
    const warrantyYears = newQuote.warrantyYears || 5;

    const whatsappMsg = 
`🎨 *COLORLINK Pintuco® - Cotización Oficial #${quoteId}*
Estimado(a) *${clientName}*, tu propuesta técnica de recubrimientos ha sido formulada con éxito:

🏠 *Proyecto / Obra:* ${newQuote.projectCity || 'Medellín'} (${areaM2} m²)
🧪 *Producto Recomendado:* ${productName}
📦 *Volumen Calculado:* ${cuñetes} Cuñetes de 5 Galones
💰 *Inversión Total:* $${totalStr} COP
🛡️ *Garantía Oficial:* ${warrantyYears} Años de Fábrica Pintuco S.A.
⏳ *Vigencia de Oferta:* ${newQuote.validUntil}

Para consultar el desglose completo y aprobar tu pedido:
👉 ${APP_PUBLIC_URL}

_Pintuco S.A. • Asesoría Técnica Comercial: +57 323 603 0829_`;

    const quoteHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1E216B, #2E3192); padding: 24px; text-align: center; color: white;">
          <h2 style="margin: 0; color: #F7C548;">COLORLINK by Pintuco®</h2>
          <p style="margin: 4px 0 0 0; font-size: 14px;">Cotización Oficial #${quoteId}</p>
        </div>
        <div style="padding: 24px; color: #334155;">
          <p style="font-size: 15px; margin-top: 0;">Estimado(a) <strong>${clientName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5;">
            Adjuntamos la propuesta económica y técnica para tu proyecto en <strong>${newQuote.projectCity || 'Colombia'}</strong>:
          </p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; font-size: 13px; line-height: 1.8; margin: 16px 0;">
            <div><strong>Área Total:</strong> ${areaM2} m²</div>
            <div><strong>Producto:</strong> ${productName}</div>
            <div><strong>Volumen:</strong> ${cuñetes} Cuñetes (5 Gal)</div>
            <div><strong>Garantía:</strong> ${warrantyYears} Años Certificados</div>
            <div style="font-size: 16px; font-weight: bold; color: #1E216B; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
              Total Inversión: $${totalStr} COP
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${APP_PUBLIC_URL}" style="background: #2E3192; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px;">
              Ver y Gestionar Cotización
            </a>
          </div>
        </div>
      </div>
    `;

    const quoteNotification = {
      id: `email-quote-${quoteId}`,
      to: clientEmail,
      toName: clientName,
      subject: `🎨 COLORLINK Pintuco® - Cotización Oficial #${quoteId} ($${totalStr} COP)`,
      sentAt: new Date().toISOString(),
      type: 'cotizacion_generada',
      previewSnippet: `Cotización #${quoteId} para ${clientName}. Total: $${totalStr} COP (${cuñetes} cuñetes ${productName}).`,
      htmlContent: quoteHtml,
      isRead: false,
      associatedQuoteId: quoteId,
      clientPhone,
      whatsappMessage: whatsappMsg,
      whatsappUrl: buildWhatsAppUrl(clientPhone, whatsappMsg)
    };

    recordAndDispatchNotification(quoteNotification).catch(console.warn);

    return res.status(201).json({ success: true, data: newQuote });
  } catch (error) {
    console.error('Error creating quote:', error);
    return res.status(500).json({ error: 'Error al procesar la cotización' });
  }
});

app.post('/api/quotes/:id/convert-to-project', (req, res) => {
  try {
    const { id } = req.params;
    const quoteIndex = quotesStore.findIndex(q => q.id === id);
    if (quoteIndex === -1) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }

    const quote = quotesStore[quoteIndex];
    const projectId = generateProjectId();

    // Map quotation to ProjectRecord
    const formData = {
      identification: {
        clientName: quote.clientName,
        nit: quote.clientDoc || '900.000.000-1',
        contactPerson: quote.clientName,
        contactPhone: quote.clientPhone || '+57 300 000 0000',
        contactEmail: quote.clientEmail || 'cliente@pintuco.com',
        channel: 'web_portal' as const
      },
      project: {
        city: quote.projectCity || 'Medellín',
        projectType: 'residencial' as const,
        areaM2: quote.areaM2,
        requiredDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        address: quote.address || `Proyecto Cotización ${quote.id}`
      },
      technical: {
        surface: quote.surfaceType || 'mamposteria_concreto',
        environment: quote.environment || 'interior_seco',
        condition: quote.condition || 'buen_estado',
        finish: 'mate' as const,
        colorName: quote.colorName || 'Color Estándar Pintuco'
      },
      evidence: {
        description: `Proyecto originado desde Cotización Formal ${quote.id}. Incluye ${quote.areaM2} m² con producto ${quote.selectedProductName || 'Pintuco'}.`,
        photos: [],
        observations: `Cotización Formal de $${new Intl.NumberFormat('es-CO').format(quote.totalCOP)} COP aprobada por el cliente.`,
        consentHabeasData: true
      }
    };

    const solution = calculatePintucoSolution(formData as any);
    const matchingCEDI =
      CEDI_LOCATIONS.find((c) => c.city.toLowerCase() === (quote.projectCity || 'Medellín').toLowerCase()) ||
      CEDI_LOCATIONS[0];

    const newProjectRecord = {
      id: projectId,
      createdAt: new Date().toISOString(),
      status: 'inventario_reservado' as const,
      channel: quote.channel || 'web_portal',
      deliveryUrgency: quote.deliveryUrgency || 'express_3_5dias',
      formData,
      solution,
      assignedWarehouse: {
        cediName: matchingCEDI.name,
        city: matchingCEDI.city,
        stockAvailable: true,
        reservationCode: `RES-${matchingCEDI.city.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
      },
      serviceDispatch: {
        technicianOrContractor: quote.includeLabor
          ? `Cuadrilla Pintores Certificados Oro Pintuco (${matchingCEDI.city})`
          : `Despacho Directo Materiales - Asesor Técnico Pintuco (${matchingCEDI.city})`,
        certificationLevel: 'Nivel 3 Oro Pintuco',
        estimatedExecutionDays: Math.max(2, Math.ceil(quote.areaM2 / 100)),
        scheduledStartDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
      },
      qualityAssurance: {
        inspectorName: `Ing. Control Calidad (${matchingCEDI.city})`,
        warrantyDocId: `GAR-${matchingCEDI.city.substring(0, 3).toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`,
        adherenceTestPassed: true,
        thicknessMicronsRecommended: `${quote.coats * 45} µm DFT Película Seca`
      }
    };

    // Update quote status
    quotesStore[quoteIndex].status = 'convertida_en_proyecto';
    quotesStore[quoteIndex].convertedProjectId = projectId;

    projectsStore.unshift(newProjectRecord);

    // Auto notify client of converted project
    notifyProjectStatusChange(
      newProjectRecord,
      'presupuesto_aprobado',
      'Proyecto Creado a partir de Cotización Aprobada',
      `Tu cotización ${quote.id} fue convertida en el proyecto oficial ${projectId}. Se ha reservado el inventario en ${matchingCEDI.name} y se alista la orden comercial.`
    );

    return res.json({
      success: true,
      message: `¡Cotización ${quote.id} convertida exitosamente en el Proyecto ${projectId}!`,
      project: newProjectRecord,
      quote: quotesStore[quoteIndex]
    });
  } catch (error) {
    console.error('Error converting quote to project:', error);
    return res.status(500).json({ error: 'Error al convertir la cotización a proyecto' });
  }
});

// Catalog & CEDIs
app.get('/api/catalog', (req, res) => {
  res.json({
    success: true,
    products: PINTUCO_PRODUCTS,
    cedis: CEDI_LOCATIONS
  });
});

// AI Diagnosis & Visual Finish Simulation Endpoint
app.post('/api/ai/diagnose', async (req, res) => {
  try {
    const { 
      surface, 
      environment, 
      condition, 
      areaM2, 
      description, 
      photoDescription, 
      colorName, 
      colorHex, 
      finish 
    } = req.body;

    const surfaceLabel = String(surface || 'mamposteria_concreto').replace(/_/g, ' ');
    const envLabel = String(environment || 'exterior_intemperie').replace(/_/g, ' ');
    const condLabel = String(condition || 'desgaste').replace(/_/g, ' ');
    const chosenColor = colorName || 'Blanco Lino 1001-P';
    const chosenHex = colorHex || '#F7F6F2';
    const area = Number(areaM2) || 100;

    // Helper to calculate realistic fallback response
    const getFallback = () => {
      const isExterior = String(environment || '').includes('exterior') || String(environment || '').includes('inmersion');
      const isMetal = String(surface || '').includes('metal');
      const isIndustrial = String(surface || '').includes('piso') || String(environment || '').includes('industrial');

      const primaryProd = isIndustrial
        ? 'Pintucoat® Epóxico de Altos Sólidos'
        : isMetal
        ? 'Pintulux® 3 en 1 Esmalte Anticorrosivo con inhibidor directo al óxido'
        : isExterior
        ? 'Koraza® 5 Máxima Durabilidad Exteriores con elastómeros antifisuras y filtro UV'
        : 'Viniltex® Bio-Cuidado Antibacterial con alta lavabilidad y 0 VOC';

      const primerProd = isIndustrial
        ? 'Pintupox® Primer Epóxico Poliamida'
        : isMetal
        ? 'Pintulux® Anticorrosivo Cromato de Zinc'
        : isExterior
        ? 'Sellomax® 7 en 1 Imprimante Fijador Antihumedad y Antisalitre'
        : 'Sellomax® Acrílico Base Agua Transparente';

      return {
        diagnostico: `Evaluación técnica para sustrato de ${surfaceLabel} expuesto a ${envLabel}. Se detecta condición de "${condLabel}" con riesgo de deterioro progresivo por humedad, agentes climáticos o desgaste superficial. Requiere saneamiento y sistema de recubrimiento Pintuco® de alto desempeño.`,
        recomendacionPintuco: primaryProd,
        imprimanteRecomendado: primerProd,
        sistemaCapas: [
          `Fase 1: Preparación y limpieza mecánica del sustrato (eliminación de polvo, grasas o partes sueltas).`,
          `Fase 2: Aplicación de 1 mano de ${primerProd} para neutralizar alcalinidad y sellar microfisuras.`,
          `Fase 3: Aplicación de 1ª mano de ${primaryProd} diluida al 10-15% con agua o solvente según corresponda.`,
          `Fase 4: Aplicación de 2ª mano de acabado final de ${primaryProd} para lograr 3.5 a 4.0 mils de espesor seco.`
        ],
        materialesVenta: [
          {
            producto: primaryProd,
            presentacion: area > 150 ? 'Cuñetes (5 Gal) + Galones' : 'Galones (3.785 L)',
            cantidadEstimada: `${Math.ceil((area * 2) / 35)} galones aprox. (${Math.ceil(area)} m² a 2 manos)`,
            rol: 'Acabado y Protección Principal'
          },
          {
            producto: primerProd,
            presentacion: 'Galón o Cuñete según área',
            cantidadEstimada: `${Math.ceil(area / 40)} galón(es) de imprimante`,
            rol: 'Sellado, Fijación e Inhibición de Humedad'
          },
          {
            producto: 'Masilla Acrílica / Sellador de Grietas Pintuco®',
            presentacion: 'Galón / Cartucho',
            cantidadEstimada: '1 a 2 unidades',
            rol: 'Calafateo y Nivelación de Superficie'
          },
          {
            producto: 'Kit Profesional Pintuco (Rodillo Microfibra + Brocha 3" + Bandeja)',
            presentacion: 'Kit de Aplicación',
            cantidadEstimada: '1 a 2 kits',
            rol: 'Herramientas Certificadas de Aplicación'
          }
        ],
        simulacionAcabado: {
          titulo: `Acabado de Alta Gama con ${primaryProd}`,
          descripcionResultado: `La superficie quedará 100% homogénea, continua y sellada, en el tono elegido "${chosenColor}" (${chosenHex}). El sistema Pintuco® elimina visualmente las imperfecciones de ${condLabel}, proporcionando una película hidrorrepelente que repele el polvo y la lluvia.`,
          texturaVisual: 'Textura tersa, uniforme, sin marcas de traslape ni sombras, con efecto hidrófobo de perleo de agua.',
          nivelBrillo: isMetal || isIndustrial ? 'Brillante industrial de alta reflexión y fácil limpieza' : isExterior ? 'Mate satinado con protección solar UV y elastómeros' : 'Mate aterciopelado de alta elegancia y lavabilidad',
          tonoColor: `${chosenColor} (${chosenHex})`,
          durabilidadGarantizada: isExterior ? 'Garantía certificada de 5 a 7 años contra decoloración y caleo' : 'Durabilidad superior de más de 8 años con resistencia a 2,000 ciclos de lavado',
          beneficioEstetico: 'Máxima luminosidad, valorización inmediata del inmueble y estética arquitectónica moderna.',
          aspectosTransformados: [
            `Eliminación total del defecto inicial (${condLabel}).`,
            `Sellado elástico que previene reaparición de manchas y salitre.`,
            `Tono ${chosenColor} uniforme con protección contra rayos ultravioleta.`,
            `Película antimicrobiana y lavable certificada.`
          ]
        },
        pasosClave: [
          'Limpieza y desengrase o remoción de residuos.',
          'Corrección de imperfecciones con Masilla Pintuco.',
          'Aplicación de Imprimante Sellomax o Anticorrosivo.',
          '2 manos de acabado respetando 3 horas de secado.'
        ],
        riesgosMitigados: [
          'Previene desprendimiento de pintura y ampollamiento.',
          'Evita filtraciones de agua y eflorescencia salina.',
          'Protege la estructura contra corrosión o degradación solar.',
          'Optimiza el presupuesto garantizando el rendimiento por m².'
        ],
        selloSostenibilidad: 'Fórmula Pintuco eco-amigable con ultra bajo VOC (Compuestos Orgánicos Volátiles), segura para el medio ambiente y los aplicadores.'
      };
    };

    // Try Groq AI first using the configured API Key (gsk_...)
    const groqSystemPrompt = `Eres el Director Técnico Especialista de Inteligencia Artificial para PINTUCO Colombia y la plataforma COLORLINK.
Tu función es evaluar científicamente patologías de sustratos, formular el sistema químico Pintuco exacto (Viniltex, Koraza, Pintulux, Epóxicos, Sellomax, etc.), calcular con precisión los materiales a vender y proyectar una simulación visual y sensorial del acabado final.
Debes responder obligatoriamente con un JSON válido estructurado exactamente según el esquema indicado.`;

    const groqUserPrompt = `Analiza detalladamente este proyecto y necesidad de pintura:
- Sustrato / Superficie: ${surfaceLabel}
- Ambiente de Exposición: ${envLabel}
- Condición actual / Patología visible: ${condLabel}
- Área de la obra: ${area} m²
- Color seleccionado: ${chosenColor} (Hex: ${chosenHex})
- Tipo de acabado deseado: ${finish || 'Mate / Satinado'}
- Descripción y Observaciones: ${description || 'Sin notas adicionales'}
- Evidencias fotográficas: ${photoDescription || 'Fotos de la superficie adjuntadas en el formulario'}

Genera el informe técnico completo en formato JSON con la siguiente estructura exacta:
{
  "diagnostico": "Diagnóstico patológico y causa raíz del deterioro del sustrato",
  "recomendacionPintuco": "Nombre del producto principal Pintuco recomendado",
  "imprimanteRecomendado": "Nombre del imprimante / sellador Pintuco",
  "sistemaCapas": [
    "Fase 1: Preparación y limpieza de superficie",
    "Fase 2: Sellado e imprimación",
    "Fase 3: Primera mano de acabado",
    "Fase 4: Segunda mano y curado"
  ],
  "materialesVenta": [
    {
      "producto": "Nombre del producto",
      "presentacion": "Cuñete 5 Gal / Galón",
      "cantidadEstimada": "Cantidad calculada para el área",
      "rol": "Función en el sistema"
    }
  ],
  "simulacionAcabado": {
    "titulo": "Título de la simulación de acabado",
    "descripcionResultado": "Descripción detallada de cómo lucirá la superficie finalizada con los materiales Pintuco aplicados",
    "texturaVisual": "Detalle de la textura (tersa, sedosa, hidrófoba, uniforme)",
    "nivelBrillo": "Descripción del brillo y acabado",
    "tonoColor": "${chosenColor} (${chosenHex})",
    "durabilidadGarantizada": "Años de garantía y durabilidad",
    "beneficioEstetico": "Beneficio visual y arquitectónico",
    "aspectosTransformados": [
      "Aspecto 1 transformado respecto al estado inicial",
      "Aspecto 2 transformado",
      "Aspecto 3 transformado",
      "Aspecto 4 transformado"
    ]
  },
  "pasosClave": [
    "Paso clave 1",
    "Paso clave 2",
    "Paso clave 3",
    "Paso clave 4"
  ],
  "riesgosMitigados": [
    "Riesgo 1 mitigado",
    "Riesgo 2 mitigado",
    "Riesgo 3 mitigado"
  ],
  "selloSostenibilidad": "Compromiso de bajo VOC y sostenibilidad Pintuco"
}`;

    if (GROQ_API_KEY) {
      try {
        const groqResult = await callGroqAI(groqSystemPrompt, groqUserPrompt, true, 'qwen/qwen3.8-27b');
        if (groqResult && groqResult.diagnostico) {
          return res.json({ success: true, data: groqResult, source: 'groq-ai' });
        }
      } catch (groqErr) {
        console.warn('Groq AI error, falling back to alternative:', groqErr);
      }
    }

    const ai = getAIClient();
    if (!ai) {
      return res.json({ success: true, data: getFallback(), source: 'rule_engine_expert' });
    }

    const prompt = `Eres el Director Técnico de Inteligencia Artificial para PINTUCO Colombia (Ecosistema COLORLINK).
Analiza detalladamente la información del proyecto, las evidencias fotográficas y la necesidad del cliente:

- Superficie / Sustrato: ${surfaceLabel}
- Ambiente de Exposición: ${envLabel}
- Condición actual / Patología visible: ${condLabel}
- Área de la obra: ${area} m²
- Color seleccionado: ${chosenColor} (Hex: ${chosenHex})
- Tipo de acabado deseado: ${finish || 'Mate / Satinado'}
- Descripción y Observaciones del cliente: ${description || 'Sin notas adicionales'}
- Evidencias fotográficas: ${photoDescription || 'Fotos de la superficie adjuntadas en el formulario'}

Genera un informe técnico minucioso con el diagnóstico, los materiales exactos que le venderemos al cliente y una simulación descriptiva muy visual de cómo quedará el trabajo finalizado.

Responde ÚNICAMENTE con un JSON válido con la siguiente estructura exacta:
{
  "diagnostico": "Diagnóstico patológico y causa raíz del deterioro del sustrato",
  "recomendacionPintuco": "Nombre del producto principal Pintuco recomendado",
  "imprimanteRecomendado": "Nombre del imprimante / sellador Pintuco",
  "sistemaCapas": [
    "Paso 1 de preparación",
    "Paso 2 de sellado e imprimación",
    "Paso 3 de primera mano de acabado",
    "Paso 4 de segunda mano y curado"
  ],
  "materialesVenta": [
    {
      "producto": "Nombre del producto",
      "presentacion": "Cuñete 5 Gal / Galón",
      "cantidadEstimada": "Cantidad calculada para el área",
      "rol": "Función en el sistema"
    }
  ],
  "simulacionAcabado": {
    "titulo": "Título de la simulación de acabado",
    "descripcionResultado": "Descripción detallada de cómo lucirá la superficie finalizada con los materiales Pintuco aplicados",
    "texturaVisual": "Detalle de la textura (tersa, sedosa, hidrófoba, uniforme)",
    "nivelBrillo": "Descripción del brillo y acabado",
    "tonoColor": "${chosenColor}",
    "durabilidadGarantizada": "Años de garantía y durabilidad",
    "beneficioEstetico": "Beneficio visual y arquitectónico",
    "aspectosTransformados": [
      "Aspecto 1 transformado respecto al estado inicial",
      "Aspecto 2 transformado",
      "Aspecto 3 transformado",
      "Aspecto 4 transformado"
    ]
  },
  "pasosClave": [
    "Paso clave 1",
    "Paso clave 2",
    "Paso clave 3",
    "Paso clave 4"
  ],
  "riesgosMitigados": [
    "Riesgo 1 mitigado",
    "Riesgo 2 mitigado",
    "Riesgo 3 mitigado"
  ],
  "selloSostenibilidad": "Compromiso de bajo VOC y sostenibilidad Pintuco"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const text = response.text || '{}';
    try {
      const parsed = JSON.parse(text);
      return res.json({ success: true, data: parsed, source: 'gemini-3.7-flash' });
    } catch {
      return res.json({ success: true, data: getFallback(), source: 'gemini-fallback-json' });
    }
  } catch (error: any) {
    console.error('Error in AI diagnosis:', error);
    return res.status(500).json({
      error: 'Error al generar diagnóstico IA',
      details: error.message
    });
  }
});

// Technical assistant chat with provider fallback.
app.post('/api/ai/chat', async (req, res) => {
  const buildFallbackReply = (surface?: string) =>
    `Recomendación técnica Pintuco para ${surface || 'mampostería'}: limpia la superficie y elimina polvo, grasa y pintura suelta. Aplica Sellomax® 7 en 1 como imprimante siguiendo la dilución indicada en su ficha técnica y termina con dos manos del producto adecuado para el uso del espacio. Respeta el tiempo de secado que indique el envase y usa guantes, gafas y buena ventilación. Para calcular la cantidad exacta, indícame el área, el estado de la superficie y si es interior o exterior.`;
  try {
    const { question, context, technical, surface, condition, colorName } = req.body;
    const userQuery = question || '¿Qué recomendaciones técnicas de aplicación aplican para este proyecto?';

    const systemPrompt = `Eres el Asesor Técnico Senior de Pinturas PINTUCO Colombia para la plataforma COLORLINK.
Responde de manera profesional, precisa, práctica y cordial a las preguntas del aplicador, contratista o cliente.
Incluye siempre recomendaciones sobre dilución, número de manos, tiempos de secado entre manos (usualmente 2 a 4 horas), preparación de sustrato y precauciones de seguridad.
Utiliza nombres de productos oficiales Pintuco (Viniltex, Koraza, Pintulux, Pintucoat, Sellomax, etc.). Responde en español.`;

    const userPrompt = `Contexto del proyecto:
- Sustrato: ${surface || technical?.surface || 'Mampostería general'}
- Condición de la superficie: ${condition || technical?.condition || 'Desgaste estándar'}
- Color elegido: ${colorName || technical?.colorName || 'Color seleccionado'}
- Contexto adicional: ${context || 'Ninguno'}

Pregunta del usuario:
"${userQuery}"`;

    if (GROQ_API_KEY) {
      const reply = await callGroqAI(systemPrompt, userPrompt, false, 'qwen/qwen3.8-27b');
      if (reply) {
        return res.json({ success: true, reply, source: 'groq-ai' });
      }
    }

    const ai = getAIClient();
    if (ai) {
      try {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const response = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: `${systemPrompt}\n\n${userPrompt}`,
            config: { temperature: 0.3, maxOutputTokens: 700 }
          }),
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Tiempo de espera agotado al consultar Gemini.')), 12000);
          })
        ]).finally(() => { if (timeoutId) clearTimeout(timeoutId); });
        if (response.text) {
          return res.json({ success: true, reply: response.text, source: 'gemini-3.7-flash' });
        }
      } catch (providerError) {
        console.warn('Gemini chat unavailable; returning technical fallback:', providerError);
      }
    }

    return res.json({ success: true, reply: buildFallbackReply(surface), source: 'expert_rule_engine' });
  } catch (err: any) {
    console.error('Error in /api/ai/chat:', err);
    return res.json({ success: true, reply: buildFallbackReply(), source: 'expert_rule_engine' });
  }
});

async function startServer() {
  // Production & Static Serving
  if ((process as any).pkg || process.env.NODE_ENV === 'production') {
    const distPath = (process as any).pkg
      ? path.join(currentDir, 'dist')
      : path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // In development mode, Vite will handle frontend via tsx server + vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const localLauncher = process.env.COLORLINK_LOCAL_APP === 'true';
  const host = (process as any).pkg || localLauncher ? '127.0.0.1' : '0.0.0.0';
  app.listen(PORT, host, () => {
    console.log(`ColorLink Pintuco server running on http://${host}:${PORT}`);
  });
}

startServer();

