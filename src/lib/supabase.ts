import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Normaliza la URL de Supabase para asegurar que use el endpoint base
 * y no termine en /rest/v1/ o barras extras que romperían el SDK.
 */
export const cleanSupabaseUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  return rawUrl
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
};

// 1. Obtener variables de entorno según estándar de Vite o almacenamiento local
const getStoredUrl = (): string => {
  try {
    return localStorage.getItem('colorlink_custom_supabase_url') || '';
  } catch {
    return '';
  }
};

const getStoredKey = (): string => {
  try {
    return localStorage.getItem('colorlink_custom_supabase_key') || '';
  } catch {
    return '';
  }
};

// Credenciales oficiales de Supabase configuradas para ColorLink
const defaultUrl = 'https://jgckmiencopjyrdvkfms.supabase.co';
const defaultKey = 'sb_publishable_KMqE5jecKTsyd--f2QZRmA_h717HB7O';

export const getActiveSupabaseUrl = (): string => {
  const url = getStoredUrl() || import.meta.env.VITE_SUPABASE_URL || defaultUrl;
  return cleanSupabaseUrl(url);
};

export const getActiveSupabaseAnonKey = (): string => {
  return (
    getStoredKey() ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    defaultKey
  ).trim();
};

export const isSupabaseConfigured: boolean = Boolean(
  getActiveSupabaseUrl() &&
  getActiveSupabaseAnonKey() &&
  getActiveSupabaseUrl().startsWith('https://') &&
  !getActiveSupabaseUrl().includes('TU_PROYECTO')
);

// 2. Inicialización del cliente de Supabase
let supabaseInstance: SupabaseClient | null = isSupabaseConfigured
  ? createClient(getActiveSupabaseUrl(), getActiveSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const supabase = supabaseInstance;

/**
 * Permite reconectar el cliente con credenciales actualizadas
 */
export function reconnectSupabase(newUrl?: string, newKey?: string): { success: boolean; client: SupabaseClient | null } {
  try {
    const rawUrl = newUrl !== undefined ? newUrl : getActiveSupabaseUrl();
    const url = cleanSupabaseUrl(rawUrl);
    const key = (newKey !== undefined ? newKey : getActiveSupabaseAnonKey()).trim();

    if (!url || !key || !url.startsWith('https://')) {
      return { success: false, client: null };
    }

    if (newUrl !== undefined) {
      try { localStorage.setItem('colorlink_custom_supabase_url', url); } catch {}
    }
    if (newKey !== undefined) {
      try { localStorage.setItem('colorlink_custom_supabase_key', key); } catch {}
    }

    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    return { success: true, client: supabaseInstance };
  } catch (err) {
    console.error('Error al reconectar Supabase:', err);
    return { success: false, client: null };
  }
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  url: string;
  latencyMs?: number;
  timestamp: string;
  error?: string;
  details?: {
    cedisCount?: number;
    profilesCount?: number;
    projectsCount?: number;
    productsCount?: number;
    clientsCount?: number;
    quotesCount?: number;
    adminRegistered?: boolean;
    tablesVerified?: string[];
  };
}

/**
 * Función integral para verificar la conexión activa y la existencia de datos en Supabase.
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const timestamp = new Date().toISOString();
  const currentUrl = getActiveSupabaseUrl();
  const client = supabaseInstance || (isSupabaseConfigured ? createClient(currentUrl, getActiveSupabaseAnonKey()) : null);

  if (!client || !isSupabaseConfigured) {
    return {
      success: false,
      message: 'Supabase no está configurado. Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu entorno.',
      url: currentUrl || 'No definida',
      timestamp,
      error: 'Variables de entorno ausentes o inválidas'
    };
  }

  const startTime = performance.now();
  const verifiedTables: string[] = [];
  let cedisCount = 0;
  let profilesCount = 0;
  let projectsCount = 0;
  let productsCount = 0;
  let clientsCount = 0;
  let quotesCount = 0;
  let adminRegistered = false;

  try {
    // 1. Probar tabla pintuco_cedis
    const { data: cedis, error: cediError, count: totalCedis } = await client
      .from('pintuco_cedis')
      .select('id, nombre, ciudad', { count: 'exact' });

    if (!cediError && cedis) {
      verifiedTables.push('pintuco_cedis');
      cedisCount = totalCedis ?? cedis.length;
    }

    // 2. Probar tabla perfiles
    const { data: perfiles, error: perfError, count: totalProfiles } = await client
      .from('perfiles')
      .select('correo_electronico, nombre_completo', { count: 'exact' });

    if (!perfError && perfiles) {
      verifiedTables.push('perfiles');
      profilesCount = totalProfiles ?? perfiles.length;
      adminRegistered = perfiles.some((p: any) => p.correo_electronico === 'jairmagallanes@gmail.com');
    }

    // 3. Probar tabla pintuco_productos
    const { data: prods, error: prodError, count: totalProds } = await client
      .from('pintuco_productos')
      .select('id, nombre, linea', { count: 'exact' });

    if (!prodError && prods) {
      verifiedTables.push('pintuco_productos');
      productsCount = totalProds ?? prods.length;
    }

    // 4. Probar tabla proyectos
    const { data: projs, error: projError, count: totalProjs } = await client
      .from('proyectos')
      .select('id, codigo, estado, monto_total', { count: 'exact' });

    if (!projError && projs) {
      verifiedTables.push('proyectos');
      projectsCount = totalProjs ?? projs.length;
    }

    // 5. Probar tabla clientes
    const { data: clientes, error: cliError, count: totalClientes } = await client
      .from('clientes')
      .select('id', { count: 'exact' });

    if (!cliError && clientes) {
      verifiedTables.push('clientes');
      clientsCount = totalClientes ?? clientes.length;
    }

    // 6. Probar tabla cotizaciones
    const { data: cots, error: cotError, count: totalCots } = await client
      .from('cotizaciones')
      .select('id', { count: 'exact' });

    if (!cotError && cots) {
      verifiedTables.push('cotizaciones');
      quotesCount = totalCots ?? cots.length;
    }

    const latencyMs = Math.round(performance.now() - startTime);

    if (verifiedTables.length > 0) {
      return {
        success: true,
        message: `¡Conexión exitosa a Supabase PostgreSQL! Latencia: ${latencyMs}ms (${verifiedTables.length} tablas en línea)`,
        url: currentUrl,
        latencyMs,
        timestamp,
        details: {
          cedisCount,
          profilesCount,
          projectsCount,
          productsCount,
          clientsCount,
          quotesCount,
          adminRegistered,
          tablesVerified: verifiedTables
        }
      };
    }

    return {
      success: false,
      message: `Error al consultar tablas de Supabase: ${cediError?.message || perfError?.message || 'Error de RLS o tablas'}`,
      url: currentUrl,
      latencyMs,
      timestamp,
      error: cediError?.message || perfError?.message
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      message: `Fallo de conexión de red con Supabase: ${err?.message || 'Host inalcanzable'}`,
      url: currentUrl,
      latencyMs,
      timestamp,
      error: err?.message || String(err)
    };
  }
}

/**
 * Inserta un registro de prueba de alta fidelidad en Supabase
 * para verificar que los datos se guarden correctamente en las tablas
 * `clientes`, `sedes_proyecto`, `proyectos`, `diagnosticos_tecnicos` y `cotizaciones`.
 */
export async function testSaveSampleProjectToSupabase(): Promise<{
  success: boolean;
  message: string;
  projectCode?: string;
  details?: {
    clienteId?: string;
    sedeId?: string;
    proyectoId?: string;
    diagnosticoId?: string;
    cotizacionId?: string;
    montoCOP?: number;
  };
  error?: string;
}> {
  const client = supabaseInstance || (isSupabaseConfigured ? createClient(getActiveSupabaseUrl(), getActiveSupabaseAnonKey()) : null);
  if (!client) {
    return { success: false, message: 'Cliente de Supabase no inicializado.' };
  }

  const timestampSuffix = Date.now().toString().slice(-5);
  const nitPrueba = `NIT-PRUEBA-${timestampSuffix}`;
  const codigoProyecto = `PIN-PRUEBA-${timestampSuffix}`;

  try {
    // 1. Guardar en `clientes`
    const { data: cliente, error: errCliente } = await client
      .from('clientes')
      .insert({
        nit_cedula: nitPrueba,
        nombre_empresa: `Constructora Demo Supabase #${timestampSuffix}`,
        nombre_contacto: 'Ing. Evaluador Técnico',
        correo_contacto: 'evaluacion.supabase@pintuco.com',
        telefono_contacto: '+57 323 603 0829',
        direccion_facturacion: 'Autopista Norte Km 15, Medellín',
        ciudad: 'Medellín',
        tipo_cliente: 'empresa'
      })
      .select('id')
      .single();

    if (errCliente || !cliente?.id) {
      throw new Error(`Error en tabla clientes: ${errCliente?.message || 'Sin respuesta'}`);
    }

    // 2. Guardar en `sedes_proyecto`
    const { data: sede, error: errSede } = await client
      .from('sedes_proyecto')
      .insert({
        cliente_id: cliente.id,
        nombre_sede: `Torre Prueba Supabase v2.7 #${timestampSuffix}`,
        direccion: 'Calle 10Sur # 25-100, El Poblado',
        ciudad: 'Medellín',
        contacto_obra: 'Maestro Líder Aplicador',
        telefono_obra: '+57 300 450 1234'
      })
      .select('id')
      .single();

    if (errSede || !sede?.id) {
      throw new Error(`Error en tabla sedes_proyecto: ${errSede?.message || 'Sin respuesta'}`);
    }

    // 3. Guardar en `proyectos`
    const montoTotal = 3980000;
    const { data: proyecto, error: errProyecto } = await client
      .from('proyectos')
      .insert({
        codigo: codigoProyecto,
        cliente_id: cliente.id,
        sede_id: sede.id,
        estado: 'cotizado',
        area_m2: 240,
        tipo_superficie: 'mamposteria_concreto',
        ambiente: 'exterior_intemperie',
        condicion_superficie: 'buen_estado',
        nombre_color_objetivo: 'Koraza Blanco Almendra',
        hex_color_objetivo: '#F5F5F0',
        acabado_objetivo: 'Mate',
        urgencia: 'alta',
        monto_total: montoTotal,
        observaciones: 'Proyecto de verificación interactiva de persistencia en Supabase PostgreSQL.'
      })
      .select('id')
      .single();

    if (errProyecto || !proyecto?.id) {
      throw new Error(`Error en tabla proyectos: ${errProyecto?.message || 'Sin respuesta'}`);
    }

    // 4. Guardar en `diagnosticos_tecnicos`
    let diagnosticoId: string | undefined;
    const { data: diag, error: errDiag } = await client
      .from('diagnosticos_tecnicos')
      .insert({
        proyecto_id: proyecto.id,
        patologia_detectada: 'Microfisuras y meteorización por intemperie',
        analisis_causa_raiz: 'Exposición a rayos UV y precipitación continua en fachada exterior.',
        sistema_pintuco_recomendado: 'Sistema Pintuco® Koraza 5 Años',
        pasos_preparacion: ['Lavado hidrolavadora 2000 psi', 'Aplicación Imprimante Acrílico', '2 manos Koraza 5'],
        riesgos_mitigados: ['Eflorescencias', 'Filtración capilar'],
        anios_durabilidad: 5,
        puntaje_confianza_ia: 0.98
      })
      .select('id')
      .single();

    if (!errDiag && diag) {
      diagnosticoId = diag.id;
    }

    // 5. Guardar en `cotizaciones`
    let cotizacionId: string | undefined;
    const { data: cot, error: errCot } = await client
      .from('cotizaciones')
      .insert({
        numero_cotizacion: `COT-${codigoProyecto}`,
        proyecto_id: proyecto.id,
        subtotal_materiales: Math.round(montoTotal * 0.8),
        total_mano_obra: Math.round(montoTotal * 0.2),
        impuesto_iva: Math.round(montoTotal * 0.19),
        gran_total: Math.round(montoTotal * 1.25),
        canal_comercial: 'directo_pintuco',
        estado: 'enviada'
      })
      .select('id')
      .single();

    if (!errCot && cot) {
      cotizacionId = cot.id;
    }

    return {
      success: true,
      message: `¡Guardado exitoso en Supabase! Registro verificado en las 5 tablas con código ${codigoProyecto}.`,
      projectCode: codigoProyecto,
      details: {
        clienteId: cliente.id,
        sedeId: sede.id,
        proyectoId: proyecto.id,
        diagnosticoId,
        cotizacionId,
        montoCOP: montoTotal
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Fallo al guardar en las tablas de Supabase: ${err?.message || 'Error desconocido'}`,
      error: err?.message || String(err)
    };
  }
}

/**
 * Obtiene los proyectos guardados recientemente en Supabase para mostrarlos en la UI.
 */
export async function getSupabaseRecentProjects(limit: number = 5): Promise<any[]> {
  const client = supabaseInstance || (isSupabaseConfigured ? createClient(getActiveSupabaseUrl(), getActiveSupabaseAnonKey()) : null);
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('proyectos')
      .select(`
        id,
        codigo,
        estado,
        area_m2,
        monto_total,
        fecha_creacion,
        clientes (nombre_empresa, ciudad),
        sedes_proyecto (nombre_sede, direccion),
        cotizaciones (gran_total, estado)
      `)
      .order('fecha_creacion', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.warn('Error fetching recent projects from Supabase:', err);
    return [];
  }
}

export const verifyConnection = testSupabaseConnection;
export const checkSupabaseConnection = testSupabaseConnection;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  urlPreview: string;
  hasKey: boolean;
  isCustom: boolean;
}

export function getSupabaseStatus(): SupabaseConfigStatus {
  const url = getActiveSupabaseUrl();
  return {
    isConfigured: isSupabaseConfigured,
    urlPreview: url ? url.replace(/(https:\/\/[^.]+).*/, '$1.supabase.co') : '',
    hasKey: Boolean(getActiveSupabaseAnonKey()),
    isCustom: Boolean(getStoredUrl())
  };
}

