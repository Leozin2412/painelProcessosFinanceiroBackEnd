

import supabase from '../lib/supabase.js';

const TSrepo = {
    async importTS(seguradora, segurado, sinistroString, processoUp, DtInicial, DtFinal, descString, incidencia, executante) {
        const { data: importTS, error } = await supabase
            .from('view_atividades_sinistros')
            .insert([{
                seguradora: seguradora,
                segurado: segurado,
                nro_seguradora: sinistroString,
                codigo_sinistro: processoUp,
                dt_inicial: DtInicial,
                dt_final: DtFinal,
                descricao_tarefa: descString,
                tp_incidencia: incidencia,
                regulador_prestador: executante,
            }])
            .select()
            .maybeSingle();

        if (error) throw error;
        return importTS;
    },

    async selectTS(processo, DtInicialL, DtFinalL) {
        const { data: selectTS, error } = await supabase
            .from('view_atividades_sinistros')
            .select('seguradora, segurado, nro_seguradora, codigo_sinistro, dt_inicial, dt_final, descricao_tarefa, tp_incidencia, regulador_prestador')
            .eq('codigo_sinistro', processo)
            .gte('dt_inicial', DtInicialL.toISOString())
            .lte('dt_final', DtFinalL.toISOString())
            .order('dt_inicial', { ascending: true });

        if (error) throw error;
        
       
        return selectTS ;
    },

    async valorH(seguradora) {
        console.log("Consultando honorarios para a seguradora:", seguradora);
        
        let searchName = seguradora;
        if (typeof searchName === 'string') {
            searchName = searchName.trim();
        }

        const { data: valorH, error } = await supabase
            .from('honorarios_seguradora')
            .select('valor_atual')
            .ilike('seguradora', `%${searchName}%`)
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("Erro na busca do banco:", error);
            throw error;
        }
        
        if (!valorH) {
            console.warn(`⚠️ Seguradora '${seguradora}' não encontrada na busca! Listando opções na tabela para debug:`);
            const { data: allSeguradoras } = await supabase
                .from('honorarios_seguradora')
                .select('seguradora, valor_atual');
            console.log("👉 Valores existentes no Banco:", allSeguradoras);

            return { valor_atual: 0 };
        }

        return valorH;
    },

    async totalH(processo) {
        
        const { data: activities, error } = await supabase
            .from('view_atividades_sinistros')
            .select('dt_inicial, dt_final')
            .eq('codigo_sinistro', processo);

        if (error) throw error;

        const totalMili = activities.reduce((acc, atividade) => {
            const inicio = new Date(atividade.dt_inicial);
            const fim = new Date(atividade.dt_final);
            const duracao = fim - inicio;

            return acc + (duracao > 0 ? duracao : 0);
        }, 0);

        const totalD = totalMili / 3600000;
        return totalD;
    },

    async getAllSeguradoras() {
        console.log("Consultando todas as seguradoras na tabela de honorarios...");
        const { data, error } = await supabase
            .from('honorarios_seguradora')
            .select('*');

        if (error) {
            console.error("Erro ao buscar todas as seguradoras:", error);
            throw error;
        }

        return data;
    },
    
    async selectProcesso(codigo_sinistro) {
        try {
            const { data, error } = await supabase
                .from('vw_controle_processos')
                .select('dat_ultima_cobranca,situacao')
                .eq('codigo_sinistro', codigo_sinistro)
                .maybeSingle();

            if (error) throw error;

            return data;
        } catch (error) {
            throw error;
        }
    }
};

export default TSrepo;
