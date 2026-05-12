export interface Servicio {
  id: number;
  name: string;
  category: string;
  price: number;
  hasSalonFee: boolean;
  salonFeePercent: number;
  isActive: boolean;
}

export interface CreateServicioRequest {
  name: string;
  category: string;
  price: number;
  hasSalonFee: boolean;
  salonFeePercent: number;
}

export interface Producto {
  id: number;
  name: string;
  brand: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  isForSale: boolean;
  isActive: boolean;
}

export interface CreateProductoRequest {
  name: string;
  brand: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  isForSale: boolean;
}
