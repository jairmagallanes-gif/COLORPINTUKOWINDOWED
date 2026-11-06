import { supabase, isSupabaseConfigured } from './supabase';
import { ProjectRecord, UserProfile, UserRole } from '../types';

/**
 * Map ColorLink internal roles to Supabase check constraint:
 * CHECK (rol IN ('administrador', 'asesor', 'cedi', 'aplicador', 'cliente', 'auditor'))
 */
function mapRoleToSupabase(role: UserRole | string): string {
  switch (role) {
    case 'administrador':
      return 'administrador';
    case 'asesor':
      return 'asesor';
    case 'operador_cedi':
      return 'cedi';
    case 'contratista':
      return 'aplicador';
    case 'auditor_calidad':
      return 'auditor';
    case 'cliente_empresa':
    case 'cliente_natural':
    case 'cliente':
    default:
      return 'cliente';
  }
}

/**
 * Map Supabase role back to ColorLink internal UserRole
 */
function mapSupabaseToInternalRole(rol: string): UserRole {
  switch (rol) {
    case 'administrador':
      return 'administrador';
    case 'asesor':
      return 'asesor';
    case 'cedi':
      return 'asesor';
    case 'aplicador':
      return 'contratista';
    case 'auditor':
      return 'calidad';
    case 'cliente':
    default:
      return 'cliente_natural';
  }
}

/**
 * Service to synchronize users, projects, quotations, and work logs with Supabase
 * Directly interacts with the user's Spanish schema (perfiles, clientes, proyectos, etc.)
 */
export const supabaseSyncService = {
  /**
   * Check if Supabase connection is active
   */
  isLive(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  /**
   * Sync or save a user profile in public.perfiles (or public.profiles) table
   */
  async syncUserProfile(user: UserProfile): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.isLive() || !supabase) {
      return { success: true, data: user }; // Local fallback
    }

    try {
      const email = user.email.toLowerCase().trim();
      const mappedRole = mapRoleToSupabase(user.role);

      // Attempt upsert in Spanish table `perfiles`
      const payloadPerfiles: any = {
        correo_electronico: email,
        nombre_completo: user.name || email.split('@')[0],
        telefono: user.phone || null,
        rol: mappedRole,
        esta_activo: user.accountStatus === 'activo'
      };

      // Only pass UUID if it is a valid UUID format
      if (user.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
        payloadPerfiles.id = user.id;
      }

      const { data, error } = await supabase
        .from('perfiles')
        .upsert(payloadPerfiles, { onConflict: 'correo_electronico' })
        .select()
        .maybeSingle();

      // If user is a client (empresa or natural), ensure they are registered in `clientes` table too
      if (user.role === 'cliente_empresa' || user.role === 'cliente_natural' || user.role === 'cliente') {
        const nitDoc = user.nitOrDoc && user.nitOrDoc.trim() 
          ? user.nitOrDoc.trim() 
          : `NIT-${email.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

        try {
          await supabase
            .from('clientes')
            .upsert({
              nit_cedula: nitDoc,
              nombre_empresa: user.companyOrOrg || user.name || 'Cliente Registrado',
              nombre_contacto: user.name,
              correo_contacto: email,
              telefono_contacto: user.phone || '3000000000',
              direccion_facturacion: user.address || 'Colombia',
              ciudad: user.city || 'Medellín',
              tipo_cliente: user.role === 'cliente_empresa' ? 'empresa' : 'natural'
            }, { onConflict: 'nit_cedula' });
        } catch (err: any) {
          console.warn('Supabase syncUserProfile clientes warning:', err?.message);
        }
      }

      if (error) {
        // Fallback: try English `profiles` table if `perfiles` fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .upsert({
            email: email,
            full_name: user.name,
            phone: user.phone || null,
            role: user.role,
            is_active: user.accountStatus === 'activo'
          }, { onConflict: 'email' })
          .select()
          .maybeSingle();

        if (fallbackError) {
          console.warn('Supabase syncUserProfile error on perfiles & profiles:', error.message, fallbackError.message);
          return { success: false, error: error.message };
        }
        return { success: true, data: fallbackData };
      }

      return { success: true, data };
    } catch (err: any) {
      console.warn('Supabase syncUserProfile exception:', err);
      return { success: false, error: err?.message || 'Error desconocido' };
    }
  },

  /**
   * Save a newly created project to Supabase
   */
  async saveProject(project: ProjectRecord): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.isLive() || !supabase) {
      return { success: true, data: project }; // Local fallback
    }

    try {
      // 1. Ensure Client exists or upsert in `clientes`
      let clienteId = null;
      if (project.formData?.identification) {
        const ident = project.formData.identification;
        const nitCedula = ident.nit || `CLI-${Date.now()}`;
        const { data: clienteRecord, error: clientErr } = await supabase
          .from('clientes')
          .upsert({
            nit_cedula: nitCedula,
            nombre_empresa: ident.clientName || 'Cliente ColorLink',
            nombre_contacto: ident.contactPerson || ident.clientName || 'Sin nombre',
            correo_contacto: (ident.contactEmail || 'contacto@colorlink.pintuco.com').toLowerCase(),
            telefono_contacto: ident.contactPhone || '3000000000',
            direccion_facturacion: project.formData?.project?.address || 'Colombia',
            ciudad: project.formData?.project?.city || 'Medellín'
          }, { onConflict: 'nit_cedula' })
          .select('id')
          .maybeSingle();

        if (clientErr) {
          console.warn('Error upserting clientes:', clientErr.message);
        } else if (clienteRecord?.id) {
          clienteId = clienteRecord.id;
        }
      }

      // 2. Ensure Project Site exists in `sedes_proyecto`
      let sedeId = null;
      if (clienteId && project.formData?.project) {
        const siteData = project.formData.project;
        const { data: siteRecord, error: siteErr } = await supabase
          .from('sedes_proyecto')
          .insert({
            cliente_id: clienteId,
            nombre_sede: `Obra ${siteData.city || 'Medellín'} (${siteData.projectType || 'General'})`,
            direccion: siteData.address || 'Medellín, Antioquia',
            ciudad: siteData.city || 'Medellín'
          })
          .select('id')
          .maybeSingle();

        if (siteErr) {
          console.warn('Error inserting sedes_proyecto:', siteErr.message);
        } else if (siteRecord?.id) {
          sedeId = siteRecord.id;
        }
      }

      // Fallback: If sede was not created but cliente exists, create a default sede
      if (clienteId && !sedeId) {
        const { data: fallbackSede } = await supabase
          .from('sedes_proyecto')
          .insert({
            cliente_id: clienteId,
            nombre_sede: 'Sede Principal Obra',
            direccion: project.formData?.project?.address || 'Dirección de obra',
            ciudad: project.formData?.project?.city || 'Medellín'
          })
          .select('id')
          .maybeSingle();
        if (fallbackSede?.id) sedeId = fallbackSede.id;
      }

      // 3. Insert Project in `proyectos`
      const totalAmount = project.solution?.estimatedMaterialCostCOP || 0;
      const projectCode = project.id || `PIN-${Date.now()}`;

      let insertedProject: any = null;

      const { data: projData, error: projError } = await supabase
        .from('proyectos')
        .insert({
          codigo: projectCode,
          cliente_id: clienteId || null,
          sede_id: sedeId || null,
          estado: 'cotizado',
          area_m2: project.formData?.project?.areaM2 || 100,
          tipo_superficie: project.formData?.technical?.surface || 'mamposteria_concreto',
          ambiente: project.formData?.technical?.environment || 'exterior_intemperie',
          condicion_superficie: project.formData?.technical?.condition || 'buen_estado',
          nombre_color_objetivo: project.formData?.technical?.colorName || 'Blanco Almendra',
          hex_color_objetivo: project.formData?.technical?.colorHex || '#F5F5F0',
          acabado_objetivo: project.formData?.technical?.finish || 'Mate',
          urgencia: project.deliveryUrgency === 'inmediato_24_48h' ? 'critica_express' : (project.deliveryUrgency === 'express_3_5dias' ? 'alta' : 'estandar'),
          monto_total: totalAmount,
          datos_completos_json: project
        })
        .select()
        .maybeSingle();

      if (projError) {
        console.warn('Supabase saveProject error in proyectos:', projError.message);
      } else {
        insertedProject = projData;
      }


      // 4. Save Technical Diagnosis in `diagnosticos_tecnicos`
      if (insertedProject?.id && project.solution) {
        await supabase
          .from('diagnosticos_tecnicos')
          .insert({
            proyecto_id: insertedProject.id,
            patologia_detectada: project.formData?.technical?.condition || 'Evaluación Técnica',
            analisis_causa_raiz: project.solution.aiTechnicalNotes || 'Diagnóstico automático asistido por COLORLINK IA',
            sistema_pintuco_recomendado: project.solution.recommendedPrimaryProduct?.name || 'Sistema Pintuco® Koraza 5',
            pasos_preparacion: project.solution.surfacePreparationSteps || [],
            riesgos_mitigados: project.solution.qualityChecklist || [],
            anios_durabilidad: project.solution.warrantyYears || 5,
            puntaje_confianza_ia: 0.96
          });
      }

      // 5. Save Quotation record in `cotizaciones`
      if (insertedProject?.id && project.solution) {
        await supabase
          .from('cotizaciones')
          .insert({
            numero_cotizacion: `COT-${projectCode}`,
            proyecto_id: insertedProject.id,
            subtotal_materiales: Math.round(totalAmount * 0.81),
            total_mano_obra: Math.round(totalAmount * 0.25),
            impuesto_iva: Math.round(totalAmount * 0.19),
            gran_total: Math.round(totalAmount * 1.25),
            canal_comercial: 'directo_pintuco',
            porcentaje_descuento: 0,
            estado: 'enviada'
          });
      }

      return { success: true, data: insertedProject || project };
    } catch (err: any) {
      console.warn('Supabase saveProject exception:', err);
      return { success: false, error: err?.message || 'Error guardando en Supabase' };
    }
  },

  /**
   * Fetch all registered profiles from Supabase in real-time
   */
  async fetchLiveProfiles(): Promise<any[] | null> {
    if (!this.isLive() || !supabase) return null;

    try {
      // First try Spanish `perfiles`
      const { data: perfilesData, error: perfilesError } = await supabase
        .from('perfiles')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (!perfilesError && perfilesData && perfilesData.length > 0) {
        return perfilesData.map((p: any) => ({
          id: p.id,
          name: p.nombre_completo || p.correo_electronico?.split('@')[0],
          email: p.correo_electronico,
          role: mapSupabaseToInternalRole(p.rol),
          phone: p.telefono || '',
          accountStatus: p.esta_activo ? 'activo' : 'pendiente_aprobacion_admin',
          created_at: p.fecha_creacion
        }));
      }

      // Fallback: try `profiles`
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Supabase fetchLiveProfiles exception:', err);
      return null;
    }
  },

  /**
   * Fetch all projects from Supabase in real-time
   */
  async fetchLiveProjects(): Promise<any[] | null> {
    if (!this.isLive() || !supabase) return null;

    try {
      // Try Spanish `proyectos`
      const { data: proyectosData, error: proyectosError } = await supabase
        .from('proyectos')
        .select(`
          *,
          clientes (*),
          sedes_proyecto (*),
          diagnosticos_tecnicos (*),
          cotizaciones (*)
        `)
        .order('fecha_creacion', { ascending: false });

      if (!proyectosError && proyectosData) {
        return proyectosData;
      }

      // Fallback: try `projects`
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          clients (*),
          project_sites (*),
          technical_diagnoses (*),
          quotations (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Supabase fetchLiveProjects exception:', err);
      return null;
    }
  }
};

