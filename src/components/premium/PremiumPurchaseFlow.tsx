"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PricingTable from "./PricingTable";
import ManualPaymentForm from "./ManualPaymentForm";
import type { SubscriptionPlan } from "@prisma/client";

type ManualRequest = {
  id: string;
  plan: SubscriptionPlan;
  method: "BANK_TRANSFER" | "CRYPTO" | "FIB";
  status: "PENDING" | "APPROVED" | "REJECTED";
} | null;

/**
 * Wraps the pricing cards together with the bank/FIB/crypto payment
 * form: tapping a plan's "Subscribe" button no longer sends the user
 * straight into a Stripe checkout most Dilva users (mostly in Iraq)
 * can't actually finish — instead the page dims and the payment-method
 * picker for that plan opens in a modal on top of it. See
 * ManualPaymentForm for the form itself and /api/checkout for the
 * Stripe flow this replaces as the default path.
 */
export default function PremiumPurchaseFlow({
  currentPlan,
  isActive,
  bankInfo,
  cryptoInfo,
  fibInfo,
  initialRequest,
}: {
  currentPlan?: SubscriptionPlan | null;
  /** True once the user already has a real (Stripe) subscription — changing plan then still goes through Stripe, same as before. */
  isActive: boolean;
  bankInfo: string | null;
  cryptoInfo: string | null;
  fibInfo: string | null;
  initialRequest: ManualRequest;
}) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const hasManualMethods = Boolean(bankInfo || cryptoInfo || fibInfo);

  async function goToStripeCheckout(plan: SubscriptionPlan) {
    setRedirecting(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setRedirecting(false);
    if (data.url) window.location.href = data.url;
  }

  function handleSelectPlan(plan: SubscriptionPlan) {
    // Already an active paying (Stripe) subscriber, or no manual
    // payment method has been configured by an admin yet — fall back
    // to the original direct-to-Stripe flow instead of opening an
    // empty/irrelevant modal.
    if (isActive || !hasManualMethods) {
      goToStripeCheckout(plan);
      return;
    }
    setSelectedPlan(plan);
  }

  return (
    <>
      <PricingTable currentPlan={currentPlan} onSelectPlan={handleSelectPlan} />
      {redirecting && (
        <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">…</p>
      )}

      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            key="manual-payment-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-800"
            >
              <ManualPaymentForm
                key={selectedPlan}
                bankInfo={bankInfo}
                cryptoInfo={cryptoInfo}
                fibInfo={fibInfo}
                initialRequest={initialRequest}
                initialPlan={selectedPlan}
                onClose={() => setSelectedPlan(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
