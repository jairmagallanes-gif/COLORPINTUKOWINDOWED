import { PintucoProduct } from '../types';
import { CEDI_LOCATIONS } from '../data/pintucoCatalog';

type CediLocation = typeof CEDI_LOCATIONS[0];

export type StockFilterType = 'all' | 'existentes' | 'poco_stock' | 'agotados';

/**
 * Formats a number into standard Colombian Peso text without decimals
 */
const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val);
};

/**
 * Determines stock level label and category
 */
export const getStockStatus = (stock: number): {
  label: string;
  type: 'agotado' | 'critico' | 'normal' | 'optimo';
  color: string;
  badgeBg: string;
} => {
  if (stock <= 0) {
    return {
      label: 'AGOTADO',
      type: 'agotado',
      color: '#B91C1C', // Red-700
      badgeBg: '#FEE2E2' // Red-100
    };
  }
  if (stock <= 150) {
    return {
      label: 'POCO STOCK / CRÍTICO',
      type: 'critico',
      color: '#B45309', // Amber-700
      badgeBg: '#FEF3C7' // Amber-100
    };
  }
  if (stock > 500) {
    return {
      label: 'STOCK ÓPTIMO',
      type: 'optimo',
      color: '#047857', // Emerald-700
      badgeBg: '#D1FAE5' // Emerald-100
    };
  }
  return {
    label: 'STOCK NORMAL',
    type: 'normal',
    color: '#1E40AF', // Blue-800
    badgeBg: '#DBEAFE' // Blue-100
  };
};

/**
 * Triggers browser download of a generated blob
 */
const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

/**
 * Generates and downloads an Excel (.xls) or CSV file for a specific CEDI
 */
export const exportCediInventoryToExcel = (
  products: PintucoProduct[],
  cedi: CediLocation,
  options: {
    format?: 'xls' | 'csv';
    filterLabel?: string;
    includePricing?: boolean;
  } = {}
) => {
  const format = options.format || 'xls';
  const today = new Date().toISOString().split('T')[0];
  const filterSuffix = options.filterLabel ? `_${options.filterLabel.replace(/\s+/g, '_')}` : '';
  const cleanCity = cedi.city.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Inventario_Pintuco_${cleanCity}${filterSuffix}_${today}.${format}`;

  if (format === 'csv') {
    // UTF-8 CSV with semicolon delimiter (Excel Latin America standard)
    const headers = [
      'Código',
      'Producto Pintuco',
      'Línea Comercial',
      'Categoría',
      `Stock en CEDI ${cedi.city} (Galones)`,
      'Estado Nivel Inventario',
      'Rendimiento (m2/gal)',
      'Manos Sugeridas',
      'Nivel VOC',
      'Tiempo de Secado',
      'Precio Galón COP',
      'Precio Cuñete 5G COP',
      'Valor Inventario COP',
      'Lead Time (Horas)',
      'Ubicación CEDI'
    ];

    const rows = products.map((p) => {
      const stock = p.stockByCity[cedi.city] ?? 0;
      const status = getStockStatus(stock);
      const totalValue = stock * (p.pricePerGallonCOP || 0);

      return [
        `"${p.id}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.line.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        stock,
        `"${status.label}"`,
        p.coveragePerGallon,
        p.recommendedCoats,
        `"${p.voc}"`,
        `"${p.dryingTime.replace(/"/g, '""')}"`,
        p.pricePerGallonCOP,
        p.pricePerBucketCOP,
        totalValue,
        cedi.leadTimeHours,
        `"${cedi.name} - ${cedi.address.replace(/"/g, '""')}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
    return;
  }

  // HTML/XML Spreadsheet format (.xls) natively supported by MS Excel with corporate styling
  const totalGalones = products.reduce((sum, p) => sum + (p.stockByCity[cedi.city] ?? 0), 0);
  const totalValor = products.reduce((sum, p) => sum + ((p.stockByCity[cedi.city] ?? 0) * (p.pricePerGallonCOP || 0)), 0);
  const totalAgotados = products.filter((p) => (p.stockByCity[cedi.city] ?? 0) <= 0).length;
  const totalPocoStock = products.filter((p) => {
    const s = p.stockByCity[cedi.city] ?? 0;
    return s > 0 && s <= 150;
  }).length;
  const totalOptimo = products.filter((p) => (p.stockByCity[cedi.city] ?? 0) > 150).length;

  const tableRows = products.map((p, idx) => {
    const stock = p.stockByCity[cedi.city] ?? 0;
    const status = getStockStatus(stock);
    const totalVal = stock * (p.pricePerGallonCOP || 0);

    return `
      <tr style="height: 26px; background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="border: 1px solid #CBD5E1; text-align: center; font-family: monospace; font-size: 11px;">${p.id}</td>
        <td style="border: 1px solid #CBD5E1; font-weight: bold; font-size: 12px; color: #0F172A;">${p.name}</td>
        <td style="border: 1px solid #CBD5E1; font-size: 11px; color: #475569;">${p.line}</td>
        <td style="border: 1px solid #CBD5E1; font-size: 11px; text-transform: uppercase;">${p.category.replace(/_/g, ' ')}</td>
        <td style="border: 1px solid #CBD5E1; text-align: right; font-weight: bold; font-size: 13px; color: ${status.color}; background-color: ${status.badgeBg};">
          ${stock.toLocaleString('es-CO')}
        </td>
        <td style="border: 1px solid #CBD5E1; text-align: center; font-weight: bold; font-size: 10px; color: ${status.color}; background-color: ${status.badgeBg};">
          ${status.label}
        </td>
        <td style="border: 1px solid #CBD5E1; text-align: center; font-size: 11px;">${p.coveragePerGallon} m²/gal</td>
        <td style="border: 1px solid #CBD5E1; text-align: center; font-size: 11px;">${p.recommendedCoats}</td>
        <td style="border: 1px solid #CBD5E1; font-size: 11px;">${p.voc}</td>
        <td style="border: 1px solid #CBD5E1; font-size: 11px;">${p.dryingTime}</td>
        <td style="border: 1px solid #CBD5E1; text-align: right; font-size: 11px; font-weight: 500;">${formatCurrency(p.pricePerGallonCOP)}</td>
        <td style="border: 1px solid #CBD5E1; text-align: right; font-size: 11px; font-weight: 500;">${formatCurrency(p.pricePerBucketCOP)}</td>
        <td style="border: 1px solid #CBD5E1; text-align: right; font-size: 11px; font-weight: bold; color: #047857;">${formatCurrency(totalVal)}</td>
        <td style="border: 1px solid #CBD5E1; text-align: center; font-size: 11px;">${cedi.leadTimeHours} h</td>
      </tr>
    `;
  }).join('');

  const xlsContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <style>
        body { font-family: Calibri, Arial, sans-serif; }
        .header-title { font-size: 18px; font-weight: bold; color: #2E3192; }
        .header-sub { font-size: 12px; color: #475569; }
        .metric-card { font-size: 12px; padding: 6px; border: 1px solid #CBD5E1; background-color: #F1F5F9; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="14" style="background-color: #2E3192; color: #FFFFFF; font-size: 20px; font-weight: bold; padding: 12px 16px;">
            PINTUCO® • REPORTE OFICIAL DE INVENTARIO & DISPONIBILIDAD EN CEDI
          </td>
        </tr>
        <tr>
          <td colspan="14" style="background-color: #F8FAFC; color: #334155; font-size: 12px; padding: 8px;">
            <strong>Centro de Distribución:</strong> ${cedi.name} &nbsp;|&nbsp; 
            <strong>Ciudad:</strong> ${cedi.city} &nbsp;|&nbsp; 
            <strong>Dirección:</strong> ${cedi.address} &nbsp;|&nbsp; 
            <strong>Responsable:</strong> ${cedi.manager} (${cedi.contact})
          </td>
        </tr>
        <tr>
          <td colspan="14" style="background-color: #F8FAFC; color: #475569; font-size: 11px; padding: 4px 8px;">
            <strong>Fecha de Generación:</strong> ${new Date().toLocaleString('es-CO')} &nbsp;|&nbsp;
            <strong>Filtro Aplicado:</strong> ${options.filterLabel || 'Todos los Productos'} &nbsp;|&nbsp;
            <strong>Total Referencias Listadas:</strong> ${products.length} &nbsp;|&nbsp;
            <span style="color: #047857; font-weight: bold;">En Stock: ${totalOptimo}</span> &nbsp;|&nbsp;
            <span style="color: #B45309; font-weight: bold;">Poco Stock: ${totalPocoStock}</span> &nbsp;|&nbsp;
            <span style="color: #B91C1C; font-weight: bold;">Agotados: ${totalAgotados}</span>
          </td>
        </tr>
        <tr><td colspan="14" style="height: 12px;"></td></tr>
        
        <!-- Table Header -->
        <tr style="background-color: #1E293B; color: #FFFFFF; font-weight: bold; font-size: 11px; text-align: center; height: 32px;">
          <th style="border: 1px solid #475569; padding: 6px;">CÓDIGO REF</th>
          <th style="border: 1px solid #475569; padding: 6px;">PRODUCTO PINTUCO</th>
          <th style="border: 1px solid #475569; padding: 6px;">LÍNEA COMERCIAL</th>
          <th style="border: 1px solid #475569; padding: 6px;">CATEGORÍA</th>
          <th style="border: 1px solid #475569; padding: 6px; background-color: #0F766E;">STOCK GALONES</th>
          <th style="border: 1px solid #475569; padding: 6px;">ESTADO NIVEL</th>
          <th style="border: 1px solid #475569; padding: 6px;">RENDIMIENTO</th>
          <th style="border: 1px solid #475569; padding: 6px;">MANOS</th>
          <th style="border: 1px solid #475569; padding: 6px;">VOC</th>
          <th style="border: 1px solid #475569; padding: 6px;">SECADO</th>
          <th style="border: 1px solid #475569; padding: 6px;">PRECIO GALÓN</th>
          <th style="border: 1px solid #475569; padding: 6px;">PRECIO CUÑETE (5G)</th>
          <th style="border: 1px solid #475569; padding: 6px; background-color: #15803D;">VALOR INVENTARIO</th>
          <th style="border: 1px solid #475569; padding: 6px;">LEAD TIME</th>
        </tr>

        <!-- Table Body -->
        ${tableRows}

        <!-- Total Row -->
        <tr style="background-color: #E2E8F0; font-weight: bold; height: 30px; font-size: 12px;">
          <td colspan="4" style="border: 1px solid #CBD5E1; text-align: right; padding-right: 8px;">TOTALES CEDI ${cedi.city.toUpperCase()}:</td>
          <td style="border: 1px solid #CBD5E1; text-align: right; color: #047857; font-size: 14px;">
            ${totalGalones.toLocaleString('es-CO')} Gal
          </td>
          <td style="border: 1px solid #CBD5E1; text-align: center; font-size: 10px;">
            ${totalAgotados > 0 ? `${totalAgotados} Agotados` : '100% Disponible'}
          </td>
          <td colspan="6" style="border: 1px solid #CBD5E1;"></td>
          <td style="border: 1px solid #CBD5E1; text-align: right; color: #15803D; font-size: 14px;">
            ${formatCurrency(totalValor)}
          </td>
          <td style="border: 1px solid #CBD5E1; text-align: center;">${cedi.leadTimeHours}h prom</td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  triggerDownload(blob, filename);
};

/**
 * Generates and downloads a Consolidated National Matrix across all CEDIs in Colombia
 */
export const exportConsolidatedCedisToExcel = (
  products: PintucoProduct[],
  cedis: CediLocation[],
  options: { format?: 'xls' | 'csv' } = {}
) => {
  const format = options.format || 'xls';
  const today = new Date().toISOString().split('T')[0];
  const filename = `Inventario_Pintuco_Matriz_Nacional_CEDIs_${today}.${format}`;

  if (format === 'csv') {
    const cediCityHeaders = cedis.map((c) => `Stock ${c.city} (Gal)`);
    const headers = [
      'Código',
      'Producto Pintuco',
      'Línea Comercial',
      'Categoría',
      ...cediCityHeaders,
      'TOTAL NACIONAL (Galones)',
      'Precio Galón COP',
      'Precio Cuñete 5G COP',
      'Valorización Total Nacional COP'
    ];

    const rows = products.map((p) => {
      let nationalTotal = 0;
      const cediValues = cedis.map((c) => {
        const val = p.stockByCity[c.city] ?? 0;
        nationalTotal += val;
        return val;
      });
      const totalValor = nationalTotal * (p.pricePerGallonCOP || 0);

      return [
        `"${p.id}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.line.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        ...cediValues,
        nationalTotal,
        p.pricePerGallonCOP,
        p.pricePerBucketCOP,
        totalValor
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
    return;
  }

  // XML/HTML XLS Matrix format
  const tableRows = products.map((p, idx) => {
    let nationalGal = 0;
    const cediCells = cedis.map((c) => {
      const val = p.stockByCity[c.city] ?? 0;
      nationalGal += val;
      const status = getStockStatus(val);
      return `
        <td style="border: 1px solid #CBD5E1; text-align: right; font-weight: ${val === 0 ? 'bold' : 'normal'}; color: ${status.color}; background-color: ${val === 0 ? '#FEE2E2' : val <= 150 ? '#FEF3C7' : 'transparent'};">
          ${val.toLocaleString('es-CO')}
        </td>
      `;
    }).join('');

    const totalVal = nationalGal * (p.pricePerGallonCOP || 0);

    return `
      <tr style="height: 25px; background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="border: 1px solid #CBD5E1; text-align: center; font-family: monospace; font-size: 11px;">${p.id}</td>
        <td style="border: 1px solid #CBD5E1; font-weight: bold; font-size: 12px; color: #0F172A;">${p.name}</td>
        <td style="border: 1px solid #CBD5E1; font-size: 11px; color: #475569;">${p.line}</td>
        <td style="border: 1px solid #CBD5E1; font-size: 11px;">${p.category.replace(/_/g, ' ')}</td>
        ${cediCells}
        <td style="border: 1px solid #CBD5E1; text-align: right; font-weight: bold; font-size: 13px; color: #047857; background-color: #D1FAE5;">
          ${nationalGal.toLocaleString('es-CO')}
        </td>
        <td style="border: 1px solid #CBD5E1; text-align: right; font-size: 11px;">${formatCurrency(p.pricePerGallonCOP)}</td>
        <td style="border: 1px solid #CBD5E1; text-align: right; font-size: 11px; font-weight: bold; color: #15803D;">${formatCurrency(totalVal)}</td>
      </tr>
    `;
  }).join('');

  // Column totals
  const cediTotalCells = cedis.map((c) => {
    const colTotal = products.reduce((acc, p) => acc + (p.stockByCity[c.city] ?? 0), 0);
    return `
      <td style="border: 1px solid #CBD5E1; text-align: right; font-weight: bold; font-size: 13px; color: #0F766E;">
        ${colTotal.toLocaleString('es-CO')}
      </td>
    `;
  }).join('');

  const grandTotalNationalGal = products.reduce((acc, p) => {
    return acc + Object.values(p.stockByCity).reduce((cSum, val) => cSum + val, 0);
  }, 0);

  const grandTotalNationalValor = products.reduce((acc, p) => {
    const pTotalGal = Object.values(p.stockByCity).reduce((cSum, val) => cSum + val, 0);
    return acc + (pTotalGal * (p.pricePerGallonCOP || 0));
  }, 0);

  const xlsContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <style>
        body { font-family: Calibri, Arial, sans-serif; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${4 + cedis.length + 3}" style="background-color: #2E3192; color: #FFFFFF; font-size: 20px; font-weight: bold; padding: 12px 16px;">
            PINTUCO® • MATRIZ NACIONAL CONSOLIDADA DE INVENTARIOS POR CEDI
          </td>
        </tr>
        <tr>
          <td colspan="${4 + cedis.length + 3}" style="background-color: #F8FAFC; color: #475569; font-size: 11px; padding: 6px 12px;">
            Consolidado multi-regional en tiempo real para Medellín, Bogotá, Cali, Barranquilla, Bucaramanga y Cartagena. Generado el ${new Date().toLocaleString('es-CO')}.
          </td>
        </tr>
        <tr><td colspan="${4 + cedis.length + 3}" style="height: 10px;"></td></tr>

        <!-- Table Header -->
        <tr style="background-color: #1E293B; color: #FFFFFF; font-weight: bold; font-size: 11px; text-align: center; height: 32px;">
          <th style="border: 1px solid #475569; padding: 6px;">CÓDIGO</th>
          <th style="border: 1px solid #475569; padding: 6px;">PRODUCTO</th>
          <th style="border: 1px solid #475569; padding: 6px;">LÍNEA</th>
          <th style="border: 1px solid #475569; padding: 6px;">CATEGORÍA</th>
          ${cedis.map((c) => `<th style="border: 1px solid #475569; padding: 6px; background-color: #0369A1;">${c.city.toUpperCase()}</th>`).join('')}
          <th style="border: 1px solid #475569; padding: 6px; background-color: #0F766E;">TOTAL NACIONAL</th>
          <th style="border: 1px solid #475569; padding: 6px;">PRECIO GALÓN</th>
          <th style="border: 1px solid #475569; padding: 6px; background-color: #15803D;">VALOR TOTAL COP</th>
        </tr>

        <!-- Table Rows -->
        ${tableRows}

        <!-- Grand Total Row -->
        <tr style="background-color: #E2E8F0; font-weight: bold; height: 32px; font-size: 13px;">
          <td colspan="4" style="border: 1px solid #CBD5E1; text-align: right; padding-right: 8px;">TOTALES NACIONALES:</td>
          ${cediTotalCells}
          <td style="border: 1px solid #CBD5E1; text-align: right; color: #047857; font-size: 14px; background-color: #D1FAE5;">
            ${grandTotalNationalGal.toLocaleString('es-CO')} Gal
          </td>
          <td style="border: 1px solid #CBD5E1;"></td>
          <td style="border: 1px solid #CBD5E1; text-align: right; color: #15803D; font-size: 14px;">
            ${formatCurrency(grandTotalNationalValor)}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  triggerDownload(blob, filename);
};
