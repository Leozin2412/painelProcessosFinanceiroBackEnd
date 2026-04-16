import supabase from '../lib/supabase.js';

// ──────────────────────────────────────────────
// 0. Filters — unique operacoes, seguradoras & peritos
// ──────────────────────────────────────────────
const getFilterOptions = async () => {
  // Fetch operacao & seguradora from sinistros
  const sinistrosPromise = supabase
    .from('sinistros')
    .select('operacao, seguradora');

  // Fetch regulador_prestador from timesheets
  const peritosPromise = supabase
    .from('timesheets')
    .select('regulador_prestador');

  const [sinistrosResult, peritosResult] = await Promise.all([
    sinistrosPromise,
    peritosPromise
  ]);

  if (sinistrosResult.error) throw sinistrosResult.error;
  if (peritosResult.error) throw peritosResult.error;

  const operacaoSet = new Set();
  const seguradoraSet = new Set();
  const peritoSet = new Set();

  if (sinistrosResult.data) {
    sinistrosResult.data.forEach(row => {
      if (row.operacao) operacaoSet.add(row.operacao);
      if (row.seguradora) seguradoraSet.add(row.seguradora);
    });
  }

  if (peritosResult.data) {
    peritosResult.data.forEach(row => {
      if (row.regulador_prestador) peritoSet.add(row.regulador_prestador);
    });
  }

  return {
    operacoes: Array.from(operacaoSet).sort(),
    seguradoras: Array.from(seguradoraSet).sort(),
    peritos: Array.from(peritoSet).sort()
  };
};

// ──────────────────────────────────────────────
// 1. KPI Cards — six aggregate totals
// ──────────────────────────────────────────────
const getCardsData = async (dataInicio, dataFim, operacao, seguradora, perito) => {
  const { data, error } = await supabase.rpc('dashboard_cards', {
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
    p_operacao: operacao,
    p_seguradora: seguradora,
    p_perito: perito
  });

  if (error) throw error;

  return data?.[0] ?? {
    total_horas: 0,
    valor_total_reais: 0,
    horas_cobraveis: 0,
    horas_cobradas: 0,
    valor_horas_cobradas: 0,
    valor_horas_cobraveis: 0
  };
};

// ──────────────────────────────────────────────
// 2. Horas Produzidas — bar chart grouped by month
// ──────────────────────────────────────────────
const getHorasProduzidas = async (dataInicio, dataFim, operacao, seguradora, perito) => {
  const { data, error } = await supabase.rpc('dashboard_horas_produzidas', {
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
    p_operacao: operacao,
    p_seguradora: seguradora,
    p_perito: perito
  });

  if (error) throw error;
  return data ?? [];
};

// ──────────────────────────────────────────────
// 3. Horas Cobráveis — bar chart (honorario_gerado = FALSE)
// ──────────────────────────────────────────────
const getHorasCobraveis = async (dataInicio, dataFim, operacao, seguradora, perito) => {
  const { data, error } = await supabase.rpc('dashboard_horas_cobraveis', {
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
    p_operacao: operacao,
    p_seguradora: seguradora,
    p_perito: perito
  });

  if (error) throw error;
  return data ?? [];
};

// ──────────────────────────────────────────────
// 4. Pizza Seguradoras — pie chart (cobranca = TRUE)
// ──────────────────────────────────────────────
const getPizzaSeguradoras = async (dataInicio, dataFim, operacao, seguradora, perito) => {
  const { data, error } = await supabase.rpc('dashboard_pizza_seguradoras', {
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
    p_operacao: operacao,
    p_seguradora: seguradora,
    p_perito: perito
  });

  if (error) throw error;
  return data ?? [];
};

// ──────────────────────────────────────────────
// 5. Barras Faturado por Período — bar chart (cobranca = TRUE, by month)
// ──────────────────────────────────────────────
const getBarrasFaturadoPeriodo = async (dataInicio, dataFim, operacao, seguradora, perito) => {
  const { data, error } = await supabase.rpc('dashboard_barras_faturado_periodo', {
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
    p_operacao: operacao,
    p_seguradora: seguradora,
    p_perito: perito
  });

  if (error) throw error;
  return data ?? [];
};

export {
  getFilterOptions,
  getCardsData,
  getHorasProduzidas,
  getHorasCobraveis,
  getPizzaSeguradoras,
  getBarrasFaturadoPeriodo
};
