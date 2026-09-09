import { prisma } from "@/lib/prisma";

/**
 * The one-row app_settings table (see prisma/sql/08_reports_and_radio_setting.sql).
 * Currently just the floating radio player's stream URL/label, set by
 * an admin from /admin — add more fields here rather than a new table
 * per setting.
 */
export async function getAppSettings() {
  const row = await prisma.appSetting.findUnique({ where: { id: "singleton" } });
  return {
    radioStreamUrl: row?.radioStreamUrl ?? null,
    radioLabel: row?.radioLabel ?? null,
    manualPaymentBankInfo: row?.manualPaymentBankInfo ?? null,
    manualPaymentCryptoInfo: row?.manualPaymentCryptoInfo ?? null,
    manualPaymentFibInfo: row?.manualPaymentFibInfo ?? null,
  };
}

export async function setRadioSetting(radioStreamUrl: string | null, radioLabel: string | null) {
  return prisma.appSetting.upsert({
    where: { id: "singleton" },
    update: { radioStreamUrl, radioLabel },
    create: { id: "singleton", radioStreamUrl, radioLabel },
  });
}

/** Admin-editable bank/Qi Card + crypto + FIB instructions shown on /premium — see prisma/sql/11_manual_payments.sql and 15_manual_payment_fib.sql. */
export async function setManualPaymentSettings(
  manualPaymentBankInfo: string | null,
  manualPaymentCryptoInfo: string | null,
  manualPaymentFibInfo: string | null
) {
  return prisma.appSetting.upsert({
    where: { id: "singleton" },
    update: { manualPaymentBankInfo, manualPaymentCryptoInfo, manualPaymentFibInfo },
    create: { id: "singleton", manualPaymentBankInfo, manualPaymentCryptoInfo, manualPaymentFibInfo },
  });
}
