/**
 * CheckoutPage.jsx
 * UPDATED: Added payment method selection (Pay Online / Cash on Delivery)
 * - New <section> in left column for payment method toggle
 * - handlePlaceAndPay sends payment_method to backend
 * - COD flow: skip Razorpay, navigate directly to success
 * - Online flow: unchanged (Razorpay modal)
 */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin, Plus, Check, ChevronRight, Truck,
  ShieldCheck, Tag, X, CreditCard, Banknote,
} from "lucide-react";
import { useCart } from "@hooks/useCart";
import { useAddresses, useCreateAddress } from "@hooks/useProfile";
import { useInitiatePayment } from "@hooks/usePayments";
import { ROUTES, QUERY_KEYS } from "@constants";
import { getApiError, getImageUrl } from "@utils";
import { ordersApi } from "@api/orders.api";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import useCartStore from "@store/cartStore";
import AddressForm from "./components/AddressForm";

const FREE_DELIVERY_THRESHOLD = 999;
const FLAT_DELIVERY_CHARGE    = 99;

export default function CheckoutPage() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const clearCart   = useCartStore((s) => s.clearCart);

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm,   setShowAddressForm]    = useState(false);
  const [notes,             setNotes]              = useState("");
  const [isPlacing,         setIsPlacing]          = useState(false);
  const [paymentMethod,     setPaymentMethod]      = useState("online"); // ← NEW

  const { data: cart, isLoading: cartLoading }           = useCart();
  const { data: addresses = [], isLoading: addrLoading } = useAddresses();
  const createAddress    = useCreateAddress();
  const { initiatePayment, isLoading: isPaying } = useInitiatePayment();

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses]);

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

  const handlePlaceAndPay = async () => {
    if (!selectedAddressId) return;
    setIsPlacing(true);

    try {
      const { data: order } = await ordersApi.placeOrder({
        address_id:     selectedAddressId,
        notes,
        payment_method: paymentMethod,   // ← NEW: send to backend
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      clearCart();
      setIsPlacing(false);

      // ── COD: skip Razorpay, go straight to success ──────
      if (paymentMethod === "cod") {
        toast.success("Order placed! Pay on delivery.");
        navigate(`/order/success/${order.id}`);
        return;
      }

      // ── Online: open Razorpay modal ──────────────────────
      initiatePayment({
        orderId:   order.id,
        onSuccess: () => navigate(`/order/success/${order.id}`),
        onFailure: (err) => {
          if (err?.description === "Payment cancelled by user.") {
            toast("Order saved. You can complete payment later.", { icon: "ℹ️" });
          }
          navigate(`/order/success/${order.id}`);
        },
      });
    } catch (err) {
      setIsPlacing(false);
      const error = err.response?.data;
      if (error?.stock_errors) {
        error.stock_errors.forEach((e) => {
          toast.error(`${e.product}: ${e.issue}`, { duration: 5000 });
        });
      } else {
        toast.error(getApiError(err));
      }
    }
  };

  const isProcessing = isPlacing || isPaying;

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
          <span style={{ color: isPaying ? "#2B2B2B" : undefined, fontWeight: isPaying ? 600 : undefined }}>
            Payment
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

        {/* ── Left column ───────────────────────────────── */}
        <div className="space-y-6">

          {/* Delivery Address */}
          <section className="card-ivory p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} style={{ color: "#C2A98A" }} />
                <h2 className="font-display text-lg">Delivery Address</h2>
              </div>
              {!showAddressForm && (
                <button onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold tracking-widest transition-opacity hover:opacity-70"
                  style={{ color: "#C2A98A" }}>
                  <Plus size={13} />ADD NEW
                </button>
              )}
            </div>

            {showAddressForm && (
              <div className="mb-6 rounded-xl border p-5"
                style={{ borderColor: "#C2A98A", backgroundColor: "#FAF7F4" }}>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-widest" style={{ color: "#2B2B2B" }}>
                    NEW ADDRESS
                  </p>
                  <button onClick={() => setShowAddressForm(false)}>
                    <X size={14} style={{ color: "#7A6E67" }} />
                  </button>
                </div>
                <AddressForm onSubmit={handleAddressCreated} isLoading={createAddress.isPending} />
              </div>
            )}

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
                    <button key={addr.id} onClick={() => setSelectedAddressId(addr.id)}
                      className="w-full rounded-xl border p-4 text-left transition-all duration-150"
                      style={{
                        borderColor:     isSelected ? "#C2A98A" : "#E5DCD3",
                        backgroundColor: isSelected ? "#FAF7F4" : "white",
                      }}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                          style={{
                            borderColor:     isSelected ? "#C2A98A" : "#E5DCD3",
                            backgroundColor: isSelected ? "#C2A98A" : "transparent",
                          }}>
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

          {/* Delivery Notes */}
          <section className="card-ivory p-6">
            <h2 className="mb-3 font-display text-lg">Delivery Instructions</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Leave at door, call before delivery..."
              rows={3} maxLength={500} className="input-ivory resize-none" />
            <p className="mt-1 text-right text-[10px]" style={{ color: "#7A6E67" }}>
              {notes.length}/500
            </p>
          </section>

          {/* ── Payment Method ── NEW SECTION ─────────────── */}
          <section className="card-ivory p-6">
            <h2 className="mb-4 font-display text-lg">Payment Method</h2>
            <div className="space-y-3">

              {/* Pay Online */}
              <button
                onClick={() => setPaymentMethod("online")}
                className="w-full rounded-xl border p-4 text-left transition-all duration-150"
                style={{
                  borderColor:     paymentMethod === "online" ? "#C2A98A" : "#E5DCD3",
                  backgroundColor: paymentMethod === "online" ? "#FAF7F4" : "white",
                }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                    style={{
                      borderColor:     paymentMethod === "online" ? "#C2A98A" : "#E5DCD3",
                      backgroundColor: paymentMethod === "online" ? "#C2A98A" : "transparent",
                    }}>
                    {paymentMethod === "online" && <Check size={9} color="white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>Pay Online</p>
                    <p className="text-xs" style={{ color: "#7A6E67" }}>
                      UPI · Cards · Net Banking via Razorpay
                    </p>
                  </div>
                  <CreditCard size={16} style={{ color: "#C2A98A" }} />
                </div>
              </button>

              {/* Cash on Delivery */}
              <button
                onClick={() => setPaymentMethod("cod")}
                className="w-full rounded-xl border p-4 text-left transition-all duration-150"
                style={{
                  borderColor:     paymentMethod === "cod" ? "#C2A98A" : "#E5DCD3",
                  backgroundColor: paymentMethod === "cod" ? "#FAF7F4" : "white",
                }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                    style={{
                      borderColor:     paymentMethod === "cod" ? "#C2A98A" : "#E5DCD3",
                      backgroundColor: paymentMethod === "cod" ? "#C2A98A" : "transparent",
                    }}>
                    {paymentMethod === "cod" && <Check size={9} color="white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>Cash on Delivery</p>
                    <p className="text-xs" style={{ color: "#7A6E67" }}>
                      Pay cash when your order arrives
                    </p>
                  </div>
                  <Banknote size={16} style={{ color: "#C2A98A" }} />
                </div>
              </button>

            </div>
          </section>
          {/* ── END Payment Method ────────────────────────── */}

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
              {cart.items?.map((item) => {
                const imageUrl = getImageUrl(item.product?.primary_image);
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-16 w-14 shrink-0 rounded-lg overflow-hidden"
                      style={{ backgroundColor: "#EDE3D9" }}>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.product?.title}
                          className="h-full w-full object-cover"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="font-display text-xl italic opacity-20"
                            style={{ color: "#C2A98A" }}>T</span>
                        </div>
                      )}
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
                );
              })}
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
            <button onClick={handlePlaceAndPay}
              disabled={!selectedAddressId || isProcessing}
              className="btn-primary mt-5 w-full">
              {isPlacing ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Placing Order…
                </span>
              ) : isPaying ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Opening Payment…
                </span>
              ) : paymentMethod === "cod" ? (
                <><Banknote size={15} />Place Order</>
              ) : (
                <><CreditCard size={15} />Place Order & Pay</>
              )}
            </button>

            {!selectedAddressId && (
              <p className="mt-2 text-center text-xs" style={{ color: "#D97757" }}>
                Please select a delivery address
              </p>
            )}

            {/* Security / COD badge */}
            <p className="mt-3 text-center text-[10px]" style={{ color: "#7A6E67" }}>
              {paymentMethod === "online"
                ? "🔒 Secured by Razorpay · 256-bit SSL"
                : "🚚 Pay cash when your order arrives"}
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
          <div className="skeleton h-40 rounded-xl" />
        </div>
        <div className="skeleton h-80 rounded-xl" />
      </div>
    </div>
  );
}