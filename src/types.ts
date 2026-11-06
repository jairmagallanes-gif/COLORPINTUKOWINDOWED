export type ChannelSource =
  | 'whatsapp'
  | 'web_portal'
  | 'commercial_advisor'
  | 'pintuco_store'
  | 'constructor_b2b'
  | 'mobile_app';

export type ProjectType =
  | 'residencial'
  | 'comercial'
  | 'industrial'
  | 'infraestructura'
  | 'institucional';

export type SurfaceType =
  | 'mamposteria_concreto'
  | 'drywall_yeso'
  | 'madera'
  | 'metal_ferroso'
  | 'metal_galvanizado'
  | 'teja_fibrocemento'
  | 'piso_industrial';

export type EnvironmentType =
  | 'interior_seco'
  | 'interior_humedo'
  | 'exterior_intemperie'
  | 'industrial_agresivo'
  | 'inmersion_humedad_extrema';

export type SurfaceCondition =
  | 'nueva_sin_pintar'
  | 'buen_estado'
  | 'humedad_eflorescencia'
  | 'fisuras_grietas'
  | 'descascaramiento_severo'
  | 'corrosion_oxido';

export type FinishType =
  | 'mate'
  | 'satinado'
  | 'semibrillante'
  | 'brillante'
  | 'texturizado';

export interface IdentificationData {
  clientName: string;
  nit: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  channel: ChannelSource;
}

export type DeliveryUrgency =
  | 'inmediato_24_48h'
  | 'express_3_5dias'
  | 'estandar_1_2semanas'
  | 'programado_etapas';

export const DeliveryUrgency = {
  INMEDIATO_24_48H: 'inmediato_24_48h' as const,
  EXPRESS_3_5DIAS: 'express_3_5dias' as const,
  ESTANDAR_1_2SEMANAS: 'estandar_1_2semanas' as const,
  PROGRAMADO_ETAPAS: 'programado_etapas' as const
};

export type DeliveryMethod = 'envio_obra' | 'retiro_tienda';

export const DeliveryMethod = {
  ENVIO_OBRA: 'envio_obra' as const,
  RETIRO_TIENDA: 'retiro_tienda' as const
};

export interface ProjectData {
  city: string;
  projectType: ProjectType;
  areaM2: number;
  requiredDate: string;
  deliveryUrgency?: DeliveryUrgency; // Tiempo requerido para los materiales
  deliveryUrgencyNotes?: string;
  deliveryMethod?: DeliveryMethod; // 'envio_obra' (Despacho a obra) | 'retiro_tienda' (Retiro en Tienda Pintacasa / CEDI)
  pickupStoreOrCedi?: string; // Nombre y dirección de la tienda Pintacasa o CEDI seleccionado para retiro
  pickupAuthorizedPerson?: string; // Nombre y documento de la persona autorizada a retirar
  address?: string;
}

export interface TechnicalData {
  surface: SurfaceType;
  environment: EnvironmentType;
  condition: SurfaceCondition;
  finish: FinishType;
  colorName: string;
  colorHex?: string;
}

export interface EvidenceData {
  description: string;
  photos: string[];
  observations: string;
  consentHabeasData: boolean;
}

export interface CapturedProjectForm {
  identification: IdentificationData;
  project: ProjectData;
  technical: TechnicalData;
  evidence: EvidenceData;
}

export interface PintucoProduct {
  id: string;
  name: string;
  line: string;
  category: 'pintura_principal' | 'imprimante_sellador' | 'masilla_preparacion' | 'esmalte' | 'epoxico' | 'impermeabilizante';
  coveragePerGallon: number; // m² por galón a 1 mano
  recommendedCoats: number;
  voc: string;
  dryingTime: string;
  description: string;
  features: string[];
  pricePerGallonCOP: number;
  pricePerBucketCOP: number; // Cuñete (5 galones)
  imageBadge?: string;
  stockByCity: Record<string, number>; // galones disponibles por CEDI
}

export interface TechnicalSolution {
  recommendedPrimaryProduct: PintucoProduct;
  recommendedPrimer: PintucoProduct | null;
  recommendedPutty: PintucoProduct | null;
  coatsRecommended: number;
  gallonsPrimary: number;
  bucketsPrimary: number; // Cuñetes (5 galones)
  remainderGallonsPrimary: number;
  gallonsPrimer: number;
  kilosPutty: number;
  estimatedMaterialCostCOP: number;
  surfacePreparationSteps: string[];
  applicationSteps: string[];
  qualityChecklist: string[];
  aiTechnicalNotes: string;
  warrantyYears: number;
  environmentalBenefit: string;
}

export type ProjectStatus =
  | 'capturado'                    // 1. Radicado / Capturado
  | 'validacion_stock_previa'      // 2. Validación de Stock Previa en CEDI
  | 'cotizacion_enviada'           // 3. Cotización Enviada al Cliente
  | 'cotizacion_rechazada'         // 4. Rechazado por Cliente (Proceso Terminado)
  | 'inventario_reservado'         // 5. Aprobada por Cliente & Stock Reservado en CEDI
  | 'verificacion_pago'            // 6. Verificación & Confirmación de Pago
  | 'despacho_en_camino'           // 7. Despacho & Envío de Materiales
  | 'operacion_asignada'           // 8. En Aplicación / Cuadrilla Asignada
  | 'calidad_aprobada'             // 9. Calidad Aprobada & Garantía
  | 'finalizado';                  // 10. Proyecto Entregado & Finalizado

export interface TimelineEventRecord {
  id: string;
  status: ProjectStatus;
  title: string;
  description: string;
  timestamp: string;
  author: string;
  badgeType?: 'info' | 'success' | 'warning' | 'danger';
}

export interface StockValidationDetails {
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: string;
  isStockAvailable: boolean;
  assignedCedi?: string;
  availableGallons?: number;
  requiredGallons?: number;
  notes?: string;
}

export interface PaymentVerificationDetails {
  isPaid: boolean;
  paymentMethod?: 'transferencia_bancolombia' | 'pse' | 'tarjeta_credito' | 'credito_constructor_pintuco' | 'consignacion_efectivo';
  paymentReference?: string;
  paymentAmountCOP?: number;
  paymentDate?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  receiptVoucherUrl?: string;
  notes?: string;
}

export interface DispatchDetails {
  isDispatched: boolean;
  deliveryMethod?: DeliveryMethod; // 'envio_obra' | 'retiro_tienda'
  pickupStoreOrCedi?: string;
  pickupReadyAt?: string;
  pickupVerificationCode?: string;
  pickupAuthorizedPerson?: string;
  isPickupReady?: boolean;
  isPickupDelivered?: boolean;
  carrierName?: string;
  trackingNumber?: string;
  dispatchedAt?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  driverContact?: string;
  vehiclePlate?: string;
  deliveryAddress?: string;
  receivedByName?: string;
}

export interface ProjectRecord {
  id: string; // ej. COLORLINK-2026-0482
  createdAt: string;
  status: ProjectStatus;
  formData: CapturedProjectForm;
  solution: TechnicalSolution;
  deliveryUrgency?: DeliveryUrgency;
  deliveryUrgencyLabel?: string;
  deliveryMethod?: DeliveryMethod;
  pickupStoreOrCedi?: string;
  
  // Cotización y decisión del cliente
  quotationInfo?: {
    quoteId?: string;
    totalCOP?: number;
    sentAt?: string;
    clientDecision?: 'pendiente' | 'aceptada' | 'rechazada';
    decisionDate?: string;
    rejectionReason?: string;
    itemsCount?: number;
    generatedPdfUrl?: string;
  };

  // Validación de Stock previa y confirmada
  stockValidation?: StockValidationDetails;

  // Verificación de Pago del cliente
  paymentVerification?: PaymentVerificationDetails;

  // Despacho y Envío
  dispatchInfo?: DispatchDetails;

  // Trazabilidad de Estados
  timelineEvents?: TimelineEventRecord[];

  assignedWarehouse: {
    cediName: string;
    city: string;
    stockAvailable: boolean;
    reservationCode: string;
  };
  serviceDispatch: {
    technicianOrContractor: string;
    certificationLevel: string;
    estimatedExecutionDays: number;
    scheduledStartDate: string;
  };
  qualityAssurance: {
    inspectorName: string;
    inspectionDate?: string;
    warrantyDocId: string;
    adherenceTestPassed: boolean;
    thicknessMicronsRecommended: string;
  };
}

export interface PillarItem {
  id: number;
  number: string;
  title: string;
  tagline: string;
  description: string;
  input: string;
  action: string;
  output: string;
  metrics: string[];
  color: string;
}

export type UserRole =
  | 'administrador'
  | 'asesor'
  | 'cliente_empresa'
  | 'cliente_natural'
  | 'cliente'
  | 'contratista'
  | 'calidad';

export type ActiveTabType = 
  | 'inicio' 
  | 'cotizador' 
  | 'captura' 
  | 'proyectos' 
  | 'cedis' 
  | 'admin_rbac'
  | 'visualizador'
  | 'tracking'
  | 'compras';

export type PermissionKey =
  | 'ver_mision_pilares'
  | 'usar_cotizador'
  | 'crear_captura_proyecto'
  | 'ver_proyectos'
  | 'ver_todos_los_proyectos'
  | 'cambiar_estado_proyecto'
  | 'ver_inventario_cedis'
  | 'usar_diagnostico_ia'
  | 'generar_cotizacion_pdf'
  | 'aprobar_cotizaciones'
  | 'gestionar_inventario_productos'
  | 'gestionar_roles_permisos';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  category: 'Navegación & Vistas' | 'Operaciones & Cotizaciones' | 'Gestión Técnica & Stock' | 'Administración del Sistema';
}

export type RolePermissionsMatrix = Record<string, Record<PermissionKey, boolean>>;

export type AccountStatus = 
  | 'activo' 
  | 'pendiente_aprobacion_admin' 
  | 'pendiente_verificacion_email' 
  | 'rechazado';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider?: 'local' | 'google';
  googleId?: string;
  companyOrOrg?: string;
  nitOrDoc?: string;
  phone?: string;
  city?: string;
  address?: string;
  positionOrTitle?: string;
  avatarUrl?: string;
  isRegistered?: boolean;
  clientType?: 'empresa' | 'persona_natural';
  accountStatus?: AccountStatus;
  emailVerified?: boolean;
  verificationToken?: string;
  registeredAt?: string;
  approvedByAdminAt?: string;
  approvedByAdminName?: string;
  rejectionReason?: string;
}

export type EmailNotificationType = 
  | 'verificacion_cuenta'
  | 'registro_bienvenida'
  | 'cambio_estado_proyecto'
  | 'cotizacion_generada'
  | 'pago_verificado'
  | 'despacho_en_camino'
  | 'garantia_habilitada'
  | 'alerta_admin_asesor'
  | 'aprobacion_asesor'
  | 'rechazo_asesor';

export interface EmailNotificationRecord {
  id: string;
  to: string;
  toName: string;
  subject: string;
  sentAt: string;
  type: EmailNotificationType;
  verificationToken?: string;
  role?: UserRole;
  previewSnippet: string;
  htmlContent: string;
  isRead?: boolean;
  actionTaken?: boolean;
  associatedUserId?: string;
  associatedProjectId?: string;
  associatedQuoteId?: string;
  // WhatsApp Integration
  clientPhone?: string;
  whatsappMessage?: string;
  whatsappUrl?: string;
  // Delivery metadata
  emailSent?: boolean;
  emailError?: string;
  senderEmail?: string;
}

export type EmailNotification = EmailNotificationRecord;

export interface QuoteItemBreakdown {
  id: string;
  category: 'pintura' | 'preparacion' | 'accesorio' | 'servicio' | 'logistica';
  name: string;
  presentation: string; // 'Cuñete (5 Gal)', 'Galón (3.785 L)', 'Kilos', 'm² Mano de Obra', 'Servicio'
  quantity: number;
  unitPriceCOP: number;
  totalCOP: number;
}

export interface QuotationRecord {
  id: string; // e.g. COT-2026-8812
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  clientDoc?: string;
  projectCity: string;
  surfaceType: SurfaceType;
  environment: EnvironmentType;
  condition: SurfaceCondition;
  areaM2: number;
  colorName: string;
  colorHex?: string;
  selectedProductId: string;
  selectedProductName: string;
  coats: number;
  gallonsNeeded: number;
  cuñetesNeeded: number;
  remainderGallons: number;
  items: QuoteItemBreakdown[];
  subtotalMaterialsCOP: number;
  subtotalServicesCOP: number;
  discountPercent: number;
  discountAmountCOP: number;
  subtotalNetCOP: number;
  taxIvaCOP: number;
  totalCOP: number;
  validUntil: string;
  nearestCedi: string;
  warrantyYears: number;
  includeLabor: boolean;
  channel?: ChannelSource;
  channelLabel?: string;
  deliveryUrgency?: DeliveryUrgency;
  deliveryUrgencyLabel?: string;
  deliveryMethod?: DeliveryMethod;
  pickupStoreOrCedi?: string;
  stockValidated?: boolean;
  stockValidatedAt?: string;
  stockValidationNotes?: string;
  clientDecision?: 'pendiente' | 'aceptada' | 'rechazada';
  rejectionReason?: string;
  decisionDate?: string;
  paidStatus?: 'pendiente' | 'verificado' | 'no_requerido';
  paymentReference?: string;
  paymentMethod?: string;
  status: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'convertida_en_proyecto';
  convertedProjectId?: string;
}

export interface AiDiagnosisMaterial {
  producto: string;
  presentacion: string;
  cantidadEstimada: string;
  rol: string;
}

export interface AiSimulationAcabado {
  titulo: string;
  descripcionResultado: string;
  texturaVisual: string;
  nivelBrillo: string;
  tonoColor: string;
  durabilidadGarantizada: string;
  beneficioEstetico: string;
  aspectosTransformados: string[];
}

export interface AiDiagnosisResult {
  diagnostico: string;
  recomendacionPintuco: string;
  imprimanteRecomendado?: string;
  sistemaCapas?: string[];
  materialesVenta?: AiDiagnosisMaterial[];
  simulacionAcabado?: AiSimulationAcabado;
  pasosClave?: string[];
  riesgosMitigados?: string[];
  selloSostenibilidad?: string;
  source?: string;
}


