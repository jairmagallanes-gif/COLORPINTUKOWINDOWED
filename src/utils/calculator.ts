import { CapturedProjectForm, TechnicalSolution, PintucoProduct } from '../types';
import { PINTUCO_PRODUCTS } from '../data/pintucoCatalog';

export function calculatePintucoSolution(form: CapturedProjectForm): TechnicalSolution {
  const { technical, project } = form;
  const area = Math.max(1, project.areaM2 || 50);

  // 1. Determine primary coating product based on surface, environment and condition
  let primaryProduct: PintucoProduct;
  let primerProduct: PintucoProduct | null = null;
  let puttyProduct: PintucoProduct | null = null;
  let coats = 2;
  let warrantyYears = 3;

  if (technical.surface === 'metal_ferroso' || technical.surface === 'metal_galvanizado') {
    primaryProduct = PINTUCO_PRODUCTS.find(p => p.id === 'pintulux-3en1') || PINTUCO_PRODUCTS[2];
    warrantyYears = 4;
  } else if (technical.surface === 'piso_industrial' || technical.environment === 'industrial_agresivo') {
    primaryProduct = PINTUCO_PRODUCTS.find(p => p.id === 'pintucoat-epoxico') || PINTUCO_PRODUCTS[3];
    warrantyYears = 5;
  } else if (technical.surface === 'teja_fibrocemento' || technical.environment === 'inmersion_humedad_extrema') {
    primaryProduct = PINTUCO_PRODUCTS.find(p => p.id === 'pintuco-fill-7') || PINTUCO_PRODUCTS[6];
    coats = 3;
    warrantyYears = 7;
  } else if (technical.environment === 'exterior_intemperie') {
    primaryProduct = PINTUCO_PRODUCTS.find(p => p.id === 'koraza-5') || PINTUCO_PRODUCTS[1];
    warrantyYears = 5;
  } else {
    // Default interior (seco o húmedo)
    primaryProduct = PINTUCO_PRODUCTS.find(p => p.id === 'viniltex-bio') || PINTUCO_PRODUCTS[0];
    warrantyYears = 3;
  }

  // 2. Determine Primer need
  const needsPrimer =
    technical.condition === 'humedad_eflorescencia' ||
    technical.condition === 'nueva_sin_pintar' ||
    technical.condition === 'descascaramiento_severo' ||
    technical.surface === 'mamposteria_concreto';

  if (needsPrimer) {
    primerProduct = PINTUCO_PRODUCTS.find(p => p.id === 'sellomax-7en1') || null;
  }

  // 3. Determine Putty need
  const needsPutty =
    technical.condition === 'fisuras_grietas' ||
    technical.condition === 'descascaramiento_severo';

  if (needsPutty) {
    puttyProduct = PINTUCO_PRODUCTS.find(p => p.id === 'masilla-acrilica') || null;
  }

  // 4. Theoretical Gallon Calculations
  // Total area to cover = area * coats
  // Total gallons needed = Total area / coveragePerGallon
  // Add 10% safety margin for porosity & application loss
  const totalCoatArea = area * coats;
  const rawGallons = (totalCoatArea / primaryProduct.coveragePerGallon) * 1.10;
  const roundedGallons = Math.ceil(rawGallons);

  // Group into Cuñetes (5 Gal) + single gallons
  const buckets = Math.floor(roundedGallons / 5);
  const remainderGallons = roundedGallons % 5;

  // Primer calculations (1 coat if required)
  let gallonsPrimer = 0;
  if (primerProduct) {
    const rawPrimerGallons = (area / primerProduct.coveragePerGallon) * 1.08;
    gallonsPrimer = Math.ceil(rawPrimerGallons);
  }

  // Putty calculation (approx 0.15 kg / m² in treated zones)
  let kilosPutty = 0;
  if (puttyProduct) {
    kilosPutty = Math.ceil(area * 0.18);
  }

  // 5. Estimated Cost in COP
  const primaryCost = (buckets * primaryProduct.pricePerBucketCOP) + (remainderGallons * primaryProduct.pricePerGallonCOP);
  const primerCost = primerProduct ? gallonsPrimer * primerProduct.pricePerGallonCOP : 0;
  const puttyCost = puttyProduct ? Math.ceil(kilosPutty / 4) * puttyProduct.pricePerGallonCOP : 0;
  const totalCost = primaryCost + primerCost + puttyCost;

  // 6. Surface Preparation Protocols
  const prepSteps: string[] = [
    'Verificar que el sustrato tenga una humedad relativa inferior al 12% y pH entre 7 y 9.',
    'Limpiar a fondo grasas, polvillo, hollín y contaminantes orgánicos con agua y detergente neutro.'
  ];

  if (technical.condition === 'humedad_eflorescencia') {
    prepSteps.push('Raspar con espátula metálica toda la costra salina y moho. Aplicar solución de hipoclorito al 10%, dejar actuar 30 min y enjuagar.');
    prepSteps.push('Aplicar Sellomax® 7 en 1 puro a una mano para sellar poros capilares y bloquear alcalinidad.');
  }

  if (technical.condition === 'fisuras_grietas') {
    prepSteps.push('Abrir en "V" las fisuras mayores a 0.5 mm con cincel o espátula.');
    prepSteps.push('Rellenar y nivelar con Masilla Acrílica Profesional Pintuco®, dejando secar 2 horas antes del lijado fino (Lija #180).');
  }

  if (technical.condition === 'corrosion_oxido') {
    prepSteps.push('Desbastar óxido suelto con cepillo de cerdas metálicas o lija de esmeril #80 hasta lograr estándar SSPC-SP3.');
  }

  if (technical.condition === 'nueva_sin_pintar') {
    prepSteps.push('Garantizar 28 días mínimos de fraguado en mampostería fresca para evitar ampollamiento por vapor de agua.');
  }

  // 7. Application Guide
  const appSteps = [
    `Homogeneizar el producto ${primaryProduct.name} con espátula limpia durante 3 a 5 minutos.`,
    `Diluir según ficha técnica: máximo 10% a 15% con agua limpia para brocha/rodillo de felpa de 3/8".`,
    `Aplicar primera mano uniforme a favor de la luz natural; dejar secar ${primaryProduct.dryingTime}.`,
    `Aplicar segunda mano en sentido cruzado para garantizar cubrimiento total y espesor de película seca recomendado.`
  ];

  // 8. Quality Assurance Checklist
  const qualityChecklist = [
    'Prueba de adherencia por cuadrícula (Norma ASTM D3359 / NTC 811) clase 4B/5B.',
    'Medición de espesor de película seca (DFT) entre 3.0 y 4.5 mils.',
    'Control de tonalidad y poder cubriente bajo iluminante estándar D65.',
    'Certificado de emisión de compuestos orgánicos volátiles (VOC) controlado.'
  ];

  // 9. Environmental benefit summary
  const environmentalBenefit = primaryProduct.voc.includes('Bajo')
    ? 'Fórmula ecológica base agua con ultra-bajo VOC, segura para ocupación inmediata de espacios sin emisión de vapores nocivos.'
    : 'Formulación de alta durabilidad que extiende el ciclo de repinte, reduciendo la huella de carbono y el consumo de materias primas.';

  return {
    recommendedPrimaryProduct: primaryProduct,
    recommendedPrimer: primerProduct,
    recommendedPutty: puttyProduct,
    coatsRecommended: coats,
    gallonsPrimary: roundedGallons,
    bucketsPrimary: buckets,
    remainderGallonsPrimary: remainderGallons,
    gallonsPrimer,
    kilosPutty,
    estimatedMaterialCostCOP: totalCost,
    surfacePreparationSteps: prepSteps,
    applicationSteps: appSteps,
    qualityChecklist,
    aiTechnicalNotes: `Evaluación de compatibilidad completada para sustrato ${technical.surface.replace('_', ' ')} en ambiente ${technical.environment.replace('_', ' ')}. Sistema Pintuco calibrado para optimizar rendimiento y garantizar ${warrantyYears} años de durabilidad.`,
    warrantyYears,
    environmentalBenefit
  };
}

export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value);
}

export function generateProjectId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `COLORLINK-2026-${randomNum}`;
}
