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

    const rutaNavbar = "./components/navbar.html?v=cuadrillas-20261011-1";

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
    const tabla = document.getElementById('tablaCamiones');
    if (!tabla) return;
    tabla.replaceChildren();
    const datos = Array.isArray(camiones) ? camiones : (camiones.data || []);
    const filtro = document.getElementById('inputMatricula')?.value.trim().toLocaleLowerCase() || '';
    datos.filter(c => !filtro || String(c.matricula).toLocaleLowerCase().includes(filtro)).forEach(camion => {
        const fila = document.createElement('tr');
        [camion.idVehiculo, camion.matricula, camion.marca, camion.tipo, camion.estado, camion.capacidad == null ? 'No aplica' : camion.capacidad + ' kg'].forEach(valor => {const td=document.createElement('td');td.className='text-break';td.textContent=valor;fila.append(td);});
        const td=document.createElement('td'),grupo=document.createElement('div');grupo.className='d-flex flex-wrap gap-1';
        [['Ver','primary','verDatos'],['Editar','secondary','editarCamion'],['Eliminar','danger','eliminarCamion']].forEach(([texto,color,clase])=>{const boton=document.createElement('button');boton.type='button';boton.className=clase+' btn btn-outline-'+color+' btn-sm';boton.dataset.id=camion.idVehiculo;boton.textContent=texto;if(texto==='Ver'){boton.dataset.bsToggle='modal';boton.dataset.bsTarget='#datosCamiones';}grupo.append(boton);});
        td.append(grupo);fila.append(td);tabla.append(fila);
    });
    if(!tabla.children.length){const td=tabla.insertRow().insertCell();td.colSpan=7;td.className='text-center text-body-secondary';td.textContent='No hay vehículos que coincidan con la búsqueda.';}
}

async function consultarRutasFlota(selectId, tipo) {
    const select=document.getElementById(selectId);
    if(!select)return;
    const version=String(Number(select.dataset.version||0)+1);select.dataset.version=version;
    select.replaceChildren(new Option('Cargando rutas...', ''));select.disabled=true;
    try {
        const residuo=tipo==='Camión recolector mixtos'?'Mixtos':tipo==='Camión recolector reciclables'?'Reciclables':'';
        const respuesta=await fetch('http://localhost:8000/api/rutas'+(residuo?'?tipoResiduo='+encodeURIComponent(residuo):''),{headers:{Accept:'application/json',Authorization:'Bearer '+getToken()}});
        const resultado=await respuesta.json();if(select.dataset.version!==version)return;
        if(!respuesta.ok||!Array.isArray(resultado.data))throw Error('No se pudieron consultar rutas');
        select.replaceChildren(new Option('Sin asignación disponible', ''));
        resultado.data.forEach(r=>select.add(new Option(r.descripcion+' · '+r.horario,r.idRuta)));
    }catch(error){if(select.dataset.version!==version)return;select.replaceChildren(new Option('No se pudieron cargar las rutas',''));}
    finally{if(select.dataset.version===version)select.disabled=selectId==='ruta'&&document.getElementById('btnGuardarCamion').classList.contains('d-none');}
}
function actualizarCapacidadFlotaEditada() {
    const capacidad=document.getElementById('capacidad');
    const editando=!document.getElementById('btnGuardarCamion').classList.contains('d-none');
    const aplica=!['Camioneta','Barredora'].includes(document.getElementById('tipo').value);
    capacidad.disabled=!aplica;capacidad.required=aplica&&editando;capacidad.readOnly=!editando;
    if(!aplica)capacidad.value='';
}
if(document.getElementById('tablaCamiones')){
    document.getElementById('tipo').addEventListener('change',()=>{actualizarCapacidadFlotaEditada();consultarRutasFlota('ruta',document.getElementById('tipo').value);});
    document.getElementById('altaCamion_tipo').addEventListener('change',()=>consultarRutasFlota('altaCamion_ruta',document.getElementById('altaCamion_tipo').value));
    document.getElementById('altaCamionModal').addEventListener('show.bs.modal',()=>consultarRutasFlota('altaCamion_ruta',document.getElementById('altaCamion_tipo').value));
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
                document.getElementById("btnGuardarCamion").classList.add("d-none");
                document.getElementById("matricula").readOnly = true;
                document.getElementById("marcaCamion").readOnly = true;
                document.getElementById("tipo").disabled = true;
                document.getElementById("estado").disabled = true;

                document.getElementById("matricula").value = camion.matricula;
                document.getElementById("marcaCamion").value = camion.marca;
                document.getElementById("tipo").value = camion.tipo;
                document.getElementById("estado").value = camion.estado;
                document.getElementById("capacidad").value = camion.capacidad ?? "";
                actualizarCapacidadFlotaEditada();
                await consultarRutasFlota("ruta", camion.tipo);

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

    if (e.target.classList.contains("btn-outline-secondary") && e.target.closest("#tablaCamiones")) {

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
            .then(async resultado => {

                if (resultado.success) {

                    const camion = resultado.data;

                    document.getElementById("matricula").value = camion.matricula;
                document.getElementById("marcaCamion").value = camion.marca;
                    document.getElementById("tipo").value = camion.tipo;
                    document.getElementById("estado").value = camion.estado;
                    document.getElementById("capacidad").value = camion.capacidad ?? "";

                    document.getElementById("matricula").removeAttribute("readonly");
                    document.getElementById("marcaCamion").readOnly = false;
                    document.getElementById("tipo").removeAttribute("disabled");
                    document.getElementById("estado").removeAttribute("disabled");
                    document.getElementById("capacidad").removeAttribute("readonly");

                    document.getElementById("btnGuardarCamion").classList.remove("d-none");
                    actualizarCapacidadFlotaEditada();
                    await consultarRutasFlota("ruta", camion.tipo);

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
        const capacidad = document.getElementById("capacidad").disabled ? null : document.getElementById("capacidad").value;
        const marca = document.getElementById("marcaCamion").value;
        if (!["matricula", "marcaCamion", "capacidad"].every(id => document.getElementById(id).reportValidity())) return;

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
                        marca: marca,
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

/* ---------------------
    LISTAR CENTROS
--------------------- */

// Funcion para cargar la tabla con los datos de los centros

let mapaCentrosListado = null;
let capaCentrosListado = null;

function dibujarMapaCentros(centros) {
    const contenedor = document.getElementById("mapaCentros");
    if (!contenedor || typeof L === "undefined") return;
    if (!mapaCentrosListado) {
        mapaCentrosListado = L.map(contenedor).setView([-34.9, -56.16], 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapaCentrosListado);
        capaCentrosListado = L.featureGroup().addTo(mapaCentrosListado);
    }
    capaCentrosListado.clearLayers();
    let sinUbicacion = 0;
    centros.forEach(centro => {
        const lat = Number(centro.ubicacionX), lng = Number(centro.ubicacionY);
        if (centro.ubicacionX == null || centro.ubicacionY == null || String(centro.ubicacionX).trim() === "" || String(centro.ubicacionY).trim() === "" || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            sinUbicacion++;
            return;
        }
        const contenido = document.createElement("div");
        const nombre = document.createElement("strong");
        nombre.textContent = centro.nombre;
        contenido.append(nombre);
        [centro.direccion, centro.tipo, centro.capacidad == null ? "Capacidad sin especificar" : centro.capacidad + " kg"].forEach(valor => {
            const linea = document.createElement("div");
            linea.textContent = valor;
            contenido.append(linea);
        });
        const ver = document.createElement("button");
        ver.type = "button";
        ver.className = "verDatosCentro btn btn-outline-primary btn-sm mt-2";
        ver.dataset.id = centro.idCentro;
        ver.dataset.bsToggle = "modal";
        ver.dataset.bsTarget = "#datosCentro";
        ver.textContent = "Ver centro";
        contenido.append(ver);
        L.marker([lat, lng]).bindPopup(contenido).addTo(capaCentrosListado);
    });
    if (capaCentrosListado.getLayers().length) {
        mapaCentrosListado.fitBounds(capaCentrosListado.getBounds(), { padding: [25, 25], maxZoom: 15 });
    } else {
        mapaCentrosListado.setView([-34.9, -56.16], 12);
    }
    document.getElementById("estadoMapaCentros").textContent = centros.length === 0 ? "No hay centros para mostrar." : capaCentrosListado.getLayers().length + " centros en el mapa." + (sinUbicacion ? " " + sinUbicacion + " sin coordenadas válidas." : "");
}

function actualizarCapacidadCentroEditado() {
    const capacidad = document.getElementById('verCapacidadCentro');
    if (!capacidad) return;
    const editando = !document.getElementById('btnGuardarCentro').classList.contains('d-none');
    const central = document.getElementById('verTipoCentro').value === 'Central Operativa';
    capacidad.disabled = !editando || central;
    capacidad.required = editando && !central;
    if (central) capacidad.value = '';
}
if (document.getElementById('verTipoCentro')) {
    document.getElementById('verTipoCentro').addEventListener('change', actualizarCapacidadCentroEditado);
}

function cargarTablaCentros(centros) {
    const tabla = document.getElementById("tablaCentros");
    if (!tabla) return;
    tabla.replaceChildren();
    centros.forEach(centro => {
        const fila = document.createElement("tr");
        [centro.nombre, centro.direccion, centro.capacidad == null ? "—" : centro.capacidad + " kg", centro.tipo].forEach(valor => {
            const celda = document.createElement("td");
            celda.className = "text-break";
            celda.textContent = valor;
            fila.append(celda);
        });
        const acciones = document.createElement("td");
        const grupo = document.createElement("div");
        grupo.className = "d-flex flex-wrap gap-1";
        [["Ver", "verDatosCentro", "primary"], ["Editar", "editarCentro", "secondary"], ["Eliminar", "eliminarCentro", "danger"]].forEach(([texto, clase, color]) => {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.className = clase + " btn btn-outline-" + color + " btn-sm";
            boton.dataset.id = centro.idCentro;
            boton.textContent = texto;
            boton.setAttribute("aria-label", texto + " " + centro.nombre);
            if (texto === "Ver") {
                boton.dataset.bsToggle = "modal";
                boton.dataset.bsTarget = "#datosCentro";
            }
            grupo.append(boton);
        });
        acciones.append(grupo);
        fila.append(acciones);
        tabla.append(fila);
    });
    if (!centros.length) {
        const fila = tabla.insertRow();
        const celda = fila.insertCell();
        celda.colSpan = 5;
        celda.className = "text-center text-body-secondary";
        celda.textContent = "No se encontraron centros.";
    }
    dibujarMapaCentros(centros);
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
                    actualizarCapacidadCentroEditado();

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
        const capacidad = document.getElementById("verCapacidadCentro").disabled ? null : document.getElementById("verCapacidadCentro").value;
        if (!document.getElementById("verCapacidadCentro").reportValidity()) return;
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
let contenedorSeleccionadoMapa = null;
let editandoContenedorMapa = false;
let guardandoContenedorMapa = false;
const marcadoresContenedoresMapa = new Map();



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
        mapa.on("click", event => actualizarUbicacionContenedorEditado(event.latlng));

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

        if (!respuesta.ok || !Array.isArray(contenedores.data)) throw new Error('No se pudo consultar el mapa.');
        dibujarContenedores(contenedores.data);
        return true;

    } catch (error) {

        console.error("Error al cargar contenedores:", error);
        return false;

    }
}




function dibujarContenedores(contenedores) {


    if (!capaContenedores) return;


    capaContenedores.clearLayers();
    marcadoresContenedoresMapa.clear();



    contenedores.forEach(contenedor => {



        const marcador = L.marker([
            contenedor.ubicacionY,
            contenedor.ubicacionX
        ]);



        marcador.on("click", () => {


            const panelAlta = document.getElementById('altaContenedorPanel');
            if (guardandoContenedorMapa) return;
            if (editandoContenedorMapa || (panelAlta && !panelAlta.classList.contains('d-none'))) {
                mapa.fire('click', { latlng: marcador.getLatLng() });
            } else {
                mostrarInformacion(contenedor);
            }


        });



        marcador.addTo(capaContenedores);
        marcadoresContenedoresMapa.set(String(contenedor.idContenedor), marcador);



    });


}





async function mostrarInformacion(contenedor) {

    const id = document.getElementById("id");

    if (!id) return;
    contenedorSeleccionadoMapa = { ...contenedor };
    establecerEdicionContenedorMapa(false);

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

/* ---------------------
    EDITAR CONTENEDOR
--------------------- */


function establecerEdicionContenedorMapa(editando) {
    editandoContenedorMapa = editando;
    const editar = document.getElementById('btnEditar');
    if (!editar) return;
    editar.textContent = editando ? 'Guardar' : 'Editar';
    editar.disabled = !contenedorSeleccionadoMapa || guardandoContenedorMapa;
    document.getElementById('btnEliminar').disabled = !contenedorSeleccionadoMapa || guardandoContenedorMapa || editando;
    document.getElementById('btnCancelarEdicionContenedor').classList.toggle('d-none', !editando);
    document.getElementById('btnCancelarEdicionContenedor').disabled = guardandoContenedorMapa;
    document.getElementById('avisoUbicacionEdicion').classList.toggle('d-none', !editando);
    document.getElementById('Nv_Llenado').readOnly = !editando || guardandoContenedorMapa;
    document.getElementById('Ruta').disabled = !editando || guardandoContenedorMapa;
    document.getElementById('Tipo_Residuo').disabled = !editando || guardandoContenedorMapa;
    document.getElementById('agregarContenedorMapa').disabled = editando || guardandoContenedorMapa;
}

function actualizarUbicacionContenedorEditado(punto) {
    if (!editandoContenedorMapa || guardandoContenedorMapa || !contenedorSeleccionadoMapa) return;
    document.getElementById('ubiX').value = punto.lng.toFixed(4);
    document.getElementById('ubiY').value = punto.lat.toFixed(4);
    const marcador = marcadoresContenedoresMapa.get(String(contenedorSeleccionadoMapa.idContenedor));
    if (marcador) marcador.setLatLng(punto);
    document.getElementById('avisoUbicacionEdicion').textContent = 'Nueva ubicación seleccionada. Pulse Guardar para confirmar el cambio.';
}

document.addEventListener('DOMContentLoaded', () => {
    const editar = document.getElementById('btnEditar');
    const eliminar = document.getElementById('btnEliminar');
    if (!editar || !eliminar) return;
    document.getElementById('btnCancelarEdicionContenedor').addEventListener('click', async () => {
        if (guardandoContenedorMapa || !contenedorSeleccionadoMapa) return;
        const original = contenedorSeleccionadoMapa;
        const marcador = marcadoresContenedoresMapa.get(String(original.idContenedor));
        if (marcador) marcador.setLatLng([original.ubicacionY, original.ubicacionX]);
        await mostrarInformacion(original);
    });
    editar.addEventListener('click', async () => {
        if (!contenedorSeleccionadoMapa || guardandoContenedorMapa) return;
        if (!editandoContenedorMapa) {
            document.getElementById('avisoUbicacionEdicion').textContent = 'Seleccione un punto del mapa para cambiar la ubicación del contenedor.';
            establecerEdicionContenedorMapa(true);
            return;
        }
        if (!document.getElementById('Nv_Llenado').reportValidity()) return;
        const id = contenedorSeleccionadoMapa.idContenedor;
        const datos = {
            ubicacionX: document.getElementById('ubiX').value,
            ubicacionY: document.getElementById('ubiY').value,
            nivelLlenado: document.getElementById('Nv_Llenado').value,
            idRuta: document.getElementById('Ruta').value,
            tipo: document.getElementById('Tipo_Residuo').value
        };
        guardandoContenedorMapa = true;
        establecerEdicionContenedorMapa(true);
        let actualizado = false;
        try {
            const respuesta = await fetch('http://localhost:8000/api/contenedores/' + id, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Bearer ' + getToken() },
                body: JSON.stringify(datos)
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok || !resultado.success) throw new Error(resultado.mensaje || resultado.message || 'No se pudo actualizar el contenedor.');
            contenedorSeleccionadoMapa = { ...contenedorSeleccionadoMapa, ...datos, idRuta: datos.idRuta || null };
            actualizado = true;
        } catch (error) {
            alert(error.message);
        } finally {
            guardandoContenedorMapa = false;
            establecerEdicionContenedorMapa(!actualizado);
        }
        if (!actualizado) return;
        const recargado = await cargarMapaContenedores();
        await mostrarInformacion(contenedorSeleccionadoMapa);
        alert(recargado ? 'Contenedor actualizado correctamente.' : 'Contenedor actualizado. No se pudo recargar el mapa; vuelva a cargar la página.');
    });
    eliminar.addEventListener('click', async () => {
        if (!contenedorSeleccionadoMapa || guardandoContenedorMapa || editandoContenedorMapa) return;
        if (!confirm('¿Está seguro de eliminar este contenedor?')) return;
        const id = contenedorSeleccionadoMapa.idContenedor;
        guardandoContenedorMapa = true;
        establecerEdicionContenedorMapa(false);
        let eliminado = false;
        try {
            const respuesta = await fetch('http://localhost:8000/api/contenedores/' + id, {
                method: 'DELETE', headers: { Accept: 'application/json', Authorization: 'Bearer ' + getToken() }
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok || !resultado.success) throw new Error(resultado.mensaje || resultado.message || 'No se pudo eliminar el contenedor.');
            eliminado = true;
            const marcador = marcadoresContenedoresMapa.get(String(id));
            if (marcador) capaContenedores.removeLayer(marcador);
            marcadoresContenedoresMapa.delete(String(id));
            contenedorSeleccionadoMapa = null;
            ['id', 'Nv_Llenado', 'ubiX', 'ubiY', 'Ruta', 'Tipo_Residuo'].forEach(campo => document.getElementById(campo).value = '');
        } catch (error) {
            alert(error.message);
        } finally {
            guardandoContenedorMapa = false;
            establecerEdicionContenedorMapa(false);
        }
        if (!eliminado) return;
        const recargado = await cargarMapaContenedores();
        alert(recargado ? 'Contenedor eliminado correctamente.' : 'Contenedor eliminado. No se pudo recargar el mapa; vuelva a cargar la página.');
    });
});
/* ---------------------
    CREAR CAMIÓN
--------------------- */

/* ---------------------
    MAQUINARIA
--------------------- */

// Alta de maquinaria

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

/* Altas en modales Bootstrap: se conservan los contratos actuales de la API. */
const configuracionAltas = {
    altaCamion: { endpoint: 'camiones', tabla: 'tablaCamiones', render: cargarTabla, filtro: 'inputMatricula', mensaje: 'Camión creado correctamente.' },
    altaCentro: { endpoint: 'centros-acopio', tabla: 'tablaCentros', render: cargarTablaCentros, filtro: 'buscarCentro', mensaje: 'Centro creado correctamente.' },
    altaContenedor: { endpoint: 'contenedores', tabla: 'tablaContenedores', render: cargarTablaContenedores, filtro: 'inputIdContenedor', mensaje: 'Contenedor agregado correctamente.' },
    altaMaquinaria: { endpoint: 'maquinarias', tabla: 'tablaMaquinarias', render: cargarTablaMaquinarias, filtro: 'buscarMaquinaria', mensaje: 'Maquinaria creada correctamente.' },
    altaUsuario: { endpoint: 'usuarios', tabla: 'tablaUsuarios', render: cargarTablaUsuarios, filtro: 'inputNombre', mensaje: 'Usuario registrado correctamente.' }
};

function abrirAltaDesdeEnlace() {
    const idModal = location.hash.slice(1);
    const modal = document.getElementById(idModal);
    if (modal && modal.querySelector('form[data-alta]')) {
        const menuAbierto = document.querySelector('.offcanvas.show');
        const abrir = () => bootstrap.Modal.getOrCreateInstance(modal).show();
        if (menuAbierto) {
            menuAbierto.addEventListener('hidden.bs.offcanvas', abrir, { once: true });
            bootstrap.Offcanvas.getOrCreateInstance(menuAbierto).hide();
        } else {
            abrir();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    abrirAltaDesdeEnlace();
    window.addEventListener('hashchange', abrirAltaDesdeEnlace);
});

async function actualizarVistaTrasAlta(config) {
    const respuesta = await fetch('http://localhost:8000/api/' + config.endpoint, {
        headers: { Accept: 'application/json', Authorization: 'Bearer ' + getToken() }
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok || !Array.isArray(resultado.data)) {
        throw new Error('No se pudo actualizar la vista.');
    }
    const filtro = document.getElementById(config.filtro);
    if (filtro) filtro.value = '';
    if (document.getElementById(config.tabla)) config.render(resultado.data);
    if (config.endpoint === 'contenedores' && document.getElementById('mapa')) {
        dibujarContenedores(resultado.data);
        mapa.invalidateSize();
    }
}

for (const form of document.querySelectorAll('form[data-alta]')) {
    const prefix = form.dataset.alta;
    const config = configuracionAltas[prefix];
    const modal = form.closest('.modal') || form.closest('[data-alta-panel]');
    const errorAlta = form.querySelector('[data-alta-error]');
    const boton = form.querySelector('button[type="submit"]');
    const campo = nombre => form.elements.namedItem(nombre);
    let enviando = false;
    let cargandoRutas = false;
    let versionRutas = 0;

    function actualizarCapacidad() {
        if (prefix !== 'altaCamion' && prefix !== 'altaCentro') return;
        const sinCapacidad = prefix === 'altaCamion'
            ? ['Camioneta', 'Barredora'].includes(campo('tipo').value)
            : campo('tipo').value === 'Central Operativa';
        campo('capacidad').disabled = sinCapacidad;
        campo('capacidad').required = !sinCapacidad;
        if (sinCapacidad) campo('capacidad').value = '';
    }

    async function actualizarRutas() {
        const version = ++versionRutas;
        const tipo = campo('tipoResiduo').value;
        const select = campo('idRuta');
        const mensaje = document.getElementById(prefix + '_mensajeRutas');
        select.replaceChildren(new Option('Sin ruta asignada', ''));
        select.disabled = !tipo;
        mensaje.textContent = '';
        cargandoRutas = Boolean(tipo);
        boton.disabled = enviando || cargandoRutas;
        if (!tipo) return;
        select.disabled = true;
        try {
            const respuesta = await fetch('http://localhost:8000/api/rutas?tipoResiduo=' + encodeURIComponent(tipo), {
                headers: { Accept: 'application/json', Authorization: 'Bearer ' + getToken() }
            });
            const resultado = await respuesta.json();
            if (version !== versionRutas) return;
            if (!respuesta.ok || !Array.isArray(resultado.data)) throw new Error('Error al consultar rutas');
            resultado.data.forEach(ruta => select.add(new Option(ruta.descripcion + ' (' + ruta.horario + ')', ruta.idRuta)));
            if (!resultado.data.length) mensaje.textContent = 'No existen rutas compatibles; el contenedor quedará sin ruta.';
        } catch (error) {
            if (version !== versionRutas) return;
            mensaje.textContent = 'No se pudieron consultar las rutas; puede crear el contenedor sin asignación.';
        } finally {
            if (version === versionRutas) {
                cargandoRutas = false;
                select.disabled = false;
                boton.disabled = enviando;
            }
        }
    }

    if (prefix === 'altaCamion' || prefix === 'altaCentro') {
        campo('tipo').addEventListener('change', actualizarCapacidad);
        actualizarCapacidad();
    }
    if (prefix === 'altaContenedor') {
        campo('tipoResiduo').addEventListener('change', actualizarRutas);
        actualizarRutas();
    }
    if (prefix === 'altaUsuario' || prefix === 'altaMaquinaria') {
        const selectId = prefix + (prefix === 'altaUsuario' ? '_idCentro' : '_idCentroMaquinaria');
        const mensajeId = prefix + (prefix === 'altaUsuario' ? '_mensajeCentrosUsuario' : '_mensajeCentrosMaquinaria');
        modal.addEventListener('show.bs.modal', () => cargarCentrosEnSelect(selectId, mensajeId, form, campo('idCentro').value));
    }
    modal.addEventListener('hidden.bs.modal', () => {
        errorAlta.classList.add('d-none');
        if (location.hash === '#' + modal.id) history.replaceState(null, '', location.pathname + location.search);
    });
    modal.addEventListener('hide.bs.modal', event => { if (enviando) event.preventDefault(); });
    modal.addEventListener('cerrar-alta-mapa', event => { if (enviando) event.preventDefault(); });
    modal.addEventListener('shown.bs.modal', () => {
        form.querySelector('input:not([disabled]), select:not([disabled])')?.focus();
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (enviando || cargandoRutas) return;
        if (modal.hasAttribute('data-alta-panel') && (!campo('ubicacionX').value || !campo('ubicacionY').value)) {
            errorAlta.textContent = 'Seleccione un punto del mapa para indicar la ubicación.';
            errorAlta.classList.remove('d-none');
            return;
        }
        if (!form.reportValidity()) return;
        enviando = true;
        boton.disabled = true;
        const textoBoton = boton.textContent;
        boton.textContent = 'Guardando...';
        errorAlta.classList.add('d-none');
        const datos = Object.fromEntries(new FormData(form));
        if (prefix === 'altaCamion' || prefix === 'altaCentro') datos.capacidad = campo('capacidad').disabled ? null : campo('capacidad').value;
        if (prefix === 'altaContenedor') {
            datos.tipo = datos.tipoResiduo;
            delete datos.tipoResiduo;
            datos.idRuta = campo('idRuta').value;
        }
        const usaFormulario = prefix === 'altaUsuario' || prefix === 'altaContenedor';
        let guardado = false;
        try {
            const respuesta = await fetch('http://localhost:8000/api/' + config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': usaFormulario ? 'application/x-www-form-urlencoded' : 'application/json',
                    Accept: 'application/json', Authorization: 'Bearer ' + getToken()
                },
                body: usaFormulario ? new URLSearchParams(datos).toString() : JSON.stringify(datos)
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok || resultado.success === false || (!resultado.success && !resultado.data)) {
                const errores = resultado.errors ? Object.values(resultado.errors).flat().join(' ') : '';
                throw new Error(errores || resultado.mensaje || resultado.message || 'No se pudo guardar. Revise los datos.');
            }
            guardado = true;
        } catch (error) {
            errorAlta.textContent = error.message || 'No se pudo conectar con el servidor.';
            errorAlta.classList.remove('d-none');
        } finally {
            enviando = false;
            boton.disabled = false;
            boton.textContent = textoBoton;
        }
        if (!guardado) return;
        form.reset();
        actualizarCapacidad();
        if (prefix === 'altaContenedor') actualizarRutas();
        if (modal.hasAttribute('data-alta-panel')) {
            cerrarAltaContenedorMapa();
        } else {
            bootstrap.Modal.getOrCreateInstance(modal).hide();
        }
        try {
            await actualizarVistaTrasAlta(config);
            alert(config.mensaje);
        } catch (error) {
            alert(config.mensaje + ' No se pudo actualizar el listado; recargue la página para consultarlo.');
        }
    });
}

/* Alta de contenedor desde el mapa: panel lateral y selección de ubicación. */
let marcadorAltaContenedor = null;

function cerrarAltaContenedorMapa() {
    const panel = document.getElementById('altaContenedorPanel');
    if (!panel) return;
    if (!panel.dispatchEvent(new Event('cerrar-alta-mapa', { cancelable: true }))) return;
    panel.classList.add('d-none');
    document.getElementById('infoContenedor').classList.remove('d-none');
    const boton = document.getElementById('agregarContenedorMapa');
    boton.disabled = false;
    boton.setAttribute('aria-expanded', 'false');
    if (marcadorAltaContenedor) {
        mapa.removeLayer(marcadorAltaContenedor);
        marcadorAltaContenedor = null;
    }
    document.getElementById('formContenedor').reset();
    document.getElementById('altaContenedor_tipoResiduo').dispatchEvent(new Event('change'));
    panel.querySelector('[data-alta-error]').classList.add('d-none');
    document.getElementById('ayudaUbicacionAlta').textContent = 'Seleccione un punto del mapa para cargar la ubicación del contenedor.';
    mapa.invalidateSize();
    boton.focus();
}

document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('altaContenedorPanel');
    if (!panel || !mapa) return;
    const boton = document.getElementById('agregarContenedorMapa');
    const x = document.getElementById('altaContenedor_ubicacionX');
    const y = document.getElementById('altaContenedor_ubicacionY');
    const ayuda = document.getElementById('ayudaUbicacionAlta');
    boton.addEventListener('click', () => {
        panel.classList.remove('d-none');
        document.getElementById('infoContenedor').classList.add('d-none');
        boton.setAttribute('aria-expanded', 'true');
        boton.disabled = true;
        mapa.invalidateSize();
    });
    document.getElementById('cancelarAltaMapa').addEventListener('click', cerrarAltaContenedorMapa);
    function seleccionarUbicacion(punto) {
        x.value = punto.lng.toFixed(4);
        y.value = punto.lat.toFixed(4);
        ayuda.textContent = 'Ubicación seleccionada. Puede elegir otro punto o arrastrar el marcador para ajustarla.';
        panel.querySelector('[data-alta-error]').classList.add('d-none');
        if (marcadorAltaContenedor) marcadorAltaContenedor.setLatLng(punto);
        else {
            marcadorAltaContenedor = L.marker(punto, { draggable: true }).addTo(mapa);
            marcadorAltaContenedor.bindTooltip('Ubicación del nuevo contenedor');
            marcadorAltaContenedor.on('dragend', () => seleccionarUbicacion(marcadorAltaContenedor.getLatLng()));
        }
    }
    mapa.on('click', event => {
        if (!panel.classList.contains('d-none')) seleccionarUbicacion(event.latlng);
    });
});

/* Vista de rutas: listado, mapa y formulario lateral. */
document.addEventListener('DOMContentLoaded', async () => {
    const mapaElemento = document.getElementById('mapaRutas');
    if (!mapaElemento) return;
    const lista = document.getElementById('listaRutas');
    const mensaje = document.getElementById('mensajeRutasVista');
    const formulario = document.getElementById('columnaFormularioRuta');
    const columnaLista = document.getElementById('columnaListaRutas');
    const columnaMapa = document.getElementById('columnaMapaRutas');
    const form = document.getElementById('formRuta');
    const botonNuevo = document.getElementById('nuevaRuta');
    const botonEditar = document.getElementById('editarRuta');
    const buscar = document.getElementById('buscarRuta');
    const anterior = document.getElementById('paginaAnteriorRutas');
    const siguiente = document.getElementById('paginaSiguienteRutas');
    const detalleMapa = document.getElementById('detalleMapaRutas');
    const leyenda = document.getElementById('leyendaRutas');
    const estilos = [
        { color: '#0d6efd', clase: 'text-bg-primary' },
        { color: '#198754', clase: 'text-bg-success' },
        { color: '#dc3545', clase: 'text-bg-danger' },
        { color: '#ffc107', clase: 'text-bg-warning' },
        { color: '#0dcaf0', clase: 'text-bg-info' },
        { color: '#212529', clase: 'text-bg-dark' }
    ];
    let rutas = [], contenedores = [], seleccionada = null, pagina = 1;
    let modoFormulario = 'nuevo';
    const porPagina = 5;
    const mapaRutas = window.L ? L.map(mapaElemento).setView([-34.8965, -56.131], 13) : null;
    const capa = mapaRutas ? L.layerGroup().addTo(mapaRutas) : null;
    if (mapaRutas) {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap', maxZoom: 19
        }).addTo(mapaRutas);
        new ResizeObserver(() => mapaRutas.invalidateSize()).observe(mapaElemento);
    } else {
        mapaElemento.textContent = 'No se pudo cargar el mapa. El listado de rutas sigue disponible.';
    }
    const esSeleccionada = ruta => seleccionada && String(ruta.idRuta) === String(seleccionada.idRuta);
    const puntosRuta = ruta => contenedores.filter(c => c.idRuta != null && String(c.idRuta) === String(ruta.idRuta) && c.ubicacionX != null && c.ubicacionY != null && c.ubicacionX !== '' && c.ubicacionY !== '' && Number.isFinite(Number(c.ubicacionX)) && Number.isFinite(Number(c.ubicacionY)) && Math.abs(Number(c.ubicacionY)) <= 90 && Math.abs(Number(c.ubicacionX)) <= 180);

    function mostrarMensaje(texto, tipo = 'info') {
        mensaje.textContent = texto;
        mensaje.className = 'alert alert-' + tipo + ' text-start';
    }
    function dibujarMapa() {
        if (capa) capa.clearLayers();
        leyenda.replaceChildren();
        const limites = [];
        const visibles = seleccionada ? rutas.filter(esSeleccionada) : rutas;
        for (const ruta of visibles) {
            const estilo = estilos[rutas.indexOf(ruta) % estilos.length];
            const puntos = puntosRuta(ruta);
            const etiqueta = document.createElement('span');
            etiqueta.className = 'badge ' + estilo.clase + ' text-wrap text-start';
            etiqueta.textContent = 'Ruta ' + ruta.idRuta + ': ' + ruta.descripcion + (puntos.length ? ' (' + puntos.length + ')' : ' — sin ubicaciones');
            leyenda.appendChild(etiqueta);
            if (!capa) continue;
            puntos.forEach(contenedor => {
                const ubicacion = [Number(contenedor.ubicacionY), Number(contenedor.ubicacionX)];
                limites.push(ubicacion);
                const texto = document.createElement('div');
                texto.textContent = 'Ruta ' + ruta.idRuta + ' — ' + ruta.descripcion + ' | Contenedor ' + contenedor.idContenedor;
                L.circleMarker(ubicacion, { radius: 8, color: estilo.color, fillColor: estilo.color, fillOpacity: 0.85, weight: 2 }).bindPopup(texto).addTo(capa);
            });
        }
        if (limites.length) mapaRutas.fitBounds(limites, { padding: [24, 24], maxZoom: 16 });
        detalleMapa.textContent = seleccionada
            ? 'Ruta ' + seleccionada.idRuta + ': ' + puntosRuta(seleccionada).length + ' contenedores con ubicación.'
            : rutas.length + ' rutas registradas; ' + limites.length + ' contenedores con ubicación en el mapa.';
    }
    function dibujarLista() {
        const termino = buscar.value.trim().toLocaleLowerCase();
        const filtradas = rutas.filter(r => (String(r.idRuta) + ' ' + r.descripcion).toLocaleLowerCase().includes(termino));
        const paginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
        pagina = Math.min(pagina, paginas);
        lista.replaceChildren();
        if (!filtradas.length) {
            const vacio = document.createElement('p');
            vacio.className = 'text-muted mb-0';
            vacio.textContent = rutas.length ? 'No hay rutas que coincidan con la búsqueda.' : 'No hay rutas registradas.';
            lista.appendChild(vacio);
        }
        filtradas.slice((pagina - 1) * porPagina, pagina * porPagina).forEach(ruta => {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'list-group-item list-group-item-action rounded text-break' + (esSeleccionada(ruta) ? ' active' : '');
            boton.setAttribute('aria-pressed', String(Boolean(esSeleccionada(ruta))));
            boton.textContent = 'RUTA - ' + String(ruta.idRuta).padStart(2, '0') + ' | ' + ruta.descripcion;
            boton.addEventListener('click', () => {
                seleccionada = ruta;
                botonEditar.disabled = false;
                dibujarLista();
                dibujarMapa();
                if (!formulario.classList.contains('d-none') && modoFormulario === 'editar') completarFormulario(ruta);
            });
            lista.appendChild(boton);
        });
        anterior.disabled = pagina === 1;
        siguiente.disabled = pagina === paginas;
        document.getElementById('paginaActualRutas').textContent = 'Página ' + pagina + ' de ' + paginas;
    }
    function completarFormulario(ruta) {
        document.getElementById('descripcionRuta').value = ruta.descripcion || '';
        document.getElementById('horarioRuta').value = ruta.horario || '';
        document.getElementById('tipoResiduoRuta').value = ruta.tipoResiduo || '';
        document.getElementById('identificadorRuta').value = ruta.idRuta;
        document.getElementById('contenedoresRuta').value = contenedores.filter(c => String(c.idRuta) === String(ruta.idRuta)).length;
    }
    function abrirFormulario(modo) {
        modoFormulario = modo;
        form.reset();
        document.getElementById('tituloFormularioRuta').textContent = modo === 'editar' ? 'Editar ruta' : 'Nueva ruta';
        document.getElementById('estadoGuardadoRuta').textContent = modo === 'editar'
            ? 'Puede consultar y ajustar los datos. El guardado estará disponible al habilitar la edición de rutas.'
            : 'Puede completar el formulario. El guardado estará disponible al habilitar el alta de rutas.';
        if (modo === 'editar' && seleccionada) completarFormulario(seleccionada);
        formulario.classList.remove('d-none');
        columnaLista.classList.replace('col-lg-4', 'col-lg-3');
        columnaMapa.classList.replace('col-lg-8', 'col-lg-6');
        botonNuevo.setAttribute('aria-expanded', 'true');
        if (mapaRutas) mapaRutas.invalidateSize();
        document.getElementById('descripcionRuta').focus({ preventScroll: true });
    }
    function cerrarFormulario() {
        formulario.classList.add('d-none');
        columnaLista.classList.replace('col-lg-3', 'col-lg-4');
        columnaMapa.classList.replace('col-lg-6', 'col-lg-8');
        botonNuevo.setAttribute('aria-expanded', 'false');
        form.reset();
        if (location.hash === '#nuevaRuta') history.replaceState(null, '', location.pathname + location.search);
        if (mapaRutas) mapaRutas.invalidateSize();
        botonNuevo.focus();
    }
    function abrirDesdeEnlace() {
        if (location.hash !== '#nuevaRuta') return;
        const menu = document.querySelector('.offcanvas.show');
        if (menu) {
            menu.addEventListener('hidden.bs.offcanvas', () => abrirFormulario('nuevo'), { once: true });
            bootstrap.Offcanvas.getOrCreateInstance(menu).hide();
        } else abrirFormulario('nuevo');
    }
    botonNuevo.addEventListener('click', () => abrirFormulario('nuevo'));
    botonEditar.addEventListener('click', () => { if (seleccionada) abrirFormulario('editar'); });
    document.getElementById('cancelarRuta').addEventListener('click', cerrarFormulario);
    document.getElementById('cerrarFormularioRuta').addEventListener('click', cerrarFormulario);
    document.getElementById('mostrarTodasRutas').addEventListener('click', () => {
        seleccionada = null;
        botonEditar.disabled = true;
        if (modoFormulario === 'editar') cerrarFormulario();
        dibujarLista(); dibujarMapa();
    });
    buscar.addEventListener('input', () => { pagina = 1; dibujarLista(); });
    anterior.addEventListener('click', () => { pagina--; dibujarLista(); });
    siguiente.addEventListener('click', () => { pagina++; dibujarLista(); });
    form.addEventListener('submit', e => e.preventDefault());
    window.addEventListener('hashchange', abrirDesdeEnlace);
    abrirDesdeEnlace();
    async function consultar(endpoint) {
        const respuesta = await fetch('http://localhost:8000/api/' + endpoint, {
            headers: { Accept: 'application/json', Authorization: 'Bearer ' + getToken() }
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok || !Array.isArray(resultado.data)) throw new Error(resultado.mensaje || resultado.message || 'No se pudo consultar ' + endpoint + '.');
        return resultado.data;
    }
    const [resultadoRutas, resultadoContenedores] = await Promise.allSettled([consultar('rutas'), consultar('contenedores')]);
    if (resultadoRutas.status === 'fulfilled') rutas = resultadoRutas.value;
    if (resultadoContenedores.status === 'fulfilled') contenedores = resultadoContenedores.value;
    if (resultadoRutas.status === 'rejected') mostrarMensaje('No se pudieron cargar las rutas. ' + resultadoRutas.reason.message, 'danger');
    else if (resultadoContenedores.status === 'rejected') mostrarMensaje('Las rutas se cargaron, pero no se pudieron consultar las ubicaciones de sus contenedores.', 'warning');
    else mostrarMensaje(rutas.length ? 'Seleccione una ruta para consultar sus datos y ubicaciones.' : 'No hay rutas registradas.');
    dibujarLista(); dibujarMapa();
});

/* Vista de incidencias. La fuente de datos se conectará al habilitar su API.
   cargarTablaIncidencias recibe idIncidencia, tipo, estado, idCuadrilla,
   cuadrilla (nombre), contenedor (idContenedor, ubicacionX, ubicacionY)
   o vehiculo (idCamion, matricula). No persiste datos de ejemplo. */
let incidenciasListado = [];
let mapaIncidenciasListado = null;
let marcadoresIncidenciasListado = null;

function datosVistaIncidencia(incidencia) {
    const esContenedor = !!incidencia.contenedor || incidencia.idContenedor != null;
    const elemento = esContenedor ? incidencia.contenedor : incidencia.vehiculo;
    const id = esContenedor ? (elemento?.idContenedor ?? incidencia.idContenedor) : (elemento?.idCamion ?? incidencia.idCamion ?? incidencia.idVehiculo);
    const asignada = incidencia.idCuadrilla != null || incidencia.cuadrilla != null;
    const cuadrilla = typeof incidencia.cuadrilla === 'object' ? incidencia.cuadrilla?.nombre : incidencia.cuadrilla;
    return {
        esContenedor, asignada,
        id: incidencia.idIncidencia,
        tipo: incidencia.tipo ?? incidencia.tipoIncidencia ?? 'Sin especificar',
        estado: incidencia.estado ?? 'Sin especificar',
        cuadrilla: asignada ? 'Asignada · ' + (cuadrilla || 'Cuadrilla ' + (incidencia.idCuadrilla ?? incidencia.cuadrilla?.idCuadrilla ?? 'sin identificar')) : 'Sin asignar',
        elemento: (esContenedor ? 'Contenedor' : 'Vehículo') + (id != null ? ' #' + id : '') + (elemento?.matricula ? ' · ' + elemento.matricula : ''),
        lat: elemento?.ubicacionX, lng: elemento?.ubicacionY
    };
}

function verIncidencia(incidencia) {
    const datos = datosVistaIncidencia(incidencia);
    const detalle = document.getElementById('datosIncidencia');
    detalle.replaceChildren();
    [['ID', datos.id], ['Tipo de incidencia', datos.tipo], ['Estado', datos.estado], ['Cuadrilla', datos.cuadrilla], ['Elemento reportado', datos.elemento], ['Descripción', incidencia.descripcion ?? 'Sin descripción']].forEach(([titulo, valor]) => {
        const termino = document.createElement('dt');
        termino.className = 'col-12 col-sm-4';
        termino.textContent = titulo;
        const contenido = document.createElement('dd');
        contenido.className = 'col-12 col-sm-8 text-break';
        contenido.textContent = valor;
        detalle.append(termino, contenido);
    });
    bootstrap.Modal.getOrCreateInstance(document.getElementById('detalleIncidencia')).show();
}

function cargarTablaIncidencias(incidencias) {
    if (!document.getElementById('tablaIncidencias')) return;
    incidenciasListado = Array.isArray(incidencias) ? incidencias : [];
    const select = document.getElementById('estadoIncidencia');
    const anterior = select.value;
    select.replaceChildren(new Option('Todos los estados', ''));
    [...new Set(incidenciasListado.map(i => datosVistaIncidencia(i).estado))].sort().forEach(estado => select.add(new Option(estado, estado)));
    if ([...select.options].some(opcion => opcion.value === anterior)) select.value = anterior;
    document.getElementById('disponibilidadIncidencias').classList.toggle('d-none', incidenciasListado.length > 0);
    filtrarIncidencias();
}

function filtrarIncidencias() {
    const buscar = document.getElementById('buscarIncidencia').value.trim().toLocaleLowerCase();
    const elemento = document.getElementById('elementoIncidencia').value;
    const estado = document.getElementById('estadoIncidencia').value;
    const asignacion = document.getElementById('asignacionIncidencia').value;
    const visibles = incidenciasListado.filter(incidencia => {
        const d = datosVistaIncidencia(incidencia);
        return (!buscar || [d.id, d.tipo, d.elemento].join(' ').toLocaleLowerCase().includes(buscar))
            && (!elemento || (d.esContenedor ? 'contenedor' : 'vehiculo') === elemento)
            && (!estado || d.estado === estado)
            && (!asignacion || d.asignada === (asignacion === 'si'));
    });
    const tabla = document.getElementById('tablaIncidencias');
    tabla.replaceChildren();
    marcadoresIncidenciasListado?.clearLayers();
    let sinUbicacion = 0;
    visibles.forEach(incidencia => {
        const d = datosVistaIncidencia(incidencia);
        const fila = document.createElement('tr');
        [d.id, d.tipo, d.estado, d.cuadrilla, d.elemento].forEach(valor => {
            const celda = document.createElement('td');
            celda.className = 'text-break';
            celda.textContent = valor;
            fila.append(celda);
        });
        const accion = document.createElement('td');
        const ver = document.createElement('button');
        ver.type = 'button';
        ver.className = 'btn btn-outline-primary btn-sm';
        ver.textContent = 'Ver';
        ver.setAttribute('aria-label', 'Ver incidencia ' + d.id);
        ver.addEventListener('click', () => verIncidencia(incidencia));
        accion.append(ver);
        fila.append(accion);
        tabla.append(fila);
        if (!d.esContenedor) return;
        const lat = Number(d.lat), lng = Number(d.lng);
        if (d.lat == null || d.lng == null || String(d.lat).trim() === '' || String(d.lng).trim() === '' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) { sinUbicacion++; return; }
        if (!marcadoresIncidenciasListado) return;
        const popup = document.createElement('div');
        const titulo = document.createElement('strong');
        titulo.textContent = 'Incidencia #' + d.id;
        const texto = document.createElement('p');
        texto.className = 'mb-2';
        texto.textContent = d.elemento + ' · ' + d.tipo + ' · ' + d.estado;
        const boton = ver.cloneNode(true);
        boton.addEventListener('click', () => verIncidencia(incidencia));
        popup.append(titulo, texto, boton);
        L.marker([lat, lng]).bindPopup(popup).addTo(marcadoresIncidenciasListado);
    });
    if (!visibles.length) {
        const celda = tabla.insertRow().insertCell();
        celda.colSpan = 6;
        celda.className = 'text-center text-body-secondary py-4';
        celda.textContent = incidenciasListado.length ? 'No hay incidencias que coincidan con los filtros.' : 'No hay incidencias disponibles.';
    }
    document.getElementById('cantidadIncidencias').textContent = visibles.length + ' de ' + incidenciasListado.length + ' incidencias';
    const marcadores = marcadoresIncidenciasListado?.getLayers().length ?? 0;
    document.getElementById('estadoMapaIncidencias').textContent = marcadores + ' incidencias de contenedores en el mapa.' + (sinUbicacion ? ' ' + sinUbicacion + ' sin ubicación válida.' : '');
    if (marcadores) mapaIncidenciasListado.fitBounds(marcadoresIncidenciasListado.getBounds(), { padding: [25, 25], maxZoom: 15 });
    else mapaIncidenciasListado?.setView([-34.9, -56.16], 12);
}

if (document.getElementById('tablaIncidencias')) {
    if (typeof L !== 'undefined') {
        mapaIncidenciasListado = L.map('mapaIncidencias').setView([-34.9, -56.16], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(mapaIncidenciasListado);
        marcadoresIncidenciasListado = L.featureGroup().addTo(mapaIncidenciasListado);
    }
    ['buscarIncidencia', 'elementoIncidencia', 'estadoIncidencia', 'asignacionIncidencia'].forEach(id => document.getElementById(id).addEventListener(id === 'buscarIncidencia' ? 'input' : 'change', filtrarIncidencias));
    cargarTablaIncidencias([]);
}

/* Prototipo de chofer: sesión local, sin operaciones en las APIs.
   Contrato de ruta: idRuta, descripcion, paradas ordenadas con idContenedor,
   lat/lng y un último punto tipo deposito; trazado opcional [[lat,lng],...]. */
const CLAVE_PREVIA_CHOFER = 'sigeru_chofer_vista_previa_v1';
function leerVistaChofer() {
    try { return JSON.parse(sessionStorage.getItem(CLAVE_PREVIA_CHOFER)) || { rutas: [], avances: {} }; }
    catch { return { rutas: [], avances: {} }; }
}
function guardarVistaChofer(datos) { sessionStorage.setItem(CLAVE_PREVIA_CHOFER, JSON.stringify(datos)); }
function ejemplosChofer() {
    return [1, 2].map(id => ({ idRuta: id, descripcion: 'Ruta de ejemplo ' + id,
        paradas: Array.from({length: 8}, (_, i) => ({ tipo: 'contenedor', idContenedor: id * 100 + i + 1, nombre: 'Contenedor #' + (id * 100 + i + 1), lat: -34.90 + i * 0.002, lng: -56.17 + id * 0.008 + i * 0.001 } )).concat([{tipo: 'deposito', nombre: 'Depósito final de ejemplo', lat: -34.88, lng: -56.14 + id * 0.002}])
    }));
}
function crearMapaChofer(id) {
    if (typeof L === 'undefined') return null;
    const mapa = L.map(id).setView([-34.9, -56.16], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(mapa);
    return mapa;
}
function puntoChoferValido(p) { return p.lat != null && p.lng != null && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) && Math.abs(Number(p.lat)) <= 90 && Math.abs(Number(p.lng)) <= 180; }
if (document.getElementById('listaRutasChofer')) {
    const mapa = crearMapaChofer('mapaRutasChofer');
    const capa = mapa ? L.featureGroup().addTo(mapa) : null;
    let pagina = 1;
    function dibujar() {
        const datos = leerVistaChofer();
        const lista = document.getElementById('listaRutasChofer');
        const leyenda = document.getElementById('leyendaChofer');
        lista.replaceChildren(); leyenda.replaceChildren(); capa?.clearLayers();
        const paginas = Math.max(1, Math.ceil(datos.rutas.length / 5));
        pagina = Math.min(pagina, paginas);
        datos.rutas.slice((pagina - 1) * 5, pagina * 5).forEach(ruta => {
            const item = document.createElement('div'); item.className = 'list-group-item rounded d-flex align-items-center justify-content-between gap-2';
            const titulo = document.createElement('span'); titulo.className = 'text-break'; titulo.textContent = ruta.descripcion;
            const iniciar = document.createElement('a'); iniciar.className = 'btn btn-success btn-sm flex-shrink-0'; iniciar.textContent = 'Iniciar recorrido'; iniciar.href = 'recorridoChofer.html?ruta=' + encodeURIComponent(ruta.idRuta);
            item.append(titulo, iniciar); lista.append(item);
        });
        if (!datos.rutas.length) { const vacio = document.createElement('p'); vacio.className = 'text-body-secondary'; vacio.textContent = 'No hay rutas asignadas disponibles.'; lista.append(vacio); }
        datos.rutas.forEach((ruta, i) => {
            const color = ['#0d6efd', '#198754', '#6f42c1'][i % 3];
            const etiqueta = document.createElement('span'); etiqueta.className = 'badge border text-wrap'; etiqueta.style.color = color; etiqueta.textContent = ruta.descripcion; leyenda.append(etiqueta);
            if (!capa) return;
            const puntos = ruta.paradas.filter(puntoChoferValido);
            const trazado = ruta.trazado || puntos.map(p => [Number(p.lat), Number(p.lng)]);
            if (trazado.length > 1) L.polyline(trazado, {color, weight: 4}).addTo(capa);
            puntos.forEach(p => { const texto = document.createElement('span'); texto.textContent = ruta.descripcion + ' · ' + p.nombre; L.circleMarker([p.lat, p.lng], {color, radius: p.tipo === 'deposito' ? 9 : 6}).bindPopup(texto).addTo(capa); });
        });
        if (capa?.getLayers().length) mapa.fitBounds(capa.getBounds(), {padding:[25,25], maxZoom:15});
        document.getElementById('paginaChofer').textContent = 'Página ' + pagina + ' de ' + paginas;
        document.getElementById('anteriorChofer').disabled = pagina === 1;
        document.getElementById('siguienteChofer').disabled = pagina === paginas;
    }
    document.getElementById('ejemploRutasChofer').addEventListener('click', () => { guardarVistaChofer({rutas: ejemplosChofer(), avances: {}}); pagina = 1; dibujar(); });
    document.getElementById('anteriorChofer').addEventListener('click', () => {pagina--; dibujar();});
    document.getElementById('siguienteChofer').addEventListener('click', () => {pagina++; dibujar();});
    dibujar();
}
if (document.getElementById('paradasChofer')) {
    const datos = leerVistaChofer();
    const id = new URLSearchParams(location.search).get('ruta');
    const ruta = datos.rutas.find(r => String(r.idRuta) === id);
    const mapa = crearMapaChofer('mapaRecorridoChofer');
    const capa = mapa ? L.featureGroup().addTo(mapa) : null;
    const recolectar = document.getElementById('recolectarChofer');
    const incidencia = document.getElementById('incidenciaChofer');
    const deposito = document.getElementById('depositoChofer');
    const completar = document.getElementById('completarRutaChofer');
    let avance = datos.avances[id] || { indice: 0, acciones: [] };
    let objetivoReporte = null;
    function mostrar() {
        const lista = document.getElementById('paradasChofer'); lista.replaceChildren(); capa?.clearLayers();
        const pendientes = ruta ? ruta.paradas.slice(avance.indice) : [];
        document.getElementById('nombreRecorridoChofer').textContent = ruta?.descripcion || 'Ruta no disponible';
        document.getElementById('progresoChofer').textContent = ruta ? avance.indice + ' de ' + ruta.paradas.length + ' puntos atendidos' : 'Volvé a Mis rutas para seleccionar un recorrido.';
        pendientes.slice(0,5).forEach((p,i) => {
            const item = document.createElement('li'); item.className = 'list-group-item text-break' + (i === 0 ? ' list-group-item-success fw-semibold' : ''); item.textContent = p.nombre + (p.tipo === 'deposito' ? ' · Depósito final' : '') + (i === 0 ? ' · Próximo punto' : ''); lista.append(item);
        });
        const primero = pendientes[0];
        recolectar.disabled = !!avance.completada || !primero || primero.tipo !== 'contenedor';
        incidencia.disabled = !ruta || !!avance.completada || !primero;
        completar.disabled = !ruta || !!avance.completada || !pendientes.length;
        deposito.classList.toggle('d-none', !!avance.completada || !primero || primero.tipo !== 'deposito');
        const mensaje = document.getElementById('mensajeChofer'); mensaje.classList.toggle('d-none', !ruta || (!avance.completada && pendientes.length > 0));
        mensaje.textContent = avance.completada ? 'Ruta reportada como completada en esta vista previa. ' + pendientes.filter(p => p.tipo === 'contenedor').length + ' contenedores y ' + pendientes.filter(p => p.tipo === 'deposito').length + ' puntos de depósito quedaron pendientes.' : 'Ruta completada: llegada al depósito confirmada en esta vista previa.';
        if (!capa) return;
        const validos = pendientes.filter(puntoChoferValido);
        if (validos.length > 1) L.polyline(validos.map(p => [p.lat,p.lng]), {color:'#0d6efd', weight:4}).addTo(capa);
        validos.forEach(p => {const texto = document.createElement('span'); texto.textContent = p.nombre; L.marker([p.lat,p.lng]).bindPopup(texto).addTo(capa);});
        if (capa.getLayers().length) mapa.fitBounds(capa.getBounds(), {padding:[25,25], maxZoom:15});
    }
    function avanzar(accion, reporte = null) {
        const punto = ruta?.paradas[avance.indice];
        if (avance.completada || !punto || (accion === 'deposito' ? punto.tipo !== 'deposito' : punto.tipo !== 'contenedor')) return;
        avance.acciones.push({punto: punto.idContenedor ?? 'deposito', accion, reporte}); avance.indice++; datos.avances[id] = avance; guardarVistaChofer(datos); mostrar();
    }
    recolectar.addEventListener('click', () => avanzar('recolectado'));
    deposito.addEventListener('click', () => avanzar('deposito'));
    incidencia.addEventListener('click', () => {
        objetivoReporte = avance.indice;
        const form = document.getElementById('formIncidenciaChofer'); form.reset();
        document.getElementById('elementoTipoReporteChofer').value = ruta.paradas[avance.indice].tipo === 'contenedor' ? 'contenedor' : 'vehiculo';
        actualizarTiposReporte();
        document.getElementById('elementoReporteChofer').textContent = ruta.paradas[avance.indice].nombre;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalIncidenciaChofer')).show();
    });
    document.getElementById('formIncidenciaChofer').addEventListener('submit', e => {
        e.preventDefault();
        const descripcion = document.getElementById('descripcionReporteChofer');
        descripcion.setCustomValidity(descripcion.value.trim() ? '' : 'Describí la incidencia.');
        if (!e.target.reportValidity()) return;
        if (objetivoReporte !== avance.indice) return;
        if (avance.completada) return;
        const elemento = document.getElementById('elementoTipoReporteChofer').value;
        const reporte = {elemento, tipo:document.getElementById('tipoReporteChofer').value, descripcion:descripcion.value.trim()};
        if (elemento === 'contenedor') {
            if (ruta.paradas[avance.indice]?.tipo !== 'contenedor') return;
            avanzar('incidencia', reporte);
        } else {
            avance.acciones.push({punto: 'vehiculo', accion: 'incidencia', reporte});
            datos.avances[id] = avance; guardarVistaChofer(datos); mostrar();
        }
        objetivoReporte = null;
        bootstrap.Modal.getInstance(document.getElementById('modalIncidenciaChofer')).hide();
    });
    document.getElementById('descripcionReporteChofer').addEventListener('input', e => e.target.setCustomValidity(''));
    function actualizarTiposReporte() {
        const elemento = document.getElementById('elementoTipoReporteChofer').value;
        const tipos = elemento === 'vehiculo' ? ['Vehículo averiado', 'Sistema informático de vehículo defectuoso', 'Sistema de recolección averiado'] : elemento === 'contenedor' ? ['Residuos fuera de contenedor', 'Incendiado', 'Roto', 'Ruta a contenedor obstruida'] : [];
        const select = document.getElementById('tipoReporteChofer');
        select.replaceChildren(new Option('Seleccioná un tipo', ''));
        tipos.forEach(tipo => select.add(new Option(tipo, tipo)));
        select.disabled = !elemento;
        const opcion = document.querySelector('#elementoTipoReporteChofer option[value="contenedor"]');
        opcion.disabled = ruta?.paradas[avance.indice]?.tipo !== 'contenedor';
        document.getElementById('avisoElementoReporteChofer').textContent = elemento === 'vehiculo' ? 'La incidencia se registra sobre el vehículo; los contenedores pendientes se mantienen.' : elemento === 'contenedor' ? 'La incidencia se registra sobre el primer contenedor pendiente y permite avanzar al siguiente.' : '';
    }
    document.getElementById('elementoTipoReporteChofer').addEventListener('change', actualizarTiposReporte);
    completar.addEventListener('click', () => {
        if (!ruta || avance.completada) return;
        const pendientes = ruta.paradas.slice(avance.indice);
        const contenedores = pendientes.filter(p => p.tipo === 'contenedor').length;
        const depositos = pendientes.filter(p => p.tipo === 'deposito').length;
        document.getElementById('avisoCompletarRutaChofer').textContent = 'Aún quedan pendientes de recolección ' + contenedores + ' contenedores y ' + depositos + ' puntos de depósito. ¿Deseás confirmar igualmente la ruta como completada?';
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCompletarRutaChofer')).show();
    });
    document.getElementById('confirmarCompletarRutaChofer').addEventListener('click', () => {
        if (!ruta || avance.completada) return;
        avance.completada = true;
        avance.acciones.push({accion: 'ruta_completada', pendientes: ruta.paradas.slice(avance.indice)});
        datos.avances[id] = avance; guardarVistaChofer(datos); mostrar();
        bootstrap.Modal.getInstance(document.getElementById('modalCompletarRutaChofer')).hide();
    });
    mostrar();
}

/* Cuadrillas: catálogos de API, composiciones de vista previa por pestaña.
   CUADRILLA -> INTEGRA_CUADRILLA (un único responsable operario),
   CUADRILLA_VEHICULO y ASIGNA_RUTA. Las APIs de estas relaciones aún no existen. */
if (document.getElementById('tablaCuadrillas')) {
    (async function inicializarCuadrillas() {
        const clave = 'sigeru_cuadrillas_vista_previa_v1';
        let cuadrillas = [];
        try { const previas = JSON.parse(sessionStorage.getItem(clave) || '[]'); if (Array.isArray(previas)) cuadrillas = previas; } catch {}
        let usuarios = [], vehiculos = [], rutas = [], editando = null, consultando = false;
        const operariosIds = ['responsableCuadrilla', 'operarioCuadrilla1', 'operarioCuadrilla2'];
        const form = document.getElementById('formCuadrilla');
        const campo = id => document.getElementById(id);
        const nombre = id => { const u = usuarios.find(u => String(u.idUsu) === String(id)); return u ? [u.nombre1, u.nombre2, u.apellido1, u.apellido2].filter(Boolean).join(' ') : 'Usuario #' + id; };
        const vehiculo = () => vehiculos.find(v => String(v.idVehiculo) === campo('vehiculoCuadrilla').value);
        function error(texto) {campo('errorCuadrilla').textContent = texto; campo('errorCuadrilla').classList.toggle('d-none', !texto);}
        function guardar() {sessionStorage.setItem(clave, JSON.stringify(cuadrillas));}
        function opciones(select, datos, id, etiqueta, requerido) {
            select.replaceChildren(new Option(requerido ? 'Seleccioná una opción' : 'Sin asignar', ''));
            datos.forEach(d => select.add(new Option(etiqueta(d), d[id])));
        }
        function actualizarIntegrantes() {
            operariosIds.forEach(id => {
                const select = campo(id);
                [...select.options].forEach(opcion => {opcion.disabled = !!opcion.value && operariosIds.some(otro => otro !== id && !campo(otro).disabled && campo(otro).value === opcion.value);});
            });
        }
        function compatible(ruta) {
            const v = vehiculo();
            if (!v) return false;
            return v.tipo === 'Camión recolector mixtos' ? ruta.tipoResiduo === 'Mixtos' : v.tipo === 'Camión recolector reciclables' ? ruta.tipoResiduo === 'Reciclables' : true;
        }
        function actualizarVehiculo() {
            const camioneta = vehiculo()?.tipo === 'Camioneta';
            campo('extrasCamionetaCuadrilla').classList.toggle('d-none', !camioneta);
            ['operarioCuadrilla1','operarioCuadrilla2'].forEach(id => {campo(id).disabled = !camioneta || consultando; if (!camioneta) campo(id).value = '';});
            campo('cupoCuadrilla').textContent = camioneta ? 'Camioneta: hasta dos operarios adicionales, además del responsable y el chofer.' : 'Este vehículo admite únicamente un chofer y un operario responsable.';
            const elegidas = [...campo('rutasFormularioCuadrilla').querySelectorAll('input:checked')].map(i => i.value);
            const lista = campo('rutasFormularioCuadrilla'); lista.replaceChildren();
            rutas.filter(compatible).forEach(r => {
                const grupo = document.createElement('div'); grupo.className = 'form-check';
                const input = document.createElement('input'); input.type = 'checkbox'; input.className = 'form-check-input'; input.id = 'rutaCuadrilla_' + r.idRuta; input.value = r.idRuta; input.checked = elegidas.includes(String(r.idRuta)); input.disabled = consultando;
                const label = document.createElement('label'); label.className = 'form-check-label text-break'; label.htmlFor = input.id; label.textContent = r.descripcion + ' · ' + r.tipoResiduo + ' · ' + r.horario;
                grupo.append(input, label); lista.append(grupo);
            });
            if (!lista.children.length) {const vacio = document.createElement('p'); vacio.className = 'small text-body-secondary'; vacio.textContent = vehiculo() ? 'No hay rutas compatibles disponibles.' : 'Seleccioná primero un vehículo.'; lista.append(vacio);}
            actualizarIntegrantes();
        }
        function abrir(cuadrilla = null, soloVer = false) {
            editando = cuadrilla?.idCuadrilla ?? null; consultando = soloVer; form.reset(); error('');
            campo('tituloCuadrilla').textContent = soloVer ? 'Ver cuadrilla #' + editando : cuadrilla ? 'Editar cuadrilla #' + editando : 'Crear cuadrilla';
            campo('guardarCuadrilla').classList.toggle('d-none', soloVer);
            campo('guardarCuadrilla').textContent = cuadrilla ? 'Guardar cambios (vista previa)' : 'Crear cuadrilla (vista previa)';
            const disponibles = vehiculos.filter(v => v.estado === 'Disponible' || (cuadrilla && String(v.idVehiculo) === String(cuadrilla.idVehiculo)));
            opciones(campo('vehiculoCuadrilla'), disponibles, 'idVehiculo', v => v.matricula + ' · ' + v.tipo + ' · ' + v.estado, true);
            opciones(campo('choferCuadrilla'), usuarios.filter(u => u.tipo === 'Chofer'), 'idUsu', u => nombre(u.idUsu), true);
            operariosIds.forEach(id => opciones(campo(id), usuarios.filter(u => u.tipo === 'Operario'), 'idUsu', u => nombre(u.idUsu), id === 'responsableCuadrilla'));
            [...form.querySelectorAll('select')].forEach(s => s.disabled = soloVer);
            if (cuadrilla) {
                campo('vehiculoCuadrilla').value = cuadrilla.idVehiculo;
                campo('choferCuadrilla').value = cuadrilla.idChofer;
                campo('responsableCuadrilla').value = cuadrilla.idResponsable;
                cuadrilla.operarios.slice(0, 2).forEach((id, i) => campo('operarioCuadrilla' + (i + 1)).value = id);
            }
            actualizarVehiculo();
            [...campo('rutasFormularioCuadrilla').querySelectorAll('input')].forEach(i => i.checked = !!cuadrilla?.rutas.some(id => String(id) === i.value));
            bootstrap.Modal.getOrCreateInstance(campo('modalCuadrilla')).show();
        }
        function dibujar() {
            const tabla = campo('tablaCuadrillas'); tabla.replaceChildren();
            const buscar = campo('buscarCuadrilla').value.trim().toLocaleLowerCase();
            cuadrillas.forEach(c => {
                const v = vehiculos.find(v => String(v.idVehiculo) === String(c.idVehiculo));
                const valores = [c.idCuadrilla, v ? v.matricula + ' · ' + v.tipo : 'Vehículo #' + c.idVehiculo, nombre(c.idChofer), nombre(c.idResponsable), c.operarios.map(nombre).join(', ') || 'Sin adicionales', c.rutas.map(id => rutas.find(r => String(r.idRuta) === String(id))?.descripcion || 'Ruta #' + id).join(', ') || 'Sin asignar'];
                if (buscar && !valores.join(' ').toLocaleLowerCase().includes(buscar)) return;
                const fila = document.createElement('tr');
                valores.forEach(valor => {const td = document.createElement('td'); td.className = 'text-break'; td.textContent = valor; fila.append(td);});
                const td = document.createElement('td'), grupo = document.createElement('div'); grupo.className = 'd-flex flex-wrap gap-1';
                [['Ver','primary',()=>abrir(c,true)],['Editar','secondary',()=>abrir(c)],['Eliminar','danger',()=>{if (!confirm('¿Eliminar la cuadrilla #' + c.idCuadrilla + ' de esta vista previa?')) return; cuadrillas = cuadrillas.filter(q => q.idCuadrilla !== c.idCuadrilla); guardar(); dibujar();}]].forEach(([texto,color,accion])=>{const boton = document.createElement('button');boton.type='button';boton.className='btn btn-outline-'+color+' btn-sm';boton.textContent=texto;boton.disabled=!usuarios.length||!vehiculos.length;boton.addEventListener('click',accion);grupo.append(boton);});
                td.append(grupo);fila.append(td);tabla.append(fila);
            });
            if (!tabla.children.length) {const td = tabla.insertRow().insertCell();td.colSpan=7;td.className='text-center text-body-secondary py-4';td.textContent=buscar?'No hay cuadrillas que coincidan con la búsqueda.':'No hay cuadrillas en esta vista previa.';}
        }
        campo('buscarCuadrilla').addEventListener('input',dibujar);
        campo('crearCuadrilla').addEventListener('click',()=>abrir());
        campo('vehiculoCuadrilla').addEventListener('change',actualizarVehiculo);
        operariosIds.forEach(id=>campo(id).addEventListener('change',actualizarIntegrantes));
        form.addEventListener('submit', e => {
            e.preventDefault(); error(''); if(consultando||!form.reportValidity())return;
            const v = vehiculo();
            if(!v||v.estado!=='Disponible')return error('Seleccioná un vehículo disponible.');
            const chofer = usuarios.find(u=>String(u.idUsu)===campo('choferCuadrilla').value);
            const responsable = usuarios.find(u=>String(u.idUsu)===campo('responsableCuadrilla').value);
            if(chofer?.tipo!=='Chofer'||responsable?.tipo!=='Operario')return error('Seleccioná un chofer y un operario responsable válidos.');
            const operarios = operariosIds.slice(1).map(id=>campo(id)).filter(s=>!s.disabled&&s.value).map(s=>Number(s.value));
            const miembros = [Number(responsable.idUsu),...operarios];
            if(new Set(miembros).size!==miembros.length)return error('Cada operario puede aparecer una sola vez en la cuadrilla.');
            if(operarios.length>(v.tipo==='Camioneta'?2:0)||operarios.some(id=>!usuarios.some(u=>Number(u.idUsu)===id&&u.tipo==='Operario')))return error('Revisá los operarios y el cupo del vehículo.');
            const idsRutas=[...campo('rutasFormularioCuadrilla').querySelectorAll('input:checked')].map(i=>Number(i.value));
            if(idsRutas.some(id=>!rutas.some(r=>Number(r.idRuta)===id&&compatible(r))))return error('Hay rutas incompatibles con el vehículo.');
            const c={idCuadrilla:editando??Math.max(0,...cuadrillas.map(c=>c.idCuadrilla))+1,idVehiculo:Number(v.idVehiculo),idChofer:Number(chofer.idUsu),idResponsable:Number(responsable.idUsu),operarios,rutas:idsRutas};
            if(editando!==null)cuadrillas=cuadrillas.map(q=>q.idCuadrilla===editando?c:q);else cuadrillas.push(c);
            guardar();dibujar();bootstrap.Modal.getInstance(campo('modalCuadrilla')).hide();
        });
        dibujar();
        async function catalogo(endpoint) {
            const respuesta=await fetch('http://localhost:8000/api/'+endpoint,{headers:{Accept:'application/json',Authorization:'Bearer '+getToken()}});
            if(!respuesta.ok)throw Error('No se pudo consultar '+endpoint);
            const resultado=await respuesta.json();if(!Array.isArray(resultado.data))throw Error('Respuesta inválida de '+endpoint);return resultado.data;
        }
        const resultados=await Promise.allSettled([catalogo('usuarios'),catalogo('camiones'),catalogo('rutas')]);
        usuarios=resultados[0].status==='fulfilled'?resultados[0].value:[];
        vehiculos=resultados[1].status==='fulfilled'?resultados[1].value:[];
        rutas=resultados[2].status==='fulfilled'?resultados[2].value:[];
        const faltan=resultados.flatMap((r,i)=>r.status==='rejected'?[['usuarios','vehículos','rutas'][i]]:[]);
        const disponibles=vehiculos.filter(v=>v.estado==='Disponible');
        const listo=disponibles.length&&usuarios.some(u=>u.tipo==='Chofer')&&usuarios.some(u=>u.tipo==='Operario');
        campo('crearCuadrilla').disabled=!listo;
        const estado=campo('estadoCatalogosCuadrilla');estado.className='alert text-start '+(faltan.length||!listo?'alert-warning':'alert-success');
        estado.textContent=faltan.length?'No se pudieron cargar: '+faltan.join(', ')+'.':!listo?'Para crear una cuadrilla se necesita un vehículo disponible, un chofer y un operario.':'Catálogos disponibles. Podés crear y editar cuadrillas en esta vista previa.';
        dibujar();
    })();
}
