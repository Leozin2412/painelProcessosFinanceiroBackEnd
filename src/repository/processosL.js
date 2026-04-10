import supabase from '../lib/supabase.js';

const getAllProcesses = async (filters = {}) => {
  try {
    let query = supabase.from('vw_controle_processos').select('*', { count: 'exact' });

    const validFilters = [
      'situacao',
      'codigo_sinistro',
      'dat_ciracao_sinistro',
      'segurado',
      'seguradora',
      'operacao',
      'dat_ultima_cobranca',
      'alerta_cobranca',
      'status_bh',
      'alerta_bh'
    ];

    if (filters) {
      for (const field of validFilters) {
        if (filters[field] !== undefined && filters[field] !== '') {
          const filterValue = String(filters[field]);
          // Dynamically apply filters (.in() for multiple, .eq() for single)
          if (filterValue.includes(',')) {
            const valuesArray = filterValue.split(',').map(v => v.trim()).filter(v => v !== '');
            query = query.in(field, valuesArray);
          } else {
            query = query.eq(field, filterValue);
          }
        }
      }
    }

    // Pagination Support
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50; 
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;
    
    return {
      data,
      metadata: {
        totalCount: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

const getFilterOptions = async () => {
  try {
    // Querying the view to extract unique options. 
    // Since PostgREST doesn't support native distinct across multiple arbitrary columns directly
    // without an RPC, pulling the data and deriving standard sets.
    const { data, error } = await supabase
      .from('vw_controle_processos')
      .select('situacao, seguradora, operacao, alerta_bh');

    if (error) throw error;

    const situacaoSet = new Set();
    const seguradoraSet = new Set();
    const operacaoSet = new Set();
    const alertaBhSet = new Set();
    if (data) {
      data.forEach(item => {
        if (item.situacao) situacaoSet.add(item.situacao);
        if (item.seguradora) seguradoraSet.add(item.seguradora);
        if (item.operacao) operacaoSet.add(item.operacao);
        if (item.alerta_bh) alertaBhSet.add(item.alerta_bh);
      });
    }

    return {
      situacao: Array.from(situacaoSet).sort(),
      seguradora: Array.from(seguradoraSet).sort(),
      operacao: Array.from(operacaoSet).sort(),
      alerta_bh: Array.from(alertaBhSet).sort()
    };
  } catch (error) {
    throw error;
  }
};

const getSuggestions = async (campo, termo) => {
  try {
    const { data, error } = await supabase
      .from('vw_controle_processos')
      .select(campo)
      .ilike(campo, `%${termo}%`)
      .not(campo, 'is', null)
      .limit(10);

    if (error) throw error;

    // Maintain unique values
    const suggestionsSet = new Set();
    if (data) {
      data.forEach(item => {
        if (item[campo]) suggestionsSet.add(item[campo]);
      });
    }

    return Array.from(suggestionsSet);
  } catch (error) {
    throw error;
  }
};

const upsertProcessStatus = async (codigo_sinistro, updates) => {
  try {
    const payload = { codigo_sinistro, ...updates };

    const { data, error } = await supabase
      .from('status_processos_bh')
      .upsert(payload, { onConflict: 'codigo_sinistro' })
      .select();

    if (error) throw error;

    return data;
  } catch (error) {
    throw error;
  }
};

export { getAllProcesses, getFilterOptions, getSuggestions, upsertProcessStatus };
