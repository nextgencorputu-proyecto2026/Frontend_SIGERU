/* ---------------------
    CONFIGURACIÓN JWT
--------------------- */

// Clave donde guardamos el token
const TOKEN_KEY = "access_token";

// Obtener el token guardado
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// Guardar el token
function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

// Eliminar el token
function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

async function cargarCentrosEnSelect(selectId, mensajeId = null, formulario = null, valorSeleccionado = "", habilitar = true) {
    const select = document.getElementById(selectId);
    const mensaje = mensajeId ? document.getElementById(mensajeId) : null;
    const boton = formulario ? formulario.querySelector('button[type="submit"]') : null;

    select.disabled = true;
    if (boton) boton.disabled = true;
    select.innerHTML = '<option value="" selected disabled>Cargando centros...</option>';

    try {
        const respuesta = await fetch("http://localhost:8000/api/centros-acopio", {
            headers: { "Accept": "application/json", "Authorization": "Bearer " + getToken() }
        });
        const resultado = await respuesta.json();

        const centros = respuesta.ok && Array.isArray(resultado.data) ? resultado.data : [];

        select.innerHTML = '<option value="" selected disabled>Seleccione un centro</option>';
        centros.forEach(function (centro) {
            const opcion = document.createElement("option");
            opcion.value = centro.idCentro;
            opcion.textContent = centro.nombre + " — " + centro.tipo;
            select.appendChild(opcion);
        });

        if (valorSeleccionado !== "" && valorSeleccionado !== null) {
            select.value = String(valorSeleccionado);
        }
        select.disabled = !habilitar || centros.length === 0;
        if (boton) boton.disabled = centros.length === 0;
        if (mensaje) mensaje.textContent = centros.length === 0 ? "No existen centros registrados." : "";
    } catch (error) {
        select.innerHTML = '<option value="" selected disabled>No se pudieron cargar los centros</option>';
        if (mensaje) mensaje.textContent = "No se pudieron consultar los centros existentes.";
    }
}

async function cargarRutasEnSelect(selectId, tipoResiduo, valorSeleccionado = "", habilitar = true) {
    const select = document.getElementById(selectId);
    select.disabled = true;
    select.innerHTML = '<option value="">Cargando rutas...</option>';

    try {
        const respuesta = await fetch(
            "http://localhost:8000/api/rutas?tipoResiduo=" + encodeURIComponent(tipoResiduo),
            { headers: { "Accept": "application/json", "Authorization": "Bearer " + getToken() } }
        );
        const resultado = await respuesta.json();
        const rutas = respuesta.ok && Array.isArray(resultado.data) ? resultado.data : [];

        select.innerHTML = '<option value="">Sin ruta asignada</option>';
        rutas.forEach(function (ruta) {
            const opcion = document.createElement("option");
            opcion.value = ruta.idRuta;
            opcion.textContent = ruta.descripcion + " (" + ruta.horario + ")";
            select.appendChild(opcion);
        });
        select.value = valorSeleccionado === null ? "" : String(valorSeleccionado);
        select.disabled = !habilitar;
    } catch (error) {
        select.innerHTML = '<option value="">Sin ruta asignada</option>';
        select.disabled = !habilitar;
    }
}

// Si Laravel responde 401, el token venció o no es válido
function handleUnauthorized(respuesta) {

    if (respuesta.status === 401) {

        removeToken();

        window.location.href = "login.html";

        return true;
    }

    return false;
}


/* ---------------------
    CONTROL GENERAL DE 401
--------------------- */

// Guardamos el fetch original del navegador
const fetchOriginal = window.fetch.bind(window);

// Controlamos automáticamente las respuestas de los fetch
window.fetch = async function (recurso, opciones = {}) {

    const respuesta = await fetchOriginal(recurso, opciones);

    // Revisamos si esta petición llevaba Authorization
    let tieneAuthorization = false;

    if (opciones.headers) {

        if (opciones.headers instanceof Headers) {

            tieneAuthorization =
                opciones.headers.has("Authorization");

        } else {

            tieneAuthorization =
                Object.keys(opciones.headers).some(
                    clave => clave.toLowerCase() === "authorization"
                );
        }
    }

    // Solo controlamos el 401 de peticiones protegidas
    if (tieneAuthorization) {
        handleUnauthorized(respuesta);
    }

    return respuesta;
};
//  NAVBAR

async function cargarNavbar() {
    const contenedor = document.getElementById("navbar-container");

    if (!contenedor) return;

    const rutaNavbar = "./components/navbar.html";

    try {

        const respuesta = await fetch(rutaNavbar);

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP ${respuesta.status}: ${respuesta.statusText}`
            );
        }

        contenedor.innerHTML = await respuesta.text();

    } catch (error) {

        contenedor.innerHTML = `
            <div class="alert alert-danger">
                No se pudo cargar la barra de navegación.
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", cargarNavbar);



/* ---------------------
    CAMIONES
--------------------- */

// JS para API

const BusquedaCamiones = document.getElementById("formBusquedaCamiones");

if (BusquedaCamiones) {

    BusquedaCamiones.addEventListener("submit", async (e) => {

        e.preventDefault();

        const matricula = document.getElementById("inputMatricula").value.trim();

        let url = "http://127.0.0.1:8000/api/camiones";

        if (matricula !== "") {
            url += "?matricula=" + matricula;
        }

        try {

            const respuesta = await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + getToken()
                }
            });

            const camiones = await respuesta.json();

            cargarTabla(camiones);

        } catch (error) {

            console.error("Error al cargar camiones:", error);

        }

    });

}


// Funcion para cargar la tabla con los datos de los camiones

function cargarTabla(camiones) {

    const tabla = document.getElementById("tablaCamiones");

    if (!tabla) return;

    tabla.innerHTML = "";

    camiones.forEach(camion => {

        tabla.innerHTML += `

            <tr>

                <th scope="row">${camion.idVehiculo}</th>

                <td>${camion.tipo}</td>

                <td>${camion.capacidad ?? "-"}</td>

                <td>-</td>

                <td>-</td>

                <td>

                    <div class="list-group-horizontal">

                        <button 
                            class="verDatos btn btn-outline-primary btn-sm"
                            data-id="${camion.idVehiculo}"
                            data-bs-toggle="modal" 
                            data-bs-target="#datosCamiones">
                            Ver
                        </button>

                        <button class="btn btn-outline-secondary btn-sm">
                            Editar
                        </button>

                        <button 
                            class="btn btn-outline-danger btn-sm eliminarCamion"
                            data-id="${camion.idVehiculo}">
                            Eliminar
                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}


// Cargar lista de camiones al entrar a la pagina

if (document.getElementById("tablaCamiones")) {

    fetch("http://localhost:8000/api/camiones", {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": "Bearer " + getToken()
        }
    })
        .then(function (respuesta) {

            if (respuesta.status === 403) {

                alert("No tiene permisos para acceder a Camiones");

                window.location.href = "home.html";

                return null;
            }

            return respuesta.json();

        })
        .then(function (data) {

            if (!data) {
                return;
            }

            cargarTabla(data.data);

        })
        .catch(function (error) {

            console.error("Error al cargar camiones:", error);

        });

}
/* ---------------------
    VER CAMIÓN
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("verDatos")) {

        const id = e.target.getAttribute("data-id");

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/camiones/" + id,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    }
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                const camion = resultado.data;

                document.getElementById("matricula").value = camion.matricula;
                document.getElementById("tipo").value = camion.tipo;
                document.getElementById("estado").value = camion.estado;
                document.getElementById("capacidad").value = camion.capacidad ?? "";

            } else {

                alert(resultado.mensaje);

            }

        } catch (error) {

            console.error("Error al obtener el camión:", error);
            alert("Error al obtener los datos del camión");

        }

    }

});

/* ---------------------
    EDITAR CAMIÓN
--------------------- */

document.addEventListener("click", function (e) {

    if (e.target.classList.contains("btn-outline-secondary")) {

        const botonEditar = e.target;

        const fila = botonEditar.closest("tr");

        const id = fila.querySelector(".verDatos").getAttribute("data-id");

        fetch("http://localhost:8000/api/camiones/" + id, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": "Bearer " + getToken()
            }
        })
            .then(respuesta => respuesta.json())
            .then(resultado => {

                if (resultado.success) {

                    const camion = resultado.data;

                    document.getElementById("matricula").value = camion.matricula;
                    document.getElementById("tipo").value = camion.tipo;
                    document.getElementById("estado").value = camion.estado;
                    document.getElementById("capacidad").value = camion.capacidad ?? "";

                    document.getElementById("matricula").removeAttribute("readonly");
                    document.getElementById("tipo").removeAttribute("disabled");
                    document.getElementById("estado").removeAttribute("disabled");
                    document.getElementById("capacidad").removeAttribute("readonly");

                    document.getElementById("btnGuardarCamion").classList.remove("d-none");

                    const modal = new bootstrap.Modal(
                        document.getElementById("datosCamiones")
                    );

                    modal.show();

                    document.getElementById("btnGuardarCamion").setAttribute("data-id", id);

                } else {

                    alert(resultado.mensaje);

                }

            })
            .catch(error => {

                console.error("Error al editar camión:", error);
                alert("Error al obtener los datos del camión");

            });

    }

});

/* ---------------------
    GUARDAR CAMIÓN EDITADO
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.id === "btnGuardarCamion") {

        const botonGuardar = e.target;
        const id = botonGuardar.getAttribute("data-id");

        const matricula = document.getElementById("matricula").value;
        const tipo = document.getElementById("tipo").value;
        const estado = document.getElementById("estado").value;
        const capacidad = document.getElementById("capacidad").value;

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/camiones/" + id,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    },
                    body: JSON.stringify({
                        matricula: matricula,
                        tipo: tipo,
                        estado: estado,
                        capacidad: capacidad
                    })
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Camión actualizado correctamente");

                document.getElementById("matricula").setAttribute("readonly", true);
                document.getElementById("tipo").setAttribute("disabled", true);
                document.getElementById("estado").setAttribute("disabled", true);
                document.getElementById("capacidad").setAttribute("readonly", true);

                botonGuardar.classList.add("d-none");

                const modal = bootstrap.Modal.getInstance(
                    document.getElementById("datosCamiones")
                );

                modal.hide();

                location.reload();

            } else {

                alert(resultado.mensaje);

            }

        } catch (error) {

            console.error("Error al actualizar camión:", error);
            alert("Error al actualizar el camión");

        }

    }

});

/* ---------------------
    ELIMINAR CAMIÓN
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("eliminarCamion")) {

        const id = e.target.getAttribute("data-id");

        const confirmar = confirm(
            "¿Está seguro de eliminar este camión?"
        );

        if (!confirmar) {
            return;
        }

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/camiones/" + id,
                {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    }
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Camión eliminado correctamente");

                location.reload();

            } else {

                alert(
                    resultado.mensaje ||
                    "No se pudo eliminar el camión"
                );

            }

        } catch (error) {

            console.error("Error al eliminar camión:", error);
            alert("Error al eliminar el camión");

        }

    }

});

/* ---------------------
    CENTROS DE ACOPIO
--------------------- */

// Alta de centro

const formCentro = document.getElementById("formCentro");

if (formCentro) {

    const tipoCentro = document.getElementById("tipo");
    const capacidadCentro = document.getElementById("capacidad");

    function actualizarCapacidadCentro() {
        const esCentral = tipoCentro.value === "Central Operativa";
        capacidadCentro.disabled = esCentral;
        capacidadCentro.required = !esCentral;
        capacidadCentro.value = esCentral ? "" : capacidadCentro.value;
    }

    tipoCentro.addEventListener("change", actualizarCapacidadCentro);
    actualizarCapacidadCentro();

    formCentro.addEventListener("submit", async function (e) {

        e.preventDefault();

        const nombre = document.getElementById("nombre").value;
        const direccion = document.getElementById("direccion").value;
        const capacidad = tipoCentro.value === "Central Operativa" ? null : capacidadCentro.value;
        const tipo = document.getElementById("tipo").value;
        const ubicacionX = document.getElementById("ubicacionX").value;
        const ubicacionY = document.getElementById("ubicacionY").value;

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/centros-acopio",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    },
                    body: JSON.stringify({
                        nombre: nombre,
                        direccion: direccion,
                        capacidad: capacidad,
                        tipo: tipo,
                        ubicacionX: ubicacionX,
                        ubicacionY: ubicacionY
                    })
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Centro creado correctamente");

                formCentro.reset();
                actualizarCapacidadCentro();

            } else {

                alert(
                    resultado.mensaje ||
                    "No se pudo crear el centro"
                );

            }

        } catch (error) {

            console.error("Error al crear centro:", error);

            alert("Error al crear el centro");

        }

    });

}

/* ---------------------
    LISTAR CENTROS
--------------------- */

// Funcion para cargar la tabla con los datos de los centros

function cargarTablaCentros(centros) {

    const tabla = document.getElementById("tablaCentros");

    if (!tabla) return;

    tabla.innerHTML = "";

    centros.forEach(centro => {

        tabla.innerHTML += `

            <tr>

                <th scope="row">${centro.idCentro}</th>

                <td>${centro.nombre}</td>

                <td>${centro.direccion}</td>

                <td>${centro.capacidad ?? "-"}</td>

                <td>${centro.tipo}</td>

                <td>${centro.ubicacionX}</td>

                <td>${centro.ubicacionY}</td>

                <td>

                    <div>

                        <button
                            class="verDatosCentro btn btn-outline-primary btn-sm"
                            data-id="${centro.idCentro}"
                            data-bs-toggle="modal"
                            data-bs-target="#datosCentro">

                            Ver

                        </button>

                        <button
                            class="editarCentro btn btn-outline-secondary btn-sm"
                            data-id="${centro.idCentro}">

                            Editar

                        </button>

                        <button
                            class="eliminarCentro btn btn-outline-danger btn-sm"
                            data-id="${centro.idCentro}">

                            Eliminar

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}


// Cargar centros al abrir la pagina

if (document.getElementById("tablaCentros")) {

    fetch("http://localhost:8000/api/centros-acopio", {

        method: "GET",

        headers: {

            "Accept": "application/json",
            "Authorization": "Bearer " + getToken()

        }

    })

        .then(respuesta => respuesta.json())

        .then(resultado => {

            if (resultado.success) {

                cargarTablaCentros(resultado.data);

            } else {

                console.error(resultado.mensaje);

            }

        })

        .catch(error => {

            console.error("Error al cargar centros:", error);

        });

}
/* ---------------------
    VER CENTRO
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("verDatosCentro")) {

        const id = e.target.getAttribute("data-id");

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/centros-acopio/" + id,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    }
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                const centro = resultado.data;

                document.getElementById("verNombreCentro").value =
                    centro.nombre;

                document.getElementById("verDireccionCentro").value =
                    centro.direccion;

                document.getElementById("verCapacidadCentro").value =
                    centro.capacidad ?? "";

                document.getElementById("verTipoCentro").value =
                    centro.tipo;

                document.getElementById("verUbicacionX").value =
                    centro.ubicacionX;

                document.getElementById("verUbicacionY").value =
                    centro.ubicacionY;

                [
                    "verNombreCentro",
                    "verDireccionCentro",
                    "verCapacidadCentro",
                    "verTipoCentro",
                    "verUbicacionX",
                    "verUbicacionY"
                ].forEach(function (campoId) {
                    document.getElementById(campoId).disabled = true;
                });

                document.getElementById("btnGuardarCentro").classList.add("d-none");

            } else {

                alert(resultado.mensaje);

            }

        } catch (error) {

            console.error("Error al obtener el centro:", error);

            alert("Error al obtener los datos del centro");

        }

    }

});
/* ---------------------
    EDITAR CENTRO
--------------------- */

document.addEventListener("click", function (e) {

    if (e.target.classList.contains("editarCentro")) {

        const id = e.target.getAttribute("data-id");

        fetch(
            "http://localhost:8000/api/centros-acopio/" + id,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + getToken()
                }
            }
        )
            .then(respuesta => respuesta.json())
            .then(resultado => {

                if (resultado.success) {

                    const centro = resultado.data;

                    document.getElementById("verNombreCentro").value =
                        centro.nombre;

                    document.getElementById("verDireccionCentro").value =
                        centro.direccion;

                    document.getElementById("verCapacidadCentro").value =
                        centro.capacidad;

                    document.getElementById("verTipoCentro").value =
                        centro.tipo;

                    document.getElementById("verUbicacionX").value =
                        centro.ubicacionX;

                    document.getElementById("verUbicacionY").value =
                        centro.ubicacionY;

                    document.getElementById("verNombreCentro").removeAttribute("disabled");

                    document.getElementById("verDireccionCentro").removeAttribute("disabled");

                    document.getElementById("verCapacidadCentro").removeAttribute("disabled");

                    document.getElementById("verTipoCentro").removeAttribute("disabled");

                    document.getElementById("verUbicacionX").removeAttribute("disabled");

                    document.getElementById("verUbicacionY").removeAttribute("disabled");

                    document.getElementById("btnGuardarCentro").classList.remove("d-none");

                    document.getElementById("btnGuardarCentro").setAttribute("data-id", id);

                    const modal = new bootstrap.Modal(
                        document.getElementById("datosCentro")
                    );

                    modal.show();

                } else {

                    alert(resultado.mensaje);

                }

            })
            .catch(error => {

                console.error("Error al editar centro:", error);

                alert("Error al obtener los datos del centro");

            });

    }

});
/* ---------------------
    GUARDAR CENTRO EDITADO
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.id === "btnGuardarCentro") {

        const botonGuardar = e.target;

        const id = botonGuardar.getAttribute("data-id");

        const nombre = document.getElementById("verNombreCentro").value;
        const direccion = document.getElementById("verDireccionCentro").value;
        const capacidad = document.getElementById("verCapacidadCentro").value;
        const tipo = document.getElementById("verTipoCentro").value;
        const ubicacionX = document.getElementById("verUbicacionX").value;
        const ubicacionY = document.getElementById("verUbicacionY").value;

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/centros-acopio/" + id,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    },
                    body: JSON.stringify({
                        nombre: nombre,
                        direccion: direccion,
                        capacidad: capacidad,
                        tipo: tipo,
                        ubicacionX: ubicacionX,
                        ubicacionY: ubicacionY
                    })
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Centro actualizado correctamente");

                const modal = bootstrap.Modal.getInstance(
                    document.getElementById("datosCentro")
                );

                modal.hide();

                location.reload();

            } else {

                alert(
                    resultado.mensaje ||
                    "No se pudo actualizar el centro"
                );

            }

        } catch (error) {

            console.error("Error al actualizar centro:", error);

            alert("Error al actualizar el centro");

        }

    }

});
/* ---------------------
    ELIMINAR CENTRO
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("eliminarCentro")) {

        const id = e.target.getAttribute("data-id");

        const confirmar = confirm(
            "¿Está seguro de eliminar este centro?"
        );

        if (!confirmar) {
            return;
        }

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/centros-acopio/" + id,
                {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    }
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Centro eliminado correctamente");

                location.reload();

            } else {

                alert(
                    resultado.mensaje ||
                    "No se pudo eliminar el centro"
                );

            }

        } catch (error) {

            console.error("Error al eliminar centro:", error);

            alert("Error al eliminar el centro");

        }

    }

});
/* ---------------------
    BUSCAR CENTRO
--------------------- */

const buscarCentro = document.getElementById("buscarCentro");

if (buscarCentro) {

    buscarCentro.addEventListener("input", async function () {

        const nombre = buscarCentro.value.trim().toLowerCase();

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/centros-acopio",
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    }
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                const centrosFiltrados = resultado.data.filter(centro =>
                    centro.nombre.toLowerCase().includes(nombre)
                );

                cargarTablaCentros(centrosFiltrados);

            } else {

                console.error(resultado.mensaje);

            }

        } catch (error) {

            console.error("Error al buscar centros:", error);

        }

    });

}


/* --------------------
    CONTENEDORES
------------------------*/


let mapa = null;
let capaContenedores = null;



async function cargarMapaContenedores() {

    const elementoMapa = document.getElementById("mapa");

    if (!elementoMapa) return;

    if (mapa === null) {

        mapa = L.map("mapa").setView(
            [-34.8965, -56.131],
            14
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution: "&copy; OpenStreetMap",
                maxZoom: 19
            }
        ).addTo(mapa);

        capaContenedores = L.layerGroup().addTo(mapa);

    } else {

        mapa.invalidateSize();

    }

    try {

        const respuesta = await fetch(
            "http://localhost:8000/api/contenedores",
            {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + getToken()
                }
            }
        );

        const contenedores = await respuesta.json();

        dibujarContenedores(contenedores.data);

    } catch (error) {

        console.error("Error al cargar contenedores:", error);

    }
}




function dibujarContenedores(contenedores) {


    if (!capaContenedores) return;


    capaContenedores.clearLayers();



    contenedores.forEach(contenedor => {



        const marcador = L.marker([
            contenedor.ubicacionY,
            contenedor.ubicacionX
        ]);



        marcador.on("click", () => {


            mostrarInformacion(contenedor);


        });



        marcador.addTo(capaContenedores);



    });


}





async function mostrarInformacion(contenedor) {

    const id = document.getElementById("id");

    if (!id) return;

    document.getElementById("id").value = contenedor.idContenedor;
    document.getElementById("Nv_Llenado").value = contenedor.nivelLlenado;
    document.getElementById("ubiX").value = contenedor.ubicacionX;
    document.getElementById("ubiY").value = contenedor.ubicacionY;
    document.getElementById("Tipo_Residuo").value = contenedor.tipo;
    await cargarRutasEnSelect("Ruta", contenedor.tipo, contenedor.idRuta, false);

}



// Ejecutar mapa solamente si existe

if (document.getElementById("mapa")) {

    cargarMapaContenedores();

    document.getElementById("Tipo_Residuo").addEventListener("change", function () {
        cargarRutasEnSelect("Ruta", this.value, "", true);
    });

}

/* ---------------------
    LISTAR CONTENEDORES
--------------------- */

function cargarTablaContenedores(contenedores) {

    const tabla = document.getElementById("tablaContenedores");

    if (!tabla) {
        return;
    }

    tabla.innerHTML = "";

    contenedores.forEach(function (contenedor) {

        tabla.innerHTML += `

            <tr>

                <th scope="row">${contenedor.idContenedor}</th>

                <td>${contenedor.tipo}</td>

                <td>${contenedor.estado ?? "-"}</td>

                <td>${contenedor.nivelLlenado ?? "-"}</td>

                <td>${contenedor.ubicacionX}</td>

                <td>${contenedor.ubicacionY}</td>

                <td>${contenedor.idRuta ?? "Sin ruta asignada"}</td>

            </tr>

        `;

    });

}


// Cargar contenedores al entrar a la página

if (document.getElementById("tablaContenedores")) {

    fetch("http://localhost:8000/api/contenedores", {

        method: "GET",

        headers: {

            "Accept": "application/json",

            "Authorization": "Bearer " + getToken()

        }

    })
        .then(function (respuesta) {

            if (respuesta.status === 403) {

                alert("No tiene permisos para acceder a Contenedores");

                window.location.href = "home.html";

                return null;
            }

            return respuesta.json();

        })
        .then(function (resultado) {

            if (!resultado) {
                return;
            }

            cargarTablaContenedores(resultado.data);

        })
        .catch(function (error) {

            console.error(
                "Error al cargar contenedores:",
                error
            );

        });

}


// Buscar contenedores

const BusquedaContenedores =
    document.getElementById("formBusquedaContenedores");


if (BusquedaContenedores) {

    BusquedaContenedores.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const id =
                document
                    .getElementById("inputIdContenedor")
                    .value
                    .trim();

            try {

                const respuesta = await fetch(
                    "http://localhost:8000/api/contenedores",
                    {
                        method: "GET",

                        headers: {

                            "Accept": "application/json",

                            "Authorization":
                                "Bearer " + getToken()

                        }
                    }
                );

                if (respuesta.status === 403) {

                    alert(
                        "No tiene permisos para acceder a Contenedores"
                    );

                    window.location.href = "home.html";

                    return;
                }

                const resultado =
                    await respuesta.json();


                let contenedores =
                    resultado.data;


                if (id !== "") {

                    contenedores =
                        contenedores.filter(
                            function (contenedor) {

                                return String(
                                    contenedor.idContenedor
                                ) === id;

                            }
                        );

                }


                cargarTablaContenedores(
                    contenedores
                );


            } catch (error) {

                console.error(
                    "Error al buscar contenedores:",
                    error
                );

            }

        }
    );

}


/* ---------------------
    USUARIOS
--------------------- */

// Busqueda/listado de usuarios

const BusquedaUsuarios = document.getElementById("formBusquedaUsuarios");

if (BusquedaUsuarios) {

    BusquedaUsuarios.addEventListener("submit", async (e) => {

        e.preventDefault();

        const nombre = document.getElementById("inputNombre").value.trim();

        let url = "http://localhost:8000/api/usuarios";

        if (nombre !== "") {
            url += "?nombre=" + encodeURIComponent(nombre);
        }

        try {

            const respuesta = await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + getToken()
                }
            });

            const resultado = await respuesta.json();

            cargarTablaUsuarios(resultado.data);

        } catch (error) {

            console.error("Error al cargar usuarios:", error);

        }

    });

}


function cargarTablaUsuarios(usuarios) {

    const tabla = document.getElementById("tablaUsuarios");

    if (!tabla) return;

    tabla.innerHTML = "";

    usuarios.forEach(usuario => {

        tabla.innerHTML += `

            <tr>

                <th scope="row">${usuario.idUsu}</th>

                <td>${usuario.nombre1}</td>

                <td>${usuario.apellido1}</td>

                <td>${usuario.mail}</td>

                <td>${usuario.tipo}</td>

                <td>-</td>

                <td>

                    <div>

                        <button 
                            class="verDatosUsuario btn btn-outline-primary btn-sm"
                            data-id="${usuario.idUsu}"
                            data-bs-toggle="modal"
                            data-bs-target="#datosUsuarios">
                            Ver
                        </button>

                        <button 
                            class="editarUsuario btn btn-outline-secondary btn-sm"
                            data-id="${usuario.idUsu}">
                            Editar
                        </button>

                        <button 
                            class="eliminarUsuario btn btn-outline-danger btn-sm"
                            data-id="${usuario.idUsu}">
                            Eliminar
                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}


// Cargar usuarios al entrar a la página si existe la tabla

if (document.getElementById("tablaUsuarios")) {

    fetch("http://localhost:8000/api/usuarios", {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": "Bearer " + getToken()
        }
    })
        .then(function (respuesta) {

            // Si el usuario no tiene permiso para acceder a Usuarios
            if (respuesta.status === 403) {

                alert("No tiene permisos para acceder a Usuarios");

                window.location.href = "home.html";

                return null;
            }

            return respuesta.json();

        })
        .then(function (data) {

            // Si hubo un 403, no intentamos cargar la tabla
            if (!data) {
                return;
            }

            cargarTablaUsuarios(data.data);

        })
        .catch(function (error) {

            console.error("Error al cargar usuarios:", error);

        });

}


// Envío del formulario de registro de usuario mediante fetch

if (document.getElementById("formRegistroUsuario")) {

    const formRegistro = document.getElementById("formRegistroUsuario");

    cargarCentrosEnSelect("idCentro", "mensajeCentrosUsuario", formRegistro);

    formRegistro.addEventListener("submit", function (e) {

        e.preventDefault();

        const ci = document.getElementById("ci").value;
        const nombre1 = document.getElementById("nombre1").value;
        const nombre2 = document.getElementById("nombre2").value;
        const apellido1 = document.getElementById("apellido1").value;
        const apellido2 = document.getElementById("apellido2").value;
        const fec_nac = document.getElementById("fec_nac").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const tipo = document.getElementById("tipo").value;
        const idCentro = document.getElementById("idCentro").value;

        const parametros = "ci=" + encodeURIComponent(ci) +
            "&nombre1=" + encodeURIComponent(nombre1) +
            "&nombre2=" + encodeURIComponent(nombre2) +
            "&apellido1=" + encodeURIComponent(apellido1) +
            "&apellido2=" + encodeURIComponent(apellido2) +
            "&fec_nac=" + encodeURIComponent(fec_nac) +
            "&tipo=" + encodeURIComponent(tipo) +
            "&idCentro=" + encodeURIComponent(idCentro) +
            "&email=" + encodeURIComponent(email) +
            "&password=" + encodeURIComponent(password);

        fetch(formRegistro.action, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "Authorization": "Bearer " + getToken()
            },
            body: parametros
        })
            .then(function (respuesta) {
                return respuesta.json();
            })
            .then(function (resultado) {

                if (resultado.data) {

                    alert("Usuario registrado correctamente");

                    document.getElementById("ci").value = "";
                    document.getElementById("nombre1").value = "";
                    document.getElementById("nombre2").value = "";
                    document.getElementById("apellido1").value = "";
                    document.getElementById("apellido2").value = "";
                    document.getElementById("fec_nac").value = "";
                    document.getElementById("email").value = "";
                    document.getElementById("password").value = "";

                } else {

                    alert("No se pudo registrar el usuario. Revise los datos.");

                }

            })
            .catch(function (error) {

                console.error("Error al enviar registro:", error);

            });

    });

}
/* ---------------------
    VER USUARIO
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("verDatosUsuario")) {

        const id = e.target.getAttribute("data-id");

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/usuarios/" + id,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    }
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                const usuario = resultado.data;

                await cargarCentrosEnSelect("centroUsuario", null, null, usuario.idCentro, false);

                document.getElementById("ciUsuario").value = usuario.ci;
                document.getElementById("nombre1Usuario").value = usuario.nombre1;
                document.getElementById("nombre2Usuario").value = usuario.nombre2 ?? "";
                document.getElementById("apellido1Usuario").value = usuario.apellido1;
                document.getElementById("apellido2Usuario").value = usuario.apellido2 ?? "";
                document.getElementById("fecNacUsuario").value = usuario.fec_nac;
                document.getElementById("tipoUsuario").value = usuario.tipo;
                document.getElementById("centroUsuario").value = usuario.idCentro;

            } else {

                alert(resultado.mensaje);

            }

        } catch (error) {

            console.error("Error al obtener el usuario:", error);
            alert("Error al obtener los datos del usuario");

        }

    }

});

/* ---------------------
    EDITAR USUARIO
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("editarUsuario")) {

        const id = e.target.getAttribute("data-id");

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/usuarios/" + id,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    }
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                const usuario = resultado.data;

                await cargarCentrosEnSelect("centroUsuario", null, null, usuario.idCentro, true);

                document.getElementById("ciUsuario").value = usuario.ci;
                document.getElementById("nombre1Usuario").value = usuario.nombre1;
                document.getElementById("nombre2Usuario").value = usuario.nombre2 ?? "";
                document.getElementById("apellido1Usuario").value = usuario.apellido1;
                document.getElementById("apellido2Usuario").value = usuario.apellido2 ?? "";
                document.getElementById("fecNacUsuario").value = usuario.fec_nac;
                document.getElementById("tipoUsuario").value = usuario.tipo;
                document.getElementById("centroUsuario").value = usuario.idCentro;

                document.getElementById("ciUsuario").removeAttribute("readonly");
                document.getElementById("nombre1Usuario").removeAttribute("readonly");
                document.getElementById("nombre2Usuario").removeAttribute("readonly");
                document.getElementById("apellido1Usuario").removeAttribute("readonly");
                document.getElementById("apellido2Usuario").removeAttribute("readonly");
                document.getElementById("fecNacUsuario").removeAttribute("readonly");
                document.getElementById("tipoUsuario").removeAttribute("disabled");
                document.getElementById("centroUsuario").removeAttribute("disabled");

                document.getElementById("btnGuardarUsuario").classList.remove("d-none");

                const modal = new bootstrap.Modal(
                    document.getElementById("datosUsuarios")
                );

                modal.show();

                document.getElementById("btnGuardarUsuario").setAttribute("data-id", id);

            } else {

                alert(resultado.mensaje);

            }

        } catch (error) {

            console.error("Error al editar usuario:", error);
            alert("Error al obtener los datos del usuario");

        }

    }

});
/* ---------------------
    GUARDAR USUARIO EDITADO
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.id === "btnGuardarUsuario") {

        const botonGuardar = e.target;
        const id = botonGuardar.getAttribute("data-id");

        const ci = document.getElementById("ciUsuario").value;
        const nombre1 = document.getElementById("nombre1Usuario").value;
        const nombre2 = document.getElementById("nombre2Usuario").value;
        const apellido1 = document.getElementById("apellido1Usuario").value;
        const apellido2 = document.getElementById("apellido2Usuario").value;
        const fec_nac = document.getElementById("fecNacUsuario").value;
        const tipo = document.getElementById("tipoUsuario").value;
        const idCentro = document.getElementById("centroUsuario").value;

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/usuarios/" + id,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    },
                    body: JSON.stringify({
                        ci: ci,
                        nombre1: nombre1,
                        nombre2: nombre2,
                        apellido1: apellido1,
                        apellido2: apellido2,
                        fec_nac: fec_nac,
                        tipo: tipo,
                        idCentro: idCentro
                    })
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Usuario actualizado correctamente");

                botonGuardar.classList.add("d-none");

                document.getElementById("ciUsuario").setAttribute("readonly", true);
                document.getElementById("nombre1Usuario").setAttribute("readonly", true);
                document.getElementById("nombre2Usuario").setAttribute("readonly", true);
                document.getElementById("apellido1Usuario").setAttribute("readonly", true);
                document.getElementById("apellido2Usuario").setAttribute("readonly", true);
                document.getElementById("fecNacUsuario").setAttribute("readonly", true);
                document.getElementById("tipoUsuario").setAttribute("disabled", true);
                document.getElementById("centroUsuario").setAttribute("disabled", true);

                const modal = bootstrap.Modal.getInstance(
                    document.getElementById("datosUsuarios")
                );

                modal.hide();

                location.reload();

            } else {

                alert(
                    resultado.mensaje ||
                    "No se pudo actualizar el usuario. Revise los datos."
                );

            }

        } catch (error) {

            console.error("Error al actualizar usuario:", error);
            alert("Error al actualizar el usuario");

        }

    }

});

/* ---------------------
    ELIMINAR USUARIO
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("eliminarUsuario")) {

        const id = e.target.getAttribute("data-id");

        const confirmar = confirm(
            "¿Está seguro de eliminar este usuario?"
        );

        if (!confirmar) {
            return;
        }

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/usuarios/" + id,
                {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    }
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Usuario eliminado correctamente");

                location.reload();

            } else {

                alert(
                    resultado.mensaje ||
                    "No se pudo eliminar el usuario"
                );

            }

        } catch (error) {

            console.error("Error al eliminar usuario:", error);
            alert("Error al eliminar el usuario");

        }

    }

});
/* ---------------------
    LOGIN JWT
--------------------- */

if (document.getElementById("formLogin")) {

    const formLogin = document.getElementById("formLogin");

    formLogin.addEventListener("submit", function (e) {

        e.preventDefault();

        const email = document.getElementById("Email").value;
        const password = document.getElementById("Password").value;

        fetch(formLogin.action, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })

        })
            .then(function (respuesta) {
                return respuesta.json();
            })
            .then(function (resultado) {

                if (resultado.data && resultado.data.access_token) {

                    // Guardamos el JWT recibido desde Laravel
                    saveToken(resultado.data.access_token);

                    // Entramos al sistema
                    window.location.href = "home.html";

                } else {

                    alert(
                        resultado.message ||
                        "Email o contraseña incorrectos"
                    );

                }

            })
            .catch(function (error) {

                console.error("Error al iniciar sesión:", error);

                alert("Error al iniciar sesión");

            });

    });

}
/* ---------------------
    ALTA CONTENEDOR
--------------------- */

if (document.getElementById("formContenedor")) {

    const formContenedor = document.getElementById("formContenedor");
    const tipoResiduoSelect = document.getElementById("tipoResiduo");
    const rutaSelect = document.getElementById("idRuta");
    const mensajeRutas = document.getElementById("mensajeRutas");
    const botonContenedor = formContenedor.querySelector('button[type="submit"]');

    async function cargarRutasCompatibles() {
        const tipoResiduo = tipoResiduoSelect.value;
        rutaSelect.innerHTML = '<option value="" selected>Cargando rutas...</option>';
        rutaSelect.disabled = true;
        mensajeRutas.textContent = "";

        if (!tipoResiduo) {
            rutaSelect.innerHTML = '<option value="" selected>Sin ruta asignada</option>';
            return;
        }

        try {
            const respuesta = await fetch(
                "http://localhost:8000/api/rutas?tipoResiduo=" + encodeURIComponent(tipoResiduo),
                { headers: { "Accept": "application/json", "Authorization": "Bearer " + getToken() } }
            );
            const resultado = await respuesta.json();

            const rutas = respuesta.ok && Array.isArray(resultado.data) ? resultado.data : [];

            rutaSelect.innerHTML = '<option value="" selected>Sin ruta asignada</option>';
            rutas.forEach(function (ruta) {
                const opcion = document.createElement("option");
                opcion.value = ruta.idRuta;
                opcion.textContent = ruta.descripcion + " (" + ruta.horario + ")";
                rutaSelect.appendChild(opcion);
            });

            rutaSelect.disabled = false;
            botonContenedor.disabled = false;
            mensajeRutas.textContent = rutas.length === 0
                ? "No existen rutas compatibles; el contenedor quedará sin ruta."
                : "";
        } catch (error) {
            rutaSelect.innerHTML = '<option value="" selected>Sin ruta asignada</option>';
            rutaSelect.disabled = false;
            botonContenedor.disabled = false;
            mensajeRutas.textContent = "No se pudieron consultar las rutas; puede crear el contenedor sin asignación.";
        }
    }

    tipoResiduoSelect.addEventListener("change", cargarRutasCompatibles);

    formContenedor.addEventListener("submit", function (e) {

        e.preventDefault();

        const ubicacionX = document.getElementById("ubicacionX").value;
        const ubicacionY = document.getElementById("ubicacionY").value;
        const estado = document.getElementById("estado").value;
        const nivelLlenado = document.getElementById("nivelLlenado").value;
        const tipoResiduo = document.getElementById("tipoResiduo").value;
        const idRuta = document.getElementById("idRuta").value;

        const parametros = "ubicacionX=" + encodeURIComponent(ubicacionX) +
            "&ubicacionY=" + encodeURIComponent(ubicacionY) +
            "&estado=" + encodeURIComponent(estado) +
            "&nivelLlenado=" + encodeURIComponent(nivelLlenado) +
            "&tipo=" + encodeURIComponent(tipoResiduo) +
            "&idRuta=" + encodeURIComponent(idRuta);

        fetch(formContenedor.action, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "Authorization": "Bearer " + getToken()
            },
            body: parametros
        })
            .then(function (respuesta) {
                return respuesta.json();
            })
            .then(function (resultado) {

                if (resultado.data) {
                    alert("Contenedor agregado correctamente");
                    document.getElementById("ubicacionX").value = "";
                    document.getElementById("ubicacionY").value = "";
                    document.getElementById("estado").value = "";
                    document.getElementById("nivelLlenado").value = "0";
                    document.getElementById("tipoResiduo").value = "";
                    document.getElementById("idRuta").value = "";
                    cargarRutasCompatibles();
                } else {
                    console.log("Respuesta del servidor:", resultado);
                    alert(JSON.stringify(resultado));
                }

            })
            .catch(function (error) {
                console.error("Error al agregar contenedor:", error);
            });

    });

}
/* ---------------------
    EDITAR CONTENEDOR
--------------------- */

document.addEventListener("DOMContentLoaded", function () {

    const btnEditar = document.getElementById("btnEditar");

    if (btnEditar) {

        btnEditar.addEventListener("click", async function () {

            // Si el botón dice Editar, habilitamos los campos
            if (btnEditar.textContent === "Editar") {

                document.getElementById("Nv_Llenado").removeAttribute("readonly");
                document.getElementById("ubiX").removeAttribute("readonly");
                document.getElementById("ubiY").removeAttribute("readonly");
                document.getElementById("Ruta").removeAttribute("disabled");
                document.getElementById("Tipo_Residuo").removeAttribute("disabled");

                btnEditar.textContent = "Guardar";

                return;
            }

            // Si el botón dice Guardar, actualizamos el contenedor

            const id = document.getElementById("id").value;
            const nivelLlenado = document.getElementById("Nv_Llenado").value;
            const ubicacionX = document.getElementById("ubiX").value;
            const ubicacionY = document.getElementById("ubiY").value;
            const idRuta = document.getElementById("Ruta").value;
            const tipo = document.getElementById("Tipo_Residuo").value;

            try {

                const respuesta = await fetch(
                    "http://localhost:8000/api/contenedores/" + id,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "Authorization": "Bearer " + getToken()
                        },
                        body: JSON.stringify({
                            ubicacionX: ubicacionX,
                            ubicacionY: ubicacionY,
                            nivelLlenado: nivelLlenado,
                            idRuta: idRuta,
                            tipo: tipo
                        })
                    }
                );

                const resultado = await respuesta.json();

                if (resultado.success) {

                    alert("Contenedor actualizado correctamente");

                    document.getElementById("Nv_Llenado").setAttribute("readonly", true);
                    document.getElementById("ubiX").setAttribute("readonly", true);
                    document.getElementById("ubiY").setAttribute("readonly", true);
                    document.getElementById("Ruta").setAttribute("disabled", true);
                    document.getElementById("Tipo_Residuo").setAttribute("disabled", true);

                    btnEditar.textContent = "Editar";

                } else {

                    alert(resultado.mensaje);

                }

            } catch (error) {

                console.error("Error al actualizar contenedor:", error);
                alert("Error al actualizar el contenedor");

            }

        });

    }

});
/* ---------------------
    ELIMINAR CONTENEDOR
--------------------- */

document.addEventListener("DOMContentLoaded", function () {

    const btnEliminar = document.getElementById("btnEliminar");

    if (btnEliminar) {

        btnEliminar.addEventListener("click", async function () {

            const id = document.getElementById("id").value;

            if (!id) {
                alert("Seleccione un contenedor primero");
                return;
            }

            const confirmar = confirm("¿Está seguro de eliminar este contenedor?");

            if (!confirmar) {
                return;
            }

            try {

                const respuesta = await fetch(
                    "http://localhost:8000/api/contenedores/" + id,
                    {
                        method: "DELETE",
                        headers: {
                            "Accept": "application/json",
                            "Authorization": "Bearer " + getToken()
                        }
                    }
                );

                const resultado = await respuesta.json();

                if (resultado.success) {

                    alert("Contenedor eliminado correctamente");

                    document.getElementById("id").value = "";
                    document.getElementById("Nv_Llenado").value = "";
                    document.getElementById("ubiX").value = "";
                    document.getElementById("ubiY").value = "";
                    document.getElementById("Ruta").value = "";
                    document.getElementById("Tipo_Residuo").value = "";

                } else {

                    alert(resultado.mensaje);

                }

            } catch (error) {

                console.error("Error al eliminar contenedor:", error);
                alert("Error al eliminar el contenedor");

            }

        });

    }

});
/* ---------------------
    CREAR CAMIÓN
--------------------- */

if (document.getElementById("formCamion")) {

    const formCamion = document.getElementById("formCamion");
    const tipoCamion = document.getElementById("tipo");
    const capacidadCamion = document.getElementById("capacidad");

    function actualizarCapacidadCamion() {
        const noUsaCapacidad = ["Camioneta", "Barredora"].includes(tipoCamion.value);
        capacidadCamion.disabled = noUsaCapacidad;
        capacidadCamion.required = !noUsaCapacidad;
        capacidadCamion.value = noUsaCapacidad ? "" : capacidadCamion.value;
    }

    tipoCamion.addEventListener("change", actualizarCapacidadCamion);
    actualizarCapacidadCamion();

    formCamion.addEventListener("submit", async function (e) {

        e.preventDefault();

        const matricula = document.getElementById("matricula").value;
        const marca = document.getElementById("marca").value;
        const tipo = document.getElementById("tipo").value;
        const estado = document.getElementById("estado").value;
        const capacidad = capacidadCamion.disabled ? null : capacidadCamion.value;

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/camiones",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    },
                    body: JSON.stringify({
                        matricula: matricula,
                        marca: marca,
                        tipo: tipo,
                        estado: estado,
                        capacidad: capacidad
                    })
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Camión creado correctamente");

                formCamion.reset();
                actualizarCapacidadCamion();

            } else {

                alert(resultado.mensaje);

            }

        } catch (error) {

            console.error("Error al crear camión:", error);
            alert("Error al crear el camión");

        }
    });
}
/* ---------------------
    MAQUINARIA
--------------------- */

// Alta de maquinaria

const formMaquinaria = document.getElementById("formMaquinaria");

if (formMaquinaria) {

    cargarCentrosEnSelect("idCentroMaquinaria", "mensajeCentrosMaquinaria", formMaquinaria);

    formMaquinaria.addEventListener("submit", async function (e) {

        e.preventDefault();

        const nombre = document.getElementById("nombreMaquinaria").value;
        const tipo = document.getElementById("tipoMaquinaria").value;
        const estado = document.getElementById("estadoMaquinaria").value;
        const idCentro = document.getElementById("idCentroMaquinaria").value;

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/maquinarias",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    },
                    body: JSON.stringify({
                        nombre: nombre,
                        tipo: tipo,
                        estado: estado,
                        idCentro: idCentro
                    })
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Maquinaria creada correctamente");

                formMaquinaria.reset();

            } else {

                alert(
                    resultado.mensaje ||
                    "No se pudo crear la maquinaria"
                );

            }

        } catch (error) {

            console.error("Error al crear maquinaria:", error);

            alert("Error al crear la maquinaria");

        }

    });

}
/* ---------------------
    LISTAR MAQUINARIAS
--------------------- */

// Funcion para cargar la tabla

function cargarTablaMaquinarias(maquinarias) {

    const tabla = document.getElementById("tablaMaquinarias");

    if (!tabla) return;

    tabla.innerHTML = "";

    maquinarias.forEach(maquinaria => {

        tabla.innerHTML += `

            <tr>

                <th scope="row">
                    ${maquinaria.idMaquinaria}
                </th>

                <td>
                    ${maquinaria.nombre}
                </td>

                <td>
                    ${maquinaria.tipo}
                </td>

                <td>
                    ${maquinaria.estado}
                </td>

                <td>
                    ${maquinaria.idCentro}
                </td>

                <td>

                    <div>

                        <button
                            class="verDatosMaquinaria btn btn-outline-primary btn-sm"
                            data-id="${maquinaria.idMaquinaria}"
                            data-bs-toggle="modal"
                            data-bs-target="#datosMaquinaria">

                            Ver

                        </button>

                        <button
                            class="editarMaquinaria btn btn-outline-secondary btn-sm"
                            data-id="${maquinaria.idMaquinaria}">

                            Editar

                        </button>

                        <button
                            class="eliminarMaquinaria btn btn-outline-danger btn-sm"
                            data-id="${maquinaria.idMaquinaria}">

                            Eliminar

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

}


// Cargar maquinarias al abrir la pagina

if (document.getElementById("tablaMaquinarias")) {

    fetch(
        "http://localhost:8000/api/maquinarias",
        {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": "Bearer " + getToken()
            }
        }
    )

        .then(respuesta => respuesta.json())

        .then(resultado => {

            if (resultado.success) {

                cargarTablaMaquinarias(resultado.data);

            } else {

                console.error(resultado.mensaje);

            }

        })

        .catch(error => {

            console.error(
                "Error al cargar maquinarias:",
                error
            );

        });

}
/* ---------------------
    VER MAQUINARIA
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("verDatosMaquinaria")) {

        const id = e.target.getAttribute("data-id");

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/maquinarias/" + id,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    }
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                const maquinaria = resultado.data;

                await cargarCentrosEnSelect("verIdCentroMaquinaria", null, null, maquinaria.idCentro, false);

                document.getElementById("verNombreMaquinaria").value =
                    maquinaria.nombre;

                document.getElementById("verTipoMaquinaria").value =
                    maquinaria.tipo;

                document.getElementById("verEstadoMaquinaria").value =
                    maquinaria.estado;

                document.getElementById("verIdCentroMaquinaria").value =
                    maquinaria.idCentro;

            } else {

                alert(resultado.mensaje);

            }

        } catch (error) {

            console.error(
                "Error al obtener la maquinaria:",
                error
            );

            alert("Error al obtener los datos de la maquinaria");

        }

    }

});
/* ---------------------
    EDITAR MAQUINARIA
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("editarMaquinaria")) {

        const id = e.target.getAttribute("data-id");

        fetch(
            "http://localhost:8000/api/maquinarias/" + id,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + getToken()
                }
            }
        )
            .then(respuesta => respuesta.json())

            .then(async resultado => {

                if (resultado.success) {

                    const maquinaria = resultado.data;

                    await cargarCentrosEnSelect("verIdCentroMaquinaria", null, null, maquinaria.idCentro, true);

                    document.getElementById("verNombreMaquinaria").value =
                        maquinaria.nombre;

                    document.getElementById("verTipoMaquinaria").value =
                        maquinaria.tipo;

                    document.getElementById("verEstadoMaquinaria").value =
                        maquinaria.estado;

                    document.getElementById("verIdCentroMaquinaria").value =
                        maquinaria.idCentro;

                    document.getElementById("verNombreMaquinaria")
                        .removeAttribute("disabled");

                    document.getElementById("verTipoMaquinaria")
                        .removeAttribute("disabled");

                    document.getElementById("verEstadoMaquinaria")
                        .removeAttribute("disabled");

                    document.getElementById("verIdCentroMaquinaria")
                        .removeAttribute("disabled");

                    document.getElementById("btnGuardarMaquinaria")
                        .classList.remove("d-none");

                    document.getElementById("btnGuardarMaquinaria")
                        .setAttribute("data-id", id);

                    const modal = new bootstrap.Modal(
                        document.getElementById("datosMaquinaria")
                    );

                    modal.show();

                } else {

                    alert(resultado.mensaje);

                }

            })

            .catch(error => {

                console.error(
                    "Error al editar maquinaria:",
                    error
                );

                alert("Error al obtener los datos de la maquinaria");

            });

    }

});
/* ---------------------
    GUARDAR MAQUINARIA EDITADA
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.id === "btnGuardarMaquinaria") {

        const botonGuardar = e.target;

        const id = botonGuardar.getAttribute("data-id");

        const nombre = document.getElementById("verNombreMaquinaria").value;
        const tipo = document.getElementById("verTipoMaquinaria").value;
        const estado = document.getElementById("verEstadoMaquinaria").value;
        const idCentro = document.getElementById("verIdCentroMaquinaria").value;

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/maquinarias/" + id,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    },
                    body: JSON.stringify({
                        nombre: nombre,
                        tipo: tipo,
                        estado: estado,
                        idCentro: idCentro
                    })
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Maquinaria actualizada correctamente");

                const modal = bootstrap.Modal.getInstance(
                    document.getElementById("datosMaquinaria")
                );

                modal.hide();

                location.reload();

            } else {

                alert(
                    resultado.mensaje ||
                    "No se pudo actualizar la maquinaria"
                );

            }

        } catch (error) {

            console.error(
                "Error al actualizar maquinaria:",
                error
            );

            alert("Error al actualizar la maquinaria");

        }

    }

});
/* ---------------------
    ELIMINAR MAQUINARIA
--------------------- */

document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("eliminarMaquinaria")) {

        const id = e.target.getAttribute("data-id");

        const confirmar = confirm(
            "¿Está seguro de eliminar esta maquinaria?"
        );

        if (!confirmar) {
            return;
        }

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/maquinarias/" + id,
                {
                    method: "DELETE",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    }
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                alert("Maquinaria eliminada correctamente");

                location.reload();

            } else {

                alert(
                    resultado.mensaje ||
                    "No se pudo eliminar la maquinaria"
                );

            }

        } catch (error) {

            console.error(
                "Error al eliminar maquinaria:",
                error
            );

            alert("Error al eliminar la maquinaria");

        }

    }

});
/* ---------------------
    BUSCAR MAQUINARIA
--------------------- */

const buscarMaquinaria = document.getElementById("buscarMaquinaria");

if (buscarMaquinaria) {

    buscarMaquinaria.addEventListener("input", async function () {

        const nombre = buscarMaquinaria.value.trim().toLowerCase();

        try {

            const respuesta = await fetch(
                "http://localhost:8000/api/maquinarias",
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "Authorization": "Bearer " + getToken()
                    }
                }
            );

            const resultado = await respuesta.json();

            if (resultado.success) {

                const maquinariasFiltradas = resultado.data.filter(
                    maquinaria =>
                        maquinaria.nombre.toLowerCase().includes(nombre)
                );

                cargarTablaMaquinarias(maquinariasFiltradas);

            } else {

                console.error(resultado.mensaje);

            }

        } catch (error) {

            console.error(
                "Error al buscar maquinaria:",
                error
            );

        }

    });

}
