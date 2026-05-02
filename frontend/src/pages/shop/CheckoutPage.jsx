/**
 * CheckoutPage.jsx — FIXED
 *
 * Fixes:
 *   1. Address hooks imported from useProfile (not useOrders)
 *   2. addresses defaults to [] — .map() never crashes
 *   3. Auto-selects default address on load
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Plus, Check, ChevronRight, Truck, ShieldCheck, Tag, X } from "lucide-react";
import { useCart } from "@hooks/useCart";
import { usePlaceOrder } from "@hooks/useOrders";
import { useAddresses, useCreateAddress } from "@hooks/useProfile";  // ← fixed import
import { ROUTES } from "@constants";
import AddressForm from "./components/AddressForm";

const FREE_DELIVERY_THRESHOLD = 999;
const FLAT_DELIVERY_CHARGE    = 99;

export default function CheckoutPage() {
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm,   setShowAddressForm]    = useState(false);
  const [notes,             setNotes]              = useState("");

  const { data: cart, isLoading: cartLoading }           = useCart();
  const { data: addresses = [], isLoading: addrLoading } = useAddresses(); // ← safe default []
  const createAddress = useCreateAddress();
  const placeOrder    = usePlaceOrder();

  // Auto-select default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses]);  // ← useEffect not useState (was a bug before)

  const subtotal       = parseFloat(cart?.subtotal ?? 0);
  const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : FLAT_DELIVERY_CHARGE;
  const total          = subtotal + deliveryCharge;

  const handleAddressCreated = (data) => {
    createAddress.mutate(data, {
      onSuccess: (res) => {
        setShowAddressForm(false);
        setSelectedAddressId(res.data.id);
      },
    });
  };

  const handlePlaceOrder = () => {
    if (!selectedAddressId) return;
    placeOrder.mutate({ address_id: selectedAddressId, notes });
  };

  if (cartLoading) return <CheckoutSkeleton />;

  if (!cart || cart.item_count === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="font-display text-2xl" style={{ color: "#2B2B2B" }}>Your bag is empty</p>
        <Link to={ROUTES.SHOP} className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-[0.15em]" style={{ color: "#C2A98A" }}>TRENDIO</p>
        <h1 className="font-display text-3xl" style={{ color: "#2B2B2B" }}>Checkout</h1>
        <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: "#7A6E67" }}>
          <Link to={ROUTES.CART} className="hover:underline">Bag</Link>
          <ChevronRight size={12} />
          <span style={{ color: "#2B2B2B", fontWeight: 600 }}>Delivery</span>
          <ChevronRight size={12} />
          <span>Payment</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

        {/* ── Left: Address Section ─────────────────────── */}
        <div className="space-y-6">
          <section className="card-ivory p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} style={{ color: "#C2A98A" }} />
                <h2 className="font-display text-lg">Delivery Address</h2>
              </div>
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold tracking-widest transition-opacity hover:opacity-70"
                  style={{ color: "#C2A98A" }}
                >
                  <Plus size={13} />
                  ADD NEW
                </button>
              )}
            </div>

            {/* Add address form */}
            {showAddressForm && (
              <div className="mb-6 rounded-xl border p-5" style={{ borderColor: "#C2A98A", backgroundColor: "#FAF7F4" }}>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-widest" style={{ color: "#2B2B2B" }}>NEW ADDRESS</p>
                  <button onClick={() => setShowAddressForm(false)}>
                    <X size={14} style={{ color: "#7A6E67" }} />
                  </button>
                </div>
                <AddressForm
                  onSubmit={handleAddressCreated}
                  isLoading={createAddress.isPending}
                />
              </div>
            )}

            {/* Address list */}
            {addrLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-xl py-8 text-center" style={{ backgroundColor: "#F8F5F2" }}>
                <MapPin size={28} className="mx-auto mb-2" style={{ color: "#C2A98A" }} />
                <p className="text-sm" style={{ color: "#7A6E67" }}>No saved addresses. Add one above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className="w-full rounded-xl border p-4 text-left transition-all duration-150"
                      style={{
                        borderColor:     isSelected ? "#C2A98A" : "#E5DCD3",
                        backgroundColor: isSelected ? "#FAF7F4" : "white",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                          style={{
                            borderColor:     isSelected ? "#C2A98A" : "#E5DCD3",
                            backgroundColor: isSelected ? "#C2A98A" : "transparent",
                          }}
                        >
                          {isSelected && <Check size={9} color="white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                              {addr.full_name}
                            </span>
                            {addr.is_default && (
                              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest"
                                style={{ backgroundColor: "#EDE3D9", color: "#C2A98A" }}>
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "#7A6E67" }}>
                            {addr.formatted}
                          </p>
                          <p className="mt-1 text-xs font-medium" style={{ color: "#7A6E67" }}>
                            {addr.phone}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Delivery notes */}
          <section className="card-ivory p-6">
            <h2 className="mb-3 font-display text-lg">Delivery Instructions</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Leave at door, call before delivery..."
              rows={3}
              maxLength={500}
              className="input-ivory resize-none"
            />
            <p className="mt-1 text-right text-[10px]" style={{ color: "#7A6E67" }}>
              {notes.length}/500
            </p>
          </section>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-4">
            {[
              { icon: <ShieldCheck size={14} />, text: "Secure checkout" },
              { icon: <Truck size={14} />,       text: "Free delivery over ₹999" },
              { icon: <Tag size={14} />,          text: "Best price guaranteed" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs" style={{ color: "#7A6E67" }}>
                <span style={{ color: "#C2A98A" }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Order Summary ──────────────────────── */}
        <div className="space-y-4">
          <div className="card-ivory p-6">
            <h2 className="mb-5 font-display text-lg">Order Summary</h2>

            {/* Cart items */}
            <div className="mb-5 max-h-64 space-y-4 overflow-y-auto pr-1">
              {cart.items?.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="h-16 w-14 shrink-0 rounded-lg overflow-hidden"
                    style={{ backgroundColor: "#EDE3D9" }}>
                    {item.product?.primary_image ? (
                      <img src={item.product.primary_image} alt={item.product.title}
                        className="h-full w-full object-cover" />
                    ) : <div className="h-full w-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: "#2B2B2B" }}>
                      {item.product?.title}
                    </p>
                    <p className="text-xs" style={{ color: "#7A6E67" }}>
                      {item.variant?.size} · {item.variant?.color} · Qty {item.quantity}
                    </p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                      ₹{parseFloat(item.line_total).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4 border-t" style={{ borderColor: "#E5DCD3" }} />

            {/* Totals */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm" style={{ color: "#7A6E67" }}>
                <span>Subtotal ({cart.item_count} items)</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "#7A6E67" }}>
                <span>Delivery</span>
                <span>
                  {deliveryCharge === 0
                    ? <span style={{ color: "#84cc16", fontWeight: 600 }}>FREE</span>
                    : `₹${deliveryCharge}`}
                </span>
              </div>
              {deliveryCharge > 0 && (
                <p className="text-[10px]" style={{ color: "#C2A98A" }}>
                  Add ₹{(FREE_DELIVERY_THRESHOLD - subtotal).toLocaleString("en-IN")} more for free delivery
                </p>
              )}
              <div className="border-t pt-2.5" style={{ borderColor: "#E5DCD3" }}>
                <div className="flex justify-between">
                  <span className="font-semibold" style={{ color: "#2B2B2B" }}>Total</span>
                  <span className="font-display text-xl" style={{ color: "#2B2B2B" }}>
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={!selectedAddressId || placeOrder.isPending}
              className="btn-primary mt-5 w-full"
            >
              {placeOrder.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Placing Order…
                </span>
              ) : "Place Order"}
            </button>

            {!selectedAddressId && (
              <p className="mt-2 text-center text-xs" style={{ color: "#D97757" }}>
                Please select a delivery address
              </p>
            )}

            <p className="mt-3 text-center text-[10px]" style={{ color: "#7A6E67" }}>
              Payment is collected after order confirmation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="skeleton mb-2 h-8 w-48 rounded" />
      <div className="skeleton mb-8 h-4 w-64 rounded" />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-32 rounded-xl" />
        </div>
        <div className="skeleton h-80 rounded-xl" />
      </div>
    </div>
  );
}