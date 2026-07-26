# Walkthrough - Login UI Layout, Dashboard Loader, Mobile Casing/Port Fixes, Dummy Data Removal, Hotel Item Management & Stay Customers Directory

Here is a summary of all the improvements, bug fixes, cleanups, and features applied to the projects.

## Changes Made

### 1. Standalone Customer Profile Component & Routing
* **[NEW] [customer-profile.component.ts](file:///C:/Users/kumaw/Desktop/vyparsetupc/src/app/dashboard/customer-profile.component.ts)**
  * Contains the entire customer profile state management.
  * Dynamically parses `customerId` query parameters from the active route.
  * Encapsulates all guest bookings fetching, room assignment modals (Single booking & Multi-guest wizard), and guest checkout logic.
  * Fixed access visibility compile error by referencing `this.authService.getApiUrl()` instead of the private `apiUrl` field.
* **[NEW] [customer-profile.component.html](file:///C:/Users/kumaw/Desktop/vyparsetupc/src/app/dashboard/customer-profile.component.html)**
  * Designed a premium standalone profile page including card headers, guest documents lists, upload previews, booking triggers, and checkout modal confirmation sheets.
  * Applied Angular safe navigation operators (`?.`) to all property bindings of the `customer` object (specifically front/back image URL mappings) to ensure compile-time template safety.
* **[MODIFY] [app.routes.ts](file:///C:/Users/kumaw/Desktop/vyparsetupc/src/app/app.routes.ts)**
  * Registered the `/customer-profile` route, protected by the `authGuard`.
* **[MODIFY] [home-dashboard.component.ts](file:///C:/Users/kumaw/Desktop/vyparsetupc/src/app/dashboard/home-dashboard.component.ts)**
  * Cleaned up local modal fields and sub-methods.
  * Reconfigured `openProfile(cust)` to navigate via `this.router.navigate(['/customer-profile'], { queryParams: { customerId: cust.customerId } })`.
  * Subscribed to `ActivatedRoute` query parameters in `ngOnInit` to dynamically highlight the active tab.

### 2. Stay Customers Management Tab
* **[MODIFY] [auth.service.ts](file:///C:/Users/kumaw/Desktop/vyparsetupc/src/app/services/auth.service.ts)**
  * Added REST API client helpers for stay guest records management (endpoints: `/api/v1/hotel/add-customer`, `/get-all-customers`, `/edit-customer`, `/delete-customer`).
  * Integrated Room Booking REST endpoints: `/api/v1/hotel/add-booking` (POST), `/api/v1/hotel/get-all-bookings` (GET), `/api/v1/hotel/checkout-booking` (PATCH), and `/api/v1/hotel/delete-booking` (DELETE).

### 3. Dynamic Invoicing Input Grid
* Replaced the static item selector and detail lists with a dynamic grid input system.
* Supports inline search filters and dynamic row generation via `➕ Add Product Row (Line)` triggers.

### 4. Hotel Item Management Feature
* Standalone hotel items manager component with inline search query filters.
* Preserved vector outline SVG stroke buttons and bypassed image uploads to avoid Electron CORS errors.

## Verification & Testing
* Verified all bindings compile successfully and verified directories map correctly.
