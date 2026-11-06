import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  PintucoProduct, 
  QuotationRecord, 
  QuoteItemBreakdown, 
  SurfaceType, 
  EnvironmentType, 
  SurfaceCondition, 
  UserProfile,
  ProjectRecord,
  RolePermissionsMatrix,
  DeliveryUrgency,
  ChannelSource
} from '../types';
import { PINTUCO_PRODUCTS, CEDI_LOCATIONS } from '../data/pintucoCatalog';
import { formatCOP } from '../utils/calculator';
import { checkUserPermission, isClientUser } from '../utils/rbac';
import { ALL_CHANNELS, getChannelMetadata, getDefaultChannelForUser } from '../utils/channelUtils';
import { getUrgencyConfig } from '../utils/urgencyUtils';
import { printElement, openInNewTabForPrint } from '../utils/printHelper';
import { 
  Calculator, 
  Paintbrush, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Printer, 
  Share2, 
  Download, 
  Sparkles, 
  Truck, 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight, 
  Percent, 
  AlertCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Check, 
  ExternalLink,
  ChevronRight,
  Receipt,
  HelpCircle,
  Award,
  Lock,
  PackageCheck,
  XCircle,
  X,
  Flame,
  Zap
} from 'lucide-react';

interface CotizadorViewProps {
  currentUser: UserProfile | null;
  permissionsMatrix?: RolePermissionsMatrix;
  onOpenAuth: () => void;
  onQuoteConvertedToProject?: (project: ProjectRecord) => void;
  onGoToProjects?: () => void;
}

// Popular architectural color swatches for Pintuco
const PINTUCO_COLORS = [
  { name: 'Blanco Lino Andino (1001-P)', hex: '#F4F2EC', family: 'Blancos & Neutros' },
  { name: 'Blanco Puro Hospitalario (1000-B)', hex: '#FFFFFF', family: 'Blancos & Neutros' },
  { name: 'Gris Calma Urbano (G-204)', hex: '#DFE2E6', family: 'Grises & Contemporáneos' },
  { name: 'Gris Basalto Profundo (G-408)', hex: '#5A626A', family: 'Grises & Contemporáneos' },
  { name: 'Marfil Clásico Colonial (M-102)', hex: '#F5EBD7', family: 'Cálidos & Terrosos' },
  { name: 'Terracota Barichara (T-501)', hex: '#B85D3E', family: 'Cálidos & Terrosos' },
  { name: 'Azul Niebla Andina (A-302)', hex: '#B2C6D6', family: 'Azules & Fríos' },
  { name: 'Verde Salvia Palma (V-405)', hex: '#A8BAA2', family: 'Naturales & Verdes' },
];

// Room wizard options
interface SpaceItem {
  id: string;
  name: string;
  width: number;
  height: number;
  length: number;
  doorsWindowsArea: number;
  calculatedWallArea: number;
}

export const CotizadorView: React.FC<CotizadorViewProps> = ({
  currentUser,
  permissionsMatrix,
  onOpenAuth,
  onQuoteConvertedToProject,
  onGoToProjects
}) => {
  const canGeneratePdf = checkUserPermission(currentUser, 'generar_cotizacion_pdf', permissionsMatrix);
  const canApproveQuotes = checkUserPermission(currentUser, 'aprobar_cotizaciones', permissionsMatrix);

  // Client Info State
  const [clientName, setClientName] = useState(currentUser?.name || '');
  const [clientEmail, setClientEmail] = useState(currentUser?.email || '');
  const [clientPhone, setClientPhone] = useState(currentUser?.phone || '');
  const [clientCompany, setClientCompany] = useState(currentUser?.companyOrOrg || '');
  const [clientDoc, setClientDoc] = useState(currentUser?.nitOrDoc || '');
  const [projectCity, setProjectCity] = useState(currentUser?.city || 'Medellín');
  const [projectAddress, setProjectAddress] = useState('');
  const [channel, setChannel] = useState<ChannelSource>(() => getDefaultChannelForUser(currentUser));

  // Update with current user if logged in
  useEffect(() => {
    if (currentUser) {
      if (!clientName) setClientName(currentUser.name);
      if (!clientEmail) setClientEmail(currentUser.email);
      if (!clientPhone && currentUser.phone) setClientPhone(currentUser.phone);
      if (!clientCompany && currentUser.companyOrOrg) setClientCompany(currentUser.companyOrOrg);
      if (!clientDoc && currentUser.nitOrDoc) setClientDoc(currentUser.nitOrDoc);
      if (currentUser.city) setProjectCity(currentUser.city);
      setChannel((prev) => prev || getDefaultChannelForUser(currentUser));
    }
  }, [currentUser]);

  // Project Specs State
  const [areaMode, setAreaMode] = useState<'direct' | 'wizard'>('direct');
  const [directAreaM2, setDirectAreaM2] = useState<number>(120);
  
  // Space Builder list
  const [spaces, setSpaces] = useState<SpaceItem[]>([
    { id: '1', name: 'Sala - Comedor', width: 5, length: 4, height: 2.5, doorsWindowsArea: 6, calculatedWallArea: 39 },
    { id: '2', name: 'Habitación Principal', width: 4, length: 3.5, height: 2.5, doorsWindowsArea: 4, calculatedWallArea: 33.5 },
  ]);

  const [surfaceType, setSurfaceType] = useState<SurfaceType>('mamposteria_concreto');
  const [environment, setEnvironment] = useState<EnvironmentType>('interior_seco');
  const [condition, setCondition] = useState<SurfaceCondition>('buen_estado');
  const [selectedColor, setSelectedColor] = useState(PINTUCO_COLORS[0]);
  const [customColorName, setCustomColorName] = useState('');

  // Product Line Selection
  const [productList, setProductList] = useState<PintucoProduct[]>(PINTUCO_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>('viniltex-bio');
  const [coats, setCoats] = useState<number>(2);

  // Delivery Urgency State
  const [deliveryUrgency, setDeliveryUrgency] = useState<DeliveryUrgency>(DeliveryUrgency.INMEDIATO_24_48H);

  // Preparation & Services Toggles
  const [includePrimer, setIncludePrimer] = useState<boolean>(false);
  const [includePutty, setIncludePutty] = useState<boolean>(false);
  const [includeAccessoriesKit, setIncludeAccessoriesKit] = useState<boolean>(true);
  const [includeLabor, setIncludeLabor] = useState<boolean>(true);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Status & Modal States
  const [isSaving, setIsSaving] = useState(false);
  const [currentQuoteResult, setCurrentQuoteResult] = useState<QuotationRecord | null>(null);
  const [showFormalQuoteModal, setShowFormalQuoteModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [savedQuotesList, setSavedQuotesList] = useState<QuotationRecord[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const formalQuotePrintRef = useRef<HTMLDivElement>(null);

  const handlePrintFormalQuote = () => {
    if (formalQuotePrintRef.current) {
      printElement(formalQuotePrintRef.current, {
        documentTitle: `Cotizacion_Pintuco_${currentQuoteResult?.id || 'ColorLink'}`
      });
    } else {
      window.print();
    }
  };

  const handleOpenQuoteInNewTab = () => {
    if (formalQuotePrintRef.current) {
      openInNewTabForPrint(
        formalQuotePrintRef.current,
        `Cotizacion_Pintuco_${currentQuoteResult?.id || 'ColorLink'}`
      );
    }
  };

  // Load quotes and products from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [quotesRes, productsRes] = await Promise.all([
          fetch('/api/quotes'),
          fetch('/api/products')
        ]);

        if (quotesRes.ok) {
          const json = await quotesRes.json();
          if (json.success && Array.isArray(json.data)) {
            setSavedQuotesList(json.data);
          }
        }

        if (productsRes.ok) {
          const jsonP = await productsRes.json();
          if (jsonP.success && Array.isArray(jsonP.data) && jsonP.data.length > 0) {
            setProductList(jsonP.data);
          }
        }
      } catch (err) {
        console.warn('Using local fallback data', err);
      }
    };
    loadData();
  }, []);

  // Calculate total area
  const totalAreaM2 = useMemo(() => {
    if (areaMode === 'direct') {
      return Math.max(1, Number(directAreaM2) || 1);
    }
    const sum = spaces.reduce((acc, space) => acc + space.calculatedWallArea, 0);
    return Math.max(1, Math.round(sum));
  }, [areaMode, directAreaM2, spaces]);

  // Auto-suggest product and preparation on environment/condition change
  useEffect(() => {
    if (environment === 'exterior_intemperie') {
      setSelectedProductId('koraza-5');
      setIncludePrimer(true);
    } else if (surfaceType === 'metal_ferroso' || surfaceType === 'metal_galvanizado') {
      setSelectedProductId('pintulux-3en1');
      setIncludePrimer(false);
    } else if (surfaceType === 'piso_industrial' || environment === 'industrial_agresivo') {
      setSelectedProductId('pintucoat-epoxico');
      setIncludePrimer(false);
    } else if (surfaceType === 'teja_fibrocemento') {
      setSelectedProductId('pintuco-fill-7');
    } else if (surfaceType === 'madera') {
      setSelectedProductId('maderpintuco-barniz');
    } else {
      setSelectedProductId('viniltex-bio');
    }

    if (condition === 'humedad_eflorescencia' || condition === 'nueva_sin_pintar') {
      setIncludePrimer(true);
    }
    if (condition === 'fisuras_grietas' || condition === 'descascaramiento_severo') {
      setIncludePutty(true);
    }
  }, [surfaceType, environment, condition]);

  // Handle ESC key to close open modals or drawers (formal quotes only close via button)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showRejectionModal) {
          setShowRejectionModal(false);
        } else if (showHistoryDrawer) {
          setShowHistoryDrawer(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRejectionModal, showHistoryDrawer]);

  // Selected product object
  const selectedProduct = useMemo(() => {
    return productList.find(p => p.id === selectedProductId) || productList[0] || PINTUCO_PRODUCTS[0];
  }, [selectedProductId, productList]);

  // Nearest CEDI based on selected city
  const nearestCedi = useMemo(() => {
    return CEDI_LOCATIONS.find(c => (c.city || '').toLowerCase() === (projectCity || '').toLowerCase()) || CEDI_LOCATIONS[0];
  }, [projectCity]);

  // Dynamic Item Breakdown Calculation
  const quoteCalculation = useMemo(() => {
    const area = totalAreaM2;
    const totalCoveredArea = area * coats;
    
    // Theoretical gallons needed + 10% safety buffer for porosity/cuts
    const rawGallons = (totalCoveredArea / selectedProduct.coveragePerGallon) * 1.10;
    const totalGallonsNeeded = Math.ceil(rawGallons);
    const cuñetesNeeded = Math.floor(totalGallonsNeeded / 5);
    const remainderGallons = totalGallonsNeeded % 5;

    const items: QuoteItemBreakdown[] = [];

    // 1. Primary Paint (Cuñetes 5G)
    if (cuñetesNeeded > 0) {
      items.push({
        id: 'item-cuñetes',
        category: 'pintura',
        name: `${selectedProduct.name} (Presentación Cuñete 5 Gal)`,
        presentation: 'Cuñete (5 Galones = 18.92 L)',
        quantity: cuñetesNeeded,
        unitPriceCOP: selectedProduct.pricePerBucketCOP,
        totalCOP: cuñetesNeeded * selectedProduct.pricePerBucketCOP
      });
    }

    // 2. Primary Paint (Single Gallons)
    if (remainderGallons > 0 || cuñetesNeeded === 0) {
      const qty = cuñetesNeeded === 0 ? Math.max(1, remainderGallons) : remainderGallons;
      items.push({
        id: 'item-galones',
        category: 'pintura',
        name: `${selectedProduct.name} (Presentación Galón)`,
        presentation: 'Galón (3.785 L)',
        quantity: qty,
        unitPriceCOP: selectedProduct.pricePerGallonCOP,
        totalCOP: qty * selectedProduct.pricePerGallonCOP
      });
    }

    // 3. Primer Sellomax 7 en 1 (if checked)
    let primerCost = 0;
    if (includePrimer) {
      const primerProd = PINTUCO_PRODUCTS.find(p => p.id === 'sellomax-7en1') || PINTUCO_PRODUCTS[4];
      const rawPrimerGal = Math.ceil((area / primerProd.coveragePerGallon) * 1.08);
      const primerBuckets = Math.floor(rawPrimerGal / 5);
      const primerRemainder = rawPrimerGal % 5;

      if (primerBuckets > 0) {
        const cost = primerBuckets * primerProd.pricePerBucketCOP;
        primerCost += cost;
        items.push({
          id: 'item-primer-bucket',
          category: 'preparacion',
          name: `${primerProd.name} (Cuñete 5 Gal)`,
          presentation: 'Cuñete (5 Gal)',
          quantity: primerBuckets,
          unitPriceCOP: primerProd.pricePerBucketCOP,
          totalCOP: cost
        });
      }

      if (primerRemainder > 0 || primerBuckets === 0) {
        const q = primerBuckets === 0 ? Math.max(1, primerRemainder) : primerRemainder;
        const cost = q * primerProd.pricePerGallonCOP;
        primerCost += cost;
        items.push({
          id: 'item-primer-gal',
          category: 'preparacion',
          name: `${primerProd.name} (Galón)`,
          presentation: 'Galón (3.785 L)',
          quantity: q,
          unitPriceCOP: primerProd.pricePerGallonCOP,
          totalCOP: cost
        });
      }
    }

    // 4. Masilla Acrílica (if checked)
    let puttyCost = 0;
    if (includePutty) {
      const puttyProd = PINTUCO_PRODUCTS.find(p => p.id === 'masilla-acrilica') || PINTUCO_PRODUCTS[5];
      const puttyGallons = Math.max(1, Math.ceil(area / 35));
      puttyCost = puttyGallons * puttyProd.pricePerGallonCOP;
      items.push({
        id: 'item-putty',
        category: 'preparacion',
        name: `${puttyProd.name} para resane y fisuras`,
        presentation: 'Galón listo para aplicar',
        quantity: puttyGallons,
        unitPriceCOP: puttyProd.pricePerGallonCOP,
        totalCOP: puttyCost
      });
    }

    // 5. Kit de Accesorios Profesionales (if checked)
    let accessoriesCost = 0;
    if (includeAccessoriesKit) {
      const kitsCount = Math.max(1, Math.ceil(area / 200));
      const unitKitPrice = 48500; // Rodillo felpa 3/8" + Bandeja + Brocha 2.5" + Cinta Azul + Plástico
      accessoriesCost = kitsCount * unitKitPrice;
      items.push({
        id: 'item-accessories',
        category: 'accesorio',
        name: 'Kit de Aplicación Profesional Pintuco® (Rodillo, Brocha, Cinta & Protección)',
        presentation: 'Kit Completo',
        quantity: kitsCount,
        unitPriceCOP: unitKitPrice,
        totalCOP: accessoriesCost
      });
    }

    // 6. Mano de Obra Certificada Pintuco (if checked)
    let laborCost = 0;
    let ratePerM2 = 7800; // Interior estándar
    if (environment === 'exterior_intemperie') {
      ratePerM2 = 12500; // Fachadas / Alturas / Andamiaje certificado
    } else if (surfaceType === 'piso_industrial') {
      ratePerM2 = 18000; // Tratamiento mecánico, desbaste y epóxico
    } else if (surfaceType === 'metal_ferroso') {
      ratePerM2 = 9500; // Desoxidado y esmalte anticorrosivo
    }

    if (includeLabor) {
      laborCost = Math.round(area * ratePerM2);
      items.push({
        id: 'item-labor',
        category: 'servicio',
        name: `Mano de Obra Certificada Pintuco® (${coats} Manos + Preparación + ARL)`,
        presentation: `${area} m² área intervenida`,
        quantity: area,
        unitPriceCOP: ratePerM2,
        totalCOP: laborCost
      });
    }

    // Calculations of Subtotals & Taxes
    const subtotalMaterials = items
      .filter(i => i.category !== 'servicio' && i.category !== 'logistica')
      .reduce((sum, i) => sum + i.totalCOP, 0);

    const subtotalServices = laborCost;
    const grossTotal = subtotalMaterials + subtotalServices;

    // Volume discount rule: >250 m² = 5%, >600 m² = 8%, or custom selector
    let effectiveDiscountPercent = discountPercent;
    if (discountPercent === 0) {
      if (area >= 600) effectiveDiscountPercent = 8;
      else if (area >= 250) effectiveDiscountPercent = 5;
    }

    const discountAmount = Math.round((grossTotal * effectiveDiscountPercent) / 100);
    const subtotalNet = grossTotal - discountAmount;
    const taxIva = Math.round(subtotalNet * 0.19);
    const finalTotal = subtotalNet + taxIva;

    // Warranty estimate
    let warrantyYears = 3;
    if (selectedProduct.id === 'koraza-5') warrantyYears = 5;
    if (selectedProduct.id === 'pintuco-fill-7') warrantyYears = 7;
    if (selectedProduct.id === 'pintucoat-epoxico') warrantyYears = 5;

    return {
      totalAreaM2: area,
      totalGallonsNeeded,
      cuñetesNeeded,
      remainderGallons,
      items,
      subtotalMaterials,
      subtotalServices,
      discountPercent: effectiveDiscountPercent,
      discountAmount,
      subtotalNet,
      taxIva,
      finalTotal,
      warrantyYears
    };
  }, [
    totalAreaM2,
    coats,
    selectedProduct,
    includePrimer,
    includePutty,
    includeAccessoriesKit,
    includeLabor,
    environment,
    surfaceType,
    discountPercent
  ]);

  // Add space handler
  const handleAddSpace = () => {
    const newId = String(Date.now());
    const newSpace: SpaceItem = {
      id: newId,
      name: `Espacio ${spaces.length + 1}`,
      width: 4,
      length: 3,
      height: 2.5,
      doorsWindowsArea: 3,
      calculatedWallArea: Math.round(((4 + 3) * 2 * 2.5) - 3)
    };
    setSpaces([...spaces, newSpace]);
  };

  const handleUpdateSpace = (id: string, field: keyof SpaceItem, value: any) => {
    setSpaces(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      const perimeter = (Number(updated.width || 0) + Number(updated.length || 0)) * 2;
      const grossWall = perimeter * Number(updated.height || 2.5);
      const netWall = Math.max(0, grossWall - Number(updated.doorsWindowsArea || 0));
      updated.calculatedWallArea = Math.round(netWall * 10) / 10;
      return updated;
    }));
  };

  const handleRemoveSpace = (id: string) => {
    if (spaces.length <= 1) return;
    setSpaces(spaces.filter(s => s.id !== id));
  };

  // Generate & Save Quotation
  const handleGenerateQuote = async (status: 'borrador' | 'enviada' = 'enviada') => {
    if (!clientName.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Por favor ingresa el nombre del cliente o solicitante.' });
      return;
    }

    setIsSaving(true);
    setFeedbackMessage(null);

    const quoteRecord: Partial<QuotationRecord> = {
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || 'cliente@pintuco.com',
      clientPhone: clientPhone.trim() || '+57 300 000 0000',
      clientCompany: clientCompany.trim(),
      clientDoc: clientDoc.trim(),
      projectCity,
      deliveryUrgency,
      surfaceType,
      environment,
      condition,
      areaM2: quoteCalculation.totalAreaM2,
      colorName: customColorName ? customColorName.trim() : selectedColor.name,
      colorHex: selectedColor.hex,
      selectedProductId: selectedProduct.id,
      selectedProductName: selectedProduct.name,
      coats,
      gallonsNeeded: quoteCalculation.totalGallonsNeeded,
      cuñetesNeeded: quoteCalculation.cuñetesNeeded,
      remainderGallons: quoteCalculation.remainderGallons,
      items: quoteCalculation.items,
      subtotalMaterialsCOP: quoteCalculation.subtotalMaterials,
      subtotalServicesCOP: quoteCalculation.subtotalServices,
      discountPercent: quoteCalculation.discountPercent,
      discountAmountCOP: quoteCalculation.discountAmount,
      subtotalNetCOP: quoteCalculation.subtotalNet,
      taxIvaCOP: quoteCalculation.taxIva,
      totalCOP: quoteCalculation.finalTotal,
      validUntil: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
      nearestCedi: nearestCedi.name,
      warrantyYears: quoteCalculation.warrantyYears,
      includeLabor,
      channel,
      channelLabel: getChannelMetadata(channel).label,
      status
    };

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteRecord)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setCurrentQuoteResult(json.data);
          setSavedQuotesList(prev => [json.data, ...prev]);
          setShowFormalQuoteModal(true);
          setFeedbackMessage({
            type: 'success',
            text: `¡Cotización ${json.data.id} generada y registrada con éxito en Pintuco!`
          });
        }
      } else {
        // Fallback local
        const localId = `COT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const localData = {
          ...quoteRecord,
          id: localId,
          createdAt: new Date().toISOString()
        } as QuotationRecord;
        setCurrentQuoteResult(localData);
        setSavedQuotesList(prev => [localData, ...prev]);
        setShowFormalQuoteModal(true);
      }
    } catch (e) {
      const localId = `COT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const localData = {
        ...quoteRecord,
        id: localId,
        createdAt: new Date().toISOString()
      } as QuotationRecord;
      setCurrentQuoteResult(localData);
      setSavedQuotesList(prev => [localData, ...prev]);
      setShowFormalQuoteModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Convert Quote into Project Record
  const handleConvertToProject = async (quote: QuotationRecord) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}/convert-to-project`, {
        method: 'POST'
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.project) {
          setFeedbackMessage({
            type: 'success',
            text: `¡Cotización convertida en el Proyecto ${json.project.id}! Stock reservado en ${json.project.assignedWarehouse.cediName}.`
          });
          
          if (onQuoteConvertedToProject) {
            onQuoteConvertedToProject(json.project);
          }
          
          setShowFormalQuoteModal(false);
          if (onGoToProjects) {
            setTimeout(() => onGoToProjects(), 1000);
          }
        }
      }
    } catch (err) {
      console.error('Error converting quote:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reject Quote (Ends process per business requirement)
  const handleRejectQuote = async (quote: QuotationRecord, reason: string) => {
    setIsSaving(true);
    try {
      // Update local state and quote record
      const updatedQuote = {
        ...quote,
        status: 'rechazada' as const
      };
      setCurrentQuoteResult(updatedQuote);
      setSavedQuotesList(prev => prev.map(q => q.id === quote.id ? updatedQuote : q));
      setShowRejectionModal(false);
      setFeedbackMessage({
        type: 'error',
        text: `La cotización ${quote.id} ha sido rechazada por el cliente. Motivo: "${reason}". El proceso finaliza aquí.`
      });
    } catch (err) {
      console.error('Error rejecting quote:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = (quote: QuotationRecord) => {
    const text = `🎨 *COTIZACIÓN FORMAL COLORLINK - PINTUCO®*\n` +
      `📄 *N° Documento:* ${quote.id}\n` +
      `👤 *Cliente:* ${quote.clientName}\n` +
      `📍 *Ciudad / CEDI:* ${quote.projectCity} (${quote.nearestCedi})\n` +
      `📐 *Área:* ${quote.areaM2} m² (${quote.coats} manos)\n` +
      `🛡️ *Producto:* ${quote.selectedProductName}\n` +
      `🎨 *Color:* ${quote.colorName}\n` +
      `👷 *Mano de Obra:* ${quote.includeLabor ? 'Certificada Pintuco Incluida' : 'Solo Materiales'}\n` +
      `💰 *Total Inversión (con IVA):* ${formatCOP(quote.totalCOP)}\n` +
      `⏳ *Validez:* Hasta ${quote.validUntil}\n` +
      `Garantía Pintuco: ${quote.warrantyYears} Años.`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30 mb-3">
              <Calculator className="w-3.5 h-3.5" />
              <span>Cotizador Oficial en Línea Pintuco®</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Calcula y Cotiza tu Proyecto de Pintura en Minutos
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Obtén el cálculo exacto de galones, cuñetes, materiales de preparación, fletes desde CEDI y mano de obra certificada con tarifas oficiales y garantía respaldada por Pintuco.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowHistoryDrawer(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Mis Cotizaciones ({savedQuotesList.length})</span>
            </button>
            
            {!currentUser && (
              <button
                onClick={onOpenAuth}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Identificarse / Registro</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in ${
          feedbackMessage.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-300 text-emerald-900' 
            : 'bg-red-50 border border-red-300 text-red-900'
        }`}>
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold flex-1">{feedbackMessage.text}</span>
          <button 
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Form Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Client & Location Identification */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-sm">
                  1
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Datos del Cliente y Ubicación</h3>
                  <p className="text-xs text-slate-500">Para membrete formal y asignación de CEDI logístico</p>
                </div>
              </div>
              {currentUser && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  ✓ Sesión Activa
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo o Razón Social *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Constructora Hábitat Andino"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIT / Cédula de Ciudadanía
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={clientDoc}
                    onChange={(e) => setClientDoc(e.target.value)}
                    placeholder="Ej. 900.842.115-4"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico de Contacto *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+57 312 849 2031"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ciudad del Proyecto & CEDI
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={projectCity}
                    onChange={(e) => setProjectCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                  >
                    <option value="Medellín">Medellín (CEDI Guarne)</option>
                    <option value="Bogotá">Bogotá D.C. (CEDI Fontibón)</option>
                    <option value="Cali">Cali (CEDI Yumbo)</option>
                    <option value="Barranquilla">Barranquilla (CEDI Soledad)</option>
                    <option value="Bucaramanga">Bucaramanga (CEDI Chimitá)</option>
                    <option value="Cartagena">Cartagena (CEDI Mamonal)</option>
                  </select>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 truncate">
                  Despacho: <strong>{nearestCedi.name}</strong>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Canal de Captura & Entrada *
                  </label>
                  {(() => {
                    const meta = getChannelMetadata(channel);
                    return (
                      <span className={`text-[10px] font-black px-2 py-0.2 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                        {meta.sourceCategory}
                      </span>
                    );
                  })()}
                </div>
                <div className="relative">
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as ChannelSource)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold text-slate-800"
                  >
                    {ALL_CHANNELS.map((ch) => (
                      <option key={ch.key} value={ch.key}>
                        {ch.label} ({ch.sourceCategory})
                      </option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const meta = getChannelMetadata(channel);
                  const IconComp = meta.icon;
                  return (
                    <div className="mt-1 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] flex items-center gap-1.5 text-slate-600">
                      <IconComp className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="truncate">{meta.description}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Delivery Urgency Question */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#FF6B35]" />
                  <span>¿En cuánto tiempo necesita los materiales en obra? *</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Esta información permite a la planta y CEDI coordinar los turnos de tinturación y despacho prioritario.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryUrgency(DeliveryUrgency.INMEDIATO_24_48H)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      deliveryUrgency === DeliveryUrgency.INMEDIATO_24_48H
                        ? 'border-red-500 bg-red-50/80 text-red-950 ring-2 ring-red-400 font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold flex items-center gap-1 text-red-700">
                        🚨 Inmediato
                      </span>
                      {deliveryUrgency === DeliveryUrgency.INMEDIATO_24_48H && (
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 leading-tight">24 a 48 horas (Prioridad Alta)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryUrgency(DeliveryUrgency.EXPRESS_3_5DIAS)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      deliveryUrgency === DeliveryUrgency.EXPRESS_3_5DIAS
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-400 font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-amber-800 mb-1 flex items-center gap-1">
                      ⚡ Rápido / Express
                    </span>
                    <span className="text-[11px] text-slate-600 leading-tight">3 a 5 días hábiles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryUrgency(DeliveryUrgency.ESTANDAR_1_2SEMANAS)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      deliveryUrgency === DeliveryUrgency.ESTANDAR_1_2SEMANAS
                        ? 'border-blue-500 bg-blue-50/80 text-blue-950 ring-2 ring-blue-400 font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-blue-800 mb-1 flex items-center gap-1">
                      📦 Estándar
                    </span>
                    <span className="text-[11px] text-slate-600 leading-tight">1 a 2 semanas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryUrgency(DeliveryUrgency.PROGRAMADO_ETAPAS)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      deliveryUrgency === DeliveryUrgency.PROGRAMADO_ETAPAS
                        ? 'border-purple-500 bg-purple-50/80 text-purple-950 ring-2 ring-purple-400 font-bold shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-purple-800 mb-1 flex items-center gap-1">
                      📅 Programada
                    </span>
                    <span className="text-[11px] text-slate-600 leading-tight">Por etapas de avance de obra</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Area & Space Dimensions */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cálculo de Área a Pintar</h3>
                  <p className="text-xs text-slate-500">Ingresa el metraje total o desglosa espacio por espacio</p>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAreaMode('direct')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    areaMode === 'direct' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Área Directa (m²)
                </button>
                <button
                  type="button"
                  onClick={() => setAreaMode('wizard')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    areaMode === 'wizard' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Por Espacios / Cuartos
                </button>
              </div>
            </div>

            {areaMode === 'direct' ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Área Total Superficial en Metros Cuadrados (m²) *
                    </label>
                    <p className="text-xs text-slate-500">
                      Suma el área neta de muros, techos o fachadas a intervenir.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="5"
                      max="20000"
                      step="5"
                      value={directAreaM2}
                      onChange={(e) => setDirectAreaM2(Number(e.target.value))}
                      className="w-32 px-3 py-2 text-center text-lg font-black text-blue-950 bg-white border-2 border-blue-600 rounded-xl outline-none"
                    />
                    <span className="font-bold text-slate-700 text-sm">m²</span>
                  </div>
                </div>

                {/* Preset Area Quick Buttons */}
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500">Preconfigurados:</span>
                  {[
                    { label: 'Apto Pequeño (65 m²)', val: 65 },
                    { label: 'Casa Familiar (150 m²)', val: 150 },
                    { label: 'Fachada Edificio (450 m²)', val: 450 },
                    { label: 'Bodega Industrial (1,200 m²)', val: 1200 }
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setDirectAreaM2(p.val)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        directAreaM2 === p.val
                          ? 'bg-blue-600 text-white border-blue-600 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Space Builder */
              <div className="space-y-3">
                <div className="space-y-2">
                  {spaces.map((space, idx) => (
                    <div key={space.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          {space.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {space.calculatedWallArea} m² netos
                          </span>
                          {spaces.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSpace(space.id)}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Ancho (m)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={space.width}
                            onChange={(e) => handleUpdateSpace(space.id, 'width', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Largo (m)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={space.length}
                            onChange={(e) => handleUpdateSpace(space.id, 'length', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Altura (m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={space.height}
                            onChange={(e) => handleUpdateSpace(space.id, 'height', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Puertas/Ventanas (m²)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={space.doorsWindowsArea}
                            onChange={(e) => handleUpdateSpace(space.id, 'doorsWindowsArea', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-center"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAddSpace}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Otro Espacio</span>
                  </button>

                  <div className="text-right">
                    <span className="text-xs text-slate-500">Área total acumulada: </span>
                    <strong className="text-base text-blue-900 font-extrabold">{totalAreaM2} m²</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Surface Type & Environment Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Superficie
                </label>
                <select
                  value={surfaceType}
                  onChange={(e) => setSurfaceType(e.target.value as SurfaceType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                >
                  <option value="mamposteria_concreto">Mampostería / Concreto</option>
                  <option value="drywall_yeso">Drywall / Yeso</option>
                  <option value="metal_ferroso">Estructura Metálica / Reja</option>
                  <option value="madera">Madera / Carpintería</option>
                  <option value="piso_industrial">Piso Concreto / Garaje</option>
                  <option value="teja_fibrocemento">Techo / Cubierta Fibrocemento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ambiente de Exposición
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as EnvironmentType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                >
                  <option value="interior_seco">Interior Seco (Habitaciones/Salas)</option>
                  <option value="interior_humedo">Interior Húmedo (Baños/Cocinas)</option>
                  <option value="exterior_intemperie">Exterior Intemperie (Fachadas/Balcones)</option>
                  <option value="industrial_agresivo">Industrial / Tráfico Pesado</option>
                  <option value="inmersion_humedad_extrema">Terrazas / Estanqueidad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado del Sustrato
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as SurfaceCondition)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                >
                  <option value="buen_estado">Buen Estado (Repinte Simple)</option>
                  <option value="nueva_sin_pintar">Superficie Nueva sin Pintar</option>
                  <option value="humedad_eflorescencia">Con Humedad / Salitre</option>
                  <option value="fisuras_grietas">Con Fisuras o Grietas</option>
                  <option value="descascaramiento_severo">Descascaramiento Severo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Select Pintuco Paint Line & Color */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-sm">
                  3
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Línea de Pintura Pintuco® & Color</h3>
                  <p className="text-xs text-slate-500">Selecciona el producto ideal y la tonalidad deseada</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Manos recomendadas:</span>
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                  {[2, 3].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoats(c)}
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition-all ${
                        coats === c ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
                      }`}
                    >
                      {c} Manos
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productList.filter(p => p.category === 'pintura_principal' || p.category === 'esmalte' || p.category === 'epoxico' || p.category === 'impermeabilizante').map((product) => {
                const isSelected = selectedProductId === product.id;
                return (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-extrabold text-slate-900 leading-tight">
                          {product.name}
                        </span>
                        {product.imageBadge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 whitespace-nowrap">
                            {product.imageBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Rendimiento:</span>
                        <span className="font-semibold text-slate-700">{product.coveragePerGallon} m²/gal</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Precio Cuñete (5G):</span>
                        <span className="font-bold text-blue-900">{formatCOP(product.pricePerBucketCOP)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Color Swatches Palette */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Selecciona la Tonalidad o Ingresa Código de Carta de Color Pintuco:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {PINTUCO_COLORS.map((color) => {
                  const isColorSelected = selectedColor.name === color.name && !customColorName;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        setCustomColorName('');
                      }}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                        isColorSelected
                          ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs shrink-0"
                        style={{ backgroundColor: color.hex }}
                      ></span>
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-900 truncate leading-tight">{color.name.split('(')[0]}</div>
                        <div className="text-[9px] text-slate-400 font-mono truncate">{color.name.match(/\((.*?)\)/)?.[1] || ''}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <input
                  type="text"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  placeholder="¿Deseas otro color? Ej. Azul Real Pintuco 2040-A o Código NCS/RAL"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Preparation & Services Toggles */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-sm">
                  4
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Preparación, Accesorios & Mano de Obra</h3>
                  <p className="text-xs text-slate-500">Complementos recomendados para máxima garantía</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Primer Sellomax */}
              <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                includePrimer ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={includePrimer}
                  onChange={(e) => setIncludePrimer(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Incluir Imprimante Sellomax® 7 en 1 Antihumedad
                    </span>
                    <span className="text-xs font-bold text-slate-700">Recomendado</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Bloquea salitre, neutraliza la alcalinidad del cemento y optimiza el rendimiento de la pintura en un 30%.
                  </p>
                </div>
              </label>

              {/* Masilla Acrilica */}
              <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                includePutty ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={includePutty}
                  onChange={(e) => setIncludePutty(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Incluir Masilla Acrílica Cero Fisuras Pintuco®
                    </span>
                    <span className="text-xs font-bold text-slate-700">Resanes</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Para calafateo de microfisuras, nivelación de juntas y corrección de imperfecciones superficiales.
                  </p>
                </div>
              </label>

              {/* Kit Accesorios */}
              <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                includeAccessoriesKit ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={includeAccessoriesKit}
                  onChange={(e) => setIncludeAccessoriesKit(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Kit de Herramientas & Protección Profesional
                    </span>
                    <span className="text-xs font-bold text-slate-700">$48.500 COP / Kit</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Incluye rodillo microfibra antigota, brocha de precisión, cinta azul de pintor y plástico protector de pisos y muebles.
                  </p>
                </div>
              </label>

              {/* Mano de Obra Certificada Pintuco */}
              <label className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                includeLabor ? 'border-indigo-600 bg-indigo-50/60 shadow-xs' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="checkbox"
                  checked={includeLabor}
                  onChange={(e) => setIncludeLabor(e.target.checked)}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-indigo-950">
                        Mano de Obra con Pintores Certificados Oro Pintuco®
                      </span>
                      <Award className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-xs font-extrabold text-indigo-900">
                      {formatCOP(quoteCalculation.subtotalServices)}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    Incluye preparación del sustrato, lijado, aplicación de {coats} manos uniformes, cobertura ARL, trabajo seguro en alturas y limpieza final.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Quotation Summary Box (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden">
            
            {/* Summary Top Header */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  Presupuesto en Tiempo Real
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-blue-950 text-[10px] font-black uppercase">
                  Validez 15 Días
                </span>
              </div>
              
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-blue-200">Inversión Total Estimada</div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {formatCOP(quoteCalculation.finalTotal)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-blue-200 block">Área Calculada:</span>
                  <span className="text-base font-extrabold text-amber-300">{quoteCalculation.totalAreaM2} m²</span>
                </div>
              </div>
            </div>

            {/* Packaging Summary Pill */}
            <div className="p-4 bg-blue-50/70 border-b border-blue-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Pintura Principal Requerida:</span>
                <span className="font-bold text-blue-950">
                  {quoteCalculation.totalGallonsNeeded} Galones ({quoteCalculation.cuñetesNeeded} Cuñetes 5G + {quoteCalculation.remainderGallons} Gal)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Garantía Certificada Pintuco: <strong className="text-slate-800">{quoteCalculation.warrantyYears} Años</strong>
              </div>
            </div>

            {/* Itemized List */}
            <div className="p-5 space-y-3 max-h-72 overflow-y-auto">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center justify-between">
                <span>Desglose de Ítems</span>
                <span className="text-slate-500 text-[11px] font-normal">{quoteCalculation.items.length} conceptos</span>
              </div>

              <div className="space-y-2 text-xs">
                {quoteCalculation.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.quantity} x {formatCOP(item.unitPriceCOP)} ({item.presentation})
                      </div>
                    </div>
                    <div className="font-bold text-slate-800 shrink-0">
                      {formatCOP(item.totalCOP)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Discounts Breakdown */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Materiales:</span>
                <span className="font-semibold">{formatCOP(quoteCalculation.subtotalMaterials)}</span>
              </div>

              {includeLabor && (
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Mano de Obra Certificada:</span>
                  <span className="font-semibold">{formatCOP(quoteCalculation.subtotalServices)}</span>
                </div>
              )}

              {quoteCalculation.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded-lg">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    Descuento por Volumen ({quoteCalculation.discountPercent}%):
                  </span>
                  <span>- {formatCOP(quoteCalculation.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Subtotal Neto:</span>
                <span className="font-semibold">{formatCOP(quoteCalculation.subtotalNet)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>IVA (19%):</span>
                <span className="font-semibold">{formatCOP(quoteCalculation.taxIva)}</span>
              </div>

              <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline text-slate-900 font-black text-sm sm:text-base">
                <span>TOTAL A PAGAR:</span>
                <span className="text-blue-900 text-lg sm:text-xl">{formatCOP(quoteCalculation.finalTotal)}</span>
              </div>
            </div>

            {/* CEDI Stock Validation Banner before generating quote */}
            <div className="p-4 bg-emerald-50/80 border-t border-emerald-200 flex items-center gap-3">
              <PackageCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold text-emerald-950 block">Validación de Stock en CEDI Pintuco</span>
                <span className="text-emerald-800">
                  {nearestCedi.name} cuenta con stock verificado para los <strong>{quoteCalculation.totalGallonsNeeded} galones</strong> y materiales seleccionados.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-5 bg-white border-t border-slate-200 space-y-2.5">
              <button
                type="button"
                id="btn-generar-cotizacion-formal"
                disabled={isSaving}
                onClick={() => handleGenerateQuote('enviada')}
                className="w-full py-3.5 px-4 bg-[#FF6B35] hover:bg-[#E85520] text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg hover:shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-orange-400/30"
              >
                {isSaving ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Calcular y Generar Cotización Formal (PDF)</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const tempQuote: QuotationRecord = {
                      id: `COT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                      createdAt: new Date().toISOString(),
                      clientName: clientName || 'Cliente Pintuco',
                      clientEmail: clientEmail || 'cliente@pintuco.com',
                      clientPhone: clientPhone || '+57 300 000 0000',
                      clientCompany,
                      clientDoc,
                      projectCity,
                      surfaceType,
                      environment,
                      condition,
                      areaM2: quoteCalculation.totalAreaM2,
                      colorName: customColorName || selectedColor.name,
                      colorHex: selectedColor.hex,
                      selectedProductId: selectedProduct.id,
                      selectedProductName: selectedProduct.name,
                      coats,
                      gallonsNeeded: quoteCalculation.totalGallonsNeeded,
                      cuñetesNeeded: quoteCalculation.cuñetesNeeded,
                      remainderGallons: quoteCalculation.remainderGallons,
                      items: quoteCalculation.items,
                      subtotalMaterialsCOP: quoteCalculation.subtotalMaterials,
                      subtotalServicesCOP: quoteCalculation.subtotalServices,
                      discountPercent: quoteCalculation.discountPercent,
                      discountAmountCOP: quoteCalculation.discountAmount,
                      subtotalNetCOP: quoteCalculation.subtotalNet,
                      taxIvaCOP: quoteCalculation.taxIva,
                      totalCOP: quoteCalculation.finalTotal,
                      validUntil: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
                      nearestCedi: nearestCedi.name,
                      warrantyYears: quoteCalculation.warrantyYears,
                      includeLabor,
                      status: 'enviada'
                    };
                    handleShareWhatsApp(tempQuote);
                  }}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Enviar WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleGenerateQuote('borrador');
                  }}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  <span>Guardar Borrador</span>
                </button>
              </div>
            </div>

          </div>

          {/* Guarantee & Certified Service Assurance Note */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold">Respaldo Pintuco® Colombia:</span> Los precios y rendimientos están calculados bajo especificaciones de fábrica de la NTC 811. Incluye certificación de lote y asistencia técnica de campo.
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* FORMAL PRINTABLE PDF-READY QUOTATION MODAL */}
      {/* ========================================================================= */}
      {showFormalQuoteModal && currentQuoteResult && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-2xl lg:max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200"
          >
            
            {/* Modal Action Bar */}
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between print:hidden shrink-0">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-xs sm:text-sm truncate">Cotización Formal Pintuco® • {currentQuoteResult.id}</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  id="btn-print-quote-modal"
                  onClick={handlePrintFormalQuote}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                  title="Imprimir documento o guardar como PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir / PDF</span>
                </button>

                <button
                  type="button"
                  id="btn-open-tab-quote-modal"
                  onClick={handleOpenQuoteInNewTab}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                  title="Abrir en pestaña completa para imprimir directamente"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                  <span className="hidden md:inline">Nueva Pestaña</span>
                </button>

                <button
                  type="button"
                  id="btn-whatsapp-quote-modal"
                  onClick={() => handleShareWhatsApp(currentQuoteResult)}
                  className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <button
                  type="button"
                  id="btn-close-quote-formal-modal"
                  onClick={() => setShowFormalQuoteModal(false)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-98 ml-1"
                  aria-label="Cerrar modal"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cerrar</span>
                </button>
              </div>
            </div>

            {/* Printable Document Body - Cleanly fitted to interface */}
            <div 
              ref={formalQuotePrintRef}
              id="pintuco-quote-printable-content"
              className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-5 text-slate-800 bg-white print:overflow-visible text-[13px]"
            >
              
              {/* Document Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-blue-900 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-800 to-indigo-900 text-white font-black flex items-center justify-center text-xl shadow-sm">
                    CL
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      PINTUCO S.A.
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      NIT: 890.900.120-1 • Autopista Medellín-Bogotá Km 24
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Canal Soluciones & Grandes Proyectos COLORLINK
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="inline-block px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-[10px] text-blue-800 font-bold block uppercase tracking-wider">
                      Radicado Cotización
                    </span>
                    <span className="text-base font-mono font-black text-blue-950 block">
                      {currentQuoteResult.id}
                    </span>
                    {(() => {
                      const chMeta = getChannelMetadata(currentQuoteResult.channel || 'web_portal');
                      const ChIcon = chMeta.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${chMeta.badgeBg} ${chMeta.badgeText} ${chMeta.badgeBorder}`}>
                          <ChIcon className="w-3 h-3" />
                          <span>Canal: {chMeta.shortLabel}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Fecha de Emisión: <strong>{new Date(currentQuoteResult.createdAt).toLocaleDateString('es-CO')}</strong>
                  </div>
                  <div className="text-[11px] text-red-600 font-semibold">
                    Válida hasta: <strong>{currentQuoteResult.validUntil}</strong> (15 días)
                  </div>
                </div>
              </div>

              {/* Client & Project Info Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide mb-1 text-[11px]">
                    Información del Cliente & Origen
                  </h4>
                  <p><strong className="text-slate-700">Nombre:</strong> {currentQuoteResult.clientName}</p>
                  {currentQuoteResult.clientCompany && (
                    <p><strong className="text-slate-700">Empresa:</strong> {currentQuoteResult.clientCompany}</p>
                  )}
                  {currentQuoteResult.clientDoc && (
                    <p><strong className="text-slate-700">NIT/Doc:</strong> {currentQuoteResult.clientDoc}</p>
                  )}
                  <p><strong className="text-slate-700">Contacto:</strong> {currentQuoteResult.clientEmail} • {currentQuoteResult.clientPhone}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <strong className="text-slate-700">Canal de Entrada:</strong>
                    {(() => {
                      const chMeta = getChannelMetadata(currentQuoteResult.channel || 'web_portal');
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] border ${chMeta.badgeBg} ${chMeta.badgeText} ${chMeta.badgeBorder}`}>
                          {chMeta.label} ({chMeta.sourceCategory})
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide mb-1 text-[11px]">
                    Especificaciones del Proyecto
                  </h4>
                  <p><strong className="text-slate-700">Ciudad / CEDI:</strong> {currentQuoteResult.projectCity} ({currentQuoteResult.nearestCedi})</p>
                  <p><strong className="text-slate-700">Área a Intervenir:</strong> {currentQuoteResult.areaM2} m² ({currentQuoteResult.coats} manos)</p>
                  <p><strong className="text-slate-700">Línea Pintuco:</strong> {currentQuoteResult.selectedProductName}</p>
                  <p><strong className="text-slate-700">Tonalidad:</strong> {currentQuoteResult.colorName}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <strong className="text-slate-700">Urgencia en Obra:</strong>
                    {(() => {
                      const urgConfig = getUrgencyConfig(deliveryUrgency);
                      const UrgIcon = urgConfig.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] border ${urgConfig.badgeBg} ${urgConfig.badgeText} ${urgConfig.badgeBorder}`}>
                          <UrgIcon className="w-3 h-3" />
                          {urgConfig.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Products & Services Breakdown Table */}
              <div>
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="p-2.5 rounded-tl-lg font-bold">Descripción del Ítem</th>
                      <th className="p-2.5 font-bold text-center">Presentación</th>
                      <th className="p-2.5 font-bold text-center">Cant.</th>
                      <th className="p-2.5 font-bold text-right">Vlr. Unitario</th>
                      <th className="p-2.5 rounded-tr-lg font-bold text-right">Total (COP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentQuoteResult.items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="p-2.5 font-medium text-slate-900">{item.name}</td>
                        <td className="p-2.5 text-center text-slate-600">{item.presentation}</td>
                        <td className="p-2.5 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="p-2.5 text-right text-slate-700">{formatCOP(item.unitPriceCOP)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatCOP(item.totalCOP)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
                <div className="text-[11px] text-slate-600 space-y-1 max-w-sm">
                  <p className="font-bold text-slate-800">Términos y Condiciones:</p>
                  <p>1. Precios en pesos colombianos (COP) e incluyen IVA (19%).</p>
                  <p>2. Entrega en obra o retiro en CEDI según disponibilidad.</p>
                  <p>3. Garantía Pintuco de {currentQuoteResult.warrantyYears} años sujeta a protocolo técnico de preparación y aplicación.</p>
                </div>

                <div className="w-full sm:w-72 space-y-1.5 text-xs p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Materiales:</span>
                    <span className="font-semibold">{formatCOP(currentQuoteResult.subtotalMaterialsCOP)}</span>
                  </div>

                  {currentQuoteResult.subtotalServicesCOP > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Mano de Obra Certificada:</span>
                      <span className="font-semibold">{formatCOP(currentQuoteResult.subtotalServicesCOP)}</span>
                    </div>
                  )}

                  {currentQuoteResult.discountAmountCOP > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Descuento ({currentQuoteResult.discountPercent}%):</span>
                      <span>- {formatCOP(currentQuoteResult.discountAmountCOP)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>IVA (19%):</span>
                    <span className="font-semibold">{formatCOP(currentQuoteResult.taxIvaCOP)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex justify-between font-extrabold text-sm text-blue-950">
                    <span>TOTAL COTIZACIÓN:</span>
                    <span>{formatCOP(currentQuoteResult.totalCOP)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions inside Modal */}
              <div className="pt-4 border-t border-slate-200 flex flex-col gap-3 print:hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    {isClientUser(currentUser) ? (
                      <span><strong className="text-slate-700">Decisión del Cliente:</strong> Aceptar formaliza la reserva de inventario y habilita la verificación de pago.</span>
                    ) : (
                      <span><strong className="text-slate-700">Aviso Comercial:</strong> La aceptación de la cotización es potestad exclusiva del cliente titular.</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setShowFormalQuoteModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl cursor-pointer"
                    >
                      Cerrar Vista Previa
                    </button>

                    {currentQuoteResult.status !== 'convertida_en_proyecto' && currentQuoteResult.status !== 'rechazada' && (
                      isClientUser(currentUser) ? (
                        <>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => setShowRejectionModal(true)}
                            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-300 flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span>Rechazar (Terminar Proceso)</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleConvertToProject(currentQuoteResult)}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Aceptar Cotización (Cliente)</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-bold text-xs flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Pendiente Aprobación por Cliente</span>
                        </div>
                      )
                    )}

                    {currentQuoteResult.status === 'convertida_en_proyecto' && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 text-blue-900 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-blue-700" />
                        <span>Proyecto Creado: {currentQuoteResult.convertedProjectId}</span>
                      </div>
                    )}

                    {currentQuoteResult.status === 'rechazada' && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-900 text-xs font-bold">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Cotización Rechazada (Proceso Finalizado)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && currentQuoteResult && (
        <div 
          onClick={() => setShowRejectionModal(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-200 space-y-4"
          >
            <div className="flex items-center justify-between text-red-700">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <h4 className="text-base font-extrabold">Rechazar Cotización {currentQuoteResult.id}</h4>
              </div>
              <button
                type="button"
                id="btn-close-rejection-modal-top"
                onClick={() => setShowRejectionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Al rechazar la cotización, <strong>el proceso termina aquí</strong> de acuerdo con las directrices de Pintuco. No se reservarán materiales ni se generará orden de despacho.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo del Rechazo *</label>
              <select
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none mb-2 bg-white"
              >
                <option value="">-- Seleccionar motivo --</option>
                <option value="Ajuste o falta de presupuesto">Ajuste o falta de presupuesto</option>
                <option value="Tiempos de entrega no se ajustan a la obra">Tiempos de entrega no se ajustan a la obra</option>
                <option value="Optó por otra solución o marca competidora">Optó por otra solución o marca competidora</option>
                <option value="Proyecto aplazado indefinidamente">Proyecto aplazado indefinidamente</option>
                <option value="Otro motivo comercial">Otro motivo comercial</option>
              </select>

              <textarea
                rows={2}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Detalla las observaciones del cliente..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                id="btn-cancel-rejection"
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-rejection"
                disabled={!rejectionReasonInput.trim()}
                onClick={() => handleRejectQuote(currentQuoteResult, rejectionReasonInput)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
              >
                Confirmar Rechazo y Terminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SAVED QUOTES HISTORY DRAWER */}
      {/* ========================================================================= */}
      {showHistoryDrawer && (
        <div 
          onClick={() => setShowHistoryDrawer(false)}
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-2xs animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-base">Historial de Cotizaciones</h3>
              </div>
              <button
                type="button"
                id="btn-close-history-drawer"
                onClick={() => setShowHistoryDrawer(false)}
                className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-white hover:bg-rose-600 rounded-lg transition-all cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            {savedQuotesList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No tienes cotizaciones guardadas aún.
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {savedQuotesList.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-900">{q.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        q.status === 'convertida_en_proyecto'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {q.status === 'convertida_en_proyecto' ? 'En Proyecto' : 'Activa'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-900 truncate">{q.clientName}</h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {q.areaM2} m² • {q.selectedProductName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <span className="font-black text-slate-900">{formatCOP(q.totalCOP)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentQuoteResult(q);
                          setShowFormalQuoteModal(true);
                          setShowHistoryDrawer(false);
                        }}
                        className="text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver Cotización</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
