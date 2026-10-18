import readline from "readline";

// Classe que servirá como vértice do grafo
class PontoTuristico {
    constructor(public id: string) { }
}

// Classe que servirá como aresta do grafo
class Trilha {
    constructor(
        public id: string,
        public distancia: number,
        public pontosTuristicos: PontoTuristico[],
    ) { }
}

// Variáveis globais
const pontosTuristicos: PontoTuristico[] = [];
const trilhas: Trilha[] = [];

// Métodos auxiliares para entrada de dados
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function pergunta(texto: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(texto, resolve);
    });
}

// =============== Lógica do programa ===============
// Método para coordenar ações escolhidas pelo usuário no menu principal
async function main() {
    let opcao: string;

    do {
        console.log("\n==============================");
        console.log("       SISTEMA DE GRAFOS");
        console.log("==============================");
        console.log("1 - Cadastrar ponto turístico");
        console.log("2 - Listar pontos turísticos");
        console.log("3 - Cadastrar trilha");
        console.log("4 - Listar trilhas");
        console.log("5 - Gerar lista de adjacência");
        console.log("6 - Ver menores caminhos por Dijkstra");
        console.log("7 - Gerar AGM por Kruskal");
        console.log("0 - Sair");
        console.log("==============================");

        opcao = await pergunta("Escolha uma opção: ");

        switch (opcao) {
            case "1":
                await cadastrarPontoTuristico();
                break;

            case "2":
                await listarPontosTuristicos();
                break;

            case "3":
                await cadastrarTrilha();
                break;

            case "4":
                await listarTrilhas();
                break;

            case "5":
                await listarAdjacencia();
                break;

            case "6":
                await analisarDijkstra();
                break;

            case "7":
                await arvoreDeKruskal();
                break;

            case "0":
                console.log("Encerrando...");
                rl.close();
                break;

            default:
                console.log("ERRO: Opção inválida.");
        }
    } while (opcao !== "0");
}

// Cadastra um novo ponto turístico (vértice)
async function cadastrarPontoTuristico() {
    console.log("\n=== CADASTRO DE PONTO TURÍSTICO ===");

    const id = (await pergunta("Digite o ID (nome) do ponto turístico: ")).trim();

    if (id === "") {
        console.log("ERRO: O ID não pode ser vazio.");
        return;
    }

    if (pontosTuristicos.some((p) => p.id === id)) {
        console.log("ERRO: Já existe um ponto turístico com esse ID.");
        return;
    }

    pontosTuristicos.push(new PontoTuristico(id));

    console.log(`Ponto turístico "${id}" cadastrado com sucesso!`);
}

// Lista os pontos turísticos cadastrados
async function listarPontosTuristicos() {
    console.log("\n=== PONTOS TURÍSTICOS CADASTRADOS ===");

    if (pontosTuristicos.length === 0) {
        console.log("Nenhum ponto turístico cadastrado.");
        return;
    }

    pontosTuristicos.forEach((ponto) => {
        console.log(`- ${ponto.id}`);
    });
}

// Cadastra uma nova trilha (aresta) com validações dos pontos turísticos
async function cadastrarTrilha() {
    console.log("\n=== CADASTRO DE TRILHA ===");

    const id = (await pergunta("Digite o ID (nome) da trilha: ")).trim();

    if (id === "") {
        console.log("ERRO: O ID não pode ser vazio.");
        return;
    }

    if (trilhas.some((t) => t.id === id)) {
        console.log("ERRO: Já existe uma trilha com esse ID.");
        return;
    }

    const distancia = parseFloat(
        (await pergunta("Digite a distância (peso) da trilha em metros: ")).replace(",", "."),
    );

    if (isNaN(distancia) || distancia <= 0) {
        console.log("ERRO: A distância deve ser um número maior que zero.");
        return;
    }

    const pontoIds = (
        await pergunta(
            "Digite o ID dos pontos turísticos que a trilha interliga, separados por vírgula (ex: ponto1,ponto2): ",
        )
    )
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p !== "");

    const naoEncontrados = pontoIds.filter(
        (pid) => !pontosTuristicos.some((p) => p.id === pid),
    );
    if (naoEncontrados.length > 0) {
        console.log(`ERRO: Pontos turísticos não encontrados: ${naoEncontrados.join(", ")}`);
        return;
    }

    if (pontoIds.length !== 2) {
        console.log(
            `ERRO: Toda trilha deve interligar exatamente dois pontos turísticos. Você informou ${pontoIds.length}.`,
        );
        return;
    }

    if (pontoIds[0] === pontoIds[1]) {
        console.log("ERRO: Uma trilha não pode ligar um ponto turístico a ele mesmo.");
        return;
    }

    const pontosEncontrados = pontoIds.map(
        (pid) => pontosTuristicos.find((p) => p.id === pid)!,
    );

    trilhas.push(new Trilha(id, distancia, pontosEncontrados));

    console.log(`Trilha "${id}" cadastrada com sucesso!`);
}

// Lista as trilhas cadastradas
async function listarTrilhas() {
    console.log("\n=== TRILHAS CADASTRADAS ===");

    if (trilhas.length === 0) {
        console.log("Nenhuma trilha cadastrada.");
        return;
    }

    trilhas.forEach((trilha) => {
        const pontos = trilha.pontosTuristicos.map((p) => p.id).join(", ");
        console.log(`- ${trilha.id} (${trilha.distancia}m) - Pontos turísticos: ${pontos}`);
    });
}

// Lista as trilhas e pontos por lista de adjacência
async function listarAdjacencia() {
    console.log("\n=== LISTA DE ADJACÊNCIA ===");

    if (pontosTuristicos.length === 0) {
        console.log("Nenhum ponto turístico cadastrado.");
        return;
    }

    // Monta a lista de adjacência: ponto -> [{ vizinho, trilha, distancia }]
    const adjacencia = new Map<
        string,
        { vizinho: string; trilha: string; distancia: number }[]
    >();

    pontosTuristicos.forEach((ponto) => adjacencia.set(ponto.id, []));

    trilhas.forEach((trilha) => {
        const [a, b] = trilha.pontosTuristicos;

        // Grafo não direcionado: registra a ligação nos dois sentidos
        adjacencia.get(a.id)!.push({ vizinho: b.id, trilha: trilha.id, distancia: trilha.distancia });
        adjacencia.get(b.id)!.push({ vizinho: a.id, trilha: trilha.id, distancia: trilha.distancia });
    });

    // Imprime a lista
    adjacencia.forEach((ligacoes, pontoId) => {
        if (ligacoes.length === 0) {
            console.log(`${pontoId} -> (sem ligações)`);
            return;
        }

        const texto = ligacoes
            .map((l) => `${l.vizinho} [${l.trilha}, ${l.distancia}m]`)
            .join(" -> ");

        console.log(`${pontoId} -> ${texto}`);
    });
}

// Implementação de algoritmo de Dijkstra
async function analisarDijkstra() {
    console.log("\n=== MENORES CAMINHOS POR DIJKSTRA ===");

    if (pontosTuristicos.length === 0) {
        console.log("Nenhum ponto turístico cadastrado.");
        return;
    }

    const idInicial = (await pergunta(
        "Digite o ID do ponto turístico inicial: "
    )).trim();

    const inicial = pontosTuristicos.find(p => p.id === idInicial);

    if (!inicial) {
        console.log("ERRO: Ponto turístico não encontrado.");
        return;
    }

    const distancias: number[] = pontosTuristicos.map(() => Infinity);
    const visitados: boolean[] = pontosTuristicos.map(() => false);
    const anteriores: number[] = pontosTuristicos.map(() => -1);

    const indiceInicial = pontosTuristicos.indexOf(inicial);
    distancias[indiceInicial] = 0;

    for (let i = 0; i < pontosTuristicos.length; i++) {
        let indiceAtual = -1;
        let menorDistancia = Infinity;

        // Encontra o ponto não visitado com menor distância
        for (let j = 0; j < pontosTuristicos.length; j++) {
            if (!visitados[j] && distancias[j] < menorDistancia) {
                menorDistancia = distancias[j];
                indiceAtual = j;
            }
        }

        // Os pontos restantes são inalcançáveis
        if (indiceAtual === -1) {
            break;
        }

        visitados[indiceAtual] = true;
        const atual = pontosTuristicos[indiceAtual];

        // Analisa as trilhas conectadas ao ponto atual
        for (const trilha of trilhas) {
            const [a, b] = trilha.pontosTuristicos;
            let vizinho: PontoTuristico | undefined;

            if (a === atual) {
                vizinho = b;
            } else if (b === atual) {
                vizinho = a;
            }

            if (!vizinho) {
                continue;
            }

            const indiceVizinho = pontosTuristicos.indexOf(vizinho);

            if (visitados[indiceVizinho]) {
                continue;
            }

            const novaDistancia =
                distancias[indiceAtual] + trilha.distancia;

            if (novaDistancia < distancias[indiceVizinho]) {
                distancias[indiceVizinho] = novaDistancia;
                anteriores[indiceVizinho] = indiceAtual;
            }
        }
    }

    console.log(`\nMenores caminhos a partir de ${inicial.id}:`);

    for (let i = 0; i < pontosTuristicos.length; i++) {
        const destino = pontosTuristicos[i];

        if (i === indiceInicial) {
            console.log(`${destino.id}: custo 0 | Caminho: ${destino.id}`);
            continue;
        }

        if (distancias[i] === Infinity) {
            console.log(`${destino.id}: não existe caminho`);
            continue;
        }

        const caminho: string[] = [];
        let indice = i;

        // Reconstrói o caminho voltando pelos pontos anteriores
        while (indice !== -1) {
            caminho.unshift(pontosTuristicos[indice].id);
            indice = anteriores[indice];
        }

        console.log(`${destino.id}: custo ${distancias[i]}m | Caminho: ${caminho.join(" -> ")}`);
    }
}

// Implementação de arvore geradora minima por Kruskal
async function arvoreDeKruskal() {
    console.log("\n=== ARVORE GERADORA MINIMA POR KRUSKAL ===");

    const trilhasOrdenadasPorMenorDistancia: Trilha[] = [...trilhas].sort((trilhaA, trilhaB) => {
        return trilhaA.distancia - trilhaB.distancia
    })

    const agm: Trilha[] = []

    for (const trilha of trilhasOrdenadasPorMenorDistancia) {
        if (exiteCaminhoPossivel(trilha.pontosTuristicos[0], trilha.pontosTuristicos[1], agm) == false) {
            agm.push(trilha)
        }
    }

    console.log("\n=== RESULTADO DA AGM ===");

    let distanciaTotal = 0;

    for (const trilha of agm) {
        const [a, b] = trilha.pontosTuristicos;

        console.log(`${trilha.id}: ${a.id} - ${b.id} (${trilha.distancia}m)`);
        distanciaTotal += trilha.distancia;
    }

    console.log(`Distância total (soma total dos pesos): ${distanciaTotal}m`);
}

function exiteCaminhoPossivel(pontoOrigem: PontoTuristico, pontoDestino: PontoTuristico, agm: Trilha[]) {
    const visitados: PontoTuristico[] = [pontoOrigem];

    for (let i = 0; i < visitados.length; i++) {
        const atual = visitados[i];

        if (atual === pontoDestino) {
            return true;
        }

        for (const trilha of agm) {
            const [a, b] = trilha.pontosTuristicos;

            if (a === atual && !visitados.includes(b)) {
                visitados.push(b);
            } else if (b === atual && !visitados.includes(a)) {
                visitados.push(a);
            }
        }
    }

    return false;
}

main();