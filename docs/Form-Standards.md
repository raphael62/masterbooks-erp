# Form Standards

This document defines the standard patterns for invoice and order forms in MasterBooks ERP. All forms (Sales Invoice, Sales Order, Purchase Invoice) should follow these conventions.

## Reference Implementation

- **Sales Invoice**: `src/pages/sales-invoice-management/components/SalesInvoiceForm.jsx`
- **Sales Order**: `src/pages/sales-order-management/components/SalesOrderForm.jsx`
- **Purchase Invoice**: `src/pages/purchase-invoice-management/components/PurchaseInvoiceForm.jsx`

---

## 1. Filterable Dropdowns

Replace native `<select>` elements with searchable inputs that filter as the user types. Use for:
- **Form header**: Customer, Supplier, Sales Rep, Location, Driver, Vehicle, Payment Terms, Price Type
- **Line items**: Item Code, Item Name, Price Type

### State Variables

```javascript
// Form-level search (header fields)
const [formSearchField, setFormSearchField] = useState(null);  // 'customer' | 'supplier' | 'location' | etc.
const [formSearchQuery, setFormSearchQuery] = useState('');

// Line-item search (table rows)
const [dropdownIdx, setDropdownIdx] = useState(null);
const [dropdownField, setDropdownField] = useState(null);
const [dropdownQuery, setDropdownQuery] = useState('');
```

### Filter Helpers

Create `getFiltered*` helpers that return filtered, limited results (e.g. top 20–30):

```javascript
const getFilteredProducts = useCallback((query) => {
  if (!query || !products?.length) return products?.slice(0, 20) || [];
  const q = String(query).toLowerCase().trim();
  return products
    .filter(p => 
      p?.product_code?.toLowerCase()?.includes(q) || 
      p?.product_name?.toLowerCase()?.includes(q)
    )
    .slice(0, 20);
}, [products]);
```

### UI Pattern

- Use `<input>` instead of `<select>`
- Show formatted display when not focused; raw search query when focused
- Dropdown appears on focus and filters on `onChange`
- Use `onMouseDown` (not `onClick`) on dropdown options so selection happens before blur
- Use `onBlur={() => setTimeout(() => setFormSearchField(null), 200)}` to allow click-through

### Enter Key Behavior

On Item Code or Item Name, pressing Enter selects the first filtered match and moves focus to Ctn Qty.

---

## 2. Price Formatting

### Price (Ex-Tax)

- **Alignment**: Right-align (`text-right`)
- **Display**: 6 decimal places for accuracy (`fmt6()`)
- **Behavior**: Typically read-only (derived from Price Tax-Inc or price list)
- **Auto-fill indicator**: Green dot when price comes from price list

### Price (Tax-Inc)

- **Alignment**: Right-align (`text-right`)
- **Display**: 2 decimal places with thousand separators when not focused (`fmt()`)
- **Editing**: Show raw value when focused for easier editing
- **State**: `focusedPriceTaxIncIdx` tracks which row is being edited

```javascript
// State
const [focusedPriceTaxIncIdx, setFocusedPriceTaxIncIdx] = useState(null);

// Input
value={focusedPriceTaxIncIdx === idx ? (item?.price_tax_inc ?? '') : fmt(item?.price_tax_inc)}
onFocus={() => setFocusedPriceTaxIncIdx(idx)}
onBlur={() => setFocusedPriceTaxIncIdx(null)}
inputMode="decimal"
```

### Validation (Price Tax-Inc)

In `handleItemChange`, validate and strip commas:

```javascript
if (field === 'price_tax_inc') {
  const raw = String(value).replace(/,/g, '');
  if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return prev;
  item.price_tax_inc = raw;
}
```

### Format Helpers

```javascript
const fmt = (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return '0.00';
  return n?.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmt6 = (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return '0.000000';
  return n?.toLocaleString('en-GB', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
};
```

---

## 3. Btl Qty and Ctn Qty (Pack Unit)

**One-way relationship only**: Btl Qty drives Ctn Qty. Ctn Qty must NOT update Btl Qty.

```
Btl Qty  →  Ctn Qty = Btl Qty / Pack Unit
Ctn Qty  →  (no change to Btl Qty)
```

When user edits `btl_qty` or `pack_unit`, recalculate `ctn_qty`. When user edits `ctn_qty` directly, leave `btl_qty` unchanged.

---

## 4. Cost Price (Purchase Invoice)

When a product is selected on a Purchase Invoice line:
1. Look up price from `price_list_items` (by product_code/product_id, vendor price type, invoice date)
2. Prefer `pre_tax_price` for cost
3. Fall back to `fetchLastPurchasePrice(productId)` when no price list match

---

## 5. Price List Modal

- **Price (Tax-Inc)**: Show thousand separators and 2 decimals (including `0.00`)
- Use `formatPriceDisplay()` for display; raw value when focused for editing

---

## 6. Empties Section (Sales Invoice)

The Sales Invoice form includes an **Empties - Expected & Received** section with columns: **PRODUCT**, **OWED**, **EXPECTED**, **RECEIVED**, **O/S**.

- **Owed**: Customer empties position before today's transactions (from past returnable sales − past receives − past empties sales)
- **Expected**: Empties going out (returnable line items) MINUS empties sold (empties products as line items). Empties products reduce expected because the customer is buying them.
- **Received**: Empties physically returned on this delivery (manual entry)
- **O/S**: Outstanding = Owed + Expected − Received

**Empties sales as line items:** When the customer pays for empties instead of returning them, add the empties product (stock item) as a line item. Enter qty in Ctn Qty. This reduces Expected, and the value (positive or negative/refund) forms part of the invoice total. Empties products are identified by product name/code containing "Empties".

**Empties of promotions:** Promotions are applied automatically by the system when conditions are met. The system adds **separate line items** for each free/promo product (e.g. "1166 FREE FES/m 123456" with "FREE" in the name), quantity in Ctn Qty, and Price/Value 0. Promo lines are included in Expected (empties going out). This matches POS receipts and supports rewards that are different products.

---

## Checklist for New/Updated Forms

- [ ] Header lookups (Customer, Supplier, Location, etc.) use filterable dropdowns
- [ ] Line item lookups (Item Code, Item Name) use filterable dropdowns
- [ ] Price Ex-Tax is right-aligned
- [ ] Price Tax-Inc uses `fmt()` when not focused, raw value when focused
- [ ] Btl Qty → Ctn Qty only (Ctn Qty does not update Btl Qty)
- [ ] Enter on Item Code/Name selects first match and moves to next field
- [ ] Numeric inputs use appropriate validation (strip commas, reject invalid chars)
