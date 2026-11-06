import React, { useState, useEffect, useRef } from 'react';
import { PINTUCO_PRODUCTS, CEDI_LOCATIONS } from '../data/pintucoCatalog';
import { formatCOP } from '../utils/calculator';
import { PintucoProduct, UserProfile, RolePermissionsMatrix } from '../types';
import { checkUserPermission, normalizeUserRole } from '../utils/rbac';
import { 
  exportCediInventoryToExcel, 
  exportConsolidatedCedisToExcel, 
  getStockStatus,
  StockFilterType 
} from '../utils/excelExport';
import { 
  MapPin, 
  CheckCircle2, 
  PlusCircle, 
  Edit3, 
  Save, 
  X, 
  Layers, 
  Package, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  DollarSign, 
  Sliders, 
  Tag, 
  Check, 
  Boxes,
  Phone,
  Clock,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  PackageX,
  ChevronDown,
  FileText,
  Filter
} from 'lucide-react';

interface InventoryCediViewProps {
  currentUser?: UserProfile | null;
  permissionsMatrix?: RolePermissionsMatrix;
}

export const InventoryCediView: React.FC<InventoryCediViewProps> = ({
  currentUser,
  permissionsMatrix
}) => {
  const [selectedCediCity, setSelectedCediCity] = useState<string>('Medellín');
  const [products, setProducts] = useState<PintucoProduct[]>(PINTUCO_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockFilterType>('all');
  const [isExcelMenuOpen, setIsExcelMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const excelMenuRef = useRef<HTMLDivElement>(null);

  // Close excel dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (excelMenuRef.current && !excelMenuRef.current.contains(event.target as Node)) {
        setIsExcelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if current user has permission to manage inventory and add products
  const userRole = normalizeUserRole(currentUser?.role);
  const canManageInventory = 
    userRole === 'administrador' || 
    userRole === 'asesor' || 
    (currentUser && permissionsMatrix && checkUserPermission(currentUser, 'gestionar_inventario_productos', permissionsMatrix));

  // Edit stock inline modal / drawer state
  const [editingProduct, setEditingProduct] = useState<PintucoProduct | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);
  const [editPriceGalCOP, setEditPriceGalCOP] = useState<number>(0);
  const [editPriceBucketCOP, setEditPriceBucketCOP] = useState<number>(0);
  const [editCoverage, setEditCoverage] = useState<number>(0);
  const [editDryingTime, setEditDryingTime] = useState<string>('');
  const [editVoc, setEditVoc] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editImageBadge, setEditImageBadge] = useState<string>('');

  // New product modal state
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdLine, setNewProdLine] = useState('Línea Arquitectónica Especializada');
  const [newProdCategory, setNewProdCategory] = useState<'pintura_principal' | 'imprimante_sellador' | 'masilla_preparacion' | 'esmalte' | 'epoxico' | 'impermeabilizante'>('pintura_principal');
  const [newProdCoverage, setNewProdCoverage] = useState(38);
  const [newProdCoats, setNewProdCoats] = useState(2);
  const [newProdVoc, setNewProdVoc] = useState('< 15 g/L (Bajo VOC)');
  const [newProdDryingTime, setNewProdDryingTime] = useState('2 horas entre manos / 6 horas secado');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdFeatures, setNewProdFeatures] = useState('Alta durabilidad y cubrimiento; Resistencia al frote; Certificación Pintuco');
  const [newProdPriceGal, setNewProdPriceGal] = useState(98500);
  const [newProdPriceBucket, setNewProdPriceBucket] = useState(452000);
  const [newProdBadge, setNewProdBadge] = useState('Lanzamiento Pintuco');
  const [newProdInitialStock, setNewProdInitialStock] = useState<Record<string, number>>({
    'Medellín': 600,
    'Bogotá': 850,
    'Cali': 450,
    'Barranquilla': 500,
    'Bucaramanga': 280,
    'Cartagena': 320
  });

  const activeCedi = CEDI_LOCATIONS.find((c) => c.city === selectedCediCity) || CEDI_LOCATIONS[0];

  // Fetch updated products from backend if available
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setProducts(json.data);
        }
      }
    } catch (e) {
      console.warn('Could not load products from API, using catalog state:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  // Open Edit Product Drawer
  const handleOpenEditProduct = (prod: PintucoProduct) => {
    setEditingProduct(prod);
    setEditStockValue(prod.stockByCity[selectedCediCity] || 0);
    setEditPriceGalCOP(prod.pricePerGallonCOP || 0);
    setEditPriceBucketCOP(prod.pricePerBucketCOP || 0);
    setEditCoverage(prod.coveragePerGallon || 30);
    setEditDryingTime(prod.dryingTime || '');
    setEditVoc(prod.voc || '');
    setEditDescription(prod.description || '');
    setEditImageBadge(prod.imageBadge || '');
  };

  // Save stock / product edits
  const handleSaveProductEdit = async () => {
    if (!editingProduct) return;

    const updatedStockByCity = {
      ...editingProduct.stockByCity,
      [selectedCediCity]: Math.max(0, editStockValue)
    };

    const updatedProduct: PintucoProduct = {
      ...editingProduct,
      stockByCity: updatedStockByCity,
      pricePerGallonCOP: Math.max(1000, editPriceGalCOP),
      pricePerBucketCOP: Math.max(1000, editPriceBucketCOP),
      coveragePerGallon: Math.max(1, editCoverage),
      dryingTime: editDryingTime || editingProduct.dryingTime,
      voc: editVoc || editingProduct.voc,
      description: editDescription || editingProduct.description,
      imageBadge: editImageBadge || editingProduct.imageBadge
    };

    // Update local state immediately
    setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updatedProduct : p)));

    // Send API update
    try {
      await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });
      showToast('success', `¡Producto "${updatedProduct.name}" e inventario en ${selectedCediCity} actualizados con éxito!`);
    } catch (e) {
      showToast('success', `Inventario actualizado localmente para ${updatedProduct.name}`);
    }

    setEditingProduct(null);
  };

  // Create new product
  const handleCreateNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      showToast('error', 'El nombre del producto es obligatorio.');
      return;
    }

    const newProd: PintucoProduct = {
      id: `pintuco-${newProdName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newProdName.trim(),
      line: newProdLine.trim() || 'Línea Especializada Pintuco',
      category: newProdCategory,
      coveragePerGallon: Number(newProdCoverage) || 35,
      recommendedCoats: Number(newProdCoats) || 2,
      voc: newProdVoc || '< 20 g/L',
      dryingTime: newProdDryingTime || '2 horas entre manos',
      description: newProdDescription || 'Producto formulado con altos estándares de calidad y durabilidad Pintuco.',
      features: newProdFeatures.split(';').map(f => f.trim()).filter(Boolean),
      pricePerGallonCOP: Number(newProdPriceGal) || 95000,
      pricePerBucketCOP: Number(newProdPriceBucket) || 430000,
      imageBadge: newProdBadge || 'Nuevo',
      stockByCity: newProdInitialStock
    };

    setProducts((prev) => [newProd, ...prev]);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      if (res.ok) {
        showToast('success', `¡Producto "${newProd.name}" creado e incorporado a la red de CEDIs Pintuco!`);
      }
    } catch (e) {
      showToast('success', `¡Producto "${newProd.name}" creado con éxito en memoria!`);
    }

    // Reset form & close
    setIsNewProductModalOpen(false);
    setNewProdName('');
    setNewProdDescription('');
    setNewProdFeatures('Alta durabilidad y cubrimiento; Resistencia al frote; Certificación Pintuco');
  };

  // Dynamic stock metric counters for the currently selected CEDI
  const countAll = products.length;
  const countExistentes = products.filter((p) => (p.stockByCity[selectedCediCity] ?? 0) > 0).length;
  const countPocoStock = products.filter((p) => {
    const s = p.stockByCity[selectedCediCity] ?? 0;
    return s > 0 && s <= 150;
  }).length;
  const countAgotados = products.filter((p) => (p.stockByCity[selectedCediCity] ?? 0) <= 0).length;

  const totalStockInCedi = products.reduce((acc, p) => acc + (p.stockByCity[selectedCediCity] || 0), 0);
  const totalValorInventarioCedi = products.reduce((acc, p) => {
    const s = p.stockByCity[selectedCediCity] || 0;
    return acc + (s * (p.pricePerGallonCOP || 0));
  }, 0);

  // Filtered products list based on search, category and stock status filter
  const filteredProducts = products.filter((prod) => {
    const matchesSearch = 
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.line.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.imageBadge && prod.imageBadge.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || prod.category === categoryFilter;

    const stock = prod.stockByCity[selectedCediCity] ?? 0;
    let matchesStockStatus = true;
    if (stockStatusFilter === 'existentes') {
      matchesStockStatus = stock > 0;
    } else if (stockStatusFilter === 'poco_stock') {
      matchesStockStatus = stock > 0 && stock <= 150;
    } else if (stockStatusFilter === 'agotados') {
      matchesStockStatus = stock <= 0;
    }

    return matchesSearch && matchesCategory && matchesStockStatus;
  });

  // Handle Excel and CSV exports
  const handleExportCedi = (format: 'xls' | 'csv', exportOnlyFiltered: boolean = false) => {
    try {
      setIsExcelMenuOpen(false);
      const itemsToExport = exportOnlyFiltered ? filteredProducts : products;
      const filterLabel = exportOnlyFiltered && stockStatusFilter !== 'all'
        ? stockStatusFilter === 'existentes' 
          ? 'Existentes_En_Stock' 
          : stockStatusFilter === 'poco_stock' 
            ? 'Poco_Inventario_Critico' 
            : 'Agotados'
        : 'Todos';

      exportCediInventoryToExcel(itemsToExport, activeCedi, {
        format,
        filterLabel
      });

      showToast(
        'success',
        `¡Reporte Excel (${format.toUpperCase()}) descargado con éxito para CEDI ${activeCedi.city}!`
      );
    } catch (err) {
      showToast('error', 'Error al generar el archivo Excel.');
    }
  };

  const handleExportNational = (format: 'xls' | 'csv') => {
    try {
      setIsExcelMenuOpen(false);
      exportConsolidatedCedisToExcel(products, CEDI_LOCATIONS, { format });
      showToast(
        'success',
        `¡Matriz Nacional Consolidada (${format.toUpperCase()}) descargada con éxito para los 6 CEDIs!`
      );
    } catch (err) {
      showToast('error', 'Error al generar la Matriz Nacional.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-lg text-xs font-bold animate-in fade-in slide-in-from-top-3 ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Pilar 03 • Red de Abastecimiento & Centros de Distribución (CEDIs)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Gestión de Inventario & Disponibilidad en Tiempo Real
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Monitoreo y actualización de stock por CEDI regional en Colombia. Los <strong>Asesores Comerciales</strong> y el <strong>Administrador</strong> cuentan con autorización para ajustar inventarios y dar de alta nuevas líneas Pintuco.
            </p>
          </div>

          {/* Action button for Advisors and Admin */}
          {canManageInventory && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsNewProductModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Ingresar Nuevo Producto</span>
              </button>
            </div>
          )}
        </div>

        {/* CEDI Selector Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CEDI_LOCATIONS.map((cedi) => {
            const isSelected = cedi.city === selectedCediCity;
            return (
              <button
                key={cedi.id}
                onClick={() => setSelectedCediCity(cedi.city)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{cedi.city}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {cedi.leadTimeHours}h
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected CEDI Details Card */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-6 rounded-2xl border border-emerald-900/50 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Centro de Distribución Activo</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                {products.length} Líneas Homologadas
              </span>
            </div>
            <h3 className="text-xl font-black text-white">{activeCedi.name}</h3>
            <p className="text-xs text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{activeCedi.address}</span>
            </p>
          </div>

          <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-slate-400 block">Responsable CEDI</span>
            <span className="text-xs font-bold text-white block">{activeCedi.manager}</span>
            <span className="text-[11px] text-emerald-300 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {activeCedi.contact}
            </span>
          </div>

          <div className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 block">Existencias Totales CEDI</span>
              <span className="text-[10px] text-emerald-300 font-mono">Lead: {activeCedi.leadTimeHours}h</span>
            </div>
            <div className="text-base font-black text-emerald-400 flex items-center gap-1.5">
              <Boxes className="w-4 h-4" />
              <span>{new Intl.NumberFormat('es-CO').format(totalStockInCedi)} Gal</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center justify-between">
              <span>Valor inventario:</span>
              <strong className="text-emerald-300 font-mono">{formatCOP(totalValorInventarioCedi)}</strong>
            </div>
          </div>
        </div>

        {/* Quick Stock Filter Buttons & Excel Export Action Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Filter by Stock Level Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" /> Nivel de Stock:
            </span>

            <button
              onClick={() => setStockStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                stockStatusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white/10 text-slate-200 hover:bg-white/15'
              }`}
            >
              <span>Todos</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                stockStatusFilter === 'all' ? 'bg-slate-200 text-slate-800' : 'bg-white/20 text-white'
              }`}>
                {countAll}
              </span>
            </button>

            <button
              onClick={() => setStockStatusFilter('existentes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                stockStatusFilter === 'existentes'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 border border-emerald-500/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Existentes / En Stock</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                stockStatusFilter === 'existentes' ? 'bg-white text-emerald-900' : 'bg-emerald-400/20 text-emerald-200'
              }`}>
                {countExistentes}
              </span>
            </button>

            <button
              onClick={() => setStockStatusFilter('poco_stock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                stockStatusFilter === 'poco_stock'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Poco Nivel (&le;150 Gal)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                stockStatusFilter === 'poco_stock' ? 'bg-amber-950 text-amber-100' : 'bg-amber-400/20 text-amber-200'
              }`}>
                {countPocoStock}
              </span>
            </button>

            <button
              onClick={() => setStockStatusFilter('agotados')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                stockStatusFilter === 'agotados'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-500/30'
              }`}
            >
              <PackageX className="w-3.5 h-3.5 text-rose-300" />
              <span>Agotados (0 Gal)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                stockStatusFilter === 'agotados' ? 'bg-white text-rose-900' : 'bg-rose-400/20 text-rose-200'
              }`}>
                {countAgotados}
              </span>
            </button>
          </div>

          {/* Export to Excel Dropdown Menu */}
          <div className="relative shrink-0" ref={excelMenuRef}>
            <button
              onClick={() => setIsExcelMenuOpen(!isExcelMenuOpen)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm flex items-center justify-center gap-2 border border-emerald-400/30 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Exportar Excel CEDI</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExcelMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExcelMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 bg-slate-50 border-b border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Exportar Inventario CEDI {activeCedi.city}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Descarga con formatos corporativos, precios y stock en galones
                  </span>
                </div>

                <div className="p-2 space-y-1">
                  <button
                    onClick={() => handleExportCedi('xls', false)}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-extrabold">Excel Completo (.xls)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Todas las referencias del CEDI {activeCedi.city}</div>
                    </div>
                  </button>

                  {stockStatusFilter !== 'all' && (
                    <button
                      onClick={() => handleExportCedi('xls', true)}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-teal-600 shrink-0" />
                      <div>
                        <div className="font-extrabold">Exportar Según Filtro Actual</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          Solo {filteredProducts.length} productos ({stockStatusFilter === 'existentes' ? 'En Stock' : stockStatusFilter === 'poco_stock' ? 'Poco Stock' : 'Agotados'})
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => handleExportCedi('csv', false)}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-extrabold">Formato CSV (.csv)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Delimitado por punto y coma (UTF-8)</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={() => handleExportNational('xls')}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-900 hover:bg-indigo-50 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Boxes className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-extrabold">Matriz Nacional Consolidada</div>
                      <div className="text-[10px] text-slate-500 font-normal">Comparativa simultánea de los 6 CEDIs</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, código o línea..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {stockStatusFilter !== 'all' && (
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 ${
              stockStatusFilter === 'existentes'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : stockStatusFilter === 'poco_stock'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}>
              Filtro: {stockStatusFilter === 'existentes' ? 'En Stock' : stockStatusFilter === 'poco_stock' ? 'Poco Stock' : 'Agotados'}
              <button
                onClick={() => setStockStatusFilter('all')}
                className="ml-1 hover:text-slate-900 font-black cursor-pointer"
                title="Quitar filtro de nivel"
              >
                &times;
              </button>
            </span>
          )}

          <span className="text-xs font-bold text-slate-500 shrink-0">Categoría:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">Todas las Categorías ({products.length})</option>
            <option value="pintura_principal">Pintura Principal</option>
            <option value="imprimante_sellador">Imprimante / Sellador</option>
            <option value="masilla_preparacion">Masilla de Preparación</option>
            <option value="esmalte">Esmaltes & Anticorrosivos</option>
            <option value="epoxico">Epóxicos Industriales</option>
            <option value="impermeabilizante">Impermeabilizantes</option>
          </select>

          <button
            onClick={fetchProducts}
            title="Recargar inventario"
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Stock Table in Active CEDI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Catálogo y Disponibilidad de Líneas en CEDI {activeCedi.city}
            </h3>
            <p className="text-xs text-slate-500">
              {filteredProducts.length} productos listados para asignación automática por COLORLINK
            </p>
          </div>
          
          {canManageInventory && (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Modo Edición Habilitado ({userRole === 'administrador' ? 'Admin' : 'Asesor'})
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No se encontraron productos que coincidan con la búsqueda o categoría seleccionada.
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const stock = prod.stockByCity[selectedCediCity] !== undefined 
                ? prod.stockByCity[selectedCediCity] 
                : 350;
              const isDepleted = stock <= 0;
              const isLow = stock > 0 && stock <= 150;
              const isHigh = stock > 500;

              return (
                <div 
                  key={prod.id} 
                  className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                    isDepleted 
                      ? 'bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500' 
                      : isLow 
                        ? 'bg-amber-50/30 hover:bg-amber-50/60 border-l-4 border-l-amber-500' 
                        : 'hover:bg-slate-50/80 border-l-4 border-l-emerald-500/50'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{prod.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        {prod.line}
                      </span>
                      {prod.imageBadge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          {prod.imageBadge}
                        </span>
                      )}
                      {isDepleted && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-rose-600 text-white flex items-center gap-1 shadow-xs">
                          <PackageX className="w-3 h-3" /> AGOTADO EN CEDI
                        </span>
                      )}
                      {isLow && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-amber-500 text-slate-950 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> POCO NIVEL
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-600 max-w-2xl">{prod.description}</p>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                      <span>Rendimiento: <strong className="text-slate-800">{prod.coveragePerGallon} m²/gal</strong></span>
                      <span>Manos sugeridas: <strong className="text-slate-800">{prod.recommendedCoats}</strong></span>
                      <span>VOC: <strong className="text-emerald-700">{prod.voc}</strong></span>
                      <span>Secado: <strong className="text-slate-800">{prod.dryingTime}</strong></span>
                    </div>
                  </div>

                  {/* Pricing & Stock Details + Edit Button */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-6 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {formatCOP(prod.pricePerGallonCOP)} <span className="text-[10px] text-slate-500 font-normal">/ Galón</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Cuñete (5G): <strong className="text-slate-800">{formatCOP(prod.pricePerBucketCOP)}</strong>
                      </div>
                    </div>

                    <div className="text-right min-w-[120px]">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className={`text-lg font-mono font-black ${
                          isDepleted ? 'text-rose-600' : isLow ? 'text-amber-600' : isHigh ? 'text-emerald-700' : 'text-slate-900'
                        }`}>
                          {new Intl.NumberFormat('es-CO').format(stock)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Gal</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        isDepleted ? 'text-rose-600' : isLow ? 'text-amber-600' : isHigh ? 'text-emerald-600' : 'text-slate-600'
                      }`}>
                        {isDepleted ? (
                          <>
                            <PackageX className="w-3 h-3 text-rose-500" />
                            Agotado en CEDI
                          </>
                        ) : isLow ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            Poco Inventario
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            {isHigh ? 'Stock Óptimo' : 'En Stock'}
                          </>
                        )}
                      </span>
                    </div>

                    {/* Edit button for authorized roles */}
                    {canManageInventory && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditProduct(prod)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Ajustar inventario o precios"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Ajustar Stock</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: EDIT PRODUCT & STOCK QUANTITIES */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Ajustar Inventario & Parámetros Técnicos
                  </h3>
                  <span className="text-[11px] text-emerald-300">
                    {editingProduct.name} • CEDI {selectedCediCity}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* CEDI Stock Input */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-950 block">
                    Cantidad Disponible en CEDI {selectedCediCity} (Galones):
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Lote Certificado
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={editStockValue}
                    onChange={(e) => setEditStockValue(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm font-black font-mono border-2 border-emerald-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <span className="text-xs font-bold text-slate-600 shrink-0">Galones</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Equivale a aproximadamente <strong>{Math.floor(editStockValue / 5)}</strong> cuñetes de 5 galones y <strong>{editStockValue % 5}</strong> galones sueltos.
                </p>
              </div>

              {/* Pricing adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Precio por Galón (COP):
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={editPriceGalCOP}
                    onChange={(e) => setEditPriceGalCOP(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    Precio Cuñete 5G (COP):
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={editPriceBucketCOP}
                    onChange={(e) => setEditPriceBucketCOP(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Technical attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Rendimiento (m²/gal):</label>
                  <input
                    type="number"
                    min="1"
                    value={editCoverage}
                    onChange={(e) => setEditCoverage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Nivel VOC:</label>
                  <input
                    type="text"
                    value={editVoc}
                    onChange={(e) => setEditVoc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Badge / Etiqueta:</label>
                  <input
                    type="text"
                    value={editImageBadge}
                    onChange={(e) => setEditImageBadge(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Descripción Técnica:</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProductEdit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW PRODUCT */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Ingresar Nuevo Producto al Catálogo Pintuco®
                  </h3>
                  <span className="text-[11px] text-emerald-200">
                    Registro automático para Cotizador en Línea y Bodegas CEDI
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProduct} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    Nombre Comercial del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Viniltex® Anti-Hongos Extra"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    Línea / Familia Pintuco
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Línea Viniltex Arquitectónica"
                    value={newProdLine}
                    onChange={(e) => setNewProdLine(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Categoría Técnica</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="pintura_principal">Pintura Principal</option>
                    <option value="imprimante_sellador">Imprimante / Sellador</option>
                    <option value="masilla_preparacion">Masilla de Preparación</option>
                    <option value="esmalte">Esmalte / Anticorrosivo</option>
                    <option value="epoxico">Epóxico Industrial</option>
                    <option value="impermeabilizante">Impermeabilizante</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Precio / Galón (COP)</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={newProdPriceGal}
                    onChange={(e) => setNewProdPriceGal(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Precio Cuñete 5G (COP)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={newProdPriceBucket}
                    onChange={(e) => setNewProdPriceBucket(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Rendimiento (m²/gal)</label>
                  <input
                    type="number"
                    min="1"
                    value={newProdCoverage}
                    onChange={(e) => setNewProdCoverage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Manos Recomendadas</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newProdCoats}
                    onChange={(e) => setNewProdCoats(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Emisión VOC</label>
                  <input
                    type="text"
                    value={newProdVoc}
                    onChange={(e) => setNewProdVoc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Badge / Etiqueta</label>
                  <input
                    type="text"
                    value={newProdBadge}
                    onChange={(e) => setNewProdBadge(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Descripción Técnica</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Descripción detallada de beneficios, uso y tecnología..."
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Propiedades / Características Clave (separadas por punto y coma ;)
                </label>
                <input
                  type="text"
                  value={newProdFeatures}
                  onChange={(e) => setNewProdFeatures(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Initial stock in CEDIs */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">
                  Stock Inicial por CEDI Regional (Galones):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CEDI_LOCATIONS.map((cedi) => (
                    <div key={cedi.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-700">{cedi.city}:</span>
                      <input
                        type="number"
                        min="0"
                        value={newProdInitialStock[cedi.city] || 0}
                        onChange={(e) => setNewProdInitialStock({
                          ...newProdInitialStock,
                          [cedi.city]: Number(e.target.value)
                        })}
                        className="w-16 px-1.5 py-0.5 text-right font-mono font-bold text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 -mx-6 -mb-6 mt-4">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Crear & Publicar Producto</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
