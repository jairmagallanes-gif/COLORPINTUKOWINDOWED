import { PillarItem } from '../types';

export const COMPANY_IDENTITY = {
  name: 'COLORLINK by Pintuco®',
  slogan: 'Ecosistema Inteligente de Soluciones Integradas de Pintura y Recubrimientos',
  mision: 'Transformar digitalmente la relación entre la necesidad de protección y embellecimiento de superficies y la entrega de soluciones integrales, conectando en tiempo real al cliente con la ingeniería técnica, la producción, los inventarios de CEDIs, la red de aplicadores certificados y la garantía de calidad de Pintuco.',
  vision: 'Ser para el 2030 la plataforma líder en Latinoamérica de orquestación inteligente de recubrimientos arquitectónicos e industriales, reduciendo en un 80% los tiempos de formulación técnica y entrega, con cero desperdicio de materiales y máxima trazabilidad de punta a punta.',
  valores: [
    {
      title: 'Innovación Digital con Propósito',
      desc: 'Utilizamos Inteligencia Artificial y datos estructurados no para sustituir la calidez humana, sino para potenciar la precisión técnica y agilidad operativa.'
    },
    {
      title: 'Rigor Técnico & Calidad Pintuco',
      desc: 'Respaldamos cada metro cuadrado con normas técnicas (NTC/ASTM), fichas certificadas y formulaciones exactas sin especulaciones.'
    },
    {
      title: 'Sostenibilidad y Cero Desperdicio',
      desc: 'Cálculo milimétrico de consumo y fomento de productos con ultra-bajo VOC y certificaciones Greenguard / LEED.'
    },
    {
      title: 'Transparencia & Trazabilidad E2E',
      desc: 'El cliente y el equipo tienen visibilidad total desde la captura de la solicitud hasta la firma de entrega de garantía.'
    },
    {
      title: 'Colaboración Ecosistémica',
      desc: 'Integramos clientes, asesores, CEDIs, contratistas y supervisores en un único flujo sin fisuras ni silos.'
    }
  ],
  objetivos: [
    'Unificar la captura multicanal (WhatsApp, Web, Tiendas, Asesores, B2B) en una sola estructura de datos estandarizada.',
    'Automatizar el cálculo técnico de materiales, masillas, imprimantes y galonaje en menos de 5 segundos.',
    'Sincronizar en tiempo real los proyectos con la disponibilidad de inventario en los CEDIs regionales de Colombia.',
    'Garantizar la asignación rápida a aplicadores certificados y emitir fichas de aseguramiento de calidad con ID de proyecto único.'
  ],
  retoClave: {
    problema: 'La necesidad del cliente llega dispersa por distintos canales, la evaluación técnica es fragmentada y manual, el cálculo de inventario consume días y no hay conexión entre el proyecto, el CEDI, el pintor y la garantía.',
    solucionColorlink: 'COLORLINK no se limita a vender pintura: orquesta de forma inteligente la Captura Estructurada, el Diagnóstico por IA, la Reserva en CEDI, la Cuadrilla Certificada y el Aseguramiento de Calidad.'
  }
};

export const COLORLINK_PILLARS: PillarItem[] = [
  {
    id: 1,
    number: '01',
    title: 'Captura Inteligente de Proyectos Multicanal',
    tagline: 'La automatización empieza con una buena entrada de información',
    description: 'Convierte necesidades ambiguas que llegan por WhatsApp, Web, Tiendas o Asesores en datos estructurados y listos para validar mediante un Formulario Mínimo Viable.',
    input: 'Cliente, Tipo de Obra, Superficie, Área m², Ambiente, Condición patológica, Color y Fotos',
    action: 'Validación de sustrato, normalización de datos y generación de ID Único de Proyecto',
    output: 'Ficha de Proyecto Normalizada con trazabilidad inicial inmediata',
    metrics: ['Tasa de completitud: 99.4%', 'Tiempo de captura: < 2 min', '0 ambigüedad técnica'],
    color: 'from-blue-600 to-cyan-600'
  },
  {
    id: 2,
    number: '02',
    title: 'Solución Técnica Asistida por IA',
    tagline: 'Cálculo milimétrico de capas, selladores y patologías',
    description: 'Un motor de reglas químicas e Inteligencia Artificial (Gemini) formula la combinación exacta de pintura (Viniltex, Koraza, Pintulux, Epóxicos), masilla de resane e imprimante Sellomax.',
    input: 'Sustrato, nivel de humedad/fisuras, exposición climática y m²',
    action: 'Cálculo de galones, cuñetes de 5 galones, manos recomendadas y protocolo de preparación de superficie',
    output: 'Fórmula de recubrimiento, presupuesto estimado y pasos de aplicación',
    metrics: ['Precisión de consumo: ±3%', 'Tiempo de cálculo: Instantáneo (< 1s)', 'Ahorro por sobredosis: 18%'],
    color: 'from-indigo-600 to-blue-600'
  },
  {
    id: 3,
    number: '03',
    title: 'Abastecimiento e Inventario en CEDIs',
    tagline: 'Conexión directa con la red logística Pintuco',
    description: 'Enlaza automáticamente el requerimiento de galones y líneas con el Centro de Distribución (CEDI) más cercano (Medellín, Bogotá, Cali, Barranquilla, Bucaramanga, Cartagena).',
    input: 'Ubicación de obra y cantidad de galones calculados',
    action: 'Consulta de stock en tiempo real, reserva de lotes y asignación de código de retiro/despacho',
    output: 'Reserva activa de inventario y tiempo estimado de entrega (Lead Time 12-24h)',
    metrics: ['Disponibilidad de stock: 96.8%', 'Lead time promedio: 18 horas', 'Cero quiebres en obra'],
    color: 'from-emerald-600 to-teal-600'
  },
  {
    id: 4,
    number: '04',
    title: 'Orquestación de Servicio & Aplicadores',
    tagline: 'Mano de obra certificada y cronograma confiable',
    description: 'Asigna contratistas y pintores máster avalados por el Centro Tecnológico Pintuco con los niveles de certificación adecuados al tipo de superficie.',
    input: 'Complejidad técnica de obra, área en m² y fecha requerida',
    action: 'Matcheo inteligente de cuadrilla certificada y estimación de días de ejecución',
    output: 'Orden de servicio con aplicador asignado y cronograma pactado',
    metrics: ['Red de 1,200+ pintores certificados', 'Cumplimiento de cronograma: 94%', 'Calificación: 4.9/5'],
    color: 'from-amber-600 to-orange-600'
  },
  {
    id: 5,
    number: '05',
    title: 'Aseguramiento de Calidad & Garantía',
    tagline: 'Cierre del ciclo con inspección técnica y certificado',
    description: 'Protocolo de supervisión de espesor de película seca (DFT), adherencia por cuadrícula y emisión de la póliza de garantía oficial Pintuco hasta por 7 años.',
    input: 'Pruebas de campo, fotos de acabado final y conformidad del cliente',
    action: 'Verificación de estándares NTC/ASTM y generación de documento de garantía oficial',
    output: 'Certificado de Garantía ColorLink Pintuco asociado al ID de Proyecto',
    metrics: ['Garantía hasta 7 años', 'Índice de reclamos: < 0.2%', '100% trazabilidad de lote'],
    color: 'from-rose-600 to-red-600'
  }
];
