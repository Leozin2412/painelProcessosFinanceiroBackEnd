import TSrepo from "../repository/TSrepositories.js";
import excel from "exceljs"
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const TScontroller = {
    testValorH: async (req, res) => {
        try {
            const seguradora = req.body.seguradora || req.query.seguradora;
            if (!seguradora) {
                return res.status(400).json({ ok: false, message: "Parâmetro 'seguradora' não informado para teste" });
            }

            console.log("➡️ [TEST ROUTE] Buscando valor para:", seguradora);
            const resultado = await TSrepo.valorH(seguradora);

            return res.status(200).json({ ok: true, data: resultado });
        } catch (error) {
            console.error("Erro no testValorH", error);
            return res.status(500).json({ ok: false, message: "Erro ao testar valorH", error: error.message });
        }
    },

    testGetAllSeguradoras: async (req, res) => {
        try {
            console.log("➡️ [TEST ROUTE] Buscando todas as seguradoras para debug");
            const resultado = await TSrepo.getAllSeguradoras();
            console.log("👉 Total de registros encontrados tb honorarios_seguradora:", resultado?.length || 0);
            console.log("👉 Registros:", resultado);

            return res.status(200).json({ ok: true, quantidade: resultado?.length || 0, data: resultado });
        } catch (error) {
            console.error("Erro no testGetAllSeguradoras", error);
            return res.status(500).json({ ok: false, message: "Erro ao testar get all seguradoras", error: error.message });
        }
    },

    importTS: async (req, res) => {
        try {
            const { seguradora, segurado, sinistro, processo, DtInicial, DtFinal, desc, incidencia, executante } = req.body;
            const msgErrors = [];

            if (!processo) msgErrors.push("Processo não informado")
            if (!DtInicial) msgErrors.push("Data Inicial não informada")
            if (!DtFinal) msgErrors.push("Data Final não informada")
            if (!desc) msgErrors.push("Descrição não informada")
            if (!incidencia) msgErrors.push("Tipo de Incidência não informado")
            if (!executante) msgErrors.push("Perito não informado")

            if (msgErrors.length > 0) {
                return res.status(400).json({ ok: false, message: msgErrors.join(', ') });
            }

            const TSimportado = await TSrepo.importTS(seguradora, segurado, sinistro, processo, DtInicial, DtFinal, desc, incidencia, executante)
            return res.status(200).json({ ok: true, message: "Timesheets importados com sucesso", data: TSimportado })

        } catch (error) {
            console.error("Erro ao importa TimeSheets", error);
            return res.status(500).json({ ok: false, message: "Erro ao importa TimeSheets" })
        }
    },

    selectTS: async (req, res) => {
        try {
            const { processo, DtInicial, DtFinal } = req.body;
            const msgErrors = [];
            const DtInicialL = new Date(DtInicial)
            const DtFinalL = new Date(DtFinal)
            if (!processo) msgErrors.push("Processo não informado")
            if (!DtInicial) msgErrors.push("Data Inicial não informada")
            if (!DtFinal) msgErrors.push("Data Final não informada")

            if (msgErrors.length > 0) {
                return res.status(400).json({ ok: false, message: msgErrors.join(', ') });
            }

            const TSfiltrado = await TSrepo.selectTS(processo, DtInicialL, DtFinalL)
            const array = TSfiltrado.length
            return res.status(200).json({ ok: true, message: "Timesheets selecionados com sucesso!", data: TSfiltrado, array })

        } catch (error) {
            console.error("Erro ao importa TimeSheets", error);
            return res.status(500).json({ ok: false, message: "Erro ao importa TimeSheets" })
        }
    },

    exportTS: async (req, res) => {
        try {
            const { processo, DtInicial, DtFinal } = req.body;
            const msgErrors = [];
            const DtInicialL = new Date(DtInicial)
            const DtFinalL = new Date(DtFinal)
            if (!processo) msgErrors.push("Processo não informado")
            if (!DtInicial) msgErrors.push("Data Inicial não informada")
            if (!DtFinal) msgErrors.push("Data Final não informada")
            if (msgErrors.length > 0) {
                return res.status(400).json({ ok: false, message: msgErrors.join(', ') });
            }

            const TSfiltrado = await TSrepo.selectTS(processo, DtInicialL, DtFinalL)
            const processos= await TSrepo.selectProcesso(processo)
            if (!TSfiltrado || TSfiltrado.length === 0) {
                return res.status(404).json({ message: "Nenhum dado encontrado para os filtros fornecidos." });
            }

            const firstItem = TSfiltrado[0];
            console.log(firstItem)
            const TsFiltradoLength = TSfiltrado.length
            const finalItem = TSfiltrado[TsFiltradoLength - 1]
            const workbook = new excel.Workbook();
            workbook.creator = 'Leonardo Monteiro';
            workbook.created = new Date()

            const seguradora = firstItem.seguradora
            const Hon = await TSrepo.valorH(seguradora)
            console.log(Hon)

            const resumo = workbook.addWorksheet('Resumo');


            const worksheetMap = {
                'Causa': workbook.addWorksheet('Causa'),
                'Prejuízo Cívil': workbook.addWorksheet('Prejuízo Civil'),
                'Prejuízo Mecânica': workbook.addWorksheet('Prejuízo Mecânica'),
                'Prejuízo Química': workbook.addWorksheet('Prejuízo Química'),
                'Prejuízo Metalurgia': workbook.addWorksheet('Prejuízo Metalurgia'),
                'Prejuízo Elétrica Eletrônica': workbook.addWorksheet('Prejuízo Elétrica Eletrônica'),
                'Prejuízo Transporte': workbook.addWorksheet('Prejuízo Transporte'),
                'Assistência Técnica Incêndio': workbook.addWorksheet('Assistência Técnica Incêndio'),
                'Assistência Técnica Cívil': workbook.addWorksheet('Assistência Técnica Civil'),
                'Assistência Técnica Elétrica': workbook.addWorksheet('Assistência Técnica Elétrica'),
                'Assistência Técnica Mecânica': workbook.addWorksheet('Assistência Técnica Mecânica'),
                'Assistência Técnica Química': workbook.addWorksheet('Assistência Técnica Química'),
                'Assistência Técnica Metalurgia': workbook.addWorksheet('Assistência Técnica Metalurgia'),
                '3D': workbook.addWorksheet('3D'),
                'Massificados': workbook.addWorksheet('Massificados'),
                'Atividade Interna': workbook.addWorksheet('Atividade Interna'),
                'Analise de Documentos': workbook.addWorksheet('Análise de Documentos'),
                'Reunião': workbook.addWorksheet('Reunião'),
                'Relatório': workbook.addWorksheet('Relatório'),
                'Viagem': workbook.addWorksheet('Viagem'),
                'Vistoria': workbook.addWorksheet('Vistoria')
            };


            const groupedData = TSfiltrado.reduce((acc, item) => {
                const key = item.tp_incidencia;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(item);
                return acc;
            }, {});
            // console.log('CHAVES AGRUPADAS (groupedData):', Object.keys(groupedData));
            //Função para incluir a logo    
            const logoPath = path.join(__dirname, '..', '..', 'img', 'logo.png');
            if (!fs.existsSync(logoPath)) {
                throw new Error(`Logo não encontrado em: ${logoPath}`);
            }
            const logoImage = workbook.addImage({
                buffer: fs.readFileSync(logoPath),
                extension: 'png',
            });

            // 3. FORMATAR CADA WORKSHEET QUE TEM DADOS
            // console.log('CHAVES DO MAPA (worksheetMap):', Object.keys(worksheetMap));
            for (const incidencia in groupedData) {
                const worksheet = worksheetMap[incidencia];
                const dataForSheet = groupedData[incidencia];

                if (worksheet && dataForSheet.length > 0) {

                    // --- CABEÇALHO PRINCIPAL (LINHA 1) ---
                    worksheet.mergeCells('A1:F1');
                    const headerCell = worksheet.getCell('A1');
                    worksheet.getRow(1).height = 121.5;


                    headerCell.value = {
                        richText: [
                            { font: { bold: true, size: 12, name: 'Arial' }, text: 'Boletim de Horas Trabalhadas\n' },
                            { font: { bold: true, size: 11, name: 'Arial' }, text: `SEGURADORA: ${firstItem.seguradora}\n` }, // Substitua pela variável correta
                            { font: { size: 11, name: 'Arial' }, text: `Sinistro: ${firstItem.nro_seguradora}\n` },
                            { font: { size: 11, name: 'Arial' }, text: `Segurado: ${firstItem.segurado}\n` },
                            { font: { size: 11, name: 'Arial' }, text: `Nº Tradsul: ${firstItem.codigo_sinistro}` },
                        ],
                    };

                    headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    headerCell.border = {
                        top: { style: 'thick' }, left: { style: 'thick' },
                        bottom: { style: 'thick' }, right: { style: 'thick' }
                    };

                    worksheet.addImage(logoImage, {
                        tl: { col: 0.1, row: 0.1 }, // Posição (coluna A, linha 1 com pequena margem)
                        ext: { width: 157, height: 120 } // Tamanho da imagem
                    });

                    // --- CABEÇALHO DA TABELA (LINHA 2) ---
                    const tableHeaders = ['Data', 'Serviço Executado', 'Hora Início', 'Hora Término', 'Horas', 'Executante'];
                    const headerRow = worksheet.getRow(2);
                    headerRow.values = tableHeaders;
                    headerRow.font = { bold: true, name: 'Arial', size: 11 };
                    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

                    // Ajustar largura das colunas
                    worksheet.columns = [
                        { key: 'data', width: 12 }, { key: 'servico', width: 45 },
                        { key: 'hInicio', width: 12 }, { key: 'hTermino', width: 12 },
                        { key: 'horas', width: 10 }, { key: 'executante', width: 25 },
                    ];

                    // --- DADOS DA TABELA (A PARTIR DA LINHA 3) ---
                    dataForSheet.forEach((item, index) => {
                        const rowNumber = 3 + index;
                        const dtInicial = new Date(item.dt_inicial);
                        const dtFinal = new Date(item.dt_final);

                        worksheet.addRow({
                            data: dtInicial,
                            servico: item.descricao_tarefa,
                            hInicio: dtInicial,
                            hTermino: dtFinal,
                            horas: { formula: `=(D${rowNumber}-C${rowNumber})*24` },
                            executante: item.regulador_prestador
                        });

                        // Formatação das células na linha adicionada
                        worksheet.getCell(`A${rowNumber}`).numFmt = 'dd/mm/yyyy';
                        worksheet.getCell(`C${rowNumber}`).numFmt = 'hh:mm';
                        worksheet.getCell(`D${rowNumber}`).numFmt = 'hh:mm';
                        worksheet.getCell(`E${rowNumber}`).numFmt = '#,##0.00';
                        worksheet.getCell(`B${rowNumber}`).alignment = { wrapText: true };
                    });

                    // --- RODAPÉ DE TOTAIS (APÓS OS DADOS) ---
                    const lastDataRow = 2 + dataForSheet.length;
                    const totalHorasRow = worksheet.addRow([]);
                    totalHorasRow.getCell('B').value = "Horas Trabalhadas";
                    totalHorasRow.getCell('E').value = { formula: `=SUBTOTAL(9,E3:E${lastDataRow})` };
                    totalHorasRow.getCell('E').numFmt = '#,##0.00';
                    totalHorasRow.font = { bold: true };

                    const valorHoraRow = worksheet.addRow([]);
                    valorHoraRow.getCell('B').value = "Valor Hora Tradsul";
                    valorHoraRow.getCell('E').numFmt = '"R$ "#,##0.00';
                    valorHoraRow.getCell('E').value = Number(Hon.valor_atual)

                    const totalFinalRow = worksheet.addRow([]);
                    totalFinalRow.getCell('B').value = "Total Cálculo Final";
                    totalFinalRow.getCell('B').font = { bold: true };
                    totalFinalRow.getCell('E').numFmt = '"R$ "#,##0.00';
                    totalFinalRow.getCell('E').value = { formula: `=E${valorHoraRow.number}* E${totalHorasRow.number}` }


                    // --- BORDAS DA TABELA E TOTAIS ---
                    const tableEndRow = totalFinalRow.number;
                    for (let i = 2; i <= tableEndRow; i++) {
                        ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
                            const cell = worksheet.getCell(`${col}${i}`);
                            const isOuterTop = i === 2;
                            const isOuterBottom = i === tableEndRow;
                            const isOuterLeft = col === 'A';
                            const isOuterRight = col === 'F';

                            cell.border = {
                                top: { style: isOuterTop ? 'thick' : 'thin' },
                                left: { style: isOuterLeft ? 'thick' : 'thin' },
                                bottom: { style: isOuterBottom ? 'thick' : 'thin' },
                                right: { style: isOuterRight ? 'thick' : 'thin' }
                            };
                        });
                    }

                    // --- RODAPÉ FINAL --
                    const finalFooterRowNumber = tableEndRow + 1;

                    worksheet.getRow(finalFooterRowNumber).height = 45;

                    worksheet.mergeCells(`A${finalFooterRowNumber}:F${finalFooterRowNumber}`);
                    const footerCell = worksheet.getCell(`A${finalFooterRowNumber}`);
                    footerCell.value = 'Tradsul Consultoria e Pericias Técnicas\nCREA-RJ   184154-D';
                    footerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    footerCell.border = {
                        top: { style: 'thick' }, left: { style: 'thick' },
                        bottom: { style: 'thick' }, right: { style: 'thick' }
                    };

                }
            }




            // Remover abas que não foram utilizadas
            const populatedIncidenceKeys = new Set(Object.keys(groupedData));
            const sheetsToRemoveIds = [];

            // Itera sobre TODAS as chaves de incidência que poderiam ter sido criadas como abas
            for (const dbKey in worksheetMap) {
                const worksheet = worksheetMap[dbKey];

                if (!populatedIncidenceKeys.has(dbKey) && worksheet) {
                    sheetsToRemoveIds.push(worksheet.id);
                }
            }
            sheetsToRemoveIds.forEach(sheetId => {
                workbook.removeWorksheet(sheetId);
            });

            //Criação da Aba Resumo
            // --- 1. CONFIGURAÇÃO DE ESTILOS E COLUNAS ---
            const grayFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9D9D9' } };
            const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } };
            const thinBorder = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            const centerAlignment = { vertical: 'middle', horizontal: 'center' };

            // Ajustamos as larguras: I fica vazia (estreita), J, K e L recebem o conteúdo
            resumo.getColumn('I').width = 2;
            resumo.getColumn('J').width = 25;
            resumo.getColumn('K').width = 25;
            resumo.getColumn('L').width = 45; // Coluna L agora é a mais larga para a data/histórico

            // --- 2. PROCESSAMENTO DOS DADOS (Cálculos Dinâmicos) ---
            const totaisPorAba = TSfiltrado.reduce((acc, item) => {
                const horas = (new Date(item.dt_final) - new Date(item.dt_inicial)) / (1000 * 60 * 60);
                acc[item.tp_incidencia] = (acc[item.tp_incidencia] || 0) + horas;
                return acc;
            }, {});

            const totaisPorPerito = TSfiltrado.reduce((acc, item) => {
                const horas = (new Date(item.dt_final) - new Date(item.dt_inicial)) / (1000 * 60 * 60);
                acc[item.regulador_prestador] = (acc[item.regulador_prestador] || 0) + horas;
                return acc;
            }, {});

            // --- 3. TABELA HOMEM-HORA (Colunas C e D) ---
            resumo.mergeCells('C5:D5');
            resumo.getCell('C5').value = 'Homem-hora';
            resumo.getCell('C5').fill = grayFill;
            resumo.getCell('C5').alignment = centerAlignment;

            const totalH = await TSrepo.totalH(processo)

            resumo.getCell('C6').value = 'Total de Horas';
            resumo.getCell('C6').fill = grayFill;
            resumo.getCell('D6').value = totalH

            let currentAbaRow = 7;
            for (const [nomeAba, totalHoras] of Object.entries(totaisPorAba)) {
                resumo.getCell(`C${currentAbaRow}`).value = nomeAba;
                resumo.getCell(`D${currentAbaRow}`).value = totalHoras;
                resumo.getCell(`D${currentAbaRow}`).numFmt = '#,##0.00';
                currentAbaRow++;
            }

            const rowTotalHH = currentAbaRow;
            resumo.getCell(`C${rowTotalHH}`).value = 'Total';
            resumo.getCell(`C${rowTotalHH}`).fill = grayFill;
            resumo.getCell(`D${rowTotalHH}`).value = { formula: `=SUM(D7:D${rowTotalHH - 1})` };
            resumo.getCell(`D${rowTotalHH}`).numFmt = '#,##0.00';

            resumo.getCell(`C${rowTotalHH + 1}`).value = 'V.Seg';
            resumo.getCell(`C${rowTotalHH + 1}`).fill = grayFill;
            resumo.getCell(`D${rowTotalHH + 1}`).value = { formula: `=${Hon.valor_atual}` };
            resumo.getCell(`D${rowTotalHH + 1}`).numFmt = '"R$ "#,##0.00';
            resumo.getCell(`C${rowTotalHH + 2}`).value = 'Valor NF';
            resumo.getCell(`C${rowTotalHH + 2}`).fill = grayFill;
            resumo.getCell(`D${rowTotalHH + 2}`).value = { formula: `=D${rowTotalHH}*${Hon.valor_atual}` };
            resumo.getCell(`D${rowTotalHH + 2}`).numFmt = '"R$ "#,##0.00';
            // --- 4. TABELA PERITOS/H (Colunas G e H) ---
            resumo.mergeCells('G5:H5');
            resumo.getCell('G5').value = 'PERITOS/H';
            resumo.getCell('G5').fill = grayFill;
            resumo.getCell('G5').alignment = centerAlignment;

            let currentPeritoRow = 6;
            for (const [nomePerito, totalHoras] of Object.entries(totaisPorPerito)) {
                resumo.getCell(`G${currentPeritoRow}`).value = nomePerito;
                resumo.getCell(`H${currentPeritoRow}`).value = totalHoras;
                resumo.getCell(`H${currentPeritoRow}`).numFmt = '0.00';
                currentPeritoRow++;
            }
            const rowTotalPeritos = currentPeritoRow;
            resumo.getCell('G' + rowTotalPeritos).value = 'TOTAL';
            resumo.getCell('G' + rowTotalPeritos).fill = grayFill;
            resumo.getCell('H' + rowTotalPeritos).value = { formula: `=SUM(H6:H${rowTotalPeritos - 1})` };

            // --- 5. BLOCO ESTRUTURAL (Status e Descrição) - DESLOCADO PARA J, K, L ---

            // Cobrança Anterior
            resumo.mergeCells('J11:K11');
            resumo.getCell('J11').value = 'Cobranca anterior ?';
            resumo.getCell('J11').fill = grayFill;

            resumo.getCell('L11').value = 'Data da ultima atividade cobrada';
            resumo.getCell('L11').fill = grayFill;
            //corrigir integracao de controle

            const formatarData = (isoString) => {
            if (!isoString) return '—'; // Retorna um traço se vier vazio/null

            try {
                // 1. Corta a string no "T" e pega só a primeira parte
                // Ex: "2025-08-21T08:45:00+00:00" vira "2025-08-21"
                const dataApenas = isoString.split('T')[0]; 
                
                // 2. Separa os pedaços pelo traço
                const [ano, mes, dia] = dataApenas.split('-');
                
                // 3. Remonta no padrão brasileiro
                if (ano && mes && dia) {
                return `${dia}/${mes}/${ano}`;
                }
                
                // Se por acaso vier num formato doido, devolve a original para não quebrar
                return isoString; 
            } catch (error) {
                return isoString;
            }
            };

           resumo.getCell('L12').value = formatarData(processos.dat_ultima_cobranca);
            resumo.getCell('L12').numFmt = 'dd/mm/yyyy'
            
            resumo.mergeCells('J12:K12');

            resumo.getCell('J12').alignment = centerAlignment;
            resumo.getCell('J12').value = processos.dat_ultima_cobranca? 'SIM' : 'NÃO';
            // Sinistro Concluído
            resumo.mergeCells('J14:K14');
            resumo.getCell('J14').value = 'Sinistro Concluido?';
            resumo.getCell('J14').fill = grayFill;
            resumo.getCell('L14').value = processos.situacao=='EM ABERTO'? 'NÃO' : 'SIM';

            resumo.mergeCells('J15:K15');
            resumo.getCell('J15').value = 'Mais de um sinistro para o mesmo segurado?';
            resumo.getCell('J15').fill = grayFill;
           //resumo.getCell('L15').value = 'NÃO';

            // Descrição do Sinistro
            resumo.mergeCells('J17:L17');
            resumo.getCell('J17').value = 'Descricao rapida do sinistro e historico';
            resumo.getCell('J17').fill = greenFill;
            resumo.getCell('J17').alignment = centerAlignment;

            resumo.mergeCells('J18:L25');
            resumo.getCell('J18').alignment = { vertical: 'top', horizontal: 'left', wrapText: true };

            // --- 6. BORDAS AUTOMÁTICAS ---
            const regioes = [
                { s: { r: 5, c: 3 }, e: { r: rowTotalHH + 2, c: 4 } }, // Homem-Hora (C-D)
                { s: { r: 5, c: 7 }, e: { r: rowTotalPeritos, c: 8 } }, // Peritos (G-H)
                { s: { r: 11, c: 10 }, e: { r: 12, c: 12 } },            // Cobrança (J-L)
                { s: { r: 14, c: 10 }, e: { r: 15, c: 12 } },            // Sinistro (J-L)
                { s: { r: 17, c: 10 }, e: { r: 25, c: 12 } }             // Descrição (J-L)
            ];

            regioes.forEach(regiao => {
                for (let r = regiao.s.r; r <= regiao.e.r; r++) {
                    for (let c = regiao.s.c; c <= regiao.e.c; c++) {
                        resumo.getCell(r, c).border = thinBorder;
                    }
                }
            });
            // --- CRIAÇÃO DA TABELA DE COBRANÇA (J27:M31) ---

            // 1. Definir os textos do cabeçalho
            resumo.getCell('J27').value = 'GVS';
            resumo.getCell('K27').value = 'Valor';
            resumo.getCell('L27').value = 'Data da Despesa';
            resumo.getCell('M27').value = 'Data da Cobrança';
            resumo.getColumn('M').width = '27'
            // 2. Configuração das dimensões da tabela
            const startRow = 27; // Linha do cabeçalho
            const endRow = 31;   // Cabeçalho + 4 linhas de corpo
            const startCol = 10; // Coluna J (J é a 10ª letra)
            const endCol = 13;   // Coluna M (M é a 13ª letra)

            // 3. Loop para aplicar estilos (Bordas e Cores)
            for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                    const cell = resumo.getCell(row, col);

                    // Aplica bordas simples em TODAS as células (cabeçalho e corpo)
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };

                    // Estilização exclusiva do Cabeçalho (apenas na linha 27)
                    if (row === 27) {
                        cell.font = { bold: true, name: 'Arial', size: 10 }; // Negrito
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFE0E0E0' } // Cinza Claro
                        };
                        cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    }
                }
            }
            const Minicial = firstItem.dt_inicial.replace(/_/g, ':')
            const MesInicial=new Date(Minicial).getMonth()
            const Mfinal = finalItem.dt_final.replace(/_/g, ':')      
            const MesFinal=new Date(Mfinal).getMonth()
            const Ano=new Date(Mfinal).getFullYear()
            const Mes = {
                0: "Jan",
                1: "Fev",
                2: "Mar",
                3: "Abr",
                4: "Mai",
                5: "Jun",
                6: "Jul",
                7: "Ago",
                8: "Set",
                9: "Out",
                10: "Nov",
                11: "Dez"
            }
            //console.log(MesFinal,MesInicial)

            const filename = `${!firstItem.nro_seguradora ? 'geral' : firstItem.nro_seguradora}-Parcial de ${Mes[MesInicial]} a ${Mes[MesFinal]} de ${Ano} -${firstItem.segurado || 'geral'}-${firstItem.codigo_sinistro || 'geral'}.xlsx`;
            const prohibtedCaracteres = /[:*?"<>|\n–—]/g;
            const sanitizedFilename = filename.replaceAll(prohibtedCaracteres, '_'); // Remove aspas internas se houver

            const encodedFilenameForHeader = encodeURIComponent(sanitizedFilename);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=${sanitizedFilename}`
            );

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error("Erro ao gerar o arquivo Excel:", error);
            res.status(500).json({ error: "Ocorreu um erro interno ao gerar o boletim." });
        }
    },

    // Dentro do objeto TScontroller = { ... }


    importActivities: async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
        }

        try {
            const workbook = new excel.Workbook();

            await workbook.xlsx.load(req.file.buffer);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                return res.status(400).json({ message: 'A planilha está vazia ou corrompida.' });
            }

            // --- INÍCIO DA LÓGICA INTELIGENTE ---

            // 1. Mapear os cabeçalhos para seus números de coluna
            const headerRow = worksheet.getRow(1);
            if (!headerRow.values || headerRow.values.length === 1) { // .values[0] é sempre nulo
                return res.status(400).json({ message: 'A planilha não contém um cabeçalho válido.' });
            }

            const headerMap = {};
            headerRow.eachCell((cell, colNumber) => {
                if (cell.value) {
                    // Mapeia o nome do header (ex: "NTradsul") para o número da coluna (ex: 4)
                    headerMap[cell.value.toString().trim()] = colNumber;
                }
            });

            // 2. Validar se todos os cabeçalhos necessários existem
            const requiredHeaders = [
                'Seguradora', 'Segurado', 'Nro. Seguradora', 'Codigo do Sinistro',
                'Dt. inicial', 'Dt. final', 'Descrição da tarefa', 'Tp. Incidência', 'Regulador/Prestador'
            ];

            const missingHeaders = requiredHeaders.filter(h => !headerMap[h]);
            if (missingHeaders.length > 0) {
                return res.status(400).json({
                    message: `Os seguintes cabeçalhos obrigatórios não foram encontrados na planilha: ${missingHeaders.join(', ')}`
                });
            }

            // --- FIM DA LÓGICA INTELIGENTE ---

            let successfulImports = 0;
            let failedImports = 0;
            const errors = [];

            // 3. Iterar sobre as linhas e usar o mapa de cabeçalhos para pegar os dados
            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
                const row = worksheet.getRow(rowNumber);

                // Agora pegamos os valores pelo nome da coluna, não pela posição!
                const seguradora = row.getCell(headerMap['Seguradora']).value;
                const segurado = row.getCell(headerMap['Segurado']).value;
                const sinistro = row.getCell(headerMap['Nro. Seguradora']).value;
                const processo = row.getCell(headerMap['Codigo do Sinistro']).value;
                const DtInicial = row.getCell(headerMap['Dt. inicial']).value;
                const DtFinal = row.getCell(headerMap['Dt. final']).value;
                const desc = row.getCell(headerMap['Descrição da tarefa']).value;
                const incidencia = row.getCell(headerMap['Tp. Incidência']).value;
                const executante = row.getCell(headerMap['Regulador/Prestador']).value;

                try {
                    if (!processo || !DtInicial || !DtFinal || !incidencia || !executante) {
                        console.log(processo)
                        console.log(DtInicial)
                        console.log(DtFinal)
                        //console.log(desc)
                        console.log(incidencia)
                        console.log(executante)
                        throw new Error(`Dados obrigatórios (Processo, Datas, Descrição, Incidência, Executante) estão faltando.`);
                    }


                    // Chamada para o repositório com os dados extraídos
                    const sinistroString = String(sinistro)
                    const processoString = String(processo)
                    const processoUp = processoString.toUpperCase();
                    //const descString=String(desc)

                    await TSrepo.importTS(seguradora, segurado, sinistroString, processoUp, DtInicial, DtFinal, desc, incidencia, executante);
                    successfulImports++;
                } catch (error) {
                    failedImports++;
                    errors.push(`Linha ${rowNumber}: ${error.message}`);
                    console.log(error)

                }
            }

            if (successfulImports === 0 && failedImports > 0) {
                return res.status(400).json({
                    message: `Falha ao importar todas as ${failedImports} linhas.`,
                    errors: errors
                });
            }

            return res.status(200).json({
                message: `Importação concluída! ${successfulImports} atividades salvas. ${failedImports} falhas.`,
                errors: errors
            });

        } catch (error) {
            console.error("Erro geral na importação da planilha:", error);
            return res.status(500).json({ message: error.message || 'Ocorreu um erro inesperado ao processar a planilha.' });
        }
    }

}
export default TScontroller



