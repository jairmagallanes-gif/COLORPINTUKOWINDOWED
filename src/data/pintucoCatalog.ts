import { PintucoProduct } from '../types';

export const PINTUCO_PRODUCTS: PintucoProduct[] = [
  {
    id: 'viniltex-bio',
    name: 'Viniltex® Bio-Cuidado Antibacterial',
    line: 'Viniltex Arquitectónico',
    category: 'pintura_principal',
    coveragePerGallon: 40, // m² por galón a 1 mano en superficie sellada
    recommendedCoats: 2,
    voc: '< 10 g/L (Ultra Bajo VOC)',
    dryingTime: '2 horas entre manos / 6 horas curado al tacto',
    description: 'Pintura tipo 1 con tecnología bio-protectora que elimina el 99.9% de bacterias y hongos. Máxima lavabilidad y alta retención de color para interiores.',
    features: [
      'Elimina bacterias, hongos y virus en superficies',
      'Ultra lavable (más de 10,000 ciclos de frote húmedo)',
      'Bajo olor y secado ultra rápido',
      'Certificación LEED v4 y Greenguard Gold'
    ],
    pricePerGallonCOP: 94900,
    pricePerBucketCOP: 435000,
    imageBadge: 'Bio-Cuidado',
    stockByCity: {
      'Medellín': 850,
      'Bogotá': 1200,
      'Cali': 540,
      'Barranquilla': 620,
      'Bucaramanga': 310,
      'Cartagena': 400
    }
  },
  {
    id: 'koraza-5',
    name: 'Koraza® 5 Máxima Durabilidad Exteriores',
    line: 'Koraza Fachadas',
    category: 'pintura_principal',
    coveragePerGallon: 30, // m² por galón a 1 mano
    recommendedCoats: 2,
    voc: '< 35 g/L',
    dryingTime: '3 horas entre manos / 24 horas secado final',
    description: 'Pintura acrílica de alta resistencia a la intemperie con elastómeros que puentean microfisuras hasta de 0.5 mm, hidrorrepelente y con filtro solar UV.',
    features: [
      'Garantía de 5 años contra decoloración y caleo',
      'Puentea microfisuras dinámicas de fachada',
      'Película antihongos y antialgas de amplio espectro',
      'Tecnología hidrófuga que repele la lluvia torrencial'
    ],
    pricePerGallonCOP: 118900,
    pricePerBucketCOP: 549000,
    imageBadge: 'Fachada 5 Años',
    stockByCity: {
      'Medellín': 1100,
      'Bogotá': 1500,
      'Cali': 720,
      'Barranquilla': 890,
      'Bucaramanga': 450,
      'Cartagena': 610
    }
  },
  {
    id: 'pintulux-3en1',
    name: 'Pintulux® 3 en 1 Esmalte Anticorrosivo',
    line: 'Pintulux Metales',
    category: 'esmalte',
    coveragePerGallon: 35,
    recommendedCoats: 2,
    voc: '< 250 g/L',
    dryingTime: '4 horas entre manos / 12 horas curado total',
    description: 'Esmalte alquídico directo al metal que actúa como transformador de óxido, anticorrosivo e impermeabilizante con acabado brillante o mate.',
    features: [
      'Aplica directo sobre óxido superficial firmemente adherido',
      'Inhibidor activo de corrosión galvanoplástica',
      'Acabado uniforme de alto brillo y resistencia a la abrasión',
      'Protección superior contra niebla salina y lluvia ácida'
    ],
    pricePerGallonCOP: 88500,
    pricePerBucketCOP: 410000,
    imageBadge: 'Directo al Metal',
    stockByCity: {
      'Medellín': 620,
      'Bogotá': 940,
      'Cali': 430,
      'Barranquilla': 580,
      'Bucaramanga': 290,
      'Cartagena': 380
    }
  },
  {
    id: 'pintucoat-epoxico',
    name: 'Pintucoat® Epóxico Poliamida Alto Rendimiento',
    line: 'Línea Industrial & Pisos',
    category: 'epoxico',
    coveragePerGallon: 28,
    recommendedCoats: 2,
    voc: '< 180 g/L',
    dryingTime: '6 horas entre manos / 7 días curado químico',
    description: 'Recubrimiento epóxico bicomponente (Relación 1:1) diseñado para pisos industriales, cuartos limpios, plantas de alimentos y áreas de alta exigencia química y mecánica.',
    features: [
      'Resistencia extrema a aceites, solventes, ácidos y álcalis diluidos',
      'Soporta tráfico pesado de montacargas y transpaletas',
      'Superficie monolítica aséptica y 100% lavable',
      'Cumple normatividad Invima y FDA para plantas alimenticias'
    ],
    pricePerGallonCOP: 185000,
    pricePerBucketCOP: 890000,
    imageBadge: 'Grado Industrial',
    stockByCity: {
      'Medellín': 380,
      'Bogotá': 510,
      'Cali': 290,
      'Barranquilla': 340,
      'Bucaramanga': 0, // Agotado en Bucaramanga
      'Cartagena': 80  // Poco nivel en Cartagena
    }
  },
  {
    id: 'sellomax-7en1',
    name: 'Sellomax® 7 en 1 Imprimante Antihumedad',
    line: 'Sellomax Preparación',
    category: 'imprimante_sellador',
    coveragePerGallon: 35,
    recommendedCoats: 1,
    voc: '< 15 g/L',
    dryingTime: '1 a 2 horas para repinte',
    description: 'Imprimante acrílico base agua con nanopartículas que penetran el poro del concreto, bloqueando eflorescencias salinas, neutralizando la alcalinidad y fijando polvillo.',
    features: [
      'Bloquea humedad por capilaridad y salitre',
      'Aumenta el rendimiento de la pintura de acabado en 30%',
      'Sella porosidades dispares en mampostería nueva',
      'Apto para interiores y exteriores'
    ],
    pricePerGallonCOP: 67900,
    pricePerBucketCOP: 295000,
    imageBadge: 'Nano-Sellador',
    stockByCity: {
      'Medellín': 950,
      'Bogotá': 1400,
      'Cali': 680,
      'Barranquilla': 750,
      'Bucaramanga': 360,
      'Cartagena': 520
    }
  },
  {
    id: 'masilla-acrilica',
    name: 'Masilla Acrílica Profesional Pintuco®',
    line: 'Preparación de Superficies',
    category: 'masilla_preparacion',
    coveragePerGallon: 25, // o m²/galón en capa delgada
    recommendedCoats: 1,
    voc: '< 5 g/L',
    dryingTime: '2 horas para lijar',
    description: 'Compuesto acrílico de alta adherencia y fácil lijabilidad para reparar fisuras no estructurales, huecos y emparejar superficies de concreto, revoque o drywall.',
    features: [
      'No se cuartea ni merma al secar',
      'Fácil lijado sin generación de nube de polvo pesada',
      'Excelente compatibilidad con Viniltex y Koraza',
      'Listo para usar sin adición de agua'
    ],
    pricePerGallonCOP: 42900,
    pricePerBucketCOP: 189000,
    imageBadge: 'Cero Fisuras',
    stockByCity: {
      'Medellín': 800,
      'Bogotá': 1150,
      'Cali': 520,
      'Barranquilla': 610,
      'Bucaramanga': 280,
      'Cartagena': 410
    }
  },
  {
    id: 'pintuco-fill-7',
    name: 'Pintuco Fill® 7 Años Impermeabilizante Fibratado',
    line: 'Impermeabilización',
    category: 'impermeabilizante',
    coveragePerGallon: 12, // para lograr espesor milimétrico impermeable
    recommendedCoats: 3,
    voc: '< 20 g/L',
    dryingTime: '4 horas entre manos / 48 horas curado de prueba hidrostática',
    description: 'Impermeabilizante elastomérico con microfibras de refuerzo incorporadas, para cubiertas, terrazas y techos de fibrocemento con tránsito peatonal moderado.',
    features: [
      'Garantía de estanqueidad 7 años',
      'Elongación superior al 300% con memoria elástica',
      'Fibras incorporadas que sustituyen la tela de refuerzo en áreas planas',
      'Refleja la radiación térmica reduciendo hasta 5°C la temperatura interior'
    ],
    pricePerGallonCOP: 129900,
    pricePerBucketCOP: 589000,
    imageBadge: 'Estanqueidad 7A',
    stockByCity: {
      'Medellín': 420,
      'Bogotá': 630,
      'Cali': 310,
      'Barranquilla': 490,
      'Bucaramanga': 190,
      'Cartagena': 330
    }
  },
  {
    id: 'viniltex-pro1000',
    name: 'Viniltex® Pro-1000 Alta Cobertura Interior',
    line: 'Viniltex Profesional',
    category: 'pintura_principal',
    coveragePerGallon: 42,
    recommendedCoats: 2,
    voc: '< 15 g/L',
    dryingTime: '2 horas entre manos / 4 horas secado',
    description: 'Pintura vinil acrílica tipo 1 de gran blancura, altísimo poder cubriente en seco y excelente rendimiento por metro cuadrado.',
    features: [
      'Máxima blancura óptica reflectiva',
      'Alto rendimiento para constructoras y grandes proyectos',
      'Fácil aplicación a rodillo sin salpique',
      'Lavabilidad certificada tipo 1'
    ],
    pricePerGallonCOP: 79900,
    pricePerBucketCOP: 365000,
    imageBadge: 'Pro Constructor',
    stockByCity: {
      'Medellín': 1400,
      'Bogotá': 1900,
      'Cali': 880,
      'Barranquilla': 920,
      'Bucaramanga': 490,
      'Cartagena': 580
    }
  },
  {
    id: 'maderpintuco-barniz',
    name: 'Maderpintuco® Barniz Protector Poliuretano',
    line: 'Protección Maderas',
    category: 'esmalte',
    coveragePerGallon: 32,
    recommendedCoats: 2,
    voc: '< 200 g/L',
    dryingTime: '4 horas entre manos / 24 horas secado total',
    description: 'Barniz transparente de alta dureza y flexibilidad que resalta las vetas naturales de la madera y protege contra rayos UV y hongos.',
    features: [
      'Filtro solar UV que evita el agrisamiento de la madera',
      'Acabado brillante o satinado sedoso',
      'Resistente a la humedad y hongos xilófagos',
      'Excelente nivelación sin marcas de brocha'
    ],
    pricePerGallonCOP: 82900,
    pricePerBucketCOP: 385000,
    imageBadge: 'Maderas Finas',
    stockByCity: {
      'Medellín': 450,
      'Bogotá': 620,
      'Cali': 310,
      'Barranquilla': 340,
      'Bucaramanga': 190,
      'Cartagena': 220
    }
  },
  {
    id: 'pintuco-trafico-acrilico',
    name: 'Pintura Tráfico Pesado y Señalización Vial Pintuco®',
    line: 'Línea Vías & Pavimentos',
    category: 'esmalte',
    coveragePerGallon: 15,
    recommendedCoats: 2,
    voc: '< 150 g/L',
    dryingTime: '20 minutos tránsito ligero / 1 hora habilitación total',
    description: 'Pintura acrílica solvente de secado ultra rápido para demarcación de parqueaderos, bodegas, helipuertos y vías de alto flujo vehicular.',
    features: [
      'Secado al no-pick-up en menos de 15 minutos',
      'Alta compatibilidad con microesferas de vidrio reflectivas',
      'Resistencia superior a la abrasión por llantas y aceite de motor',
      'Cumple especificaciones Invías para señalización horizontal'
    ],
    pricePerGallonCOP: 112000,
    pricePerBucketCOP: 520000,
    imageBadge: 'Vías & Parking',
    stockByCity: {
      'Medellín': 0, // Agotado en Medellín
      'Bogotá': 80,  // Poco stock en Bogotá
      'Cali': 0,     // Agotado en Cali
      'Barranquilla': 140, // Poco stock en Barranquilla
      'Bucaramanga': 0, // Agotado en Bucaramanga
      'Cartagena': 50  // Poco stock en Cartagena
    }
  },
  {
    id: 'intervinil-eco',
    name: 'Intervinil® Ecológico Cero Olor Antibacterial Tipo 2',
    line: 'Intervinil Profesional',
    category: 'pintura_principal',
    coveragePerGallon: 36,
    recommendedCoats: 2,
    voc: '< 5 g/L (Cero Olor)',
    dryingTime: '1 hora entre manos / 3 horas secado',
    description: 'Pintura tipo 2 para cielo rasos y muros interiores de baja fricción, con máxima economía y blancura óptima para acabados masivos.',
    features: [
      'Formulación cero olor para habitabilidad inmediata',
      'Excelente poder de relleno y cubrimiento en drywall y estuco',
      'Acabado mate aterciopelado antireflejos',
      'Fácil aplicación a brocha, rodillo o pistola airless'
    ],
    pricePerGallonCOP: 61500,
    pricePerBucketCOP: 275000,
    imageBadge: 'Cero Olor',
    stockByCity: {
      'Medellín': 75, // Poco stock en Medellín
      'Bogotá': 950, // Stock óptimo en Bogotá
      'Cali': 0,    // Agotado en Cali
      'Barranquilla': 0, // Agotado en Barranquilla
      'Bucaramanga': 40, // Poco stock en Bucaramanga
      'Cartagena': 0  // Agotado en Cartagena
    }
  }
];

export const CEDI_LOCATIONS = [
  {
    id: 'cedi-medellin',
    name: 'CEDI Central Guarne - Medellín',
    city: 'Medellín',
    address: 'Autopista Medellín-Bogotá Km 24, Guarne, Antioquia',
    leadTimeHours: 12,
    manager: 'Jair Magallanes',
    contact: '+57 323 603 0829',
    capacityStatus: 'Alta disponibilidad (98%)'
  },
  {
    id: 'cedi-bogota',
    name: 'CEDI Metropolitano Fontibón - Bogotá D.C.',
    city: 'Bogotá',
    address: 'Zona Franca Fontibón, Bodega 14A, Bogotá',
    leadTimeHours: 18,
    manager: 'Dra. Marcela Cifuentes',
    contact: '+57 (1) 745-9200',
    capacityStatus: 'Operación activa (95%)'
  },
  {
    id: 'cedi-cali',
    name: 'CEDI Occidente Yumbo - Cali',
    city: 'Cali',
    address: 'Parque Industrial Yumbo Calle 15 # 28-90, Valle',
    leadTimeHours: 24,
    manager: 'Ing. Gustavo Arango',
    contact: '+57 (2) 690-3300',
    capacityStatus: 'Capacidad normal (92%)'
  },
  {
    id: 'cedi-barranquilla',
    name: 'CEDI Costa Norte Soledad - Barranquilla',
    city: 'Barranquilla',
    address: 'Vía al Aeropuerto Km 4, Soledad, Atlántico',
    leadTimeHours: 24,
    manager: 'Ing. Rafael De la Hoz',
    contact: '+57 (5) 385-4100',
    capacityStatus: 'Alta disponibilidad (96%)'
  },
  {
    id: 'cedi-bucaramanga',
    name: 'CEDI Santanderes Chimita - Bucaramanga',
    city: 'Bucaramanga',
    address: 'Zona Industrial Chimitá Km 2, Santander',
    leadTimeHours: 36,
    manager: 'Ing. Sandra Pinzón',
    contact: '+57 (7) 678-1200',
    capacityStatus: 'Capacidad normal (90%)'
  },
  {
    id: 'cedi-cartagena',
    name: 'CEDI Marítimo Mamonal - Cartagena',
    city: 'Cartagena',
    address: 'Corredor de Carga Mamonal Km 7, Bolívar',
    leadTimeHours: 24,
    manager: 'Ing. Mauricio Villalba',
    contact: '+57 (5) 668-5500',
    capacityStatus: 'Alta disponibilidad (97%)'
  }
];

export interface PintucoColor {
  code: string;
  name: string;
  hex: string;
  family: string;
  popular?: boolean;
}

export const PINTUCO_PALETTE: PintucoColor[] = [
  // Blancos & Neutros Claros
  { code: 'BL-01', name: 'Blanco Puro Viniltex', hex: '#FFFFFF', family: 'Blancos & Neutros', popular: true },
  { code: 'BL-02', name: 'Blanco Hueso Clásico', hex: '#F8F6F0', family: 'Blancos & Neutros', popular: true },
  { code: 'BL-03', name: 'Blanco Lino Nórdico', hex: '#F2EDE4', family: 'Blancos & Neutros' },
  { code: 'BL-04', name: 'Gris Perla Suave', hex: '#E5E7EB', family: 'Blancos & Neutros', popular: true },
  { code: 'BL-05', name: 'Gris Platino Moderno', hex: '#D1D5DB', family: 'Blancos & Neutros' },
  { code: 'BL-06', name: 'Marfil Suave', hex: '#FAF5EA', family: 'Blancos & Neutros' },

  // Azules & Océano
  { code: 'AZ-01', name: 'Azul Pintuco Insignia', hex: '#2E3192', family: 'Azules & Océano', popular: true },
  { code: 'AZ-02', name: 'Azul Zafiro Corporativo', hex: '#1E3A8A', family: 'Azules & Océano', popular: true },
  { code: 'AZ-03', name: 'Azul Caribe Profundo', hex: '#0284C7', family: 'Azules & Océano' },
  { code: 'AZ-04', name: 'Azul Cielo Andino', hex: '#38BDF8', family: 'Azules & Océano' },
  { code: 'AZ-05', name: 'Azul Naval Oscuro', hex: '#0F172A', family: 'Azules & Océano' },
  { code: 'AZ-06', name: 'Azul Turquesa San Andrés', hex: '#0D9488', family: 'Azules & Océano' },

  // Tierras & Cálidos
  { code: 'TR-01', name: 'Terracota Colonial', hex: '#C2410C', family: 'Tierras & Cálidos', popular: true },
  { code: 'TR-02', name: 'Arena Guajira', hex: '#E7D5B8', family: 'Tierras & Cálidos', popular: true },
  { code: 'TR-03', name: 'Café Quindío Tostado', hex: '#78350F', family: 'Tierras & Cálidos' },
  { code: 'TR-04', name: 'Ocre Dorado Real', hex: '#D97706', family: 'Tierras & Cálidos' },
  { code: 'TR-05', name: 'Naranja Cítrico Pintuco', hex: '#FF6B35', family: 'Tierras & Cálidos', popular: true },
  { code: 'TR-06', name: 'Amarillo Colonial Antioqueño', hex: '#F7C548', family: 'Tierras & Cálidos', popular: true },

  // Verdes & Naturaleza
  { code: 'VD-01', name: 'Verde Eucalipto Bio', hex: '#15803D', family: 'Verdes & Naturaleza', popular: true },
  { code: 'VD-02', name: 'Verde Oliva Valle', hex: '#65A30D', family: 'Verdes & Naturaleza' },
  { code: 'VD-03', name: 'Verde Menta Fresco', hex: '#86EFAC', family: 'Verdes & Naturaleza' },
  { code: 'VD-04', name: 'Verde Pino Andino', hex: '#14532D', family: 'Verdes & Naturaleza' },
  { code: 'VD-05', name: 'Verde Salvia Nórdico', hex: '#94A3B8', family: 'Verdes & Naturaleza' },

  // Grises & Industriales
  { code: 'GR-01', name: 'Gris Grafito Cemento', hex: '#4B5563', family: 'Grises & Industriales', popular: true },
  { code: 'GR-02', name: 'Gris Basalto Industrial', hex: '#374151', family: 'Grises & Industriales', popular: true },
  { code: 'GR-03', name: 'Negro Ónix Fachada', hex: '#111827', family: 'Grises & Industriales' },
  { code: 'GR-04', name: 'Gris Concreto Estructural', hex: '#9CA3AF', family: 'Grises & Industriales' }
];

export interface PintucoPickupStore {
  id: string;
  name: string;
  type: 'tienda_pintacasa' | 'cedi_central';
  city: string;
  address: string;
  phone: string;
  schedule: string;
}

export const PINTUCO_PICKUP_STORES: PintucoPickupStore[] = [
  // Medellín
  {
    id: 'store-med-poblado',
    name: 'Tienda Pintacasa Pintuco® El Poblado',
    type: 'tienda_pintacasa',
    city: 'Medellín',
    address: 'Calle 10 # 43D-28, Barrio El Poblado',
    phone: '+57 (4) 444-1234',
    schedule: 'Lun - Vie: 7:30 am - 5:30 pm | Sáb: 8:00 am - 1:00 pm'
  },
  {
    id: 'store-med-laura',
    name: 'Tienda Pintacasa Pintuco® San Juan (La 70)',
    type: 'tienda_pintacasa',
    city: 'Medellín',
    address: 'Calle 44 (San Juan) # 70-15',
    phone: '+57 (4) 260-8800',
    schedule: 'Lun - Vie: 7:30 am - 5:30 pm | Sáb: 8:00 am - 2:00 pm'
  },
  {
    id: 'cedi-pickup-guarne',
    name: 'CEDI Central Logístico Guarne (Mostrador Fabrica)',
    type: 'cedi_central',
    city: 'Medellín',
    address: 'Autopista Medellín-Bogotá Km 24, Guarne, Antioquia',
    phone: '+57 (4) 384-8484',
    schedule: 'Lun - Vie: 7:00 am - 4:30 pm'
  },
  // Bogotá
  {
    id: 'store-bog-norte',
    name: 'Tienda Pintacasa Pintuco® Autopista Norte Cl. 134',
    type: 'tienda_pintacasa',
    city: 'Bogotá',
    address: 'Autopista Norte # 134-22, Costado Oriental',
    phone: '+57 (1) 625-9910',
    schedule: 'Lun - Vie: 7:30 am - 6:00 pm | Sáb: 8:00 am - 2:00 pm'
  },
  {
    id: 'store-bog-calle80',
    name: 'Tienda Pintacasa Pintuco® Calle 80 Polo Club',
    type: 'tienda_pintacasa',
    city: 'Bogotá',
    address: 'Calle 80 # 24-40, Barrio Polo',
    phone: '+57 (1) 310-7720',
    schedule: 'Lun - Vie: 7:30 am - 5:30 pm | Sáb: 8:00 am - 1:00 pm'
  },
  {
    id: 'cedi-pickup-fontibon',
    name: 'CEDI Fontibón Sabana - Bogotá (Mostrador CEDI)',
    type: 'cedi_central',
    city: 'Bogotá',
    address: 'Calle 17 # 120-45, Fontibón HB',
    phone: '+57 (1) 743-2000',
    schedule: 'Lun - Vie: 7:00 am - 5:00 pm'
  },
  // Cali
  {
    id: 'store-cali-roosevelt',
    name: 'Tienda Pintacasa Pintuco® Av. Roosevelt',
    type: 'tienda_pintacasa',
    city: 'Cali',
    address: 'Avenida Roosevelt # 34-60, Barrio San Fernando',
    phone: '+57 (2) 556-3400',
    schedule: 'Lun - Vie: 7:30 am - 5:30 pm | Sáb: 8:00 am - 1:00 pm'
  },
  {
    id: 'cedi-pickup-yumbo',
    name: 'CEDI Occidente Yumbo - Cali (Mostrador CEDI)',
    type: 'cedi_central',
    city: 'Cali',
    address: 'Parque Industrial Yumbo Calle 15 # 28-90',
    phone: '+57 (2) 690-3300',
    schedule: 'Lun - Vie: 7:30 am - 4:30 pm'
  },
  // Barranquilla
  {
    id: 'store-baq-via40',
    name: 'Tienda Pintacasa Pintuco® Vía 40 con Calle 77',
    type: 'tienda_pintacasa',
    city: 'Barranquilla',
    address: 'Vía 40 # 77-50, Sector Industrial',
    phone: '+57 (5) 353-8820',
    schedule: 'Lun - Vie: 7:30 am - 5:00 pm | Sáb: 8:00 am - 12:30 pm'
  },
  {
    id: 'cedi-pickup-soledad',
    name: 'CEDI Costa Norte Soledad - Barranquilla (Mostrador CEDI)',
    type: 'cedi_central',
    city: 'Barranquilla',
    address: 'Vía al Aeropuerto Km 4, Soledad, Atlántico',
    phone: '+57 (5) 385-4100',
    schedule: 'Lun - Vie: 7:30 am - 4:30 pm'
  },
  // Bucaramanga
  {
    id: 'store-bga-sanfrancisco',
    name: 'Tienda Pintacasa Pintuco® Carrera 27 San Francisco',
    type: 'tienda_pintacasa',
    city: 'Bucaramanga',
    address: 'Carrera 27 # 19-35, Barrio San Francisco',
    phone: '+57 (7) 634-1100',
    schedule: 'Lun - Vie: 7:30 am - 5:30 pm | Sáb: 8:00 am - 1:00 pm'
  },
  // Cartagena
  {
    id: 'store-ctg-manga',
    name: 'Tienda Pintacasa Pintuco® Manga Av. Miramar',
    type: 'tienda_pintacasa',
    city: 'Cartagena',
    address: 'Avenida Miramar # 24-80, Barrio Manga',
    phone: '+57 (5) 660-4490',
    schedule: 'Lun - Vie: 7:30 am - 5:00 pm | Sáb: 8:00 am - 1:00 pm'
  }
];


