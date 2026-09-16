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
    radioStreamUrlKu: row?.radioStreamUrlKu ?? null,
    radioStreamUrlTr: row?.radioStreamUrlTr ?? null,
    radioStreamUrlAr: row?.radioStreamUrlAr ?? null,
    radioStreamUrlEn: row?.radioStreamUrlEn ?? null,
    manualPaymentBankInfo: row?.manualPaymentBankInfo ?? null,
    manualPaymentCryptoInfo: row?.manualPaymentCryptoInfo ?? null,
    manualPaymentFibInfo: row?.manualPaymentFibInfo ?? null,
  };
}

/** Admin-set stream URL for each of the radio button's four fixed
 * language stations — see components/layout/RadioPlayerButton.tsx's
 * station picker and components/admin/RadioSettingsForm.tsx. Any
 * station left null/empty just doesn't show up in the picker; the
 * floating button itself hides entirely when all four are empty. */
export async function setRadioStations(stations: {
  ku: string | null;
  tr: string | null;
  ar: string | null;
  en: string | null;
}) {
  return prisma.appSetting.upsert({
    where: { id: "singleton" },
    update: {
      radioStreamUrlKu: stations.ku,
      radioStreamUrlTr: stations.tr,
      radioStreamUrlAr: stations.ar,
      radioStreamUrlEn: stations.en,
    },
    create: {
      id: "singleton",
      radioStreamUrlKu: stations.ku,
      radioStreamUrlTr: stations.tr,
      radioStreamUrlAr: stations.ar,
      radioStreamUrlEn: stations.en,
    },
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
