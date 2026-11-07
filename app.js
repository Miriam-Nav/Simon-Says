// VARIABLES GLOBALES
let secuenciaMaquina = [];
let secuenciaUsuario = [];
let nivel = 1;
let turnoUsuario = false;
let velocidad = 800;
let coloresDisponibles = ["rojo", "amarillo", "verde", "azul"];

// ELEMENTOS
const btnStart = document.getElementById("btn-start");
const textoNivel = document.getElementById("nivel");
const botonesColores = document.querySelectorAll(".boton-color");
const tablero = document.getElementById("tablero");

// URL DE MOCKAPI
const urlMockAPI = "https://6aecfe1dfc3b911e6fd5d7b6.mockapi.io/ranking";

// ESPERA 
function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// INICIO DE PARTIDA
btnStart.addEventListener("click", () => {
    btnStart.disabled = true;
    iniciarPartida();
});

function iniciarPartida() {
    nivel = 1;
    secuenciaMaquina = [];
    velocidad = 800;
    coloresDisponibles = ["rojo", "amarillo", "verde", "azul"];


    // Añadir los colores extra a una variable
    const botonesExtra = document.querySelectorAll(".naranja, .morado, .cian, .rosa");
    // Ocultar colores de la variable botonesExtra 
    for (const boton of botonesExtra) {
        boton.classList.add("oculto");
    }

    // Limpiar clases de dificultad del tablero
    tablero.classList.remove("seis-colores", "ocho-colores");

    // Inicia primera ronda
    jugarRonda();
}

// CONTROL DE DIFICULTAD PROGRESIVA
function actualizarDificultad() {
    // A partir de la ronda 10 se acelera la velocidad 
    if (nivel >= 10) {
        velocidad = 450;
    }

    // A partir de la ronda 15 se añaden 2 colores
    if (nivel >= 15 && !coloresDisponibles.includes("naranja")) {
        coloresDisponibles.push("naranja", "morado");
        document.querySelector(".naranja").classList.remove("oculto");
        document.querySelector(".morado").classList.remove("oculto");
        tablero.classList.add("seis-colores");
    }

    // A partir de la ronda 20 se añaden otros 2 colores
    if (nivel >= 20 && !coloresDisponibles.includes("cian")) {
        coloresDisponibles.push("cian", "rosa");
        document.querySelector(".cian").classList.remove("oculto");
        document.querySelector(".rosa").classList.remove("oculto");
        tablero.classList.remove("seis-colores");
        tablero.classList.add("ocho-colores");
    }
};

// ILUMINAR BOTÓN
async function iluminarBoton(color) {
    // Botón del color elegido
    const boton = document.querySelector(`[data-color="${color}"]`);
    if (!boton) return;

    // Añade la clase de brillo
    boton.classList.add("activo");

    // Pausa la ejecución usando await
    await esperar(velocidad);

    // Quita la clase de brillo
    boton.classList.remove("activo");
}

// TURNO DE LA MÁQUINA
async function jugarRonda() {
    // Bloquear turnos y limpiar respuestas del jugador
    turnoUsuario = false;
    secuenciaUsuario = [];
    textoNivel.textContent = nivel;

    actualizarDificultad();

    // Color al azar 
    const colorAleatorio = Math.floor(Math.random() * coloresDisponibles.length);
    secuenciaMaquina.push(coloresDisponibles[colorAleatorio]);

    // Pausa antes de empezar a mostrar el patrón
    await esperar(1000);

    // Reproducir la secuencia completa acumulada
    for (const color of secuenciaMaquina) {
        await iluminarBoton(color);
        await esperar(250);
    }

    // Desbloquear tablero para que el usuario pueda jugar
    turnoUsuario = true;
};

// INTERACCIÓN DEL USUARIO
async function manejarClickBoton(e) {
    // Si la máquina está jugando ignora los clics
    if (!turnoUsuario) return;

    // Lee color ha pulsado usando data-color
    const colorElegido = e.target.dataset.color;

    // Ilumina el botón pulsado
    await iluminarBoton(colorElegido);

    // Guarda el paso del usuario
    secuenciaUsuario.push(colorElegido);

    // Comprueba si este clic es correcto
    comprobarRespuesta(secuenciaUsuario.length - 1);
}

// Recorre los botones
for (const boton of botonesColores) {
    boton.addEventListener("click", manejarClickBoton);
}

// COMPROBACIÓN DE ACIERTO O FALLO
function comprobarRespuesta(indexActual) {
    // Comrpueba color pulsado con el de la máquina
    if (secuenciaUsuario[indexActual] !== secuenciaMaquina[indexActual]) {
        // Si no coincide ha fallado y acaba el juego
        finalizarJuego();
        return;
    }

    // Si coincide comprueba que ha completado la secuencia
    if (secuenciaUsuario.length === secuenciaMaquina.length) {
        // Bloquea los clics temporalmente y sube nivel
        turnoUsuario = false;
        nivel++;

        // Espera de 1 segundo y arranca el juego de nuevo
        setTimeout(jugarRonda, 1000);
    }
}
// FIN DEL JUEGO
async function finalizarJuego() {
    turnoUsuario = false;

    // Error: pinta el fondo de rojo
    document.body.classList.add("error");
    await esperar(500);
    document.body.classList.remove("error");

    // Pide el nombre al jugador mediante una alerta
    const nombreJugador = prompt(`¡Has fallado en el nivel ${nivel}! Introduce tu nombre o alias:`) || "Anónimo";

    // Objeto con los datos de la partida
    const resultado = {
        nombre: nombreJugador,
        puntuacion: nivel,
        fecha: new Date().toLocaleDateString()
    };

    // Guardar en LocalStorage y MockAPI
    console.log("Datos de la partida:", resultado);

    // 1. Guardamos en el disco duro del navegador
    guardarEnLocalStorage(resultado);

    // 2. Enviamos a la base de datos de MockAPI
    await enviarAMockAPI(resultado);

    // Volver a habilitar el botón de Start
    btnStart.disabled = false;
}

// GUARDAR EN LOCALSTORAGE
function guardarEnLocalStorage(resultado) {
    // Lee lo que hay y si no hay nada crea array vacío
    let historial = JSON.parse(localStorage.getItem("rankingSimon")) || [];

    // Añade el resultado al historial
    historial.push(resultado);

    // Guarda de nuevo en LocalStorage
    localStorage.setItem("rankingSimon", JSON.stringify(historial));
};

// GUARDAR EN MOCKAPI Y ACTUALIZAR RANKING
async function enviarAMockAPI(resultado) {
    try {
        await fetch(urlMockAPI, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(resultado)
        });

        // Recarga la lista
        await mostrarRanking();

    } catch (error) {
        console.log("Hubo un error al conectar con MockAPI:", error);
    }
};

// DESCARGAR Y MOSTRAR EL RANKING
async function mostrarRanking() {
    try {
        // Descarga los datos de MockAPI
        const respuesta = await fetch(urlMockAPI);
        // Convierte la respuesta en JSON
        const datos = await respuesta.json();

        // Ordena de mayor a menor puntuación
        datos.sort((a, b) => b.puntuacion - a.puntuacion);

        // Selecciona el elemento donde se mostrará el ranking
        const listaRanking = document.getElementById("lista-ranking");
        // Limpia el contenido anterior
        listaRanking.innerHTML = "";

        // 5 primeros
        const mejores = datos.slice(0, 5);

        // Recorre los mejores y los añade a la lista
        for (const jugador of mejores) {
            // Crea un elemento li para cada jugador
            const li = document.createElement("li");
            li.textContent = `${jugador.nombre} - Nivel: ${jugador.puntuacion} (${jugador.fecha})`;
            listaRanking.appendChild(li);
        }
    } catch (error) {
        console.log("Hubo un error al cargar el ranking:", error);
    }
};

// AL CARGAR LA PÁGINA MOSTRAR EL RANKING
mostrarRanking();