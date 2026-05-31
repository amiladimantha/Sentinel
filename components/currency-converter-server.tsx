import { getExchangeRates } from "@/lib/api/exchange-rates";
import { CurrencyConverter } from "@/components/currency-converter";

/**
 * Server wrapper: fetches live exchange rates (ISR-cached) and passes
 * them to the interactive CurrencyConverter client component.
 */
export async function CurrencyConverterServer() {
  const rates = await getExchangeRates();
  return <CurrencyConverter rates={rates} />;
}
