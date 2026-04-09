import supabase from '../lib/supabase.js';

const getAllProcesses = async (filters = {}) => {
  try {
    let query = supabase.from('vw_controle_processos').select('*');

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

    const { data, error } = await query;
    if (error) throw error;
    
    return data;
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
      .select('situacao, seguradora, operacao');

    if (error) throw error;

    const situacaoSet = new Set();
    const seguradoraSet = new Set();
    const operacaoSet = new Set();

    if (data) {
      data.forEach(item => {
        if (item.situacao) situacaoSet.add(item.situacao);
        if (item.seguradora) seguradoraSet.add(item.seguradora);
        if (item.operacao) operacaoSet.add(item.operacao);
      });
    }

    return {
      situacao: Array.from(situacaoSet).sort(),
      seguradora: Array.from(seguradoraSet).sort(),
      operacao: Array.from(operacaoSet).sort()
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

export default{ getAllProcesses, getFilterOptions, getSuggestions }
