import { api } from './api';

/** Standard paginated envelope returned by admin list endpoints. */
export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PageParams = { page?: number; limit?: number };

/** Append page/limit to a query string builder (only when set). */
function appendPage(params: URLSearchParams, page?: PageParams) {
  if (page?.page) params.set('page', String(page.page));
  if (page?.limit) params.set('limit', String(page.limit));
}

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  icon?: string | null;
};

export type AdminProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  originalPrice?: number | null;
  categoryId: string;
  stock: number;
  status: string;
  isBestSeller: boolean;
  isNew: boolean;
  price: number;
  spicyLevel?: number | null;
  createdAt: string;
};

export type AdminPromo = {
  id: string;
  code: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  voucherType: 'FREE_SHIPPING' | 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT';
  discountPercentage?: number | null;
  discountAmount?: number | null;
  maxDiscountAmount?: number | null;
  freeShippingMaxAmount?: number | null;
  minimumOrderAmount: number;
  maxUsageCount?: number | null;
  currentUsageCount: number;
  isNewUserOnly: boolean;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
};

export type AdminBanner = {
  id: string;
  title: string;
  description?: string | null;
  placement: string;
  imageUrl: string;
  href?: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  createdAt: string;
};

export type AdminDashboard = {
  ordersToday: number;
  totalOrders: number;
  totalUsers: number;
  pendingOrders: number;
  verifiedOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  activeProducts: number;
  lowStockProducts: number;
  totalVouchers: number;
  activeVouchers: number;
  expiredVouchers: number;
  totalRedemptions: number;
  topUsedVouchers: Array<{ voucherId: string; code: string; title: string; redemptions: number }>;
  ordersByStatus: Record<string, number>;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  paymentMethod: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    phone?: string | null;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    manualReceiptUrl?: string | null;
  } | null;
  shipment?: {
    id: string;
    provider: string;
    service: string;
    status: string;
    trackingNumber?: string | null;
  } | null;
};

export type AdminPayment = {
  id: string;
  status: string;
  amount: number;
  method: string;
  manualBankName?: string | null;
  manualAccountName?: string | null;
  manualReceiptUrl?: string | null;
  createdAt: string;
  order: AdminOrder;
};

export type AdminShipment = {
  id: string;
  provider: string;
  service: string;
  status: string;
  cost: number;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  order: AdminOrder & { address?: AdminAddress | null };
};

type AdminRegionRef = { id: string; code: string; name: string };

export type AdminAddress = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  notes?: string | null;
  addressDetail?: string | null;
  postalCode?: string | null;
  province?: AdminRegionRef | null;
  city?: (AdminRegionRef & { type: 'CITY' | 'REGENCY' }) | null;
  district?: AdminRegionRef | null;
  village?: (AdminRegionRef & { postalCode: string | null }) | null;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  isActive: boolean;
  roles: Array<{ role: { id: string; name: string } }>;
  createdAt: string;
};

export type AdminUserDetail = AdminUser & {
  addresses: AdminAddress[];
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalPrice: number;
    createdAt: string;
  }>;
};

export type AdminRole = {
  id: string;
  name: string;
  description?: string | null;
  permissions: Array<{ permission: { id: string; action: string; subject: string } }>;
};

export function fetchAdminUsers() {
  return api<AdminUser[]>('/admin/users');
}

export function fetchAdminUser(id: string) {
  return api<AdminUserDetail>(`/admin/users/${id}`);
}

export function updateAdminUser(id: string, input: Partial<{ isActive: boolean; roleIds: string[] }>) {
  return api<AdminUserDetail>(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function fetchAdminRoles() {
  return api<AdminRole[]>('/admin/roles');
}

export function fetchAdminRole(id: string) {
  return api<AdminRole>(`/admin/roles/${id}`);
}

export function createAdminRole(input: { name: string; description?: string; permissionIds?: string[] }) {
  return api<AdminRole>('/admin/roles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminRole(id: string, input: Partial<{ name: string; description?: string | null; permissionIds: string[] }>) {
  return api<AdminRole>(`/admin/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function fetchAdminPermissions() {
  return api<Array<{ id: string; action: string; subject: string }>>('/admin/permissions');
}

export function fetchAdminCategories() {
  return api<AdminCategory[]>('/admin/catalog/categories');
}

export function fetchAdminCategory(id: string) {
  return api<AdminCategory>(`/admin/catalog/categories/${id}`);
}

export function createAdminCategory(input: Partial<AdminCategory>) {
  return api<AdminCategory>('/admin/catalog/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminCategory(id: string, input: Partial<AdminCategory>) {
  return api<AdminCategory>(`/admin/catalog/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAdminCategory(id: string) {
  return api<void>(`/admin/catalog/categories/${id}`, {
    method: 'DELETE',
  });
}

export function fetchAdminProducts() {
  return api<AdminProduct[]>('/admin/catalog/products');
}

export function fetchAdminPromos() {
  return api<AdminPromo[]>('/admin/catalog/promos');
}

export function fetchAdminBanners() {
  return api<AdminBanner[]>('/admin/cms/banners');
}

export function fetchAdminBanner(id: string) {
  return api<AdminBanner>(`/admin/cms/banners/${id}`);
}

export function createAdminBanner(input: Partial<AdminBanner>) {
  return api<AdminBanner>('/admin/cms/banners', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminBanner(id: string, input: Partial<AdminBanner>) {
  return api<AdminBanner>(`/admin/cms/banners/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAdminBanner(id: string) {
  return api<void>(`/admin/cms/banners/${id}`, {
    method: 'DELETE',
  });
}

export function fetchAdminDashboard() {
  return api<AdminDashboard>('/admin/dashboard');
}

export function fetchAdminOrders(params: PageParams & { status?: string; paymentStatus?: string } = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.paymentStatus) q.set('paymentStatus', params.paymentStatus);
  appendPage(q, params);
  const query = q.toString();
  return api<Paginated<AdminOrder>>(`/admin/orders${query ? `?${query}` : ''}`);
}

export function fetchAdminPendingPayments() {
  return api<AdminPayment[]>('/admin/payments/pending-verification');
}

export function verifyAdminPayment(paymentId: string) {
  return api<AdminPayment>(`/admin/payments/${paymentId}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}

export function rejectAdminPayment(paymentId: string) {
  return api<AdminPayment>(`/admin/payments/${paymentId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}

export function fetchAdminShipments(params: PageParams & { status?: string } = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  appendPage(q, params);
  const query = q.toString();
  return api<Paginated<AdminShipment>>(`/admin/shipments${query ? `?${query}` : ''}`);
}

export type AdminOrderDetail = AdminOrder & {
  address?: AdminAddress | null;
  // Selected shipping-provider snapshot (read-only; no manual cost input).
  shippingProvider?: string | null;
  shippingService?: string | null;
  shippingServiceName?: string | null;
  shippingCost?: number | null;
  trackingNumber?: string | null;
  deliveryFee?: number | null;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    spicyLevel?: number | null;
    notes?: string | null;
    toppings: Array<{ id: string; name: string; price: number }>;
  }>;
  payment?: {
    id: string;
    status: string;
    amount: number;
    method: string;
    manualReceiptUrl?: string | null;
    transactions: Array<{ id: string; status: string; amount: number; createdAt: string }>;
  } | null;
  shipment?: {
    id: string;
    provider: string;
    service: string;
    status: string;
    cost: number;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    history?: Array<{ id: string; providerStatus: string; mappedStatus: string; changedAt: string }>;
  } | null;
  events: Array<{ id: string; status: string; note?: string | null; createdAt: string }>;
};

export function fetchAdminOrder(id: string) {
  return api<AdminOrderDetail>(`/admin/orders/${id}`);
}

export function updateAdminOrderStatus(id: string, status: string, note?: string) {
  return api<AdminOrderDetail>(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  });
}

export function fetchAdminProduct(id: string) {
  return api<AdminProduct>(`/admin/catalog/products/${id}`);
}

export function createAdminProduct(input: Partial<AdminProduct>) {
  return api<AdminProduct>('/admin/catalog/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminProduct(id: string, input: Partial<AdminProduct>) {
  return api<AdminProduct>(`/admin/catalog/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAdminProduct(id: string) {
  return api<void>(`/admin/catalog/products/${id}`, {
    method: 'DELETE',
  });
}

export function fetchAdminPromo(id: string) {
  return api<AdminPromo>(`/admin/catalog/promos/${id}`);
}

export function createAdminPromo(input: Partial<AdminPromo>) {
  return api<AdminPromo>('/admin/catalog/promos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminPromo(id: string, input: Partial<AdminPromo>) {
  return api<AdminPromo>(`/admin/catalog/promos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAdminPromo(id: string) {
  return api<void>(`/admin/catalog/promos/${id}`, {
    method: 'DELETE',
  });
}

export function fetchAdminShipment(id: string) {
  return api<AdminShipment>(`/admin/shipments/${id}`);
}

export type AdminShipmentCreateInput = {
  orderId: string;
  provider: string;
  service: string;
  cost: number;
  status?: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

export function createAdminShipment(input: AdminShipmentCreateInput) {
  return api<AdminShipment>('/admin/shipments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdminShipment(id: string, input: Partial<AdminShipmentCreateInput>) {
  return api<AdminShipment>(`/admin/shipments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteAdminShipment(id: string) {
  return api<void>(`/admin/shipments/${id}`, {
    method: 'DELETE',
  });
}

export type AdminPaymentAccount = {
  id: string;
  bankName: string;
  bankCode?: string | null;
  accountName: string;
  accountNumber: string;
  logoUrl?: string | null;
  notes?: string | null;
  isActive: boolean;
  isVisible: boolean;
  displayOrder: number;
  createdAt: string;
};

export type PaymentAccountInput = {
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  logoUrl?: string;
  notes?: string;
  isVisible?: boolean;
  displayOrder?: number;
};

export function fetchPaymentAccounts() {
  return api<AdminPaymentAccount[]>('/admin/payment-accounts');
}

export function fetchPaymentAccount(id: string) {
  return api<AdminPaymentAccount>(`/admin/payment-accounts/${id}`);
}

export function createPaymentAccount(input: PaymentAccountInput) {
  return api<AdminPaymentAccount>('/admin/payment-accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updatePaymentAccount(id: string, input: Partial<PaymentAccountInput>) {
  return api<AdminPaymentAccount>(`/admin/payment-accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function activatePaymentAccount(id: string) {
  return api<AdminPaymentAccount>(`/admin/payment-accounts/${id}/activate`, {
    method: 'PATCH',
  });
}

export function deletePaymentAccount(id: string) {
  return api<void>(`/admin/payment-accounts/${id}`, {
    method: 'DELETE',
  });
}

// ---------------- Delivery Coverage ----------------

export type CoverageType = 'DELIVERY' | 'PICKUP_ONLY' | 'DISABLED';

export type AdminDeliveryCoverage = {
  id: string;
  provinceId: string;
  cityId: string;
  districtId?: string | null;
  villageId?: string | null;
  coverageType: CoverageType;
  deliveryFee: number;
  minimumOrder: number;
  estimatedMinutes: number;
  isActive: boolean;
  createdAt: string;
  province?: { id: string; name: string } | null;
  city?: { id: string; name: string; type: 'CITY' | 'REGENCY' } | null;
  district?: { id: string; name: string } | null;
  village?: { id: string; name: string } | null;
};

export type DeliveryCoverageInput = {
  provinceId: string;
  cityId: string;
  districtId?: string | null;
  villageId?: string | null;
  coverageType: CoverageType;
  deliveryFee: number;
  minimumOrder: number;
  estimatedMinutes: number;
  isActive?: boolean;
};

export type DeliveryCoverageFilters = {
  search?: string;
  coverageType?: CoverageType | '';
  isActive?: 'true' | 'false' | '';
};

export function fetchDeliveryCoverages(filters: DeliveryCoverageFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.coverageType) params.set('coverageType', filters.coverageType);
  if (filters.isActive) params.set('isActive', filters.isActive);
  const query = params.toString();
  return api<AdminDeliveryCoverage[]>(`/admin/delivery-coverage${query ? `?${query}` : ''}`);
}

export function fetchDeliveryCoverage(id: string) {
  return api<AdminDeliveryCoverage>(`/admin/delivery-coverage/${id}`);
}

export function createDeliveryCoverage(input: DeliveryCoverageInput) {
  return api<AdminDeliveryCoverage>('/admin/delivery-coverage', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateDeliveryCoverage(id: string, input: Partial<DeliveryCoverageInput>) {
  return api<AdminDeliveryCoverage>(`/admin/delivery-coverage/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function setDeliveryCoverageActive(id: string, isActive: boolean) {
  return api<AdminDeliveryCoverage>(`/admin/delivery-coverage/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function deleteDeliveryCoverage(id: string) {
  return api<void>(`/admin/delivery-coverage/${id}`, {
    method: 'DELETE',
  });
}

// ---------------- Outlet configuration (shipping origin) ----------------

export type AdminOutlet = {
  id: string;
  name: string;
  addressDetail?: string | null;
  provinceId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  villageId?: string | null;
  postalCode?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  isActive: boolean;
  createdAt: string;
  province?: { id: string; name: string } | null;
  city?: { id: string; name: string; type: 'CITY' | 'REGENCY' } | null;
  district?: { id: string; name: string } | null;
  village?: { id: string; name: string } | null;
};

export type OutletInput = {
  name: string;
  addressDetail?: string;
  provinceId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  villageId?: string | null;
  postalCode: string;
  latitude: number;
  longitude: number;
};

export function fetchOutlets() {
  return api<AdminOutlet[]>('/admin/outlets');
}

export function fetchOutlet(id: string) {
  return api<AdminOutlet>(`/admin/outlets/${id}`);
}

export function createOutlet(input: OutletInput) {
  return api<AdminOutlet>('/admin/outlets', { method: 'POST', body: JSON.stringify(input) });
}

export function updateOutlet(id: string, input: Partial<OutletInput>) {
  return api<AdminOutlet>(`/admin/outlets/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function activateOutlet(id: string) {
  return api<AdminOutlet>(`/admin/outlets/${id}/activate`, { method: 'PATCH' });
}

export function deleteOutlet(id: string) {
  return api<void>(`/admin/outlets/${id}`, { method: 'DELETE' });
}

// ---------------- Shipment (fulfillment) ----------------

export type ShipmentRetryResult = {
  ok: boolean;
  status: string;
  trackingNumber?: string | null;
  error?: string;
};

/** Retry courier shipment creation for an order whose shipment is FAILED. */
export function retryShipment(orderId: string) {
  return api<ShipmentRetryResult>(`/admin/orders/${orderId}/shipment/retry`, { method: 'POST' });
}

// ---------------- Inventory reservations ----------------

export type ReservationStatus = 'RESERVED' | 'COMMITTED' | 'RELEASED' | 'EXPIRED' | 'CANCELLED';

export type AdminReservation = {
  id: string;
  orderId: string;
  productId: string;
  outletId?: string | null;
  reservedQty: number;
  committedQty: number;
  releasedQty: number;
  status: ReservationStatus;
  expiresAt?: string | null;
  createdAt: string;
  order?: { id: string; orderNumber: string; user?: { id: string; name: string; email: string } | null } | null;
  product?: { id: string; name: string } | null;
  outlet?: { id: string; name: string } | null;
};

export type AdminReservationDetail = AdminReservation & {
  history?: Array<{ id: string; status: ReservationStatus; note?: string | null; createdAt: string }>;
};

export type ReservationFilters = {
  status?: ReservationStatus | '';
  outletId?: string;
  expired?: 'true' | '';
  search?: string;
} & PageParams;

export function fetchReservations(filters: ReservationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.outletId) params.set('outletId', filters.outletId);
  if (filters.expired) params.set('expired', filters.expired);
  if (filters.search) params.set('search', filters.search);
  appendPage(params, filters);
  const query = params.toString();
  return api<Paginated<AdminReservation>>(`/admin/inventory-reservations${query ? `?${query}` : ''}`);
}

export function fetchReservation(id: string) {
  return api<AdminReservationDetail>(`/admin/inventory-reservations/${id}`);
}

// ---------------- Multi-outlet inventory & transfers ----------------

export type ProductInventoryRow = {
  id: string;
  productId: string;
  outletId: string;
  stock: number;
  reserved: number;
  available: number;
  product?: { id: string; name: string } | null;
  outlet?: { id: string; name: string } | null;
};

export type OutletInventoryReport = {
  outletId: string;
  outletName: string;
  stock: number;
  reserved: number;
  available: number;
  committed: number;
};

export type TransferStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export type StockTransferRow = {
  id: string;
  productId: string;
  quantity: number;
  status: TransferStatus;
  note?: string | null;
  createdAt: string;
  product?: { id: string; name: string } | null;
  fromOutlet?: { id: string; name: string } | null;
  toOutlet?: { id: string; name: string } | null;
  history?: Array<{ id: string; status: TransferStatus; note?: string | null; createdAt: string }>;
};

export function fetchProductInventory(params: { search?: string; outletId?: string } & PageParams = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  if (params.outletId) q.set('outletId', params.outletId);
  appendPage(q, params);
  const query = q.toString();
  return api<Paginated<ProductInventoryRow>>(`/admin/product-inventory${query ? `?${query}` : ''}`);
}

export function fetchInventoryReport() {
  return api<OutletInventoryReport[]>('/admin/inventory-report');
}

export function adjustStock(input: { productId: string; outletId: string; stock: number; note?: string }) {
  return api<ProductInventoryRow>('/admin/product-inventory/adjust', { method: 'POST', body: JSON.stringify(input) });
}

export function fetchTransfers(params: { status?: TransferStatus } & PageParams = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  appendPage(q, params);
  const query = q.toString();
  return api<Paginated<StockTransferRow>>(`/admin/stock-transfers${query ? `?${query}` : ''}`);
}

export function fetchTransfer(id: string) {
  return api<StockTransferRow>(`/admin/stock-transfers/${id}`);
}

export function requestTransfer(input: { productId: string; fromOutletId: string; toOutletId: string; quantity: number; note?: string }) {
  return api<StockTransferRow>('/admin/stock-transfers', { method: 'POST', body: JSON.stringify(input) });
}

export function approveTransfer(id: string) {
  return api<StockTransferRow>(`/admin/stock-transfers/${id}/approve`, { method: 'PATCH' });
}

export function completeTransfer(id: string) {
  return api<StockTransferRow>(`/admin/stock-transfers/${id}/complete`, { method: 'PATCH' });
}
