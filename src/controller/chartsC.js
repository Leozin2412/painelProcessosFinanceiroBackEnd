import {
  getFilterOptions,
  getCardsData,
  getHorasProduzidas,
  getHorasCobraveis,
  getPizzaSeguradoras,
  getBarrasFaturadoPeriodo
} from '../repository/chartsL.js';

/**
 * Normalises a query parameter that may arrive as a string or an array
 * into a proper array, or null if empty/undefined.
 *
 * Express parses repeated keys (?op=A&op=B) as an array, but a single
 * value (?op=A) comes as a plain string. Comma-separated values
 * (?op=A,B) are also supported for convenience.
 */
const toArrayOrNull = (param) => {
  if (!param) return null;

  // Already an array (Express repeated-key parsing)
  if (Array.isArray(param)) {
    const filtered = param.map(v => v.trim()).filter(Boolean);
    return filtered.length ? filtered : null;
  }

  // Comma-separated string
  if (typeof param === 'string') {
    const parts = param.split(',').map(v => v.trim()).filter(Boolean);
    return parts.length ? parts : null;
  }

  return null;
};

/**
 * Strictly parses a date query parameter.
 * Returns null if undefined, empty string, or the literal string "null".
 * Otherwise returns the trimmed string (expected format: 'YYYY-MM-DD').
 */
const toDateOrNull = (param) => {
  if (param === undefined || param === null) return null;
  if (typeof param === 'string') {
    const trimmed = param.trim();
    if (trimmed === '' || trimmed === 'null') return null;
    return trimmed;
  }
  return null;
};

// ──────────────────────────────────────────────
// GET /api/charts/filters
// ──────────────────────────────────────────────
const getFilters = async (_req, res) => {
  try {
    const options = await getFilterOptions();
    return res.status(200).json(options);
  } catch (error) {
    console.error('Error in getFilters:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// ──────────────────────────────────────────────
// GET /api/charts/dashboard
// ──────────────────────────────────────────────
const getDashboardData = async (req, res) => {
  try {
    // Extract & normalise filters — empty strings become null
    const dataInicio = toDateOrNull(req.query.data_inicio);
    const dataFim    = toDateOrNull(req.query.data_fim);
    const operacao   = toArrayOrNull(req.query.operacao);
    const seguradora = toArrayOrNull(req.query.seguradora);
    const perito     = toArrayOrNull(req.query.perito);

    // Fire all 5 queries in parallel for maximum performance
    const [
      cards,
      horasProduzidas,
      horasCobraveis,
      pizzaSeguradoras,
      barrasFaturadoPeriodo
    ] = await Promise.all([
      getCardsData(dataInicio, dataFim, operacao, seguradora, perito),
      getHorasProduzidas(dataInicio, dataFim, operacao, seguradora, perito),
      getHorasCobraveis(dataInicio, dataFim, operacao, seguradora, perito),
      getPizzaSeguradoras(dataInicio, dataFim, operacao, seguradora, perito),
      getBarrasFaturadoPeriodo(dataInicio, dataFim, operacao, seguradora, perito)
    ]);

    return res.status(200).json({
      filtrosAplicados: { dataInicio, dataFim, operacao, seguradora, perito },
      cards,
      graficos: {
        horasProduzidas,
        horasCobraveis,
        pizzaSeguradoras,
        barrasFaturadoPeriodo
      }
    });
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export { getFilters, getDashboardData };
