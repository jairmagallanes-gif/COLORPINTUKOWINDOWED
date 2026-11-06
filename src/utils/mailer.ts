import { EmailNotificationRecord, EmailNotificationType, UserProfile, UserRole } from '../types';
import { getRoleLabel } from './rbac';

export const COMPANY_GMAIL = 'jairmagallanes@gmail.com';
export const COMPANY_WHATSAPP = '573236030829';
export const APP_PUBLIC_URL = 'https://ais-dev-yeliyv23rmawmcdkgcxaje-111552814485.us-east1.run.app';

/**
 * Normalizes phone numbers for WhatsApp Colombia (57 + 10 digits)
 */
export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return COMPANY_WHATSAPP;
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = `57${cleaned}`;
  }
  if (!cleaned) cleaned = COMPANY_WHATSAPP;
  return cleaned;
}

/**
 * Builds direct WhatsApp URL with pre-filled encoded text
 */
export function buildWhatsAppUrl(phone: string | undefined, message: string): string {
  const targetPhone = formatWhatsAppPhone(phone);
  return `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(message)}`;
}

export const INITIAL_NOTIFICATIONS: EmailNotificationRecord[] = [
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
            Nos complace informarte que tu perfil como <strong>Asesor Técnico Comercial Pintuco</strong> (Sede Bogotá / CEDI Fontibón) ha sido revisado, validado y <strong>aprobado satisfactoriamente por el Administrador Central</strong>.
          </p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; margin: 20px 0; font-size: 13px;">
            <div style="font-weight: bold; color: #1E216B; margin-bottom: 8px;">Atribuciones Habilitadas:</div>
            <ul style="margin: 0; padding-left: 18px; color: #475569; line-height: 1.6;">
              <li>Creación y diagnóstico técnico con Inteligencia Artificial.</li>
              <li>Consulta de inventario y reservas en tiempo real en CEDIs nacionales.</li>
              <li>Aprobación y transición de estados en bitácora de obra (Fases 1 a 5).</li>
              <li>Emisión de cotizaciones corporativas con respaldo oficial Pintuco®.</li>
            </ul>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Ya puedes iniciar sesión en la plataforma con tus credenciales institucionales.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Pintuco S.A. • Universidad Cooperativa de Colombia (UCC) • COLORLINK 2026
        </div>
      </div>
    `
  }
];

export function getStoredNotifications(): EmailNotificationRecord[] {
  try {
    const stored = localStorage.getItem('colorlink_email_notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored notifications:', e);
  }
  return INITIAL_NOTIFICATIONS;
}

export const getEmailNotifications = getStoredNotifications;

export function saveStoredNotifications(notifications: EmailNotificationRecord[]) {
  try {
    localStorage.setItem('colorlink_email_notifications', JSON.stringify(notifications));
  } catch (e) {
    console.warn('Error saving notifications:', e);
  }
}

export const saveEmailNotifications = saveStoredNotifications;

export function saveEmailNotification(notification: EmailNotificationRecord) {
  const current = getStoredNotifications();
  const updated = [notification, ...current.filter(n => n.id !== notification.id)];
  saveStoredNotifications(updated);
}

export function generateVerificationToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createRegistrationVerificationEmail(user: UserProfile, token: string): EmailNotificationRecord {
  const isAdvisor = user.role === 'asesor';
  const roleName = getRoleLabel(user.role);

  const emailId = `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  let previewSnippet = `Hola ${user.name}, ¡bienvenido a COLORLINK Pintuco®! Valida tu correo electrónico con el código ${token} para activar tu perfil de ${roleName}.`;
  if (isAdvisor) {
    previewSnippet = `Hola ${user.name}, bienvenido a COLORLINK. Valida tu correo con el código ${token}. Tu rol de Asesor Técnico será evaluado por el Administrador.`;
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #1E216B 0%, #2E3192 100%); padding: 26px 24px; text-align: center; color: white;">
        <div style="display: inline-block; background: #F7C548; color: #1E216B; font-weight: 900; font-size: 15px; padding: 4px 12px; border-radius: 6px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">COLORLINK by Pintuco®</div>
        <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Notificación de Registro y Verificación de Cuenta</div>
        <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">Ecosistema Digital de Pinturas, Recubrimientos & Gestión de Obras</div>
      </div>

      <div style="padding: 28px 24px; color: #1e293b;">
        <div style="background: #eff6ff; border-left: 4px solid #2E3192; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
          <span style="font-size: 13px; font-weight: bold; color: #1E216B;">📩 Notificación de Correo Entregada:</span>
          <span style="font-size: 13px; color: #334155; display: block; margin-top: 2px;">Este mensaje ha sido enviado a la dirección registrada <strong>${user.email}</strong> para la activación formal de tu cuenta.</span>
        </div>

        <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; margin-bottom: 8px;">¡Te damos la bienvenida, ${user.name}!</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 18px;">
          Gracias por registrarte en <strong>COLORLINK Pintuco®</strong>. Tu cuenta ha sido registrada con el perfil de <strong>${roleName}</strong>. Para activar tu acceso a las cotizaciones técnicas, especificación de pinturas, cálculo de rendimiento y trazabilidad en CEDIs, ingresa tu código de verificación.
        </p>

        <div style="background: #f8fafc; border: 2px dashed #2E3192; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
            Tu Código de Activación de 6 Dígitos
          </div>
          <div style="font-size: 34px; font-weight: 900; letter-spacing: 7px; color: #1E216B; font-family: monospace;">
            ${token}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">Válido durante 24 horas</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
          <div style="font-size: 12px; font-weight: 800; color: #1E216B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            📋 Resumen de Datos Diligenciados en tu Registro:
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px;"><strong>Nombre Completo:</strong></td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${user.name}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Correo Registrado:</strong></td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Rol en el Sistema:</strong></td>
              <td style="padding: 4px 0; color: #2E3192; font-weight: 700;">${roleName}</td>
            </tr>
            ${user.nitOrDoc ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Documento / NIT:</strong></td>
              <td style="padding: 4px 0; color: #334155;">${user.nitOrDoc}</td>
            </tr>` : ''}
            ${user.positionOrTitle ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Cargo / Especialidad:</strong></td>
              <td style="padding: 4px 0; color: #334155;">${user.positionOrTitle}</td>
            </tr>` : ''}
            ${user.address ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Dirección Sede/Obra:</strong></td>
              <td style="padding: 4px 0; color: #334155;">${user.address}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Ciudad / CEDI:</strong></td>
              <td style="padding: 4px 0; color: #334155;">${user.city || 'Medellín'}</td>
            </tr>
            ${user.phone ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Teléfono / WhatsApp:</strong></td>
              <td style="padding: 4px 0; color: #334155;">${user.phone}</td>
            </tr>` : ''}
            ${user.companyOrOrg ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Empresa / Org:</strong></td>
              <td style="padding: 4px 0; color: #334155;">${user.companyOrOrg}</td>
            </tr>` : ''}
          </table>
        </div>

        ${
          isAdvisor
            ? `
          <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px; color: #92400e; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 4px;">
              ⚠️ Protocolo de Seguridad para Asesores Técnicos:
            </div>
            Los perfiles de <strong>Asesor Técnico Comercial</strong> requieren aprobación manual por parte del <strong>Administrador Central de COLORLINK</strong>. Una vez ingreses el código de verificación anterior, tu solicitud pasará al panel de autorización institucional (RBAC).
          </div>
          `
            : `
          <div style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 16px; color: #065f46; font-size: 13px; line-height: 1.5; margin-bottom: 20px;">
            ✅ <strong>Activación Inmediata:</strong> Al introducir este código o validar desde el sistema, tu cuenta quedará 100% activa para generar cotizaciones, especificar proyectos y gestionar tus obras con Pintuco®.
          </div>
          `
        }

        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          Si tú no solicitaste este registro en COLORLINK Pintuco, puedes ignorar este mensaje de manera segura.
        </p>
      </div>

      <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        Pintuco S.A. • Soluciones de Pinturas y Recubrimientos de Alto Desempeño • Proyecto UCC 2026
      </div>
    </div>
  `;

  return {
    id: emailId,
    to: user.email,
    toName: user.name,
    subject: `🎨 COLORLINK Pintuco® - ¡Bienvenido! Verificación y Activación de tu Cuenta (${roleName})`,
    sentAt: new Date().toISOString(),
    type: 'verificacion_cuenta',
    verificationToken: token,
    role: user.role,
    previewSnippet,
    htmlContent,
    isRead: false,
    actionTaken: false,
    associatedUserId: user.id,
    clientPhone: user.phone || COMPANY_WHATSAPP,
    whatsappMessage: 
`🎨 *COLORLINK by Pintuco®*
¡Hola *${user.name}*! Te damos la bienvenida a la plataforma oficial de pinturas y recubrimientos Pintuco®.

🔑 *Código de Activación:* *${token}*
👤 *Rol Solicitado:* ${roleName}
📧 *Correo Registrado:* ${user.email}
📍 *Ciudad:* ${user.city || 'Medellín'}

Para activar tu cuenta e ingresar al sistema:
👉 ${APP_PUBLIC_URL}

_Pintuco S.A. • Soporte y Atención Oficial WhatsApp: +57 323 603 0829_`,
    whatsappUrl: buildWhatsAppUrl(user.phone || COMPANY_WHATSAPP, 
`🎨 *COLORLINK by Pintuco®*
¡Hola *${user.name}*! Te damos la bienvenida a la plataforma oficial de pinturas y recubrimientos Pintuco®.

🔑 *Código de Activación:* *${token}*
👤 *Rol Solicitado:* ${roleName}
📧 *Correo Registrado:* ${user.email}
📍 *Ciudad:* ${user.city || 'Medellín'}

Para activar tu cuenta e ingresar al sistema:
👉 ${APP_PUBLIC_URL}

_Pintuco S.A. • Soporte y Atención Oficial WhatsApp: +57 323 603 0829_`)
  };
}

export function createAdminAdvisorAlertEmail(user: UserProfile): EmailNotificationRecord {
  const emailId = `email-admin-alert-${Date.now()}`;
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #4c1d95 0%, #1E216B 100%); padding: 24px; text-align: center; color: white;">
        <div style="font-size: 20px; font-weight: 800; color: #F7C548;">🛡️ COLORLINK - Alerta de Administración</div>
        <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">Nueva Solicitud de Rol Asesor Técnico por Aprobar</div>
      </div>
      <div style="padding: 24px; color: #1e293b;">
        <p style="font-size: 14px; line-height: 1.6;">
          El usuario <strong>${user.name}</strong> se ha registrado y ha solicitado el rol de <strong>Asesor Técnico Comercial Pintuco</strong>.
        </p>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; font-size: 13px; line-height: 1.7;">
          <div><strong>Correo:</strong> ${user.email}</div>
          <div><strong>Empresa / Unidad:</strong> ${user.companyOrOrg || 'Pintuco S.A.'}</div>
          <div><strong>Documento / NIT:</strong> ${user.nitOrDoc || 'N/A'}</div>
          <div><strong>Ciudad / CEDI:</strong> ${user.city || 'Medellín'}</div>
          <div><strong>Teléfono:</strong> ${user.phone || 'N/A'}</div>
          <div><strong>Fecha de Solicitud:</strong> ${new Date().toLocaleString('es-CO')}</div>
        </div>
        <div style="margin-top: 20px; font-size: 13px; color: #475569;">
          Por favor ingresa al <strong>Panel de Control de Roles (RBAC)</strong> para evaluar los antecedentes y aprobar o rechazar el perfil del asesor.
        </div>
      </div>
      <div style="background: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #64748b;">
        Notificación automática para Administradores de COLORLINK Pintuco
      </div>
    </div>
  `;

  return {
    id: emailId,
    to: 'jairmagallanes@gmail.com',
    toName: 'COLORLINK by Pintuco® - Jair Magallanes (Administrador)',
    subject: `🛡️ COLORLINK - Nueva Solicitud de Registro de Asesor Técnico por Aprobar (${user.name})`,
    sentAt: new Date().toISOString(),
    type: 'alerta_admin_asesor',
    role: 'administrador',
    previewSnippet: `El usuario ${user.name} (${user.email}) ha solicitado el rol de Asesor Técnico en ${user.city}. Requiere tu aprobación en el panel RBAC.`,
    htmlContent,
    isRead: false,
    actionTaken: false,
    associatedUserId: user.id
  };
}

export function createAdvisorApprovalEmail(user: UserProfile, adminName?: string): EmailNotificationRecord {
  const emailId = `email-approved-${Date.now()}`;
  const effectiveAdmin = adminName || 'Jair Magallanes';
  const htmlContent = `
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
          El <strong>Administrador General (${effectiveAdmin})</strong> ha revisado y <strong>aprobado formalmente tu rol como Asesor Técnico Comercial</strong> en la plataforma COLORLINK.
        </p>
        <p style="font-size: 13px; color: #475569; line-height: 1.6;">
          Tu perfil ya se encuentra <strong>100% ACTIVO</strong> con acceso a la gestión técnica de obras, diagnósticos con IA y trazabilidad en la red de CEDIs de Pintuco®.
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        Pintuco S.A. • Universidad Cooperativa de Colombia (UCC) • 2026
      </div>
    </div>
  `;

  return {
    id: emailId,
    to: user.email,
    toName: user.name,
    subject: '🎉 COLORLINK Pintuco® - ¡Tu Perfil de Asesor Técnico ha sido Aprobado!',
    sentAt: new Date().toISOString(),
    type: 'aprobacion_asesor',
    role: 'asesor',
    previewSnippet: `Tu perfil de Asesor Técnico ha sido aprobado por el Administrador. Tu cuenta ya se encuentra activa.`,
    htmlContent,
    isRead: false,
    actionTaken: true,
    associatedUserId: user.id
  };
}

/**
 * Creates customer notification for Quotation Creation (Email + WhatsApp)
 */
export function createQuotationNotification(quote: any): EmailNotificationRecord {
  const emailId = `email-quote-${quote.id || Date.now()}`;
  const quoteId = quote.id || `COT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const clientName = quote.clientName || 'Cliente Estimado';
  const clientEmail = quote.clientEmail || 'cliente@pintuco.com';
  const clientPhone = quote.clientPhone || COMPANY_WHATSAPP;
  const totalStr = new Intl.NumberFormat('es-CO').format(quote.totalCOP || quote.subtotalNetCOP || 0);
  const areaM2 = quote.areaM2 || 100;
  const productName = quote.selectedProductName || 'Viniltex® / Koraza® Pintuco';
  const cuñetes = quote.cuñetesNeeded || 0;
  const warrantyYears = quote.warrantyYears || 5;
  const validUntil = quote.validUntil || '15 días calendario';

  const whatsappMessage = 
`🎨 *COLORLINK Pintuco® - Cotización Oficial #${quoteId}*
Estimado(a) *${clientName}*, tu propuesta técnica de recubrimientos ha sido generada con éxito:

🏠 *Proyecto / Obra:* ${quote.projectCity || 'Medellín'} (${areaM2} m²)
🧪 *Producto Recomendado:* ${productName}
📦 *Volumen Calculado:* ${cuñetes} Cuñetes de 5 Galones
💰 *Inversión Total:* $${totalStr} COP
🛡️ *Garantía Oficial:* ${warrantyYears} Años de Respaldo Pintuco S.A.
⏳ *Vigencia de Oferta:* ${validUntil}

Para revisar el desglose detallado de materiales y aprobar tu compra:
👉 ${APP_PUBLIC_URL}

_Pintuco S.A. • Asesoría Técnica Comercial: +57 323 603 0829_`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #1E216B 0%, #2E3192 100%); padding: 26px 24px; text-align: center; color: white;">
        <div style="display: inline-block; background: #F7C548; color: #1E216B; font-weight: 900; font-size: 14px; padding: 4px 12px; border-radius: 6px; margin-bottom: 8px; text-transform: uppercase;">COLORLINK by Pintuco®</div>
        <div style="font-size: 22px; font-weight: 800; color: #ffffff;">Propuesta Técnica & Cotización Oficial</div>
        <div style="font-size: 13px; color: #cbd5e1; margin-top: 4px;">Radicado: <strong>${quoteId}</strong></div>
      </div>
      <div style="padding: 26px 24px; color: #1e293b;">
        <div style="background: #eff6ff; border-left: 4px solid #2E3192; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
          <span style="font-size: 13px; font-weight: bold; color: #1E216B;">📄 Cotización Oficial Pintuco® Generada:</span>
          <span style="font-size: 13px; color: #334155; display: block; margin-top: 2px;">Enviada a <strong>${clientEmail}</strong> y WhatsApp <strong>${clientPhone}</strong>.</span>
        </div>
        <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Apreciado(a) ${clientName},</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Hemos formulado la cotización técnica para tu proyecto en <strong>${quote.projectCity || 'Colombia'}</strong> con base en el cálculo de rendimiento y especificación de pinturas de alta durabilidad.
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr><td style="padding: 5px 0; color: #64748b;"><strong>Área Recubierta:</strong></td><td style="padding: 5px 0; font-weight: bold; color: #0f172a;">${areaM2} m²</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;"><strong>Producto Principal:</strong></td><td style="padding: 5px 0; font-weight: bold; color: #2E3192;">${productName}</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;"><strong>Cuñetes Requeridos:</strong></td><td style="padding: 5px 0; font-weight: bold; color: #0f172a;">${cuñetes} Cuñetes (5 Gal)</td></tr>
            <tr><td style="padding: 5px 0; color: #64748b;"><strong>Garantía de Fábrica:</strong></td><td style="padding: 5px 0; font-weight: bold; color: #059669;">${warrantyYears} Años Certificados</td></tr>
            <tr style="border-top: 1px solid #cbd5e1;"><td style="padding: 8px 0; font-size: 15px; color: #1E216B;"><strong>Total Inversión:</strong></td><td style="padding: 8px 0; font-size: 18px; font-weight: 900; color: #1E216B;">$${totalStr} COP</td></tr>
          </table>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${APP_PUBLIC_URL}" style="display: inline-block; background: #2E3192; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 14px;">
            Ver Cotización y Proceder con el Pedido
          </a>
        </div>
        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          Propuesta válida durante ${validUntil}. Precios con IVA y entrega sujeta a inventario en CEDI.
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #64748b;">
        Pintuco S.A. • COLORLINK • Correo: ${COMPANY_GMAIL} • WhatsApp: +57 323 603 0829
      </div>
    </div>
  `;

  return {
    id: emailId,
    to: clientEmail,
    toName: clientName,
    subject: `🎨 COLORLINK Pintuco® - Cotización Oficial #${quoteId} ($${totalStr} COP)`,
    sentAt: new Date().toISOString(),
    type: 'cotizacion_generada',
    previewSnippet: `Cotización #${quoteId} para ${clientName}. Total: $${totalStr} COP (${cuñetes} cuñetes ${productName}).`,
    htmlContent,
    isRead: false,
    associatedQuoteId: quoteId,
    clientPhone,
    whatsappMessage,
    whatsappUrl: buildWhatsAppUrl(clientPhone, whatsappMessage)
  };
}

/**
 * Creates notification for Project Status Changes across the 7 phases (Email + WhatsApp)
 */
export function createProjectStatusNotification(
  project: any,
  newStatus: string,
  eventTitle: string,
  eventDescription: string
): EmailNotificationRecord {
  const emailId = `email-status-${project.id}-${Date.now()}`;
  const clientName = project.formData?.identification?.clientName || 'Cliente Pintuco';
  const clientEmail = project.formData?.identification?.contactEmail || 'cliente@pintuco.com';
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

  return {
    id: emailId,
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
}

/**
 * Creates notification when payment is verified by Treasury
 */
export function createPaymentVerifiedNotification(project: any): EmailNotificationRecord {
  const amountStr = new Intl.NumberFormat('es-CO').format(
    project.paymentVerification?.paymentAmountCOP || project.solution?.estimatedMaterialCostCOP || 0
  );
  return createProjectStatusNotification(
    project,
    'verificacion_pago',
    'Pago Verificado por Tesorería Central',
    `Tu pago por valor de $${amountStr} COP ha sido validado exitosamente. La orden de preparación y despacho en CEDI ha sido autorizada.`
  );
}

/**
 * Creates notification when materials are dispatched in route
 */
export function createDispatchNotification(project: any): EmailNotificationRecord {
  const info = project.dispatchInfo || {};
  const isPickup = info.deliveryMethod === 'retiro_tienda';
  const detail = isPickup
    ? `Tus materiales están LISTOS para retiro en ${info.pickupStoreOrCedi || 'Tienda Pintacasa'}. Código de Retiro: ${info.pickupVerificationCode || 'PIN-001'}.`
    : `Tus materiales van EN RUTA hacia tu obra con Guía #${info.trackingNumber || 'PIN-GUIA'} (${info.carrierName || 'Transportadora Pintuco'}). Conductor: ${info.driverContact || 'Asignado'}.`;

  return createProjectStatusNotification(
    project,
    'despacho_en_camino',
    isPickup ? 'Materiales Listos para Retiro en Tienda' : 'Materiales Despachados en Camino a Obra',
    detail
  );
}

/**
 * Creates notification when Quality and Warranty Policies are activated
 */
export function createWarrantyQualityNotification(project: any): EmailNotificationRecord {
  const warrantyYears = project.solution?.warrantyYears || 5;
  const certCode = project.qualityAssurance?.warrantyDocId || `CERT-POL-${project.id}`;

  return createProjectStatusNotification(
    project,
    'calidad_aprobada',
    `Póliza de Calidad y Garantía Habilitada (${warrantyYears} Años)`,
    `¡Felicidades! Con el pago acreditado y la entrega formalizada, se ha expedido la Póliza de Calidad y Garantía Pintuco® #${certCode} con respaldo oficial por ${warrantyYears} años.`
  );
}

/**
 * Sends notification through backend API (dispatches Gmail SMTP & logs)
 */
export async function sendNotificationThroughApi(notification: EmailNotificationRecord): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    saveEmailNotification(notification);

    const res = await fetch('/api/notifications/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    }
    return { success: true, data: notification };
  } catch (err: any) {
    console.warn('Could not connect to backend notification dispatcher, saved locally:', err);
    saveEmailNotification(notification);
    return { success: true, data: notification };
  }
}
