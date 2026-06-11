import { getExchangeRates } from "@/lib/api/exchange-rates";
import { CurrencyConverter } from "@/components/currency-converter";
import type { ExchangeRate } from "@/lib/types";

interface CurrencyConverterServerProps {
  rates?: ExchangeRate[];
}

/**
 * Server wrapper: fetches live exchange rates (ISR-cached) and passes
 * them to the interactive CurrencyConverter client component.
 */
export async function CurrencyConverterServer({ rates: initialRates }: CurrencyConverterServerProps = {}) {
  const rates = initialRates ?? await getExchangeRates();
  return <CurrencyConverter rates={rates} />;
}
