// --- DADOS E CONFIGURAÇÃO ---
        
// Dados brutos (JSON Simulados)
const rawData = [
    { mes: 'Jan', ano: 2023, municipio: 'Salvador', tipo: 'Patrimonial', efetivo: 1375, ocorrencias: 1250, efetivoFem: 164 },
    { mes: 'Fev', ano: 2023, municipio: 'Salvador', tipo: 'Ronda Escolar', efetivo: 1375, ocorrencias: 1100, efetivoFem: 164 },
    { mes: 'Mar', ano: 2023, municipio: 'Feira de Santana', tipo: 'Patrimonial', efetivo: 218, ocorrencias: 550, efetivoFem: 66 },
    { mes: 'Abr', ano: 2023, municipio: 'Feira de Santana', tipo: 'Trânsito', efetivo: 218, ocorrencias: 400, efetivoFem: 66 },
    { mes: 'Mai', ano: 2023, municipio: 'Vitória da Conquista', tipo: 'Patrimonial', efetivo: 197, ocorrencias: 300, efetivoFem: 10 },
    { mes: 'Jun', ano: 2023, municipio: 'Vitória da Conquista', tipo: 'Violência Doméstica', efetivo: 197, ocorrencias: 450, efetivoFem: 10 },
    { mes: 'Jul', ano: 2023, municipio: 'Candeias', tipo: 'Trânsito', efetivo: 211, ocorrencias: 280, efetivoFem: 2 },
    { mes: 'Ago', ano: 2023, municipio: 'Candeias', tipo: 'Patrimonial', efetivo: 211, ocorrencias: 350, efetivoFem: 2 },
    { mes: 'Set', ano: 2023, municipio: 'Itabuna', tipo: 'Ronda Escolar', efetivo: 199, ocorrencias: 200, efetivoFem: 51 },
    { mes: 'Out', ano: 2023, municipio: 'Itabuna', tipo: 'Patrimonial', efetivo: 199, ocorrencias: 220, efetivoFem: 51 },
    { mes: 'Nov', ano: 2023, municipio: 'Jequié', tipo: 'Atendimento Social', efetivo: 164, ocorrencias: 600, efetivoFem: 41 },
    { mes: 'Dez', ano: 2023, municipio: 'Jequié', tipo: 'Patrimonial', efetivo: 164, ocorrencias: 750, efetivoFem: 41 },
    { mes: 'Jan', ano: 2023, municipio: 'Jequié', tipo: 'Atendimento Social', efetivo: 164, ocorrencias: 30, efetivoFem: 41 },
    { mes: 'Jan', ano: 2023, municipio: 'Salvador', tipo: 'Violência Doméstica', efetivo: 1375, ocorrencias: 250, efetivoFem: 164 },
    { mes: 'Fev', ano: 2023, municipio: 'Feira de Santana', tipo: 'Violência Doméstica', efetivo: 218, ocorrencias: 150, efetivoFem: 66 },
    { mes: 'Mar', ano: 2023, municipio: 'Vitória da Conquista', tipo: 'Atendimento Social', efetivo: 197, ocorrencias: 100, efetivoFem: 10 },
];

// Dados Fixos do Sumário Executivo
const EXECUTIVO_DATA = {
    periodo: '01/01/2023 – 31/12/2023',
    totalOcorrencias: 5700, 
    topTipologias: [
        { nome: 'Patrimonial', percentual: 35.5, volume: 2024 },
        { nome: 'Violência Doméstica', percentual: 22.0, volume: 1254 },
        { nome: 'Atendimento Social', percentual: 15.0, volume: 855 },
    ],
    topMunicipios: [
        { nome: 'Salvador', volume: 2600 },
        { nome: 'Feira de Santana', volume: 900 },
        { nome: 'Vitória da Conquista', volume: 750 },
    ],
    mediaOcorrenciasPorGuarda: 0.58, 
};

// Estrutura da Tabela e Cores para Chart.js
const COLUMNS = [
    { key: 'mes', label: 'Mês', isNumeric: false },
    { key: 'ano', label: 'Ano', isNumeric: true },
    { key: 'municipio', label: 'Município', isNumeric: false },
    { key: 'tipo', label: 'Tipologia', isNumeric: false },
    { key: 'ocorrencias', label: 'Ocorrências', isNumeric: true },
    { key: 'efetivo', label: 'Efetivo GCM', isNumeric: true },
];

const CHART_COLORS = {
    main: '#6FB7FF', // Accent
    bar: '#1B5F88', // Navy-600
    pie: ['#0A3A62', '#1B5F88', '#6FB7FF', '#072044'] // Navy variations
};

// --- ESTADO GLOBAL E VARIÁVEIS DE CONTROLE ---

let state = {
    theme: localStorage.getItem('theme') || 'light',
    page: 'dashboard',
    filters: {
        ano: '2023',
        municipio: '',
        tipo: '',
        search: '',
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        sortKey: 'ocorrencias',
        sortDirection: 'descending'
    },
    charts: {} // Armazena instâncias do Chart.js
};

// --- FUNÇÕES DE UTILIDADE E TEMA ---

function getCssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.className = state.theme;
    localStorage.setItem('theme', state.theme);
    document.getElementById('theme-toggle').innerHTML = state.theme === 'light' ? '🌙' : '☀️';
    
    // Re-renderiza os gráficos para atualizar as cores
    renderDashboard();
}

function showCustomMessage(message, bgColor) {
    const messageBox = document.getElementById('custom-message');
    messageBox.innerHTML = `<div class="p-4 rounded-xl shadow-2xl">${message}</div>`;
    messageBox.className = `${bgColor} text-white fixed bottom-5 right-5 z-50 transition-all duration-300 opacity-100 transform translate-y-0`;

    setTimeout(() => {
        messageBox.className = messageBox.className.replace('translate-y-0 opacity-100', 'translate-y-10 opacity-0');
        setTimeout(() => document.body.removeChild(messageBox), 300);
    }, 3000);
}

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// --- LÓGICA DE NAVEGAÇÃO ---

function setPage(pageName) {
    state.page = pageName;
    renderContent();
    
    // Atualiza botões do header
    document.getElementById('nav-dashboard').className = pageName === 'dashboard' ? 
        'text-color-highlight bg-color-primary/20 text-sm font-semibold p-2 rounded-md' : 
        'text-text-primary hover:bg-color-primary/10 text-sm font-semibold p-2 rounded-md';
        
    document.getElementById('nav-movam-se').className = pageName === 'movam-se' ? 
        'text-color-highlight bg-color-primary/20 text-sm font-semibold p-2 rounded-md' : 
        'text-text-primary hover:bg-color-primary/10 text-sm font-semibold p-2 rounded-md';
    
    // Adiciona/remove classe de background
    document.body.classList.remove('dashboard-bg');
    if (pageName === 'dashboard') {
        document.body.classList.add('dashboard-bg');
    }
}

// --- LÓGICA DE FILTRAGEM E DADOS ---

function handleFilterChange(key, value) {
    state.filters[key] = value;
    state.pagination.currentPage = 1; // Resetar paginação ao filtrar
    renderDashboard();
}

const debouncedSearchChange = debounce((value) => {
    handleFilterChange('search', value);
}, 300);

function applyFilters(data) {
    return data.filter(item => {
        const matchAno = state.filters.ano ? item.ano.toString() === state.filters.ano : true;
        const matchMunicipio = state.filters.municipio ? item.municipio === state.filters.municipio : true;
        const matchTipo = state.filters.tipo ? item.tipo === state.filters.tipo : true;
        
        const matchSearch = state.filters.search
            ? JSON.stringify(item).toLowerCase().includes(state.filters.search.toLowerCase())
            : true;
            
        return matchAno && matchMunicipio && matchTipo && matchSearch;
    });
}

function aggregateData(data) {
    const totalOcorrencias = data.reduce((sum, item) => sum + item.ocorrencias, 0);

    // Série Temporal (Mês)
    const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const seriesMap = data.reduce((acc, item) => {
        if (!acc[item.mes]) acc[item.mes] = 0;
        acc[item.mes] += item.ocorrencias;
        return acc;
    }, {});
    const temporalData = monthOrder.filter(m => seriesMap[m] !== undefined).map(mes => ({
        mes,
        ocorrencias: seriesMap[mes],
    }));

    // Tipologia (Pie/Donut Chart)
    const tipologias = data.reduce((acc, item) => {
        if (!acc[item.tipo]) acc[item.tipo] = 0;
        acc[item.tipo] += item.ocorrencias;
        return acc;
    }, {});
    const pieData = Object.keys(tipologias).map(tipo => ({
        name: tipo,
        value: tipologias[tipo],
    })).sort((a, b) => b.value - a.value);

    // Município (Bar Chart)
    const municipios = data.reduce((acc, item) => {
        if (!acc[item.municipio]) acc[item.municipio] = 0;
        acc[item.municipio] += item.ocorrencias;
        return acc;
    }, {});
    const barData = Object.keys(municipios).map(municipio => ({
        municipio,
        ocorrencias: municipios[municipio],
    })).sort((a, b) => b.ocorrencias - a.ocorrencias);
    
    // Cálculo de KPIs
    const kpiTotal = totalOcorrencias.toLocaleString('pt-BR');
    const kpiTopMunicipio = barData.length > 0 ? barData[0].municipio : 'N/A';
    const kpiTopOcorrencias = barData.length > 0 ? barData[0].ocorrencias.toLocaleString('pt-BR') : '';

    return { temporalData, pieData, barData, kpiTotal, kpiTopMunicipio, kpiTopOcorrencias, totalOcorrencias };
}

// --- RENDERIZAÇÃO PRINCIPAL E DOM MANIPULATION ---

function renderContent() {
    const content = document.getElementById('app-content');
    content.innerHTML = ''; // Limpa o conteúdo
    
    if (state.page === 'dashboard') {
        content.innerHTML = renderDashboardHTML();
        // Após renderizar o HTML, chama a função para popular filtros e renderizar a lógica dinâmica
        renderDashboard(); 
    } else if (state.page === 'movam-se') {
        content.innerHTML = renderMovamSePage();
    }
}

function getFilterOptions() {
    const municipios = [...new Set(rawData.map(d => d.municipio))].sort();
    const tipos = [...new Set(rawData.map(d => d.tipo))].sort();
    return { municipios, tipos };
}

function renderDashboardHTML() {
    const filterOptions = getFilterOptions();
    
    // Template HTML do Dashboard (dividido em seções para clareza)
    return `
        <!-- Hero Section -->
        <section class="text-center mb-10 p-6 rounded-xl bg-bg-secondary/90 shadow-2xl">
            <h2 class="text-4xl sm:text-5xl font-extrabold text-color-primary">
                Painel Interativo — Indicadores da GCM Bahia (2023)
            </h2>
            <p class="text-lg text-text-primary mt-3">
                Visualize, filtre e compreenda os principais dados sobre atendimento e ocorrências da Guarda Civil Municipal no estado da Bahia.
            </p>
            <p class="mt-4 max-w-3xl mx-auto text-base text-text-primary/90">
                Através deste painel interativo, apresentamos um infográfico dinâmico que reúne os registros e análises do relatório **gcm_bahia_2023**, produzido pelo Núcleo de Estatística da GCM de Salvador. Navegue pelos gráficos e tabelas, use os filtros para explorar por município, tipologia ou período, e gere relatórios exportáveis.
            </p>
        </section>

        <!-- Filtros e Controles -->
        <section class="mb-8 p-4 rounded-xl bg-bg-secondary shadow-lg border border-color-primary/10">
            <h3 class="text-xl font-bold mb-4 text-color-primary">Filtros Globais</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <!-- Filtro de Município -->
                <select id="filter-municipio" onchange="handleFilterChange('municipio', this.value)" class="p-3 border rounded-lg bg-bg-primary text-text-primary border-color-primary/30 focus:border-highlight focus:ring-1 focus:ring-highlight" aria-label="Filtrar por Município">
                    <option value="">Todos os Municípios</option>
                    ${filterOptions.municipios.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>

                <!-- Filtro de Tipologia -->
                <select id="filter-tipo" onchange="handleFilterChange('tipo', this.value)" class="p-3 border rounded-lg bg-bg-primary text-text-primary border-color-primary/30 focus:border-highlight focus:ring-1 focus:ring-highlight" aria-label="Filtrar por Tipologia de Ocorrência">
                    <option value="">Todas as Tipologias</option>
                    ${filterOptions.tipos.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>

                <!-- Busca Textual (Debounce) -->
                <input type="text" placeholder="Pesquisa em toda a tabela..." oninput="debouncedSearchChange(this.value)" class="p-3 border rounded-lg bg-bg-primary text-text-primary border-color-primary/30 focus:border-highlight focus:ring-1 focus:ring-highlight" aria-label="Pesquisa textual com debounce" />

                <!-- Botões de Ação -->
                <div class="flex space-x-2">
                    <button onclick="clearFilters()" class="w-full p-3 bg-color-primary/20 text-color-primary font-bold rounded-lg hover:bg-color-primary/30">
                        Limpar Filtros
                    </button>
                    <button onclick="handleExportCSV()" class="w-full p-3 bg-color-highlight text-white font-bold rounded-lg shadow-md hover:bg-highlight/90">
                        Exportar CSV
                    </button>
                </div>
            </div>
        </section>

        <!-- Painéis de KPI -->
        <section id="kpi-section" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <!-- KPIs serão injetados aqui -->
        </section>

        <!-- Área de Gráficos -->
        <section class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

            <!-- 1. Série Temporal (Linha) -->
            <div class="card bg-bg-secondary p-4 rounded-xl shadow-lg border border-color-primary/10 h-[400px]">
                <h3 class="text-lg font-bold mb-2 text-color-primary">Série Temporal de Ocorrências por Mês</h3>
                <div class="w-full h-[320px]"><canvas id="chart-temporal"></canvas></div>
            </div>

            <!-- 2. Barras por Município -->
            <div class="card bg-bg-secondary p-4 rounded-xl shadow-lg border border-color-primary/10 h-[400px]">
                <h3 class="text-lg font-bold mb-2 text-color-primary">Top Ocorrências por Município</h3>
                <div class="w-full h-[320px]"><canvas id="chart-bar"></canvas></div>
            </div>

            <!-- 3. Donut para Composição de Tipologia -->
            <div class="card bg-bg-secondary p-4 rounded-xl shadow-lg border border-color-primary/10 h-[400px]">
                <h3 class="text-lg font-bold mb-2 text-color-primary">Composição de Ocorrências por Tipologia</h3>
                <div class="w-full h-[320px]"><canvas id="chart-pie"></canvas></div>
            </div>
        </section>

        <!-- Tabela de Dados -->
        <section id="table-section">
            <!-- Tabela Dinâmica será injetada aqui -->
        </section>

        <!-- Resumo Executivo e Referência -->
        <section class="mt-8 p-6 rounded-xl bg-bg-secondary/90 shadow-lg border border-color-primary/10">
            <h3 class="text-2xl font-bold mb-4 text-color-primary">Resumo Executivo do Período ${EXECUTIVO_DATA.periodo.split(' – ')[1]} (Geral)</h3>
            <p class="text-text-primary">
              **Período analisado:** ${EXECUTIVO_DATA.periodo} | **Total de ocorrências:** ${EXECUTIVO_DATA.totalOcorrencias.toLocaleString('pt-BR')}.
            </p>
            <ul class="list-disc list-inside text-text-primary mt-2">
              <li>**Principais Tipologias:** Patrimonial (${EXECUTIVO_DATA.topTipologias[0].percentual}%), Violência Doméstica (${EXECUTIVO_DATA.topTipologias[1].percentual}%), Atendimento Social (${EXECUTIVO_DATA.topTipologias[2].percentual}%).</li>
              <li>**Municípios com maior volume (Geral):** ${EXECUTIVO_DATA.topMunicipios.map(m => `${m.nome} (${m.volume.toLocaleString('pt-BR')})`).join(', ')}.</li>
            </ul>
        </section>

        <!-- Rodapé e Citação Obrigatória -->
        <footer class="mt-10 pt-4 border-t-2 border-color-primary/30 text-center text-sm text-text-primary/70">
            <p class="mb-1">
              "Dados extraídos do relatório produzido pelo **Núcleo de Estatística da GCM de Salvador** e pesquisas na internet pelo **MOVAM-SE**."
            </p>
            <p class="text-xs text-text-primary/50">
              Desenvolvido para o Movimento Azul-Marinho pela Segurança | ${new Date().getFullYear()}
            </p>
        </footer>
    `;
}

function renderMovamSePage() {
    return `
        <div class="min-h-[calc(100vh-100px)]">
            <div class="bg-bg-secondary p-8 rounded-xl shadow-2xl">
                <h2 class="text-4xl font-extrabold text-color-primary mb-6 border-b-4 border-highlight pb-2">
                    Movimento Azul-Marinho pela Segurança (MOVAM-SE)
                </h2>
                <p class="text-lg text-text-primary mb-6">
                    O MOVAM-SE atua no monitoramento da segurança municipal e na defesa dos interesses das guardas municipais.
                    Nossa missão é promover o fortalecimento e a valorização das Guardas Civis Municipais da Bahia, através de
                    pesquisas, articulação política e controle social dos indicadores de segurança.
                </p>

                <div class="grid md:grid-cols-2 gap-6 mt-8">
                    <div class="p-6 bg-color-primary/10 rounded-lg">
                        <h3 class="text-2xl font-bold text-color-primary mb-3">Iniciativas e Ações</h3>
                        <ul class="list-disc list-inside text-text-primary space-y-2">
                          <li>Monitoramento da aplicação da Lei $n^{\circ}$ 13.022/2014 (Estatuto das GCMs).</li>
                          <li>Elaboração de relatórios estatísticos anuais sobre o efetivo e estrutura das GCMs baianas.</li>
                          <li>Apoio a projetos de lei que visam melhorias nas carreiras e vencimentos.</li>
                        </ul>
                    </div>
                    <div class="p-6 bg-color-primary/10 rounded-lg">
                        <h3 class="text-2xl font-bold text-color-primary mb-3">Recursos e Contato</h3>
                        <p class="text-text-primary mb-2">
                            Clique para acessar os materiais e links institucionais:
                        </p>
                        <div class="space-y-2">
                            <a href="#" class="inline-flex items-center text-highlight hover:text-color-primary font-semibold">
                                <span>&#x1F4DC; Relatório 2023 (PDF Simulado)</span>
                            </a>
                            <br/>
                            <a href="#" class="inline-flex items-center text-highlight hover:text-color-primary font-semibold">
                                <span>&#x1F4F1; Mídias Sociais e Comunicados</span>
                            </a>
                            <br/>
                            <a href="#" class="inline-flex items-center text-highlight hover:text-color-primary font-semibold">
                                <span>&#x1F4E7; Contato Institucional</span>
                            </a>
                        </div>
                    </div>
                </div>

                <button onclick="setPage('dashboard')" class="mt-8 px-6 py-3 bg-color-primary text-white font-bold rounded-xl shadow-md hover:bg-color-primary/90">
                    &larr; Voltar para o Painel de Indicadores
                </button>
            </div>
        </div>
    `;
}

// Função principal de renderização do Dashboard (chamada após filtros)
function renderDashboard() {
    const filteredData = applyFilters(rawData);
    const data = aggregateData(filteredData);

    renderKPIs(data);
    renderCharts(data);
    renderTable(filteredData);
    
    // Atualiza o estado dos filtros (necessário ao carregar)
    const filterMunicipio = document.getElementById('filter-municipio');
    if (filterMunicipio) filterMunicipio.value = state.filters.municipio;
    
    const filterTipo = document.getElementById('filter-tipo');
    if (filterTipo) filterTipo.value = state.filters.tipo;
}

function clearFilters() {
    state.filters = { ano: '2023', municipio: '', tipo: '', search: '' };
    document.getElementById('filter-municipio').value = '';
    document.getElementById('filter-tipo').value = '';
    document.querySelector('input[type="text"]').value = '';
    renderDashboard();
}

function renderKPIs(data) {
    const kpiSection = document.getElementById('kpi-section');
    kpiSection.innerHTML = `
        ${renderKpiCard("Total Ocorrências (Filtrado)", data.kpiTotal, `Total no ano de ${state.filters.ano}`)}
        ${renderKpiCard("Tipologia Principal (Total)", EXECUTIVO_DATA.topTipologias[0].nome, `${EXECUTIVO_DATA.topTipologias[0].percentual}% do total analisado`)}
        ${renderKpiCard("Média Ocorr. por Guarda", EXECUTIVO_DATA.mediaOcorrenciasPorGuarda.toFixed(2), `Base: 9.816 GCMs (Efetivo Total)`)}
        ${renderKpiCard("Município com Mais Ocorr.", data.kpiTopMunicipio, `${data.kpiTopOcorrencias} ocorrências (Filtrado)`)}
    `;
}

function renderKpiCard(title, value, unit) {
    return `
        <div class="card bg-bg-secondary p-4 rounded-xl shadow-lg border border-color-primary/10">
            <p class="text-sm font-semibold text-color-primary/80">${title}</p>
            <div class="text-3xl font-bold mt-1 text-color-primary">
                ${value}
            </div>
            ${unit ? `<p class="text-xs text-color-highlight">${unit}</p>` : ''}
        </div>
    `;
}

// --- RENDERIZAÇÃO DOS GRÁFICOS (CHART.JS) ---

function updateChart(chartId, config) {
    if (state.charts[chartId]) {
        state.charts[chartId].destroy();
    }
    const ctx = document.getElementById(chartId).getContext('2d');
    state.charts[chartId] = new Chart(ctx, config);
}

function renderCharts(data) {
    const themeColor = getCssVar('--text-primary'); // Cor para rótulos/eixos

    // 1. Gráfico de Linha (Série Temporal)
    updateChart('chart-temporal', {
        type: 'line',
        data: {
            labels: data.temporalData.map(d => d.mes),
            datasets: [{
                label: 'Ocorrências',
                data: data.temporalData.map(d => d.ocorrencias),
                borderColor: CHART_COLORS.main,
                backgroundColor: CHART_COLORS.main + '80', // 50% opacity
                tension: 0.4,
                pointBackgroundColor: CHART_COLORS.pie[0],
                pointBorderColor: getCssVar('--bg-secondary'),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: themeColor }, grid: { color: getCssVar('--color-primary') + '30' } },
                y: { ticks: { color: themeColor }, grid: { color: getCssVar('--color-primary') + '30' } }
            },
            plugins: { legend: { labels: { color: themeColor } } }
        }
    });

    // 2. Gráfico de Barras (Município)
    updateChart('chart-bar', {
        type: 'bar',
        data: {
            labels: data.barData.slice(0, 5).map(d => d.municipio),
            datasets: [{
                label: 'Ocorrências',
                data: data.barData.slice(0, 5).map(d => d.ocorrencias),
                backgroundColor: CHART_COLORS.bar,
                borderRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: themeColor }, grid: { display: false } },
                y: { ticks: { color: themeColor }, grid: { color: getCssVar('--color-primary') + '30' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // 3. Gráfico de Pizza/Donut (Tipologia)
    updateChart('chart-pie', {
        type: 'doughnut',
        data: {
            labels: data.pieData.map(d => d.name),
            datasets: [{
                label: 'Ocorrências',
                data: data.pieData.map(d => d.value),
                backgroundColor: CHART_COLORS.pie,
                borderColor: getCssVar('--bg-secondary'),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'right', labels: { color: themeColor } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = data.totalOcorrencias;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value.toLocaleString('pt-BR')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// --- RENDERIZAÇÃO DA TABELA ---

function renderTable(filteredData) {
    const tableSection = document.getElementById('table-section');
    const sortedData = sortData(filteredData);
    const paginatedData = paginateData(sortedData);
    const totalPages = Math.ceil(filteredData.length / state.pagination.itemsPerPage);
    const { currentPage, sortKey, sortDirection } = state.pagination;

    if (filteredData.length === 0) {
        tableSection.innerHTML = `
            <div class="w-full bg-bg-secondary p-4 rounded-xl shadow-lg border border-color-primary/10 mt-6 text-center text-text-primary/70">
                Nenhum registro encontrado com os filtros aplicados.
            </div>
        `;
        return;
    }

    // Cria o cabeçalho da tabela
    const tableHeader = COLUMNS.map(col => `
        <th 
            class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:opacity-80"
            onclick="requestSort('${col.key}')"
        >
            ${col.label} ${sortKey === col.key ? (sortDirection === 'ascending' ? ' ▲' : ' ▼') : ''}
        </th>
    `).join('');

    // Cria as linhas da tabela
    const tableRows = paginatedData.map(item => `
        <tr class="hover:bg-color-primary/5 border-b border-color-primary/10">
            ${COLUMNS.map(col => `
                <td class="px-4 py-2 whitespace-nowrap text-sm ${col.isNumeric ? 'text-right font-mono' : 'text-left'}">
                    ${item[col.key] ? item[col.key].toLocaleString('pt-BR') : '-'}
                </td>
            `).join('')}
        </tr>
    `).join('');

    // Injeta o HTML completo da Tabela
    tableSection.innerHTML = `
        <div class="w-full overflow-x-auto bg-bg-secondary p-4 rounded-xl shadow-lg border border-color-primary/10 mt-6">
            <h3 class="text-xl font-bold mb-4 text-color-primary">Tabela Dinâmica de Ocorrências (${filteredData.length} Registros)</h3>
            <table class="min-w-full divide-y divide-color-primary/20 text-text-primary">
                <thead>
                    <tr class="bg-color-primary/80 text-white rounded-t-lg">${tableHeader}</tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
            
            <!-- Paginação -->
            <div class="flex justify-between items-center mt-4 text-sm">
                <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 bg-color-primary/20 text-color-primary rounded-md disabled:opacity-50 hover:bg-color-primary/30">
                    Anterior
                </button>
                <span>Página ${currentPage} de ${totalPages}</span>
                <button onclick="changePage(1)" ${currentPage >= totalPages ? 'disabled' : ''} class="px-3 py-1 bg-color-primary/20 text-color-primary rounded-md disabled:opacity-50 hover:bg-color-primary/30">
                    Próxima
                </button>
            </div>
        </div>
    `;
}

// Funções de Suporte à Tabela
function sortData(data) {
    const { sortKey, sortDirection } = state.pagination;
    if (!sortKey) return data;

    return data.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal < bVal) return sortDirection === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'ascending' ? 1 : -1;
        return 0;
    });
}

function paginateData(data) {
    const { currentPage, itemsPerPage } = state.pagination;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
}

function requestSort(key) {
    let direction = 'ascending';
    if (state.pagination.sortKey === key && state.pagination.sortDirection === 'ascending') {
        direction = 'descending';
    }
    state.pagination.sortKey = key;
    state.pagination.sortDirection = direction;
    state.pagination.currentPage = 1; // Resetar página
    renderDashboard();
}

function changePage(direction) {
    const filteredData = applyFilters(rawData);
    const totalPages = Math.ceil(filteredData.length / state.pagination.itemsPerPage);
    
    const newPage = state.pagination.currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        state.pagination.currentPage = newPage;
        renderDashboard();
    }
}

function handleExportCSV() {
    const filteredData = applyFilters(rawData);
    const header = COLUMNS.map(c => c.label).join(';');
    const rows = filteredData.map(e => COLUMNS.map(c => e[c.key]).join(';')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + header + '\n' + rows;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "movamse_dados_gcm.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showCustomMessage('Exportação CSV iniciada com sucesso!', 'bg-green-600');
}

// --- INICIALIZAÇÃO ---

function initApp() {
    // Aplica o tema inicial
    document.documentElement.className = state.theme;
    document.getElementById('theme-toggle').innerHTML = state.theme === 'light' ? '🌙' : '☀️';

    // Carrega a página inicial
    setPage(state.page); 
}

window.onload = initApp;
