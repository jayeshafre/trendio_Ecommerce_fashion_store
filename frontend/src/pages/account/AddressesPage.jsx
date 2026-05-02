/**
 * AddressesPage.jsx — FIXED
 * Route: /account/addresses
 *
 * Fix: address hooks imported from useProfile (users module)
 * instead of useOrders (orders module).
 */
import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Star, X } from "lucide-react";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "@hooks/useProfile";   // ← fixed: was @hooks/useOrders
import AddressForm from "../shop/components/AddressForm";

export default function AddressesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editAddr, setEditAddr] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: addresses = [], isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const handleCreate = (data) => {
    createAddress.mutate(data, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleUpdate = (data) => {
    updateAddress.mutate({ id: editAddr.id, data }, {
      onSuccess: () => setEditAddr(null),
    });
  };

  const handleDelete = () => {
    deleteAddress.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  return (
    <div className="mx-auto max-w-[800px] px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.15em]" style={{ color: "#C2A98A" }}>ACCOUNT</p>
          <h1 className="font-display text-3xl" style={{ color: "#2B2B2B" }}>Saved Addresses</h1>
        </div>
        {!showForm && !editAddr && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={14} />
            Add Address
          </button>
        )}
      </div>

      {/* Add new form */}
      {showForm && (
        <div className="mb-6 card-ivory p-6 animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">New Address</h2>
            <button onClick={() => setShowForm(false)}>
              <X size={16} style={{ color: "#7A6E67" }} />
            </button>
          </div>
          <AddressForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isLoading={createAddress.isPending}
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && addresses.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: "#EDE3D9" }}>
            <MapPin size={36} style={{ color: "#C2A98A" }} strokeWidth={1.5} />
          </div>
          <p className="font-display text-2xl" style={{ color: "#2B2B2B" }}>No saved addresses</p>
          <p className="mt-2 text-sm" style={{ color: "#7A6E67" }}>
            Add a delivery address to checkout faster.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-6">
            <Plus size={14} />
            Add First Address
          </button>
        </div>
      )}

      {/* Address list */}
      {!isLoading && addresses.length > 0 && (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id}>
              {/* Edit mode */}
              {editAddr?.id === addr.id ? (
                <div className="card-ivory p-6 animate-fade-in"
                  style={{ borderColor: "#C2A98A" }}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-display text-lg">Edit Address</h2>
                    <button onClick={() => setEditAddr(null)}>
                      <X size={16} style={{ color: "#7A6E67" }} />
                    </button>
                  </div>
                  <AddressForm
                    initialData={addr}
                    onSubmit={handleUpdate}
                    onCancel={() => setEditAddr(null)}
                    isLoading={updateAddress.isPending}
                  />
                </div>
              ) : (
                /* Display mode */
                <div className="card-ivory p-5 transition-shadow hover:shadow-ivory"
                  style={{ borderColor: addr.is_default ? "#C2A98A" : "#E5DCD3" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: "#C2A98A" }} />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: "#2B2B2B" }}>
                            {addr.full_name}
                          </p>
                          {addr.is_default && (
                            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest"
                              style={{ backgroundColor: "#EDE3D9", color: "#C2A98A" }}>
                              <Star size={8} fill="#C2A98A" />
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: "#7A6E67" }}>
                          {addr.formatted}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: "#7A6E67" }}>{addr.phone}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => setEditAddr(addr)}
                        className="rounded-lg p-2 transition-colors hover:bg-[#EDE3D9]">
                        <Pencil size={13} style={{ color: "#7A6E67" }} />
                      </button>
                      <button onClick={() => setDeleteId(addr.id)}
                        className="rounded-lg p-2 transition-colors hover:bg-[#FDF3F0]">
                        <Trash2 size={13} style={{ color: "#D97757" }} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete confirm */}
              {deleteId === addr.id && (
                <div className="mt-2 rounded-xl border p-4 animate-fade-in"
                  style={{ borderColor: "#D97757", backgroundColor: "#FDF3F0" }}>
                  <p className="mb-3 text-sm" style={{ color: "#D97757" }}>
                    Delete this address? This cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={handleDelete} disabled={deleteAddress.isPending}
                      className="rounded-xl px-4 py-2 text-xs font-bold tracking-wider text-white"
                      style={{ backgroundColor: "#D97757" }}>
                      {deleteAddress.isPending ? "Deleting…" : "Delete"}
                    </button>
                    <button onClick={() => setDeleteId(null)} className="btn-outline px-4 py-2 text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}