import { ProjectRecord } from '../types';
import { calculatePintucoSolution } from '../utils/calculator';

export const INITIAL_PROJECTS: ProjectRecord[] = [
  {
    id: 'COLORLINK-2026-1042',
    createdAt: '2026-08-20T14:32:00Z',
    status: 'despacho_en_camino',
    deliveryUrgency: 'inmediato_24_48h',
    deliveryUrgencyLabel: '🚨 Urgente / Inmediato (24 a 48 horas)',
    quotationInfo: {
      quoteId: 'COT-2026-1042',
      totalCOP: 14850000,
      sentAt: '2026-08-21T10:00:00Z',
      clientDecision: 'aceptada',
      decisionDate: '2026-08-21T15:30:00Z',
      itemsCount: 5
    },
    stockValidation: {
      isValidated: true,
      validatedAt: '2026-08-21T09:15:00Z',
      validatedBy: 'Jair Magallanes (Administrador Central)',
      isStockAvailable: true,
      assignedCedi: 'CEDI Central Guarne - Medellín',
      availableGallons: 1100,
      requiredGallons: 38,
      notes: 'Disponibilidad inmediata de Koraza 5 y Sellomax 7en1 en lotes certificados.'
    },
    paymentVerification: {
      isPaid: true,
      paymentMethod: 'transferencia_bancolombia',
      paymentReference: 'BCOL-TRF-9821440',
      paymentAmountCOP: 14850000,
      paymentDate: '2026-08-22T11:20:00Z',
      isVerified: true,
      verifiedBy: 'Tesorería Pintuco (Andrea Henao)',
      verifiedAt: '2026-08-22T14:05:00Z',
      notes: 'Transferencia confirmada y aprobada por Tesorería Central. Pedido liberado para despacho inmediato.'
    },
    dispatchInfo: {
      isDispatched: true,
      carrierName: 'Flota Logística Especializada Pintuco Express',
      trackingNumber: 'PIN-MED-84920-TRK',
      dispatchedAt: '2026-08-23T08:30:00Z',
      estimatedDeliveryDate: '2026-08-24',
      vehiclePlate: 'WGL-492 (Camión Furgón 4.5T)',
      driverContact: 'Don Rodrigo Arboleda (+57 311 405 9920)',
      deliveryAddress: 'Carrera 43A # 14-88, El Poblado, Medellín'
    },
    timelineEvents: [
      {
        id: 'evt-1',
        status: 'capturado',
        title: 'Radicación de Solicitud de Obra',
        description: 'Proyecto creado con urgencia de entrega Inmediata (24-48h). Área: 520 m².',
        timestamp: '2026-08-20T14:32:00Z',
        author: 'Portal Web ColorLink (Cliente)'
      },
      {
        id: 'evt-2',
        status: 'validacion_stock_previa',
        title: 'Validación de Inventario en CEDI Guarne',
        description: 'Stock 100% disponible verificado por asesor comercial. 38 galones requeridos.',
        timestamp: '2026-08-21T09:15:00Z',
        author: 'Jair Magallanes (Administrador Central)'
      },
      {
        id: 'evt-3',
        status: 'cotizacion_enviada',
        title: 'Cotización Formal COT-2026-1042 Enviada',
        description: 'Cotización remitida al cliente por $14.850.000 COP con mano de obra y materiales.',
        timestamp: '2026-08-21T10:00:00Z',
        author: 'Sistema ColorLink'
      },
      {
        id: 'evt-4',
        status: 'inventario_reservado',
        title: 'Cotización Aceptada por Cliente & Stock Reservado',
        description: 'El cliente aceptó formalmente la propuesta económica. Código de reserva RES-MED-9402 generado.',
        timestamp: '2026-08-21T15:30:00Z',
        author: 'Arq. Mateo Valenzuela (Cliente)'
      },
      {
        id: 'evt-5',
        status: 'verificacion_pago',
        title: 'Pago Verificado y Aprobado por Tesorería',
        description: 'Transferencia Bancolombia Ref BCOL-TRF-9821440 por $14.850.000 COP validada.',
        timestamp: '2026-08-22T14:05:00Z',
        author: 'Tesorería Pintuco'
      },
      {
        id: 'evt-6',
        status: 'despacho_en_camino',
        title: 'Despacho de Materiales en Ruta a Obra',
        description: 'Camión WGL-492 cargado y despachado desde CEDI Central Guarne hacia El Poblado.',
        timestamp: '2026-08-23T08:30:00Z',
        author: 'Logística & Despacho CEDI'
      }
    ],
    formData: {
      identification: {
        clientName: 'Constructora & Hábitat Andino S.A.S.',
        nit: '900.842.115-4',
        contactPerson: 'Arq. Mateo Valenzuela',
        contactPhone: '+57 312 849 2031',
        contactEmail: 'mvalenzuela@habitatandino.com.co',
        channel: 'constructor_b2b'
      },
      project: {
        city: 'Medellín',
        projectType: 'residencial',
        areaM2: 520,
        requiredDate: '2026-09-10',
        deliveryUrgency: 'inmediato_24_48h',
        address: 'Carrera 43A # 14-88, El Poblado'
      },
      technical: {
        surface: 'mamposteria_concreto',
        environment: 'exterior_intemperie',
        condition: 'humedad_eflorescencia',
        finish: 'mate',
        colorName: 'Blanco Lino Andino (Pintuco 1001-P)',
        colorHex: '#F3EFEA'
      },
      evidence: {
        description: 'Repinte de fachada de 4 pisos expuesta a lluvia y sol directo. Se observan rastros de salitre y humedad en la base del primer piso.',
        photos: [
          'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80'
        ],
        observations: 'Cliente requiere aplicación los fines de semana para no incomodar a residentes.',
        consentHabeasData: true
      }
    },
    solution: calculatePintucoSolution({
      identification: {
        clientName: 'Constructora & Hábitat Andino S.A.S.',
        nit: '900.842.115-4',
        contactPerson: 'Arq. Mateo Valenzuela',
        contactPhone: '+57 312 849 2031',
        contactEmail: 'mvalenzuela@habitatandino.com.co',
        channel: 'constructor_b2b'
      },
      project: {
        city: 'Medellín',
        projectType: 'residencial',
        areaM2: 520,
        requiredDate: '2026-09-10',
        deliveryUrgency: 'inmediato_24_48h',
        address: 'Carrera 43A # 14-88, El Poblado'
      },
      technical: {
        surface: 'mamposteria_concreto',
        environment: 'exterior_intemperie',
        condition: 'humedad_eflorescencia',
        finish: 'mate',
        colorName: 'Blanco Lino Andino (Pintuco 1001-P)'
      },
      evidence: {
        description: 'Repinte de fachada de 4 pisos expuesta a lluvia y sol directo.',
        photos: [],
        observations: '',
        consentHabeasData: true
      }
    }),
    assignedWarehouse: {
      cediName: 'CEDI Central Guarne - Medellín',
      city: 'Medellín',
      stockAvailable: true,
      reservationCode: 'RES-MED-9402'
    },
    serviceDispatch: {
      technicianOrContractor: 'Contratistas Unidos de Antioquia (Pintor Máster Certificado #148)',
      certificationLevel: 'Nivel 3 Oro Pintuco',
      estimatedExecutionDays: 6,
      scheduledStartDate: '2026-09-02'
    },
    qualityAssurance: {
      inspectorName: 'Ing. Laura Serna (Técnica Especialista Pintuco)',
      warrantyDocId: 'GAR-MED-2026-883',
      adherenceTestPassed: true,
      thicknessMicronsRecommended: '110 µm DFT'
    }
  },
  {
    id: 'COLORLINK-2026-2189',
    createdAt: '2026-08-21T09:15:00Z',
    status: 'verificacion_pago',
    deliveryUrgency: 'express_3_5dias',
    deliveryUrgencyLabel: '⚡ Rápido / Express (3 a 5 días hábiles)',
    quotationInfo: {
      quoteId: 'COT-2026-2189',
      totalCOP: 8940000,
      sentAt: '2026-08-21T11:00:00Z',
      clientDecision: 'aceptada',
      decisionDate: '2026-08-22T09:30:00Z',
      itemsCount: 4
    },
    stockValidation: {
      isValidated: true,
      validatedAt: '2026-08-21T10:30:00Z',
      validatedBy: 'Ing. Mateo Gómez (Asesor CEDI Fontibón)',
      isStockAvailable: true,
      assignedCedi: 'CEDI Metropolitano Fontibón - Bogotá D.C.',
      availableGallons: 1200,
      requiredGallons: 41,
      notes: 'Stock reservado en CEDI Fontibón listo para despacho al confirmar pago.'
    },
    paymentVerification: {
      isPaid: true,
      paymentMethod: 'pse',
      paymentReference: 'PSE-BOG-2026-44910',
      paymentAmountCOP: 8940000,
      paymentDate: '2026-08-22T16:45:00Z',
      isVerified: false,
      notes: 'Comprobante PSE adjuntado por el cliente. En revisión por el área contable para liberar despacho.'
    },
    timelineEvents: [
      {
        id: 'evt-21',
        status: 'capturado',
        title: 'Proyecto Radicado',
        description: 'Captura de requerimiento para oficinas en Chicó Norte (740 m²).',
        timestamp: '2026-08-21T09:15:00Z',
        author: 'Portal Web (Cliente)'
      },
      {
        id: 'evt-22',
        status: 'validacion_stock_previa',
        title: 'Inventario Validado en CEDI Fontibón',
        description: 'Stock suficiente de Viniltex Bio y Masilla Acrílica en Bogotá.',
        timestamp: '2026-08-21T10:30:00Z',
        author: 'Asesor Comercial Bogotá'
      },
      {
        id: 'evt-23',
        status: 'cotizacion_enviada',
        title: 'Cotización Enviada al Cliente',
        description: 'Propuesta técnica remitida por $8.940.000 COP.',
        timestamp: '2026-08-21T11:00:00Z',
        author: 'Asesor Comercial'
      },
      {
        id: 'evt-24',
        status: 'inventario_reservado',
        title: 'Cotización Aceptada por Cliente',
        description: 'Aprobación confirmada por Ing. Carolina Morales. Stock reservado.',
        timestamp: '2026-08-22T09:30:00Z',
        author: 'Cliente'
      },
      {
        id: 'evt-25',
        status: 'verificacion_pago',
        title: 'Comprobante de Pago PSE Registrado',
        description: 'Transacción PSE-BOG-2026-44910 registrada. Pendiente validación de Tesorería para despachar.',
        timestamp: '2026-08-22T16:45:00Z',
        author: 'Cliente'
      }
    ],
    formData: {
      identification: {
        clientName: 'Torre Empresarial Calle 100 P.H.',
        nit: '860.501.992-1',
        contactPerson: 'Ing. Carolina Morales',
        contactPhone: '+57 300 451 9822',
        contactEmail: 'administracion@torre100bogota.com',
        channel: 'web_portal'
      },
      project: {
        city: 'Bogotá',
        projectType: 'comercial',
        areaM2: 740,
        requiredDate: '2026-09-18',
        deliveryUrgency: 'express_3_5dias',
        address: 'Calle 100 # 19A-45, Chicó Norte'
      },
      technical: {
        surface: 'drywall_yeso',
        environment: 'interior_seco',
        condition: 'fisuras_grietas',
        finish: 'satinado',
        colorName: 'Gris Calma Pintuco (G-204)',
        colorHex: '#E2E4E8'
      },
      evidence: {
        description: 'Remodelación de 3 pisos de oficinas corporativas. Paredes en drywall con juntas desajustadas y microfisuras por dilatación térmica.',
        photos: [
          'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
        ],
        observations: 'Pintura debe ser ultra bajo olor para permitir trabajo de personal en pisos contiguos.',
        consentHabeasData: true
      }
    },
    solution: calculatePintucoSolution({
      identification: {
        clientName: 'Torre Empresarial Calle 100 P.H.',
        nit: '860.501.992-1',
        contactPerson: 'Ing. Carolina Morales',
        contactPhone: '+57 300 451 9822',
        contactEmail: 'administracion@torre100bogota.com',
        channel: 'web_portal'
      },
      project: {
        city: 'Bogotá',
        projectType: 'comercial',
        areaM2: 740,
        requiredDate: '2026-09-18',
        deliveryUrgency: 'express_3_5dias',
        address: 'Calle 100 # 19A-45, Chicó Norte'
      },
      technical: {
        surface: 'drywall_yeso',
        environment: 'interior_seco',
        condition: 'fisuras_grietas',
        finish: 'satinado',
        colorName: 'Gris Calma Pintuco (G-204)'
      },
      evidence: {
        description: 'Remodelación de oficinas corporativas.',
        photos: [],
        observations: '',
        consentHabeasData: true
      }
    }),
    assignedWarehouse: {
      cediName: 'CEDI Metropolitano Fontibón - Bogotá D.C.',
      city: 'Bogotá',
      stockAvailable: true,
      reservationCode: 'RES-BOG-4119'
    },
    serviceDispatch: {
      technicianOrContractor: 'Soluciones Civiles & Acabados Capital S.A.S.',
      certificationLevel: 'Nivel 2 Plata Pintuco',
      estimatedExecutionDays: 5,
      scheduledStartDate: '2026-09-08'
    },
    qualityAssurance: {
      inspectorName: 'Ing. Andrés Gomez (Control de Calidad Pintuco Bogotá)',
      warrantyDocId: 'GAR-BOG-2026-402',
      adherenceTestPassed: true,
      thicknessMicronsRecommended: '90 µm DFT'
    }
  },
  {
    id: 'COLORLINK-2026-3401',
    createdAt: '2026-08-21T16:40:00Z',
    status: 'calidad_aprobada',
    deliveryUrgency: 'programado_etapas',
    deliveryUrgencyLabel: '📅 Programada por Etapas de Obra',
    quotationInfo: {
      quoteId: 'COT-2026-3401',
      totalCOP: 32400000,
      sentAt: '2026-08-22T08:00:00Z',
      clientDecision: 'aceptada',
      decisionDate: '2026-08-22T14:00:00Z',
      itemsCount: 6
    },
    stockValidation: {
      isValidated: true,
      validatedAt: '2026-08-21T17:00:00Z',
      validatedBy: 'Ing. Javier Peña (Especialista Industrial CEDI Yumbo)',
      isStockAvailable: true,
      assignedCedi: 'CEDI Occidente Yumbo - Cali',
      availableGallons: 540,
      requiredGallons: 76,
      notes: 'Pintucoat Epóxico de alta resistencia química disponible en bodega Yumbo.'
    },
    paymentVerification: {
      isPaid: true,
      paymentMethod: 'credito_constructor_pintuco',
      paymentReference: 'CRED-B2B-CAL-8840',
      paymentAmountCOP: 32400000,
      paymentDate: '2026-08-23T09:00:00Z',
      isVerified: true,
      verifiedBy: 'Crédito y Cartera Pintuco Nacional',
      verifiedAt: '2026-08-23T10:15:00Z',
      notes: 'Línea de crédito corporativo 45 días aprobada con cupo vigente.'
    },
    dispatchInfo: {
      isDispatched: true,
      carrierName: 'Transportes Industriales del Valle',
      trackingNumber: 'TIV-YUM-10492',
      dispatchedAt: '2026-08-24T07:00:00Z',
      deliveredAt: '2026-08-24T11:30:00Z',
      vehiclePlate: 'SVO-712',
      driverContact: 'Hernando Caicedo (+57 318 640 2210)',
      deliveryAddress: 'Parque Industrial La Nubia, Yumbo',
      receivedByName: 'Dr. Hernán Barona (Jefe de Planta)'
    },
    formData: {
      identification: {
        clientName: 'Industrias Lácteas del Valle S.A.',
        nit: '890.312.445-8',
        contactPerson: 'Dr. Hernán Barona (Jefe de Planta)',
        contactPhone: '+57 317 623 8810',
        contactEmail: 'hbarona@lacteosvalle.com.co',
        channel: 'commercial_advisor'
      },
      project: {
        city: 'Cali',
        projectType: 'industrial',
        areaM2: 1250,
        requiredDate: '2026-09-05',
        deliveryUrgency: 'programado_etapas',
        address: 'Parque Industrial La Nubia, Yumbo'
      },
      technical: {
        surface: 'piso_industrial',
        environment: 'industrial_agresivo',
        condition: 'descascaramiento_severo',
        finish: 'brillante',
        colorName: 'Gris Seguridad Industrial (RAL 7035)',
        colorHex: '#C5C7C4'
      },
      evidence: {
        description: 'Recubrimiento de piso en zona de pasteurización y empaque. Alto tránsito de carretillas, presencia de vapor y lavado frecuente con soda cáustica al 3%.',
        photos: [
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
        ],
        observations: 'Requiere certificación de inocuidad y resistencia al shock térmico.',
        consentHabeasData: true
      }
    },
    solution: calculatePintucoSolution({
      identification: {
        clientName: 'Industrias Lácteas del Valle S.A.',
        nit: '890.312.445-8',
        contactPerson: 'Dr. Hernán Barona',
        contactPhone: '+57 317 623 8810',
        contactEmail: 'hbarona@lacteosvalle.com.co',
        channel: 'commercial_advisor'
      },
      project: {
        city: 'Cali',
        projectType: 'industrial',
        areaM2: 1250,
        requiredDate: '2026-09-05',
        deliveryUrgency: 'programado_etapas',
        address: 'Parque Industrial La Nubia, Yumbo'
      },
      technical: {
        surface: 'piso_industrial',
        environment: 'industrial_agresivo',
        condition: 'descascaramiento_severo',
        finish: 'brillante',
        colorName: 'Gris Seguridad Industrial (RAL 7035)'
      },
      evidence: {
        description: 'Piso industrial de planta de alimentos.',
        photos: [],
        observations: '',
        consentHabeasData: true
      }
    }),
    assignedWarehouse: {
      cediName: 'CEDI Occidente Yumbo - Cali',
      city: 'Cali',
      stockAvailable: true,
      reservationCode: 'RES-CAL-7721'
    },
    serviceDispatch: {
      technicianOrContractor: 'Recubrimientos Especializados del Pacífico (Aplicador Élite)',
      certificationLevel: 'Nivel 3 Oro Pintuco Industrial',
      estimatedExecutionDays: 8,
      scheduledStartDate: '2026-08-28'
    },
    qualityAssurance: {
      inspectorName: 'Ing. Germán Echeverry (Auditor de Calidad Industrial Pintuco)',
      warrantyDocId: 'GAR-CAL-2026-119',
      adherenceTestPassed: true,
      thicknessMicronsRecommended: '250 µm DFT Epóxico'
    }
  },
  {
    id: 'COLORLINK-2026-4890',
    createdAt: '2026-08-22T10:15:00Z',
    status: 'cotizacion_enviada',
    deliveryUrgency: 'inmediato_24_48h',
    deliveryUrgencyLabel: '🚨 Urgente / Inmediato (24 a 48 horas)',
    quotationInfo: {
      quoteId: 'COT-2026-4890',
      totalCOP: 6250000,
      sentAt: '2026-08-22T11:45:00Z',
      clientDecision: 'pendiente',
      itemsCount: 3
    },
    stockValidation: {
      isValidated: true,
      validatedAt: '2026-08-22T11:20:00Z',
      validatedBy: 'Asesor Comercial Barranquilla',
      isStockAvailable: true,
      assignedCedi: 'CEDI Caribe Soledad - Barranquilla',
      availableGallons: 890,
      requiredGallons: 18,
      notes: 'Stock validado 100% en CEDI Soledad para despacho inmediato tras aprobación.'
    },
    formData: {
      identification: {
        clientName: 'Colegio Bilingüe del Caribe',
        nit: '800.192.833-2',
        contactPerson: 'Lic. Mariana Restrepo',
        contactPhone: '+57 301 552 1190',
        contactEmail: 'rectoria@colegiodelcaribe.edu.co',
        channel: 'commercial_advisor'
      },
      project: {
        city: 'Barranquilla',
        projectType: 'institucional',
        areaM2: 380,
        requiredDate: '2026-08-30',
        deliveryUrgency: 'inmediato_24_48h',
        address: 'Calle 84 # 51B-20, Alto Prado'
      },
      technical: {
        surface: 'mamposteria_concreto',
        environment: 'interior_humedo',
        condition: 'buen_estado',
        finish: 'satinado',
        colorName: 'Azul Colonial P-402',
        colorHex: '#2B4C7E'
      },
      evidence: {
        description: 'Adecuación de aulas de preescolar y pasillos antes del regreso a clases.',
        photos: [],
        observations: 'Pintura antibacterial certificada requerida.',
        consentHabeasData: true
      }
    },
    solution: calculatePintucoSolution({
      identification: {
        clientName: 'Colegio Bilingüe del Caribe',
        nit: '800.192.833-2',
        contactPerson: 'Lic. Mariana Restrepo',
        contactPhone: '+57 301 552 1190',
        contactEmail: 'rectoria@colegiodelcaribe.edu.co',
        channel: 'commercial_advisor'
      },
      project: {
        city: 'Barranquilla',
        projectType: 'institucional',
        areaM2: 380,
        requiredDate: '2026-08-30',
        deliveryUrgency: 'inmediato_24_48h',
        address: 'Calle 84 # 51B-20, Alto Prado'
      },
      technical: {
        surface: 'mamposteria_concreto',
        environment: 'interior_humedo',
        condition: 'buen_estado',
        finish: 'satinado',
        colorName: 'Azul Colonial P-402'
      },
      evidence: {
        description: 'Adecuación de aulas.',
        photos: [],
        observations: '',
        consentHabeasData: true
      }
    }),
    assignedWarehouse: {
      cediName: 'CEDI Caribe Soledad - Barranquilla',
      city: 'Barranquilla',
      stockAvailable: true,
      reservationCode: 'RES-BAR-3301'
    },
    serviceDispatch: {
      technicianOrContractor: 'Cuadrilla Aplicadores Certificados Caribe',
      certificationLevel: 'Nivel 2 Plata Pintuco',
      estimatedExecutionDays: 3,
      scheduledStartDate: '2026-08-28'
    },
    qualityAssurance: {
      inspectorName: 'Ing. Roberto Varela (Pintuco Barranquilla)',
      warrantyDocId: 'GAR-BAR-2026-092',
      adherenceTestPassed: true,
      thicknessMicronsRecommended: '90 µm DFT'
    }
  },
  {
    id: 'COLORLINK-2026-5120',
    createdAt: '2026-08-23T11:00:00Z',
    status: 'cotizacion_rechazada',
    deliveryUrgency: 'estandar_1_2semanas',
    deliveryUrgencyLabel: '📦 Estándar (1 a 2 semanas)',
    quotationInfo: {
      quoteId: 'COT-2026-5120',
      totalCOP: 18500000,
      sentAt: '2026-08-23T14:30:00Z',
      clientDecision: 'rechazada',
      decisionDate: '2026-08-24T09:10:00Z',
      rejectionReason: 'El cliente optó por posponer el proyecto para la vigencia fiscal 2027 por ajuste de presupuesto interno.'
    },
    stockValidation: {
      isValidated: true,
      validatedAt: '2026-08-23T14:00:00Z',
      validatedBy: 'Asesor Bucaramanga',
      isStockAvailable: true,
      assignedCedi: 'CEDI Santander Chimitá - Bucaramanga',
      availableGallons: 450,
      requiredGallons: 48,
      notes: 'Stock disponible pero proceso cerrado tras rechazo de cotización por el cliente.'
    },
    timelineEvents: [
      {
        id: 'evt-51',
        status: 'capturado',
        title: 'Proyecto Radicado',
        description: 'Solicitud de pintura para centro comercial.',
        timestamp: '2026-08-23T11:00:00Z',
        author: 'Portal Web'
      },
      {
        id: 'evt-52',
        status: 'validacion_stock_previa',
        title: 'Stock CEDI Validado',
        description: 'Existencias comprobadas en CEDI Chimitá.',
        timestamp: '2026-08-23T14:00:00Z',
        author: 'Asesor Comercial'
      },
      {
        id: 'evt-53',
        status: 'cotizacion_enviada',
        title: 'Cotización Enviada al Cliente',
        description: 'Cotización COT-2026-5120 por $18.500.000 COP enviada.',
        timestamp: '2026-08-23T14:30:00Z',
        author: 'Asesor Comercial'
      },
      {
        id: 'evt-54',
        status: 'cotizacion_rechazada',
        title: 'Cotización Rechazada por el Cliente (Proceso Terminado)',
        description: 'Motivo: Ajuste presupuestal interno del cliente para 2027. Flujo cerrado.',
        timestamp: '2026-08-24T09:10:00Z',
        author: 'Cliente'
      }
    ],
    formData: {
      identification: {
        clientName: 'Centro Comercial Cañaveral P.H.',
        nit: '804.009.219-5',
        contactPerson: 'Ing. Gabriel Villamizar',
        contactPhone: '+57 316 490 8821',
        contactEmail: 'gerencia@cc-canaveral.com',
        channel: 'web_portal'
      },
      project: {
        city: 'Bucaramanga',
        projectType: 'comercial',
        areaM2: 950,
        requiredDate: '2026-09-25',
        deliveryUrgency: 'estandar_1_2semanas',
        address: 'Calle 30 # 25-70, Floridablanca'
      },
      technical: {
        surface: 'mamposteria_concreto',
        environment: 'interior_seco',
        condition: 'buen_estado',
        finish: 'mate',
        colorName: 'Blanco Lino 1001-P',
        colorHex: '#F7F6F2'
      },
      evidence: {
        description: 'Pintura general de pasillos centrales y plazoleta de comidas.',
        photos: [],
        observations: 'Proceso cerrado por decisión del cliente.',
        consentHabeasData: true
      }
    },
    solution: calculatePintucoSolution({
      identification: {
        clientName: 'Centro Comercial Cañaveral P.H.',
        nit: '804.009.219-5',
        contactPerson: 'Ing. Gabriel Villamizar',
        contactPhone: '+57 316 490 8821',
        contactEmail: 'gerencia@cc-canaveral.com',
        channel: 'web_portal'
      },
      project: {
        city: 'Bucaramanga',
        projectType: 'comercial',
        areaM2: 950,
        requiredDate: '2026-09-25',
        deliveryUrgency: 'estandar_1_2semanas',
        address: 'Calle 30 # 25-70, Floridablanca'
      },
      technical: {
        surface: 'mamposteria_concreto',
        environment: 'interior_seco',
        condition: 'buen_estado',
        finish: 'mate',
        colorName: 'Blanco Lino 1001-P'
      },
      evidence: {
        description: 'Pintura general.',
        photos: [],
        observations: '',
        consentHabeasData: true
      }
    }),
    assignedWarehouse: {
      cediName: 'CEDI Santander Chimitá - Bucaramanga',
      city: 'Bucaramanga',
      stockAvailable: true,
      reservationCode: 'RES-BUC-9012'
    },
    serviceDispatch: {
      technicianOrContractor: 'Aplicadores de Santander Pintuco',
      certificationLevel: 'Nivel 2 Plata',
      estimatedExecutionDays: 7,
      scheduledStartDate: '2026-09-25'
    },
    qualityAssurance: {
      inspectorName: 'Ing. Fabio Rueda (Pintuco Bucaramanga)',
      warrantyDocId: 'GAR-BUC-2026-003',
      adherenceTestPassed: false,
      thicknessMicronsRecommended: '100 µm DFT'
    }
  }
];

