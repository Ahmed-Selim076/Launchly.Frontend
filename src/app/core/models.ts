/**
 * Core models for Launchly frontend.
 * Mirrors the backend DTOs and enums exactly.
 * Single source of truth — import from here, never redefine elsewhere.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Matches backend StoreType enum ordinals.
 * - /store/settings returns storeType as a STRING ("Ecommerce") — map to this enum on receipt.
 * - /templates?storeType= and RegisterRequest take the INT value (0, 1, 2).
 * Conversion happens once in TenantService; everywhere else in the app uses this enum.
 */
export enum StoreType {
  Ecommerce  = 0,
  Booking    = 1,
  Restaurant = 2,
}

/** Map from backend string name → StoreType int. Used only in TenantService. */
export const STORE_TYPE_FROM_STRING: Readonly<Record<string, StoreType>> = {
  Ecommerce:  StoreType.Ecommerce,
  Booking:    StoreType.Booking,
  Restaurant: StoreType.Restaurant,
};

export enum UserRole {
  SuperAdmin  = 'SuperAdmin',
  TenantAdmin = 'TenantAdmin',
  Customer    = 'Customer',
}

export enum OrderStatus {
  Pending   = 'Pending',
  Confirmed = 'Confirmed',
  Shipped   = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
}

export enum FoodOrderStatus {
  Received  = 'Received',
  Preparing = 'Preparing',
  Ready     = 'Ready',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
}

export enum AppointmentStatus {
  Pending   = 'Pending',
  Confirmed = 'Confirmed',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  // Only populated on the /auth/login and /auth/register responses (backend
  // includes the Tenant nav property there). Not present in the JWT itself,
  // so it comes back null after a page refresh — that's fine, it's only
  // needed for the one post-login redirect decision.
  tenantSubdomain: string | null;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export interface IRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  storeName: string;
  subdomain: string;
  storeType: number;   // int — StoreType enum ordinal
  templateId: number;  // 1, 2, or 3
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IGoogleAuthRequest {
  idToken: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface IVerifyEmailRequest {
  token: string;
}

// ─── Tenant / Store Settings ──────────────────────────────────────────────────

/**
 * Returned by GET /api/v1/store/settings (public).
 * storeType comes as a STRING from the API — TenantService maps it to StoreType enum.
 */
export interface IPublicStoreSettingsRaw {
  storeName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  heroText: string | null;
  aboutText: string | null;
  googleAnalyticsId: string | null;
  storeType: string;   // "Ecommerce" | "Booking" | "Restaurant"
  templateId: number;  // 1 | 2 | 3
  contactPhone: string | null;
  whatsappNumber: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
}

/** After TenantService maps storeType string → enum. Used everywhere in the app. */
export interface ITenant {
  storeName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  heroText: string | null;
  aboutText: string | null;
  googleAnalyticsId: string | null;
  storeType: StoreType;  // resolved enum — never a string past TenantService
  templateId: number;
  contactPhone: string | null;
  whatsappNumber: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
}

// ─── Templates ────────────────────────────────────────────────────────────────

/** Returned by GET /api/v1/templates?storeType=0 */
export interface ITemplateOption {
  templateId: number;
  name: string;
  thumbnailUrl: string;
}

// ─── API Response wrapper ─────────────────────────────────────────────────────

/** All Launchly API responses use this wrapper */
export interface IApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  errors: Record<string, string[]> | null;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface IProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IPublicProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  categoryName: string | null;
  originalPrice: number | null;
  badge: string | null;
  averageRating: number;
  reviewCount: number;
  /** null when the request was unauthenticated (unknown, not "false") */
  isWishlisted: boolean | null;
}

// ─── Wishlist ───────────────────────────────────────────────────────────────

export interface IWishlistItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  stock: number;
  addedAt: string;
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export interface IReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface IReviewSummary {
  averageRating: number;
  reviewCount: number;
  items: IReview[];
}

export interface ICreateReviewRequest {
  rating: number;
  comment?: string | null;
}

export interface IContactMessageRequest {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}

export interface IPagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface IOrderItem {
  id: string;
  productId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface IOrder {
  id: string;
  customerId: string;
  customerName: string;
  status: string;
  orderType: string | null;
  totalAmount: number;
  notes: string | null;
  items: IOrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface ICategory {
  id: string;
  name: string;
  sortOrder: number;
  /** Present on both the admin CategoryDto and the public StoreController
   *  response; optional here only so older call sites that don't need it
   *  aren't forced to supply it. */
  productCount?: number;
}

// ─── Settings (Admin) ─────────────────────────────────────────────────────────

export interface ISettings {
  tenantId: string;
  storeName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  heroText: string | null;
  aboutText: string | null;
  googleAnalyticsId: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
}

export interface IUpdateSettingsRequest {
  storeName: string;
  primaryColor: string;
  secondaryColor: string;
  heroText: string | null;
  aboutText: string | null;
  googleAnalyticsId: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface IService {
  id: string;
  name: string;
  description: string | null;
  durationMins: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  imageUrl: string | null;
}

export interface IAvailableSlot {
  startTime: string;
  endTime: string;
}

export interface IAppointment {
  id: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

// ─── Restaurant ───────────────────────────────────────────────────────────────

export interface IMenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  itemCount: number;
}

export interface IMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface IFoodOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  notes: string | null;
  totalAmount: number;
  items: IFoodOrderItem[];
  createdAt: string;
}

export interface IFoodOrderItem {
  id: string;
  menuItemId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * Dashboard summary — same endpoint serves all 3 StoreTypes, branched
 * server-side in DashboardService. Field *names* stay generic on purpose:
 * - totalOrders / pendingOrders: Ecommerce & Restaurant → Orders count,
 *   Booking → Appointments count (same field, different source table).
 * - totalCatalogItems: Ecommerce → active Products, Booking → active
 *   Services, Restaurant → active MenuItems.
 * - topCatalogItems: top 5 sellers from whichever of the above applies.
 * Always read the tenant's storeType (TenantService.currentTenant) to know
 * which label/meaning applies — don't assume "orders" means literal orders.
 */
export interface IDashboard {
  totalOrders: number;
  totalRevenue: number;
  totalCatalogItems: number;
  totalCustomers: number;
  pendingOrders: number;
  topCatalogItems: ITopCatalogItem[];
}

export interface ITopCatalogItem {
  itemId: string;
  itemName: string;
  totalSold: number;
  totalRevenue: number;
}

/** Backs the dedicated /analytics/top-products endpoint — Ecommerce-only, NOT used by the Dashboard. */
export interface ITopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface ISalesChart {
  points: ISalesDataPoint[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface ISalesDataPoint {
  label: string;
  revenue: number;
  orderCount: number;
}

/**
 * Onboarding checklist — 4 steps, branched per StoreType server-side
 * (OnboardingService): email_verified + logo_uploaded are universal, the
 * other two steps' keys/labels change per StoreType (e.g. "product_created"
 * for Ecommerce vs "service_created" for Booking) but there are always
 * exactly 4 steps. Don't hardcode step keys/labels in the frontend — render
 * whatever `steps` contains.
 */
export interface IOnboardingStatus {
  steps: IOnboardingStep[];
  completedCount: number;
  totalCount: number;
  isFullyComplete: boolean;
}

export interface IOnboardingStep {
  key: string;
  label: string;
  isComplete: boolean;
}

export interface IVisitorStats {
  todayUniqueVisitors: number;
  weeklyUniqueVisitors: number;
  monthlyUniqueVisitors: number;
  dailyPoints: IVisitorDataPoint[];
}

export interface IVisitorDataPoint {
  date: string;
  uniqueVisitors: number;
}

// ─── Super Admin ──────────────────────────────────────────────────────────────

export interface ITenantListItem {
  id: string;
  name: string;
  subdomain: string;
  storeType: string;
  planType: string;
  isActive: boolean;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
}

export interface ITenantDetail {
  id: string;
  name: string;
  subdomain: string;
  storeType: string;
  planType: string;
  isActive: boolean;
  logoUrl: string | null;
  storeName: string | null;
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
}

export interface IPlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  newTenantsThisMonth: number;
  planBreakdown: IPlanBreakdown[];
  storeTypeBreakdown: IStoreTypeBreakdown[];
}

export interface IPlanBreakdown {
  plan: string;
  count: number;
}

export interface IStoreTypeBreakdown {
  storeType: string;
  count: number;
}

// ─── Cloudinary Signed Upload ─────────────────────────────────────────────────
// Matches SignedUploadParams record returned by POST /api/v1/admin/upload/sign
// See UploadController.cs + CloudinaryService.cs for the signing logic.

export interface ISignedUploadParams {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  uploadPreset: string;
}

// ─── Cart (client-side only) ──────────────────────────────────────────────────

export interface ICartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

// ─── Customers ────────────────────────────────────────────────────────────────

export interface ICustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface ICustomerList {
  items: ICustomer[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface IAuditLog {
  id: string;
  userEmail: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface IAuditLogList {
  items: IAuditLog[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
// ─────────────────────────────────────────────────────────────────────────────
// APPEND THIS BLOCK TO THE BOTTOM OF models.ts
// (after the IAuditLogList interface)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Storefront — Customer Registration ──────────────────────────────────────

export interface IRegisterCustomerRequest {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
}

// ─── Storefront — Place Order ─────────────────────────────────────────────────

export interface IOrderLineRequest {
  productId: string;
  quantity:  number;
}

export interface IPlaceOrderRequest {
  items: IOrderLineRequest[];
  notes: string | null;
}

/** Returned immediately after POST /store/orders — lightweight confirmation */
export interface IPlacedOrder {
  orderId:     string;
  totalAmount: number;
  status:      string;
  createdAt:   string;
}

// ─── Storefront — Customer Order Detail ──────────────────────────────────────

export interface ICustomerOrderItem {
  name:      string;
  unitPrice: number;
  quantity:  number;
  lineTotal: number;
}

export interface ICustomerOrder {
  id:          string;
  status:      string;
  totalAmount: number;
  notes:       string | null;
  createdAt:   string;
  items:       ICustomerOrderItem[];
}
