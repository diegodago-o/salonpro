export interface Servicio {
  id: number;
  name: string;
  category: string;
  price: number;
  hasSalonFee: boolean;
  salonFeePercent: number;
  /** Porcentaje de participación del estilista para este servicio (0–100). */
  stylistCommissionPercent: number;
  isActive: boolean;
}

export interface CreateServicioRequest {
  name: string;
  category: string;
  price: number;
  hasSalonFee: boolean;
  salonFeePercent: number;
  stylistCommissionPercent: number;
}

export interface Producto {
  id: number;
  name: string;
  brand: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  /** Porcentaje de comisión del estilista sobre venta neta de este producto (0–100). Default: 10 */
  stylistCommissionPercent: number;
  stock: number;
  isForSale: boolean;
  isActive: boolean;
  barcode?: string | null;
}

export interface CreateProductoRequest {
  name: string;
  brand: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stylistCommissionPercent: number;
  stock: number;
  isForSale: boolean;
  barcode?: string | null;
}
